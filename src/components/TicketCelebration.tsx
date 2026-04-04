import { useEffect, useState } from "react";
import { Plane, CheckCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketInfo {
  ticketRef: string;
  category: string;
  priority: string;
  status: string;
  emailSent: boolean;
}

interface TicketCelebrationProps {
  ticket: TicketInfo;
  onClose: () => void;
}

const TicketCelebration = ({ ticket, onClose }: TicketCelebrationProps) => {
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);

  useEffect(() => {
    setShow(true);
    const generated = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
      size: Math.random() * 8 + 4,
    }));
    setParticles(generated);

    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center bg-primary/95 transition-all duration-300 overflow-hidden",
        show ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
    >
      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-ping"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: "1.5s",
          }}
        >
          <Plane
            className="text-primary-foreground/20"
            style={{ width: p.size, height: p.size }}
          />
        </div>
      ))}

      <div className="relative z-10 text-center px-6 animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/20 animate-bounce">
          <CheckCircle className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="text-xl font-bold text-primary-foreground mb-1">
          Ticket Created! 🎉
        </h3>
        <p className="text-primary-foreground/80 text-sm mb-4">
          We're on it — our team will get back to you soon.
        </p>

        <div className="rounded-xl bg-primary-foreground/10 backdrop-blur p-4 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary-foreground/60">Ticket ID</span>
            <span className="text-sm font-mono font-bold text-primary-foreground">
              {ticket.ticketRef}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary-foreground/60">Category</span>
            <span className="text-sm text-primary-foreground capitalize">{ticket.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary-foreground/60">Priority</span>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              ticket.priority === "high" ? "bg-destructive/20 text-primary-foreground" :
              ticket.priority === "medium" ? "bg-accent/20 text-primary-foreground" :
              "bg-primary-foreground/10 text-primary-foreground"
            )}>
              {ticket.priority}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-primary-foreground/60">Status</span>
            <span className="text-sm text-primary-foreground capitalize">{ticket.status}</span>
          </div>
          {ticket.emailSent && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-primary-foreground/10">
              <Mail className="h-3.5 w-3.5 text-primary-foreground/60" />
              <span className="text-xs text-primary-foreground/60">Confirmation email sent</span>
            </div>
          )}
        </div>

        <button
          onClick={() => { setShow(false); setTimeout(onClose, 300); }}
          className="mt-4 text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default TicketCelebration;
