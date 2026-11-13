import React from 'react';
import { useApp } from '../context/AppContext';

export interface StageViewportFrameProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  toolbar?: React.ReactNode;
  bottomBar?: React.ReactNode;
  isFullscreen?: boolean;
  canvasHeightClass?: string;
  accentColor?: 'cyan' | 'indigo' | 'amber' | 'emerald';
  children: React.ReactNode;
}

/**
 * Unified Zero-Occlusion 3D Stage Viewport Frame.
 * Strictly places Title, Metadata, and Interactive Toolbars OUTSIDE the WebGL canvas
 * in dedicated top/bottom architectural bars so controls never overlap specimen titles.
 */
export const StageViewportFrame: React.FC<StageViewportFrameProps> = ({
  title,
  subtitle,
  toolbar,
  bottomBar,
  isFullscreen = false,
  canvasHeightClass = 'h-[380px] sm:h-[430px]',
  accentColor = 'cyan',
  children
}) => {
  const { theme, lang } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const fullscreenRing =
    accentColor === 'indigo'
      ? 'border-indigo-500/60'
      : accentColor === 'amber'
      ? 'border-amber-500/60'
      : accentColor === 'emerald'
      ? 'border-emerald-500/60'
      : 'border-cyan-500/60';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`w-full rounded-2xl border overflow-hidden flex flex-col select-none transition-colors ${
        isFullscreen
          ? `fixed inset-3 sm:inset-5 z-50 border-2 ${fullscreenRing} shadow-2xl`
          : 'shadow-md'
      } ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* External Top Header & Toolbar (Outside WebGL Canvas - Zero Overlap) */}
      <div
        className={`px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            {title}
          </div>
          {subtitle && (
            <div className={`text-xs flex items-center gap-1.5 flex-wrap ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {subtitle}
            </div>
          )}
        </div>

        {toolbar && (
          <div className="flex items-center gap-1 flex-wrap shrink-0">
            {toolbar}
          </div>
        )}
      </div>

      {/* Pure Unobstructed 3D WebGL Viewport */}
      <div
        className={`relative w-full overflow-hidden bg-slate-950 ${
          isFullscreen ? 'flex-1 min-h-0' : canvasHeightClass
        }`}
      >
        {children}
      </div>

      {/* External Bottom Bar / Caption Strip (Outside WebGL Canvas) */}
      {bottomBar && (
        <div
          className={`px-3.5 py-2 border-t text-xs shrink-0 ${
            isDark
              ? 'bg-slate-900 border-slate-800 text-slate-400'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          {bottomBar}
        </div>
      )}
    </div>
  );
};
