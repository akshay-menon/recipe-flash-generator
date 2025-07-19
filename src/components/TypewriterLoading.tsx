import React, { useState, useEffect } from 'react';

interface TypewriterLoadingProps {
  messages?: string[];
  typingSpeed?: number;
  pauseBetweenMessages?: number;
}

const TypewriterLoading: React.FC<TypewriterLoadingProps> = ({
  messages = [
    "🧙‍♂️ Summoning ingredients from the pantry...",
    "👨‍🍳 Consulting with kitchen spirits...",
    "⚖️ Balancing flavors like a culinary alchemist...",
    "📝 Scribbling down the perfect recipe...",
    "✨ Adding a pinch of magic..."
  ],
  typingSpeed = 50,
  pauseBetweenMessages = 800
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const typeMessage = (message: string, charIndex: number = 0) => {
      if (charIndex < message.length) {
        setCurrentText(message.substring(0, charIndex + 1));
        timeoutId = setTimeout(() => typeMessage(message, charIndex + 1), typingSpeed);
      } else {
        setIsTyping(false);
        // Pause before moving to next message
        timeoutId = setTimeout(() => {
          setIsTyping(true);
          const nextIndex = (currentMessageIndex + 1) % messages.length;
          setCurrentMessageIndex(nextIndex);
          setCurrentText('');
        }, pauseBetweenMessages);
      }
    };

    const currentMessage = messages[currentMessageIndex];
    if (currentMessage) {
      typeMessage(currentMessage);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentMessageIndex, messages, typingSpeed, pauseBetweenMessages]);

  return (
    <div className="text-center space-y-4">
      <div className="text-lg font-medium text-primary min-h-[1.75rem] flex items-center justify-center">
        <span>
          {currentText}
          {isTyping && (
            <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse">|</span>
          )}
        </span>
      </div>
      
      {/* Progress dots */}
      <div className="flex justify-center space-x-2">
        {messages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentMessageIndex 
                ? 'bg-primary scale-125' 
                : index < currentMessageIndex 
                ? 'bg-primary/60' 
                : 'bg-primary/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default TypewriterLoading;