import {
  emitIsPrivateFromRollPrivacy,
  type RollPrivacyOptions,
} from "@/app/lib/roll-privacy";
import { useEffect, useState } from "react";

export function usePrivateRollState(
  isOpen: boolean,
  rollPrivacy: RollPrivacyOptions
) {
  const [isPrivateRoll, setIsPrivateRoll] = useState(
    rollPrivacy.defaultPrivateRoll
  );

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setIsPrivateRoll(rollPrivacy.defaultPrivateRoll);
    });
  }, [isOpen, rollPrivacy.defaultPrivateRoll]);

  const emitIsPrivate = emitIsPrivateFromRollPrivacy(
    rollPrivacy,
    isPrivateRoll
  );

  return { isPrivateRoll, setIsPrivateRoll, emitIsPrivate };
}
