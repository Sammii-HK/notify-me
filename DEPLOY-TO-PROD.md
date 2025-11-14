# 🚀 Deploy to Production - Step by Step

## Step 1: Commit All Changes

```bash
# Stage all code files (not .md files)
git add prisma/schema.prisma src/ scripts/

# Commit
git commit -m "Add push subscription storage and user-account linking

- Add PushSubscription model for persistent storage
- Fix push notification storage (was in-memory, now in DB)
- Add user-account linking for Succulent integration
- Fix all TypeScript and linting errors
- Add pre-push hooks for code quality"

# Push to main
git push origin main
```

## Step 2: Deploy to Vercel

**Option A: Auto-deploy (if connected to GitHub)**
- Push to `main` branch → Vercel auto-deploys
- Check Vercel dashboard for deployment status

**Option B: Manual deploy**
```bash
vercel --prod
```

## Step 3: Run Database Migrations in Production

**After deployment, run migrations:**

```bash
# Set production database URL
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

**Or via Vercel CLI:**
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

**Or via Vercel Dashboard:**
1. Go to Vercel project → Settings → Environment Variables
2. Ensure `DATABASE_URL` is set
3. Use Vercel's database connection or run migrations locally with production URL

## Step 4: Set Environment Variables in Vercel

Go to **Vercel Dashboard → Project → Settings → Environment Variables**:

### Required:
```bash
DATABASE_URL=postgresql://...          # Production database
CRON_TOKEN=your-secure-token           # Same token everywhere
APP_URL=https://your-app.vercel.app    # Your Vercel URL
```

### For Notifications:
```bash
# At least one:
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
# OR
PUSHOVER_TOKEN=...
PUSHOVER_USER=...
# OR
VAPID_PUBLIC_KEY=BD5jnCMzJbOajvpyP2ZF_53bJa7R4wEjICtfuKoUofL56MdssYKbeUl9bbscsRok-QrKiRDsh0wZx-YMQkMID0U
VAPID_PRIVATE_KEY=Z_NaHEtrjhvL0TbacHvXLOJZN-aGiGfKxRPvta2BaCw
VAPID_EMAIL=mailto:your-email@example.com
```

### Optional:
```bash
OPENAI_DEFAULT_MODEL=gpt-4o-mini
```

**Important:** After adding env vars, **redeploy** for them to take effect.

## Step 5: Deploy Cloudflare Worker

```bash
cd worker

# Set secrets in Cloudflare Dashboard or:
npx wrangler secret put CRON_TOKEN
# Enter the same CRON_TOKEN value

# Update wrangler.toml with your Vercel URLs
# Then deploy:
npx wrangler deploy
```

## Step 6: Verify Everything Works

### Test Database:
```bash
# Check tables exist
npx prisma studio
# Or connect to production DB and check:
# - User table exists
# - UserAccount table exists  
# - PushSubscription table exists
```

### Test API:
```bash
# Test user creation
curl -X POST https://your-app.vercel.app/api/users \
  -H "Content-Type: application/json" \
  -d '{"succulentUserId": "test_123", "name": "Test"}'

# Test generation
curl -X POST https://your-app.vercel.app/api/cron/weekly \
  -H "x-cron-token: your-token"
```

### Test Notifications:
- Check Discord webhook (if configured)
- Check Pushover (if configured)
- Test browser push (subscribe first via frontend)

## Quick Commands Summary

```bash
# 1. Commit & push
git add prisma/ src/ scripts/
git commit -m "Deploy push subscriptions and user linking"
git push origin main

# 2. Deploy to Vercel (if not auto-deploy)
vercel --prod

# 3. Run migrations in production
DATABASE_URL="your-prod-db-url" npx prisma migrate deploy

# 4. Deploy Cloudflare Worker
cd worker && npx wrangler deploy
```

## Troubleshooting

**"Can't reach database server" (local)**
→ This is fine! Run migrations in production instead, or start your local DB

**"Migration failed in production"**
→ Check DATABASE_URL is correct in Vercel
→ Ensure database allows connections from Vercel IPs
→ Check migration SQL file is valid

**"Push notifications not working"**
→ Verify VAPID keys are set in Vercel env vars
→ Check subscriptions are being saved (query PushSubscription table)
→ Verify service worker is registered in browser

**"Personas not linking"**
→ Ensure User and UserAccount tables exist (check migration ran)
→ Verify API endpoints are accessible
→ Check user has `succulentUserId` set

## What Gets Deployed

✅ **Code changes:**
- User-account linking API endpoints
- Push subscription storage (database)
- All TypeScript fixes
- Pre-push hooks

✅ **Database changes:**
- User table
- UserAccount table  
- PushSubscription table

✅ **Features:**
- Persistent push notifications
- Succulent user linking
- Personas/accounts per user
- All notifications working




