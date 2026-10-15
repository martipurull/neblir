import { ImageLoadingSkeleton } from "@/app/components/shared/ImageLoadingSkeleton";
import { SignedRemoteImage } from "@/app/components/shared/SignedRemoteImage";

type WalletCurrencyIconSize = "sm" | "md";

const sizeStyles: Record<
  WalletCurrencyIconSize,
  { shell: string; image: string; pixels: number }
> = {
  sm: {
    shell: "h-6 w-6 bg-paleBlue/60",
    image: "h-6 w-6",
    pixels: 24,
  },
  md: {
    shell: "h-8 w-8 bg-paleBlue/30",
    image: "h-8 w-8",
    pixels: 32,
  },
};

type WalletCurrencyIconProps = {
  name: string;
  imageKey: string;
  imageUrl: string | null | undefined;
  size?: WalletCurrencyIconSize;
};

export function WalletCurrencyIcon({
  name,
  imageKey,
  imageUrl,
  size = "md",
}: WalletCurrencyIconProps) {
  const styles = sizeStyles[size];
  return (
    <div className={`shrink-0 overflow-hidden rounded-full ${styles.shell}`}>
      {imageUrl ? (
        <SignedRemoteImage
          src={imageUrl}
          imageKey={imageKey}
          alt=""
          width={styles.pixels}
          height={styles.pixels}
          className={`${styles.image} object-cover object-center`}
        />
      ) : imageUrl === undefined ? (
        <ImageLoadingSkeleton variant="currency" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-black">
          {name.charAt(0)}
        </div>
      )}
    </div>
  );
}
