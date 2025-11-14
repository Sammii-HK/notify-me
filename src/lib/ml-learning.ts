import { PrismaClient } from '@prisma/client';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

/**
 * Process feedback to learn patterns and improve future generations
 */
export async function processFeedbackForLearning(
  db: PrismaClient,
  accountId: string,
  postId: string,
  feedback: {
    id: string;
    rating: string;
    feedback?: string | null;
    tags?: string | null;
    metrics?: string | null;
  }
) {
  try {
    // Get account and recent feedback
    const account = await db.account.findUnique({
      where: { id: accountId }
    });

    if (!account) return;

    // Get recent feedback for this account (last 50 posts)
    const recentPosts = await db.post.findMany({
      where: {
        postSet: {
          accountId
        }
      },
      include: {
        feedback: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        ratings: true,
        postSet: {
          select: {
            createdAt: true
          }
        }
      },
      orderBy: { scheduledAt: 'desc' },
      take: 50
    });

    // Analyze patterns
    const goodPosts = recentPosts.filter(
      p => (p.feedback && p.feedback.length > 0 && p.feedback.some(f => f.rating === 'good')) ||
           (p.ratings && p.ratings.length > 0 && p.ratings.some(r => r.rating === 'good'))
    );
    const badPosts = recentPosts.filter(
      p => (p.feedback && p.feedback.length > 0 && p.feedback.some(f => f.rating === 'bad')) ||
           (p.ratings && p.ratings.length > 0 && p.ratings.some(r => r.rating === 'bad'))
    );

    // Extract common tags from bad posts
    const badTags: Record<string, number> = {};
    badPosts.forEach(post => {
      if (post.feedback && post.feedback.length > 0) {
        post.feedback.forEach(f => {
          if (f.tags) {
            try {
              const tags = JSON.parse(f.tags) as string[];
              tags.forEach(tag => {
                badTags[tag] = (badTags[tag] || 0) + 1;
              });
            } catch {
              // Ignore parse errors
            }
          }
        });
      }
    });

    // Extract what works from good posts
    const goodPatterns: string[] = [];
    goodPosts.slice(0, 10).forEach(post => {
      if (post.feedback && post.feedback.length > 0) {
        post.feedback.forEach(f => {
          if (f.feedback && f.rating === 'good') {
            goodPatterns.push(f.feedback);
          }
        });
      }
    });

    // Generate insights using AI
    const insights = await generateInsights(
      account.openaiApiKey,
      {
        accountLabel: account.label,
        goodCount: goodPosts.length,
        badCount: badPosts.length,
        badTags,
        goodPatterns: goodPatterns.slice(0, 5),
        recentFeedback: feedback.feedback || ''
      }
    );

    // Store insights
    await db.accountLearning.upsert({
      where: {
        accountId_learningType: {
          accountId,
          learningType: 'content'
        }
      },
      update: {
        insights: JSON.stringify(insights),
        lastUpdated: new Date()
      },
      create: {
        accountId,
        learningType: 'content',
        insights: JSON.stringify(insights)
      }
    });
  } catch (error) {
    console.error('ML learning processing error:', error);
    // Don't throw - this is background processing
  }
}

/**
 * Generate insights from feedback using AI
 */
async function generateInsights(
  apiKey: string,
  data: {
    accountLabel: string;
    goodCount: number;
    badCount: number;
    badTags: Record<string, number>;
    goodPatterns: string[];
    recentFeedback: string;
  }
): Promise<{
  recommendations: string[];
  patterns: Record<string, unknown>;
  improvements: string[];
}> {
  try {
    const openaiProvider = createOpenAI({ apiKey });
    const model = openaiProvider(process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini');

    const prompt = `Analyze feedback for ${data.accountLabel} and provide insights:

STATISTICS:
- Good posts: ${data.goodCount}
- Bad posts: ${data.badCount}

COMMON ISSUES (from bad posts):
${Object.entries(data.badTags)
  .map(([tag, count]) => `- ${tag}: ${count} occurrences`)
  .join('\n')}

WHAT WORKS (from good posts):
${data.goodPatterns.map(p => `- ${p}`).join('\n')}

RECENT FEEDBACK:
${data.recentFeedback || 'None'}

Provide:
1. 3-5 specific recommendations for improvement
2. Patterns to avoid
3. Patterns to emphasize

Respond in JSON format:
{
  "recommendations": ["rec1", "rec2", ...],
  "patterns": {"avoid": [...], "emphasize": [...]},
  "improvements": ["improvement1", "improvement2", ...]
}`;

    const result = await generateText({
      model,
      prompt,
      temperature: 0.7
    });

    // Try to parse JSON from response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback if JSON parsing fails
    return {
      recommendations: ['Continue monitoring feedback patterns'],
      patterns: { avoid: [], emphasize: [] },
      improvements: ['Improve content quality based on feedback']
    };
  } catch (error) {
    console.error('Insight generation error:', error);
    return {
      recommendations: ['Error generating insights'],
      patterns: { avoid: [], emphasize: [] },
      improvements: []
    };
  }
}

/**
 * Get learned insights for an account
 */
export async function getAccountInsights(
  db: PrismaClient,
  accountId: string
) {
  const learning = await db.accountLearning.findMany({
    where: { accountId },
    orderBy: { lastUpdated: 'desc' }
  });

  return learning.map(l => ({
    ...l,
    insights: JSON.parse(l.insights),
    performanceData: l.performanceData ? JSON.parse(l.performanceData) : null,
    recommendations: l.recommendations ? JSON.parse(l.recommendations) : null
  }));
}

/**
 * Apply learned insights to brand context
 */
export async function enhanceBrandContextWithLearning(
  db: PrismaClient,
  accountId: string,
  baseContext: string
): Promise<string> {
  const learning = await db.accountLearning.findUnique({
    where: {
      accountId_learningType: {
        accountId,
        learningType: 'content'
      }
    }
  });

  if (!learning) {
    return baseContext;
  }

  try {
    const insights = JSON.parse(learning.insights) as {
      recommendations?: string[];
      patterns?: { avoid?: string[]; emphasize?: string[] };
      improvements?: string[];
    };

    let enhancedContext = baseContext;

    if (insights.recommendations && insights.recommendations.length > 0) {
      enhancedContext += `\n\nLEARNED RECOMMENDATIONS (from feedback):\n`;
      insights.recommendations.forEach((rec, i) => {
        enhancedContext += `${i + 1}. ${rec}\n`;
      });
    }

    if (insights.patterns?.avoid && insights.patterns.avoid.length > 0) {
      enhancedContext += `\n\nPATTERNS TO AVOID (based on negative feedback):\n`;
      insights.patterns.avoid.forEach((pattern) => {
        enhancedContext += `- ${pattern}\n`;
      });
    }

    if (insights.patterns?.emphasize && insights.patterns.emphasize.length > 0) {
      enhancedContext += `\n\nPATTERNS TO EMPHASIZE (based on positive feedback):\n`;
      insights.patterns.emphasize.forEach((pattern) => {
        enhancedContext += `- ${pattern}\n`;
      });
    }

    return enhancedContext;
  } catch (error) {
    console.error('Error enhancing context with learning:', error);
    return baseContext;
  }
}
