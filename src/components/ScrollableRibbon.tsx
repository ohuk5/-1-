import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playLabSound } from '../utils/soundEffects';

interface ScrollableRibbonProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  scrollAmount?: number;
  alwaysShowArrows?: boolean;
  arrowSize?: 'xs' | 'sm' | 'md';
}

export const ScrollableRibbon: React.FC<ScrollableRibbonProps> = ({
  children,
  className = '',
  containerClassName = '',
  scrollAmount = 180,
  alwaysShowArrows = false,
  arrowSize = 'sm'
}) => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Mouse drag-to-scroll state refs
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasMovedRef = useRef(false);

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollWidth, clientWidth, scrollLeft } = el;
    const overflow = scrollWidth > clientWidth + 4;
    setHasOverflow(overflow);

    const maxScroll = scrollWidth - clientWidth;
    const absScroll = Math.abs(scrollLeft);

    setCanScrollLeft(absScroll > 2 || scrollLeft > 2);
    setCanScrollRight(absScroll < maxScroll - 2 || scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    // Mouse wheel horizontal translation
    const handleWheel = (e: WheelEvent) => {
      // If user is scrolling wheel vertically, redirect to horizontal scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        const isRtl = isAr || document.documentElement.dir === 'rtl';
        // In RTL Chrome/Safari, scrollLeft decreases to move forward
        const directionFactor = isRtl ? -1 : 1;
        el.scrollLeft += e.deltaY * directionFactor;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });

    // Monitor DOM mutations inside ribbon
    const observer = new MutationObserver(checkScrollability);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', checkScrollability);
      observer.disconnect();
    };
  }, [checkScrollability, children, isAr]);

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    setIsMouseDown(true);
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = scrollRef.current;
    if (!el) return;

    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current && hasMovedRef.current) {
      // Prevent child button clicks if dragged
      const target = e.target as HTMLElement;
      const clickedBtn = target.closest('button');
      if (clickedBtn) {
        const preventClick = (clickEvent: MouseEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
          clickedBtn.removeEventListener('click', preventClick, true);
        };
        clickedBtn.addEventListener('click', preventClick, true);
      }
    }
    isDraggingRef.current = false;
    setIsMouseDown(false);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    const delta = direction === 'left' ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    playLabSound('click');
  };

  const showControls = alwaysShowArrows || hasOverflow;

  const arrowPadding =
    arrowSize === 'xs' ? 'p-1' : arrowSize === 'sm' ? 'p-1.5' : 'p-2';
  const iconSize =
    arrowSize === 'xs' ? 'w-3 h-3' : arrowSize === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const StartIcon = isAr ? ChevronRight : ChevronLeft;
  const startDirection: 'left' | 'right' = isAr ? 'right' : 'left';
  const EndIcon = isAr ? ChevronLeft : ChevronRight;
  const endDirection: 'left' | 'right' = isAr ? 'left' : 'right';

  return (
    <div className={`relative flex items-center w-full max-w-full ${containerClassName}`}>
      {/* Start Scroll Arrow (Right in RTL, Left in LTR) */}
      {showControls && (
        <button
          type="button"
          onClick={() => handleScroll(startDirection)}
          className={`${arrowPadding} rounded-xl border shrink-0 transition-all z-10 mx-0.5 shadow-xs ${
            isDark
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-cyan-500/50'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-cyan-500/50'
          }`}
          title={isAr ? 'تمرير الشريط لليمين' : 'Scroll ribbon left'}
          aria-label={isAr ? 'تمرير لليمين' : 'Scroll Left'}
        >
          <StartIcon className={iconSize} />
        </button>
      )}

      {/* Main Scrollable Viewport with Mouse Drag & Wheel Support */}
      <div
        ref={scrollRef}
        dir={isAr ? 'rtl' : 'ltr'}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex-1 flex items-center overflow-x-auto scroll-smooth scrollbar-none py-1 px-1 touch-pan-x select-none ${
          isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
        } ${className}`}
      >
        {children}
      </div>

      {/* End Scroll Arrow (Left in RTL, Right in LTR) */}
      {showControls && (
        <button
          type="button"
          onClick={() => handleScroll(endDirection)}
          className={`${arrowPadding} rounded-xl border shrink-0 transition-all z-10 mx-0.5 shadow-xs ${
            isDark
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-cyan-500/50'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-cyan-500/50'
          }`}
          title={isAr ? 'تمرير الشريط لليسار' : 'Scroll ribbon right'}
          aria-label={isAr ? 'تمرير لليسار' : 'Scroll Right'}
        >
          <EndIcon className={iconSize} />
        </button>
      )}
    </div>
  );
};
