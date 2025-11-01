// GET /api/scan/[id]/stream - Server-Sent Events for real-time logs
import { NextRequest } from 'next/server';
import { getScan } from '@/lib/storage/scans';

/**
 * GET /api/scan/[id]/stream
 * Stream scan progress via Server-Sent Events
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  console.log(`[SSE] Client connected for scan: ${id}`);

  // Set up SSE stream
  const encoder = new TextEncoder();
  let lastLogCount = 0;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected', scanId: id })}\n\n`)
        );

        // Poll for updates every 500ms
        const pollInterval = setInterval(async () => {
          try {
            const scan = await getScan(id);

            if (!scan) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'error', message: 'Scan not found' })}\n\n`
                )
              );
              clearInterval(pollInterval);
              controller.close();
              return;
            }

            // Send new logs (only ones we haven't sent yet)
            if (scan.logs && scan.logs.length > lastLogCount) {
              const newLogs = scan.logs.slice(lastLogCount);
              
              for (const log of newLogs) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'log', log })}\n\n`
                  )
                );
              }
              
              lastLogCount = scan.logs.length;
            }

            // Send progress update
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'progress',
                  status: scan.status,
                  findingsCount: scan.findings?.length || 0,
                })}\n\n`
              )
            );

            // If scan is complete or failed, send final message and close
            if (scan.status === 'completed' || scan.status === 'failed') {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'complete',
                    status: scan.status,
                    findingsCount: scan.findings?.length || 0,
                    stats: scan.stats,
                  })}\n\n`
                )
              );
              
              console.log(`[SSE] Scan ${scan.status}, closing stream: ${id}`);
              clearInterval(pollInterval);
              controller.close();
            }

          } catch (error) {
            console.error('[SSE] Error polling scan:', error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', message: 'Internal error' })}\n\n`
              )
            );
            clearInterval(pollInterval);
            controller.close();
          }
        }, 500);

        // Clean up on client disconnect
        request.signal.addEventListener('abort', () => {
          console.log(`[SSE] Client disconnected: ${id}`);
          clearInterval(pollInterval);
          controller.close();
        });

      } catch (error) {
        console.error('[SSE] Stream error:', error);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

