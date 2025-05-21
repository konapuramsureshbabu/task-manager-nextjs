//api/notification/stream

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import connectMongoDB, { Notification } from '@/app/lib/mongodb';


export async function GET(request: Request) {
  try {
    // Set SSE headers
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    // Get userId from query parameters (optional)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        await connectMongoDB();

        // Fetch existing notifications
        const query = userId ? { userId } : {};
        const existingNotifications = await Notification.find(query)
          .sort({ createdAt: -1 }) // Sort by newest first
          .limit(50) // Limit to prevent overwhelming the client
          .lean();

        // Send existing notifications as initial batch
        existingNotifications.forEach((notification) => {
        
          const { title, body } = notification
          
          const message = {
            id: notification._id.toString(),
            title,
            body,
            createdAt: notification.createdAt,
          };
          
          controller.enqueue(`event: notification\ndata: ${JSON.stringify(message)}\n\n`);
        });

        // Set up MongoDB Change Stream
        const pipeline = userId ? [{ $match: { 'fullDocument.userId': userId } }] : [];
        const changeStream = Notification.watch(pipeline);

        // Send a ping to keep the connection alive
        const sendPing = () => {
          controller.enqueue(`event: ping\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);
        };
        const pingInterval = setInterval(sendPing, 15000);
// Handle new notifications
        changeStream.on('change', (change) => {
          if (change.operationType === 'insert') {
            const notification = change.fullDocument;
            
            const message = {
              id: notification._id.toString(),
              title: notification.title,
              body:notification.body,
              createdAt: notification.createdAt,
            };
            controller.enqueue(`event: notification\ndata: ${JSON.stringify(message)}\n\n`);
          }
        });
        
        // Handle stream errors
        changeStream.on('error', (error) => {
          console.error('Change Stream error:', error);
          controller.enqueue(`event: error\ndata: ${JSON.stringify({ error: 'Stream error' })}\n\n`);
          controller.close();
          clearInterval(pingInterval);
        });

        // Handle client disconnection
        request.signal.addEventListener('abort', () => {
          changeStream.close();
          clearInterval(pingInterval);
          controller.close();
        });
      },
    });

    return new NextResponse(stream, { headers });
  } catch (error: any) {
    console.error('SSE Error:', error.message, error.stack);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}