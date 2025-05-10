// AIAssistant.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  createSession, 
  sendMessage, 
  streamMessage, 
  getMessages, 
  deleteSession, 
  type Message,
  type ChatResponse
} from '@/lib/api/da-assistant';

interface AIAssistantProps {
  userId: string;
  initialTitle?: string;
  onClose?: () => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  userId, 
  initialTitle = "New Chat", 
  onClose 
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Create session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const id = await createSession(userId, initialTitle);
        setSessionId(id);
      } catch (err) {
        setError("Failed to initialize chat session");
        console.error(err);
      }
    };
    
    initSession();
    
    // Cleanup on unmount
    return () => {
      if (sessionId) {
        deleteSession(sessionId).catch(console.error);
      }
    };
  }, [userId, initialTitle]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      userId,
      content: inputValue,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);
    
    try {
      // For streaming implementation
      let fullResponse = "";
      let tempMessageId = `temp-${Date.now()}`;
      
      setMessages(prev => [
        ...prev, 
        {
          id: tempMessageId,
          userId: "assistant",
          content: "",
          createdAt: new Date().toISOString()
        }
      ]);
      
      for await (const chunk of streamMessage(sessionId, userId, inputValue)) {
        if ('error' in chunk) {
          setError(chunk.error);
          break;
        }
        
        if ('done' in chunk) {
          break;
        }
        
        if ('content' in chunk) {
          fullResponse += chunk.content;
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempMessageId 
                ? { ...msg, content: fullResponse } 
                : msg
            )
          );
        }
      }
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
    } finally {
      setIsLoading(false);
      // Focus back to input after sending
      inputRef.current?.focus();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Determine component layout based on screen size
  const getAssistantClasses = () => {
    const baseClasses = "bg-white rounded-lg shadow-lg flex flex-col";
    const sizeClasses = isOpen 
      ? "fixed z-50 transition-all duration-300 ease-in-out"
      : "hidden";
    
    // On mobile: bottom sheet that slides up
    // On md+: right side panel
    return `${baseClasses} ${sizeClasses} md:right-4 md:top-4 md:bottom-4 md:w-96
      md:max-w-md md:h-auto md:rounded-lg
      sm:bottom-0 sm:left-0 sm:right-0 sm:w-full sm:rounded-t-lg sm:rounded-b-none sm:max-h-[80vh]`;
  };
  
  return (
    <>
      {/* Toggle Button - Fixed position */}
      <button 
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed z-50 bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors"
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
      
      {/* Assistant Panel */}
      <div className={getAssistantClasses()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="ml-2 font-medium">AI Assistant</h3>
          </div>
          <button 
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>How can I assist you today?</p>
            </div>
          ) : (
            messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.userId === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.userId === userId 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {message.content || (isLoading && message.userId !== userId ? (
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : null)}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 text-sm">
            {error}
          </div>
        )}
        
        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 resize-none border border-gray-300 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="Type your message..."
              rows={2}
              disabled={isLoading || !sessionId}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim() || !sessionId}
              className={`bg-blue-600 text-white p-2 rounded-r-lg ${
                isLoading || !inputValue.trim() || !sessionId
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;