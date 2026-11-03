import React from 'react';
import { Wind, Zap, Orbit, Calculator } from 'lucide-react';
import { useApp, PhysicsStationId } from '../../context/AppContext';
import { GasThermodynamicsSim } from './GasThermodynamicsSim';
import { ElectrostaticsSim } from './ElectrostaticsSim';
import { OpticsQuantumSim } from './OpticsQuantumSim';
import { playLabSound } from '../../utils/soundEffects';

interface PhysicsLabProps {
  onOpenGuide?: () => void;
}

export const PhysicsLab: React.FC<PhysicsLabProps> = ({ onOpenGuide }) => {
  const { lang, theme, t, physicsStation, setPhysicsStation, openCalculator } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const activeStation = physicsStation;
  const setActiveStation = setPhysicsStation;

  const stations = [
    {
      id: 'gas_fluid' as const,
      num: '01',
      titleAr: 'قوانين الغازات والموائع والطفو',
      titleEn: 'Gas Laws & Fluid Mechanics',
      shortAr: 'الغازات والموائع والطفو',
      shortEn: 'Gas & Fluids',
      descAr: 'المكبس التفاعلي، التصادمات المرنة، وعلاقات P-V-T وقاعدة أرخميدس',
      descEn: 'Interactive piston, elastic collisions, and Archimedes buoyancy',
      icon: <Wind className="w-4 h-4 text-cyan-400" />
    },
    {
      id: 'electrostatics' as const,
      num: '02',
      titleAr: 'الكهرباء الساكنة وحقول كولوم',
      titleEn: 'Electrostatics & Coulomb Fields',
      shortAr: 'الكهرباء الساكنة وكولوم',
      shortEn: 'Electrostatics',
      descAr: 'خطوط المجال الكهربائي، قوى كولوم، وإطلاق الشحنات الاختبارية',
      descEn: 'Field vectors, Coulomb forces, and test particle dynamics',
      icon: <Zap className="w-4 h-4 text-purple-400" />
    },
    {
      id: 'optics_quantum' as const,
      num: '03',
      titleAr: 'البصريات والظاهرة الكهروضوئية',
      titleEn: 'Optics & Photoelectric Effect',
      shortAr: 'البصريات والكم والكهروضوئية',
      shortEn: 'Optics & Quantum',
      descAr: 'انبعاث الإلكترونات الضوئية، جهد الإيقاف، وأطياف الانبعاث الذري',
      descEn: 'Photoelectron emission, stopping potential, and atomic spectra',
      icon: <Orbit className="w-4 h-4 text-amber-400" />
    }
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn pb-12">
      {/* Physics Lab Hero Header Banner */}
      <div className={`rounded-3xl border p-5 sm:p-7 relative overflow-hidden transition-all shadow-sm ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border-slate-800'
          : 'bg-gradient-to-r from-purple-50/60 via-white to-amber-50/50 border-slate-200'
      }`}>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-amber-500/20 border border-purple-500/30 text-amber-400 shrink-0 shadow-inner">
              <Orbit className="w-7 h-7 sm:w-8 sm:h-8 animate-spin-slow" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100 dark:text-white">
                  {t('مختبر الفيزياء التفاعلي الشامل', 'Comprehensive Interactive Physics Lab')}
                </h1>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  Physics Engine
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                {t('محاكاة حركية دقيقة لقوانين الغازات والديناميكا الحرارية، تصادم الجسيمات وقوى الطفو لأرخميدس، الكهرومغناطيسية وحقول كولوم، والبصريات والظاهرة الكهروضوئية.',
                   'Rigorous simulations of gas kinetics, thermodynamics, Archimedes buoyancy, electrostatics, Coulomb fields, and quantum photoelectric effect.')}
              </p>
            </div>
          </div>

          {/* Quick Action: Open Integrated Physics Calculator & Constants */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => openCalculator('physics')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Calculator className="w-4 h-4" />
              <span>{t('حاسبة القوانين الفيزيائية المدمجة', 'Integrated Physics Calculator')}</span>
            </button>

            <div className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-xs font-mono ${
              isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <span className="text-slate-500">g:</span>
              <span className="text-cyan-400 font-bold">9.8 m/s²</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-500">ke:</span>
              <span className="text-purple-400 font-bold">8.99×10⁹</span>
            </div>
          </div>
        </div>
      </div>

      {/* Physics Stations Compact Pill Switcher */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none py-1">
        {stations.map(st => {
          const isActive = activeStation === st.id;
          return (
            <button
              key={st.id}
              onClick={() => {
                setActiveStation(st.id);
                playLabSound('click');
              }}
              className={`px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-2.5 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 ${
                isActive
                  ? isDark
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-md ring-1 ring-purple-400/50'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 text-white shadow-md'
                  : isDark
                  ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{st.icon}</span>
              <span className="font-mono text-xs opacity-70">{st.num}.</span>
              <span>{isAr ? st.shortAr : st.shortEn}</span>
            </button>
          );
        })}
      </div>

      {/* Main Active Simulation Stage */}
      <div className="w-full">
        {activeStation === 'gas_fluid' && <GasThermodynamicsSim />}
        {activeStation === 'electrostatics' && <ElectrostaticsSim />}
        {activeStation === 'optics_quantum' && <OpticsQuantumSim />}
      </div>
    </div>
  );
};
