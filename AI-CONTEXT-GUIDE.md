# 🧠 AI Context & Brand Management Guide

This guide explains how your AI Social Content Engine now manages brand context, tone of voice, and cost optimization.

## 📊 **Context Storage Architecture**

### Enhanced Account Model
Your database now stores comprehensive brand context:

```typescript
interface Account {
  // Basic info
  id: string;
  label: string;
  openaiApiKey: string;
  promptTemplate: string;
  
  // Content pillars & targeting  
  pillars: string;        // JSON: ["lunar guidance", "tarot wisdom", ...]
  platforms: string;      // JSON: ["x", "threads", "instagram"]
  timezone: string;
  postsPerWeek: number;
  
  // 🆕 Enhanced brand context
  brandVoice: string;         // JSON: tone, personality, style guidelines
  targetAudience: string;     // JSON: demographics, interests, pain points
  brandValues: string;        // JSON: core values, mission, USP
  contentGuidelines: string;  // JSON: dos/don'ts, hashtag strategy
  examplePosts: string;       // JSON: array of high-performing posts
  
  // 🆕 Cost & context management
  contextTokenLimit: number;  // Max tokens for context (default: 8000)
  monthlyGenCount: number;    // Usage tracking
  lastResetDate: DateTime;    // For monthly reset
}
```

## 🎯 **Context Management Strategy**

### Token Allocation (8000 token budget)
```typescript
const contextAllocation = {
  brandVoice: 800,         // Tone, personality, guidelines
  targetAudience: 600,     // Demographics, interests, pain points  
  brandValues: 500,        // Mission, values, USP
  contentGuidelines: 700,  // Dos/don'ts, hashtag strategy
  examplePosts: 1000,      // 3 high-performing examples
  recentPosts: 2000,       // Deduplication context
  promptInstructions: 1500, // Base generation instructions
  responseBuffer: 2000,    // Space for AI response
  safety: 400             // Buffer for estimation errors
};
```

### Context Building Process
1. **Load account data** with brand context
2. **Parse JSON fields** safely with fallbacks
3. **Build structured context** following priority order
4. **Estimate token usage** (~4 chars per token)
5. **Truncate if needed** to fit within limits
6. **Inject into prompt** template

## 🎨 **Brand Voice Configuration**

### Brand Voice Structure
```json
{
  "tone": "Mystical yet approachable",
  "personality": "Wise, nurturing, authentic", 
  "styleGuidelines": "Use celestial metaphors, avoid technical jargon, include meaningful emojis"
}
```

### Target Audience Structure  
```json
{
  "demographics": "Women 25-45, spiritually curious",
  "interests": "Astrology, self-development, mindfulness",
  "painPoints": "Feeling disconnected from purpose, seeking guidance"
}
```

### Content Guidelines Structure
```json
{
  "dos": "Include actionable insights, reference planetary events, use inclusive language",
  "donts": "Make absolute predictions, use fear-based language, overpromise results", 
  "hashtags": "#astrology #cosmicwisdom #lunarguide #spiritualgrowth"
}
```

## 💰 **Cost Optimization Features**

### Automatic Cost Tracking
- **Monthly generation count** per account
- **Token usage estimation** for each request  
- **Cost alerts** when approaching limits
- **Usage reset** monthly

### Cost Optimization Tips
1. **Use gpt-4o-mini** for 90% cost savings vs gpt-4o
2. **Set contextTokenLimit** to 6000 for basic accounts
3. **Limit postsPerWeek** to 7-10 initially
4. **Optimize prompt templates** to be concise
5. **Monitor monthly usage** with built-in tracking

### Cost Monitoring Functions
```typescript
// Estimate cost before generation
const estimate = estimateGenerationCost(prompt, 2000, 'gpt-4o-mini');

// Track usage after generation  
await trackGeneration(db, accountId, estimate);

// Check monthly limits
const limits = await checkCostLimits(db, accountId, 25); // $25 limit
if (limits.isApproachingLimit) {
  // Send alert
}

// Get optimization tips
const tips = getCostOptimizationTips();
```

