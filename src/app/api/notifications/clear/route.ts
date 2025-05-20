/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB, { Notification } from '@/app/lib/mongodb';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await connectMongoDB();

    const { userId }: { userId?: string } = await request.json();

    // Delete notifications for the user (or all if no userId)
    const query = userId ? { userId } : {};
    await Notification.deleteMany(query);

    return NextResponse.json(
      {
        message: userId
          ? `Notifications cleared for user ${userId}`
          : 'All notifications cleared',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error clearing notifications:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}