import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendBulkNotifications, NotificationPayload } from '@/lib/push-notifications';

/**
 * POST /api/push/notify
 * Send push notifications to all active subscribers
 */
export async function POST(request: NextRequest) {
  try {
    const { title, message, reviewUrl } = await request.json();
    
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Get all active subscriptions from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptions = await (db as any).pushSubscription.findMany({
      where: { active: true },
      select: {
        endpoint: true,
        p256dh: true,
        auth: true
      }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions',
        sent: 0
      });
    }

    // Prepare notification payload
    const payload: NotificationPayload = {
      title,
      message,
      reviewUrl
    };

    // Send to all subscriptions
    await sendBulkNotifications(
      subscriptions.map((sub: { endpoint: string; p256dh: string; auth: string }) => ({
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      })),
      payload
    );

    return NextResponse.json({
      success: true,
      sent: subscriptions.length,
      message: `Notifications sent to ${subscriptions.length} subscribers`
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}




