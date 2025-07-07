
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Users, ChefHat, Key } from 'lucide-react';

const sampleRecipe = {
  name: "Honey Garlic Chicken with Rice",
  cookingTime: "35 minutes",
  serves: "2 people",
  ingredients: [
    "2 chicken breasts (boneless, skinless)",
    "1 cup jasmine rice",
    "3 tablespoons honey",
    "4 cloves garlic (minced)",
    "2 tablespoons soy sauce",
    "1 tablespoon olive oil",
    "1 green onion (chopped)"
  ],
  instructions: [
    "Cook jasmine rice according to package instructions. Set aside and keep warm.",
    "Season chicken breasts with salt and pepper. Heat olive oil in a large skillet over medium-high heat.",
    "Cook chicken for 6-7 minutes per side until golden brown and cooked through. Remove and slice.",
    "In the same skillet, add minced garlic and cook for 30 seconds until fragrant.",
    "Add honey and soy sauce, stirring to combine. Let it simmer for 2-3 minutes until thickened.",
    "Return sliced chicken to the skillet, toss with the honey garlic sauce, and serve over rice. Garnish with green onions."
  ]
};

const recipePrompt = `Generate a complete dinner recipe that meets these specific requirements:

CONSTRAINTS:
- Cooking time: 30-45 minutes maximum
- Serves exactly 2 people
- Uses only common ingredients (no exotic or hard-to-find items)
- Must include protein + vegetables + carbs for balanced nutrition
- Suitable for weekday dinner (not overly complex)

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

Generate a recipe now.`;

const parseRecipeResponse = (response: string) => {
  const lines = response.split('\n').filter(line => line.trim());
  
  let recipeName = '';
  let cookingTime = '';
  let serves = '';
  const ingredients: string[] = [];
  const instructions: string[] = [];
  
  let currentSection = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('**Recipe Name:**')) {
      recipeName = trimmedLine.replace('**Recipe Name:**', '').trim();
    } else if (trimmedLine.includes('**Cooking Time:**')) {
      cookingTime = trimmedLine.replace('**Cooking Time:**', '').trim();
    } else if (trimmedLine.includes('**Serves:**')) {
      serves = trimmedLine.replace('**Serves:**', '').trim();
    } else if (trimmedLine.includes('**Ingredients:**')) {
      currentSection = 'ingredients';
    } else if (trimmedLine.includes('**Instructions:**')) {
      currentSection = 'instructions';
    } else if (currentSection === 'ingredients' && trimmedLine.startsWith('-')) {
      ingredients.push(trimmedLine.substring(1).trim());
    } else if (currentSection === 'instructions' && /^\d+\./.test(trimmedLine)) {
      instructions.push(trimmedLine.replace(/^\d+\.\s*/, '').trim());
    }
  }
  
  return {
    name: recipeName || 'Generated Recipe',
    cookingTime: cookingTime || '30-45 minutes',
    serves: serves || '2 people',
    ingredients,
    instructions
  };
};

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isTestingAPI, setIsTestingAPI] = useState(false);
  const [apiResponse, setApiResponse] = useState('');
  const [apiError, setApiError] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<any>(null);

  const generateRecipe = async () => {
    setIsLoading(true);
    setShowRecipe(false);
    setApiResponse('');
    setApiError('');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setApiResponse('API integration coming next! Recipe generation will be implemented in the next step.');
  };

  const generateAnother = async () => {
    setIsLoading(true);
    setApiResponse('');
    setApiError('');
    setParsedRecipe(null);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setApiResponse('API integration coming next! Recipe generation will be implemented in the next step.');
  };

  const testAPIConnection = async () => {
    if (!apiKey.trim()) {
      setApiError('Please enter your API key');
      setApiResponse('');
      setShowRecipe(false);
      setParsedRecipe(null);
      return;
    }

    setIsTestingAPI(true);
    setApiError('');
    setApiResponse('');
    setShowRecipe(false);
    setParsedRecipe(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: recipePrompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.content?.[0]?.text || 'API connected successfully but no response text found';
      setApiResponse(responseText);
      
      // Parse the recipe response
      const parsed = parseRecipeResponse(responseText);
      setParsedRecipe(parsed);
    } catch (error) {
      console.error('API test failed:', error);
      if (error instanceof Error) {
        setApiError(`API call failed: ${error.message}`);
      } else {
        setApiError('API call failed with unknown error');
      }
    } finally {
      setIsTestingAPI(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="w-8 h-8 text-orange-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Recipe Generator</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Discover delicious recipes with just one click. Perfect for when you're not sure what to cook!
          </p>
        </div>

        {/* API Configuration */}
        <Card className="mb-8 bg-white shadow-lg rounded-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Key className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">API Configuration</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="password"
                placeholder="Enter your Claude API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={testAPIConnection}
                disabled={isTestingAPI}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isTestingAPI ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  "Generate Recipe"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recipe Display */}
        {parsedRecipe && (
          <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-0 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <h2 className="text-3xl font-bold mb-2">{parsedRecipe.name}</h2>
              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>{parsedRecipe.cookingTime}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  <span>{parsedRecipe.serves}</span>
                </div>
              </div>
            </div>
            
            <ScrollArea className="max-h-96">
              <CardContent className="p-8">
                {/* Ingredients Section */}
                {parsedRecipe.ingredients.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                      Ingredients
                    </h3>
                    <ul className="space-y-3">
                      {parsedRecipe.ingredients.map((ingredient: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700 text-lg">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instructions Section */}
                {parsedRecipe.instructions.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                      Instructions
                    </h3>
                    <ol className="space-y-4">
                      {parsedRecipe.instructions.map((instruction: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold mr-4 flex-shrink-0 mt-1">
                            {index + 1}
                          </span>
                          <span className="text-gray-700 text-lg leading-relaxed">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </CardContent>
            </ScrollArea>

            {/* Generate Another Button */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-center">
                <Button
                  onClick={testAPIConnection}
                  disabled={isTestingAPI}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 font-semibold rounded-lg shadow-md transition-all duration-300"
                >
                  {isTestingAPI ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    "Generate Another Recipe"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Error Display */}
        {apiError && (
          <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-0 mb-8">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Recipe Generation Failed</h2>
            </div>
            
            <CardContent className="p-8">
              <div className="mb-6">
                <p className="text-lg leading-relaxed text-red-700">
                  {apiError}
                </p>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <Button
                  onClick={testAPIConnection}
                  disabled={isTestingAPI}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 font-semibold rounded-lg shadow-md transition-all duration-300"
                >
                  {isTestingAPI ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    "Try Again"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recipe Display (existing functionality) */}
        {showRecipe && (
          <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-0">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <h2 className="text-3xl font-bold mb-2">{sampleRecipe.name}</h2>
              <div className="flex items-center space-x-6 text-green-100">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>{sampleRecipe.cookingTime}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  <span>{sampleRecipe.serves}</span>
                </div>
              </div>
            </div>
            
            <CardContent className="p-8">
              {/* Ingredients Section */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                  Ingredients
                </h3>
                <ul className="space-y-3">
                  {sampleRecipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span className="text-gray-700 text-lg">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions Section */}
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                  Instructions
                </h3>
                <ol className="space-y-4">
                  {sampleRecipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full font-semibold mr-4 flex-shrink-0 mt-1">
                        {index + 1}
                      </span>
                      <span className="text-gray-700 text-lg leading-relaxed">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Generate Another Button */}
              <div className="text-center pt-4 border-t border-gray-200">
                <Button
                  onClick={generateAnother}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 font-semibold rounded-lg shadow-md transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    "Generate Another Recipe"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Happy cooking! 👨‍🍳</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
