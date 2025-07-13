import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateRecipePrompt = (dietaryPreference = 'non-vegetarian', numberOfPeople = '2', specialRequest = '', userPreferences = {}) => {
  const timestamp = Date.now();
  const randomSeed = Math.floor(Math.random() * 1000000);
  
  // Convert dietary preference for prompt
  const dietaryMap = {
    'non-vegetarian': '',
    'vegetarian': 'vegetarian (no meat or fish)',
    'vegan': 'vegan (no animal products including dairy, eggs, honey)'
  };
  const dietaryConstraint = dietaryMap[dietaryPreference];
  
  // Random elements to ensure variety
  const cookingMethods = ['pan-frying', 'baking', 'sautéing', 'grilling', 'roasting', 'steaming', 'stir-frying', 'braising'];
  const flavorProfiles = ['Mediterranean', 'Asian-inspired', 'Latin', 'Middle Eastern', 'European', 'American comfort', 'fresh and light', 'rich and hearty', 'spicy and bold', 'mild and comforting'];
  const primaryIngredients = ['chicken', 'fish', 'beef', 'pork', 'tofu', 'beans', 'eggs', 'pasta', 'rice', 'quinoa', 'vegetables'];
  
  // Filter ingredients based on dietary preference
  let availableIngredients = [...primaryIngredients];
  if (dietaryPreference === 'vegetarian') {
    availableIngredients = availableIngredients.filter(ing => !['chicken', 'fish', 'beef', 'pork'].includes(ing));
  } else if (dietaryPreference === 'vegan') {
    availableIngredients = availableIngredients.filter(ing => !['chicken', 'fish', 'beef', 'pork', 'eggs'].includes(ing));
  }
  
  // Random selections for variety
  const randomCookingMethod = cookingMethods[Math.floor(Math.random() * cookingMethods.length)];
  const randomFlavorProfile = flavorProfiles[Math.floor(Math.random() * flavorProfiles.length)];
  const randomIngredient = availableIngredients[Math.floor(Math.random() * availableIngredients.length)];
  
  // Build comprehensive user preferences section
  let preferencesSection = '';
  
  // Kitchen Equipment
  if (userPreferences.kitchenEquipment && userPreferences.kitchenEquipment.length > 0) {
    preferencesSection += `\n- Available kitchen equipment: ${userPreferences.kitchenEquipment.join(', ')}`;
  }
  
  // Cooking Experience
  if (userPreferences.cookingExperience) {
    const experienceMap = {
      'Beginner': 'simple recipes with basic techniques and detailed instructions',
      'Intermediate': 'comfortable with most cooking methods, can handle multi-step recipes',
      'Advanced': 'experienced cook, enjoys complex techniques and minimal hand-holding'
    };
    const experienceDescription = experienceMap[userPreferences.cookingExperience] || userPreferences.cookingExperience;
    preferencesSection += `\n- Cooking experience: ${userPreferences.cookingExperience} (${experienceDescription})`;
  }
  
  // Dietary Restrictions from preferences page (in addition to main page dietary preference)
  if (userPreferences.dietaryRestrictions && userPreferences.dietaryRestrictions.trim()) {
    preferencesSection += `\n- Additional dietary restrictions and dislikes: ${userPreferences.dietaryRestrictions}`;
  }
  
  // Protein Preferences
  if (userPreferences.proteinPreferences && userPreferences.proteinPreferences.length > 0) {
    preferencesSection += `\n- Preferred proteins: ${userPreferences.proteinPreferences.join(', ')}`;
  }
  
  // Cuisine Preferences
  if (userPreferences.preferredCuisines && userPreferences.preferredCuisines.length > 0) {
    preferencesSection += `\n- Preferred cuisines: ${userPreferences.preferredCuisines.join(', ')}`;
  }
  
  // Additional Context (Tell us more)
  if (userPreferences.additionalContext && userPreferences.additionalContext.trim()) {
    preferencesSection += `\n- Additional preferences and context: ${userPreferences.additionalContext}`;
  }
  
  // Add special request section
  let specialRequestSection = '';
  if (specialRequest && specialRequest.trim()) {
    specialRequestSection = `\n\nSPECIAL REQUEST: ${specialRequest.trim()}
Please incorporate this request into the recipe while maintaining the other constraints.`;
  }
  
  // Variety prompts to ensure different recipes
  const varietyPrompts = [
    `Try featuring ${randomIngredient} as a main component with ${randomFlavorProfile} flavors.`,
    `Focus on ${randomCookingMethod} as the primary cooking technique.`,
    `Create something with ${randomFlavorProfile} inspiration using ${randomCookingMethod}.`,
    `Build around ${randomIngredient} with a ${randomFlavorProfile} twist.`,
    `Emphasize ${randomCookingMethod} techniques for a ${randomFlavorProfile} dish.`
  ];
  const selectedVarietyPrompt = varietyPrompts[Math.floor(Math.random() * varietyPrompts.length)];
  
  return `Generate a completely unique and delicious dinner recipe. Make sure this recipe is DIFFERENT from any previous recipes you may have generated. Create something creative and flavorful that matches the user's preferences.${specialRequestSection}

UNIQUENESS REQUIREMENT: This must be a fresh, original recipe. ${selectedVarietyPrompt} Be creative and avoid common, predictable combinations.

Session ID: ${timestamp}-${randomSeed}

CONSTRAINTS:
- Cooking time: Under 45 minutes maximum
- Serves exactly ${numberOfPeople} ${numberOfPeople === '1' ? 'person' : 'people'}
- All ingredients must be common and easily available
- Simple, recognizable recipe name (avoid overly complex names)
- Suitable for weekday dinner
${dietaryConstraint ? `- Must be ${dietaryConstraint}` : ''}${preferencesSection}

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read filter parameters from request body
    const requestBody = await req.json().catch(() => ({}));
    const { dietaryPreference, numberOfPeople, specialRequest, userId } = requestBody;

    // Fetch user preferences if userId is provided
    let userPreferences = {};
    if (userId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('kitchen_equipment, preferred_cuisines, additional_context, cooking_experience, dietary_restrictions, protein_preferences')
          .eq('user_id', userId)
          .single();
        
        if (profile) {
          userPreferences = {
            kitchenEquipment: profile.kitchen_equipment || [],
            preferredCuisines: profile.preferred_cuisines || [],
            additionalContext: profile.additional_context,
            cookingExperience: profile.cooking_experience,
            dietaryRestrictions: profile.dietary_restrictions,
            proteinPreferences: profile.protein_preferences || []
          };
        }
      } catch (error) {
        console.log('Could not fetch user preferences:', error.message);
      }
    }

    console.log('Generating recipe with Claude API...');
    console.log('Filter parameters:', { dietaryPreference, numberOfPeople, userPreferences });

    const dynamicPrompt = generateRecipePrompt(dietaryPreference, numberOfPeople, specialRequest, userPreferences);
    console.log('Generated personalized prompt with user preferences');

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