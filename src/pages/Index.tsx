
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Users, ChefHat, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [apiError, setApiError] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<any>(null);
  const [dietaryPreference, setDietaryPreference] = useState('non-vegetarian');
  const [cookingTime, setCookingTime] = useState('under-30');
  const [numberOfPeople, setNumberOfPeople] = useState('2');
  const { toast } = useToast();

  const generateRecipe = async () => {
    setIsLoading(true);
    setApiError('');
    setParsedRecipe(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: {
          dietaryPreference,
          cookingTime,
          numberOfPeople
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to generate recipe');
      }

      if (data?.recipe) {
        const parsed = parseRecipeResponse(data.recipe);
        setParsedRecipe(parsed);
        toast({
          title: "Recipe Generated!",
          description: "Your new recipe is ready to cook.",
        });
      } else {
        throw new Error('No recipe data received');
      }
    } catch (error) {
      console.error('Recipe generation failed:', error);
      setApiError(error instanceof Error ? error.message : 'Recipe generation failed');
      toast({
        title: "Generation Failed",
        description: "Sorry, we couldn't generate a recipe right now.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

        {/* Recipe Filters */}
        <Card className="mb-6 bg-white shadow-lg rounded-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Recipe Preferences</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dietary Preference */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dietary Preference</label>
                <Select value={dietaryPreference} onValueChange={setDietaryPreference}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="non-vegetarian">Non-vegetarian</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cooking Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cooking Time</label>
                <Select value={cookingTime} onValueChange={setCookingTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-30">Under 30 minutes</SelectItem>
                    <SelectItem value="under-45">Under 45 minutes</SelectItem>
                    <SelectItem value="under-60">Under 1 hour</SelectItem>
                    <SelectItem value="over-60">More than 1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Number of People */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Number of People</label>
                <Select value={numberOfPeople} onValueChange={setNumberOfPeople}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 person</SelectItem>
                    <SelectItem value="2">2 people</SelectItem>
                    <SelectItem value="3">3 people</SelectItem>
                    <SelectItem value="4">4 people</SelectItem>
                    <SelectItem value="5">5 people</SelectItem>
                    <SelectItem value="6">6 people</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Recipe Section */}
        <Card className="mb-8 bg-white shadow-lg rounded-xl border-0">
          <CardContent className="p-6">
            <div className="text-center">
              <Button
                onClick={generateRecipe}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-md transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Recipe...
                  </div>
                ) : (
                  "Generate New Recipe"
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
            
            <ScrollArea className="h-96 w-full">
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
                  onClick={generateRecipe}
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
                  onClick={generateRecipe}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 font-semibold rounded-lg shadow-md transition-all duration-300"
                >
                  {isLoading ? (
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


        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Happy cooking! 👨‍🍳</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
