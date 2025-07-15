import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, MessageSquare } from 'lucide-react';

const Chat = () => {
  const [message, setMessage] = useState('');

  const examplePrompts = [
    "Miso marinade for salmon",
    "Quick pasta with pantry ingredients", 
    "Crispy Brussels sprouts recipe"
  ];

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
            <div className="flex flex-col gap-4">
              <Textarea
                placeholder="I want to make matcha cookies like Levain Bakery..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none text-base"
                rows={3}
              />
              <div className="flex justify-end">
                <Button className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Ask
                </Button>
              </div>
            </div>
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
                className="text-sm"
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