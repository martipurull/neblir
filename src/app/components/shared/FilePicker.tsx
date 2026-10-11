"use client";

import { Button } from "@/app/components/shared/Button";
import { HiddenFileInput } from "@/app/components/shared/HiddenFileInput";
import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";

type FilePickerBaseProps = {
  id: string;
  accept: string;
  disabled?: boolean;
  onFile: (file: File | null) => void;
};

type FilePickerDropzoneProps = FilePickerBaseProps & {
  chrome: "dropzone";
  hint: string;
  /** Accessible name for the dashed drop area. */
  dropzoneLabel: string;
};

type FilePickerButtonProps = FilePickerBaseProps & {
  chrome: "button";
  buttonLabel: string;
};

export type FilePickerProps = FilePickerDropzoneProps | FilePickerButtonProps;

function firstDroppedFile(event: DragEvent): File | null {
  return event.dataTransfer.files?.[0] ?? null;
}

/** Dark game-modal file choice. Reports the chosen file; does not validate or upload. */
export function FilePicker(props: FilePickerProps) {
  const { id, accept, disabled = false, onFile } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const openDialog = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDialog();
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    if (disabled) return;
    onFile(firstDroppedFile(event));
  };

  const chrome =
    props.chrome === "button" ? (
      <Button
        type="button"
        variant="modalFooterSecondary"
        fullWidth={false}
        disabled={disabled}
        onClick={openDialog}
      >
        {props.buttonLabel}
      </Button>
    ) : (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? true : undefined}
        aria-label={props.dropzoneLabel}
        onClick={openDialog}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragActive(false);
        }}
        onDrop={handleDrop}
        className={`rounded-md border-2 border-dashed px-4 py-4 transition-colors ${
          isDragActive
            ? "border-paleBlue bg-paleBlue/10"
            : "border-white/40 bg-transparent"
        }`}
      >
        <div className="flex flex-col items-start gap-2">
          <Button
            type="button"
            variant="modalFooterSecondary"
            fullWidth={false}
            disabled={disabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openDialog();
            }}
          >
            Choose file
          </Button>
          <p className="text-xs text-white/80">{props.hint}</p>
        </div>
      </div>
    );

  return (
    <>
      {chrome}
      <HiddenFileInput
        ref={inputRef}
        id={id}
        accept={accept}
        disabled={disabled}
        onFile={onFile}
      />
    </>
  );
}
