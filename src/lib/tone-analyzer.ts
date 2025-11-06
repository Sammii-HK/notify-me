import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini';

// Schema for tone analysis results
const ToneAnalysisSchema = z.object({
  tone: z.string(),
  personality: z.string(),
  writingStyle: z.string(),
  vocabulary: z.array(z.string()),
  sentenceStructure: z.string(),
  emotionalTone: z.string(),
  brandAttributes: z.array(z.string()),
  contentThemes: z.array(z.string()),
  recommendations: z.array(z.string())
});

export type ToneAnalysis = z.infer<typeof ToneAnalysisSchema>;

/**
 * Analyze tone from website content
 */
export async function analyzeWebsiteTone(
  apiKey: string,
  websiteUrl: string
): Promise<ToneAnalysis> {
  // First, scrape the website content
  const websiteContent = await scrapeWebsiteContent(websiteUrl);
  
  const openaiProvider = createOpenAI({ apiKey });
  
  const result = await generateObject({
    model: openaiProvider(MODEL),
    schema: ToneAnalysisSchema,
    prompt: `Analyze the brand tone and voice from this website content:

${websiteContent}

Provide a comprehensive analysis of:
- Overall tone (professional, casual, mystical, etc.)
- Personality traits evident in the writing
- Writing style characteristics
- Key vocabulary and phrases used
- Sentence structure patterns
- Emotional tone and mood
- Brand attributes that come through
- Main content themes
- Recommendations for social media content

Focus on extracting the authentic brand voice that could be replicated in social media posts.`,
    temperature: 0.3,
  });

  return result.object;
}

/**
 * Analyze tone from CSV post data
 */
export async function analyzeCsvTone(
  apiKey: string,
  csvData: string
): Promise<ToneAnalysis> {
  const openaiProvider = createOpenAI({ apiKey });
  
  const result = await generateObject({
    model: openaiProvider(MODEL),
    schema: ToneAnalysisSchema,
    prompt: `Analyze the brand tone and voice from these social media posts (CSV format):

${csvData}

Extract patterns from this content to understand:
- Consistent tone and personality
- Writing style and voice
- Common vocabulary and phrases
- Emotional characteristics
- Brand positioning
- Content themes and topics
- Engagement patterns
- Voice consistency

Provide recommendations for maintaining this voice in future content.`,
    temperature: 0.3,
  });

  return result.object;
}

/**
 * Simple website content scraper
 */
async function scrapeWebsiteContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Content-Engine/1.0; +https://notify-me-chi.vercel.app/)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Simple text extraction (remove HTML tags)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit content to prevent token overflow
    return textContent.substring(0, 8000);
  } catch (error) {
    console.error('Website scraping error:', error);
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse CSV data and extract text content
 */
export function parseCsvContent(csvData: string): string[] {
  const lines = csvData.split('\n');
  const posts: string[] = [];
  
  for (const line of lines) {
    if (line.trim()) {
      // Simple CSV parsing - assumes content is in quotes or first column
      const content = line.split(',')[0]?.replace(/^["']|["']$/g, '').trim();
      if (content && content.length > 10) {
        posts.push(content);
      }
    }
  }
  
  return posts.slice(0, 50); // Limit to 50 posts for analysis
}

/**
 * Update account with tone analysis results
 */
export async function updateAccountTone(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  accountId: string,
  toneAnalysis: ToneAnalysis
): Promise<void> {
  const brandVoice = {
    tone: toneAnalysis.tone,
    personality: toneAnalysis.personality,
    styleGuidelines: `Writing style: ${toneAnalysis.writingStyle}. Sentence structure: ${toneAnalysis.sentenceStructure}. Emotional tone: ${toneAnalysis.emotionalTone}.`,
    vocabulary: toneAnalysis.vocabulary,
    brandAttributes: toneAnalysis.brandAttributes
  };
  
  const contentGuidelines = {
    themes: toneAnalysis.contentThemes,
    recommendations: toneAnalysis.recommendations,
    dos: toneAnalysis.recommendations.filter(r => !r.toLowerCase().includes('avoid')).join(', '),
    donts: toneAnalysis.recommendations.filter(r => r.toLowerCase().includes('avoid')).join(', ')
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).account.update({
    where: { id: accountId },
    data: {
      brandVoice: JSON.stringify(brandVoice),
      contentGuidelines: JSON.stringify(contentGuidelines)
    } as never
  });
}
