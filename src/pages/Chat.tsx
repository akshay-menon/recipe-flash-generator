import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, RotateCcw, Clock, Users, BookOpen, Heart, Edit3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ParsedRecipe {
  name: string;
  cookingTime: string;
  serves: string;
  ingredients: string[];
  instructions: string[];
  nutrition?: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  imageUrl?: string;
}

const Chat = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [exchangeNumber, setExchangeNumber] = useState(1);
  const [conversationId] = useState(() => `chat-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Recipe display state
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipeModification, setRecipeModification] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modificationPlaceholderIndex, setModificationPlaceholderIndex] = useState(0);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Persistence key for localStorage
  const STORAGE_KEY = 'chat-session-state';

  const placeholderTexts = [
    "I want to make matcha cookies like Levain Bakery...",
    "Give me a few miso marinade options for salmon...",
    "I need a quick pasta sauce with pantry ingredients...",
    "How do I make crispy roasted Brussels sprouts?",
    "I want to try making Korean corn dogs at home...",
    "Show me different ways to cook chicken thighs..."
  ];

  const modificationPlaceholders = [
    "Swap salmon for cod...",
    "What can I use instead of sichuan pepper?",
    "Make this dairy-free...",
    "Can I use chicken instead of beef?",
    "I don't have pine nuts...",
    "Make this spicier..."
  ];

  const examplePrompts = [
    "Miso marinade for salmon",
    "Quick pasta with pantry ingredients", 
    "Crispy Brussels sprouts recipe"
  ];

  // Recipe parsing function - matches the main page format exactly
  const parseRecipeResponse = (response: string): ParsedRecipe | null => {
    // Check if response contains structured recipe markers
    if (!response.includes('**Recipe Name:**') && 
        !response.includes('**Cooking Time:**') && 
        !response.includes('**Ingredients:**') &&
        !response.includes('**Instructions:**')) {
      return null; // Not a recipe response
    }

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

    // Only return parsed recipe if we have minimum required fields
    if (recipeName && ingredients.length > 0 && instructions.length > 0) {
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
        instructions
      };
    }

    return null;
  };

  // Load persisted state on component mount
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          setConversation(parsedState.conversation || []);
          setExchangeNumber(parsedState.exchangeNumber || 1);
          setParsedRecipe(parsedState.parsedRecipe || null);
          setShowRecipe(parsedState.showRecipe || false);
        }
      } catch (error) {
        console.error('Error loading persisted chat state:', error);
      }
    };

    loadPersistedState();
  }, []);

  // Save state to localStorage whenever key state changes
  useEffect(() => {
    const saveState = () => {
      try {
        const stateToSave = {
          conversation,
          exchangeNumber,
          parsedRecipe,
          showRecipe,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error('Error saving chat state:', error);
      }
    };

    // Only save if there's actually content to save
    if (conversation.length > 0 || parsedRecipe) {
      saveState();
    }
  }, [conversation, exchangeNumber, parsedRecipe, showRecipe]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Cycle through placeholder texts every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => 
        (prevIndex + 1) % placeholderTexts.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [placeholderTexts.length]);

  // Cycle through modification placeholder texts every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setModificationPlaceholderIndex((prevIndex) => 
        (prevIndex + 1) % modificationPlaceholders.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [modificationPlaceholders.length]);

  const sendMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-recipe', {
        body: {
          messages: [...conversation, userMessage],
          userInput,
          exchangeNumber
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, assistantMessage]);
      setExchangeNumber(prev => prev + 1);

      // Check if response contains a recipe
      const recipe = parseRecipeResponse(data.response);
      if (recipe) {
        // Add image URL if available
        if (data.imageUrl) {
          recipe.imageUrl = data.imageUrl;
        }
        setParsedRecipe(recipe);
        setShowRecipe(true);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!message.trim() || isLoading) return;

    const userInput = message;
    setMessage(''); // Clear input immediately
    await sendMessage(userInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExampleClick = (prompt: string) => {
    setMessage(prompt);
  };

  const resetConversation = () => {
    setConversation([]);
    setExchangeNumber(1);
    setMessage('');
    setShowRecipe(false);
    setParsedRecipe(null);
    setRecipeModification('');
    
    // Clear persisted state
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing chat state:', error);
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
          nutrition: parsedRecipe.nutrition || {},
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
      const modificationPrompt = `The user wants to modify this existing recipe: 

**Recipe Name:** ${parsedRecipe.name}
**Cooking Time:** ${parsedRecipe.cookingTime}
**Ingredients:**
${parsedRecipe.ingredients.map(ing => `- ${ing}`).join('\n')}
**Instructions:**
${parsedRecipe.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}
**Serves:** ${parsedRecipe.serves}

User request: ${recipeModification}

Generate an updated version of the complete recipe incorporating their changes. 
Always return the full recipe card, not just the changes.`;

      const { data, error } = await supabase.functions.invoke('chat-recipe', {
        body: {
          messages: [],
          userInput: modificationPrompt,
          exchangeNumber: 3
        }
      });

      if (error) throw error;

      const modifiedRecipe = parseRecipeResponse(data.response);
      if (modifiedRecipe) {
        // Add image URL if available
        if (data.imageUrl) {
          modifiedRecipe.imageUrl = data.imageUrl;
        }
        setParsedRecipe(modifiedRecipe);
        setRecipeModification('');
        toast({
          title: "Recipe Modified!",
          description: "Your recipe has been updated with the requested changes."
        });
      } else {
        throw new Error('Failed to parse modified recipe');
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
            Recipe Assistant
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Describe what you want to cook and I'll help you create the perfect recipe
          </p>
          {conversation.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetConversation}
              className="mt-4 flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Start New Conversation
            </Button>
          )}
        </div>

        {/* Chat Container - Show when there's a conversation */}
        {(conversation.length > 0 || isLoading) && !showRecipe && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {conversation.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-4'
                          : 'bg-muted mr-4'
                      }`}
                    >
                      <div className={`${msg.role === 'assistant' ? 'prose prose-sm max-w-none' : 'whitespace-pre-wrap'}`}>
                        {msg.role === 'assistant' ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: msg.content
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/^\d+\.\s/gm, '<br/>$&')
                                .replace(/^-\s/gm, '<br/>• ')
                                .replace(/\n/g, '<br/>')
                            }}
                          />
                        ) : (
                          msg.content
                        )}
                      </div>
                      <div
                        className={`text-xs mt-2 opacity-70 ${
                          msg.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {formatTimestamp(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-4 mr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Integrated Input Section */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t pt-4">
                <Textarea
                  placeholder={conversation.length > 0 ? "Continue the conversation..." : placeholderTexts[currentPlaceholderIndex]}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[80px] resize-none text-base transition-all duration-300"
                  rows={3}
                  disabled={isLoading}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isLoading ? 'Asking...' : 'Ask'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recipe Display Area */}
        {showRecipe && parsedRecipe && (
          <div className="mb-6">
            {/* Recipe Card */}
            <Card className="mb-6 overflow-hidden shadow-card">
              <CardContent className="p-0">
                {/* Recipe Header */}
                <div className="bg-gradient-primary text-primary-foreground p-8">
                  <h2 className="text-4xl font-bold mb-4">{parsedRecipe.name}</h2>
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
                <div className="px-8 pt-8">
                  {parsedRecipe.imageUrl ? (
                    <img 
                      src={parsedRecipe.imageUrl} 
                      alt={parsedRecipe.name}
                      className="w-full h-64 object-cover rounded-card shadow-card"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-orange-400 to-red-500 rounded-card shadow-card flex items-center justify-center">
                      <span className="text-6xl">🍽️</span>
                    </div>
                  )}
                </div>

                {/* Recipe Content */}
                <div className="p-8 space-y-8">
                  {/* Nutritional Information Section */}
                  <div className="bg-secondary/10 rounded-card p-8 border border-secondary/20">
                    <h3 className="text-2xl font-semibold text-foreground mb-6 text-left">
                      Nutritional Information (per person)
                    </h3>
                    <div className="space-y-4">
                      <div className="text-xl font-medium text-secondary">
                        485 calories (24% daily intake)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-card rounded-card border border-border">
                          <div className="text-2xl font-bold text-foreground mb-1">32g</div>
                          <div className="text-sm text-muted-foreground font-medium">PROTEIN</div>
                        </div>
                        <div className="text-center p-4 bg-card rounded-card border border-border">
                          <div className="text-2xl font-bold text-foreground mb-1">45g</div>
                          <div className="text-sm text-muted-foreground font-medium">CARBS</div>
                        </div>
                        <div className="text-center p-4 bg-card rounded-card border border-border">
                          <div className="text-2xl font-bold text-foreground mb-1">18g</div>
                          <div className="text-sm text-muted-foreground font-medium">FAT</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <h3 className="text-3xl font-semibold text-foreground mb-6 border-b-2 border-accent/30 pb-3">
                      <BookOpen className="w-6 h-6 text-primary inline mr-3" />
                      Ingredients
                    </h3>
                    <ul className="space-y-4">
                      {parsedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-4 flex-shrink-0"></span>
                          <span className="text-foreground text-lg">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h3 className="text-3xl font-semibold text-foreground mb-6 border-b-2 border-accent/30 pb-3">
                      <Edit3 className="w-6 h-6 text-primary inline mr-3" />
                      Instructions
                    </h3>
                    <ol className="space-y-6">
                      {parsedRecipe.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-full font-semibold mr-6 flex-shrink-0 mt-1">
                            {index + 1}
                          </span>
                          <span className="text-foreground text-lg leading-relaxed">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  {/* Quick Modifications Section - Integrated */}
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
                        onClick={resetConversation} 
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
                      <span className="text-primary hover:underline cursor-pointer" onClick={() => window.location.href = '/auth'}>
                        Sign up
                      </span>{" "}
                      to save your favorite recipes!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Initial Input Section - Only show when no conversation and no recipe */}
        {conversation.length === 0 && !showRecipe && !isLoading && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Textarea
                  placeholder={placeholderTexts[currentPlaceholderIndex]}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[100px] resize-none text-base transition-all duration-300"
                  rows={3}
                  disabled={isLoading}
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isLoading ? 'Asking...' : 'Ask'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Example Prompts - Only show when conversation is empty and no recipe */}
        {conversation.length === 0 && !showRecipe && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(prompt)}
                  className="text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Chat;