## 🚀 **Context Limits by Model**

### OpenAI Model Comparison
| Model | Context Window | Cost (Input/Output per 1M tokens) | Best For |
|-------|----------------|-----------------------------------|----------|
| **gpt-4o** | 128k | $2.50/$10.00 | Premium accounts, complex content |
| **gpt-4o-mini** | 128k | $0.15/$0.60 | Most accounts (90% cheaper!) |
| **gpt-3.5-turbo** | 16k | $0.50/$1.50 | Simple content, drafts |

### Recommended Context Limits
- **Basic accounts**: 4000-6000 tokens
- **Premium accounts**: 8000-12000 tokens  
- **Enterprise**: 15000+ tokens

## 🎪 **Training the AI**

### How the AI Learns Your Brand
1. **Example posts** show successful content patterns
2. **Brand voice** defines tone and personality
3. **Content guidelines** set boundaries and preferences
4. **Target audience** shapes messaging and language
5. **Recent posts** prevent repetition and maintain variety

### Improving AI Performance
1. **Add high-performing posts** to `examplePosts`
2. **Refine brand voice** based on audience response
3. **Update content guidelines** with learnings
4. **Monitor generated content** quality
5. **Adjust context limits** for cost optimization

### Context Refresh Strategy
- **Weekly**: Update recent posts for deduplication
- **Monthly**: Review and optimize brand context
- **Quarterly**: Add new example posts, refine guidelines
- **Annually**: Major brand voice updates

## 📈 **Production Context Examples**

### Astrology Brand Context
```typescript
const astrologyContext = {
  brandVoice: {
    tone: "Mystical yet approachable",
    personality: "Wise, nurturing, authentic",
    styleGuidelines: "Use celestial metaphors, meaningful emojis"
  },
  targetAudience: {
    demographics: "Women 25-45, spiritually curious", 
    interests: "Astrology, self-development, mindfulness",
    painPoints: "Seeking purpose, needing guidance"
  },
  contentGuidelines: {
    dos: "Actionable insights, current planetary events, inclusive language",
    donts: "Absolute predictions, fear-based language, overpromising"
  }
};
```

### Business Brand Context
```typescript
const businessContext = {
  brandVoice: {
    tone: "Professional yet inspiring",
    personality: "Motivational, data-driven, action-oriented", 
    styleGuidelines: "Business metaphors, actionable tips, approachable"
  },
  targetAudience: {
    demographics: "Entrepreneurs 30-50",
    interests: "Business growth, productivity, leadership",
    painPoints: "Time management, scaling challenges, team leadership"
  },
  contentGuidelines: {
    dos: "Share frameworks, use data, tell success stories",
    donts: "Unrealistic promises, unexplained jargon, ignore work-life balance"
  }
};
```

## 🔄 **Context Management Best Practices**

### 1. Start Simple
- Begin with basic brand voice and guidelines
- Add complexity gradually based on results
- Monitor token usage and costs

### 2. Iterate Based on Performance  
- Track which posts perform best
- Add successful patterns to example posts
- Refine guidelines based on audience response

### 3. Optimize for Cost
- Use shorter, punchier guidelines
- Prioritize most important context elements
- Consider model selection based on content complexity

### 4. Maintain Consistency
- Regular context reviews and updates
- Consistent voice across all platforms
- Clear brand guideline documentation

## 🎯 **Expected Results**

With enhanced context management, you should see:

- **🎨 More on-brand content** that matches your voice
- **📈 Better engagement** from targeted messaging  
- **💰 Controlled costs** with usage monitoring
- **⚡ Consistent quality** across all generated posts
- **🔄 Reduced repetition** with smart deduplication

Your AI now has the context it needs to create truly branded, engaging content while keeping costs under control! 🚀


