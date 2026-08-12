import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";

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
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-paleBlue/20">
      {imageUrl ? (
        <SignedRemoteImage
          src={imageUrl}
          imageKey={imageKey ?? undefined}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 object-cover object-top"
        />
      ) : imageUrl === undefined ? (
        <ImageLoadingSkeleton
          variant="avatar"
          className="h-full w-full [&_svg]:h-11 [&_svg]:w-11"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-black">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
