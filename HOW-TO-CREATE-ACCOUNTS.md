# 🎯 How to Create Multiple Accounts/Brands

## Quick Methods

### Method 1: Use Seed Script (Easiest)

The seed script creates sample accounts you can edit:

```bash
npm run seed
```

This creates:
- `Astrology Brand` (acc_main)
- `Business Growth Brand` (acc_business)

Then edit them via the UI or API.

### Method 2: Create via API (Recommended)

```bash
curl -X POST http://localhost:3000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "label": "My Photography Brand",
    "openaiApiKey": "sk-your-key-here",
    "platforms": ["instagram", "x"],
    "pillars": ["behind-the-scenes", "client-stories", "tips"],
    "postsPerWeek": 5,
    "timezone": "America/New_York",
    "active": true
  }'
```

### Method 3: Create via Dashboard UI

1. Go to Dashboard
2. If you see "No accounts found", run `npm run seed` first
3. Then edit accounts via "Edit Context" button

### Method 4: Create Multiple via Script

Create a file `scripts/create-accounts.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function createAccounts() {
  const accounts = [
    {
      label: 'Personal Brand',
      platforms: ['x', 'linkedin'],
      pillars: ['productivity', 'tech'],
      postsPerWeek: 3,
      timezone: 'America/New_York',
    },
    {
      label: 'Photography Business',
      platforms: ['instagram', 'x'],
      pillars: ['behind-the-scenes', 'tips'],
      postsPerWeek: 5,
      timezone: 'Europe/London',
    },
    {
      label: 'Wellness Coach',
      platforms: ['instagram', 'tiktok'],
      pillars: ['mindfulness', 'self-care'],
      postsPerWeek: 7,
      timezone: 'America/Los_Angeles',
    },
  ];

  for (const acc of accounts) {
    const account = await db.account.create({
      data: {
        label: acc.label,
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        promptTemplate: `...`, // Use your template
        pillars: JSON.stringify(acc.pillars),
        platforms: JSON.stringify(acc.platforms),
        postsPerWeek: acc.postsPerWeek,
        timezone: acc.timezone,
        active: true,
      },
    });
    console.log(`✅ Created: ${account.label} (${account.id})`);
  }
}

createAccounts();
```

Then run:
```bash
tsx scripts/create-accounts.ts
```

## After Creating Accounts

1. **Set up brand context** for each:
   - Go to Dashboard → Click "Edit Context"
   - Use the AI prompt helper to generate context
   - Or fill in manually

2. **Set OpenAI API key**:
   - Each account needs its own API key (or use the same one)
   - Edit via UI or API

3. **Activate accounts**:
   - Set `active: true` for accounts you want to generate posts for

4. **Test generation**:
   - Click "Generate" button on dashboard
   - Review posts
   - Adjust brand context as needed

## Tips

- **Start with one account** - Get it working perfectly before adding more
- **Use different API keys** - If you want to track costs per brand
- **Set different timezones** - For accounts targeting different regions
- **Use different platforms** - Each account can target different platforms

