import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { MessageCircle, X, Send, Plane, LogIn, Mic, MicOff, Volume2, VolumeX, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { normalizeChatResponse } from "@/lib/chat-response";
import { useAuth } from "@/contexts/AuthContext";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
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

const WEBHOOK_URL = "https://airline-chatbot-v2-615090826594.asia-south1.run.app/api/v1/chat";

const createDefaultMessages = (): Message[] => [
  {
    id: "welcome",
    content: "Hello! Welcome to Tata Airways support. How can I assist you today?",
    role: "assistant",
    timestamp: new Date(),
  },
];

const ChatWidget = ({ onLoginRequest }: { onLoginRequest: () => void }) => {
  const { isAuthenticated, getToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(createDefaultMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [celebrationTicket, setCelebrationTicket] = useState<TicketInfo | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const recognition = useSpeechRecognition();
  const synth = useSpeechSynthesis();

  const hasTranscript = !!(recognition.finalText.trim() || recognition.interimText.trim());
  const showRecordingLayout = voiceMode && (recognition.isRecording || (hasTranscript && !inputValue));

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

  // Clear messages when auth state changes (logout/login)
  useEffect(() => {
    setMessages(createDefaultMessages());
    clearSessionId();
    recognition.cancel();
    synth.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current && isAuthenticated && !showRecordingLayout) {
      inputRef.current.focus();
    }
  }, [isOpen, isAuthenticated, showRecordingLayout]);

  // Stop speech / recording when widget closes
  useEffect(() => {
    if (!isOpen) {
      recognition.cancel();
      synth.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cleanup when voice mode turns off
  useEffect(() => {
    if (!voiceMode) {
      recognition.cancel();
      synth.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceMode]);

  // Mute toggle stops ongoing speech
  useEffect(() => {
    if (!ttsEnabled) synth.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttsEnabled]);

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? inputValue).trim();
    if (!text || isLoading || !isAuthenticated) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    recognition.cancel();
    synth.cancel();
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: getSessionId(),
        }),
      });

      const raw = await response.json();
      const data = normalizeChatResponse(raw);

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

      if (voiceMode && ttsEnabled && data.reply) {
        synth.speak(data.reply);
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

  const handleMicStart = () => {
    if (!recognition.isSupported) return;
    // If user had paused with text in input, push it back to finalText so it accumulates
    if (inputValue.trim() && !recognition.finalText.trim()) {
      recognition.setFinalText(inputValue.trim());
      setInputValue("");
    }
    recognition.start();
  };

  const handleMicPause = () => {
    recognition.stop();
    const text = (recognition.finalText + " " + recognition.interimText).trim();
    if (text) setInputValue(text);
  };

  const handleMicCancel = () => {
    recognition.cancel();
    setInputValue("");
  };

  const handleMicSend = () => {
    const text = (recognition.finalText + " " + recognition.interimText).trim() || inputValue.trim();
    recognition.cancel();
    if (text) sendMessage(text);
  };

  const toggleVoiceMode = () => {
    if (!recognition.isSupported) return;
    setVoiceMode((v) => {
      const next = !v;
      if (next) setTtsEnabled(true);
      return next;
    });
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
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-primary-foreground truncate">Tata Airways</h3>
            <p className="text-xs text-primary-foreground/80 truncate">Customer Support</p>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-1">
              <button
                onClick={toggleVoiceMode}
                disabled={!recognition.isSupported}
                title={
                  !recognition.isSupported
                    ? "Voice not supported in this browser"
                    : voiceMode
                      ? "Disable voice mode"
                      : "Enable voice mode"
                }
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  voiceMode
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30",
                  !recognition.isSupported && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Toggle voice mode"
              >
                {voiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>

              {voiceMode && synth.isSupported && (
                <button
                  onClick={() => setTtsEnabled((v) => !v)}
                  title={ttsEnabled ? "Mute voice replies" : "Unmute voice replies"}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
                  aria-label="Toggle text-to-speech"
                >
                  {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-primary-foreground/80">Online</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex min-h-0 flex-1 flex-col">
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
              <div className="min-h-0 flex-1 overflow-y-auto bg-chat-bg p-4">
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

              {/* Input area */}
              <div className="border-t bg-card p-4">
                {showRecordingLayout ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg border border-primary/30 bg-muted/40 p-3 min-h-[60px]">
                      <p className="text-sm text-foreground whitespace-pre-wrap pr-16">
                        {recognition.finalText}
                        <span className="text-muted-foreground italic">{recognition.interimText}</span>
                        {!recognition.finalText && !recognition.interimText && (
                          <span className="text-muted-foreground">Listening...</span>
                        )}
                      </p>
                      {recognition.isRecording && (
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                          </span>
                          <span className="text-[10px] font-medium uppercase tracking-wide text-destructive">Rec</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        onClick={handleMicCancel}
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Cancel recording"
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      {recognition.isRecording ? (
                        <Button
                          onClick={handleMicPause}
                          variant="secondary"
                          className="gap-2"
                          aria-label="Pause recording"
                        >
                          <Square className="h-4 w-4" />
                          Pause
                        </Button>
                      ) : (
                        <Button
                          onClick={handleMicStart}
                          variant="secondary"
                          className="gap-2"
                          aria-label="Resume recording"
                        >
                          <Mic className="h-4 w-4" />
                          Resume
                        </Button>
                      )}

                      <Button
                        onClick={handleMicSend}
                        disabled={!hasTranscript || isLoading}
                        className="gap-2"
                        aria-label="Send voice message"
                      >
                        <Send className="h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      {voiceMode && recognition.isSupported && (
                        <Button
                          onClick={handleMicStart}
                          size="icon"
                          variant="secondary"
                          className="shrink-0"
                          aria-label="Start voice input"
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                      )}
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={voiceMode ? "Type or tap mic to speak..." : "Type your message..."}
                        className="flex-1 border-muted bg-muted/50 focus-visible:ring-primary"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={() => sendMessage()}
                        disabled={!inputValue.trim() || isLoading}
                        size="icon"
                        className="shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {voiceMode ? "Voice mode on — replies will be spoken" : "Powered by Tata Airways"}
                    </p>
                  </>
                )}
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
