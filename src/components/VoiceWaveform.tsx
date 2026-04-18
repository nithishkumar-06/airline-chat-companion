import { cn } from "@/lib/utils";

interface VoiceWaveformProps {
  bars: number[];
  active: boolean;
  className?: string;
}

const VoiceWaveform = ({ bars, active, className }: VoiceWaveformProps) => {
  return (
    <div
      className={cn(
        "flex h-10 w-full items-center justify-center gap-[2px] overflow-hidden rounded-md bg-primary/5 px-2",
        className,
      )}
      aria-hidden="true"
    >
      {bars.map((value, i) => {
        const heightPct = active ? Math.max(8, value * 100) : 8;
        return (
          <span
            key={i}
            className="w-[3px] rounded-full bg-primary transition-[height] duration-75 ease-out"
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </div>
  );
};

export default VoiceWaveform;
