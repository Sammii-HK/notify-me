import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const defaultPromptTemplate = `You are GPT-5 Thinking generating social posts.

Rules:
- British English. No em dashes. Keep the account's voice.
- Use these content pillars evenly where natural: {{PILLARS}}.
- Use natural SEO terms where they fit: astrology app, birth chart, moon phases, tarot readings, daily horoscope, real-time planetary data.
- Generate {{POSTS_PER_WEEK}} posts for the week starting {{WEEK_START_ISO}} in {{TZ}}.
- Stagger morning, afternoon, evening across all 7 days.
- Platforms fixed: {{PLATFORMS_JSON}} for every post.
- scheduledDate must be ISO 8601 with timezone for {{TZ}} (e.g. 2025-10-20T08:30:00+01:00).
- Avoid repeating or lightly rephrasing any item in this block:
{{DO_NOT_REPEAT}}

Return ONLY JSON:
{
  "posts":[
    {"title":"Short title","content":"Post content in this account's voice. No em dashes.","platforms":{{PLATFORMS_JSON}},"scheduledDate":"2025-10-20T08:30:00+01:00","mediaUrls":[]}
  ]
}`;

async function main() {
  console.log('🌱 Seeding database...');

  // Create main account
  const mainAccount = await db.account.upsert({
    where: { id: 'acc_main' },
    update: {},
    create: {
      id: 'acc_main',
      label: 'Main Account',
      openaiApiKey: 'sk-your-openai-key-here', // Replace with actual key
      promptTemplate: defaultPromptTemplate,
      pillars: JSON.stringify([
        'lunar guidance',
        'tarot wisdom',
        'mindful living',
        'cosmic insights'
      ]),
      timezone: 'Europe/London',
      platforms: JSON.stringify(['x', 'threads', 'bluesky']),
      postsPerWeek: 14,
      active: true
    }
  });

  console.log(`✅ Created account: ${mainAccount.label} (${mainAccount.id})`);

  // Create a sample tarot account
  const tarotAccount = await db.account.upsert({
    where: { id: 'acc_tarot' },
    update: {},
    create: {
      id: 'acc_tarot',
      label: 'Tarot Focused',
      openaiApiKey: 'sk-your-openai-key-here', // Replace with actual key
      promptTemplate: defaultPromptTemplate,
      pillars: JSON.stringify([
        'daily tarot',
        'card meanings',
        'intuitive guidance',
        'spiritual growth'
      ]),
      timezone: 'America/New_York',
      platforms: JSON.stringify(['instagram', 'tiktok', 'threads']),
      postsPerWeek: 10,
      active: false // Disabled by default
    }
  });

  console.log(`✅ Created account: ${tarotAccount.label} (${tarotAccount.id})`);

  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Update the OpenAI API keys in the database');
  console.log('2. Set up your environment variables (.env.local)');
  console.log('3. Run: npx prisma migrate dev');
  console.log('4. Test the API: POST /api/cron/weekly');
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
