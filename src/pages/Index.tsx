
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users, ChefHat } from 'lucide-react';

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

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);

  const generateRecipe = async () => {
    setIsLoading(true);
    setShowRecipe(false);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setShowRecipe(true);
  };

  const generateAnother = async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="w-8 h-8 text-orange-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Recipe Generator</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Discover delicious recipes with just one click. Perfect for when you're not sure what to cook!
          </p>
        </div>

        {/* Generate Button */}
        {!showRecipe && (
          <div className="text-center mb-8">
            <Button
              onClick={generateRecipe}
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Generating Recipe...
                </div>
              ) : (
                "Generate Recipe"
              )}
            </Button>
          </div>
        )}

        {/* Recipe Display */}
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
