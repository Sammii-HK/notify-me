/**
 * Send a notification to Discord webhook
 */
export async function notifyDiscord(message: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK;
  if (!webhookUrl) {
    console.log('Discord webhook not configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: message })
    });

    if (!response.ok) {
      console.error('Failed to send Discord notification:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error sending Discord notification:', error);
  }
}

/**
 * Send a notification to Pushover
 */
export async function notifyPushover(title: string, message: string): Promise<void> {
  const token = process.env.PUSHOVER_TOKEN;
  const user = process.env.PUSHOVER_USER;
  
  if (!token || !user) {
    console.log('Pushover credentials not configured, skipping notification');
    return;
  }

  try {
    const formData = new URLSearchParams({
      token,
      user,
      title,
      message
    });

    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      console.error('Failed to send Pushover notification:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error sending Pushover notification:', error);
  }
}

/**
 * Send notifications to both Discord and Pushover
 */
export async function notifyBoth(title: string, message: string): Promise<void> {
  await Promise.all([
    notifyDiscord(`**${title}**\n${message}`),
    notifyPushover(title, message)
  ]);
}
