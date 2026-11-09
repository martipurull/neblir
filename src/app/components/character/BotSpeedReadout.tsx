type BotSpeedReadoutProps = {
  speed: number;
  effectiveSpeed: number;
  strikethrough: boolean;
  tone?: "light" | "dark";
};

export function BotSpeedReadout({
  speed,
  effectiveSpeed,
  strikethrough,
  tone = "light",
}: BotSpeedReadoutProps) {
  const value = tone === "dark" ? "text-white" : "text-black";
  const muted = tone === "dark" ? "text-white/50" : "text-black/50";
  if (!strikethrough) {
    return <span className={`tabular-nums ${value}`}>{effectiveSpeed}m</span>;
  }
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={`tabular-nums line-through ${muted}`}>{speed}m</span>
      <span className={`tabular-nums ${value}`}>{effectiveSpeed}m</span>
    </span>
  );
}
