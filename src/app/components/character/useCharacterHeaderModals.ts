import { useState } from "react";
import type { AttackType } from "./AttackRollModal";
import type { StatEditType } from "./StatEditModal";

type UseCharacterHeaderModalsResult = {
  statModalOpen: StatEditType | null;
  setStatModalOpen: (v: StatEditType | null) => void;

  attackRollModal: AttackType | null;
  setAttackRollModal: (v: AttackType | null) => void;

  gridDefenceRollOpen: boolean;
  setGridDefenceRollOpen: (v: boolean) => void;

  meleeDefenceRollOpen: boolean;
  setMeleeDefenceRollOpen: (v: boolean) => void;

  rangeDefenceRollOpen: boolean;
  setRangeDefenceRollOpen: (v: boolean) => void;
};

export function useCharacterHeaderModals(): UseCharacterHeaderModalsResult {
  const [statModalOpen, setStatModalOpen] = useState<StatEditType | null>(null);
  const [attackRollModal, setAttackRollModal] = useState<AttackType | null>(
    null
  );
  const [gridDefenceRollOpen, setGridDefenceRollOpen] = useState(false);
  const [meleeDefenceRollOpen, setMeleeDefenceRollOpen] = useState(false);
  const [rangeDefenceRollOpen, setRangeDefenceRollOpen] = useState(false);

  return {
    statModalOpen,
    setStatModalOpen,
    attackRollModal,
    setAttackRollModal,
    gridDefenceRollOpen,
    setGridDefenceRollOpen,
    meleeDefenceRollOpen,
    setMeleeDefenceRollOpen,
    rangeDefenceRollOpen,
    setRangeDefenceRollOpen,
  };
}
