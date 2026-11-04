import { RemoteAvatar } from "@/app/components/shared/RemoteAvatar";
import type { Status } from "@prisma/client";

type GmCombatantAvatarProps = {
  name: string;
  imageKey?: string | null;
  imageUrl: string | null | undefined;
  status?: Status | null;
};

export function GmCombatantAvatar({
  name,
  imageKey,
  imageUrl,
  status,
}: GmCombatantAvatarProps) {
  return (
    <RemoteAvatar
      imageKey={imageKey}
      imageUrl={imageUrl}
      alt={name}
      size={44}
      className="h-11 w-11"
      status={status}
    />
  );
}
