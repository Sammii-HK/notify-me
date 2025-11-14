# 🗄️ Production Database Migration Guide

## Quick Migration (Recommended)

**Option 1: Using the DATABASE_URL from .env.vercel**

```bash
# Use the production DATABASE_URL from Vercel
export DATABASE_URL="$(grep '^DATABASE_URL=' .env.vercel | cut -d'=' -f2- | tr -d '"')"

# Run migrations (this applies pending migrations)
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

**Option 2: Manual DATABASE_URL**

```bash
# Set production database URL
export DATABASE_URL="postgresql://neondb_owner:npg_jtn6P2BqZsMH@ep-small-bread-ahl37lr2-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Run migrations
npx prisma migrate deploy
```

**Option 3: One-liner**

```bash
DATABASE_URL="$(grep '^DATABASE_URL=' .env.vercel | cut -d'=' -f2- | tr -d '"')" npx prisma migrate deploy
```

## What Gets Migrated

The following migrations will be applied:
- ✅ `20251102163519_enhance_brand_context` (if not already applied)
- ✅ `add_user_account_linking` - Adds User, UserAccount, and PushSubscription tables

## Verify Migration Success

```bash
# Check migration status
DATABASE_URL="$(grep '^DATABASE_URL=' .env.vercel | cut -d'=' -f2- | tr -d '"')" npx prisma migrate status

# Or open Prisma Studio to see tables
DATABASE_URL="$(grep '^DATABASE_URL=' .env.vercel | cut -d'=' -f2- | tr -d '"')" npx prisma studio
```

## Important Notes

⚠️ **`prisma migrate deploy`** vs **`prisma migrate dev`**:
- `migrate deploy` = Production (applies migrations, doesn't create new ones)
- `migrate dev` = Development (creates new migrations, resets DB)

✅ **Safe to run multiple times**: `migrate deploy` only applies pending migrations

## Troubleshooting

**"Migration already applied"**
→ This is fine! It means production is up to date.

**"Can't reach database server"**
→ Check DATABASE_URL is correct
→ Ensure Neon database allows connections from your IP
→ Try using the pooled connection URL

**"Migration failed"**
→ Check the SQL file for syntax errors
→ Verify database permissions
→ Check Prisma schema matches migration

## After Migration

Once migrations are applied:
1. ✅ User table exists
2. ✅ UserAccount table exists (links users to accounts/personas)
3. ✅ PushSubscription table exists (stores browser push subscriptions)

Your app will now support:
- Linking Succulent users to accounts/personas
- Persistent push notification subscriptions
- Multi-user account management



