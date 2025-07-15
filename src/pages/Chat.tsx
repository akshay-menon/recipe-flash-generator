import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, MessageSquare } from 'lucide-react';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

  const placeholderTexts = [
    "I want to make matcha cookies like Levain Bakery...",
    "Give me a few miso marinade options for salmon...",
    "I need a quick pasta sauce with pantry ingredients...",
    "How do I make crispy roasted Brussels sprouts?",
    "I want to try making Korean corn dogs at home...",
    "Show me different ways to cook chicken thighs..."
  ];

  const examplePrompts = [
    "Miso marinade for salmon",
    "Quick pasta with pantry ingredients", 
    "Crispy Brussels sprouts recipe"
  ];

  // Cycle through placeholder texts every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => 
        (prevIndex + 1) % placeholderTexts.length
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [placeholderTexts.length]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!message.trim()) {
      return; // Prevent empty submissions
    }

    setIsLoading(true);
    console.log('User message:', message);
    
    // Simulate brief loading state
    setTimeout(() => {
      setIsLoading(false);
      setMessage(''); // Clear input after submission
    }, 1000);
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
        </div>

        {/* Input Section */}
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

        {/* Example Prompts */}
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

        {/* Conversation Area Placeholder */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Your conversation will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;