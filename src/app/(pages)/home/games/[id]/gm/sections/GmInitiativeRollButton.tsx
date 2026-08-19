import { formatSignedModifier } from "@/app/lib/enemyDetailsView";
import { Button } from "@/app/components/shared/Button";

type GmInitiativeRollButtonProps = {
  hasRolled: boolean;
  busy: boolean;
  modifier: number;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

export function GmInitiativeRollButton({
  hasRolled,
  busy,
  modifier,
  disabled = false,
  onClick,
  className,
}: GmInitiativeRollButtonProps) {
  return (
    <Button
      type="button"
      variant="semanticWarningOutline"
      fullWidth={false}
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
