import React, { useMemo, useState } from 'react';
import { RotateCw, Calculator, Play, Search, BookOpen, CheckCircle2 } from 'lucide-react';
import { useApp, CalculatorTabType, ActiveTabType, PhysicsStationId } from '../context/AppContext';
import { LAW_FLASHCARDS_DATA, LawFlashcardItem } from '../data/lawFlashcardsData';
import { playLabSound } from '../utils/soundEffects';

interface InteractiveLawFlipCardsProps {
  domainFilter: 'physics' | 'chemistry' | 'all';
  onLaunchPhysicsStation?: (station: PhysicsStationId) => void;
  onLaunchChemistryTab?: (tab: ActiveTabType) => void;
  onOpenCalculatorTab?: (tab: CalculatorTabType) => void;
}

export const InteractiveLawFlipCards: React.FC<InteractiveLawFlipCardsProps> = ({
  domainFilter,
  onLaunchPhysicsStation,
  onLaunchChemistryTab,
  onOpenCalculatorTab
}) => {
  const { theme, lang, t, openCalculator, setActiveTab, setPhysicsStation, setCurrentDomain } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});

  const baseCards = useMemo(() => {
    return domainFilter === 'all'
      ? LAW_FLASHCARDS_DATA
      : LAW_FLASHCARDS_DATA.filter((c) => c.domain === domainFilter);
  }, [domainFilter]);

  const courses = useMemo(() => {
    const map = new Map<string, { ar: string; en: string }>();
    baseCards.forEach((c) => {
      if (!map.has(c.courseAr)) {
        map.set(c.courseAr, { ar: c.courseAr, en: c.courseEn });
      }
    });
    return Array.from(map.values());
  }, [baseCards]);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return baseCards.filter((card) => {
      const matchesCourse = courseFilter === 'all' || card.courseAr === courseFilter;
      const matchesQuery =
        !q ||
        card.titleAr.toLowerCase().includes(q) ||
        card.titleEn.toLowerCase().includes(q) ||
        card.formula.toLowerCase().includes(q) ||
        card.chapterAr.toLowerCase().includes(q) ||
        card.chapterEn.toLowerCase().includes(q);
      return matchesCourse && matchesQuery;
    });
  }, [baseCards, courseFilter, searchQuery]);

  const toggleFlip = (id: string) => {
    playLabSound('click');
    setFlippedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenSimulator = (e: React.MouseEvent, card: LawFlashcardItem) => {
    e.stopPropagation();
    playLabSound('click');
    if (card.domain === 'physics' && card.physicsStation) {
      if (onLaunchPhysicsStation) {
        onLaunchPhysicsStation(card.physicsStation);
      } else {
        setCurrentDomain('physics');
        setPhysicsStation(card.physicsStation);
      }
    } else if (card.domain === 'chemistry' && card.chemistryTab) {
      if (onLaunchChemistryTab) {
        onLaunchChemistryTab(card.chemistryTab);
      } else {
        setCurrentDomain('chemistry');
        setActiveTab(card.chemistryTab);
      }
    }
  };

  const handleOpenCalc = (e: React.MouseEvent, card: LawFlashcardItem) => {
    e.stopPropagation();
    playLabSound('click');
    if (!card.calculatorTab) return;
    if (onOpenCalculatorTab) {
      onOpenCalculatorTab(card.calculatorTab);
    } else {
      openCalculator(card.calculatorTab);
    }
  };

  const accentBorder =
    domainFilter === 'physics'
      ? isDark
        ? 'border-indigo-500/40 hover:border-indigo-400'
        : 'border-indigo-200 hover:border-indigo-400'
      : isDark
      ? 'border-cyan-500/40 hover:border-cyan-400'
      : 'border-cyan-200 hover:border-cyan-400';

  const activeFilterBtn =
    domainFilter === 'physics'
      ? 'bg-indigo-600 text-white'
      : 'bg-cyan-600 text-white';

  return (
    <div className="w-full space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Section Header & Filters */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className={`w-5 h-5 ${domainFilter === 'physics' ? 'text-indigo-400' : 'text-cyan-500'}`} />
            <h2 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('بطاقات القوانين والأمثلة المحلولة التفاعلية', 'Interactive Law & Worked-Example Flashcards')}
            </h2>
          </div>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {t(
              'انقر على أي بطاقة لقلبها واستعراض الشرح المفهومي والمثال العددي المحلول خطوة بخطوة، أو انتقل مباشرة للمحاكي 3D.',
              'Click any card to flip between the law formula and its step-by-step worked example, or jump straight to the 3D simulator.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Course Filter Segmented Control */}
          <div
            className={`inline-flex p-1 rounded-xl border flex-wrap gap-1 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => setCourseFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                courseFilter === 'all'
                  ? activeFilterBtn
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('الكل', 'All')}
            </button>
            {courses.map((course) => (
              <button
                key={course.ar}
                type="button"
                onClick={() => setCourseFilter(course.ar)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  courseFilter === course.ar
                    ? activeFilterBtn
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t(course.ar, course.en)}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('ابحث عن قانون أو رمز...', 'Search law or formula...')}
              className={`w-full ps-8 pe-3 py-1.5 rounded-xl border text-xs outline-none transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Flipping Cards Grid */}
      {filteredCards.length === 0 ? (
        <div
          className={`p-10 rounded-2xl border text-center text-sm ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          {t('لا توجد بطاقات مطابقة لبحثك.', 'No matching law flashcards found.')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCards.map((card) => {
            const isFlipped = !!flippedIds[card.id];
            return (
              <div key={card.id} className="perspective-1200 min-h-[290px]">
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={isFlipped}
                  onClick={() => toggleFlip(card.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFlip(card.id);
                    }
                  }}
                  className={`relative w-full h-full min-h-[290px] preserve-3d transition-transform duration-500 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-2xl ${
                    isFlipped ? 'rotate-y-180' : ''
                  }`}
                >
                  {/* FRONT FACE: Law Formula & Variables */}
                  <div
                    className={`absolute inset-0 backface-hidden rounded-2xl border p-5 flex flex-col justify-between transition-colors ${accentBorder} ${
                      isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Quiet Unboxed Metadata */}
                      <div className={`flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{t(card.courseAr, card.courseEn)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{t(card.chapterAr, card.chapterEn)}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 font-medium text-cyan-500">
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>{t('اقلب البطاقة', 'Flip')}</span>
                        </span>
                      </div>

                      {/* Law Title */}
                      <h3 className="text-base font-bold leading-snug">
                        {t(card.titleAr, card.titleEn)}
                      </h3>

                      {/* Crisp Formula Display */}
                      <div
                        dir="ltr"
                        className={`p-3.5 rounded-xl border text-center font-mono text-sm sm:text-base font-bold tracking-tight tabular-nums ${
                          isDark
                            ? 'bg-slate-950 border-slate-800 text-cyan-300'
                            : 'bg-slate-50 border-slate-200 text-indigo-700'
                        }`}
                      >
                        {card.formula}
                      </div>
                    </div>

                    {/* Variables Footer */}
                    <div className={`pt-3 border-t text-xs leading-relaxed ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                      {t(card.variablesAr, card.variablesEn)}
                    </div>
                  </div>

                  {/* BACK FACE: Conceptual Explanation, Solved Example & Deep Links */}
                  <div
                    className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border p-5 flex flex-col justify-between ${
                      isDark
                        ? 'bg-slate-950 border-cyan-500/50 text-slate-100'
                        : 'bg-slate-50 border-indigo-300 text-slate-900 shadow-md'
                    }`}
                  >
                    <div className="space-y-2.5 overflow-y-auto">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('الشرح والمثال المحلول', 'Concept & Worked Example')}</span>
                        </span>
                        <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <RotateCw className="w-3 h-3" />
                          <span>{t('الوجه الأمامي', 'Front')}</span>
                        </span>
                      </div>

                      <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {t(card.conceptAr, card.conceptEn)}
                      </p>

                      <div
                        className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className={`font-semibold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                          {t(card.exampleProblemAr, card.exampleProblemEn)}
                        </div>
                        <div dir="ltr" className={`font-mono font-bold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {t(card.exampleSolutionAr, card.exampleSolutionEn)}
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-2.5 border-t border-slate-800/30 flex items-center gap-2 shrink-0">
                      {(card.physicsStation || card.chemistryTab) && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenSimulator(e, card)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                            domainFilter === 'physics'
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>{t('جرب في المحاكي', 'Run Simulator')}</span>
                        </button>
                      )}
                      {card.calculatorTab && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenCalc(e, card)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                              : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>{t('الحاسبة', 'Calculator')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
