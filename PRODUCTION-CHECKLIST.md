# 🚀 Production Deployment Checklist

## Required Setup for Production

### 1. Database Setup ✅

**Run migrations:**
```bash
# In production (after deployment)
npx prisma migrate deploy

# This creates:
# - Account table (personas/brands)
# - User table (Succulent profiles)
# - UserAccount table (links users to personas)
# - PostSet, Post, Dedupe tables
```

**Verify:**
```bash
npx prisma studio
# Check that User and UserAccount tables exist
```

### 2. Environment Variables (Required)

Set these in your Vercel/production environment:

#### **Core Required:**
```bash
DATABASE_URL=postgresql://...          # PostgreSQL connection string
CRON_TOKEN=your-secure-random-token    # For securing cron endpoints
APP_URL=https://your-domain.vercel.app # Your production URL
```

#### **Notifications (Optional but Recommended):**
```bash
# Discord notifications
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...

# Pushover notifications (mobile)
PUSHOVER_TOKEN=your-pushover-token
PUSHOVER_USER=your-pushover-user-key

# Browser push notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:your-email@example.com
```

#### **AI Configuration:**
```bash
OPENAI_DEFAULT_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

### 3. Personas/Accounts Setup

#### **Create Accounts (Personas):**

Each account represents a different brand/persona. Create via API:

```bash
POST /api/accounts
{
  "label": "My Astrology Brand",
  "openaiApiKey": "sk-...",
  "promptTemplate": "...",
  "pillars": "[\"lunar guidance\", \"tarot wisdom\"]",
  "platforms": "[\"x\", \"instagram\", \"threads\"]",
  "timezone": "Europe/London",
  "postsPerWeek": 10,
  "brandVoice": "{\"tone\": \"Mystical yet approachable\", ...}",
  "targetAudience": "{\"demographics\": \"Women 25-45\", ...}",
  "contentGuidelines": "{\"dos\": \"...\", \"donts\": \"...\"}",
  "contextTokenLimit": 8000
}
```

#### **Link Succulent Users to Accounts:**

```bash
# 1. Create/update user from Succulent
POST /api/users
{
  "succulentUserId": "succ_123456",
  "succulentEmail": "user@example.com",
  "name": "John Doe"
}

# 2. Link account to user
POST /api/users/{userId}/accounts
{
  "accountId": "acc_abc123",
  "role": "owner",
  "isPrimary": true
}
```

### 4. Notifications Setup

#### **Discord Webhook:**
1. Go to Discord Server Settings → Integrations → Webhooks
2. Create webhook, copy URL
3. Set `DISCORD_WEBHOOK` env var

#### **Pushover (Mobile):**
1. Sign up at pushover.net
2. Get your User Key
3. Create an Application, get API Token
4. Set `PUSHOVER_TOKEN` and `PUSHOVER_USER` env vars

#### **Browser Push (VAPID Keys):**
```bash
# Generate VAPID keys (run once)
node -e "const webpush = require('web-push'); console.log(webpush.generateVAPIDKeys())"

# Set in environment:
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:your-email@example.com
```

### 5. Cloudflare Worker (Cron Jobs)

**Update `worker/wrangler.toml`:**
```toml
[env.production]
VERCEL_WEEKLY_URL = "https://your-domain.vercel.app/api/cron/weekly"
VERCEL_AUTOSEND_URL = "https://your-domain.vercel.app/api/cron/autosend"
CRON_TOKEN = "same-token-as-vercel"
ACCOUNT_IDS = "acc_1,acc_2,acc_3"  # Optional: specific accounts
```

**Deploy worker:**
```bash
cd worker
npm install
npx wrangler deploy --env production
```

### 6. Succulent Integration

#### **Webhook Setup (Recommended):**

Create webhook endpoint in Succulent to sync users:

```typescript
// When user signs up/updates in Succulent:
POST https://your-domain.vercel.app/api/users
{
  "succulentUserId": "succ_123",
  "succulentEmail": "user@example.com",
  "name": "User Name"
}
```

#### **Link Accounts When User Creates Persona:**

```typescript
// After user creates persona in Succulent:
POST https://your-domain.vercel.app/api/users/{userId}/accounts
{
  "accountId": "new_account_id",
  "role": "owner",
  "isPrimary": true
}
```

### 7. Testing Production Setup

#### **Test Notifications:**
```bash
# Test Discord
curl -X POST https://your-domain.vercel.app/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{"type": "discord", "message": "Test"}'

# Test generation
curl -X POST https://your-domain.vercel.app/api/cron/weekly?accountId=acc_123 \
  -H "x-cron-token: your-token"
```

#### **Test Personas:**
```bash
# Get user's accounts
GET /api/users/{userId}/accounts

# Should return all personas linked to that user
```

### 8. Monitoring & Maintenance

#### **Check Logs:**
- Vercel Dashboard → Functions → View logs
- Cloudflare Worker → Logs
- Database: `npx prisma studio`

#### **Monitor Costs:**
- Check token usage logs: `[Token Usage]` and `[Cost Tracking]`
- Review monthly costs per account
- Adjust `contextTokenLimit` if needed

#### **Update Personas:**
- Edit account via `PUT /api/accounts/{accountId}`
- Update brand voice, guidelines, etc.
- Changes apply to next generation

## Quick Start Commands

```bash
# 1. Deploy to Vercel
vercel --prod

# 2. Set environment variables in Vercel dashboard

# 3. Run migrations
npx prisma migrate deploy

# 4. Create accounts/personas
# Use API or Prisma Studio

# 5. Link users to accounts
# Use API endpoints

# 6. Deploy Cloudflare Worker
cd worker && npx wrangler deploy

# 7. Test!
curl -X POST https://your-domain/api/cron/weekly \
  -H "x-cron-token: your-token"
```

## What Works After Setup

✅ **Personas**: Each account is a separate persona with its own voice
✅ **User Linking**: Succulent users can have multiple personas
✅ **Notifications**: Discord, Pushover, and browser push
✅ **Auto-Generation**: Weekly posts generated automatically
✅ **Review Flow**: Web UI for reviewing and editing posts
✅ **Auto-Send**: Unreviewed posts sent automatically
✅ **Cost Tracking**: Real token usage and costs tracked

## Troubleshooting

**Notifications not working?**
- Check env vars are set correctly
- Test webhook URLs manually
- Check Vercel function logs

**Personas not linked?**
- Verify User and UserAccount tables exist
- Check user has `succulentUserId` set
- Verify account exists and is active

**Generation failing?**
- Check OpenAI API keys are valid
- Verify account has `openaiApiKey` set
- Check token limits aren't too low
- Review error logs in Vercel

**Build failing?**
- Run `pnpm run type-check` locally
- Run `pnpm run build` locally
- Check all TypeScript errors are fixed
- Pre-push hook should catch these




