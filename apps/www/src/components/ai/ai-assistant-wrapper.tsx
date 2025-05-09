"use client";

import React from 'react';
import { ChatProvider } from './chat-context';
import { ResizableChatPanel } from './resizable-chat-panel';

interface AIAssistantWrapperProps {
  mcpServerUrl: string;
  botName?: string;
  botAvatar?: string;
  clientId?: string;
}

/**
 * AIAssistantWrapper is a component that provides a chat interface for the AI assistant.
 * It includes both the context provider and the UI components needed for the chat.
 */
export const AIAssistantWrapper: React.FC<AIAssistantWrapperProps> = ({
  mcpServerUrl,
  botName = 'Dabao Assistant',
  botAvatar = '/images/bot-avatar.png',
  clientId,
}) => {
  // Initial welcome message from the assistant
  const initialMessages = [
    {
      id: 'welcome-1',
      role: 'assistant' as const,
      content: `👋 Hi there! I'm your ${botName}. How can I help you today?`,
      timestamp: new Date(),
    }
  ];

  return (
    <ChatProvider 
      mcpServerUrl={mcpServerUrl}
      clientId={clientId}
      initialMessages={initialMessages}
    >
      <ResizableChatPanel
        botName={botName}
        botAvatar={botAvatar}
      />
    </ChatProvider>
  );
};