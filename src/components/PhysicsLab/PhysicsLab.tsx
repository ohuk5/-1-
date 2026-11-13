import React, { useState } from 'react';
import { Wind, Zap, Orbit, Flame, BookOpen, Layers, Box, RotateCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GasThermodynamicsSim } from './GasThermodynamicsSim';
import { ElectrostaticsSim } from './ElectrostaticsSim';
import { OpticsQuantumSim } from './OpticsQuantumSim';
import { CurriculumExperimentsModal } from './CurriculumExperimentsModal';
import { playLabSound } from '../../utils/soundEffects';
import { ThreePhysicsStage } from './three/ThreePhysicsStage';
import { InteractiveLawFlipCards } from '../InteractiveLawFlipCards';

interface PhysicsLabProps {
  onOpenGuide?: () => void;
}

export const PhysicsLab: React.FC<PhysicsLabProps> = () => {
  const { lang, theme, t, physicsStation, setPhysicsStation, openCalculator } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d' | 'cards'>('3d');

  const activeStation = physicsStation;
  const setActiveStation = setPhysicsStation;

  const stations = [
    {
      id: 'mechanics' as const,
      num: '01',
      shortAr: 'محاكي الميكانيكا والموائع',
      shortEn: 'Mechanics & Fluids',
      icon: <Wind className="w-4 h-4 text-cyan-500" />
    },
    {
      id: 'thermodynamics' as const,
      num: '02',
      shortAr: 'الديناميكا الحرارية والغازات',
      shortEn: 'Thermodynamics & Gases',
      icon: <Flame className="w-4 h-4 text-amber-500" />
    },
    {
      id: 'electromagnetism' as const,
      num: '03',
      shortAr: 'الكهرومغناطيسية وكولوم',
      shortEn: 'Electromagnetism',
      icon: <Zap className="w-4 h-4 text-indigo-500" />
    },
    {
      id: 'optics_quantum' as const,
      num: '04',
      shortAr: 'البصريات والظاهرة الكهروضوئية',
      shortEn: 'Optics & Quantum',
      icon: <Orbit className="w-4 h-4 text-violet-500" />
    }
  ];

  const activeStationObj =
    stations.find(
      (st) =>
        st.id === activeStation ||
        (st.id === 'mechanics' && activeStation === 'gas_fluid') ||
        (st.id === 'electromagnetism' && activeStation === 'electrostatics')
    ) || stations[0];

  return (
    <div className="w-full min-w-0 flex flex-col gap-5 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Physics Lab Header Card (60-30-10 Dual-Theme Discipline) */}
      <div
        className={`rounded-2xl border p-4 sm:p-6 transition-colors ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`p-3 rounded-xl border shrink-0 ${
                isDark
                  ? 'bg-indigo-950/60 border-indigo-500/30 text-indigo-400'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}
            >
              <Orbit className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-balance">
                  {t('مختبر الفيزياء التفاعلي الشامل', 'Comprehensive Interactive Physics Lab')}
                </h1>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  · {t('مناهج الفيزياء 1، 2، 3-1، 3-2', 'Physics 1, 2, 3-1 & 3-2')}
                </span>
              </div>
              <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t(
                  '4 محاكيات فيزيائية تفاعلية (2D و 3D) مع مطياف الانبعاث والتفريغ وبطاقات القوانين القلابة والتجارب العملية.',
                  '4 interactive physics simulators (2D & 3D) with discharge spectrometer, flipping law flashcards, and worked textbook examples.'
                )}
              </p>
              {/* Clean Quiet Physical Constants Line */}
              <div
                dir="ltr"
                className={`text-[11px] font-mono tabular-nums pt-1 flex flex-wrap items-center gap-2 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <span>g = 9.8 m/s²</span>
                <span aria-hidden="true">·</span>
                <span>k = 8.99×10⁹</span>
                <span aria-hidden="true">·</span>
                <span>R = 0.0821</span>
                <span aria-hidden="true">·</span>
                <span>h = 6.63×10⁻³⁴ J·s</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsCurriculumModalOpen(true);
              playLabSound('click');
            }}
            className="px-4 py-2.5 min-h-[40px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 whitespace-nowrap transition-colors shrink-0 self-start lg:self-auto"
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('دليل التجارب (14)', 'Lab Manual (14)')}</span>
          </button>
        </div>
      </div>

      {/* Sticky 2D / 3D / Law Cards Switcher Bar (Always accessible even when scrolled in 2D) */}
      <div
        style={{ top: 'calc(var(--app-header-height, 138px) + 8px)' }}
        className={`sticky z-30 rounded-2xl border px-3 sm:px-4 py-2.5 backdrop-blur-md transition-colors flex flex-wrap items-center justify-between gap-2.5 tablet-sticky-switcher ${
          isDark
            ? 'bg-slate-900/95 border-slate-800 shadow-lg shadow-slate-950/50'
            : 'bg-white/95 border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0">{activeStationObj.icon}</span>
          <span className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {viewMode === 'cards'
              ? t('بطاقات القوانين الفيزيائية والأمثلة', 'Physics Law Cards & Examples')
              : `${activeStationObj.num}. ${isAr ? activeStationObj.shortAr : activeStationObj.shortEn}`}
          </span>
        </div>

        <div
          className={`p-1 rounded-xl border inline-flex items-center gap-1 flex-wrap ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setViewMode('3d');
              playLabSound('click');
            }}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              viewMode === '3d'
                ? 'bg-indigo-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{t('منصة 3D', '3D Studio')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('2d');
              playLabSound('click');
            }}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              viewMode === '2d'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('محاكي 2D', '2D Sim')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('cards');
              playLabSound('click');
            }}
            className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              viewMode === 'cards'
                ? 'bg-emerald-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{t('بطاقات القوانين', 'Law Cards')}</span>
          </button>
        </div>
      </div>

      {/* Main Active Stage: 3D Studio, 2D Simulators, or Interactive Flipping Law Cards */}
      <div className="w-full min-w-0">
        {viewMode === 'cards' ? (
          <InteractiveLawFlipCards
            domainFilter="physics"
            onLaunchPhysicsStation={(stationTarget) => {
              setActiveStation(stationTarget);
              setViewMode('3d');
            }}
            onOpenCalculatorTab={(calcTab) => openCalculator(calcTab)}
          />
        ) : viewMode === '3d' ? (
          <ThreePhysicsStage
            station={
              activeStation === 'gas_fluid'
                ? 'mechanics'
                : activeStation === 'electrostatics'
                ? 'electromagnetism'
                : activeStation
            }
            onSwitchTo2D={() => setViewMode('2d')}
          />
        ) : (
          <>
            {(activeStation === 'mechanics' || activeStation === 'gas_fluid') && (
              <GasThermodynamicsSim forcedMode="buoyancy" />
            )}
            {activeStation === 'thermodynamics' && (
              <GasThermodynamicsSim forcedMode="gas" />
            )}
            {(activeStation === 'electromagnetism' || activeStation === 'electrostatics') && (
              <ElectrostaticsSim />
            )}
            {activeStation === 'optics_quantum' && <OpticsQuantumSim />}
          </>
        )}
      </div>

      {/* Curriculum Experiments Modal */}
      <CurriculumExperimentsModal
        isOpen={isCurriculumModalOpen}
        onClose={() => setIsCurriculumModalOpen(false)}
        onNavigateToSimulator={(stationTarget) => {
          setActiveStation(stationTarget);
          if (viewMode === 'cards') setViewMode('3d');
        }}
      />
    </div>
  );
};

