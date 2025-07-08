import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateRecipePrompt = () => {
  const cuisines = ['Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 'Indian', 'Thai', 'French'];
  const proteins = ['chicken', 'beef', 'pork', 'fish', 'tofu', 'eggs', 'beans'];
  const cookingMethods = ['pan-fried', 'baked', 'grilled', 'stir-fried', 'roasted', 'sautéed'];
  
  const randomCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
  const randomProtein = proteins[Math.floor(Math.random() * proteins.length)];
  const randomMethod = cookingMethods[Math.floor(Math.random() * cookingMethods.length)];
  const timestamp = Date.now();
  
  return `Generate a unique ${randomCuisine} dinner recipe featuring ${randomProtein} that is ${randomMethod}. Make this recipe different from typical recipes by being creative with the combination.

Session ID: ${timestamp}

CONSTRAINTS:
- Cooking time: 30-45 minutes maximum
- Serves exactly 2 people
- Uses only common ingredients (no exotic or hard-to-find items)
- Must include protein + vegetables + carbs for balanced nutrition
- Suitable for weekday dinner (not overly complex)
- Make this recipe unique and different from standard recipes

OUTPUT FORMAT:
Please format your response exactly like this:

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

Generate a creative and unique recipe now.`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    console.log('Generating recipe with Claude API...');

    const dynamicPrompt = generateRecipePrompt();
    console.log('Generated prompt for cuisine/protein variation');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: dynamicPrompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API call failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text || 'Recipe generation failed - no response text';
    
    console.log('Recipe generated successfully');

    return new Response(JSON.stringify({ recipe: responseText }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('Error in generate-recipe function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Recipe generation failed'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});