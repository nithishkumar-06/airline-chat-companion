import { useEffect, useState, useCallback } from "react";
import { Plane, CheckCircle, Mail, Sparkles } from "lucide-react";
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

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
  size: number;
  color: string;
  type: "confetti" | "plane" | "sparkle";
  rotation: number;
  duration: number;
}

interface FlyingPlane {
  id: number;
  y: number;
  delay: number;
  direction: "ltr" | "rtl";
  speed: number;
  size: number;
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(45 93% 58%)",    // gold
  "hsl(340 82% 59%)",   // pink
  "hsl(160 72% 48%)",   // emerald
  "hsl(270 70% 60%)",   // purple
  "hsl(200 80% 55%)",   // sky
];

const TicketCelebration = ({ ticket, onClose }: TicketCelebrationProps) => {
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [flyingPlanes, setFlyingPlanes] = useState<FlyingPlane[]>([]);
  const [poppers, setPoppers] = useState<Array<{ id: number; x: number; side: "left" | "right" }>>([]);

  const dismiss = useCallback(() => {
    setShow(false);
    setTimeout(onClose, 400);
  }, [onClose]);

  useEffect(() => {
    setShow(true);

    // Confetti particles
    const confetti: Particle[] = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      delay: Math.random() * 0.8,
      size: Math.random() * 8 + 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      type: Math.random() > 0.7 ? "sparkle" : "confetti",
      rotation: Math.random() * 360,
      duration: 2 + Math.random() * 2,
    }));

    // Small planes scattered
    const planeParticles: Particle[] = Array.from({ length: 8 }, (_, i) => ({
      id: 100 + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 1,
      size: Math.random() * 10 + 8,
      color: "hsl(var(--primary-foreground))",
      type: "plane" as const,
      rotation: Math.random() * 360,
      duration: 2 + Math.random() * 1.5,
    }));

    setParticles([...confetti, ...planeParticles]);

    // Flying planes (left to right and right to left)
    const planes: FlyingPlane[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      y: 10 + Math.random() * 70,
      delay: i * 0.6 + Math.random() * 0.3,
      direction: i % 2 === 0 ? "ltr" : "rtl",
      speed: 2 + Math.random() * 2,
      size: 16 + Math.random() * 12,
    }));
    setFlyingPlanes(planes);

    // Poppers (bursting from sides)
    const popperItems = Array.from({ length: 4 }, (_, i) => ({
      id: i,
      x: i % 2 === 0 ? 5 : 95,
      side: (i % 2 === 0 ? "left" : "right") as "left" | "right",
    }));
    setPoppers(popperItems);

    const timer = setTimeout(dismiss, 6000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center transition-all duration-400 overflow-hidden",
        show ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
      style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 50%, hsl(var(--accent) / 0.8) 100%)" }}
    >
      {/* Confetti rain */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        >
          {p.type === "plane" ? (
            <Plane
              style={{ width: p.size, height: p.size, color: "hsl(var(--primary-foreground) / 0.3)" }}
            />
          ) : p.type === "sparkle" ? (
            <Sparkles
              style={{ width: p.size, height: p.size, color: p.color }}
            />
          ) : (
            <div
              style={{
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
                borderRadius: "2px",
              }}
            />
          )}
        </div>
      ))}

      {/* Flying planes across screen */}
      {flyingPlanes.map((plane) => (
        <div
          key={`fly-${plane.id}`}
          className="absolute pointer-events-none"
          style={{
            top: `${plane.y}%`,
            animation: `${plane.direction === "ltr" ? "flyLTR" : "flyRTL"} ${plane.speed}s ease-in-out ${plane.delay}s forwards`,
            left: plane.direction === "ltr" ? "-10%" : "auto",
            right: plane.direction === "rtl" ? "-10%" : "auto",
          }}
        >
          <Plane
            style={{
              width: plane.size,
              height: plane.size,
              color: "hsl(var(--primary-foreground) / 0.4)",
              transform: plane.direction === "rtl" ? "scaleX(-1)" : "none",
            }}
          />
        </div>
      ))}

      {/* Popper bursts */}
      {poppers.map((popper) => (
        <div
          key={`pop-${popper.id}`}
          className="absolute pointer-events-none"
          style={{
            left: `${popper.x}%`,
            top: "50%",
            animation: "popperBurst 0.6s ease-out forwards",
            animationDelay: `${popper.id * 0.2}s`,
          }}
        >
          {Array.from({ length: 8 }, (_, j) => (
            <div
              key={j}
              className="absolute"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: CONFETTI_COLORS[j % CONFETTI_COLORS.length],
                animation: `popperPiece 1s ease-out ${popper.id * 0.2}s forwards`,
                transform: `rotate(${j * 45}deg) translateY(-${20 + Math.random() * 30}px)`,
              }}
            />
          ))}
        </div>
      ))}

      {/* Main content card */}
      <div
        className="relative z-10 text-center px-6 w-full max-w-[320px]"
        style={{
          animation: show ? "celebrationPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both" : "none",
        }}
      >
        {/* Animated check icon */}
        <div className="mx-auto mb-4 relative">
          <div
            className="flex h-18 w-18 items-center justify-center rounded-full mx-auto"
            style={{
              background: "hsl(var(--primary-foreground) / 0.2)",
              animation: "celebrationPulse 1.5s ease-in-out infinite",
              width: 72,
              height: 72,
            }}
          >
            <CheckCircle className="h-9 w-9" style={{ color: "hsl(var(--primary-foreground))" }} />
          </div>
          {/* Ring animation */}
          <div
            className="absolute inset-0 rounded-full mx-auto"
            style={{
              width: 72,
              height: 72,
              left: "50%",
              transform: "translateX(-50%)",
              border: "2px solid hsl(var(--primary-foreground) / 0.3)",
              animation: "ringExpand 1.5s ease-out infinite",
            }}
          />
        </div>

        <h3
          className="text-xl font-bold mb-1"
          style={{ color: "hsl(var(--primary-foreground))" }}
        >
          Ticket Created! ✈️🎉
        </h3>
        <p
          className="text-sm mb-4"
          style={{ color: "hsl(var(--primary-foreground) / 0.8)" }}
        >
          We're on it — our team will get back to you soon.
        </p>

        {/* Ticket details card */}
        <div
          className="rounded-xl backdrop-blur p-4 text-left space-y-2"
          style={{
            background: "hsl(var(--primary-foreground) / 0.12)",
            border: "1px solid hsl(var(--primary-foreground) / 0.15)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "hsl(var(--primary-foreground) / 0.6)" }}>Ticket ID</span>
            <span
              className="text-sm font-mono font-bold"
              style={{ color: "hsl(var(--primary-foreground))" }}
            >
              {ticket.ticketRef}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "hsl(var(--primary-foreground) / 0.6)" }}>Category</span>
            <span
              className="text-sm capitalize"
              style={{ color: "hsl(var(--primary-foreground))" }}
            >
              {ticket.category}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "hsl(var(--primary-foreground) / 0.6)" }}>Priority</span>
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
              )}
              style={{
                background: ticket.priority === "high"
                  ? "hsl(0 72% 50% / 0.25)"
                  : ticket.priority === "medium"
                  ? "hsl(45 93% 58% / 0.25)"
                  : "hsl(var(--primary-foreground) / 0.12)",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              {ticket.priority}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "hsl(var(--primary-foreground) / 0.6)" }}>Status</span>
            <span
              className="text-sm capitalize"
              style={{ color: "hsl(var(--primary-foreground))" }}
            >
              {ticket.status}
            </span>
          </div>
          {ticket.emailSent && (
            <div
              className="flex items-center gap-1.5 pt-2 mt-1"
              style={{ borderTop: "1px solid hsl(var(--primary-foreground) / 0.1)" }}
            >
              <Mail className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary-foreground) / 0.6)" }} />
              <span className="text-xs" style={{ color: "hsl(var(--primary-foreground) / 0.6)" }}>
                Confirmation email sent
              </span>
            </div>
          )}
        </div>

        <button
          onClick={dismiss}
          className="mt-4 text-xs underline transition-colors"
          style={{ color: "hsl(var(--primary-foreground) / 0.6)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--primary-foreground))")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--primary-foreground) / 0.6)")}
        >
          Dismiss
        </button>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
        }
        @keyframes flyLTR {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(calc(100vw + 50px)); opacity: 0; }
        }
        @keyframes flyRTL {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(calc(-100vw - 50px)); opacity: 0; }
        }
        @keyframes celebrationPop {
          0% { transform: scale(0.3); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes celebrationPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes ringExpand {
          0% { transform: translateX(-50%) scale(1); opacity: 0.6; }
          100% { transform: translateX(-50%) scale(1.8); opacity: 0; }
        }
        @keyframes popperBurst {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
        @keyframes popperPiece {
          0% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(0); }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-60px); }
        }
      `}</style>
    </div>
  );
};

export default TicketCelebration;
