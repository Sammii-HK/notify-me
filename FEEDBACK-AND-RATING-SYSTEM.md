# Feedback and Rating System

## Overview

This document explains the new feedback and rating system that allows users to rate posts and provide feedback for ML learning.

## Features

### 1. Post Rating System
- **Simple Rating**: Users can rate posts as "good" or "bad"
- **Rating Display**: Shows aggregate ratings (👍 count, 👎 count)
- **API Endpoints**:
  - `POST /api/posts/[postId]/rate` - Rate a post
  - `GET /api/posts/[postId]/rate` - Get ratings for a post

### 2. Detailed Feedback System
- **Rating**: Good, Bad, or Neutral
- **Free-form Feedback**: Text feedback explaining what worked or didn't work
- **Tags**: Pre-defined tags like "too-long", "off-brand", "great-tone", "engaging", "boring", "confusing"
- **Metrics**: Optional engagement metrics (likes, shares, etc.)
- **API Endpoints**:
  - `POST /api/posts/[postId]/feedback` - Submit detailed feedback
  - `GET /api/posts/[postId]/feedback` - Get feedback for a post

### 3. ML Learning System
- **Automatic Processing**: Feedback is automatically processed to learn patterns
- **Insight Generation**: AI analyzes feedback to generate recommendations
- **Context Enhancement**: Learned insights are automatically added to brand context for future generations
- **Pattern Recognition**: Identifies what works and what doesn't based on feedback

### 4. User/Account Filtering
- **Succulent Integration**: Filter posts and accounts by `succulentUserId`
- **Dashboard Filtering**: Dashboard shows only posts for the logged-in user
- **API Endpoints**:
  - `GET /api/accounts/for-user?succulentUserId=xxx` - Get accounts for a user
  - `GET /api/post-sets?succulentUserId=xxx` - Get post sets for a user

### 5. Post Generation Fix
- **Existing Posts**: If posts already exist for a week, the system returns them instead of throwing an error
- **Better UX**: Users can view existing posts even if they try to regenerate

## Database Schema Changes

### New Models

1. **PostRating** - Simple good/bad ratings
   - `id`, `postId`, `userId` (optional), `rating` ("good" | "bad"), `createdAt`

2. **PostFeedback** - Detailed feedback for ML learning
   - `id`, `postId`, `userId` (optional), `rating` ("good" | "bad" | "neutral")
   - `feedback` (text), `metrics` (JSON), `tags` (JSON array), `createdAt`, `updatedAt`

3. **AccountLearning** - Aggregated insights from feedback
   - `id`, `accountId`, `learningType` ("content", "tone", "timing", etc.)
   - `insights` (JSON), `performanceData` (JSON), `recommendations` (JSON)
   - `lastUpdated`, `updatedAt`

### Updated Models

- **Post**: Added relations to `ratings` and `feedback`
- **Account**: Added relation to `learningData`

## Migration

Run the following to apply database changes:

```bash
npx prisma migrate dev --name add_feedback_and_rating_system
```

Or for production:

```bash
npx prisma migrate deploy
```

## Usage

### Rating a Post

In the review page (`/review/[postSetId]`), users can:
1. Click "👍 Good" or "👎 Bad" buttons to rate a post
2. Click "Add Feedback" to provide detailed feedback
3. Fill in rating, feedback text, and tags
4. Submit feedback for AI learning

### Viewing Posts

1. **For Succulent Users**: 
   - Access dashboard with `?succulentUserId=xxx` parameter
   - Or set `localStorage.setItem('succulentUserId', 'xxx')`
   - Dashboard will show only accounts and posts for that user

2. **Admin View**: 
   - Access dashboard without `succulentUserId` parameter
   - Shows all accounts and posts

### ML Learning

The system automatically:
1. Collects feedback when users submit it
2. Analyzes patterns from good vs bad posts
3. Generates insights using AI
4. Stores insights in `AccountLearning` table
5. Enhances brand context with learned insights for future generations

## How It Links to Succulent Account Groups

1. **User Model**: Has `succulentUserId` field that links to Succulent Social
2. **UserAccount Join Table**: Links users to accounts (personas)
3. **Filtering**: Posts and accounts are filtered by `succulentUserId` via the join table
4. **API Endpoints**: Support filtering by `succulentUserId` parameter

## Example Flow

1. User logs in via Succulent Social (has `succulentUserId`)
2. User accesses dashboard: `/dashboard?succulentUserId=succ_123`
3. Dashboard shows only accounts linked to that user
4. User generates posts for an account
5. User reviews posts at `/review/[postSetId]`
6. User rates posts and provides feedback
7. System learns from feedback and improves future generations
8. Next time user generates posts, AI uses learned insights

## API Examples

### Rate a Post
```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/rate \
  -H "Content-Type: application/json" \
  -d '{"rating": "good"}'
```

### Submit Feedback
```bash
curl -X POST http://localhost:3000/api/posts/POST_ID/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "rating": "bad",
    "feedback": "Too long and off-brand",
    "tags": ["too-long", "off-brand"]
  }'
```

### Get Accounts for User
```bash
curl http://localhost:3000/api/accounts/for-user?succulentUserId=succ_123
```

### Get Post Sets for User
```bash
curl http://localhost:3000/api/post-sets?succulentUserId=succ_123
```

## Future Enhancements

- [ ] Performance metrics integration (automatically pull engagement data)
- [ ] A/B testing support
- [ ] Trend analysis dashboard
- [ ] Automated prompt optimization based on feedback
- [ ] Multi-user feedback aggregation
- [ ] Feedback export and reporting
