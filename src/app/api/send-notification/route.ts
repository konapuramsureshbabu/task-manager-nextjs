/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { messaging } from '../../lib/firebase-admin';
import connectMongoDB, { Subscription } from '@/app/lib/mongodb';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!messaging) {
      throw new Error('Firebase messaging not initialized');
    }

    const { title, body, userId }: { title: string; body: string; userId?: string } = await request.json();
    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    await connectMongoDB();

    // SIMPLIFIED query - use exact match first
    const query = userId ? { userId } : {};
    
    console.log('Querying subscriptions with:', JSON.stringify(query));
    
    const subscriptions = await Subscription.find(query).lean();
    console.log('Found subscriptions:', JSON.stringify(subscriptions, null, 2));

    if (!subscriptions.length) {
      // Additional debug: check if any subscriptions exist at all
      const allSubs = await Subscription.find({}).limit(5).lean();
      console.log('First 5 subscriptions in DB:', JSON.stringify(allSubs, null, 2));
      
      return NextResponse.json(
        { 
          error: userId 
            ? `No subscriptions found for user ${userId}` 
            : 'No subscriptions found',
          queryUsed: query,
          searchedCollection: 'subscriptions',
          sampleSubscriptions: allSubs
        }, 
        { status: 404 }
      );
    }

    const tokens = subscriptions
      .map(sub => sub.token)
      .filter(token => token && typeof token === 'string');

    if (!tokens.length) {
      return NextResponse.json(
        { 
          error: userId 
            ? `No valid tokens found for user ${userId}` 
            : 'No valid tokens found',
          subscriptionsFound: subscriptions.length
        }, 
        { status: 404 }
      );
    }

    const messages = tokens.map(token => ({
      notification: { title, body },
      token
    }));

    const batchResponse = await messaging.sendEach(messages);
    
    return NextResponse.json(
      {
        message: userId 
          ? `Notification sent to user ${userId}` 
          : 'Notification broadcasted to all users',
        successCount: batchResponse.successCount,
        failureCount: batchResponse.failureCount,
        tokensAttempted: tokens.length,
        userId: userId || undefined,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
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