import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChefHat, Clock, Users, Trash2, ArrowLeft, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SavedRecipe {
  id: string;
  recipe_name: string;
  cooking_time: string;
  serves: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  image_url?: string;
  created_at: string;
}

const SavedRecipes = () => {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchSavedRecipes();
    }
  }, [user]);

  const fetchSavedRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type the data correctly by casting the JSONB fields
      const typedData = (data || []).map(recipe => ({
        ...recipe,
        ingredients: recipe.ingredients as string[],
        instructions: recipe.instructions as string[],
        nutrition: recipe.nutrition as SavedRecipe['nutrition']
      }));

      setSavedRecipes(typedData);
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      toast({
        title: "Error",
        description: "Failed to load saved recipes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;

      setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      setSelectedRecipe(null);
      
      toast({
        title: "Recipe Deleted",
        description: "Recipe has been removed from your saved recipes."
      });
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast({
        title: "Error",
        description: "Failed to delete recipe.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">You need to sign in to view your saved recipes.</p>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ChefHat className="w-12 h-12 text-orange-600 mx-auto animate-pulse" />
          <p className="text-gray-600">Loading saved recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-orange-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Saved Recipes</h1>
          </div>
        </div>

        {savedRecipes.length === 0 ? (
          <Card className="p-12 text-center">
            <CardContent>
              <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">No Saved Recipes Yet</h2>
              <p className="text-gray-500 mb-6">Start generating recipes and save your favorites!</p>
              <Link to="/">
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  Generate Recipe
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : selectedRecipe ? (
          <Card className="bg-white shadow-xl rounded-2xl overflow-hidden border-0">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedRecipe(null)}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRecipe(selectedRecipe.id)}
                  className="text-white hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
              <h2 className="text-3xl font-bold mb-2">{selectedRecipe.recipe_name}</h2>
              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  <span>{selectedRecipe.cooking_time}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  <span>{selectedRecipe.serves}</span>
                </div>
              </div>
            </div>
            
            {selectedRecipe.image_url && (
              <div className="px-8 pt-6">
                <img 
                  src={selectedRecipe.image_url} 
                  alt={selectedRecipe.recipe_name}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
            
            <ScrollArea className="h-96 w-full">
              <CardContent className="p-8">
                {selectedRecipe.nutrition && (
                  <div className="mb-8 bg-green-50 rounded-lg p-6 border border-green-200">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Nutritional Information (per person)
                    </h3>
                    <div className="space-y-3">
                      <div className="text-lg font-medium text-green-700">
                        {selectedRecipe.nutrition.calories}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                        <div className="flex items-center">
                          <span className="font-medium">Protein:</span>
                          <span className="ml-2">{selectedRecipe.nutrition.protein}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Carbs:</span>
                          <span className="ml-2">{selectedRecipe.nutrition.carbs}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium">Fat:</span>
                          <span className="ml-2">{selectedRecipe.nutrition.fat}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                    Ingredients
                  </h3>
                  <ul className="space-y-3">
                    {selectedRecipe.ingredients.map((ingredient: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700 text-lg">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                    Instructions
                  </h3>
                  <ol className="space-y-4">
                    {selectedRecipe.instructions.map((instruction: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold mr-4 flex-shrink-0 mt-1">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 text-lg leading-relaxed">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </ScrollArea>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRecipes.map((recipe) => (
              <Card 
                key={recipe.id} 
                className="bg-white shadow-lg rounded-xl border-0 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedRecipe(recipe)}
              >
                {recipe.image_url && (
                  <div className="aspect-video overflow-hidden rounded-t-xl">
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.recipe_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 line-clamp-2">
                    {recipe.recipe_name}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{recipe.cooking_time}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{recipe.serves}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Saved {new Date(recipe.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedRecipes;