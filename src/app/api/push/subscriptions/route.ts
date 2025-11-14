import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * GET /api/push/subscriptions
 * Get all push subscriptions (admin endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptions = await (db as any).pushSubscription.findMany({
      select: {
        id: true,
        userId: true,
        endpoint: true,
        active: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      subscriptions,
      count: subscriptions.length
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscriptions
 * Unsubscribe (delete subscription by endpoint)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).pushSubscription.delete({
      where: { endpoint }
    });

    return NextResponse.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}




