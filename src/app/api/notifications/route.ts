/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectMongoDB, { Notification, Subscription } from '@/app/lib/mongodb';


// In-memory store for SSE connections (use Redis for production)
const sseConnections = new Map<
  string,
  { 
    write: (data: string) => void; 
    close: () => void;
    changeStream?: any;
    pingInterval?: NodeJS.Timeout;
  }
>();

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Send SSE to a specific user
function sendSSE(userId: string, data: { 
  id: string; 
  title: string; 
  body: string; 
  createdAt: Date 
}): boolean {
  const connection = sseConnections.get(userId);
  if (connection?.write) {
    try {
      const message = `event: notification\ndata: ${JSON.stringify(data)}\n\n`;
      connection.write(message);
      return true;
    } catch (error) {
      console.error(`Error writing to SSE stream for user ${userId}:`, error);
      cleanupConnection(userId);
      return false;
    }
  }
  return false;
}

// Clean up SSE connection resources
function cleanupConnection(userId: string): void {
  const connection = sseConnections.get(userId);
  if (connection) {
    if (connection.pingInterval) clearInterval(connection.pingInterval);
    if (connection.changeStream) {
      connection.changeStream.close().catch((err: any) => 
        console.error('Error closing change stream:', err)
      );
    }
    connection.close();
    sseConnections.delete(userId);
  }
}



export async function GET(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting
  try {
    // Get token from Authorization header
    const token = request.headers.get('authorization')?.split(' ')[1];
    let query: any = {};
    let userId: string | null = null;

    // Verify token and set query based on role
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
          userId: string; 
          email: string; 
          role: string 
        };
        
        if (!isValidEmail(decoded.email)) {
          return NextResponse.json(
            { error: 'Invalid email format in token' },
            { status: 400 }
          );
        }

        userId = decoded.email;
        if (decoded.role === 'admin') {
          query = {}; // Admins see all notifications
        } else {
          query = { userId: decoded.email }; // Non-admins see own notifications
        }
      } catch (error) {
        console.error('JWT verification error:', error);
        return NextResponse.json(
          { error: 'Unauthorized: Invalid token' },
          { status: 401 }
        );
      }
    } else {
      // Fallback: Use userId from query parameters
      userId = request.nextUrl.searchParams.get('userId');
      if (!userId || !isValidEmail(userId)) {
        return NextResponse.json(
          { error: 'Unauthorized: No valid token or userId provided' },
          { status: 401 }
        );
      }
      query = { userId };
    }

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Create a custom response with a writable stream
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Store the connection
    const connection = {
      write: (data: string) => writer.write(encoder.encode(data)),
      close: () => {
        writer.close().catch(err => 
          console.error('Error closing writer:', err)
        );
      }
    };
    sseConnections.set(userId, connection);

    // Send initial connection message
    const initMessage = `event: connection\ndata: ${JSON.stringify({ 
      message: 'SSE connection established',
      userId,
      timestamp: new Date().toISOString() 
    })}\n\n`;
    await writer.write(encoder.encode(initMessage));

    // Connect to MongoDB
    await connectMongoDB();

    // Fetch existing notifications
    const existingNotifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Send existing notifications
    for (const notification of existingNotifications) {
      const message = {
        id: notification._id.toString(),
        title: notification.title,
        body: notification.body,
        createdAt: notification.createdAt,
      };
      await writer.write(encoder.encode(
        `event: notification\ndata: ${JSON.stringify(message)}\n\n`
      ));
    }

    // Set up MongoDB Change Stream
    const pipeline = query.userId 
      ? [{ $match: { 'fullDocument.userId': query.userId } }] 
      : [];
      
    const changeStream = Notification.watch(pipeline);
    sseConnections.get(userId)!.changeStream = changeStream;

    // Send ping to keep connection alive
    const sendPing = () => {
      writer.write(encoder.encode(
        `event: ping\ndata: ${JSON.stringify({ 
          time: new Date().toISOString() 
        })}\n\n`
      )).catch(err => console.error('Error sending ping:', err));
    };
    const pingInterval = setInterval(sendPing, 15000);
    sseConnections.get(userId)!.pingInterval = pingInterval;

    // Handle new notifications
    changeStream.on('change', (change) => {
      if (change.operationType === 'insert') {
        const notification = change.fullDocument;
        const message = {
          id: notification._id.toString(),
          title: notification.title,
          body: notification.body,
          createdAt: notification.createdAt,
        };
        writer.write(encoder.encode(
          `event: notification\ndata: ${JSON.stringify(message)}\n\n`
        )).catch(err => console.error('Error sending change:', err));
      }
    });

    // Handle stream errors
    changeStream.on('error', (error) => {
      console.error('Change Stream error:', error);
      writer.write(encoder.encode(
        `event: error\ndata: ${JSON.stringify({ 
          error: 'Stream error',
          details: error.message 
        })}\n\n`
      )).catch(err => console.error('Error sending error:', err));
      cleanupConnection(userId);
    });

    // Handle client disconnection
    request.signal.addEventListener('abort', () => {
      cleanupConnection(userId);
    });

    return new NextResponse(stream.readable, { headers });
  } catch (error: any) {
    console.error('SSE Error:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting

  try {
    // Verify admin role
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      role: string;
      email: string;
    };
    
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { title, body, userId }: { 
      title: string; 
      body: string; 
      userId?: string 
    } = await request.json();
    
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    if (userId && !isValidEmail(userId)) {
      return NextResponse.json(
        { error: 'Invalid email format for userId' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Save notification to MongoDB
    const notification = await Notification.create({
      userId: userId || null, // Allow null for broadcast notifications
      title,
      body,
      createdAt: new Date(),
    });

    // Determine which users to notify
    const query = userId ? { userId } : {};
    const subscriptions = await Subscription.find(query).lean();

    if (!subscriptions.length) {
      const allSubs = await Subscription.find({}).limit(5).lean();
      return NextResponse.json(
        {
          error: userId 
            ? `No subscriptions found for user ${userId}` 
            : 'No subscriptions found',
          queryUsed: query,
          searchedCollection: 'subscriptions',
          sampleSubscriptions: allSubs,
        },
        { status: 404 }
      );
    }

    // Send notifications and track results
    let successCount = 0;
    let failureCount = 0;
    const attemptedUsers: string[] = [];
    const succeededUsers: string[] = [];

    const targetUserIds = subscriptions
      .map((sub) => sub.userId)
      .filter((id): id is string => !!id && isValidEmail(id));

    for (const userId of targetUserIds) {
      attemptedUsers.push(userId);
      if (sendSSE(userId, {
        id: notification._id.toString(),
        title,
        body,
        createdAt: notification.createdAt,
      })) {
        successCount++;
        succeededUsers.push(userId);
      } else {
        failureCount++;
      }
    }

    return NextResponse.json(
      {
        message: userId
          ? `Notification sent to user ${userId}`
          : 'Notification broadcast to all subscribers',
        notification: {
          id: notification._id,
          title,
          body,
          createdAt: notification.createdAt,
          target: userId || 'all',
        },
        deliveryStats: {
          successCount,
          failureCount,
          totalSubscriptions: subscriptions.length,
          attemptedUsers: attemptedUsers.length,
          succeededUsers,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('POST /api/notifications error:', {
      message: error.message,
      stack: error.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}