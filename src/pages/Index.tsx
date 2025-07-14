import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, Users, ChefHat, Filter, LogOut, User, BookOpen, Heart, Sparkles, ChevronDown, Edit3, RotateCcw, Send } from 'lucide-react';
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
  const [isPreferencesExpanded, setIsPreferencesExpanded] = useState(true);
  const [recipeModification, setRecipeModification] = useState('');
  const [modificationPlaceholderIndex, setModificationPlaceholderIndex] = useState(0);
  const [isModifying, setIsModifying] = useState(false);
  const [modificationNote, setModificationNote] = useState('');
  const [userProfile, setUserProfile] = useState<{ name: string | null }>({ name: null });
  const [rotatingHeadingIndex] = useState(() => Math.floor(Math.random() * 5));
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

  const modificationPlaceholders = [
    "Swap salmon for cod...",
    "What can I use instead of sichuan pepper?",
    "Make this dairy-free...",
    "Can I use chicken instead of beef?",
    "I don't have pine nuts...",
    "Make this spicier..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setModificationPlaceholderIndex((prev) => (prev + 1) % modificationPlaceholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', user.id)
            .single();

          if (!error && data) {
            setUserProfile({ name: data.name });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Helper function to get dietary preference emoji only
  const getDietaryPreferenceEmoji = () => {
    const options = [
      { value: 'vegan', emoji: '🌱' },
      { value: 'vegetarian', emoji: '🥬' },
      { value: 'non-vegetarian', emoji: '🍗' }
    ];
    const option = options.find(opt => opt.value === dietaryPreference);
    return option?.emoji || '';
  };

  // Helper function to get rotating heading
  const getRotatingHeading = () => {
    const userName = userProfile.name;
    const headingsWithName = [
      `Let's make something tasty, ${userName}!`,
      `What's cooking today, ${userName}?`,
      `Time to feed you well, ${userName}`,
      `Ready for dinner magic, ${userName}?`,
      `Let's cook up something great, ${userName}!`
    ];
    
    const headingsWithoutName = [
      "Let's make something tasty!",
      "What's cooking today?",
      "Time to feed you well",
      "Ready for dinner magic?",
      "Let's cook up something great!"
    ];
    
    const headings = userName ? headingsWithName : headingsWithoutName;
    return headings[rotatingHeadingIndex] || headings[0];
  };
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
        // Auto-collapse preferences after successful generation
        setIsPreferencesExpanded(false);
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

  const modifyRecipe = async () => {
    if (!recipeModification.trim() || !parsedRecipe) return;

    setIsModifying(true);
    try {
      const modificationPrompt = `You are a culinary expert. Please make ONLY the specific modification requested to this recipe. Keep everything else exactly the same unless the change requires essential adjustments.

CURRENT RECIPE:
**Recipe Name:** ${parsedRecipe.name}
**Cooking Time:** ${parsedRecipe.cookingTime}
**Ingredients:**
${parsedRecipe.ingredients.map(ing => `- ${ing}`).join('\n')}
**Instructions:**
${parsedRecipe.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}
**Serves:** ${parsedRecipe.serves}

MODIFICATION REQUEST: ${recipeModification}

IMPORTANT RULES:
- Make ONLY the specific change requested
- Keep the same cooking method unless the change requires it
- Preserve other ingredients unless they conflict with the modification
- Only adjust cooking time if the modification requires it
- Keep the same serving size
- Maintain the same recipe structure and format
- For ingredient swaps: only change that ingredient and adjust method if needed
- For missing ingredients: suggest substitutes without changing the whole recipe
- For dietary modifications: make minimal changes to accommodate the restriction

Please provide the modified recipe in the exact same format, and at the end add:
**What was modified:** [Brief description of what changed]

Format your response exactly like the original recipe format.`;

      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: {
          dietaryPreference: 'custom',
          numberOfPeople: parsedRecipe.serves.match(/\d+/)?.[0] || '2',
          specialRequest: modificationPrompt,
          userId: user?.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to modify recipe');
      }

      if (data?.recipe) {
        const parsed = parseRecipeResponse(data.recipe);
        if (data?.imageUrl) {
          parsed.imageUrl = data.imageUrl;
        }
        
        // Extract modification note
        const modificationMatch = data.recipe.match(/\*\*What was modified:\*\*\s*(.+)/i);
        if (modificationMatch) {
          setModificationNote(modificationMatch[1].trim());
        }
        
        setParsedRecipe(parsed);
        setRecipeModification('');
        
        toast({
          title: "Recipe Modified!",
          description: "Your recipe has been updated with the requested changes."
        });
      } else {
        throw new Error('No modified recipe data received');
      }
    } catch (error) {
      console.error('Recipe modification failed:', error);
      toast({
        title: "Modification Failed",
        description: "Sorry, we couldn't modify the recipe right now.",
        variant: "destructive"
      });
    } finally {
      setIsModifying(false);
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

  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight px-4">
              {getRotatingHeading()}
            </h1>
          </div>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            AI recipes that fit your life and taste
          </p>
        </div>

        {/* Profile Completion Banner */}
        {user && !profileLoading && isProfileComplete === false && showProfileBanner && (
          <ProfileCompletionBanner onDismiss={() => setShowProfileBanner(false)} />
        )}

        {/* Recipe Preferences */}
        <Card className="mb-8 overflow-hidden">
          <Collapsible open={isPreferencesExpanded} onOpenChange={setIsPreferencesExpanded}>
            {/* Collapsed Summary View */}
            {!isPreferencesExpanded && (
              <div className="p-6 bg-gradient-to-r from-muted to-accent/10 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Filter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Dietary Preference Chip - Emoji Only */}
                      <div className="flex items-center justify-center w-12 h-12 bg-card rounded-card border-2 border-border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                        <span className="text-lg">{getDietaryPreferenceEmoji()}</span>
                      </div>
                      
                      {/* Number of People Chip - Number Only */}
                      <div className="flex items-center justify-center w-12 h-12 bg-card rounded-card border-2 border-border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                        <span className="text-sm font-semibold text-foreground">{numberOfPeople}</span>
                      </div>
                      
                      {/* Special Request Chip - Thinking Emoji Only if Request Exists */}
                      {specialRequest && (
                        <div className="flex items-center justify-center w-12 h-12 bg-card rounded-card border-2 border-border shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                          <span className="text-lg">💭</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Edit Button */}
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="ml-4 flex-shrink-0"
                    >
                      <span className="mr-2">✏️</span>
                      Edit
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            )}

            {/* Expanded Full Form */}
            <CollapsibleContent className="transition-all duration-300 ease-in-out">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Filter className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Recipe Preferences</h3>
                  <div className="flex-1"></div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isPreferencesExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <div className="space-y-8">
                  {/* Dietary Preference */}
                  <div className="space-y-3">
                    <label className="text-base font-medium text-foreground">Dietary Preference</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: 'vegan', label: 'Vegan', emoji: '🌱' },
                        { value: 'vegetarian', label: 'Veg', emoji: '🥬' },
                        { value: 'non-vegetarian', label: 'Non-veg', emoji: '🍗' }
                      ].map((option) => {
                        const isSelected = dietaryPreference === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setDietaryPreference(option.value)}
                            className={`
                              inline-flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-button
                              transition-all duration-300 hover:scale-105 active:scale-95 select-none
                              ${isSelected 
                                ? 'bg-gradient-primary text-primary-foreground shadow-primary' 
                                : 'bg-card text-foreground hover:bg-accent hover:text-accent-foreground border border-border shadow-sm'
                              }
                            `}
                          >
                            <span className="text-lg">{option.emoji}</span>
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Number of People */}
                  <div className="space-y-3">
                    <label className="text-base font-medium text-foreground">Number of People</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setNumberOfPeople(Math.max(1, parseInt(numberOfPeople) - 1).toString())}
                        className="flex items-center justify-center w-12 h-12 rounded-card border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        disabled={parseInt(numberOfPeople) <= 1}
                      >
                        −
                      </button>
                      <span className="text-xl font-semibold min-w-[2.5rem] text-center text-foreground">
                        {numberOfPeople}
                      </span>
                      <button
                        onClick={() => setNumberOfPeople(Math.min(8, parseInt(numberOfPeople) + 1).toString())}
                        className="flex items-center justify-center w-12 h-12 rounded-card border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        disabled={parseInt(numberOfPeople) >= 8}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="my-8 border-t border-border"></div>

                {/* Special Requests Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-accent" />
                    <h4 className="text-xl font-semibold text-foreground">Anything specific in mind?</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-base font-medium text-foreground">Special Requests (optional)</label>
                    <Input
                      value={specialRequest}
                      onChange={(e) => setSpecialRequest(e.target.value)}
                      placeholder={placeholders[placeholderIndex]}
                      className="w-full transition-all duration-300"
                    />
                    <p className="text-sm text-muted-foreground">
                      Tell us what you're craving, ingredients you want to use, or any specific preferences
                    </p>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Generate Recipe Section - Only show when no recipe is generated */}
        {!parsedRecipe && (
          <Card className="mb-12">
            <CardContent className="p-8">
              <div className="text-center">
                <Button 
                  onClick={generateRecipe} 
                  disabled={isLoading} 
                  size="lg"
                  className="px-10 py-4 text-lg font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Generating Recipe...
                    </div>
                  ) : (
                    "Let's get cooking 👩‍🍳"
                  )}
                </Button>
                
                {!user && (
                  <p className="text-base text-muted-foreground mt-6">
                    <Link to="/auth" className="text-primary hover:underline font-medium">
                      Sign up
                    </Link>{" "}
                    to save your favorite recipes and personalize your experience!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recipe Display */}
        {parsedRecipe && <Card className="overflow-hidden mb-8">
            <div className="bg-gradient-primary p-8 text-primary-foreground">
              <h2 className="text-4xl font-bold mb-4">{parsedRecipe.name}</h2>
              {modificationNote && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-primary-foreground rounded-card text-sm font-medium mb-4">
                  <span>✨</span>
                  <span>Modified: {modificationNote}</span>
                </div>
              )}
              <div className="flex items-center space-x-8 text-primary-foreground/90">
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
              <div className="px-8 pt-8">
                <img 
                  src={parsedRecipe.imageUrl} 
                  alt={parsedRecipe.name}
                  className="w-full h-64 object-cover rounded-card shadow-card"
                />
              </div>
            )}
            
            <ScrollArea className="h-96 w-full">
              <CardContent className="p-8">
                {/* Nutritional Information Section */}
                {parsedRecipe.nutrition && <div className="mb-8 bg-secondary/10 rounded-card p-8 border border-secondary/20">
                    <h3 className="text-2xl font-semibold text-foreground mb-6 text-left">
                      Nutritional Information (per person)
                    </h3>
                    <div className="space-y-4">
                      <div className="text-xl font-medium text-secondary">
                        {parsedRecipe.nutrition.calories}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base text-foreground">
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
                {parsedRecipe.ingredients.length > 0 && <div className="mb-10">
                    <h3 className="text-3xl font-semibold text-foreground mb-6 border-b-2 border-accent/30 pb-3">
                      Ingredients
                    </h3>
                    <ul className="space-y-4">
                      {parsedRecipe.ingredients.map((ingredient: string, index: number) => <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-4 flex-shrink-0"></span>
                          <span className="text-foreground text-lg">{ingredient}</span>
                        </li>)}
                    </ul>
                  </div>}

                {/* Instructions Section */}
                {parsedRecipe.instructions.length > 0 && <div className="mb-10">
                    <h3 className="text-3xl font-semibold text-foreground mb-6 border-b-2 border-accent/30 pb-3">
                      Instructions
                    </h3>
                    <ol className="space-y-6">
                      {parsedRecipe.instructions.map((instruction: string, index: number) => <li key={index} className="flex items-start">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-full font-semibold mr-6 flex-shrink-0 mt-1">
                            {index + 1}
                          </span>
                          <span className="text-foreground text-lg leading-relaxed">{instruction}</span>
                        </li>)}
                    </ol>
                  </div>}
              </CardContent>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="p-8 border-t border-border bg-muted/30">
              {/* Recipe Modification Input */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✨</span>
                  <label className="text-sm font-medium text-foreground">
                    Quick modifications
                  </label>
                </div>
                <div className="relative flex items-center">
                  <Input
                    value={recipeModification}
                    onChange={(e) => setRecipeModification(e.target.value)}
                    placeholder={modificationPlaceholders[modificationPlaceholderIndex]}
                    className="w-full pr-12 transition-all duration-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && recipeModification.trim() && !isModifying) {
                        modifyRecipe();
                      }
                    }}
                  />
                  {recipeModification.trim() && (
                    <Button
                      onClick={modifyRecipe}
                      disabled={isModifying}
                      variant="default"
                      size="icon"
                      className="absolute right-1 h-8 w-8 rounded-full"
                      title="Modify Recipe"
                    >
                      {isModifying ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Request specific modifications to the recipe
                </p>
              </div>

              {/* Icon Action Buttons */}
              <div className="flex items-center justify-center gap-8">
                {/* Save Recipe Button */}
                <div className="flex flex-col items-center">
                  <Button 
                    onClick={user ? saveRecipe : () => window.location.href = '/auth'}
                    disabled={isSaving}
                    className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-primary hover:shadow-accent transition-all duration-300 p-0 flex items-center justify-center hover:scale-105"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-destructive-foreground"></div>
                    ) : (
                      <Heart className="w-6 h-6" fill="currentColor" />
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground mt-3 font-medium">Save</span>
                </div>

                {/* Generate Another Recipe Button */}
                <div className="flex flex-col items-center">
                  <Button 
                    onClick={generateRecipe} 
                    disabled={isLoading} 
                    variant="secondary"
                    className="w-16 h-16 rounded-full shadow-secondary hover:shadow-accent transition-all duration-300 p-0 flex items-center justify-center hover:scale-105"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary-foreground"></div>
                    ) : (
                      <RotateCcw className="w-6 h-6" />
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground mt-3 font-medium">Fresh Recipe</span>
                </div>
              </div>
              
              {!user && (
                <p className="text-sm text-muted-foreground mt-8 text-center">
                  <Link to="/auth" className="text-primary hover:underline">
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


        {/* Footer - Only show after recipe is generated */}
        {parsedRecipe && (
          <div className="text-center mt-12 text-gray-500">
            <p>Happy cooking! 👨‍🍳</p>
          </div>
        )}
      </div>
    </div>;
};
export default Index;