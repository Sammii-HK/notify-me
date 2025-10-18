# AI Social Content Engine

An automated social media content generation and scheduling platform that creates, reviews, and schedules posts across multiple platforms using AI.

## Features

- **Multi-Account Support**: Manage multiple social media accounts with different voices, pillars, and schedules
- **AI Content Generation**: Uses OpenAI to generate contextual, on-brand social media posts
- **Smart Deduplication**: Prevents repetitive content using content hashing and memory
- **Automated Scheduling**: Integrates with scheduling platforms (currently Succulent Social)
- **Review & Approval**: Web UI for reviewing, editing, and approving generated posts
- **Automated Workflows**: Cron-based generation and auto-send functionality
- **Multi-Platform**: Supports X (Twitter), Threads, Bluesky, Instagram, TikTok
- **Notifications**: Discord and Pushover notifications for important events

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes (Pages Router)
- **Database**: PostgreSQL with Prisma ORM
- **Cron Jobs**: Cloudflare Workers with cron triggers
- **Scheduling**: Succulent Social API integration
- **AI**: OpenAI GPT-4 for content generation
- **Notifications**: Discord webhooks and Pushover

## Getting Started

### 1. Database Setup

Create a PostgreSQL database (recommended: Neon or Supabase free tier) and get the connection URL.

### 2. Environment Variables

Copy the example environment file and fill in your values:

\`\`\`bash
cp env.example .env.local
\`\`\`

Required variables:
- \`DATABASE_URL\`: PostgreSQL connection string
- \`CRON_TOKEN\`: Random string for securing cron endpoints
- \`APP_URL\`: Your deployed app URL (for notifications)

Optional variables:
- \`OPENAI_DEFAULT_MODEL\`: OpenAI model to use (default: gpt-4o)
- \`DISCORD_WEBHOOK\`: Discord webhook URL for notifications
- \`PUSHOVER_TOKEN\` & \`PUSHOVER_USER\`: Pushover credentials

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4. Database Migration

\`\`\`bash
npm run db:migrate
\`\`\`

### 5. Seed Database

\`\`\`bash
npm run seed
\`\`\`

**Important**: Update the OpenAI API keys in the seeded accounts before testing.

### 6. Development

\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000

## Deployment

### Vercel Deployment

1. **Deploy to Vercel**:
   \`\`\`bash
   vercel --prod
   \`\`\`

2. **Set Environment Variables** in Vercel dashboard:
   - All variables from \`.env.local\`
   - Update \`APP_URL\` to your Vercel domain

3. **Run Database Migration** in production:
   \`\`\`bash
   npx prisma migrate deploy
   \`\`\`

### Cloudflare Worker Setup

1. **Navigate to worker directory**:
   \`\`\`bash
   cd worker
   npm install
   \`\`\`

2. **Update \`wrangler.toml\`**:
   - Set \`VERCEL_WEEKLY_URL\` to your Vercel domain + \`/api/cron/weekly\`
   - Set \`VERCEL_AUTOSEND_URL\` to your Vercel domain + \`/api/cron/autosend\`
   - Set \`CRON_TOKEN\` to match your Vercel environment variable
   - Set \`ACCOUNT_IDS\` to comma-separated list of account IDs

3. **Deploy**:
   \`\`\`bash
   npx wrangler deploy
   \`\`\`

## Usage

### Manual Testing

Test weekly post generation:
\`\`\`bash
curl -X POST "https://your-domain.com/api/cron/weekly" \\
  -H "x-cron-token: your-token"
\`\`\`

Test auto-send:
\`\`\`bash
curl -X POST "https://your-domain.com/api/cron/autosend" \\
  -H "x-cron-token: your-token"
\`\`\`

### Automated Schedule

- **Sunday 6 PM UTC**: Generate weekly posts for all active accounts
- **Monday 7:30 AM UTC**: Auto-send any pending posts that weren't manually reviewed

### Review Process

1. Posts are generated and you receive notifications with review links
2. Visit the review URL to see all generated posts
3. Edit content, timing, and select which posts to approve
4. Click "Approve & Queue" to send to your scheduler
5. Posts are automatically sent if not reviewed by Monday morning

## Configuration

### Account Setup

Each account can be configured with:
- **Label**: Human-readable name
- **OpenAI API Key**: For content generation (can be shared or per-account)
- **Prompt Template**: Custom prompt with variables for voice and style
- **Pillars**: Content themes/topics (JSON array)
- **Timezone**: For scheduling posts
- **Platforms**: Target social platforms (JSON array)
- **Posts Per Week**: Number of posts to generate
- **Active**: Whether to include in automated generation

### Content Pillars Examples

- Astrology: \`["lunar guidance", "birth chart insights", "planetary transits", "cosmic wisdom"]\`
- Wellness: \`["mindful living", "self-care", "meditation", "holistic health"]\`
- Business: \`["productivity", "leadership", "growth mindset", "innovation"]\`

## API Endpoints

- \`POST /api/cron/weekly\`: Generate weekly posts
- \`POST /api/cron/autosend\`: Send pending posts
- \`GET /api/review/[postSetId]\`: Get post set for review
- \`PUT /api/review/[postSetId]\`: Save draft changes
- \`POST /api/approve/[postSetId]\`: Approve and send posts

## Database Schema

- **Account**: Social media accounts with configuration
- **PostSet**: Weekly batches of generated posts
- **Post**: Individual social media posts
- **Dedupe**: Content deduplication tracking

## Monitoring

- Check Cloudflare Worker logs: \`npx wrangler tail\`
- Monitor Vercel function logs in dashboard
- Use Prisma Studio: \`npm run db:studio\`

## Customization

### Adding New Schedulers

Implement the \`SchedulerAdapter\` interface in \`src/lib/scheduler.ts\`:

\`\`\`typescript
export class CustomAdapter implements SchedulerAdapter {
  id = 'custom-scheduler';
  
  async sendBulk(posts: SchedulerPost[]) {
    // Your implementation
  }
}
\`\`\`

### Custom Prompt Templates

Modify account prompt templates to change the AI's voice and behavior. Available variables:
- \`{{WEEK_START_ISO}}\`: Start date of the week
- \`{{TZ}}\`: Account timezone
- \`{{PLATFORMS_JSON}}\`: Target platforms
- \`{{PILLARS}}\`: Content pillars
- \`{{POSTS_PER_WEEK}}\`: Number of posts to generate
- \`{{DO_NOT_REPEAT}}\`: Recent content to avoid repeating

## Security

- Cron endpoints are protected with \`x-cron-token\` header
- OpenAI keys are stored in database, not exposed to frontend
- All API routes validate input and handle errors gracefully

## Costs

- **Vercel**: Free tier sufficient for most usage
- **Database**: Neon/Supabase free tier handles typical loads
- **Cloudflare Worker**: Free tier covers cron usage
- **OpenAI**: Varies by usage (~$0.01-0.10 per post set)
- **Notifications**: Discord free, Pushover one-time purchase

## Support

For issues or questions, check the API logs and ensure:
1. Database is accessible and migrated
2. Environment variables are set correctly
3. OpenAI API keys are valid and have credits
4. Cron token matches between Vercel and Cloudflare Worker