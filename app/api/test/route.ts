// GET /api/test - API health check and info
import { NextResponse } from 'next/server';

/**
 * GET /api/test
 * Health check endpoint to verify API is running
 */
export async function GET() {
  return NextResponse.json({
    name: 'LegacyLens API',
    version: '1.0.0',
    status: 'running',
    message: 'See your code\'s future. Fix it now.',
    timestamp: new Date().toISOString(),
    endpoints: {
      startScan: {
        method: 'POST',
        path: '/api/scan',
        description: 'Start a new repository scan',
        body: {
          repoUrl: 'https://github.com/owner/repo',
          depth: 'standard (optional)',
        },
      },
      getScan: {
        method: 'GET',
        path: '/api/scan/[id]',
        description: 'Get scan status and results',
      },
      streamLogs: {
        method: 'GET',
        path: '/api/scan/[id]/stream',
        description: 'Stream real-time scan logs (SSE)',
      },
      downloadRoadmap: {
        method: 'GET',
        path: '/api/roadmap/[id]',
        description: 'Download refactor roadmap as markdown',
      },
    },
    documentation: {
      github: 'https://github.com/prajwalun/legacylens',
      website: 'https://legacylens.dev',
    },
  });
}

