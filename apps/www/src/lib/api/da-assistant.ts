// da-assistant.ts
// API invocation library for DA Assistant

import { createClient } from '../supabase/client';

export interface SessionResponse {
    sessionId: string;
  }
  
  export interface Message {
    id: string;
    userId: string;
    content: string;
    parameters?: Record<string, any>;
    createdAt: string;
    // Add other fields as needed
  }
  
  export interface MessagesResponse {
    messages: Message[];
  }
  export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    metadata?: Record<string, string>;
  }
  // Interface for chat completion response
  export interface ChatResponse {
    message?: ChatMessage;
    error?: string;
  }
  
  
  export interface ChatResponseEnvelope {
    response: ChatResponse;
  }

  // Image generation interfaces
  export interface GenerateImageRequest {
    prompt: string;
    provider?: string;
    size?: string;
    style?: string;
    quality?: string;
    numberOfImages?: number;
    userId?: string;
  }

  export interface GeneratedImage {
    url: string;
    provider: string;
    prompt: string;
    size?: string;
    style?: string;
    createdAt: string;
  }

  export interface GenerateImageResponse {
    images: GeneratedImage[];
    prompt: string;
  }
  
  const BASE_URL = process.env.DA_ASSISTANT_BASE_URL || "http://localhost:3001";
  
  /**
   * Helper function to get authentication headers with the current user's token
   * @returns Headers object with auth token if available
   */
  async function getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      "Content-Type": "application/json"
    };

    try {
      // Import dynamically to avoid SSR issues
      const supabase = createClient();
      
      // Get the session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    
    return headers;
  }
  
  /**
   * Create a new chat session.
   * @param userId ID of the user creating the session
   * @param title Optional title for the chat session
   * @returns ID of the newly created session
   */
  export async function createSession(
    userId: string,
    title?: string
  ): Promise<string> {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${BASE_URL}/api/sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ userId, title }),
    });
    if (res.status === 201) {
      const data: SessionResponse = await res.json();
      return data.sessionId;
    } else {
      const error = await res.json();
      throw new Error(error.error || "Failed to create session");
    }
  } 
   export async function getSessions(
    userId: string,
  ): Promise<any> {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${BASE_URL}/api/sessions`, {
      method: "GET",
      headers,
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to get sessions");
    }
    
    return await res.json();
  }
  
  /**
   * Delete a chat session by ID.
   * @param sessionId ID of the session to delete
   */
  export async function deleteSession(sessionId: string): Promise<void> {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
      method: "DELETE",
      headers,
    });
    if (res.status !== 204) {
      const error = await res.json();
      throw new Error(error.error || "Failed to delete session");
    }
  }
  
  /**
   * Get all messages for a given session.
   * @param sessionId ID of the session
   * @returns Array of messages
   */
  export async function getMessages(sessionId: string): Promise<Message[]> {
    const headers = await getAuthHeaders();
    
    const res = await fetch(
      `${BASE_URL}/api/sessions/${sessionId}/messages`,
      { headers }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to get messages");
    }
    const data: MessagesResponse = await res.json();
    return data.messages;
  }
  
  /**
   * Send a message to the assistant within a session.
   * @param sessionId ID of the session
   * @param userId ID of the user sending the message
   * @param content Message content
   * @param parameters Optional model parameters
   * @returns Assistant response
   */
  export async function sendMessage(
    sessionId: string,
    userId: string,
    content: string,
    parameters?: Record<string, any>
  ): Promise<ChatResponse> {
    const headers = await getAuthHeaders();
    
    const res = await fetch(
      `${BASE_URL}/api/sessions/${sessionId}/messages`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, content, parameters }),
      }
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to send message");
    }
    const data: ChatResponseEnvelope = await res.json();
    return data.response;
  }
  
  /**
   * Stream a chat response (SSE) from the assistant.
   * @param sessionId ID of the session
   * @param userId ID of the user
   * @param content Message content
   * @param parameters Optional model parameters
   * @returns Async iterator yielding chunks of response or errors
   */
  export async function* streamMessage(
    sessionId: string,
    userId: string,
    content: string,
    parameters?: Record<string, any>
  ): AsyncGenerator<ChatResponse | { done: boolean } | { error: string }> {
    const headers = await getAuthHeaders();
    
    const res = await fetch(
      `${BASE_URL}/api/sessions/${sessionId}/messages/stream`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ userId, content, parameters }),
      }
    );
  
    if (!res.ok || !res.body) {
      const error = await res.json().catch(() => ({ error: "Failed to stream message" }));
      yield { error: error.error || "Failed to stream message" };
      return;
    }
  
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!;
      for (const line of lines) {
        if (line.startsWith("data:")) {
          try {
            const payload = JSON.parse(line.replace(/^data:\s*/, ""));
            if (payload.done) {
              yield { done: true };
              return;
            }
            if (payload.error) {
              yield { error: payload.error };
            } else {
              yield payload as ChatResponse;
            }
          } catch (e) {
            // Ignore malformed lines
          }
        }
      }
    }
  }
  
  /**
   * One-off chat without session tracking.
   * @param message Message content
   * @param parameters Optional model parameters
   * @returns Assistant response
   */
  export async function chat(
    message: string,
    parameters?: Record<string, any>
  ): Promise<ChatResponse> {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, parameters }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to process chat");
    }
    const data: ChatResponseEnvelope = await res.json();
    return data.response;
  }

  /**
   * Generate AI images based on the provided prompt.
   * @param request Image generation request with prompt and parameters
   * @returns Generated image URLs and metadata
   */
  export async function generateImages(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${BASE_URL}/api/images/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to generate image");
    }
    
    return await res.json();
  }
