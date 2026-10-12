type ChosenFileNameProps = {
  /** "Selected" after a new choice, "Current file" for the stored file. */
  label: "Selected" | "Current file";
  fileName: string;
  fileSizeBytes: number;
};

/** Name and size line under a game-modal file picker. */
export function ChosenFileName({
  label,
  fileName,
  fileSizeBytes,
}: ChosenFileNameProps) {
  const sizeKb = Math.ceil(fileSizeBytes / 1024);
  return (
    <p className="mt-1 text-xs text-white/70">
      {label}: {fileName} ({sizeKb} KB)
    </p>
  );
}
