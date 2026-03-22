import InfoCard from "@/app/components/shared/InfoCard";
import React from "react";
import { GmSectionTitle } from "./GmSectionTitle";

type GmPlaceholderSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function GmPlaceholderSection({
  title,
  children,
}: GmPlaceholderSectionProps) {
  return (
    <InfoCard border>
      <GmSectionTitle>{title}</GmSectionTitle>
      <p className="mt-1 text-sm text-black/70">{children}</p>
    </InfoCard>
  );
}
