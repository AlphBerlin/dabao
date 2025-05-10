// AIAssistant.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
import { 
  createSession, 
  sendMessage, 
  chat,
  getMessages, 
  deleteSession, 
  getSessions,
  type Message,
  type ChatResponse
} from '@/lib/api/da-assistant';

interface AIAssistantProps {
  userId: string;
  initialTitle?: string;
  onClose?: () => void;
}

interface Session {
  id: string;
  title: string;
  createdAt: string;
}

interface ThoughtContent {
  text: string;
  thoughts?: string;
}

const MemorizedChatBubble = React.memo(function ChatBubble({ 
  content, 
  isUser,
  isLoading 
}: { 
  content: string, 
  isUser: boolean,
  isLoading?: boolean 
}) {
  // Parse content for thinking blocks
  const parsedContent = useMemo(() => {
    if (isLoading || !content) return { text: content, thoughts: undefined };
    
    const thinkingRegex = /<thinking>(.*?)<\/thinking>/s;
    const match = content.match(thinkingRegex);
    
    if (match) {
      const thoughts = match[1].trim();
      const cleanText = content.replace(thinkingRegex, '').trim();
      return { text: cleanText, thoughts };
    }
    
    return { text: content, thoughts: undefined };
  }, [content, isLoading]);
  
  return (
    <div 
      className={`max-w-[80%] p-3 rounded-lg transition-all duration-300 ${
        isUser 
          ? 'bg-primary text-primary-foreground rounded-br-none shadow-md ml-auto' 
          : 'bg-secondary text-secondary-foreground rounded-bl-none shadow-md'
      }`}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-2">
          <div className="flex space-x-2 mb-1">
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
          </div>
          <div className="text-xs text-muted-foreground">AI thinking...</div>
        </div>
      ) : (
        <>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            className={`prose ${isUser ? 'prose-invert' : ''} max-w-none break-words`}
          >
            {parsedContent.text || ''}
          </ReactMarkdown>
          
          {parsedContent.thoughts && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-tertiary" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3.586l2.707 2.707a1 1 0 11-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium text-tertiary">Thinking Process</span>
              </div>
              <div className="text-xs text-muted-foreground italic bg-muted p-2 rounded">
                {parsedContent.thoughts}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  userId, 
  initialTitle = "New Chat", 
  onClose 
}) => {
  // Main state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [showNewSessionInput, setShowNewSessionInput] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // For virtualized list performance
  const cache = useMemo(() => new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 100,
  }), []);
  
  // Create session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const id = await createSession(userId, initialTitle);
        setSessionId(id);
        loadSessionMessages(id);
      } catch (err) {
        setError("Failed to initialize chat session");
        console.error(err);
      }
    };
    
    initSession();
    loadSessions();
    
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
  
  // Reset cache when messages change
  useEffect(() => {
    if (messages.length > 0) {
      cache.clearAll();
    }
  }, [messages, cache]);

  // Load user's sessions
  const loadSessions = useCallback(async () => {
    try {
      const userSessions = await getSessions(userId);
      setSessions(userSessions);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  }, [userId]);
  
  // Load messages for a specific session
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const sessionMessages = await getMessages(sessionId);
      setMessages(sessionMessages);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);
  
  // Switch to a different session
  const switchSession = useCallback(async (sessionId: string) => {
    setSessionId(sessionId);
    setMessages([]); // Clear current messages
    await loadSessionMessages(sessionId);
    setIsHistorySidebarOpen(false); // Close sidebar on mobile
  }, [loadSessionMessages]);
  
  // Create a new session
  const createNewSession = useCallback(async () => {
    try {
      if (!newSessionTitle.trim()) {
        setError("Session title cannot be empty");
        return;
      }
      
      const id = await createSession(userId, newSessionTitle);
      setSessionId(id);
      setMessages([]);
      await loadSessions();
      setNewSessionTitle("");
      setShowNewSessionInput(false);
    } catch (err) {
      setError("Failed to create new session");
      console.error(err);
    }
  }, [userId, newSessionTitle, loadSessions]);
  
  // Delete a session
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      await loadSessions();
      
      // If the current session was deleted, create a new one
      if (sessionId === sessionId) {
        const id = await createSession(userId, "New Chat");
        setSessionId(id);
        setMessages([]);
      }
    } catch (err) {
      setError("Failed to delete session");
      console.error(err);
    }
  }, [sessionId, userId, loadSessions]);

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
      // Create AI response message with empty content (for loading state)
      const tempMessageId = `temp-${Date.now()}`;
      
      setMessages(prev => [
        ...prev, 
        {
          id: tempMessageId,
          userId: "assistant",
          content: "",
          createdAt: new Date().toISOString()
        }
      ]);
      
      // Use chat() function to get response
      const response = await chat(inputValue);
      
      if (!response || !response.message?.content) {
        throw new Error("Empty response from assistant");
      }
      
      // Update the message with actual content
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessageId 
            ? { ...msg, content: response.message!.content } 
            : msg
        )
      );
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
  
  // Row renderer for virtualized list
  const rowRenderer = ({ index, key, parent, style }: any) => {
    const message = messages[index];
    const isUserMessage = message.userId === userId;
    
    return (
      <CellMeasurer
        cache={cache}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}
      >
        {({ registerChild }) => (
          <motion.div 
            ref={registerChild as any} 
            style={style}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4 px-4`}
          >
            <MemorizedChatBubble 
              content={message.content} 
              isUser={isUserMessage}
              isLoading={isLoading && index === messages.length - 1 && message.userId !== userId} 
            />
          </motion.div>
        )}
      </CellMeasurer>
    );
  };
  
  return (
    <>
      {/* Toggle Button - Fixed position */}
      <motion.button 
        onClick={() => setIsOpen(prev => !prev)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed z-20 bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:bg-primary/90 transition-colors"
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
      </motion.button>
      
      {/* Sidebar overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Main AI Assistant Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 z-40 w-full sm:w-[400px] md:w-[450px] bg-card shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-border">
              <div className="flex items-center">
                <button
                  onClick={() => setIsHistorySidebarOpen(prev => !prev)}
                  className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground mr-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </button>
                
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Chat History Sidebar */}
            <AnimatePresence>
              {isHistorySidebarOpen && (
                <motion.div 
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute z-10 top-[57px] bottom-0 left-0 w-64 bg-background border-r border-border shadow-lg flex flex-col"
                >
                  <div className="p-4 border-b border-border">
                    <h3 className="font-medium text-lg">Chat History</h3>
                    {!showNewSessionInput ? (
                      <button 
                        onClick={() => setShowNewSessionInput(true)}
                        className="mt-2 flex items-center text-primary hover:text-primary/90 text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Chat
                      </button>
                    ) : (
                      <div className="mt-2 flex flex-col space-y-2">
                        <input
                          type="text"
                          value={newSessionTitle}
                          onChange={(e) => setNewSessionTitle(e.target.value)}
                          placeholder="Chat title..."
                          className="w-full border border-input bg-background rounded p-1 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              createNewSession();
                            } else if (e.key === 'Escape') {
                              setShowNewSessionInput(false);
                              setNewSessionTitle("");
                            }
                          }}
                        />
                        <div className="flex space-x-2">
                          <button 
                            onClick={createNewSession}
                            className="flex-1 p-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
                          >
                            Create
                          </button>
                          <button 
                            onClick={() => {
                              setShowNewSessionInput(false);
                              setNewSessionTitle("");
                            }}
                            className="flex-1 p-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No chat history yet
                      </div>
                    ) : (
                      <ul className="divide-y divide-border">
                        {sessions.map(session => (
                          <motion.li 
                            key={session.id} 
                            whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                            className={`p-3 flex justify-between items-center cursor-pointer
                              ${session.id === sessionId ? 'bg-accent/50 border-l-4 border-primary' : ''}
                            `}
                            onClick={() => switchSession(session.id)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium truncate w-36">{session.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(session.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id);
                              }}
                              className="text-muted-foreground hover:text-destructive p-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-hidden">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-lg mb-2 font-medium">How can I assist you today?</p>
                    <p className="text-sm text-center text-muted-foreground max-w-xs">
                      Ask me anything about your application, account or other questions you may have.
                    </p>
                    
                    <div className="mt-6 grid grid-cols-1 gap-3 w-full max-w-xs">
                      {["How does the reward system work?", "What are the features of this app?", "Can you explain how to place an order?"].map((suggestion) => (
                        <motion.button
                          key={suggestion}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className="p-2 border border-border rounded-lg text-sm text-left hover:bg-accent transition-colors"
                          onClick={() => {
                            setInputValue(suggestion);
                            setTimeout(() => {
                              inputRef.current?.focus();
                            }, 100);
                          }}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="h-full py-4">
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        height={height}
                        width={width}
                        rowCount={messages.length}
                        rowHeight={cache.rowHeight}
                        deferredMeasurementCache={cache}
                        rowRenderer={rowRenderer}
                        scrollToIndex={messages.length - 1}
                        overscanRowCount={5}
                      />
                    )}
                  </AutoSizer>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="bg-destructive/10 text-destructive p-3 text-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Input Area */}
            <div className="border-t border-border p-4">
              <div className="flex rounded-lg shadow-sm">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 resize-none border border-input bg-background rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-input min-h-[80px]"
                  placeholder="Type your message..."
                  rows={2}
                  disabled={isLoading || !sessionId}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim() || !sessionId}
                  className={`bg-primary text-primary-foreground p-3 rounded-r-lg ${
                    isLoading || !inputValue.trim() || !sessionId
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-primary/90'
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
                </motion.button>
              </div>
              <div className="text-xs text-center mt-2 text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;