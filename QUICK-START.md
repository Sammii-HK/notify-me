# 🚀 Quick Start - Apply & Check Changes

## TL;DR - Run These Commands

```bash
# 1. Generate Prisma client with new schema
npx prisma generate

# 2. Create and apply migration
npx prisma migrate dev --name add_user_account_linking

# 3. Test the integration
npx tsx scripts/test-user-integration.ts
```

That's it! If all three commands succeed, you're good to go.

---

## Detailed Steps

### Step 1: Generate Prisma Client

```bash
npx prisma generate
```

**What to expect:**
- Should complete without errors
- Generates TypeScript types for `User` and `UserAccount` models

**If it fails:**
- Check `prisma/schema.prisma` for syntax errors
- Make sure Prisma is installed: `npm install prisma @prisma/client`

### Step 2: Create Migration

```bash
npx prisma migrate dev --name add_user_account_linking
```

**What to expect:**
- Creates migration file in `prisma/migrations/`
- Applies migration to database
- Creates `User` and `UserAccount` tables

**If it fails:**
- Make sure database is running and `DATABASE_URL` is set in `.env`
- Check database connection: `npx prisma db pull` (should work)

### Step 3: Run Test Script

```bash
npx tsx scripts/test-user-integration.ts
```

**What to expect:**
- Creates a test user
- Links it to an existing account
- Verifies all functions work
- Cleans up test data

**If it fails:**
- Make sure you have at least one account in the database
- Run `npm run seed` first if needed

---

## Verify Everything Works

### Option 1: Quick API Test

```bash
# Start your dev server
npm run dev

# In another terminal, create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "succulentUserId": "test_123",
    "name": "Test User",
    "succulentEmail": "test@example.com"
  }'
```

### Option 2: Prisma Studio

```bash
npx prisma studio
```

Then navigate to:
- `User` table - should be empty or have test data
- `UserAccount` table - should show links
- `Account` table - your existing accounts

### Option 3: Check Database Directly

```bash
# Using psql
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('User', 'UserAccount');"

# Should show:
#  table_name
# ------------
#  User
#  UserAccount
```

---

## Troubleshooting

### "Can't reach database server"
```bash
# Check your .env file has DATABASE_URL
cat .env | grep DATABASE_URL

# If using Docker, start it
docker-compose up -d

# If using local PostgreSQL, check it's running
# macOS: brew services list | grep postgres
# Linux: sudo systemctl status postgresql
```

### "Migration failed"
```bash
# Check what migrations exist
ls -la prisma/migrations/

# Try resetting (WARNING: deletes all data)
# npx prisma migrate reset

# Or apply SQL manually
psql $DATABASE_URL < prisma/migrations/add_user_account_linking.sql
```

### "Type errors"
```bash
# Regenerate Prisma client
npx prisma generate

# Restart TypeScript server in your IDE
# VS Code: Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

### "No accounts found" (in test script)
```bash
# Seed the database
npm run seed

# Or create one manually via API
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Test Account",
    "openaiApiKey": "sk-test",
    "pillars": "[]",
    "platforms": "[]"
  }'
```

---

## What Was Added?

### New Database Tables
- ✅ `User` - Stores Succulent user profiles
- ✅ `UserAccount` - Links users to accounts (many-to-many)

### New API Endpoints
- ✅ `POST /api/users` - Create/update user
- ✅ `GET /api/users` - List users
- ✅ `GET /api/users/[userId]` - Get user details
- ✅ `POST /api/users/[userId]/accounts` - Link account
- ✅ `GET /api/users/[userId]/accounts` - Get user's accounts
- ✅ `DELETE /api/users/[userId]/accounts/[accountId]` - Unlink account
- ✅ `GET /api/accounts/[accountId]/users` - Get account's users

### New Helper Functions
- ✅ `syncSucculentUser()` - Sync user from Succulent
- ✅ `linkAccountToSucculentUser()` - Link account to user
- ✅ `getAccountsForSucculentUser()` - Get all user's accounts
- ✅ `getPrimaryAccountForSucculentUser()` - Get primary account

---

## Next Steps

Once everything is verified:

1. **Integrate with Succulent** - Set up webhook handlers
2. **Update UI** - Add user management interface
3. **Add Auth** - Secure the API endpoints
4. **Test with Real Data** - Use actual Succulent user IDs

See `SUCCULENT-INTEGRATION.md` for detailed API documentation.




