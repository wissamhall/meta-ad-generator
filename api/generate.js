const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

function buildPrompt(productName, description, targetAudience, goal, tone, count) {
  const goalContext = {
    Awareness: 'brand discovery and recall — use "Learn More" or "Discover" CTAs',
    Traffic: 'driving website visits — use "Shop Now", "Learn More", or "Visit" CTAs',
    Engagement: 'likes, comments, and shares — use questions or bold statements that spark reactions',
    Leads: 'lead form submissions — use "Sign Up", "Get Started", or "Claim" CTAs',
    Conversions: 'specific actions on-site — use "Get Yours", "Try Free", or "Start Now" CTAs',
    Sales: 'direct purchases — use "Shop Now", "Buy Today", or "Order Now" CTAs'
  };

  const toneGuide = {
    Professional: 'authoritative, polished, trust-building language',
    Casual: 'friendly, conversational, relatable everyday language',
    Urgent: 'time-sensitive, FOMO-driven, action-forcing language',
    Inspiring: 'aspirational, empowering, transformation-focused language',
    Educational: 'informative, value-first, insight-driven language'
  };

  return `You are an elite Meta (Facebook & Instagram) advertising copywriter who creates scroll-stopping, high-converting ad copy.

Generate exactly ${count} unique Meta ad copy variations for:

**Product/Service:** ${productName}
**Description:** ${description}
**Target Audience:** ${targetAudience}
**Campaign Goal:** ${goal} — optimize for ${goalContext[goal] || 'conversions'}
**Tone:** ${tone} — use ${toneGuide[tone] || 'professional language'}

## Rules for EACH variation:

### Primary Text (STRICT MAXIMUM: 125 characters including spaces)
- Open with a powerful hook in the first 3 words that stops the scroll
- Focus on benefits and outcomes, NOT features
- Include exactly one clear CTA aligned with the ${goal} goal
- Every single word must earn its place

### Headline (STRICT MAXIMUM: 40 characters including spaces)
- Punchy, bold, and attention-grabbing
- Reinforces or complements the primary text
- Uses power words that drive action

### Description (STRICT MAXIMUM: 30 characters including spaces)
- Short supporting text
- Adds urgency, social proof, or reinforces value

## Each variation MUST use a DIFFERENT angle:
1. **Problem-Solution** — Name a specific pain point, then position the product as the fix
2. **Benefit-Led** — Lead with the transformation or end result the audience wants
3. **Social Proof** — Leverage popularity, authority, numbers, or testimonials
4. **Curiosity Hook** — Open a loop with a question or surprising statement
5. **Urgency** — Create authentic time pressure or exclusivity

## CRITICAL:
- Count characters carefully. Do NOT exceed limits.
- Do NOT use hashtags or emojis in the copy.
- Make each variation feel completely different — different hooks, structures, and emotional triggers.

Return ONLY a valid JSON array with no extra text. Each object must have exactly these keys:
- "primaryText": string
- "headline": string
- "description": string
- "angle": string (one of: "Problem-Solution", "Benefit-Led", "Social Proof", "Curiosity Hook", "Urgency")`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productName, description, targetAudience, goal, tone, count = 5 } = req.body;

  if (!productName || !description || !targetAudience || !goal || !tone) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (productName.length > 200 || description.length > 1000 || targetAudience.length > 300) {
    return res.status(400).json({ error: 'Input exceeds maximum length.' });
  }

  const prompt = buildPrompt(productName, description, targetAudience, goal, tone, Math.min(count, 5));

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0].text;

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const variations = JSON.parse(jsonStr);

    // Log generation for analytics
    console.log(`[${new Date().toISOString()}] Generated ${variations.length} variations for "${productName}" | Goal: ${goal} | Tone: ${tone}`);

    return res.status(200).json({
      variations,
      meta: {
        count: variations.length,
        goal,
        tone,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Generation error:', error.message || error);

    if (error.status === 429) {
      return res.status(429).json({
        error: 'High demand right now. Please wait a moment and try again.'
      });
    }

    if (error instanceof SyntaxError) {
      return res.status(500).json({
        error: 'Failed to parse generated copy. Please try again.'
      });
    }

    return res.status(500).json({
      error: 'Something went wrong generating your ad copy. Please try again.'
    });
  }
};
