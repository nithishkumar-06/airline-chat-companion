import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { MessageCircle, X, Send, Plane, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import ChatMessage from "./ChatMessage";
import TicketCelebration from "./TicketCelebration";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  ticket?: TicketInfo;
}

interface TicketInfo {
  ticketRef: string;
  category: string;
  priority: string;
  status: string;
  emailSent: boolean;
}

interface ApiResponse {
  sessionId: string;
  reply: string;
  actions: string[];
  conversationStatus: string;
  timestamp: string;
  ticket?: TicketInfo;
}

const WEBHOOK_URL = "https://ntihishkkumarg.app.n8n.cloud/webhook/airline-chatbot";

const ChatWidget = ({ onLoginRequest }: { onLoginRequest: () => void }) => {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! Welcome to Tata Airways support. How can I assist you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [celebrationTicket, setCelebrationTicket] = useState<TicketInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getSessionId = () => {
    let sessionId = localStorage.getItem("chat_session_id");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("chat_session_id", sessionId);
    }
    return sessionId;
  };

  const clearSessionId = () => {
    localStorage.removeItem("chat_session_id");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && isAuthenticated) {
      inputRef.current.focus();
    }
  }, [isOpen, isAuthenticated]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !isAuthenticated) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          usermessage: userMessage.content,
          sessionId: getSessionId(),
        }),
      });

      const data: ApiResponse = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply,
        role: "assistant",
        timestamp: new Date(data.timestamp),
        ticket: data.ticket,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.ticket) {
        setCelebrationTicket(data.ticket);
      }

      if (data.conversationStatus === "escalated" || data.conversationStatus === "completed") {
        clearSessionId();
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-chat transition-all duration-300 hover:scale-105",
          isOpen
            ? "bg-muted text-muted-foreground rotate-0"
            : "bg-primary text-primary-foreground animate-pulse-subtle"
        )}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 flex w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl bg-card shadow-chat-window transition-all duration-300",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        )}
        style={{ height: "min(600px, calc(100vh - 160px))" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-primary px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
            <Plane className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-primary-foreground">Tata Airways</h3>
            <p className="text-xs text-primary-foreground/80">Customer Support</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-primary-foreground/80">Online</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 flex flex-col">
          {/* Celebration overlay */}
          {celebrationTicket && (
            <TicketCelebration
              ticket={celebrationTicket}
              onClose={() => setCelebrationTicket(null)}
            />
          )}

          {isAuthenticated ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-chat-bg p-4">
                <div className="flex flex-col gap-3">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-message">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="border-t bg-card p-4">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 border-muted bg-muted/50 focus-visible:ring-primary"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Powered by Tata Airways
                </p>
              </div>
            </>
          ) : (
            /* Login prompt */
            <div className="flex-1 flex flex-col items-center justify-center bg-chat-bg p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
                <LogIn className="h-7 w-7 text-primary" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Sign in Required</h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
                Please sign in to your Tata Airways account to access customer support.
              </p>
              <Button onClick={onLoginRequest} className="gap-2">
                <LogIn className="h-4 w-4" />
                Sign In to Chat
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
