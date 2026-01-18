"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface StockContext {
  ticker: string;
  name: string;
  price: number;
  change: number;
  marketCap: string;
  industry: string;
}

interface AskAIChatProps {
  stockContext: StockContext;
}

export default function AskAIChat({ stockContext }: AskAIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive (only within chat container)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          stockContext,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I couldn't process that. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, stockContext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors cursor-pointer"
      >
        <MessageCircle className="size-3.5" />
        Ask AI
      </button>

      {/* Chat Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
            />

            {/* Chat Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              className="fixed bottom-4 right-4 md:absolute md:bottom-auto md:right-0 md:top-full md:mt-2 w-[calc(100vw-2rem)] md:w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Ask about {stockContext.ticker}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Powered by Gemini AI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="h-72 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <MessageCircle className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Ask me anything about
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {stockContext.name}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {[
                        "Should I buy?",
                        "What are the risks?",
                        "Price prediction?",
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setInput(suggestion);
                            inputRef.current?.focus();
                          }}
                          className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${
                        message.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`shrink-0 size-7 rounded-full flex items-center justify-center ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="size-4" />
                        ) : (
                          <Bot className="size-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}
                      >
                        {message.content}
                      </div>
                    </motion.div>
                  ))
                )}

                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2"
                  >
                    <div className="shrink-0 size-7 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="size-4" />
                    </div>
                    <div className="bg-muted p-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="size-2 rounded-full bg-muted-foreground/50"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your question..."
                    className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="shrink-0 size-10 rounded-xl"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  AI responses are for informational purposes only
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
