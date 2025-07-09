import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateRecipePrompt = (dietaryPreference = 'non-vegetarian', numberOfPeople = '2') => {
  // Filter proteins based on dietary preference
  let proteins;
  if (dietaryPreference === 'vegan') {
    proteins = ['tofu', 'lentils', 'chickpeas', 'tempeh'];
  } else if (dietaryPreference === 'vegetarian') {
    proteins = ['tofu', 'lentils', 'chickpeas', 'eggs', 'cheese'];
  } else {
    proteins = ['chicken', 'beef', 'pork', 'fish', 'eggs'];
  }
  
  const carbs = ['rice', 'pasta', 'quinoa', 'potatoes', 'bread', 'noodles'];
  const vegetables = ['broccoli', 'bell peppers', 'onions', 'carrots', 'spinach', 'zucchini', 'mushrooms', 'tomatoes'];
  const sauces = ['soy sauce', 'olive oil', 'garlic sauce', 'tomato sauce', 'lemon juice', 'balsamic vinegar', 'honey', 'teriyaki sauce'];
  
  const randomProtein = proteins[Math.floor(Math.random() * proteins.length)];
  const randomCarb = carbs[Math.floor(Math.random() * carbs.length)];
  const randomVegetable = vegetables[Math.floor(Math.random() * vegetables.length)];
  const randomSauce = sauces[Math.floor(Math.random() * sauces.length)];
  const timestamp = Date.now();
  
  // Convert dietary preference for prompt
  const dietaryMap = {
    'non-vegetarian': '',
    'vegetarian': 'vegetarian (no meat or fish)',
    'vegan': 'vegan (no animal products including dairy, eggs, honey)'
  };
  const dietaryConstraint = dietaryMap[dietaryPreference];
  
  return `Generate a simple, recognizable dinner recipe using EXACTLY these 4 ingredients: ${randomProtein}, ${randomCarb}, ${randomVegetable}, and ${randomSauce}. Create a straightforward recipe with a simple, familiar name.

Session ID: ${timestamp}

CONSTRAINTS:
- Cooking time: Under 45 minutes maximum
- Serves exactly ${numberOfPeople} ${numberOfPeople === '1' ? 'person' : 'people'}
- Use ONLY these 4 ingredients: ${randomProtein}, ${randomCarb}, ${randomVegetable}, ${randomSauce}
- All ingredients must be common and easily available
- Simple, recognizable recipe name (avoid complex or exotic names)
- Suitable for weekday dinner (not overly complex)
${dietaryConstraint ? `- Must be ${dietaryConstraint}` : ''}

OUTPUT FORMAT:
Please format your response exactly like this:

**Recipe Name:** [Creative but simple name]

**Nutritional Information (per person):**
- Calories: [X calories] ([Y]% daily intake)
- Protein: [X]g ([Y]%)
- Carbs: [X]g ([Y]%)
- Fat: [X]g ([Y]%)

**Cooking Time:** [X minutes]

**Ingredients:**
- [ingredient 1 with quantity]
- [ingredient 2 with quantity]
- [etc.]

**Instructions:**
1. [Step 1]
2. [Step 2]
3. [etc.]

**Serves:** ${numberOfPeople} ${numberOfPeople === '1' ? 'person' : 'people'}

Generate a creative and unique recipe now.`;
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
      throw new Error('Stability API key not configured');
    }

    // Read filter parameters from request body
    const requestBody = await req.json().catch(() => ({}));
    const { dietaryPreference, numberOfPeople } = requestBody;

    console.log('Generating recipe with Claude API...');
    console.log('Filter parameters:', { dietaryPreference, numberOfPeople });

    const dynamicPrompt = generateRecipePrompt(dietaryPreference, numberOfPeople);
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

    let imageUrl = null;
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      if (imageData.artifacts && imageData.artifacts[0]) {
        imageUrl = `data:image/png;base64,${imageData.artifacts[0].base64}`;
        console.log('Image generated successfully');
      }
    } else {
      console.error('Image generation failed:', await imageResponse.text());
    }

    return new Response(JSON.stringify({ 
      recipe: responseText,
      imageUrl: imageUrl 
    }), {
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