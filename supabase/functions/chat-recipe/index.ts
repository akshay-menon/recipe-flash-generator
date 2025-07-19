import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to check if response contains a recipe
const containsRecipe = (text: string): boolean => {
  return text.includes('**Recipe Name:**') && 
         text.includes('**Ingredients:**') && 
         text.includes('**Instructions:**');
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const generateChatPrompt = (messages: Message[], exchangeNumber: number, userInput: string) => {
  if (exchangeNumber === 1) {
    return `Analyze this recipe request: ${userInput}

If the request is clear enough to generate a recipe immediately, generate it using the EXACT format below.
If not, ask 1-2 specific clarifying questions to help create the recipe.
Focus on the most important missing details:

- Type of dish/component unclear? Ask for clarification
- Cooking method preferences? Ask briefly
- Dietary restrictions relevant? Check quickly

Keep questions focused and recipe-oriented. Aim to generate a recipe within 2 exchanges maximum.

If generating a recipe, use this EXACT format:

**Recipe Name:** [Creative but simple name]

**Cooking Time:** [X minutes]

**Ingredients:**
- [ingredient 1 with quantity]
- [ingredient 2 with quantity]
- [etc.]

**Instructions:**
1. [Step 1]
2. [Step 2]
3. [etc.]

**Serves:** 2 people

**Nutritional Information (per serving):**
- Calories: [Calculate and provide accurate calorie estimate]
- Protein: [X]g
- Carbs: [X]g
- Fat: [X]g

Calculate the nutritional information based on the actual ingredients and quantities used. Provide realistic estimates based on standard nutritional values.`;
  } else if (exchangeNumber === 2) {
    const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    return `Based on previous conversation:
${conversationHistory}

Now generate a complete recipe using the EXACT format below. Even if some details aren't perfect, create a good recipe that addresses the user's core request.

**Recipe Name:** [Creative but simple name]

**Cooking Time:** [X minutes]

**Ingredients:**
- [ingredient 1 with quantity]
- [ingredient 2 with quantity]
- [etc.]

**Instructions:**
1. [Step 1]
2. [Step 2]
3. [etc.]

**Serves:** 2 people

**Nutritional Information (per serving):**
- Calories: [Calculate and provide accurate calorie estimate]
- Protein: [X]g
- Carbs: [X]g
- Fat: [X]g

Calculate the nutritional information based on the actual ingredients and quantities used. Provide realistic estimates based on standard nutritional values.`;
  } else {
    // Exchange 3+ - recipe modification mode
    const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    return `Based on our previous conversation:
${conversationHistory}

User's new request: ${userInput}

Please modify the recipe using the EXACT format below. Make the requested changes while keeping the core structure:

**Recipe Name:** [Recipe name, updated if needed]

**Cooking Time:** [X minutes]

**Ingredients:**
- [ingredient 1 with quantity]
- [ingredient 2 with quantity]
- [etc.]

**Instructions:**
1. [Step 1]
2. [Step 2]
3. [etc.]

**Serves:** 2 people

**Nutritional Information (per serving):**
- Calories: [Calculate and provide accurate calorie estimate]
- Protein: [X]g
- Carbs: [X]g
- Fat: [X]g

Calculate the nutritional information based on the actual ingredients and quantities used. Provide realistic estimates based on standard nutritional values.`;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    const stabilityApiKey = Deno.env.get('STABILITY_API_KEY');
    
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    if (!stabilityApiKey) {
      console.warn('Stability API key not configured - images will not be generated');
    }

    const { messages, userInput, exchangeNumber } = await req.json();

    console.log('Chat request:', { exchangeNumber, userInput, messageCount: messages.length });

    const prompt = generateChatPrompt(messages, exchangeNumber, userInput);
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API call failed with status ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
    
    console.log('Chat response generated successfully');

    // Check if response contains a recipe and generate image if it does
    let imageUrl = null;
    if (containsRecipe(responseText) && stabilityApiKey) {
      try {
        // Extract recipe name for image generation
        const recipeNameMatch = responseText.match(/\*\*Recipe Name:\*\*\s*(.+)/);
        const recipeName = recipeNameMatch ? recipeNameMatch[1].trim() : 'Delicious recipe';
        
        console.log('Generating image for recipe:', recipeName);

        // Generate image with Stability AI
        const imagePrompt = `Professional food photography of ${recipeName}, appetizing, restaurant quality, well-lit, beautifully plated, high resolution`;
        
        const imageResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${stabilityApiKey}`,
          },
          body: JSON.stringify({
            text_prompts: [
              {
                text: imagePrompt,
                weight: 1
              }
            ],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            steps: 30,
            samples: 1
          })
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          if (imageData.artifacts && imageData.artifacts[0]) {
            imageUrl = `data:image/png;base64,${imageData.artifacts[0].base64}`;
            console.log('Image generated successfully');
          }
        } else {
          console.error('Image generation failed:', await imageResponse.text());
        }
      } catch (imageError) {
        console.error('Error generating image:', imageError);
        // Continue without image - don't fail the whole request
      }
    }

    return new Response(JSON.stringify({ 
      response: responseText,
      exchangeNumber,
      imageUrl: imageUrl
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json'
      },
    });

  } catch (error) {
    console.error('Error in chat-recipe function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Chat failed'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});