import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Zap,
  Droplet,
  FlaskConical,
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Wind,
  Orbit,
  Waves,
  Sun
} from 'lucide-react';
import { useApp, CalculatorTabType, AppDomain } from '../context/AppContext';
import { STANDARD_REDUCTION_POTENTIALS } from '../data/curriculumData';
import { playLabSound } from '../utils/soundEffects';

interface ChemistryCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: CalculatorTabType;
}

export const ChemistryCalculatorModal: React.FC<ChemistryCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'ph'
}) => {
  const { lang, theme, t, currentDomain, calculatorTab: contextTab, calculatorDomain: contextDomain } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [activeDomain, setActiveDomain] = useState<AppDomain>(contextDomain || currentDomain);
  const [activeTab, setActiveTab] = useState<CalculatorTabType>(contextTab || initialTab);

  useEffect(() => {
    if (isOpen) {
      const physicsTabs: CalculatorTabType[] = ['gas', 'coulomb', 'photoelectric', 'buoyancy', 'kinetic', 'snell'];
      if (physicsTabs.includes(contextTab)) {
        setActiveDomain('physics');
      } else {
        setActiveDomain(contextDomain || currentDomain);
      }
      setActiveTab(contextTab);
    }
  }, [isOpen, contextTab, contextDomain, currentDomain]);

  // ==========================================
  // --- CHEMISTRY STATE (1-6) ---
  // ==========================================
  // 1. pH & pOH State
  const [phInput, setPhInput] = useState<string>('7.0');
  const [inputMode, setInputMode] = useState<'ph' | 'poh' | 'h' | 'oh'>('ph');

  // 2. Cell Potential State
  const [cathodeIndex, setCathodeIndex] = useState<number>(16); // Cu2+/Cu (+0.3419)
  const [anodeIndex, setAnodeIndex] = useState<number>(28);     // Zn2+/Zn (-0.7618)

  // 3. Henry's Law State
  const [s1, setS1] = useState<string>('0.85');
  const [p1, setP1] = useState<string>('4.0');
  const [p2, setP2] = useState<string>('1.0');

  // 4. Dilution State (M1*V1 = M2*V2)
  const [m1, setM1] = useState<string>('2.0');
  const [m2, setM2] = useState<string>('0.5');
  const [v2, setV2] = useState<string>('500'); // mL

  // 5. Colligative Properties State
  const [solvent, setSolvent] = useState<'water' | 'benzene' | 'ethanol' | 'chloroform'>('water');
  const [molality, setMolality] = useState<string>('1.0');
  const [vanHoff, setVanHoff] = useState<number>(1);

  // 6. Molarity & Mass % State
  const [molesSolute, setMolesSolute] = useState<string>('0.5');
  const [volumeLiters, setVolumeLiters] = useState<string>('1.0');

  // ==========================================
  // --- PHYSICS STATE (7-12) ---
  // ==========================================
  // 7. Ideal Gas Law: PV = nRT
  const [gasTarget, setGasTarget] = useState<'P' | 'V' | 'n' | 'T'>('P');
  const [gasP, setGasP] = useState<number>(1.0); // atm
  const [gasV, setGasV] = useState<number>(22.4); // L
  const [gasN, setGasN] = useState<number>(1.0); // mol
  const [gasT, setGasT] = useState<number>(273.15); // K
  const R_GAS = 0.08206;

  // 8. Coulomb's Law: F = k*|q1*q2| / r^2
  const [q1Micro, setQ1Micro] = useState<number>(2); // µC
  const [q2Micro, setQ2Micro] = useState<number>(-4); // µC
  const [distanceM, setDistanceM] = useState<number>(0.5); // meters
  const K_E = 8.98755e9;

  // 9. Photoelectric: E = hc/λ, K_max = E - Φ
  const [lambdaNm, setLambdaNm] = useState<number>(350); // nm
  const [workPhiEV, setWorkPhiEV] = useState<number>(2.46); // Sodium (2.46 eV)
  const HC_EV_NM = 1239.84;

  // 10. Buoyancy & Archimedes: Fb = rho * V * g
  const [fluidDensity, setFluidDensity] = useState<number>(1000); // kg/m³
  const [displacedVolumeL, setDisplacedVolumeL] = useState<number>(5); // L
  const [gravityG, setGravityG] = useState<number>(9.8); // m/s²

  // 11. Kinetic Energy & Momentum: Ek = 0.5*m*v^2, p = m*v
  const [massKg, setMassKg] = useState<number>(2.5); // kg
  const [velocityMs, setVelocityMs] = useState<number>(12); // m/s

  // 12. Snell's Law: n1*sin(θ1) = n2*sin(θ2)
  const [n1, setN1] = useState<number>(1.0); // Air
  const [theta1Deg, setTheta1Deg] = useState<number>(30); // degrees
  const [n2, setN2] = useState<number>(1.5); // Glass

  if (!isOpen) return null;

  // --- Chemistry Calculations ---
  const calculatePH = () => {
    let ph = 7;
    const val = parseFloat(phInput) || 0;
    if (inputMode === 'ph') ph = Math.max(0, Math.min(14, val));
    else if (inputMode === 'poh') ph = Math.max(0, Math.min(14, 14 - val));
    else if (inputMode === 'h') ph = val > 0 ? Math.max(0, Math.min(14, -Math.log10(val))) : 7;
    else if (inputMode === 'oh') ph = val > 0 ? Math.max(0, Math.min(14, 14 - (-Math.log10(val)))) : 7;

    const poh = 14 - ph;
    const hConc = Math.pow(10, -ph);
    const ohConc = Math.pow(10, -poh);
    let nature = t('متعادل', 'Neutral');
    let color = 'text-emerald-400';
    if (ph < 6.9) {
      nature = t('حمضي', 'Acidic');
      color = 'text-rose-400';
    } else if (ph > 7.1) {
      nature = t('قاعدي', 'Basic');
      color = 'text-blue-400';
    }
    return { ph, poh, hConc, ohConc, nature, color };
  };

  const calculateCell = () => {
    const cathode = STANDARD_REDUCTION_POTENTIALS[cathodeIndex] || STANDARD_REDUCTION_POTENTIALS[0];
    const anode = STANDARD_REDUCTION_POTENTIALS[anodeIndex] || STANDARD_REDUCTION_POTENTIALS[1];
    const eCell = cathode.e0 - anode.e0;
    const isSpontaneous = eCell > 0;
    return { cathode, anode, eCell, isSpontaneous };
  };

  const calculateHenry = () => {
    const s1Num = parseFloat(s1) || 0;
    const p1Num = parseFloat(p1) || 1;
    const p2Num = parseFloat(p2) || 0;
    const s2Num = p1Num > 0 ? (s1Num * p2Num) / p1Num : 0;
    return { s2Num };
  };

  const calculateDilution = () => {
    const m1Num = parseFloat(m1) || 1;
    const m2Num = parseFloat(m2) || 0.1;
    const v2Num = parseFloat(v2) || 100;
    const v1Num = m1Num > 0 ? (m2Num * v2Num) / m1Num : 0;
    const waterToAdd = Math.max(0, v2Num - v1Num);
    return { v1Num, waterToAdd };
  };

  const calculateColligative = () => {
    const m = parseFloat(molality) || 0;
    const constants = {
      water: { kb: 0.512, kf: 1.86, tb: 100.0, tf: 0.0 },
      benzene: { kb: 2.53, kf: 5.12, tb: 80.1, tf: 5.5 },
      ethanol: { kb: 1.22, kf: 1.99, tb: 78.4, tf: -114.1 },
      chloroform: { kb: 3.63, kf: 4.68, tb: 61.2, tf: -63.5 }
    };
    const c = constants[solvent];
    const deltaTb = c.kb * m * vanHoff;
    const deltaTf = c.kf * m * vanHoff;
    return {
      newTb: c.tb + deltaTb,
      newTf: c.tf - deltaTf,
      deltaTb,
      deltaTf,
      constants: c
    };
  };

  const calculateMolarity = () => {
    const n = parseFloat(molesSolute) || 0;
    const v = parseFloat(volumeLiters) || 1;
    const molarity = v > 0 ? n / v : 0;
    return { molarity };
  };

  // --- Physics Calculations ---
  const calculateGasResult = () => {
    if (gasTarget === 'P') return { val: (gasN * R_GAS * gasT) / (gasV || 1), unit: 'atm' };
    if (gasTarget === 'V') return { val: (gasN * R_GAS * gasT) / (gasP || 1), unit: 'L' };
    if (gasTarget === 'n') return { val: (gasP * gasV) / (R_GAS * (gasT || 1)), unit: 'mol' };
    return { val: (gasP * gasV) / (R_GAS * (gasN || 1)), unit: 'K' };
  };

  const calculateCoulombResult = () => {
    const q1C = q1Micro * 1e-6;
    const q2C = q2Micro * 1e-6;
    const f = (K_E * Math.abs(q1C * q2C)) / ((distanceM * distanceM) || 0.0001);
    const isAttract = (q1Micro * q2Micro) < 0;
    return { fN: f, isAttract };
  };

  const calculatePhotoelectricResult = () => {
    const energyEV = HC_EV_NM / (lambdaNm || 1);
    const kMaxEV = Math.max(0, energyEV - workPhiEV);
    const thresholdNm = HC_EV_NM / (workPhiEV || 1);
    const isEmitted = energyEV >= workPhiEV;
    return { energyEV, kMaxEV, thresholdNm, isEmitted };
  };

  const calculateBuoyancyResult = () => {
    const volM3 = displacedVolumeL * 0.001;
    const forceN = fluidDensity * volM3 * gravityG;
    const massDisplacedKg = fluidDensity * volM3;
    return { forceN, massDisplacedKg };
  };

  const calculateKineticResult = () => {
    const ek = 0.5 * massKg * (velocityMs * velocityMs);
    const p = massKg * velocityMs;
    return { ek, p };
  };

  const calculateSnellResult = () => {
    const theta1Rad = (theta1Deg * Math.PI) / 180;
    const sinTheta2 = (n1 * Math.sin(theta1Rad)) / (n2 || 1);
    if (sinTheta2 > 1.0) {
      return { tir: true, theta2Deg: 0, criticalAngleDeg: (Math.asin(n2 / n1) * 180) / Math.PI };
    }
    const theta2Deg = (Math.asin(sinTheta2) * 180) / Math.PI;
    const criticalAngleDeg = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;
    return { tir: false, theta2Deg, criticalAngleDeg };
  };

  const phRes = calculatePH();
  const cellRes = calculateCell();
  const henryRes = calculateHenry();
  const dilRes = calculateDilution();
  const collRes = calculateColligative();
  const molRes = calculateMolarity();

  const gasRes = calculateGasResult();
  const coulombRes = calculateCoulombResult();
  const photoRes = calculatePhotoelectricResult();
  const buoyRes = calculateBuoyancyResult();
  const kinRes = calculateKineticResult();
  const snellRes = calculateSnellResult();

  // Tab Item Lists
  const chemTabs: { id: CalculatorTabType; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
    { id: 'ph', labelAr: 'الرقم الهيدروجيني pH', labelEn: 'pH & pOH', icon: <Droplet className="w-4 h-4 text-cyan-400" /> },
    { id: 'cell_potential', labelAr: 'جهد الخلية الجلفانية', labelEn: 'Cell Potential E°', icon: <Zap className="w-4 h-4 text-amber-400" /> },
    { id: 'henry', labelAr: 'قانون هنري للغازات', labelEn: "Henry's Law", icon: <Wind className="w-4 h-4 text-purple-400" /> },
    { id: 'dilution', labelAr: 'معادلة التخفيف', labelEn: 'Dilution (M1V1=M2V2)', icon: <FlaskConical className="w-4 h-4 text-rose-400" /> },
    { id: 'colligative', labelAr: 'الخواص الجامعة للمحاليل', labelEn: 'Colligative Properties', icon: <Scale className="w-4 h-4 text-emerald-400" /> },
    { id: 'molarity', labelAr: 'المولارية والتركيز', labelEn: 'Molarity (M)', icon: <Sparkles className="w-4 h-4 text-blue-400" /> }
  ];

  const physTabs: { id: CalculatorTabType; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
    { id: 'gas', labelAr: 'الغاز المثالي (PV=nRT)', labelEn: 'Ideal Gas Law', icon: <Wind className="w-4 h-4 text-cyan-400" /> },
    { id: 'coulomb', labelAr: 'قانون كولوم الكهروستاتيكي', labelEn: "Coulomb's Law", icon: <Zap className="w-4 h-4 text-purple-400" /> },
    { id: 'photoelectric', labelAr: 'الظاهرة الكهروضوئية (E=hf)', labelEn: 'Photoelectric Effect', icon: <Orbit className="w-4 h-4 text-amber-400" /> },
    { id: 'buoyancy', labelAr: 'قاعدة أرخميدس والطفو', labelEn: 'Archimedes Buoyancy', icon: <Waves className="w-4 h-4 text-teal-400" /> },
    { id: 'kinetic', labelAr: 'الطاقة الحركية والزخم', labelEn: 'Kinetic & Momentum', icon: <Sparkles className="w-4 h-4 text-rose-400" /> },
    { id: 'snell', labelAr: 'قانون سنيل والانكسار', labelEn: "Snell's Law", icon: <Sun className="w-4 h-4 text-indigo-400" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 backdrop-blur-md bg-slate-950/80 animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-[0_25px_60px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-6 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${
              activeDomain === 'chemistry' ? 'bg-cyan-600' : 'bg-gradient-to-tr from-purple-600 to-amber-600'
            }`}>
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{t('حاسبة القوانين والمسائل العلمية الشاملة', 'Comprehensive Scientific Laws Calculator')}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {t('حل المسائل المنهجية بدقة مع إيضاح الوحدات وخطوات التعويض الرياضي', 'Exact curriculum formula solver with step-by-step substitution and units')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Domain Switcher Pill: Chemistry vs Physics */}
        <div className={`px-4 sm:px-6 py-2.5 border-b flex items-center justify-center gap-3 ${
          isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/60 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => {
              setActiveDomain('chemistry');
              setActiveTab('ph');
              playLabSound('click');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
              activeDomain === 'chemistry'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-md'
                : isDark
                ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-cyan-300" />
            <span>{t('🧪 قوانين الكيمياء (6 قوانين)', '🧪 Chemistry Laws (6 Formulas)')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveDomain('physics');
              setActiveTab('gas');
              playLabSound('click');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all border ${
              activeDomain === 'physics'
                ? 'bg-gradient-to-r from-purple-600 to-amber-600 border-purple-400 text-white shadow-md'
                : isDark
                ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Orbit className="w-4 h-4 text-amber-300" />
            <span>{t('⚡ قوانين الفيزياء (6 قوانين)', '⚡ Physics Laws (6 Formulas)')}</span>
          </button>
        </div>

        {/* Horizontal Formula Ribbon */}
        <div className={`p-2.5 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none ${
          isDark ? 'bg-slate-950/20 border-slate-800/80' : 'bg-slate-50 border-slate-200/80'
        }`}>
          {(activeDomain === 'chemistry' ? chemTabs : physTabs).map(tabItem => {
            const isSelected = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => {
                  setActiveTab(tabItem.id);
                  playLabSound('click');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 transition-all border ${
                  isSelected
                    ? activeDomain === 'chemistry'
                      ? 'bg-cyan-600 border-cyan-400 text-white shadow-sm'
                      : 'bg-purple-600 border-purple-400 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tabItem.icon}</span>
                <span>{isAr ? tabItem.labelAr : tabItem.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Active Law Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* ============================================================== */}
          {/* CHEMISTRY 1: pH & pOH */}
          {/* ============================================================== */}
          {activeDomain === 'chemistry' && activeTab === 'ph' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <label className="text-xs font-bold block mb-2 text-slate-300">
                    {t('المتغير المعطى ونمط الإدخال:', 'Given Input Variable:')}
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { id: 'ph', label: 'الرقم الهيدروجيني (pH)' },
                      { id: 'poh', label: 'الرقم الهيدروكسيدي (pOH)' },
                      { id: 'h', label: '[H⁺] mol/L' },
                      { id: 'oh', label: '[OH⁻] mol/L' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setInputMode(mode.id as any)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                          inputMode === mode.id
                            ? 'bg-cyan-600 border-cyan-400 text-white'
                            : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={phInput}
                    onChange={e => setPhInput(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-sm font-mono font-bold ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Result Card */}
                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-slate-950/80 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-2">{t('النتائج المحسوبة:', 'Calculated Output:')}</span>
                    <div className="grid grid-cols-2 gap-3 font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">pH:</span>
                        <span className="text-xl font-black text-cyan-400">{phRes.ph.toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">pOH:</span>
                        <span className="text-xl font-black text-purple-400">{phRes.poh.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{t('طبيعة المحلول:', 'Solution Nature:')}</span>
                    <span className={`font-bold ${phRes.color}`}>{phRes.nature}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CHEMISTRY 2: Cell Potential */}
          {/* ============================================================== */}
          {activeDomain === 'chemistry' && activeTab === 'cell_potential' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <label className="text-xs font-bold block mb-2 text-emerald-400">
                    {t('قطب المهبط (الكاثود - يحدث عنده اختزال):', 'Cathode (Reduction):')}
                  </label>
                  <select
                    value={cathodeIndex}
                    onChange={e => setCathodeIndex(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono mb-4 ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {STANDARD_REDUCTION_POTENTIALS.map((p, idx) => (
                      <option key={idx} value={idx}>{p.halfReaction} ({p.e0 > 0 ? `+${p.e0}` : p.e0} V)</option>
                    ))}
                  </select>

                  <label className="text-xs font-bold block mb-2 text-rose-400">
                    {t('قطب المصعد (الأنود - يحدث عنده أكسدة):', 'Anode (Oxidation):')}
                  </label>
                  <select
                    value={anodeIndex}
                    onChange={e => setAnodeIndex(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {STANDARD_REDUCTION_POTENTIALS.map((p, idx) => (
                      <option key={idx} value={idx}>{p.halfReaction} ({p.e0 > 0 ? `+${p.e0}` : p.e0} V)</option>
                    ))}
                  </select>
                </div>

                <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  isDark ? 'bg-slate-950/80 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-2">{t('معادلة جهد الخلية القياسي:', 'Standard Cell EMF Formula:')}</span>
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono text-xs text-amber-300 mb-3">
                      E°cell = E°cathode - E°anode
                    </div>
                    <div className="text-center font-mono py-2">
                      <span className="text-xs text-slate-500 block mb-1">E°cell:</span>
                      <span className={`text-3xl font-black ${cellRes.isSpontaneous ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {cellRes.eCell > 0 ? `+${cellRes.eCell.toFixed(4)}` : cellRes.eCell.toFixed(4)} V
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{t('التلقائية (Spontaneity):', 'Reaction Spontaneity:')}</span>
                    <span className={`font-bold ${cellRes.isSpontaneous ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {cellRes.isSpontaneous ? t('تلقائي (خلية جلفانية)', 'Spontaneous (Galvanic)') : t('غير تلقائي (خلية تحليل كهربائي)', 'Non-spontaneous (Electrolytic)')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CHEMISTRY 3: Henry's Law */}
          {/* ============================================================== */}
          {activeDomain === 'chemistry' && activeTab === 'henry' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">الذائبية الابتدائية S1 (g/L):</label>
                  <input type="number" step="any" value={s1} onChange={e => setS1(e.target.value)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">الضغط الابتدائي P1 (atm):</label>
                  <input type="number" step="any" value={p1} onChange={e => setP1(e.target.value)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">الضغط الجديد P2 (atm):</label>
                  <input type="number" step="any" value={p2} onChange={e => setP2(e.target.value)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
              </div>
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-purple-500/30' : 'bg-purple-50/50 border-purple-200'}`}>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">قانون هنري: S1 / P1 = S2 / P2</span>
                  <div className="text-center font-mono py-4">
                    <span className="text-xs text-slate-500 block mb-1">الذائبية الجديدة S2:</span>
                    <span className="text-3xl font-black text-purple-400">{henryRes.s2Num.toFixed(4)} g/L</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تتناسب ذائبية الغاز في سائل طردياً مع الضغط الواقع على سطحه عند ثبوت درجة الحرارة (مثل غاز المشروبات الغازية).
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CHEMISTRY 4: Dilution */}
          {/* ============================================================== */}
          {activeDomain === 'chemistry' && activeTab === 'dilution' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">تركيز المحلول القياسي المركز M1 (mol/L):</label>
                  <input type="number" step="any" value={m1} onChange={e => setM1(e.target.value)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">التركيز المخفف المطلوب M2 (mol/L):</label>
                  <input type="number" step="any" value={m2} onChange={e => setM2(e.target.value)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">الحجم النهائي المطلوب V2 (mL):</label>
                  <input type="number" step="any" value={v2} onChange={e => setV2(e.target.value)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
              </div>
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-rose-500/30' : 'bg-rose-50/50 border-rose-200'}`}>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">معادلة التخفيف: M1 · V1 = M2 · V2</span>
                  <div className="text-center font-mono py-3">
                    <span className="text-xs text-slate-500 block mb-1">الحجم المطلوب سحبه V1:</span>
                    <span className="text-3xl font-black text-rose-400">{dilRes.v1Num.toFixed(2)} mL</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <span className="text-slate-400 block mb-1">خطوات التحضير:</span>
                  <span className="text-slate-200">اسحب {dilRes.v1Num.toFixed(2)} mL من المحلول المركز وأضف إليها {dilRes.waterToAdd.toFixed(2)} mL ماء مقطر.</span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CHEMISTRY 5: Colligative */}
          {/* ============================================================== */}
          {activeDomain === 'chemistry' && activeTab === 'colligative' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">نوع المذيب:</label>
                  <select value={solvent} onChange={e => setSolvent(e.target.value as any)} className={`w-full p-2.5 rounded-xl border text-xs font-mono ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}>
                    <option value="water">ماء (Water - Kb=0.512, Kf=1.86)</option>
                    <option value="benzene">بنزين (Benzene - Kb=2.53, Kf=5.12)</option>
                    <option value="ethanol">إيثانول (Ethanol - Kb=1.22, Kf=1.99)</option>
                    <option value="chloroform">كلوروفورم (Chloroform - Kb=3.63, Kf=4.68)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">التركيز المولالي m (mol/kg):</label>
                  <input type="number" step="any" value={molality} onChange={e => setMolality(e.target.value)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">معامل فانت هوف i (الأيونات الناتجة):</label>
                  <input type="number" step="1" min="1" value={vanHoff} onChange={e => setVanHoff(Math.max(1, parseInt(e.target.value) || 1))} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
              </div>
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-emerald-500/30' : 'bg-emerald-50/50 border-emerald-200'}`}>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">درجة الغليان الجديدة:</span>
                    <span className="text-xl font-black text-rose-400">{collRes.newTb.toFixed(3)} °C</span>
                    <span className="text-[10px] text-slate-400 block mt-1">+ΔTb = {collRes.deltaTb.toFixed(3)}°C</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">درجة التجمد الجديدة:</span>
                    <span className="text-xl font-black text-cyan-400">{collRes.newTf.toFixed(3)} °C</span>
                    <span className="text-[10px] text-slate-400 block mt-1">-ΔTf = {collRes.deltaTf.toFixed(3)}°C</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-3">
                  تعتمد الخواص الجامعة على عدد جسيمات المذاب في كمية محددة من المذيب وليس على طبيعة تلك الجسيمات.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CHEMISTRY 6: Molarity */}
          {/* ============================================================== */}
          {activeDomain === 'chemistry' && activeTab === 'molarity' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">عدد موالات المذاب n (mol):</label>
                  <input type="number" step="any" value={molesSolute} onChange={e => setMolesSolute(e.target.value)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">حجم المحلول الكلي V (L):</label>
                  <input type="number" step="any" value={volumeLiters} onChange={e => setVolumeLiters(e.target.value)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
              </div>
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-blue-500/30' : 'bg-blue-50/50 border-blue-200'}`}>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">المولارية M = n / V</span>
                  <div className="text-center font-mono py-4">
                    <span className="text-xs text-slate-500 block mb-1">التركيز المولاري:</span>
                    <span className="text-3xl font-black text-blue-400">{molRes.molarity.toFixed(4)} M</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  عدد مولات المذاب الذائبة في لتر واحد من المحلول (mol/L).
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PHYSICS 7: Ideal Gas Law (PV=nRT) */}
          {/* ============================================================== */}
          {activeDomain === 'physics' && activeTab === 'gas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <label className="text-xs font-bold block mb-2 text-slate-300">المتغير المراد حسابه (المجهول):</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { id: 'P', label: 'الضغط P' },
                    { id: 'V', label: 'الحجم V' },
                    { id: 'n', label: 'المولات n' },
                    { id: 'T', label: 'الحرارة T' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGasTarget(item.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        gasTarget === item.id ? 'bg-cyan-600 border-cyan-400 text-white' : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {gasTarget !== 'P' && (
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-300">الضغط P (atm):</label>
                    <input type="number" step="any" value={gasP} onChange={e => setGasP(parseFloat(e.target.value) || 0)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                  </div>
                )}
                {gasTarget !== 'V' && (
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-300">الحجم V (Liters):</label>
                    <input type="number" step="any" value={gasV} onChange={e => setGasV(parseFloat(e.target.value) || 0)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                  </div>
                )}
                {gasTarget !== 'n' && (
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-300">كمية المادة n (mol):</label>
                    <input type="number" step="any" value={gasN} onChange={e => setGasN(parseFloat(e.target.value) || 0)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                  </div>
                )}
                {gasTarget !== 'T' && (
                  <div>
                    <label className="text-xs font-bold block mb-1 text-slate-300">درجة الحرارة T (Kelvin):</label>
                    <input type="number" step="any" value={gasT} onChange={e => setGasT(parseFloat(e.target.value) || 0)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                  </div>
                )}
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200'}`}>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">معادلة الغاز المثالي: PV = nRT</span>
                  <div className="text-center font-mono py-4">
                    <span className="text-xs text-slate-500 block mb-1">الناتج المحسوب ({gasTarget}):</span>
                    <span className="text-3xl font-black text-cyan-400">{gasRes.val.toFixed(3)} {gasRes.unit}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  الثابت العام للغازات: R = 0.08206 L·atm/(mol·K) = 8.314 J/(mol·K).
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PHYSICS 8: Coulomb's Law */}
          {/* ============================================================== */}
          {activeDomain === 'physics' && activeTab === 'coulomb' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">الشحنة الأولى q1 (µC):</label>
                  <input type="number" step="any" value={q1Micro} onChange={e => setQ1Micro(parseFloat(e.target.value) || 0)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">الشحنة الثانية q2 (µC):</label>
                  <input type="number" step="any" value={q2Micro} onChange={e => setQ2Micro(parseFloat(e.target.value) || 0)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">المسافة الفاصلة r (meters):</label>
                  <input type="number" step="any" value={distanceM} onChange={e => setDistanceM(parseFloat(e.target.value) || 0.1)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-purple-500/30' : 'bg-purple-50/50 border-purple-200'}`}>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">قانون كولوم: F = k · |q1 · q2| / r²</span>
                  <div className="text-center font-mono py-4">
                    <span className="text-xs text-slate-500 block mb-1">القوة المتبادلة F:</span>
                    <span className="text-3xl font-black text-purple-400">{coulombRes.fN.toFixed(4)} N</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">نوع القوة:</span>
                  <span className={`font-bold ${coulombRes.isAttract ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {coulombRes.isAttract ? 'تجاذب (شحنات مختلفة)' : 'تنافر (شحنات متشابهة)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PHYSICS 9: Photoelectric Effect */}
          {/* ============================================================== */}
          {activeDomain === 'physics' && activeTab === 'photoelectric' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">طول موجة الضوء الساقط λ (nm):</label>
                  <input type="number" step="any" value={lambdaNm} onChange={e => setLambdaNm(parseFloat(e.target.value) || 100)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">دالة الشغل للفلز Φ (eV):</label>
                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    {[
                      { name: 'سيزيوم', phi: 2.14 },
                      { name: 'صوديوم', phi: 2.46 },
                      { name: 'بلاتين', phi: 6.35 }
                    ].map(m => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => setWorkPhiEV(m.phi)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold border ${
                          workPhiEV === m.phi ? 'bg-amber-600 text-white border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {m.name} ({m.phi}eV)
                      </button>
                    ))}
                  </div>
                  <input type="number" step="any" value={workPhiEV} onChange={e => setWorkPhiEV(parseFloat(e.target.value) || 1)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'}`}>
                <div className="space-y-3 font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">طاقة الفوتون الساقط E:</span>
                    <span className="text-xl font-black text-amber-400">{photoRes.energyEV.toFixed(3)} eV</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">أقصى طاقة حركية K_max:</span>
                    <span className="text-xl font-black text-emerald-400">{photoRes.kMaxEV.toFixed(3)} eV</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">انبعاث الإلكترونات:</span>
                  <span className={`font-bold ${photoRes.isEmitted ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {photoRes.isEmitted ? 'يحدث انبعاث كهروضوئي (E ≥ Φ)' : 'لا يحدث انبعاث (E < Φ)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PHYSICS 10: Buoyancy & Archimedes */}
          {/* ============================================================== */}
          {activeDomain === 'physics' && activeTab === 'buoyancy' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">كثافة السائل ρ (kg/m³):</label>
                  <input type="number" step="any" value={fluidDensity} onChange={e => setFluidDensity(parseFloat(e.target.value) || 1000)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">حجم السائل المزاح V (Liters):</label>
                  <input type="number" step="any" value={displacedVolumeL} onChange={e => setDisplacedVolumeL(parseFloat(e.target.value) || 1)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">تسارع الجاذبية g (m/s²):</label>
                  <input type="number" step="any" value={gravityG} onChange={e => setGravityG(parseFloat(e.target.value) || 9.8)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-teal-500/30' : 'bg-teal-50/50 border-teal-200'}`}>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">قاعدة أرخميدس: Fb = ρ · V · g</span>
                  <div className="text-center font-mono py-4">
                    <span className="text-xs text-slate-500 block mb-1">قوة الطفو الصاعدة Fb:</span>
                    <span className="text-3xl font-black text-teal-400">{buoyRes.forceN.toFixed(2)} N</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-400">كتلة السائل المزاح:</span>
                  <span className="text-slate-100 font-bold">{buoyRes.massDisplacedKg.toFixed(2)} kg</span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PHYSICS 11: Kinetic Energy & Momentum */}
          {/* ============================================================== */}
          {activeDomain === 'physics' && activeTab === 'kinetic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">الكتلة m (kg):</label>
                  <input type="number" step="any" value={massKg} onChange={e => setMassKg(parseFloat(e.target.value) || 1)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">السرعة v (m/s):</label>
                  <input type="number" step="any" value={velocityMs} onChange={e => setVelocityMs(parseFloat(e.target.value) || 0)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-rose-500/30' : 'bg-rose-50/50 border-rose-200'}`}>
                <div className="space-y-3 font-mono">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الطاقة الحركية Ek = ½ m v²:</span>
                    <span className="text-2xl font-black text-rose-400">{kinRes.ek.toFixed(2)} Joules (J)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">الزخم الخطي p = m v:</span>
                    <span className="text-xl font-black text-amber-400">{kinRes.p.toFixed(2)} kg·m/s</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  تتناسب الطاقة الحركية طردياً مع مربع السرعة ومع الكتلة.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PHYSICS 12: Snell's Law */}
          {/* ============================================================== */}
          {activeDomain === 'physics' && activeTab === 'snell' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">معامل انكسار الوسط الأول n1:</label>
                  <input type="number" step="any" value={n1} onChange={e => setN1(parseFloat(e.target.value) || 1)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">زاوية السقوط θ1 (درجة):</label>
                  <input type="number" step="any" value={theta1Deg} onChange={e => setTheta1Deg(parseFloat(e.target.value) || 0)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1 text-slate-300">معامل انكسار الوسط الثاني n2:</label>
                  <input type="number" step="any" value={n2} onChange={e => setN2(parseFloat(e.target.value) || 1)} className={`w-full p-2.5 rounded-xl border text-xs font-mono font-bold ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-950/80 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-200'}`}>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">قانون سنيل: n1 · sin(θ1) = n2 · sin(θ2)</span>
                  <div className="text-center font-mono py-4">
                    <span className="text-xs text-slate-500 block mb-1">زاوية الانكسار θ2:</span>
                    <span className="text-3xl font-black text-indigo-400">
                      {snellRes.tir ? t('انعكاس كلي داخلي', 'Total Internal Refl.') : `${snellRes.theta2Deg.toFixed(2)}°`}
                    </span>
                  </div>
                </div>
                {snellRes.criticalAngleDeg !== null && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono flex items-center justify-between">
                    <span className="text-slate-400">الزاوية الحرجة θc:</span>
                    <span className="text-amber-400 font-bold">{snellRes.criticalAngleDeg.toFixed(2)}°</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-3.5 sm:p-4 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <span>
            {activeDomain === 'chemistry'
              ? t('مرجع القوانين: كتاب كيمياء 3 مسارات - الفصول 1 إلى 5', 'Chemistry 3 Curriculum Reference')
              : t('مرجع القوانين: فيزياء 3 والميكانيكا والكهرومغناطيسية والكم', 'Physics 3 Mechanics, Coulomb & Quantum')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md"
          >
            {t('تم', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
};
