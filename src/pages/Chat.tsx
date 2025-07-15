import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, MessageSquare, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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

        {/* Conversation Area */}
        {conversation.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
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
                      <div className="whitespace-pre-wrap">{msg.content}</div>
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
            </CardContent>
          </Card>
        )}

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

        {/* Example Prompts - Only show when conversation is empty */}
        {conversation.length === 0 && (
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

        {/* Empty State - Only show when no conversation */}
        {conversation.length === 0 && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Start a conversation by describing what you'd like to cook</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Chat;