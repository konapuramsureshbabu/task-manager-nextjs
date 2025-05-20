/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import connectMongoDB, { Subscription, Notification } from "@/app/lib/mongodb";

// In-memory store for SSE connections (use Redis or similar for production)
const sseConnections = new Map<
  string,
  { write: (data: string) => void; close: () => void }
>();

// Improved SSE sender with success/failure tracking
function sendSSE(userId: string, data: { title: string; body: string }): boolean {
  const connection = sseConnections.get(userId);
  if (connection && connection.write) {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      connection.write(message);
      return true;
    } catch (error) {
      console.error(`Error writing to SSE stream for user ${userId}:`, error);
      sseConnections.delete(userId); // Clean up on error
      return false;
    }
  }
  return false;
}

// SSE connection endpoint (clients connect here)
export async function GET(request: NextRequest): Promise<NextResponse> {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "userId is required for SSE connection" },
      { status: 400 }
    );
  }

  // Set up SSE headers
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  // Create a custom response with a writable stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Store the connection with close handler
  const connection = {
    write: (data: string) => writer.write(encoder.encode(data)),
    close: () => writer.close(),
  };
  sseConnections.set(userId, connection);

  // Send initial connection message
  const initMessage = `data: ${JSON.stringify({
    message: "SSE connection established",
  })}\n\n`;
  await writer.write(encoder.encode(initMessage));

  // Clean up when client disconnects
  request.signal.addEventListener("abort", () => {
    const connection = sseConnections.get(userId);
    if (connection) {
      connection.close();
      sseConnections.delete(userId);
    }
  });

  return new NextResponse(stream.readable, { headers });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const {
      title,
      body,
      userId,
    }: { title: string; body: string; userId?: string } = await request.json();
    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Save notification to MongoDB with userId
    const notification = await Notification.create({
      message: `${title}: ${body}`,
      userId, // Include userId if provided
    });

    // Determine which users to notify
    const query = userId ? { userId } : {};
    const subscriptions = (await Subscription.find(query).lean()).reverse();

    if (!subscriptions.length) {
      const allSubs = await Subscription.find({}).limit(5).lean();
      return NextResponse.json(
        {
          error: userId
            ? `No subscriptions found for user ${userId}`
            : "No subscriptions found",
          queryUsed: query,
          searchedCollection: "subscriptions",
          sampleSubscriptions: allSubs,
        },
        { status: 404 }
      );
    }

    // Send notifications and track results
    let successCount = 0;
    let failureCount = 0;
    const attemptedUsers: string[] = [];
    const sucessedUser: string[] = [];

    const targetUserIds = subscriptions
      .map((sub) => sub.userId)
      .filter((id): id is string => !!id);

    for (const userId of targetUserIds) {
      attemptedUsers.push(userId);
      if (sendSSE(userId, { title, body })) {
        failureCount++;
      } else {
        successCount++;
        sucessedUser.push(userId);
      }
    }

    return NextResponse.json(
      {
        message: userId
          ? `Notification processing complete for user ${userId}`
          : "Notification broadcast complete",
        successCount,
        failureCount,
        totalSubscriptions: subscriptions.length,
        attemptedUsers: attemptedUsers.length,
        sucessedUser,
        mongoNotificationId: notification._id,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error:", {
      message: error.message,
      stack: error.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    });
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}