export interface SchedulerPost {
  title?: string;
  content: string;
  platforms: string[];
  scheduledDate: string;
  mediaUrls?: string[];
}

export interface SchedulerAdapter {
  id: string;
  sendBulk(posts: SchedulerPost[]): Promise<{ ok: boolean; externalId?: string; error?: string }>;
}

/**
 * Succulent Social adapter implementation
 */
export class SucculentSocialAdapter implements SchedulerAdapter {
  id = 'succulent-social';

  async sendBulk(posts: SchedulerPost[]): Promise<{ ok: boolean; externalId?: string; error?: string }> {
    try {
      const response = await fetch('https://app.succulent.social/api/posts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ posts })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          ok: false, 
          error: `HTTP ${response.status}: ${errorText}` 
        };
      }

      const result = await response.json();
      return { 
        ok: true, 
        externalId: result.id || result.batchId 
      };
    } catch (error) {
      return { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

/**
 * Get the appropriate scheduler adapter
 * In the future, this could be configurable per account
 */
export function getSchedulerAdapter(): SchedulerAdapter {
  return new SucculentSocialAdapter();
}
