//api/subscriptions

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectMongoDB, { Subscription } from '@/app/lib/mongodb';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get JWT from Authorization header
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    // Verify JWT
    let decoded: { email: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string; role: string };
    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }

    // Parse request body
    let userId: string;
    try {
      const body = await request.json();
      userId = body.userId;
      if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
      }
    } catch (error) {
      console.error('Invalid JSON in request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate userId against JWT email
    if (userId !== decoded.email) {
      return NextResponse.json({ error: 'Unauthorized: userId does not match authenticated user' }, { status: 403 });
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Check for existing subscription
    const existingSubscription = await Subscription.findOne({ userId });
    if (existingSubscription) {
      return NextResponse.json({ message: 'User already subscribed', subscriptionId: existingSubscription._id }, { status: 200 });
    }

    // Create new subscription
    const subscription = await Subscription.create({ userId, createdAt: new Date() });
    return NextResponse.json({ message: 'Subscription created', subscriptionId: subscription._id }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/subscriptions error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.errors || error,
    });
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Subscription failed: Duplicate key error', details: error.message },
        { status: 409 }
      );
    }
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Subscription validation failed', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}