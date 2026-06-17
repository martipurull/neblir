import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const SWIPE_THRESHOLD_PX = 40;
const WHEEL_WRAP_THRESHOLD = 20;

export type UseCarouselOptions = {
  /** When true, scrolling past an edge jumps to the opposite end. Default true. */
  wrapAtEdges?: boolean;
};

/** Null/missing user preference => wrap enabled (legacy carousel behaviour). */
export function resolveCharacterCarouselWrap(
  wrap: boolean | null | undefined
): boolean {
  return wrap ?? true;
}

export function resolveCarouselIndex(
  index: number,
  sectionCount: number,
  wrapAtEdges: boolean
): number {
  if (sectionCount <= 0) return 0;
  if (wrapAtEdges) {
    return ((index % sectionCount) + sectionCount) % sectionCount;
  }
  return Math.max(0, Math.min(index, sectionCount - 1));
}

export function resolveCarouselNavAvailability(
  wrapAtEdges: boolean,
  sectionCount: number,
  currentIndex: number
): { canGoPrev: boolean; canGoNext: boolean } {
  if (wrapAtEdges) {
    return {
      canGoPrev: sectionCount > 0,
      canGoNext: sectionCount > 0,
    };
  }
  return {
    canGoPrev: currentIndex > 0,
    canGoNext: currentIndex < sectionCount - 1,
  };
}

/** When sectionKeys reference changes, we restore scroll to the last index (so mutate doesn't reset the slide). */
export function useCarousel(
  sectionCount: number,
  sectionKeys?: readonly string[],
  options?: UseCarouselOptions
) {
  const wrapAtEdges = options?.wrapAtEdges ?? true;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const lastIndexRef = useRef(0);
  const isRestoringScrollRef = useRef(false);
  const touchState = useRef<{
    startX: number;
    startScrollLeft: number;
    atRightEdge: boolean;
    atLeftEdge: boolean;
    wrapToStart: boolean;
    wrapToEnd: boolean;
  } | null>(null);

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = scrollRef.current;
      if (!container || sectionCount === 0) return;
      const firstSlide = container.querySelector("[data-slide-index='0']");
      if (!firstSlide) return;
      const slideWidth = (firstSlide as HTMLElement).offsetWidth;
      const gap = 16;
      const step = slideWidth + gap;
      const targetIndex = resolveCarouselIndex(
        index,
        sectionCount,
        wrapAtEdges
      );
      lastIndexRef.current = targetIndex;
      const left = targetIndex * step;
      container.scrollTo({ left, behavior: "smooth" });
      setCurrentIndex(targetIndex);
    },
    [sectionCount, wrapAtEdges]
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isRestoringScrollRef.current) return;
      const firstSlide = container.querySelector("[data-slide-index='0']");
      if (!firstSlide) return;
      const slideWidth = (firstSlide as HTMLElement).offsetWidth;
      const gap = 16;
      const step = slideWidth + gap;
      const scrollLeft = container.scrollLeft;
      const index = Math.round(scrollLeft / step);
      const clampedIndex = Math.max(0, Math.min(index, sectionCount - 1));
      lastIndexRef.current = clampedIndex;
      setCurrentIndex(clampedIndex);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [sectionCount]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || sectionCount <= 1 || !wrapAtEdges) return;

    const handleTouchStart = (e: TouchEvent) => {
      const scrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      touchState.current = {
        startX: e.touches[0].clientX,
        startScrollLeft: scrollLeft,
        atRightEdge: scrollLeft >= maxScroll - 2,
        atLeftEdge: scrollLeft <= 2,
        wrapToStart: false,
        wrapToEnd: false,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const state = touchState.current;
      if (!state) return;
      const deltaX = e.touches[0].clientX - state.startX;
      if (state.atRightEdge && deltaX < -SWIPE_THRESHOLD_PX)
        state.wrapToStart = true;
      if (state.atLeftEdge && deltaX > SWIPE_THRESHOLD_PX)
        state.wrapToEnd = true;
    };

    const handleTouchEnd = () => {
      const state = touchState.current;
      touchState.current = null;
      if (!state) return;
      if (state.wrapToStart) scrollToIndex(0);
      else if (state.wrapToEnd) scrollToIndex(sectionCount - 1);
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });
    container.addEventListener("touchcancel", handleTouchEnd, {
      passive: true,
    });
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [sectionCount, scrollToIndex, wrapAtEdges]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || sectionCount <= 1 || !wrapAtEdges) return;

    const handleWheel = (e: WheelEvent) => {
      const scrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const atRightEdge = scrollLeft >= maxScroll - 2;
      const atLeftEdge = scrollLeft <= 2;
      const deltaX = e.deltaX;

      if (atRightEdge && deltaX > WHEEL_WRAP_THRESHOLD) {
        e.preventDefault();
        scrollToIndex(0);
      } else if (atLeftEdge && deltaX < -WHEEL_WRAP_THRESHOLD) {
        e.preventDefault();
        scrollToIndex(sectionCount - 1);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [sectionCount, scrollToIndex, wrapAtEdges]);

  useLayoutEffect(() => {
    if (sectionKeys == null || sectionKeys.length === 0 || sectionCount === 0)
      return;
    const container = scrollRef.current;
    if (!container) return;
    const firstSlide = container.querySelector("[data-slide-index='0']");
    if (!firstSlide) return;
    const slideWidth = (firstSlide as HTMLElement).offsetWidth;
    const gap = 16;
    const step = slideWidth + gap;
    const targetIndex = Math.max(
      0,
      Math.min(lastIndexRef.current, sectionCount - 1)
    );
    isRestoringScrollRef.current = true;
    container.scrollLeft = targetIndex * step;
    setCurrentIndex(targetIndex);
    lastIndexRef.current = targetIndex;
    requestAnimationFrame(() => {
      isRestoringScrollRef.current = false;
    });
  }, [sectionKeys, sectionCount]);

  const { canGoPrev, canGoNext } = resolveCarouselNavAvailability(
    wrapAtEdges,
    sectionCount,
    currentIndex
  );

  return {
    scrollRef,
    currentIndex,
    scrollToIndex,
    canGoPrev,
    canGoNext,
  };
}
