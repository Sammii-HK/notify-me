# 🎯 Production Requirements Summary

## What You Need for Production

### ✅ 1. Database Migration

**CRITICAL:** Run this first after deployment:

```bash
npx prisma migrate deploy
```

This creates:
- `User` table (Succulent profiles)
- `UserAccount` table (links users ↔ personas)
- `Account` table (personas/brands)
- `PostSet`, `Post`, `Dedupe` tables

### ✅ 2. Environment Variables (Vercel Dashboard)

#### **Required:**
```bash
DATABASE_URL=postgresql://...          # Your PostgreSQL connection
CRON_TOKEN=secure-random-string         # Same token for Vercel + Cloudflare
APP_URL=https://your-app.vercel.app    # Your production URL
```

#### **For Notifications:**
```bash
# At least ONE of these:
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
# OR
PUSHOVER_TOKEN=...
PUSHOVER_USER=...
# OR
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:...
```

#### **Optional:**
```bash
OPENAI_DEFAULT_MODEL=gpt-4o-mini  # Defaults to this anyway
```

### ✅ 3. Cloudflare Worker Setup

**Set secrets in Cloudflare:**
```bash
# In Cloudflare Dashboard → Workers → Secrets
CRON_TOKEN=same-token-as-vercel
```

**Update `worker/wrangler.toml`:**
```toml
VERCEL_WEEKLY_URL = "https://your-app.vercel.app/api/cron/weekly"
VERCEL_AUTOSEND_URL = "https://your-app.vercel.app/api/cron/autosend"
ACCOUNT_IDS = ""  # Empty = all accounts, or "acc_1,acc_2"
```

**Deploy:**
```bash
cd worker
npx wrangler deploy
```

### ✅ 4. Create Personas (Accounts)

**Option A: Via API**
```bash
POST /api/accounts
{
  "label": "My Brand",
  "openaiApiKey": "sk-...",
  "promptTemplate": "...",
  "pillars": "[\"topic1\", \"topic2\"]",
  "platforms": "[\"x\", \"instagram\"]",
  "timezone": "Europe/London",
  "postsPerWeek": 10,
  "brandVoice": "{...}",
  "targetAudience": "{...}",
  "contentGuidelines": "{...}"
}
```

**Option B: Via Prisma Studio**
```bash
npx prisma studio
# Navigate to Account table, create new record
```

### ✅ 5. Link Succulent Users to Personas

**When user signs up in Succulent:**

```bash
# 1. Create/update user
POST /api/users
{
  "succulentUserId": "succ_123",
  "succulentEmail": "user@example.com",
  "name": "User Name"
}

# 2. Link to persona (account)
POST /api/users/{userId}/accounts
{
  "accountId": "acc_abc",
  "role": "owner",
  "isPrimary": true
}
```

## How It Works

### Personas Flow:
1. **User** (from Succulent) → Can have multiple **Accounts** (personas)
2. Each **Account** has its own:
   - Brand voice & guidelines
   - Content pillars
   - Platforms
   - OpenAI API key
   - Generation schedule

3. **Generation:**
   - Runs weekly for all active accounts
   - Uses account's brand voice & context
   - Creates posts matching that persona

4. **Notifications:**
   - Sent when posts are ready for review
   - Include review URL
   - Can be Discord, Pushover, or browser push

### Notification Flow:
1. Posts generated → Notification sent
2. User reviews → Approves → Sent to Succulent
3. Or auto-sent if not reviewed by Monday

## Quick Verification

```bash
# 1. Check database
npx prisma studio
# Should see: User, UserAccount, Account tables

# 2. Test generation
curl -X POST https://your-app.vercel.app/api/cron/weekly \
  -H "x-cron-token: your-token"

# 3. Check notifications
# Should receive Discord/Pushover notification

# 4. Test personas
GET /api/users/{userId}/accounts
# Should return linked personas
```

## Common Issues

**"User table doesn't exist"**
→ Run: `npx prisma migrate deploy`

**"Notifications not sending"**
→ Check env vars: `DISCORD_WEBHOOK` or `PUSHOVER_TOKEN`

**"Personas not linked"**
→ Verify User has `succulentUserId`, Account exists, link created

**"Generation failing"**
→ Check account has `openaiApiKey` set, API key is valid

**"Build failing"**
→ Pre-push hook should catch this, but check: `pnpm run type-check && pnpm run build`

## Success Checklist

- [ ] Database migrated (`npx prisma migrate deploy`)
- [ ] Environment variables set in Vercel
- [ ] Cloudflare Worker deployed with secrets
- [ ] At least one Account (persona) created
- [ ] User created and linked to account
- [ ] Notifications configured (Discord/Pushover)
- [ ] Test generation works
- [ ] Test notifications work
- [ ] Cron jobs scheduled correctly

Once all checked, your app is ready for production! 🚀




