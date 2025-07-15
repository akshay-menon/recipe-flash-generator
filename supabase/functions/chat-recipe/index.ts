import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const generateChatPrompt = (messages: Message[], exchangeNumber: number, userInput: string) => {
  if (exchangeNumber === 1) {
    return `Analyze this recipe request: ${userInput}

If the request is clear enough to generate a recipe immediately, generate it.
If not, ask 1-2 specific clarifying questions to help create the recipe.
Focus on the most important missing details:

Type of dish/component unclear? Ask for clarification
Cooking method preferences? Ask briefly
Dietary restrictions relevant? Check quickly

Keep questions focused and recipe-oriented. Aim to generate a recipe within 2 exchanges maximum.`;
  } else if (exchangeNumber === 2) {
    const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    return `Based on previous conversation:
${conversationHistory}

Now generate a complete recipe. Even if some details aren't perfect, create a good recipe that addresses the user's core request. Include:

Recipe name
Ingredients with quantities
Step-by-step instructions
Cooking time
Serves X people

Format this as a structured recipe card.`;
  } else {
    // Exchange 3+ - recipe modification mode
    const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    return `Based on our previous conversation:
${conversationHistory}

User's new request: ${userInput}

Please help modify or adjust the recipe based on this new request. Keep the core recipe structure but make the requested changes.`;
  }
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

    return new Response(JSON.stringify({ 
      response: responseText,
      exchangeNumber
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