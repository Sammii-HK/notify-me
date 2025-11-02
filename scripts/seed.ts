import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const enhancedPromptTemplate = `You are an expert social media content creator with deep understanding of brand voice and audience engagement.

BRAND & AUDIENCE CONTEXT:
{{BRAND_CONTEXT}}

CONTENT REQUIREMENTS:
- Generate {{POSTS_PER_WEEK}} posts for week starting {{WEEK_START_ISO}} ({{TZ}})
- Content pillars to weave in naturally: {{PILLARS}}
- Target platforms: {{PLATFORMS_JSON}}
- Schedule across all 7 days (morning, afternoon, evening)
- Use British English, no em dashes
- scheduledDate must be ISO 8601 with timezone (e.g. 2025-10-20T08:30:00+01:00)

AVOID REPEATING:
{{DO_NOT_REPEAT}}

Return ONLY valid JSON:
{
  "posts": [
    {
      "title": "Engaging title",
      "content": "Post content following brand voice and guidelines",
      "platforms": {{PLATFORMS_JSON}},
      "scheduledDate": "2025-10-20T08:30:00+01:00",
      "mediaUrls": []
    }
  ]
}`;

async function main() {
  console.log('🌱 Seeding database with enhanced brand context...');

  // Create main astrology account with rich brand context
  const mainAccount = await db.account.upsert({
    where: { id: 'acc_main' },
    update: {},
    create: {
      id: 'acc_main',
      label: 'Astrology Brand',
      openaiApiKey: process.env.OPENAI_API_KEY || '', // Replace with actual key
      promptTemplate: enhancedPromptTemplate,
      pillars: JSON.stringify([
        'lunar guidance',
        'tarot wisdom',
        'cosmic insights',
        'spiritual growth'
      ]),
      timezone: 'Europe/London',
      platforms: JSON.stringify(['x', 'threads', 'instagram']),
      postsPerWeek: 10, // Conservative start
      active: true,
      
      // Enhanced brand context
      brandVoice: JSON.stringify({
        tone: 'Mystical yet approachable',
        personality: 'Wise, nurturing, authentic',
        styleGuidelines: 'Use celestial metaphors, avoid overly technical language, include emojis sparingly but meaningfully'
      }),
      
      targetAudience: JSON.stringify({
        demographics: 'Women 25-45, spiritually curious, seeking guidance',
        interests: 'Astrology, self-development, mindfulness, tarot',
        painPoints: 'Feeling disconnected from purpose, seeking direction in life decisions'
      }),
      
      brandValues: JSON.stringify({
        coreValues: 'Authenticity, empowerment, cosmic connection',
        mission: 'Help people navigate life through practical cosmic wisdom',
        usp: 'Accessible astrology for everyday decisions and personal growth'
      }),
      
      contentGuidelines: JSON.stringify({
        dos: 'Include actionable insights, reference current planetary events, use inclusive language, provide hope and empowerment',
        donts: 'Make absolute predictions, use fear-based language, overpromise results, be overly mystical without substance',
        hashtags: '#astrology #cosmicwisdom #lunarguide #spiritualgrowth #mindfuliving'
      }),
      
      examplePosts: JSON.stringify([
        'The New Moon in Capricorn invites you to plant seeds for your biggest dreams. What intentions are you setting this lunar cycle? 🌑✨ #newmoon #intentions',
        'Mercury retrograde isn\'t here to ruin your life—it\'s here to help you slow down and reflect. What area of your life needs your gentle attention right now? 💫',
        'Your birth chart is like a cosmic GPS. It doesn\'t determine your destination, but it shows you the best routes to get there. Trust your inner navigation. 🗺️⭐'
      ]),
      
      contextTokenLimit: 6000 // Optimized for cost
    }
  });

  console.log(`✅ Created account: ${mainAccount.label} (${mainAccount.id})`);

  // Create a sample business account with different context
  const businessAccount = await db.account.upsert({
    where: { id: 'acc_business' },
    update: {},
    create: {
      id: 'acc_business',
      label: 'Business Growth Brand',
      openaiApiKey: process.env.OPENAI_API_KEY || '', // Replace with actual key
      promptTemplate: enhancedPromptTemplate,
      pillars: JSON.stringify([
        'productivity tips',
        'leadership insights',
        'growth mindset',
        'business strategy'
      ]),
      timezone: 'America/New_York',
      platforms: JSON.stringify(['x', 'linkedin', 'threads']),
      postsPerWeek: 7,
      active: false, // Disabled by default
      
      brandVoice: JSON.stringify({
        tone: 'Professional yet inspiring',
        personality: 'Motivational, data-driven, action-oriented',
        styleGuidelines: 'Use business metaphors, include actionable tips, professional but approachable language'
      }),
      
      targetAudience: JSON.stringify({
        demographics: 'Entrepreneurs and business professionals 30-50',
        interests: 'Business growth, productivity, leadership, innovation',
        painPoints: 'Time management, scaling challenges, team leadership'
      }),
      
      brandValues: JSON.stringify({
        coreValues: 'Excellence, innovation, sustainable growth',
        mission: 'Empower entrepreneurs to build successful, meaningful businesses',
        usp: 'Practical business wisdom backed by real experience'
      }),
      
      contentGuidelines: JSON.stringify({
        dos: 'Share actionable insights, use data when possible, tell success stories, provide frameworks',
        donts: 'Make unrealistic promises, use jargon without explanation, ignore work-life balance',
        hashtags: '#entrepreneurship #leadership #productivity #businessgrowth #success'
      }),
      
      examplePosts: JSON.stringify([
        'The best leaders don\'t just give feedback—they create a culture where feedback flows freely in all directions. How are you fostering open communication in your team? 💼',
        'Your biggest competitor isn\'t another company. It\'s your own complacency. What\'s one thing you\'re doing differently this quarter? 🚀',
        'Revenue is vanity, profit is sanity, but cash flow is reality. Which metric are you tracking most closely right now? 📊'
      ]),
      
      contextTokenLimit: 5000 // Slightly lower for business content
    }
  });

  console.log(`✅ Created account: ${businessAccount.label} (${businessAccount.id})`);

  console.log('\n🎉 Enhanced seeding completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Update the OpenAI API keys in the database');
  console.log('2. Set up your environment variables (.env.local)');
  console.log('3. Run: npx prisma migrate deploy (in production)');
  console.log('4. Test the API: POST /api/cron/weekly');
  console.log('5. Monitor costs with the new cost tracking features');
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
