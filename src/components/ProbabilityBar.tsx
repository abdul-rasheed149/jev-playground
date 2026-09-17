const TONES = {
  emerald: "bg-emerald-400",
  sky: "bg-sky-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  violet: "bg-violet-400",
  zinc: "bg-zinc-600",
} as const;

export function ProbabilityBar({
  value,
  tone = "sky",
  className = "",
}: {
  value: number;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-zinc-800 ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${TONES[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
