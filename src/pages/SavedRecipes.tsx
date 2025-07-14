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
        <div className="text-center space-y-6">
          <div className="text-6xl animate-pulse">👨‍🍳</div>
          <p className="text-muted-foreground text-lg">Loading saved recipes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center">
            <h1 className="text-5xl font-bold text-foreground">Saved Recipes</h1>
          </div>
        </div>

        {savedRecipes.length === 0 ? (
          <Card className="p-16 text-center">
            <CardContent>
              <BookOpen className="w-24 h-24 text-muted-foreground mx-auto mb-8" />
              <h2 className="text-3xl font-semibold text-foreground mb-6">No Saved Recipes Yet</h2>
              <p className="text-muted-foreground text-lg mb-8">Start generating recipes and save your favorites!</p>
              <Link to="/">
                <Button variant="default" size="lg">
                  Generate Recipe
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : selectedRecipe ? (
          <Card className="overflow-hidden">
            <div className="bg-gradient-primary p-8 text-primary-foreground">
              <div className="flex items-center justify-between mb-6">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedRecipe(null)}
                  className="text-primary-foreground hover:bg-white/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to List
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteRecipe(selectedRecipe.id)}
                  className="text-primary-foreground hover:bg-destructive/20"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
              <h2 className="text-4xl font-bold mb-4">{selectedRecipe.recipe_name}</h2>
              <div className="flex items-center space-x-8 text-primary-foreground/90">
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
              <div className="px-8 pt-8">
                <img 
                  src={selectedRecipe.image_url} 
                  alt={selectedRecipe.recipe_name}
                  className="w-full h-64 object-cover rounded-card shadow-card"
                />
              </div>
            )}
            
            <ScrollArea className="h-96 w-full">
              <CardContent className="p-8">
                {selectedRecipe.nutrition && (
                  <div className="mb-8 bg-secondary/10 rounded-card p-8 border border-secondary/20">
                    <h3 className="text-2xl font-semibold text-foreground mb-6">
                      Nutritional Information (per person)
                    </h3>
                    <div className="space-y-4">
                      <div className="text-xl font-medium text-secondary">
                        {selectedRecipe.nutrition.calories}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base text-foreground">
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

                <div className="mb-10">
                  <h3 className="text-3xl font-semibold text-foreground mb-6 border-b-2 border-accent/30 pb-3">
                    Ingredients
                  </h3>
                  <ul className="space-y-4">
                    {selectedRecipe.ingredients.map((ingredient: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-4 flex-shrink-0"></span>
                        <span className="text-foreground text-lg">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-10">
                  <h3 className="text-3xl font-semibold text-foreground mb-6 border-b-2 border-accent/30 pb-3">
                    Instructions
                  </h3>
                  <ol className="space-y-6">
                    {selectedRecipe.instructions.map((instruction: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-full font-semibold mr-6 flex-shrink-0 mt-1">
                          {index + 1}
                        </span>
                        <span className="text-foreground text-lg leading-relaxed">{instruction}</span>
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
                className="hover:shadow-primary transition-all duration-300 cursor-pointer hover:scale-105"
                onClick={() => setSelectedRecipe(recipe)}
              >
                {recipe.image_url && (
                  <div className="aspect-video overflow-hidden rounded-t-card">
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.recipe_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold text-foreground mb-4 line-clamp-2">
                    {recipe.recipe_name}
                  </h3>
                  <div className="flex items-center justify-between text-muted-foreground mb-6">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{recipe.cooking_time}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{recipe.serves}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
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