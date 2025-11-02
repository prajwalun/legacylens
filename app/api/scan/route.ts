// POST /api/scan - Start a new scan
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveScan, updateScan, getScan } from '@/lib/storage/scans';
import { runAgent } from '@/lib/agent/graph';
import type { ScanResult } from '@/types';

/**
 * POST /api/scan
 * Start a new repository scan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl, depth = 'standard' } = body;

    // Validate input
    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Validate GitHub URL format
    const urlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+(\/.*)?$/;
    if (!urlPattern.test(repoUrl.trim())) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL. Expected format: https://github.com/owner/repo' },
        { status: 400 }
      );
    }

    // Generate unique scan ID
    const scanId = uuidv4();
    
    console.log(`[API] Creating new scan: ${scanId} for ${repoUrl}`);

    // Create initial scan record
    const initialScan: ScanResult = {
      id: scanId,
      repoUrl,
      status: 'scanning',
      findings: [],
      stats: {
        totalFiles: 0,
        totalLines: 0,
        languages: [],
        frameworks: [],
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        totalMinutes: 0,
      },
      logs: [
        {
          timestamp: Date.now(),
          phase: 'plan',
          message: 'Scan queued, starting soon...',
        },
      ],
      createdAt: Date.now(),
    };

    // Save initial scan (with lock protection)
    await saveScan(initialScan);
    
    // Wait for file system to fully commit the write
    // This ensures the scan is available before the agent starts logging
    await new Promise(resolve => setTimeout(resolve, 500));

    // Start agent in background (don't await)
    runAgentInBackground(scanId, repoUrl);

    // Return immediately
    return NextResponse.json({
      scanId,
      status: 'scanning',
      message: 'Scan started successfully',
      statusUrl: `/api/scan/${scanId}`,
      streamUrl: `/api/scan/${scanId}/stream`,
    }, { status: 202 }); // 202 Accepted

  } catch (error: any) {
    console.error('[API] Error starting scan:', error);
    return NextResponse.json(
      { error: 'Failed to start scan', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Run the agent workflow in background
 * Logs are streamed in real-time by individual nodes
 */
async function runAgentInBackground(scanId: string, repoUrl: string) {
  try {
    console.log(`[API] Starting background agent for scan: ${scanId}`);
    
    // Run the agent (nodes handle real-time log streaming internally)
    const result = await runAgent(scanId, repoUrl);

    console.log(`[API] Agent completed for scan: ${scanId}`);
    console.log(`[API] Total logs collected: ${result.logs?.length || 0}`);
    
    // Log phases for debugging
    if (result.logs && result.logs.length > 0) {
      const phases = [...new Set(result.logs.map(l => l.phase))];
      console.log(`[API] Log phases: ${phases.join(', ')}`);
    }

    // Check for errors
    if (result.error) {
      console.error(`[API] Scan failed: ${scanId}`, result.error);
      
      await updateScan(scanId, {
        status: 'failed',
        logs: result.logs || [],
      });
      
      return;
    }

    // Calculate statistics
    const stats = {
      totalFiles: result.repoMetadata?.totalFiles || 0,
      totalLines: result.repoMetadata?.totalLines || 0,
      languages: result.repoMetadata?.languages || [],
      frameworks: result.repoMetadata?.frameworks || [],
      criticalCount: result.enrichedFindings?.filter(f => f.severity === 'critical').length || 0,
      highCount: result.enrichedFindings?.filter(f => f.severity === 'high').length || 0,
      mediumCount: result.enrichedFindings?.filter(f => f.severity === 'medium').length || 0,
      lowCount: result.enrichedFindings?.filter(f => f.severity === 'low').length || 0,
      totalMinutes: result.enrichedFindings?.reduce((sum, f) => sum + f.minutesSaved, 0) || 0,
    };

    // IMPORTANT: Save ALL logs from all phases
    const allLogs = result.logs || [];
    
    // Update with successful results
    await updateScan(scanId, {
      status: 'completed',
      findings: result.enrichedFindings || [],
      stats,
      logs: allLogs,
    });

    console.log(`[API] Scan completed successfully: ${scanId}`);
    console.log(`[API] Found ${result.enrichedFindings?.length || 0} issues`);
    console.log(`[API] Saved ${allLogs.length} log entries`);

  } catch (error) {
    console.error(`[API] Fatal error in background scan: ${scanId}`, error);
    
    try {
      await updateScan(scanId, {
        status: 'failed',
        logs: [
          {
            timestamp: Date.now(),
            phase: 'write',
            message: `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      });
    } catch (updateError) {
      console.error(`[API] Failed to update scan status:`, updateError);
    }
  }
}

