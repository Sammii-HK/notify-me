import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, userId, metadata } = body;
    
    // Validate subscription
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription - missing endpoint or keys' },
        { status: 400 }
      );
    }
    
    // Store subscription in database (upsert by endpoint)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: userId || null,
        active: true,
        updatedAt: new Date()
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: userId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        active: true
      }
    });
    
    console.log('Push subscription saved:', endpoint);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || 'BLc4xRzdItlvkEzjdmWG8pOhHhWj8VqOh9i3ZwOZOPjKvLcYzF8FGWBYa8vOZhZQSBgG4vPKZOGzVJqVZMzJZKQ'
  });
}
