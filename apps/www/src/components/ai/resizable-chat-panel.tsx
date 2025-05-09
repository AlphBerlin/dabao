"use client";

import React, { useRef, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@workspace/ui/components/resizable";
import { Avatar, AvatarImage, AvatarFallback } from "@workspace/ui/components/avatar"; 
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Card } from "@workspace/ui/components/card";
import { MessageSquare, X, Send, Loader2, Sparkles, Expand, Minimize, RefreshCcw } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useChat, Message } from './chat-context';
import { motion, AnimatePresence } from 'framer-motion';

interface ResizableChatPanelProps {
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
  botName?: string;
  botAvatar?: string;
}

export const ResizableChatPanel: React.FC<ResizableChatPanelProps> = ({
  defaultSize = 30,
  minSize = 20,
  maxSize = 60,
  className,
  botName = "Dabao Assistant",
  botAvatar = "/images/bot-avatar.png"
}) => {
  const { 
    messages, 
    isOpen, 
    isLoading, 
    sendMessage, 
    toggleChat,
    clearMessages 
  } = useChat();
  const [messageText, setMessageText] = React.useState('');
  const [isExpanded, setIsExpanded] = React.useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || isLoading) return;
    sendMessage(messageText);
    setMessageText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={toggleChat}
        className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white z-50"
        aria-label="Open chat assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ type: "spring", duration: 0.5 }}
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50",
          isExpanded ? "left-0" : "max-w-[500px] w-[90%]",
          className
        )}
      >
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            defaultSize={defaultSize}
            minSize={minSize}
            maxSize={maxSize}
            collapsible={false}
            className="h-full"
          >
            <Card className="flex flex-col h-full overflow-hidden rounded-l-lg border shadow-lg bg-background">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={botAvatar} alt={botName} />
                    <AvatarFallback><Sparkles className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{botName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearMessages} 
                    className="h-8 w-8 p-0"
                    title="Clear conversation"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleExpand} 
                    className="h-8 w-8 p-0"
                    title={isExpanded ? "Minimize" : "Expand"}
                  >
                    {isExpanded ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Expand className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleChat} 
                    className="h-8 w-8 p-0"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Message container */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Sparkles className="h-8 w-8 mb-2" />
                    <p className="text-lg font-medium">How can I help you today?</p>
                    <p className="text-sm">Ask me anything about your loyalty program.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble 
                      key={message.id} 
                      message={message} 
                      botAvatar={botAvatar}
                    />
                  ))
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Input area */}
              <div className="p-3 border-t">
                <div className="flex items-end gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    className="min-h-[60px] resize-none"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isLoading}
                    className="h-10 w-10"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </ResizablePanel>
          <ResizableHandle withHandle />
        </ResizablePanelGroup>
      </motion.div>
    </AnimatePresence>
  );
};

interface MessageBubbleProps {
  message: Message;
  botAvatar: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, botAvatar }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0">
          <AvatarImage src={botAvatar} alt="Bot Avatar" />
          <AvatarFallback><Sparkles className="h-4 w-4" /></AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={cn(
          "rounded-lg px-4 py-2 max-w-[80%]",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted/50"
        )}
      >
        {message.pending ? (
          <div className="flex items-center space-x-2 h-6">
            <div className="w-2 h-2 rounded-full animate-pulse bg-current"></div>
            <div className="w-2 h-2 rounded-full animate-pulse bg-current" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 rounded-full animate-pulse bg-current" style={{ animationDelay: '0.4s' }}></div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        <span className="block text-xs opacity-70 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 ml-2 mt-1 flex-shrink-0">
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};