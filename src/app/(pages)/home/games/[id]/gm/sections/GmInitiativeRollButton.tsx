import { formatSignedModifier } from "@/app/lib/enemyDetailsView";
import { Button } from "@/app/components/shared/Button";

type GmInitiativeRollButtonProps = {
  hasRolled: boolean;
  busy: boolean;
  modifier: number;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  /** Fill the container (GM NPC card action row). Enemy list stays compact. */
  fullWidth?: boolean;
};

export function GmInitiativeRollButton({
  hasRolled,
  busy,
  modifier,
  disabled = false,
  onClick,
  className,
  fullWidth = false,
}: GmInitiativeRollButtonProps) {
  return (
    <Button
      type="button"
      variant="semanticWarningOutline"
      fullWidth={fullWidth}
      disabled={disabled || busy || hasRolled}
      title={
        hasRolled
          ? "Initiative already recorded for this combatant."
          : undefined
      }
      className={className}
      onClick={onClick}
    >
      {busy
        ? "Rolling…"
        : hasRolled
          ? "Initiative rolled"
          : `Roll initiative (${formatSignedModifier(modifier)})`}
    </Button>
  );
}
