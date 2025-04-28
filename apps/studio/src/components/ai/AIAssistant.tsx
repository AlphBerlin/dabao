"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, X, Send, Sparkles } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"

interface Message {
  id: string
  text: string
  sender: "user" | "assistant"
  timestamp: Date
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "👋 Hi there! I'm your Daboa Loyalty AI assistant. I can help you with setting up your loyalty program, customizing rewards, and answering questions. How can I help you today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate AI response after a short delay
    setTimeout(() => {
      const responses = [
        "I can help you set up your loyalty program! Let's start by defining your reward tiers.",
        "That's a great question! The best rewards for coffee shops typically include free drinks, discounts, or early access to new flavors.",
        "Based on your customer data, I'd recommend focusing on 'visit frequency' rather than 'spend amount' for your loyalty points system.",
        "I see you haven't set up your email templates yet. Would you like me to suggest some templates based on your brand?",
      ]

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.div
        className="fixed right-6 bottom-6 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.button
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </motion.button>
      </motion.div>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed right-6 bottom-24 w-80 sm:w-96 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl z-40 overflow-hidden border border-neutral-200 dark:border-neutral-700"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <Card className="border-0 shadow-none">
              <CardHeader className="p-4 bg-primary text-white">
                <div className="flex items-center">
                  <Sparkles size={20} className="mr-2" />
                  <CardTitle className="text-base font-semibold">AI Assistant</CardTitle>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="h-96 overflow-y-auto p-4 flex flex-col space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.sender === "user"
                          ? "bg-primary text-white"
                          : "bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-white"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <div
                        className={`text-xs mt-1 ${
                          message.sender === "user" ? "text-primary-200" : "text-neutral-500 dark:text-neutral-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>

              {/* Input */}
              <CardFooter className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex w-full">
                  <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 bg-neutral-100 dark:bg-neutral-700 border-0 rounded-l-lg"
                  />
                  <Button variant="default" onClick={handleSendMessage} className="rounded-l-none">
                    <Send size={16} />
                  </Button>
                </div>

                {/* Suggested questions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="text-xs bg-neutral-100 dark:bg-neutral-700 px-3 py-1 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400"
                    onClick={() => setInputValue("How do I set up reward tiers?")}
                  >
                    How do I set up reward tiers?
                  </button>
                  <button
                    className="text-xs bg-neutral-100 dark:bg-neutral-700 px-3 py-1 rounded-full text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400"
                    onClick={() => setInputValue("Best rewards for coffee shops?")}
                  >
                    Best rewards for coffee shops?
                  </button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
