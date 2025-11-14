# 📖 How to Use the AI Social Content Engine

## What This App Does

This app automatically generates social media posts for your accounts/personas using AI. It:
- Creates posts in your brand voice
- Schedules them for different platforms (X, Instagram, LinkedIn, etc.)
- Sends you notifications when posts are ready to review
- Can auto-send posts if you don't review them

---

## 🚀 Quick Start (3 Steps)

### Step 1: Set Up Your First Account

1. **Go to the Dashboard** (homepage)
   - You should see "Your Accounts" section
   - If you see "No accounts found", you need to create one

2. **Create an Account** (choose one method):

   **Option A: Use the Seed Script** (easiest for testing)
   ```bash
   npm run seed
   ```
   This creates a sample account you can edit.

   **Option B: Create via API**
   ```bash
   curl -X POST http://localhost:3000/api/accounts \
     -H "Content-Type: application/json" \
     -d '{
       "label": "My Personal Brand",
       "openaiApiKey": "sk-your-key-here",
       "platforms": ["x", "instagram"],
       "pillars": ["productivity", "tech tips"],
       "postsPerWeek": 5,
       "timezone": "America/New_York",
       "active": true
     }'
   ```

### Step 2: Set Up Your Brand Voice

1. **Click "Edit Context"** on your account card (or go to `/accounts/[accountId]`)

2. **Fill in Brand Context**:
   - **Brand Voice**: How you want to sound (e.g., "Professional", "Casual", "Inspirational")
   - **Target Audience**: Who follows you
   - **Brand Values**: What you stand for
   - **Content Guidelines**: What to include/avoid
   - **Example Posts**: 3-5 examples of your best posts

   **💡 Pro Tip**: Use ChatGPT/Claude to generate this quickly!
   - Click "📋 Paste JSON from AI" button
   - Copy the prompt from `QUICK-CONTEXT-PROMPT.txt`
   - Paste into ChatGPT, fill in your details, get JSON back
   - Paste JSON into the form → Click "Import JSON"

3. **Click "Save Changes"**

### Step 3: Generate Your First Posts

1. **Go back to Dashboard** (`/`)

2. **Click "Generate"** button on your account card

3. **Wait for generation** (takes 10-30 seconds)

4. **Review your posts**:
   - You'll get a notification (Discord/Pushover/browser push)
   - Or click the "Review" link in the dashboard
   - Edit posts if needed
   - Click "Approve" to send them

---

## 📱 Complete User Flow

### Daily/Weekly Workflow

```
1. Sunday 6 PM UTC → Posts automatically generated
   ↓
2. You get notification → "Posts ready for review"
   ↓
3. Click review link → See all generated posts
   ↓
4. Edit posts if needed → Click "Approve"
   ↓
5. Posts sent to Succulent/your scheduler
   ↓
6. (If you don't review by Monday 7:30 AM UTC)
   → Posts auto-sent anyway
```

### Manual Generation

Want to generate posts right now?

1. **Dashboard** → Click **"Generate"** on any account
2. Wait ~30 seconds
3. Click **"Review"** link that appears
4. Review and approve posts

---

## 🎯 Key Features Explained

### 1. **Accounts = Personas**

Each account represents a different persona/brand:
- Personal brand
- Photography business
- Tech blog
- etc.

Each account has its own:
- Brand voice
- Content pillars
- Platforms
- OpenAI API key
- Generation schedule

### 2. **Brand Context**

This is what makes your posts sound like YOU:
- **Brand Voice**: Tone, personality, writing style
- **Target Audience**: Who you're talking to
- **Brand Values**: What you stand for
- **Content Guidelines**: What to do/avoid
- **Example Posts**: Real examples of your style

**The better your context, the better your posts!**

### 3. **Post Sets**

When you generate posts, they're grouped into a "Post Set":
- One set = one week of posts
- All posts in a set share the same week start date
- You review the whole set at once

### 4. **Review & Approval**

- **Pending**: Posts generated, waiting for review
- **Approved**: You reviewed and approved them
- **Sent**: Posts sent to your scheduler (Succulent, Buffer, etc.)

---

## 🛠️ Common Tasks

### Add a New Account

1. Dashboard → (if you have accounts) or create via API
2. Fill in basic info (label, API key, platforms, etc.)
3. Set up brand context
4. Save

### Edit an Account's Brand Voice

1. Dashboard → Click **"Edit Context"** on account card
2. Update any fields
3. Click **"Save Changes"**

### Generate Posts for Specific Account

1. Dashboard → Click **"Generate"** button
2. Wait for completion
3. Click **"Review"** link

### Review Generated Posts

1. Click **"Review"** link (from dashboard or notification)
2. See all posts in the set
3. Edit individual posts if needed
4. Click **"Approve"** to send them

### Check What Posts Were Sent

