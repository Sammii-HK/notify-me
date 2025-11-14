# 🎨 Brand Context Generator Prompt

Copy and paste this prompt into ChatGPT, Claude, or any AI assistant to generate brand context for your account:

---

## Prompt Template

```
I need to create brand context for my social media account. Please help me fill out the following fields based on my account details:

**Account Name:** [Your account name, e.g., "Personal Brand", "Photography Business", "Wellness Coach"]

**Account Type:** [e.g., Personal brand, Business, Creative portfolio, Service provider]

**What I Do:** [Brief description of what you do or what your account is about]

**My Target Audience:** [Who follows you or who you want to reach]

**My Unique Style/Voice:** [How you want to sound - casual, professional, inspirational, etc.]

**My Values:** [What you stand for]

**Content I Share:** [Types of posts - tips, behind-the-scenes, stories, etc.]

---

Please generate a complete brand context in JSON format with the following structure:

1. **brandVoice** (object):
   - tone: [one or two words describing your tone]
   - personality: [3-5 adjectives describing your personality]
   - styleGuidelines: [specific writing style instructions, emoji usage, sentence length, etc.]

2. **targetAudience** (object):
   - demographics: [age range, profession, location if relevant]
   - interests: [what your audience cares about]
   - painPoints: [problems your audience faces that you address]

3. **brandValues** (object):
   - coreValues: [3-5 core values]
   - mission: [your mission statement in one sentence]
   - usp: [your unique selling point - what makes you different]

4. **contentGuidelines** (object):
   - dos: [what to include in posts - be specific]
   - donts: [what to avoid - be specific]
   - hashtags: [relevant hashtags separated by spaces]

5. **examplePosts** (array):
   - Provide 3-5 example posts that represent your best content style

Output ONLY valid JSON that I can copy-paste directly. Format it like this:

{
  "brandVoice": {
    "tone": "...",
    "personality": "...",
    "styleGuidelines": "..."
  },
  "targetAudience": {
    "demographics": "...",
    "interests": "...",
    "painPoints": "..."
  },
  "brandValues": {
    "coreValues": "...",
    "mission": "...",
    "usp": "..."
  },
  "contentGuidelines": {
    "dos": "...",
    "donts": "...",
    "hashtags": "..."
  },
  "examplePosts": [
    "...",
    "...",
    "..."
  ]
}
```

---

## Example: Photography Account

**Account Name:** Sam's Photography

**Account Type:** Creative portfolio / Service provider

**What I Do:** Professional portrait and event photographer specializing in authentic, natural moments

**My Target Audience:** Couples planning weddings, families wanting portraits, small businesses needing headshots

**My Unique Style/Voice:** Warm, authentic, storytelling-focused. I want to sound approachable but professional, like a friend who happens to be really good at photography.

**My Values:** Authenticity, capturing real emotions, making people feel beautiful, preserving memories

**Content I Share:** Behind-the-scenes from shoots, tips for clients, beautiful photo highlights, stories about special moments

---

## Example Output

```json
{
  "brandVoice": {
    "tone": "Warm and authentic",
    "personality": "Approachable, creative, detail-oriented, storytelling-focused, genuine",
    "styleGuidelines": "Use warm, inviting language. Tell stories about the moments captured. Use emojis sparingly (📸 ✨ 💕). Keep sentences varied in length. Avoid overly technical jargon. Focus on emotions and memories."
  },
  "targetAudience": {
    "demographics": "Couples 25-40 planning weddings, families with children, small business owners 30-50",
    "interests": "Wedding planning, family memories, professional branding, authentic photography, storytelling",
    "painPoints": "Finding a photographer who captures authentic moments (not just posed), staying within budget, feeling comfortable in front of camera, preserving special moments"
  },
  "brandValues": {
    "coreValues": "Authenticity, emotional connection, preserving memories, making people feel beautiful",
    "mission": "Capture genuine moments and emotions that tell your unique story",
    "usp": "Natural, authentic photography that makes you feel comfortable and beautiful - no forced poses, just real you"
  },
  "contentGuidelines": {
    "dos": "Share behind-the-scenes moments from shoots, tell stories about special moments captured, provide tips for clients (what to wear, how to prepare), showcase diverse clients and moments, use warm, inviting language, highlight emotions and connections",
    "donts": "Don't oversell or use pushy sales language, avoid overly edited/artificial looking photos, don't use stock photos, avoid generic captions, don't ignore client questions, don't post without permission",
    "hashtags": "#portraitphotography #weddingphotography #authenticmoments #naturalphotography #photographystorytelling #couplesphotography #familyphotography #businessheadshots"
  },
  "examplePosts": [
    "Every sunset is a reminder that endings can be beautiful too. 📸 This couple's golden hour session captured pure joy - no poses needed, just them being them.",
    "Behind every great photo is a story waiting to be told. What's yours? ✨",
    "The best photos happen when you forget I'm there. That's when the real magic shows up. 💕",
    "Your wedding day isn't about perfect poses - it's about capturing the way you look at each other when you think no one's watching. That's the photo you'll treasure forever. 💍",
    "Three tips for feeling confident in front of the camera: 1) Wear something you love 2) Trust the process 3) Remember - I'm here to make you look amazing. You've got this! ✨"
  ]
}
```

---

## How to Use

1. **Copy the prompt template above**
2. **Fill in your account details** in the brackets
3. **Paste into ChatGPT/Claude** and ask it to generate the JSON
4. **Copy the JSON output**
5. **In your account editor**, paste each section:
   - Copy `brandVoice` object → paste into Brand Voice fields
   - Copy `targetAudience` object → paste into Target Audience fields
   - Copy `brandValues` object → paste into Brand Values fields
   - Copy `contentGuidelines` object → paste into Content Guidelines fields
   - Copy `examplePosts` array → paste each post on a new line in Example Posts

---

## Quick Copy-Paste Format

If you just want the AI to generate everything at once, use this simpler prompt:

```
Create brand context JSON for a [account type] account called "[account name]".

About: [what you do]
Audience: [who you reach]
Voice: [how you want to sound]
Values: [what you stand for]

Generate JSON with brandVoice (tone, personality, styleGuidelines), targetAudience (demographics, interests, painPoints), brandValues (coreValues, mission, usp), contentGuidelines (dos, donts, hashtags), and examplePosts (3-5 posts).

Output valid JSON only.
```

---

## Tips

- **Be specific** - The more details you give, the better the AI can match your voice
- **Review and edit** - AI-generated content is a starting point. Adjust to match your actual voice.
- **Test it** - Generate a few posts and see if they match your style. Refine as needed.
- **Keep it authentic** - Don't let AI make you sound like someone else. Use it as a guide, not a script.



