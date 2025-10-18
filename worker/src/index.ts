export interface Env {
  VERCEL_WEEKLY_URL: string;
  VERCEL_AUTOSEND_URL: string;
  CRON_TOKEN: string;
  ACCOUNT_IDS: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron trigger: ${event.cron}`);

    if (event.cron === "0 18 * * 0") {
      // Sunday 18:00 UTC - Generate weekly posts
      console.log('Running weekly post generation');
      
      const accountIds = String(env.ACCOUNT_IDS || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);

      if (accountIds.length === 0) {
        console.log('No account IDs configured, generating for all active accounts');
        const url = env.VERCEL_WEEKLY_URL;
        ctx.waitUntil(
          fetch(url, {
            method: 'POST',
            headers: {
              'x-cron-token': env.CRON_TOKEN,
              'Content-Type': 'application/json'
            }
          }).then(response => {
            console.log(`Weekly generation response: ${response.status}`);
            return response.text();
          }).then(text => {
            console.log('Weekly generation result:', text);
          }).catch(error => {
            console.error('Weekly generation error:', error);
          })
        );
      } else {
        // Generate for specific account IDs
        for (const accountId of accountIds) {
          const url = `${env.VERCEL_WEEKLY_URL}?accountId=${encodeURIComponent(accountId)}`;
          ctx.waitUntil(
            fetch(url, {
              method: 'POST',
              headers: {
                'x-cron-token': env.CRON_TOKEN,
                'Content-Type': 'application/json'
              }
            }).then(response => {
              console.log(`Weekly generation for ${accountId} response: ${response.status}`);
              return response.text();
            }).then(text => {
              console.log(`Weekly generation for ${accountId} result:`, text);
            }).catch(error => {
              console.error(`Weekly generation for ${accountId} error:`, error);
            })
          );
        }
      }
    } else if (event.cron === "30 7 * * 1") {
      // Monday 07:30 UTC - Auto-send pending posts
      console.log('Running auto-send for pending posts');
      
      ctx.waitUntil(
        fetch(env.VERCEL_AUTOSEND_URL, {
          method: 'POST',
          headers: {
            'x-cron-token': env.CRON_TOKEN,
            'Content-Type': 'application/json'
          }
        }).then(response => {
          console.log(`Auto-send response: ${response.status}`);
          return response.text();
        }).then(text => {
          console.log('Auto-send result:', text);
        }).catch(error => {
          console.error('Auto-send error:', error);
        })
      );
    } else {
      console.log(`Unknown cron pattern: ${event.cron}`);
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Health check endpoint
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        crons: ['0 18 * * 0', '30 7 * * 1']
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    return new Response('Method not allowed', { status: 405 });
  },
} satisfies ExportedHandler<Env>;
