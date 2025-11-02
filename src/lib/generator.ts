import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { nextMondayISODate } from './time';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, streamObject } from 'ai';
import { z } from 'zod';

const MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';

// Zod schemas for structured output validation
const PostSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, 'Content cannot be empty'),
  platforms: z.array(z.string()).min(1, 'At least one platform required'),
  scheduledDate: z.string().datetime('Invalid date format'),
  mediaUrls: z.array(z.string().url('Invalid URL')).optional().default([])
});

const PostsResponseSchema = z.object({
  posts: z.array(PostSchema).min(1, 'At least one post required')
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
 * Generate posts using AI SDK with structured output and validation
 */
export async function generatePosts(apiKey: string, prompt: string): Promise<PostsResponse> {
  try {
    const openaiProvider = createOpenAI({
      apiKey,
    });
    
    const result = await generateObject({
      model: openaiProvider(MODEL),
      schema: PostsResponseSchema,
      prompt: `You are a careful marketing copy generator. Generate social media posts based on the following requirements:

${prompt}

Important guidelines:
- Ensure all dates are in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Content should be engaging and platform-appropriate
- Respect the specified platforms for each post
- Follow the content pillars and avoid repeating recent topics
- Generate exactly the requested number of posts`,
      temperature: 0.7,
      maxRetries: 3, // Built-in retry mechanism
    });

    // Validate the result
    const validatedData = PostsResponseSchema.parse(result.object);
    
    return validatedData;
  } catch (error) {
    console.error('AI generation error:', error);
    
    if (error instanceof z.ZodError) {
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
 */
export async function* generatePostsStream(apiKey: string, prompt: string) {
  const openaiProvider = createOpenAI({
    apiKey,
  });
  
  const result = streamObject({
    model: openaiProvider(MODEL),
    schema: PostsResponseSchema,
    prompt: `You are a careful marketing copy generator. Generate social media posts based on the following requirements:

${prompt}

Important guidelines:
- Ensure all dates are in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
- Content should be engaging and platform-appropriate
- Respect the specified platforms for each post
- Follow the content pillars and avoid repeating recent topics
- Generate exactly the requested number of posts`,
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

  // Return final validated result
  try {
    const finalObject = await result.object;
    const validatedData = PostsResponseSchema.parse(finalObject);
    yield {
      type: 'complete' as const,
      data: validatedData,
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

  return context.trim();
}

/**
 * Count tokens approximately (rough estimate: ~4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate context to fit within token limits
 */
export function truncateContext(context: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(context);
  
  if (estimatedTokens <= maxTokens) {
    return context;
  }
  
  // Rough truncation - keep first 80% of allowed characters
  const maxChars = maxTokens * 4 * 0.8;
  return context.substring(0, maxChars) + '\n\n[Context truncated to fit token limit]';
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
        platforms: JSON.stringify(post.platforms),
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
  const weekStartISO = nextMondayISODate(tz);

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

  const response = await generatePosts(account.openaiApiKey, prompt);
  const postSet = await savePostSet(db, account, weekStartISO, prompt, response);

  return postSet;
}