1. Dashboard → Look at "Recent Post Sets" section
2. See status: "pending", "approved", or "sent"
3. Click on a post set to see details

---

## 🎨 Setting Up Brand Context (Detailed)

### Using AI to Generate Context

1. **Open** `QUICK-CONTEXT-PROMPT.txt` or `BRAND-CONTEXT-GENERATOR.md`

2. **Copy the prompt template**

3. **Fill in your details**:
   ```
   Account Name: My Photography Business
   Account Type: Service provider
   What I Do: Professional portrait photographer
   My Target Audience: Couples planning weddings
   My Unique Style/Voice: Warm, authentic, storytelling
   My Values: Authenticity, capturing real moments
   Content I Share: Behind-the-scenes, tips, photo highlights
   ```

4. **Paste into ChatGPT/Claude**

5. **Copy the JSON output**

6. **In account editor**:
   - Click **"📋 Paste JSON from AI"**
   - Paste JSON
   - Click **"Import JSON"**
   - Review and adjust
   - Save

### Manual Setup

Fill in each section:

**Brand Voice**:
- **Tone**: One or two words (e.g., "Warm and authentic")
- **Personality**: 3-5 adjectives (e.g., "Approachable, creative, detail-oriented")
- **Style Guidelines**: Specific instructions (e.g., "Use warm language, tell stories, use emojis sparingly")

**Target Audience**:
- **Demographics**: Age range, profession, location
- **Interests**: What they care about
- **Pain Points**: Problems you solve

**Brand Values**:
- **Core Values**: 3-5 values
- **Mission**: One sentence mission statement
- **USP**: What makes you unique

**Content Guidelines**:
- **Dos**: What to include (be specific)
- **Don'ts**: What to avoid (be specific)
- **Hashtags**: Relevant hashtags

**Example Posts**:
- 3-5 real posts that represent your best work
- One per line

---

## 🔧 Troubleshooting

### "No accounts found" on Dashboard

**Solution**: Create an account first
```bash
npm run seed
```
Or create via API (see Step 1 above)

### "Failed to generate posts"

**Check**:
- Account has `openaiApiKey` set
- API key is valid
- Account is `active: true`
- You have OpenAI credits

### "Posts not showing up"

**Check**:
- Generation completed successfully
- Check browser console for errors
- Refresh the dashboard

### "Can't edit account"

**Check**:
- You're logged in (if auth is set up)
- Account exists: `/api/accounts/[accountId]`
- Database is connected

### "Notifications not working"

**Check**:
- Environment variables set: `DISCORD_WEBHOOK` or `PUSHOVER_TOKEN`
- Push notifications: Browser permission granted
- Check `/api/push/subscriptions` to see active subscriptions

---

## 📊 Understanding the Dashboard

### Your Accounts Section

Shows all your accounts/personas:
- **Label**: Account name
- **Status**: Active/Inactive
- **Posts/Week**: How many posts to generate
- **Last Generated**: When posts were last created
- **Actions**: 
  - "Edit Context" → Set up brand voice
  - "Generate" → Create posts now

### Recent Post Sets Section

Shows recent post generations:
- **Week Start**: Which week these posts are for
- **Status**: pending / approved / sent
- **Posts**: Number of posts in the set
- **Account**: Which persona they're for
- **Actions**: Click to review/edit

---

## 🎯 Best Practices

1. **Start with one account** - Get it working perfectly before adding more

2. **Spend time on brand context** - This is what makes your posts unique. Use the AI prompt to generate it quickly, then refine.

3. **Review before approving** - Always check generated posts before sending

4. **Use example posts** - Include 3-5 real posts that represent your best work

5. **Test generation** - Generate posts manually first to see how they look

6. **Iterate** - If posts don't match your voice, update the brand context

---

## 🚀 Next Steps

Once you have accounts set up:

1. **Set up Cloudflare Worker** for automated generation
   - See `DEPLOY-TO-PROD.md` for instructions

2. **Connect to Succulent** (or your scheduler)
   - See `SUCCULENT-INTEGRATION.md`

3. **Set up notifications**
   - Discord webhook or Pushover
   - Browser push notifications

4. **Link users from Succulent**
   - See `SUCCULENT-INTEGRATION.md` for user linking

---

## 💡 Tips

- **Use the JSON import feature** - It's much faster than filling forms manually
- **Start simple** - One account, basic context, test generation
- **Refine over time** - Update brand context as you see what works
- **Check notifications** - They tell you when posts are ready
- **Review regularly** - Don't let posts auto-send without checking

---

## 📞 Need Help?

- Check `QUICK-START.md` for setup instructions
- Check `PRODUCTION-REQUIREMENTS.md` for production deployment
- Check `BRAND-CONTEXT-GENERATOR.md` for detailed context setup
- Check browser console for errors
- Check server logs for API errors

