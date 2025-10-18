# Cloudflare Worker - Cron Triggers

This Cloudflare Worker handles the cron triggers for the AI Social Content Engine.

## Setup

1. Install dependencies:
```bash
cd worker
npm install
```

2. Update `wrangler.toml` with your actual URLs and tokens:
   - `VERCEL_WEEKLY_URL`: Your Vercel app URL + `/api/cron/weekly`
   - `VERCEL_AUTOSEND_URL`: Your Vercel app URL + `/api/cron/autosend`
   - `CRON_TOKEN`: Must match the token in your Vercel environment variables
   - `ACCOUNT_IDS`: Comma-separated list of account IDs to generate posts for

## Deploy

```bash
npx wrangler deploy
```

## Cron Schedule

- **Sunday 18:00 UTC** (`0 18 * * 0`): Generate weekly posts
- **Monday 07:30 UTC** (`30 7 * * 1`): Auto-send pending posts

## Testing

You can test the worker locally:
```bash
npx wrangler dev
```

Or tail the logs in production:
```bash
npx wrangler tail
```
