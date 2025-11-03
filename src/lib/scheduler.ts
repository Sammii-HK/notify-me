export interface SchedulerPost {
  title?: string;
  content: string;
  platforms: string[];
  scheduledDate: string;
  mediaUrls?: string[];
}

export interface SchedulerAdapter {
  id: string;
  name: string;
  sendBulk(posts: SchedulerPost[]): Promise<{ ok: boolean; externalId?: string; error?: string }>;
  exportFormat?(posts: SchedulerPost[]): Promise<{ format: string; data: string; filename: string }>;
}

/**
 * Succulent Social adapter implementation
 */
export class SucculentSocialAdapter implements SchedulerAdapter {
  id = 'succulent-social';
  name = 'Succulent Social';

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
 * Buffer.com CSV export adapter
 */
export class BufferExportAdapter implements SchedulerAdapter {
  id = 'buffer-export';
  name = 'Buffer (CSV Export)';

  async sendBulk(posts: SchedulerPost[]): Promise<{ ok: boolean; externalId?: string; error?: string }> {
    // This adapter doesn't send, it exports for manual import
    return { ok: false, error: 'Use exportFormat() instead for Buffer CSV export' };
  }

  async exportFormat(posts: SchedulerPost[]): Promise<{ format: string; data: string; filename: string }> {
    const csvHeaders = 'Content,Profile,Date,Time,Timezone,Image,Link';
    const csvRows = posts.map(post => {
      const date = new Date(post.scheduledDate);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toISOString().split('T')[1].substring(0, 5);
      
      return `"${post.content.replace(/"/g, '""')}","${post.platforms.join(',')}","${dateStr}","${timeStr}","UTC","",""`
    });
    
    const csvData = [csvHeaders, ...csvRows].join('\n');
    const filename = `buffer-posts-${new Date().toISOString().split('T')[0]}.csv`;
    
    return {
      format: 'csv',
      data: csvData,
      filename
    };
  }
}

/**
 * Later.com CSV export adapter
 */
export class LaterExportAdapter implements SchedulerAdapter {
  id = 'later-export';
  name = 'Later (CSV Export)';

  async sendBulk(posts: SchedulerPost[]): Promise<{ ok: boolean; externalId?: string; error?: string }> {
    return { ok: false, error: 'Use exportFormat() instead for Later CSV export' };
  }

  async exportFormat(posts: SchedulerPost[]): Promise<{ format: string; data: string; filename: string }> {
    const csvHeaders = 'Date,Time,Text,Media,Link,Instagram Account,Twitter Account,Facebook Account,LinkedIn Account,TikTok Account,Pinterest Account';
    const csvRows = posts.map(post => {
      const date = new Date(post.scheduledDate);
      const dateStr = date.toLocaleDateString('en-US');
      const timeStr = date.toLocaleTimeString('en-US', { hour12: false });
      
      // Map platforms to Later's column format
      const accounts = {
        instagram: post.platforms.includes('instagram') ? 'TRUE' : '',
        twitter: post.platforms.includes('x') ? 'TRUE' : '',
        facebook: post.platforms.includes('facebook') ? 'TRUE' : '',
        linkedin: post.platforms.includes('linkedin') ? 'TRUE' : '',
        tiktok: post.platforms.includes('tiktok') ? 'TRUE' : '',
        pinterest: post.platforms.includes('pinterest') ? 'TRUE' : ''
      };
      
      return `"${dateStr}","${timeStr}","${post.content.replace(/"/g, '""')}","","","${accounts.instagram}","${accounts.twitter}","${accounts.facebook}","${accounts.linkedin}","${accounts.tiktok}","${accounts.pinterest}"`
    });
    
    const csvData = [csvHeaders, ...csvRows].join('\n');
    const filename = `later-posts-${new Date().toISOString().split('T')[0]}.csv`;
    
    return {
      format: 'csv',
      data: csvData,
      filename
    };
  }
}

/**
 * Hootsuite CSV export adapter
 */
export class HootsuiteExportAdapter implements SchedulerAdapter {
  id = 'hootsuite-export';
  name = 'Hootsuite (CSV Export)';

  async sendBulk(posts: SchedulerPost[]): Promise<{ ok: boolean; externalId?: string; error?: string }> {
    return { ok: false, error: 'Use exportFormat() instead for Hootsuite CSV export' };
  }

