import { RemoteAvatar } from "@/app/components/shared/RemoteAvatar";

type GmCombatantAvatarProps = {
  name: string;
  imageKey?: string | null;
  imageUrl: string | null | undefined;
};

export function GmCombatantAvatar({
  name,
  imageKey,
  imageUrl,
}: GmCombatantAvatarProps) {
  return (
    <RemoteAvatar
      imageKey={imageKey}
      imageUrl={imageUrl}
      alt={name}
      size={44}
      className="h-11 w-11"
    />
  );
}
