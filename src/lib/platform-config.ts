export interface PlatformConfig {
  name: string;
  displayName: string;
  maxLength: number;
  hashtagStrategy: string;
  contentStyle: string;
  bestPractices: string[];
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  x: {
    name: 'x',
    displayName: 'X (Twitter)',
    maxLength: 280,
    hashtagStrategy: '1-3 hashtags max, integrated naturally',
    contentStyle: 'Concise, conversational, thread-friendly',
    bestPractices: [
      'Ask questions to encourage replies',
      'Use line breaks for readability',
      'Include relevant hashtags naturally',
      'Keep under 280 characters',
      'Use emojis sparingly but effectively'
    ]
  },
  
  instagram: {
    name: 'instagram',
    displayName: 'Instagram',
    maxLength: 2200,
    hashtagStrategy: '5-10 relevant hashtags, can be at the end',
    contentStyle: 'Visual-first, storytelling, inspirational',
    bestPractices: [
      'Write engaging captions that tell a story',
      'Use relevant hashtags (5-10 max)',
      'Include call-to-action',
      'Mention visual elements that could accompany',
      'Use line breaks for visual appeal'
    ]
  },
  
  threads: {
    name: 'threads',
    displayName: 'Threads',
    maxLength: 500,
    hashtagStrategy: '2-5 hashtags, casual approach',
    contentStyle: 'Conversational, community-focused, authentic',
    bestPractices: [
      'Focus on conversation and community',
      'Be more casual and authentic',
      'Use fewer hashtags than Instagram',
      'Encourage discussion and replies',
      'Share personal insights'
    ]
  },
  
  bluesky: {
    name: 'bluesky',
    displayName: 'Bluesky',
    maxLength: 300,
    hashtagStrategy: 'Minimal hashtags, focus on content',
    contentStyle: 'Twitter-like but more thoughtful, decentralized community feel',
    bestPractices: [
      'Similar to Twitter but allow for more nuance',
      'Less hashtag-heavy',
      'Focus on genuine conversation',
      'Community-minded approach',
      'Thoughtful, less promotional'
    ]
  },
  
  linkedin: {
    name: 'linkedin',
    displayName: 'LinkedIn',
    maxLength: 3000,
    hashtagStrategy: '3-5 professional hashtags',
    contentStyle: 'Professional, value-driven, thought leadership',
    bestPractices: [
      'Lead with value and insights',
      'Use professional tone',
      'Include industry-relevant hashtags',
      'Share lessons learned',
      'Encourage professional discussion'
    ]
  },
  
  tiktok: {
    name: 'tiktok',
    displayName: 'TikTok',
    maxLength: 150,
    hashtagStrategy: '3-5 trending hashtags',
    contentStyle: 'Fun, energetic, trend-aware, video-focused',
    bestPractices: [
      'Write for video content',
      'Be energetic and fun',
      'Use trending hashtags',
      'Include hooks and curiosity gaps',
      'Appeal to younger audience'
    ]
  }
};

/**
 * Get platform-specific guidelines for content generation
 */
export function getPlatformGuidelines(platform: string): string {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) return '';
  
  return `
PLATFORM: ${config.displayName}
- Max length: ${config.maxLength} characters
- Style: ${config.contentStyle}
- Hashtags: ${config.hashtagStrategy}
- Best practices: ${config.bestPractices.join(', ')}
`;
}

/**
 * Get all platform guidelines for multi-platform content
 */
export function getAllPlatformGuidelines(platforms: string[]): string {
  return platforms
    .map(platform => getPlatformGuidelines(platform))
    .join('\n');
}

/**
 * Distribute posts across platforms intelligently
 */
export function distributePlatforms(platforms: string[], totalPosts: number): Array<{ platform: string; count: number }> {
  const distribution = platforms.map(platform => ({
    platform,
    count: Math.floor(totalPosts / platforms.length)
  }));
  
  // Distribute remaining posts
  const remaining = totalPosts % platforms.length;
  for (let i = 0; i < remaining; i++) {
    distribution[i].count++;
  }
  
  return distribution;
}
