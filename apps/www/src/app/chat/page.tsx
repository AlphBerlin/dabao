// pages/index.tsx
"use client";
import { useState, useRef } from "react";
import { mcp } from "@/lib/proto/mcp_pb";
import { mcpService } from "@/lib/grpc/client";

export default function ChatPage() {
  const { ChatRequest, ChatMessage, ChatResponse } = mcp;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const streamRef = useRef<AsyncIterable<ChatResponse> | null>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    // Push user message locally
    const userMsg = ChatMessage.create({ role: "user", content: input });
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Build request with history
    const request = ChatRequest.create({
      messages: [...messages, userMsg],
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 1024,
      clientId: "nextjs-client",
      sessionId: "session-1",
      parameters: {},
    });

    // Stream assistant responses
    const responseStream = mcpService.chatStream(request);
    streamRef.current = responseStream;
    for await (const res of responseStream) {
      const assistantMsg = res.message!;
      setMessages((prev) => [...prev, assistantMsg]);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Chat history */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={msg.role === "user" ? "text-right" : "text-left"}
          >
            <div className="inline-block bg-gray-200 rounded p-2">
              <strong>{msg.role}:</strong> {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="p-4 flex">
        <input
          className="flex-1 border rounded p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message"
        />
        <button
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}
