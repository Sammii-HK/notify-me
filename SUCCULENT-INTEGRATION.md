# 🌵 Succulent Social Integration Guide

## Overview

This document explains how to link Succulent Social user profiles with accounts and personas in the notify-me app.

## Architecture

### Database Schema

```
User (Succulent Profile)
  ├── succulentUserId (unique, links to Succulent)
  ├── succulentEmail
  ├── name
  └── metadata (JSON)
  
UserAccount (Join Table)
  ├── userId → User
  ├── accountId → Account (Persona)
  ├── role (owner, editor, viewer)
  └── isPrimary (boolean)

Account (Persona/Brand)
  ├── All existing account fields
  └── Can be linked to multiple users
```

### Key Concepts

1. **User**: Represents a Succulent Social user profile
2. **Account**: Represents a brand/persona (can have multiple accounts per user)
3. **UserAccount**: Links users to accounts with roles and primary designation

## API Endpoints

### User Management

#### Create/Update User from Succulent
```http
POST /api/users
Content-Type: application/json

{
  "succulentUserId": "succ_123456",
  "succulentEmail": "user@example.com",
  "name": "John Doe",
  "metadata": { "plan": "pro", "createdAt": "2024-01-01" }
}
```

#### Get User with Accounts
```http
GET /api/users/[userId]
```

#### Get All Users
```http
GET /api/users
GET /api/users?succulentUserId=succ_123456
```

### Account Linking

#### Link Account to User
```http
POST /api/users/[userId]/accounts
Content-Type: application/json

{
  "accountId": "acc_abc123",
  "role": "owner",
  "isPrimary": true
}
```

#### Get User's Accounts
```http
GET /api/users/[userId]/accounts
```

#### Unlink Account from User
```http
DELETE /api/users/[userId]/accounts/[accountId]
```

#### Update Link (change role, set primary)
```http
PUT /api/users/[userId]/accounts/[accountId]
Content-Type: application/json

{
  "role": "editor",
  "isPrimary": false
}
```

#### Get Account's Users
```http
GET /api/accounts/[accountId]/users
```

## Usage Examples

### 1. Sync User from Succulent Webhook

When a user signs up or updates their profile in Succulent:

```typescript
import { syncSucculentUser } from '@/lib/user-accounts';
import db from '@/lib/db';

// In your webhook handler
await syncSucculentUser(db, succulentUserId, {
  email: userData.email,
  name: userData.name,
  metadata: userData
});
```

### 2. Link Account to User

When a user creates or connects an account:

```typescript
import { linkAccountToSucculentUser } from '@/lib/user-accounts';
import db from '@/lib/db';

await linkAccountToSucculentUser(db, succulentUserId, accountId, {
  role: 'owner',
  isPrimary: true
});
```

### 3. Get User's Accounts

```typescript
import { getAccountsForSucculentUser } from '@/lib/user-accounts';
import db from '@/lib/db';

const accounts = await getAccountsForSucculentUser(db, succulentUserId);
// Returns all active accounts linked to this user
```

### 4. Get Primary Account

```typescript
import { getPrimaryAccountForSucculentUser } from '@/lib/user-accounts';
import db from '@/lib/db';

const primaryAccount = await getPrimaryAccountForSucculentUser(db, succulentUserId);
// Returns the primary account or null
```

## Integration Workflow

### Initial Setup

1. **User signs up in Succulent**
   - Succulent sends webhook to notify-me
   - Create/update user via `POST /api/users`

2. **User creates account/persona**
   - Create account via `POST /api/accounts`
   - Link to user via `POST /api/users/[userId]/accounts`

3. **User adds more personas**
   - Create additional accounts
   - Link them (can set one as primary)

### Daily Operations

1. **Generate posts for user**
   - Get user's accounts: `GET /api/users/[userId]/accounts`
   - Generate posts for each account
   - Posts are associated with the account (not user)

2. **Send to Succulent**
   - Use existing scheduler adapter
   - Posts are sent to Succulent with account context

## Migration

Run the migration to add User and UserAccount tables:

```bash
# Option 1: Use Prisma migrate
npx prisma migrate dev --name add_user_account_linking

# Option 2: Apply SQL directly (if needed)
psql $DATABASE_URL < prisma/migrations/add_user_account_linking.sql

# Generate Prisma Client
npx prisma generate
```

## Helper Functions

Located in `src/lib/user-accounts.ts`:

- `getAccountsForSucculentUser()` - Get all accounts for a user
- `getPrimaryAccountForSucculentUser()` - Get primary account
- `syncSucculentUser()` - Create/update user from Succulent data
- `linkAccountToSucculentUser()` - Link account to user

## Best Practices

1. **Primary Account**: Set one account as primary per user for default operations
2. **Roles**: Use roles (owner, editor, viewer) for multi-user accounts
3. **User Sync**: Keep user data in sync with Succulent via webhooks
4. **Account Isolation**: Each account maintains its own brand voice, context, and posts
5. **Cascade Deletes**: Deleting a user removes all account links (accounts remain)

## Example: Complete User Onboarding

```typescript
// 1. User signs up in Succulent
const user = await syncSucculentUser(db, succulentUserId, {
  email: 'user@example.com',
  name: 'John Doe'
});

// 2. Create their first account/persona
const account = await db.account.create({
  data: {
    label: 'My Personal Brand',
    openaiApiKey: process.env.OPENAI_API_KEY,
    promptTemplate: defaultTemplate,
    pillars: JSON.stringify(['tech', 'productivity']),
    platforms: JSON.stringify(['x', 'linkedin']),
    // ... other fields
  }
});

// 3. Link account to user as primary
await linkAccountToSucculentUser(db, succulentUserId, account.id, {
  role: 'owner',
  isPrimary: true
});

// 4. User can now generate posts for this account
// Posts are generated per account, maintaining brand voice
```

## Security Considerations

1. **Authentication**: Verify Succulent user ID in webhooks
2. **Authorization**: Check user roles before account operations
3. **Data Isolation**: Users can only access their linked accounts
4. **API Keys**: Each account has its own OpenAI API key

## Future Enhancements

- [ ] Webhook endpoint for Succulent user events
- [ ] Account sharing between users
- [ ] Team/organization support
- [ ] Account templates for quick setup
- [ ] User-level analytics across all accounts




