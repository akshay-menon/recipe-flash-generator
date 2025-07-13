import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Clock, Users, ChefHat, Filter, LogOut, User, BookOpen, Heart, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
const sampleRecipe = {
  name: "Honey Garlic Chicken with Rice",
  cookingTime: "35 minutes",
  serves: "2 people",
  ingredients: ["2 chicken breasts (boneless, skinless)", "1 cup jasmine rice", "3 tablespoons honey", "4 cloves garlic (minced)", "2 tablespoons soy sauce", "1 tablespoon olive oil", "1 green onion (chopped)"],
  instructions: ["Cook jasmine rice according to package instructions. Set aside and keep warm.", "Season chicken breasts with salt and pepper. Heat olive oil in a large skillet over medium-high heat.", "Cook chicken for 6-7 minutes per side until golden brown and cooked through. Remove and slice.", "In the same skillet, add minced garlic and cook for 30 seconds until fragrant.", "Add honey and soy sauce, stirring to combine. Let it simmer for 2-3 minutes until thickened.", "Return sliced chicken to the skillet, toss with the honey garlic sauce, and serve over rice. Garnish with green onions."]
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
  let calories = '';
  let protein = '';
  let carbs = '';
  let fat = '';
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
    } else if (trimmedLine.includes('**Nutritional Information (per person):**')) {
      currentSection = 'nutrition';
    } else if (trimmedLine.includes('**Ingredients:**')) {
      currentSection = 'ingredients';
    } else if (trimmedLine.includes('**Instructions:**')) {
      currentSection = 'instructions';
    } else if (currentSection === 'nutrition' && trimmedLine.startsWith('- Calories:')) {
      calories = trimmedLine.replace('- Calories:', '').trim();
    } else if (currentSection === 'nutrition' && trimmedLine.startsWith('- Protein:')) {
      protein = trimmedLine.replace('- Protein:', '').trim();
    } else if (currentSection === 'nutrition' && trimmedLine.startsWith('- Carbs:')) {
      carbs = trimmedLine.replace('- Carbs:', '').trim();
    } else if (currentSection === 'nutrition' && trimmedLine.startsWith('- Fat:')) {
      fat = trimmedLine.replace('- Fat:', '').trim();
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
    nutrition: {
      calories: calories || 'N/A',
      protein: protein || 'N/A',
      carbs: carbs || 'N/A',
      fat: fat || 'N/A'
    },
    ingredients,
    instructions,
    imageUrl: undefined as string | undefined
  };
};
const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [parsedRecipe, setParsedRecipe] = useState<any>(null);
  const [dietaryPreference, setDietaryPreference] = useState('non-vegetarian');
  const [numberOfPeople, setNumberOfPeople] = useState('2');
  const [specialRequest, setSpecialRequest] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showProfileBanner, setShowProfileBanner] = useState(true);
  const { toast } = useToast();
  const { user, signOut, loading } = useAuth();
  const { isProfileComplete, loading: profileLoading } = useProfileCompletion();

  const placeholders = [
    "I feel like pasta tonight...",
    "I have salmon in my fridge to use up...",
    "Something quick and easy...",
    "Craving something spicy...",
    "Looking for comfort food...",
    "Want to try something new...",
    "Need to use up leftover chicken..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const generateRecipe = async () => {
    setIsLoading(true);
    setApiError('');
    setParsedRecipe(null);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-recipe', {
        body: {
          dietaryPreference,
          numberOfPeople,
          specialRequest,
          userId: user?.id
        }
      });
      if (error) {
        throw new Error(error.message || 'Failed to generate recipe');
      }
      if (data?.recipe) {
        const parsed = parseRecipeResponse(data.recipe);
        if (data?.imageUrl) {
          parsed.imageUrl = data.imageUrl;
        }
        setParsedRecipe(parsed);
        toast({
          title: "Recipe Generated!",
          description: "Your new recipe is ready to cook."
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
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipe = async () => {
    if (!user) {
      toast({
        title: "Sign Up Required",
        description: "You need to sign up to save recipes.",
        variant: "destructive"
      });
      return;
    }

    if (!parsedRecipe) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('saved_recipes')
        .insert({
          user_id: user.id,
          recipe_name: parsedRecipe.name,
          cooking_time: parsedRecipe.cookingTime,
          serves: parsedRecipe.serves,
          ingredients: parsedRecipe.ingredients,
          instructions: parsedRecipe.instructions,
          nutrition: parsedRecipe.nutrition,
          image_url: parsedRecipe.imageUrl
        });

      if (error) throw error;

      toast({
        title: "Recipe Saved!",
        description: "Recipe has been added to your saved recipes."
      });
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ChefHat className="w-12 h-12 text-orange-600 mx-auto animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <div className="bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="w-8 h-8 text-orange-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Weeknight dinners, sorted</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-md mx-auto">Simple, healthy dinner recipes</p>
          
          {/* User Status */}
          {!user && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Link to="/auth">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Sign In / Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Profile Completion Banner */}
        {user && !profileLoading && isProfileComplete === false && showProfileBanner && (
          <ProfileCompletionBanner onDismiss={() => setShowProfileBanner(false)} />
        )}

        {/* Recipe Preferences */}
        <Card className="mb-6 bg-white shadow-lg rounded-xl border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Recipe Preferences</h3>
            </div>
            
            <div className="space-y-6">
              {/* Dietary Preference */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dietary Preference</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
                    { value: 'non-vegetarian', label: 'Non-vegetarian', emoji: '🍗' },
                    { value: 'vegan', label: 'Vegan', emoji: '🌱' }
                  ].map((option) => {
                    const isSelected = dietaryPreference === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setDietaryPreference(option.value)}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg
                          transition-all duration-200 hover:scale-105 active:scale-95 select-none
                          ${isSelected 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                            : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground border border-input'
                          }
                        `}
                      >
                        <span className="text-base">{option.emoji}</span>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number of People */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Number of People</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNumberOfPeople(Math.max(1, parseInt(numberOfPeople) - 1).toString())}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    disabled={parseInt(numberOfPeople) <= 1}
                  >
                    −
                  </button>
                  <span className="text-lg font-medium min-w-[2rem] text-center">
                    {numberOfPeople}
                  </span>
                  <button
                    onClick={() => setNumberOfPeople(Math.min(8, parseInt(numberOfPeople) + 1).toString())}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    disabled={parseInt(numberOfPeople) >= 8}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div className="my-6 border-t border-gray-200"></div>

            {/* Special Requests Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h4 className="text-lg font-semibold text-gray-800">Anything specific in mind?</h4>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Special Requests (optional)</label>
                <Input
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  placeholder={placeholders[placeholderIndex]}
                  className="w-full transition-all duration-300"
                />
                <p className="text-xs text-gray-500">
                  Tell us what you're craving, ingredients you want to use, or any specific preferences
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Recipe Section */}
        <Card className="mb-8 bg-white shadow-lg rounded-xl border-0">
          <CardContent className="p-6">
            <div className="text-center">
              <Button onClick={generateRecipe} disabled={isLoading} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-md transition-all duration-300">
                {isLoading ? <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Recipe...
                  </div> : "Generate New Recipe"}
              </Button>
              
              {!user && (
                <p className="text-sm text-gray-600 mt-4">
                  <Link to="/auth" className="text-blue-600 hover:underline">
                    Sign up
                  </Link>{" "}
                  to save your favorite recipes and personalize your experience!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recipe Display */}
        {parsedRecipe && <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-0 mb-8">
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
            
            {/* Recipe Image */}
            {parsedRecipe.imageUrl && (
              <div className="px-8 pt-6">
                <img 
                  src={parsedRecipe.imageUrl} 
                  alt={parsedRecipe.name}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
            
            <ScrollArea className="h-96 w-full">
              <CardContent className="p-8">
                {/* Nutritional Information Section */}
                {parsedRecipe.nutrition && <div className="mb-8 bg-green-50 rounded-lg p-6 border border-green-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 text-left">
                      Nutritional Information (per person)
                    </h3>
                    <div className="space-y-3">
                      <div className="text-lg font-medium text-green-700">
                        {parsedRecipe.nutrition.calories}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                        <div className="flex items-center">
                          <span className="font-medium">Protein:</span>
                          <span className="ml-2">{parsedRecipe.nutrition.protein}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Carbs:</span>
                          <span className="ml-2">{parsedRecipe.nutrition.carbs}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Fat:</span>
                          <span className="ml-2">{parsedRecipe.nutrition.fat}</span>
                        </div>
                      </div>
                    </div>
                  </div>}

                {/* Ingredients Section */}
                {parsedRecipe.ingredients.length > 0 && <div className="mb-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                      Ingredients
                    </h3>
                    <ul className="space-y-3">
                      {parsedRecipe.ingredients.map((ingredient: string, index: number) => <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-700 text-lg">{ingredient}</span>
                        </li>)}
                    </ul>
                  </div>}

                {/* Instructions Section */}
                {parsedRecipe.instructions.length > 0 && <div className="mb-8">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                      Instructions
                    </h3>
                    <ol className="space-y-4">
                      {parsedRecipe.instructions.map((instruction: string, index: number) => <li key={index} className="flex items-start">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold mr-4 flex-shrink-0 mt-1">
                            {index + 1}
                          </span>
                          <span className="text-gray-700 text-lg leading-relaxed">{instruction}</span>
                        </li>)}
                    </ol>
                  </div>}
              </CardContent>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-center gap-4">
                <Button 
                  onClick={user ? saveRecipe : () => window.location.href = '/auth'}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <>
                      <Heart className="w-4 h-4" />
                      Save Recipe
                    </>
                  )}
                </Button>
                <Button onClick={generateRecipe} disabled={isLoading} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 font-semibold rounded-lg shadow-md transition-all duration-300">
                  {isLoading ? <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div> : "Generate Another Recipe"}
                </Button>
              </div>
              
              {!user && (
                <p className="text-sm text-gray-600 mt-4 text-center">
                  <Link to="/auth" className="text-blue-600 hover:underline">
                    Sign up
                  </Link>{" "}
                  to save your favorite recipes!
                </p>
              )}
            </div>
          </Card>}

        {/* Error Display */}
        {apiError && <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-0 mb-8">
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
                <Button onClick={generateRecipe} disabled={isLoading} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 font-semibold rounded-lg shadow-md transition-all duration-300">
                  {isLoading ? <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div> : "Try Again"}
                </Button>
              </div>
            </CardContent>
          </Card>}


        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Happy cooking! 👨‍🍳</p>
        </div>
      </div>
    </div>;
};
export default Index;