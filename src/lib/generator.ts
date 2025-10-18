import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { nextMondayISODate } from './time';

const MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o';

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
 * Call OpenAI API with a prompt and return parsed JSON response
 */
export async function fetchOpenAI(apiKey: string, prompt: string): Promise<{ posts: Array<{ title?: string; content: string; platforms: string[]; scheduledDate: string; mediaUrls?: string[] }> }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      messages: [
        { 
          role: 'system', 
          content: 'You are a careful marketing copy generator. Return only valid JSON.' 
        },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content || '{}';
  
  try {
    return JSON.parse(content);
  } catch {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Invalid JSON response from OpenAI');
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
  response: { posts: Array<{ title?: string; content: string; platforms: string[]; scheduledDate: string; mediaUrls?: string[] }> }
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
  
  const prompt = interpolatePrompt(account.promptTemplate, {
    WEEK_START_ISO: weekStartISO,
    TZ: tz,
    PLATFORMS_JSON: account.platforms,
    PILLARS: account.pillars,
    POSTS_PER_WEEK: account.postsPerWeek.toString(),
    DO_NOT_REPEAT: doNotRepeat
  });

  const response = await fetchOpenAI(account.openaiApiKey, prompt);
  const postSet = await savePostSet(db, account, weekStartISO, prompt, response);

  return postSet;
}