  async exportFormat(posts: SchedulerPost[]): Promise<{ format: string; data: string; filename: string }> {
    const csvHeaders = 'Date,Time,Message,Link,Social Networks';
    const csvRows = posts.map(post => {
      const date = new Date(post.scheduledDate);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toISOString().split('T')[1].substring(0, 5);
      
      // Map platform names to Hootsuite format
      const platformMap: Record<string, string> = {
        'x': 'Twitter',
        'instagram': 'Instagram',
        'linkedin': 'LinkedIn',
        'facebook': 'Facebook',
        'threads': 'Threads',
        'bluesky': 'Bluesky'
      };
      
      const networks = post.platforms.map(p => platformMap[p] || p).join(';');
      
      return `"${dateStr}","${timeStr}","${post.content.replace(/"/g, '""')}","","${networks}"`
    });
    
    const csvData = [csvHeaders, ...csvRows].join('\n');
    const filename = `hootsuite-posts-${new Date().toISOString().split('T')[0]}.csv`;
    
    return {
      format: 'csv',
      data: csvData,
      filename
    };
  }
}

/**
 * Generic JSON export for custom integrations
 */
export class JsonExportAdapter implements SchedulerAdapter {
  id = 'json-export';
  name = 'JSON Export (Universal)';

  async sendBulk(posts: SchedulerPost[]): Promise<{ ok: boolean; externalId?: string; error?: string }> {
    return { ok: false, error: 'Use exportFormat() instead for JSON export' };
  }

  async exportFormat(posts: SchedulerPost[]): Promise<{ format: string; data: string; filename: string }> {
    const jsonData = JSON.stringify({
      generated: new Date().toISOString(),
      totalPosts: posts.length,
      posts: posts.map(post => ({
        ...post,
        scheduledDate: new Date(post.scheduledDate).toISOString(),
        platforms: post.platforms,
        characterCount: post.content.length
      }))
    }, null, 2);
    
    const filename = `social-posts-${new Date().toISOString().split('T')[0]}.json`;
    
    return {
      format: 'json',
      data: jsonData,
      filename
    };
  }
}

/**
 * Get all available scheduler adapters
 */
export function getAllSchedulerAdapters(): SchedulerAdapter[] {
  return [
    new SucculentSocialAdapter(),
    new BufferExportAdapter(),
    new LaterExportAdapter(),
    new HootsuiteExportAdapter(),
    new JsonExportAdapter()
  ];
}

/**
 * Get scheduler adapter by ID with fallback
 */
export function getSchedulerAdapter(adapterId?: string): SchedulerAdapter {
  const adapters = getAllSchedulerAdapters();
  
  if (adapterId) {
    const adapter = adapters.find(a => a.id === adapterId);
    if (adapter) return adapter;
  }
  
  // Default to Succulent Social
  return new SucculentSocialAdapter();
}

/**
 * Try multiple schedulers with fallback
 */
export async function sendWithFallback(
  posts: SchedulerPost[],
  preferredAdapterId?: string
): Promise<{ success: boolean; usedAdapter: string; result: any; error?: string }> {
  const adapters = getAllSchedulerAdapters();
  
  // Try preferred adapter first
  if (preferredAdapterId) {
    const preferred = adapters.find(a => a.id === preferredAdapterId);
    if (preferred) {
      try {
        const result = await preferred.sendBulk(posts);
        if (result.ok) {
          return { success: true, usedAdapter: preferred.name, result };
        }
        console.warn(`Preferred adapter ${preferred.name} failed:`, result.error);
      } catch (error) {
        console.warn(`Preferred adapter ${preferred.name} error:`, error);
      }
    }
  }
  
  // Try Succulent Social as primary
  try {
    const succulent = new SucculentSocialAdapter();
    const result = await succulent.sendBulk(posts);
    if (result.ok) {
      return { success: true, usedAdapter: succulent.name, result };
    }
    console.warn('Succulent Social failed:', result.error);
  } catch (error) {
    console.warn('Succulent Social error:', error);
  }
  
  // Fallback: Generate export files for manual import
  console.log('All API schedulers failed, generating export files...');
  const exports = [];
  
  for (const adapter of adapters) {
    if (adapter.exportFormat) {
      try {
        const exportData = await adapter.exportFormat(posts);
        exports.push({
          adapter: adapter.name,
          ...exportData
        });
      } catch (error) {
        console.warn(`Export failed for ${adapter.name}:`, error);
      }
    }
  }
  
  return {
    success: false,
    usedAdapter: 'Export Fallback',
    result: { exports },
    error: 'All schedulers unavailable, export files generated for manual import'
  };
}
