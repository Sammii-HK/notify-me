import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { nextMondayISODate } from './time';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';
import { getAllPlatformGuidelines } from './platform-config';

export const MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';

// Platform-specific post schema for better content targeting
const PostSchema = z.object({
  content: z.string(),
  platform: z.string(), // Single platform per post for better targeting
  platforms: z.array(z.string()).optional(), // Also accept platforms array for compatibility
  scheduledDate: z.string(),
  title: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  characterCount: z.number().optional()
});

const PostsResponseSchema = z.object({
  posts: z.array(PostSchema)
});

export type Post = z.infer<typeof PostSchema>;
export type PostsResponse = z.infer<typeof PostsResponseSchema>;

/**
 * Interpolate template variables in a prompt
 */
export function interpolatePrompt(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

/**
 * Token usage information from AI SDK
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Generate posts using AI SDK with structured output and validation
 * Returns both the posts and actual token usage for cost tracking
 */
export async function generatePosts(
  apiKey: string, 
  prompt: string
): Promise<{ posts: PostsResponse; usage: TokenUsage }> {
  try {
    const openaiProvider = createOpenAI({
      apiKey,
    });
    
    const result = await generateObject({
      model: openaiProvider(MODEL),
      schema: PostsResponseSchema,
      prompt: prompt,
      temperature: 0.7,
      maxRetries: 3, // Built-in retry mechanism
    });

    // Validate the result
    const validatedData = PostsResponseSchema.parse(result.object);
    
    // Capture actual token usage from AI SDK
    // AI SDK v5 uses different property names - handle both formats
    const usageData = result.usage as unknown as { promptTokens?: number; completionTokens?: number; totalTokens?: number };
    const usage: TokenUsage = {
      promptTokens: usageData?.promptTokens ?? 0,
      completionTokens: usageData?.completionTokens ?? 0,
      totalTokens: usageData?.totalTokens ?? 0,
    };
    
    return { posts: validatedData, usage };
  } catch (error) {
    console.error('AI generation error:', error);
    
    // Log the raw response for debugging
    if (error instanceof Error && 'cause' in error && error.cause && typeof error.cause === 'object' && 'response' in error.cause) {
      console.error('Raw AI response:', JSON.stringify((error.cause as { response: unknown }).response, null, 2));
    }
    
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:', error.issues);
      throw new Error(`Invalid response format: ${error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    
    if (error instanceof Error) {
      throw new Error(`AI generation failed: ${error.message}`);
    }
    
    throw new Error('Unknown error during AI generation');
  }
}

/**
 * Generate posts with streaming for better UX - returns an async iterator
 * Also yields token usage when complete
 */
export async function* generatePostsStream(apiKey: string, prompt: string) {
  const openaiProvider = createOpenAI({
    apiKey,
  });
  
  const result = streamObject({
    model: openaiProvider(MODEL),
    schema: PostsResponseSchema,
    prompt: prompt,
    temperature: 0.7,
    maxRetries: 3,
  });

  // Stream partial results
  for await (const partialObject of result.partialObjectStream) {
    yield {
      type: 'partial' as const,
      data: partialObject,
    };
  }

  // Return final validated result with usage
  try {
    const finalObject = await result.object;
    const validatedData = PostsResponseSchema.parse(finalObject);
    
    // Capture actual token usage
    // AI SDK v5 uses different property names - handle both formats
    const usageData = result.usage as unknown as { promptTokens?: number; completionTokens?: number; totalTokens?: number };
    const usage: TokenUsage = {
      promptTokens: usageData?.promptTokens ?? 0,
      completionTokens: usageData?.completionTokens ?? 0,
      totalTokens: usageData?.totalTokens ?? 0,
    };
    
    yield {
      type: 'complete' as const,
      data: validatedData,
      usage,
    };
  } catch (error) {
    yield {
      type: 'error' as const,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get recent content to avoid repeating for an account
 */
export async function getDoNotRepeat(db: PrismaClient, accountId: string): Promise<string> {
  const recent = await db.dedupe.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
    take: 200
  });
  
  const lines = recent
    .map(r => `• ${r.title ?? ''}`)
    .filter(Boolean)
    .join('\n');
  
  return lines || 'None';
}

/**
 * Build comprehensive brand context for AI generation
 */
export async function buildBrandContext(db: PrismaClient, accountId: string): Promise<string> {
  const account = await db.account.findUnique({
    where: { id: accountId }
  });

  if (!account) return '';

  let context = '';
  
  // Parse JSON fields safely
  const parseJsonField = (field: string | null): Record<string, unknown> | null => {
    if (!field) return null;
    try {
      return JSON.parse(field) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const brandVoice = parseJsonField((account as Record<string, unknown>).brandVoice as string | null);
  const targetAudience = parseJsonField((account as Record<string, unknown>).targetAudience as string | null);
  const brandValues = parseJsonField((account as Record<string, unknown>).brandValues as string | null);
  const contentGuidelines = parseJsonField((account as Record<string, unknown>).contentGuidelines as string | null);
  const examplePosts = parseJsonField((account as Record<string, unknown>).examplePosts as string | null);
  const platformSettings = parseJsonField((account as Record<string, unknown>).platformSettings as string | null);
  
  // Get platform-specific guidelines
  const platforms = JSON.parse(account.platforms);
  const platformGuidelines = getAllPlatformGuidelines(platforms);

  if (brandVoice) {
    context += `\nBRAND VOICE:\n`;
    context += `Tone: ${brandVoice.tone || 'Professional'}\n`;
    context += `Personality: ${brandVoice.personality || 'Friendly'}\n`;
    if (brandVoice.styleGuidelines) {
      context += `Style Guidelines: ${brandVoice.styleGuidelines}\n`;
    }
  }

  if (targetAudience) {
    context += `\nTARGET AUDIENCE:\n`;
    context += `Demographics: ${targetAudience.demographics || 'General audience'}\n`;
    context += `Interests: ${targetAudience.interests || 'Various'}\n`;
    if (targetAudience.painPoints) {
      context += `Pain Points: ${targetAudience.painPoints}\n`;
    }
  }

  if (brandValues) {
    context += `\nBRAND VALUES:\n`;
    if (brandValues.coreValues) context += `Core Values: ${brandValues.coreValues}\n`;
    if (brandValues.mission) context += `Mission: ${brandValues.mission}\n`;
    if (brandValues.usp) context += `Unique Selling Points: ${brandValues.usp}\n`;
  }

  if (contentGuidelines) {
    context += `\nCONTENT GUIDELINES:\n`;
    if (contentGuidelines.dos) context += `DO: ${contentGuidelines.dos}\n`;
    if (contentGuidelines.donts) context += `DON'T: ${contentGuidelines.donts}\n`;
    if (contentGuidelines.hashtags) context += `Hashtag Strategy: ${contentGuidelines.hashtags}\n`;
  }

  if (examplePosts && Array.isArray(examplePosts) && examplePosts.length > 0) {
    context += `\nHIGH-PERFORMING POST EXAMPLES:\n`;
    examplePosts.slice(0, 3).forEach((post, i) => {
      context += `${i + 1}. ${post}\n`;
    });
  }
  
  // Add platform-specific guidelines
  if (platformGuidelines) {
    context += `\nPLATFORM-SPECIFIC GUIDELINES:\n${platformGuidelines}`;
  }
  
  if (platformSettings) {
    context += `\nPLATFORM SETTINGS:\n${JSON.stringify(platformSettings, null, 2)}\n`;
  }

  return context.trim();
}

/**
 * Count tokens approximately (rough estimate: ~4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Smart context truncation that prioritizes important sections
 * Priority order: brand voice > content guidelines > target audience > brand values > examples > recent posts
 */
export function truncateContext(context: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(context);
  
  if (estimatedTokens <= maxTokens) {
    return context;
  }
  
  // Split context by section headers (e.g., "BRAND VOICE:", "TARGET AUDIENCE:")
  const sectionPattern = /\n([A-Z][A-Z\s]+):\n/g;
  const sections: Array<{ header: string; content: string; priority: number }> = [];
  let match;
  const matches: Array<{ index: number; header: string }> = [];
  
  // Find all section headers
  while ((match = sectionPattern.exec(context)) !== null) {
    matches.push({ index: match.index, header: match[1] });
  }
  
  // Extract sections
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : context.length;
    const sectionContent = context.substring(start, end).trim();
    const header = matches[i].header;
    
    sections.push({
      header,
      content: sectionContent,
      priority: getSectionPriority(header),
    });
  }
  
  // If no sections found, fall back to simple truncation
  if (sections.length === 0) {
    const maxChars = maxTokens * 4 * 0.8;
    return context.substring(0, maxChars) + '\n\n[Context truncated to fit token limit]';
  }
  
  // Sort by priority (lower number = higher priority)
  sections.sort((a, b) => a.priority - b.priority);
  
  // Build truncated context, keeping high-priority sections
  let truncated = '';
  let currentTokens = 0;
  const maxTokenBudget = Math.floor(maxTokens * 0.8); // 80% of max to leave buffer
  
  for (const section of sections) {
    const sectionTokens = estimateTokens(section.content);
    if (currentTokens + sectionTokens <= maxTokenBudget) {
      truncated += section.content + '\n\n';
      currentTokens += sectionTokens;
    } else {
      // Truncate this section if we're running out of space
      const remainingTokens = maxTokenBudget - currentTokens;
      if (remainingTokens > 50) {
        const remainingChars = remainingTokens * 4;
        truncated += section.content.substring(0, remainingChars) + '\n\n[Section truncated]';
      }
      break;
    }
  }
  
  return truncated.trim() || context.substring(0, maxTokens * 4 * 0.8) + '\n\n[Context truncated to fit token limit]';
}

/**
 * Get priority for context sections (lower = higher priority)
 */
function getSectionPriority(header: string): number {
  const name = header.toLowerCase();
  if (name.includes('brand voice') || name.includes('voice')) return 1;
  if (name.includes('content guidelines') || name.includes('guidelines')) return 2;
  if (name.includes('target audience') || name.includes('audience')) return 3;
  if (name.includes('brand values') || name.includes('values')) return 4;
  if (name.includes('example') || name.includes('high-performing')) return 5;
  if (name.includes('platform')) return 6;
  if (name.includes('recent') || name.includes('avoid repeating')) return 7;
  return 8; // Default priority
}

/**
 * Create a hash of content for deduplication
 */
export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Save a generated post set to the database
 */
export async function savePostSet(
  db: PrismaClient, 
  account: { id: string }, 
  weekStartISO: string, 
  prompt: string, 
  response: PostsResponse
) {
  const postSet = await db.postSet.create({
    data: {
      accountId: account.id,
      weekStart: new Date(weekStartISO),
      status: 'pending',
      rawPrompt: prompt,
      rawResponse: response
    }
  });

  const posts = response.posts;
  await Promise.all(posts.map(async (post) => {
    await db.post.create({
      data: {
        postSetId: postSet.id,
        title: post.title ?? null,
        content: post.content,
        platforms: JSON.stringify(post.platforms || [post.platform]),
        scheduledAt: new Date(post.scheduledDate),
        mediaUrls: JSON.stringify(post.mediaUrls ?? []),
        contentHash: hashContent(post.content)
      }
    });
  }));

  return postSet;
}

/**
 * Generate posts for a specific account
 */
export async function generatePostsForAccount(db: PrismaClient, accountId: string) {
  const account = await db.account.findUnique({
    where: { id: accountId, active: true }
  });

  if (!account) {
    throw new Error(`Account ${accountId} not found or inactive`);
  }

  const tz = account.timezone || 'Europe/London';
  const weekStartISO = nextMondayISODate(tz, 1); // Generate posts for NEXT week (1 week ahead)

  // Check if we already have posts for this week
  const existing = await db.postSet.findFirst({
    where: {
      accountId: account.id,
      weekStart: new Date(weekStartISO)
    }
  });

  if (existing) {
    throw new Error(`Posts already generated for week starting ${weekStartISO}`);
  }

  const doNotRepeat = await getDoNotRepeat(db, account.id);
  const brandContext = await buildBrandContext(db, account.id);
  
  // Build comprehensive context within token limits
  let fullContext = brandContext;
  if (doNotRepeat !== 'None') {
    fullContext += `\n\nRECENT CONTENT TO AVOID REPEATING:\n${doNotRepeat}`;
  }
  
  const truncatedContext = truncateContext(fullContext, (account as Record<string, unknown>).contextTokenLimit as number || 8000);
  
  const prompt = interpolatePrompt(account.promptTemplate, {
    WEEK_START_ISO: weekStartISO,
    TZ: tz,
    PLATFORMS_JSON: account.platforms,
    PILLARS: account.pillars,
    POSTS_PER_WEEK: account.postsPerWeek.toString(),
    DO_NOT_REPEAT: doNotRepeat,
    BRAND_CONTEXT: truncatedContext
  });

  const { posts: response, usage } = await generatePosts(account.openaiApiKey, prompt);
  const postSet = await savePostSet(db, account, weekStartISO, prompt, response);

  // Track actual token usage and costs
  const { trackGeneration } = await import('./cost-monitor');
  await trackGeneration(db, account.id, usage, MODEL);

  return postSet;
}
