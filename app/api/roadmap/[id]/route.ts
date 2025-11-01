// GET /api/roadmap/[id] - Download roadmap as markdown file
import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/storage/scans';
import { generateRoadmap } from '@/lib/utils/roadmap';

/**
 * GET /api/roadmap/[id]
 * Download scan results as a markdown roadmap file
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    console.log(`[API] Generating roadmap for scan: ${id}`);

    // Get scan from storage
    const scan = await getScan(id);

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found', scanId: id },
        { status: 404 }
      );
    }

    // Check if scan is completed
    if (scan.status !== 'completed') {
      return NextResponse.json(
        {
          error: 'Scan not completed yet',
          status: scan.status,
          message:
            scan.status === 'scanning'
              ? 'Scan is still in progress. Please wait for completion.'
              : 'Scan failed. No roadmap available.',
        },
        { status: 400 }
      );
    }

    // Check if there are findings
    if (!scan.findings || scan.findings.length === 0) {
      return NextResponse.json(
        {
          error: 'No findings to generate roadmap',
          message: 'This scan did not find any issues.',
        },
        { status: 400 }
      );
    }

    // Generate roadmap markdown
    const markdown = generateRoadmap(scan.findings, scan.repoUrl);

    console.log(`[API] Roadmap generated: ${markdown.length} characters`);

    // Extract repository name for filename
    const repoName = scan.repoUrl.split('/').slice(-2).join('-').replace(/[^a-z0-9-]/gi, '-');
    const filename = `roadmap-${repoName}-${id.slice(0, 8)}.md`;

    // Return as downloadable file
    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(markdown, 'utf-8').toString(),
      },
    });

  } catch (error: any) {
    console.error('[API] Error generating roadmap:', error);
    return NextResponse.json(
      { error: 'Failed to generate roadmap', details: error.message },
      { status: 500 }
    );
  }
}

