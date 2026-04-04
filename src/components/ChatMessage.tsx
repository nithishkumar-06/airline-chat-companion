import { cn } from "@/lib/utils";
import { Plane, User, Tag, ArrowUpRight } from "lucide-react";

interface TicketInfo {
  ticketRef: string;
  category: string;
  priority: string;
  status: string;
  emailSent: boolean;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  ticket?: TicketInfo;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className={cn(
        "flex gap-2 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Plane className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-message",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-card text-card-foreground"
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>

        {message.ticket && (
          <div className="mt-3 rounded-lg bg-secondary/50 border border-border p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Ticket Created</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Ref</span>
              <span className="font-mono font-semibold text-foreground">{message.ticket.ticketRef}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Category</span>
              <span className="capitalize text-foreground">{message.ticket.category}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Priority</span>
              <span className={cn(
                "capitalize font-medium px-1.5 py-0.5 rounded text-[10px]",
                message.ticket.priority === "high" ? "bg-destructive/10 text-destructive" :
                message.ticket.priority === "medium" ? "bg-accent/10 text-accent" :
                "bg-muted text-muted-foreground"
              )}>
                {message.ticket.priority}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Status</span>
              <span className="flex items-center gap-1 capitalize text-foreground">
                <ArrowUpRight className="h-3 w-3" />
                {message.ticket.status}
              </span>
            </div>
          </div>
        )}

        <p
          className={cn(
            "mt-1 text-xs",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
