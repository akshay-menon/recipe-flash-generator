import React, { useState, useEffect } from 'react';

interface LoadingMessagesProps {
  messages?: string[];
  cycleSpeed?: number;
}

const LoadingMessages: React.FC<LoadingMessagesProps> = ({
  messages = [
    "🧙‍♂️ Summoning ingredients from the pantry...",
    "👨‍🍳 Consulting with kitchen spirits...",
    "⚖️ Balancing flavors like a culinary alchemist...",
    "📝 Scribbling down the perfect recipe...",
    "✨ Adding a pinch of magic..."
  ],
  cycleSpeed = 2000 // 2 seconds per message
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        (prevIndex + 1) % messages.length
      );
    }, cycleSpeed);

    return () => clearInterval(interval);
  }, [messages.length, cycleSpeed]);

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
      </div>
      <span className="text-lg font-medium text-primary">
        {messages[currentMessageIndex]}
      </span>
    </div>
  );
};

export default LoadingMessages;