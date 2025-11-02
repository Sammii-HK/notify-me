import { NextRequest, NextResponse } from 'next/server';

// In a real app, you'd store subscriptions in your database
// For now, we'll use a simple in-memory store (this will reset on deployment)
const subscriptions: unknown[] = [];

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    
    // Validate subscription
    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      );
    }
    
    // Store subscription (in real app, save to database)
    subscriptions.push(subscription);
    
    console.log('New push subscription:', subscription.endpoint);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || 'BLc4xRzdItlvkEzjdmWG8pOhHhWj8VqOh9i3ZwOZOPjKvLcYzF8FGWBYa8vOZhZQSBgG4vPKZOGzVJqVZMzJZKQ'
  });
}
