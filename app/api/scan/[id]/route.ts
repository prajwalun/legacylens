// GET /api/scan/[id] - Get scan results
import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/storage/scans';

/**
 * GET /api/scan/[id]
 * Retrieve scan status and results
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    console.log(`[API] Fetching scan: ${id}`);

    // Get scan from storage
    const scan = await getScan(id);

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found', scanId: id },
        { status: 404 }
      );
    }

    // Return scan data
    return NextResponse.json(scan);

  } catch (error: any) {
    console.error('[API] Error fetching scan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan', details: error.message },
      { status: 500 }
    );
  }
}

