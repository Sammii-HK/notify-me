import webpush from 'web-push';

// VAPID keys for push notifications
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BLc4xRzdItlvkEzjdmWG8pOhHhWj8VqOh9i3ZwOZOPjKvLcYzF8FGWBYa8vOZhZQSBgG4vPKZOGzVJqVZMzJZKQ';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:your-email@example.com';

// Configure web-push
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  message: string;
  reviewUrl?: string;
  accountLabel?: string;
}

/**
 * Send push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send notifications to multiple subscriptions
 */
export async function sendBulkNotifications(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
): Promise<void> {
  const promises = subscriptions.map(subscription =>
    sendPushNotification(subscription, payload).catch(error => {
      console.error('Failed to send to subscription:', error);
      return null;
    })
  );
  
  await Promise.all(promises);
}

/**
 * Generate VAPID keys (run once to generate keys)
 */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}
