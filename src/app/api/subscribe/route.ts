/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import connectMongoDB, { Subscription } from '@/app/lib/mongodb';

interface SubscribeRequestBody {
  token: string;
  userId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const { token, userId }: SubscribeRequestBody = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Connect to MongoDB
    await connectMongoDB();

    // Enhanced logging before saving
    console.log('Attempting to save subscription:', { token, userId });

    // Save or update subscription with more explicit handling
    const result = await Subscription.findOneAndUpdate(
      { token }, // Find by token only (one device can only have one active token)
      { 
        $set: {
          token,
          ...(userId && { userId }), // Only set userId if provided
          updatedAt: new Date() 
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    console.log('Subscription saved:', result);

    return NextResponse.json({ 
      message: 'Subscription saved',
      data: {
        token: result.token,
        userId: result.userId,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
    }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/subscribe error:', message, error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: message 
    }, { status: 500 });
  }
}