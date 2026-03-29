"use client";

import React, { forwardRef } from "react";

interface CarouselTrackProps {
  children: React.ReactNode;
}

export const CarouselTrack = forwardRef<HTMLDivElement, CarouselTrackProps>(
  function CarouselTrack({ children }, ref) {
    return (
      <div
        ref={ref}
        className="min-h-0 min-w-0 flex-1 overflow-x-auto overscroll-x-contain scroll-smooth px-2 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <div className="flex h-full gap-4">{children}</div>
      </div>
    );
  }
);
