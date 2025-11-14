# ✅ Apply & Check Changes - Step by Step

## Prerequisites

1. **Database must be running** - Make sure your PostgreSQL database is accessible
2. **Environment variables** - Ensure `.env` has `DATABASE_URL` set

## Step 1: Generate Prisma Client

First, generate the Prisma client with the new schema:

```bash
npx prisma generate
```

**Expected output:** Should generate Prisma client with User and UserAccount models

## Step 2: Create and Apply Migration

Create a new migration for the User and UserAccount tables:

```bash
npx prisma migrate dev --name add_user_account_linking
```

**What this does:**
- Creates a migration file in `prisma/migrations/`
- Applies the migration to your database
- Regenerates Prisma client

**Alternative (if migration fails):**
If you need to apply the SQL directly:
```bash
psql $DATABASE_URL < prisma/migrations/add_user_account_linking.sql
npx prisma generate
```

## Step 3: Verify Database Schema

Check that tables were created:

```bash
# Option 1: Using Prisma Studio (visual)
npx prisma studio

# Option 2: Using psql
psql $DATABASE_URL -c "\dt" | grep -E "User|UserAccount"

# Option 3: Check migration status
npx prisma migrate status
```

**Expected tables:**
- `User` - Should exist
- `UserAccount` - Should exist
- Foreign keys should be set up correctly

## Step 4: Check TypeScript Compilation

Verify there are no TypeScript errors:

```bash
npm run build
# or
npx tsc --noEmit
```

**Expected:** No errors related to User or UserAccount types

## Step 5: Test API Endpoints

### Test 1: Create a User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "succulentUserId": "test_user_123",
    "succulentEmail": "test@example.com",
    "name": "Test User"
  }'
```

**Expected:** Returns user object with `id`, `succulentUserId`, etc.

### Test 2: Get User's Accounts (should be empty initially)

```bash
# First, get the user ID from the previous response
curl http://localhost:3000/api/users?succulentUserId=test_user_123
```

**Expected:** Returns user with empty `accountLinks` array

### Test 3: Link an Account to User

```bash
# Replace USER_ID and ACCOUNT_ID with actual IDs
curl -X POST http://localhost:3000/api/users/USER_ID/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "ACCOUNT_ID",
    "role": "owner",
    "isPrimary": true
  }'
```

**Expected:** Returns link object with account details

### Test 4: Get User with Linked Accounts

```bash
curl http://localhost:3000/api/users/USER_ID/accounts
```

**Expected:** Returns array of accounts linked to the user

## Step 6: Test Helper Functions

Create a test script to verify helper functions work:

```typescript
// test-user-accounts.ts
import db from './src/lib/db';
import { 
  syncSucculentUser, 
  linkAccountToSucculentUser,
  getAccountsForSucculentUser 
} from './src/lib/user-accounts';

async function test() {
  // Test user sync
  const user = await syncSucculentUser(db, 'test_succ_123', {
    email: 'test@example.com',
    name: 'Test User'
  });
  console.log('✅ User synced:', user.id);

  // Test account linking (use existing account ID)
  const link = await linkAccountToSucculentUser(db, 'test_succ_123', 'ACCOUNT_ID', {
    role: 'owner',
    isPrimary: true
  });
  console.log('✅ Account linked:', link.id);

  // Test getting accounts
  const accounts = await getAccountsForSucculentUser(db, 'test_succ_123');
  console.log('✅ User accounts:', accounts.length);
}

test();
```

Run with: `npx tsx test-user-accounts.ts`

## Step 7: Verify in Prisma Studio

Open Prisma Studio to visually verify:

```bash
npx prisma studio
```

**Check:**
1. Navigate to `User` table - should see your test user
2. Navigate to `UserAccount` table - should see the link
3. Navigate to `Account` table - verify the account exists
4. Check relationships work (click through related records)

## Common Issues & Fixes

### Issue: "Can't reach database server"
**Fix:** Start your PostgreSQL database
```bash
# If using Docker
docker-compose up -d

# If using local PostgreSQL
# Make sure postgres service is running
```

### Issue: "Migration failed"
**Fix:** Check the migration SQL file and apply manually if needed
```bash
# Review the migration
cat prisma/migrations/*/migration.sql

# Apply manually
psql $DATABASE_URL < prisma/migrations/add_user_account_linking.sql
```

### Issue: "Type errors in TypeScript"
**Fix:** Regenerate Prisma client
```bash
npx prisma generate
```

### Issue: "Foreign key constraint fails"
**Fix:** Make sure Account records exist before linking
```bash
# Check existing accounts
npx prisma studio
# Or query directly
psql $DATABASE_URL -c "SELECT id, label FROM \"Account\" LIMIT 5;"
```

## Quick Verification Checklist

- [ ] Prisma client generated successfully
- [ ] Migration applied to database
- [ ] `User` table exists in database
- [ ] `UserAccount` table exists in database
- [ ] TypeScript compiles without errors
- [ ] Can create a user via API
- [ ] Can link account to user via API
- [ ] Can retrieve user's accounts via API
- [ ] Helper functions work correctly
- [ ] Prisma Studio shows relationships correctly

## Next Steps After Verification

1. **Integrate with Succulent webhooks** - Set up webhook handlers
2. **Update UI** - Add user account management to frontend
3. **Add authentication** - Secure API endpoints
4. **Test with real data** - Use actual Succulent user IDs

## Need Help?

- Check `SUCCULENT-INTEGRATION.md` for API documentation
- Review `prisma/schema.prisma` for data model
- Check API route files in `src/app/api/users/`




