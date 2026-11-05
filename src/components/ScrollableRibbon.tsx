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

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollWidth, clientWidth, scrollLeft } = el;
    const overflow = scrollWidth > clientWidth + 4;
    setHasOverflow(overflow);

    // In modern browsers, RTL scrollLeft can be 0 at rightmost and negative to the left,
    // or standard positive. We support both:
    const maxScroll = scrollWidth - clientWidth;
    const absScroll = Math.abs(scrollLeft);

    // General scroll indicator
    setCanScrollLeft(absScroll > 2 || scrollLeft > 2);
    setCanScrollRight(absScroll < maxScroll - 2 || scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScrollability, { passive: true });
    window.addEventListener('resize', checkScrollability);

    // Monitor DOM mutations inside ribbon
    const observer = new MutationObserver(checkScrollability);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
      observer.disconnect();
    };
  }, [checkScrollability, children]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;

    const isRtl = isAr || document.documentElement.dir === 'rtl';
    let delta = scrollAmount;

    if (direction === 'left') {
      // In RTL, left moves towards the end (negative scrollLeft in Chrome, or positive in Firefox)
      // We handle delta consistently:
      delta = isRtl ? -scrollAmount : -scrollAmount;
    } else {
      delta = isRtl ? scrollAmount : scrollAmount;
    }

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

      {/* Main Scrollable Viewport */}
      <div
        ref={scrollRef}
        dir={isAr ? 'rtl' : 'ltr'}
        className={`flex-1 flex items-center overflow-x-auto scroll-smooth scrollbar-none py-1 px-1 ${className}`}
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
