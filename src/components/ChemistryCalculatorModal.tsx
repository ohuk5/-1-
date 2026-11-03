import React, { useState } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STANDARD_REDUCTION_POTENTIALS } from '../data/curriculumData';

interface ChemistryCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'ph' | 'cell_potential' | 'henry' | 'dilution' | 'colligative' | 'molarity';
}

export const ChemistryCalculatorModal: React.FC<ChemistryCalculatorModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'ph'
}) => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [activeTab, setActiveTab] = useState<'ph' | 'cell_potential' | 'henry' | 'dilution' | 'colligative' | 'molarity'>(initialTab);

  // 1. pH & pOH State
  const [phInput, setPhInput] = useState<string>('7.0');
  const [inputMode, setInputMode] = useState<'ph' | 'poh' | 'h' | 'oh'>('ph');

  // 2. Cell Potential State
  const [cathodeIndex, setCathodeIndex] = useState<number>(16); // Cu2+/Cu (+0.3419)
  const [anodeIndex, setAnodeIndex] = useState<number>(28);   // Zn2+/Zn (-0.7618)

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
  const [vanHoff, setVanHoff] = useState<number>(1); // i

  // 6. Molarity & Mass % State
  const [soluteGrams, setSoluteGrams] = useState<string>('58.44'); // 1 mol NaCl
  const [molarMass, setMolarMass] = useState<string>('58.44');
  const [solnVolumeL, setSolnVolumeL] = useState<string>('1.0');
  const [solnTotalGrams, setSolnTotalGrams] = useState<string>('1000');

  if (!isOpen) return null;

  // pH Calculations
  let derivedPH = 7.0;
  let derivedPOH = 7.0;
  let derivedH = 1e-7;
  let derivedOH = 1e-7;

  try {
    const val = parseFloat(phInput);
    if (!isNaN(val) && val >= 0) {
      if (inputMode === 'ph') {
        derivedPH = Math.max(0, Math.min(14, val));
        derivedPOH = 14 - derivedPH;
        derivedH = Math.pow(10, -derivedPH);
        derivedOH = Math.pow(10, -derivedPOH);
      } else if (inputMode === 'poh') {
        derivedPOH = Math.max(0, Math.min(14, val));
        derivedPH = 14 - derivedPOH;
        derivedH = Math.pow(10, -derivedPH);
        derivedOH = Math.pow(10, -derivedPOH);
      } else if (inputMode === 'h') {
        derivedH = Math.max(1e-15, Math.min(1, val));
        derivedPH = -Math.log10(derivedH);
        derivedPOH = 14 - derivedPH;
        derivedOH = Math.pow(10, -derivedPOH);
      } else if (inputMode === 'oh') {
        derivedOH = Math.max(1e-15, Math.min(1, val));
        derivedPOH = -Math.log10(derivedOH);
        derivedPH = 14 - derivedPOH;
        derivedH = Math.pow(10, -derivedPH);
      }
    }
  } catch {
    // fallback
  }

  const isAcidic = derivedPH < 6.95;
  const isBasic = derivedPH > 7.05;
  const isNeutral = !isAcidic && !isBasic;

  // Cell Potential Calculation
  const cathode = STANDARD_REDUCTION_POTENTIALS[cathodeIndex] || STANDARD_REDUCTION_POTENTIALS[16];
  const anode = STANDARD_REDUCTION_POTENTIALS[anodeIndex] || STANDARD_REDUCTION_POTENTIALS[28];
  const eCell = cathode.e0 - anode.e0;
  const isSpontaneous = eCell > 0;

  // Henry's Law Calculation (S2 = S1 * P2 / P1)
  const numS1 = parseFloat(s1) || 0;
  const numP1 = parseFloat(p1) || 1;
  const numP2 = parseFloat(p2) || 0;
  const s2 = numP1 > 0 ? (numS1 * numP2) / numP1 : 0;

  // Dilution Calculation (V1 = M2 * V2 / M1)
  const numM1 = parseFloat(m1) || 1;
  const numM2 = parseFloat(m2) || 0;
  const numV2 = parseFloat(v2) || 0;
  const v1 = numM1 > 0 ? (numM2 * numV2) / numM1 : 0;
  const waterToAdd = Math.max(0, numV2 - v1);

  // Colligative Calculation
  const solventConstants: Record<string, { kb: number; kf: number; tb0: number; tf0: number; nameAr: string; nameEn: string }> = {
    water: { kb: 0.512, kf: 1.86, tb0: 100.0, tf0: 0.0, nameAr: 'الماء (H₂O)', nameEn: 'Water' },
    benzene: { kb: 2.53, kf: 5.12, tb0: 80.1, tf0: 5.5, nameAr: 'البنزين (C₆H₆)', nameEn: 'Benzene' },
    ethanol: { kb: 1.22, kf: 1.99, tb0: 78.5, tf0: -114.1, nameAr: 'الإيثانول (C₂H₅OH)', nameEn: 'Ethanol' },
    chloroform: { kb: 3.63, kf: 4.68, tb0: 61.7, tf0: -63.5, nameAr: 'الكلوروفورم (CHCl₃)', nameEn: 'Chloroform' }
  };
  const activeSolv = solventConstants[solvent] || solventConstants.water;
  const mVal = parseFloat(molality) || 0;
  const deltaTb = activeSolv.kb * mVal * vanHoff;
  const deltaTf = activeSolv.kf * mVal * vanHoff;
  const finalTb = activeSolv.tb0 + deltaTb;
  const finalTf = activeSolv.tf0 - deltaTf;

  // Molarity & Mass % Calculation
  const gSolute = parseFloat(soluteGrams) || 0;
  const mw = parseFloat(molarMass) || 1;
  const vL = parseFloat(solnVolumeL) || 1;
  const gTotal = parseFloat(solnTotalGrams) || 1;
  const calcMoles = mw > 0 ? gSolute / mw : 0;
  const calcMolarity = vL > 0 ? calcMoles / vL : 0;
  const calcMassPercent = gTotal > 0 ? (gSolute / gTotal) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className={`border rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] ${
          isAr ? 'text-right' : 'text-left'
        } ${isDark ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
      >
        {/* Top Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm shadow-cyan-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>{t('حاسبة القوانين والمعادلات الكيميائية', 'Chemical Laws & Formulas Calculator')}</span>
                <span className="text-[11px] font-bold bg-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  {t('منهج كيمياء 3 المعتمد', 'Chemistry 3 Standards')}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t(
                  'حساب فوري مباشر لقوانين pH، جهود الخلايا الجلفانية، التخفيف، قانون هنري، والخواص الجامعة',
                  'Instant computation of pH, cell potentials, dilution, Henry’s law, and colligative properties'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900'
            }`}
            title={t('إغلاق الحاسبة', 'Close Calculator')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`px-4 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('ph')}
            className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ph'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Droplet className="w-4 h-4" />
            <span>{t('الأس الهيدروجيني (pH / pOH)', 'pH & pOH Calculator')}</span>
          </button>

          <button
            onClick={() => setActiveTab('cell_potential')}
            className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'cell_potential'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{t('جهد الخلية الجلفانية (E°cell)', 'Galvanic E°cell')}</span>
          </button>

          <button
            onClick={() => setActiveTab('dilution')}
            className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'dilution'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>{t('التخفيف (M₁V₁ = M₂V₂)', 'Dilution Law')}</span>
          </button>

          <button
            onClick={() => setActiveTab('henry')}
            className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'henry'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t('قانون هنري (S₁/P₁ = S₂/P₂)', 'Henry’s Law')}</span>
          </button>

          <button
            onClick={() => setActiveTab('colligative')}
            className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'colligative'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{t('الخواص الجامعة (الغليان والتجمد)', 'Colligative ΔTb & ΔTf')}</span>
          </button>

          <button
            onClick={() => setActiveTab('molarity')}
            className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'molarity'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                : isDark
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{t('المولارية والنسبة المئوية', 'Molarity & Mass %')}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: pH / pOH */}
          {activeTab === 'ph' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="font-black text-sm sm:text-base text-cyan-400 flex items-center gap-2">
                    <Droplet className="w-4 h-4" />
                    <span>{t('القانون الرياضي: حسابات الأحماض والقواعد', 'Mathematical Law: Acid-Base Calculations')}</span>
                  </h3>
                  <div className="flex items-center gap-1 p-1 bg-slate-800/80 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setInputMode('ph')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${inputMode === 'ph' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
                    >
                      pH
                    </button>
                    <button
                      onClick={() => setInputMode('poh')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${inputMode === 'poh' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
                    >
                      pOH
                    </button>
                    <button
                      onClick={() => { setInputMode('h'); setPhInput('1e-7'); }}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${inputMode === 'h' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
                    >
                      [H⁺]
                    </button>
                    <button
                      onClick={() => { setInputMode('oh'); setPhInput('1e-7'); }}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${inputMode === 'oh' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'}`}
                    >
                      [OH⁻]
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">
                      {inputMode === 'ph' && t('أدخل قيمة الرقم الهيدروجيني (0 - 14):', 'Enter pH value (0 - 14):')}
                      {inputMode === 'poh' && t('أدخل قيمة الرقم الهيدروكسيدي (0 - 14):', 'Enter pOH value (0 - 14):')}
                      {inputMode === 'h' && t('أدخل تركيز أيون الهيدروجين [H⁺] بالمولارية (mol/L):', 'Enter [H+] concentration (mol/L):')}
                      {inputMode === 'oh' && t('أدخل تركيز أيون الهيدروكسيد [OH⁻] بالمولارية (mol/L):', 'Enter [OH-] concentration (mol/L):')}
                    </label>
                    <input
                      type="text"
                      value={phInput}
                      onChange={(e) => setPhInput(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <span>{t('أمثلة سريعة من الكتاب:', 'Quick textbook presets:')}</span>
                      <button onClick={() => { setInputMode('ph'); setPhInput('1.0'); }} className="text-cyan-400 hover:underline">HCl (1.0)</button>
                      <span>·</span>
                      <button onClick={() => { setInputMode('ph'); setPhInput('7.0'); }} className="text-cyan-400 hover:underline">{t('ماء نقي (7.0)', 'Water (7.0)')}</button>
                      <span>·</span>
                      <button onClick={() => { setInputMode('ph'); setPhInput('13.0'); }} className="text-cyan-400 hover:underline">NaOH (13.0)</button>
                      <span>·</span>
                      <button onClick={() => { setInputMode('ph'); setPhInput('7.4'); }} className="text-cyan-400 hover:underline">{t('دم سليم (7.4)', 'Blood (7.4)')}</button>
                    </div>
                  </div>

                  {/* Classification Badge */}
                  <div className={`p-4 rounded-xl border flex flex-col justify-center ${
                    isAcidic
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                      : isBasic
                      ? 'bg-blue-950/30 border-blue-500/40 text-blue-300'
                      : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  }`}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-1">
                      {t('طبيعة المحلول الكيميائي', 'Chemical Solution Nature')}
                    </div>
                    <div className="text-xl font-black flex items-center gap-2">
                      {isAcidic && <span>🧪 {t('محلول حمضي ([H⁺] > [OH⁻])', 'Acidic Solution ([H+] > [OH-])')}</span>}
                      {isBasic && <span>🧼 {t('محلول قاعدي/قلوي ([OH⁻] > [H⁺])', 'Basic/Alkaline Solution ([OH-] > [H+])')}</span>}
                      {isNeutral && <span>⚖️ {t('محلول متعادل كيميائياً ([H⁺] = [OH⁻])', 'Neutral Solution ([H+] = [OH-])')}</span>}
                    </div>
                    <div className="text-xs mt-1.5 opacity-85">
                      {isAcidic && t('يحمر ورقة تباع الشمس، وطعمه لاذع، موصل جيد إذا كان حمضاً قوياً.', 'Turns litmus red, tastes sour, conducts well if strong.')}
                      {isBasic && t('يزرق ورقة تباع الشمس، ملمسه زلق كالصابون، يلون الفينولفثالين بالوردي.', 'Turns litmus blue, slippery feel, turns phenolphthalein pink.')}
                      {isNeutral && t('متعادل مثل الماء المقطر ومحلول NaCl، لا يغير لون تباع الشمس (أخضر مع البروموثيمول).', 'Neutral like pure water and NaCl, green with bromothymol blue.')}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Cards Results */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono">
                <div className={`p-3 sm:p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs text-slate-400 font-sans">{t('الرقم الهيدروجيني', 'pH Value')}</div>
                  <div className="text-xl sm:text-2xl font-black text-cyan-400 mt-1">{derivedPH.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-1">pH = -log[H⁺]</div>
                </div>

                <div className={`p-3 sm:p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs text-slate-400 font-sans">{t('الرقم الهيدروكسيدي', 'pOH Value')}</div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{derivedPOH.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-1">pOH = 14.00 - pH</div>
                </div>

                <div className={`p-3 sm:p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs text-slate-400 font-sans">{t('تركيز أيون [H⁺]', '[H+] Concentration')}</div>
                  <div className="text-sm sm:text-base font-black text-rose-400 mt-1 truncate">{derivedH.toExponential(2)} M</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-1">[H⁺] = 10⁻ᵖᴴ</div>
                </div>

                <div className={`p-3 sm:p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs text-slate-400 font-sans">{t('تركيز أيون [OH⁻]', '[OH-] Concentration')}</div>
                  <div className="text-sm sm:text-base font-black text-emerald-400 mt-1 truncate">{derivedOH.toExponential(2)} M</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-1">[OH⁻] = Kw / [H⁺]</div>
                </div>
              </div>

              {/* Chemical Law Card */}
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${isDark ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-cyan-50/50 border-cyan-200 text-slate-700'}`}>
                <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('القاعدة المعتمدة من الفصل الثاني (صفحة 74-75):', 'Official Rule from Chapter 2 (Pages 74-75):')}</span>
                </div>
                <p>
                  {t(
                    'حاصل ضرب تركيز أيوني الهيدروجين والهيدروكسيل في أي محلول مائي يساوي دائماً ثابت تأين الماء Kw = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴ عند 298 K (25°C). لذا كلما زاد [H⁺] نقص [OH⁻] تلقائياً للحفاظ على الاتزان الديناميكي وفق مبدأ لوتشاتلييه.',
                    'The product of [H+] and [OH-] in any aqueous solution always equals Kw = 1.0 × 10⁻¹⁴ at 298 K. As [H+] rises, [OH-] decreases to maintain dynamic equilibrium according to Le Chatelier’s principle.'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Galvanic Cell Potential E°cell */}
          {activeTab === 'cell_potential' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="font-black text-sm sm:text-base text-cyan-400 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>{t('حساب جهد الخلية الجلفانية: E°cell = E°cathode - E°anode', 'Galvanic Cell EMF: E°cell = E°cathode - E°anode')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cathode Selection */}
                  <div>
                    <label className="block text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                      <span>🔵 {t('نصف تفاعل الكاثود (المهبط - حيث يحدث الاختزال):', 'Cathode Half-Reaction (Reduction):')}</span>
                    </label>
                    <select
                      value={cathodeIndex}
                      onChange={(e) => setCathodeIndex(Number(e.target.value))}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {STANDARD_REDUCTION_POTENTIALS.map((p, idx) => (
                        <option key={idx} value={idx}>
                          {p.species}: {p.halfReaction} (E° = {p.e0 > 0 ? `+${p.e0.toFixed(4)}` : p.e0.toFixed(4)} V)
                        </option>
                      ))}
                    </select>
                    <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">
                      E°cathode = {cathode.e0 > 0 ? `+${cathode.e0.toFixed(4)}` : cathode.e0.toFixed(4)} V
                    </div>
                  </div>

                  {/* Anode Selection */}
                  <div>
                    <label className="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                      <span>🟠 {t('نصف تفاعل الأنود (المصعد - حيث تحدث الأكسدة):', 'Anode Half-Reaction (Oxidation):')}</span>
                    </label>
                    <select
                      value={anodeIndex}
                      onChange={(e) => setAnodeIndex(Number(e.target.value))}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      {STANDARD_REDUCTION_POTENTIALS.map((p, idx) => (
                        <option key={idx} value={idx}>
                          {p.species}: {p.halfReaction} (E° = {p.e0 > 0 ? `+${p.e0.toFixed(4)}` : p.e0.toFixed(4)} V)
                        </option>
                      ))}
                    </select>
                    <div className="text-[11px] text-amber-400/80 mt-1 font-mono">
                      E°anode = {anode.e0 > 0 ? `+${anode.e0.toFixed(4)}` : anode.e0.toFixed(4)} V
                    </div>
                  </div>
                </div>

                {/* Swap electrodes button */}
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => {
                      const temp = cathodeIndex;
                      setCathodeIndex(anodeIndex);
                      setAnodeIndex(temp);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-700'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('تبديل القطبين (عكس اتجاه التيار)', 'Swap Electrodes')}</span>
                  </button>
                </div>
              </div>

              {/* Potential Result Card */}
              <div className={`p-5 rounded-3xl border ${
                isSpontaneous
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold opacity-80">
                      {t('جهد الخلية القياسي المحسوب (E°cell)', 'Calculated Standard Cell Potential')}
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono mt-1">
                      {eCell > 0 ? `+${eCell.toFixed(4)}` : eCell.toFixed(4)} V
                    </div>
                    <div className="text-xs font-mono mt-2">
                      E°cell = ({cathode.e0 > 0 ? `+${cathode.e0.toFixed(3)}` : cathode.e0.toFixed(3)}) - ({anode.e0 > 0 ? `+${anode.e0.toFixed(3)}` : anode.e0.toFixed(3)}) = {eCell.toFixed(4)} V
                    </div>
                  </div>

                  <div className="sm:text-left">
                    <span className={`inline-block px-3 py-1.5 rounded-xl font-black text-xs border ${
                      isSpontaneous
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-rose-500 text-white border-rose-400'
                    }`}>
                      {isSpontaneous ? t('⚡ تفاعل تلقائي (خلية جلفانية منتجة للطاقة)', '⚡ Spontaneous (Galvanic Cell)') : t('🔋 تفاعل غير تلقائي (يتطلب تحليلاً كهربائياً)', '🔋 Non-spontaneous (Electrolytic)')}
                    </span>
                    <p className="text-xs mt-2 opacity-90 max-w-sm">
                      {isSpontaneous
                        ? t('تتدفق الإلكترونات تلقائياً من الأنود إلى الكاثود عبر السلك، وتولد تياراً كهربائياً يشغل المحركات والمصابيح.', 'Electrons flow spontaneously from anode to cathode, delivering electric power.')
                        : t('التفاعل العكسي هو التلقائي؛ لكي يحدث هذا التفاعل يجب تزويده بطاقة كهربائية خارجية أكبر من جهد الخلية.', 'Reverse reaction is spontaneous; this direction requires external electrical power.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Textbook Reference note */}
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${isDark ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('من أمثلة كتاب كيمياء 3 الشهيرة (مثال 4-1 صفحة 140):', 'From Chemistry 3 Textbook Example 4-1 (Page 140):')}</span>
                </div>
                <p>
                  {t(
                    'خلية دانيال الجلفانية (خارصين/نحاس): الكاثود هو النحاس Cu²⁺/Cu (+0.342V) والأنود هو الخارصين Zn²⁺/Zn (-0.762V)، ويكون جهد الخلية القياسي: E°cell = +0.342 - (-0.762) = +1.104 V، مما يجعله تفاعلاً تلقائياً ممتازاً لإنتاج الطاقة.',
                    'Daniel Cell (Zn/Cu): Cathode is Cu²⁺/Cu (+0.342V), Anode is Zn²⁺/Zn (-0.762V), resulting in E°cell = +0.342 - (-0.762) = +1.104 V.'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Dilution Law M1*V1 = M2*V2 */}
          {activeTab === 'dilution' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="font-black text-sm sm:text-base text-cyan-400 mb-3 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  <span>{t('معادلة التخفيف للمحاليل القياسية: M₁V₁ = M₂V₂', 'Standard Solution Dilution: M₁V₁ = M₂V₂')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {t('تركيز المحلول القياسي المركز (M₁):', 'Stock Molarity (M₁):')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={m1}
                      onChange={(e) => setM1(e.target.value)}
                      className={`w-full px-4 py-2 rounded-xl border font-mono text-sm font-bold focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500">M (mol/L)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {t('التركيز المخفف المطلوب (M₂):', 'Target Dilute Molarity (M₂):')}
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={m2}
                      onChange={(e) => setM2(e.target.value)}
                      className={`w-full px-4 py-2 rounded-xl border font-mono text-sm font-bold focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500">M (mol/L)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {t('الحجم النهائي المطلوب (V₂):', 'Target Final Volume (V₂):')}
                    </label>
                    <input
                      type="number"
                      step="10"
                      value={v2}
                      onChange={(e) => setV2(e.target.value)}
                      className={`w-full px-4 py-2 rounded-xl border font-mono text-sm font-bold focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500">mL (مللتر)</span>
                  </div>
                </div>
              </div>

              {/* Dilution Result */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-cyan-950/30 border-cyan-500/40' : 'bg-cyan-50 border-cyan-200'}`}>
                  <div className="text-xs text-slate-400 font-bold">{t('الحجم اللازم أخذه من المحلول المركز (V₁)', 'Volume to take from stock (V₁)')}</div>
                  <div className="text-3xl font-black font-mono text-cyan-400 mt-1">{v1.toFixed(2)} mL</div>
                  <div className="text-xs text-slate-400 mt-2 font-mono">
                    V₁ = (M₂ × V₂) / M₁ = ({numM2} × {numV2}) / {numM1}
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-blue-950/30 border-blue-500/40' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="text-xs text-slate-400 font-bold">{t('حجم الماء المقطر المضاف للتخفيف', 'Volume of distilled water to add')}</div>
                  <div className="text-3xl font-black font-mono text-blue-400 mt-1">{waterToAdd.toFixed(2)} mL</div>
                  <div className="text-xs text-slate-400 mt-2 font-mono">
                    V_water = V₂ - V₁ = {numV2} - {v1.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Practical Guidance */}
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${isDark ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('طريقة العمل المخبرية المعتمدة (صفحة 23-25):', 'Official Laboratory Procedure (Pages 23-25):')}</span>
                </div>
                <p>
                  {t(
                    'لقياس الحجم بدقة، قس V₁ بالمخبار المدرج أو الماصة، ضعه في دورق حجمي سعته V₂، ثم أضف الماء المقطر تدريجياً حتى تصل حافة التقعر للعلامة المحددة على عنق الدورق الحجمي ورج المحلول بلطف ليصبح متجانساً.',
                    'Measure V₁ using graduated cylinder/pipette, transfer to volumetric flask V₂, then add distilled water up to the graduation mark and invert to mix.'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Henry's Law */}
          {activeTab === 'henry' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="font-black text-sm sm:text-base text-cyan-400 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>{t('قانون هنري لذائبية الغازات: S₁ / P₁ = S₂ / P₂', 'Henry’s Law: S₁ / P₁ = S₂ / P₂')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {t('الذائبية الابتدائية (S₁):', 'Initial Solubility (S₁):')}
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={s1}
                      onChange={(e) => setS1(e.target.value)}
                      className={`w-full px-4 py-2 rounded-xl border font-mono text-sm font-bold focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500">g/L</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {t('الضغط الابتدائي للغاز (P₁):', 'Initial Gas Pressure (P₁):')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={p1}
                      onChange={(e) => setP1(e.target.value)}
                      className={`w-full px-4 py-2 rounded-xl border font-mono text-sm font-bold focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500">atm أو kPa</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {t('الضغط الجديد للغاز (P₂):', 'New Gas Pressure (P₂):')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={p2}
                      onChange={(e) => setP2(e.target.value)}
                      className={`w-full px-4 py-2 rounded-xl border font-mono text-sm font-bold focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500">atm أو kPa</span>
                  </div>
                </div>
              </div>

              {/* Henry's Result */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-cyan-950/30 border-cyan-500/40' : 'bg-cyan-50 border-cyan-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider font-bold opacity-80">
                      {t('الذائبية الجديدة الناتجة (S₂)', 'New Calculated Solubility (S₂)')}
                    </div>
                    <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-400 mt-1">
                      {s2.toFixed(4)} g/L
                    </div>
                    <div className="text-xs font-mono mt-2 text-slate-400">
                      S₂ = (S₁ × P₂) / P₁ = ({numS1} × {numP2}) / {numP1} = {s2.toFixed(4)} g/L
                    </div>
                  </div>

                  <div className="max-w-xs text-xs opacity-85 leading-relaxed">
                    {numP2 < numP1
                      ? t('انخفض الضغط فوق السائل، لذا تهرب جزيئات الغاز من المحلول ويحدث فوران (مثل فتح قارورة المشروب الغازي).', 'Pressure decreased, so dissolved gas escapes with effervescence.')
                      : t('زاد الضغط فوق السائل، مما يجبر المزيد من جزيئات الغاز على الذوبان في السائل.', 'Pressure increased, forcing more gas molecules into solution.')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Colligative Properties (ΔTb & ΔTf) */}
          {activeTab === 'colligative' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="font-black text-sm sm:text-base text-cyan-400 mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  <span>{t('الخواص الجامعة: الارتفاع في الغليان والانخفاض في التجمد', 'Colligative Properties: ΔTb & ΔTf')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {t('نوع المذيب النقي:', 'Pure Solvent:')}
                    </label>
                    <select
                      value={solvent}
                      onChange={(e) => setSolvent(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="water">{t('الماء (Kb=0.512, Kf=1.86)', 'Water (Kb=0.512, Kf=1.86)')}</option>
                      <option value="benzene">{t('البنزين (Kb=2.53, Kf=5.12)', 'Benzene (Kb=2.53, Kf=5.12)')}</option>
                      <option value="ethanol">{t('الإيثانول (Kb=1.22, Kf=1.99)', 'Ethanol (Kb=1.22, Kf=1.99)')}</option>
                      <option value="chloroform">{t('الكلوروفورم (Kb=3.63, Kf=4.68)', 'Chloroform (Kb=3.63, Kf=4.68)')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {t('مولالية المحلول (m):', 'Molality (m, mol/kg):')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={molality}
                      onChange={(e) => setMolality(e.target.value)}
                      className={`w-full px-4 py-2 rounded-xl border font-mono text-sm font-bold focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500">mol / kg solvent</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      {t('معامل فانت هوف (عدد الأيونات i):', 'Van \'t Hoff factor (i):')}
                    </label>
                    <select
                      value={vanHoff}
                      onChange={(e) => setVanHoff(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold focus:ring-2 focus:ring-cyan-500 ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value={1}>{t('1 (مادة غير متأينة: سكروز، جلوكوز)', '1 (Non-electrolyte: sucrose, glucose)')}</option>
                      <option value={2}>{t('2 (إلكتروليت ثنائي: NaCl, KBr)', '2 (Binary: NaCl, KBr)')}</option>
                      <option value={3}>{t('3 (إلكتروليت ثلاثي: CaCl₂, Na₂SO₄)', '3 (Ternary: CaCl₂, Na₂SO₄)')}</option>
                      <option value={4}>{t('4 (إلكتروليت رباعي: AlCl₃)', '4 (Quaternary: AlCl₃)')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Colligative Results */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <div className="text-xs uppercase font-bold tracking-wider">{t('درجة غليان المحلول بعد الارتفاع (Tb)', 'Boiling Point (Tb)')}</div>
                  <div className="text-3xl font-black font-mono text-rose-400 mt-1">{finalTb.toFixed(3)} °C</div>
                  <div className="text-xs font-mono mt-1 opacity-80">
                    ΔTb = Kb · m · i = {deltaTb.toFixed(3)} °C  (Tb = {activeSolv.tb0} + {deltaTb.toFixed(3)})
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200' : 'bg-cyan-50 border-cyan-200 text-cyan-900'}`}>
                  <div className="text-xs uppercase font-bold tracking-wider">{t('درجة تجمد المحلول بعد الانخفاض (Tf)', 'Freezing Point (Tf)')}</div>
                  <div className="text-3xl font-black font-mono text-cyan-400 mt-1">{finalTf.toFixed(3)} °C</div>
                  <div className="text-xs font-mono mt-1 opacity-80">
                    ΔTf = Kf · m · i = {deltaTf.toFixed(3)} °C  (Tf = {activeSolv.tf0} - {deltaTf.toFixed(3)})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Molarity & Mass % */}
          {activeTab === 'molarity' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className="font-black text-sm sm:text-base text-cyan-400 mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  <span>{t('حساب المولارية والنسبة المئوية بالكتلة للمحاليل', 'Molarity and Mass Percent Calculator')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">{t('كتلة المذاب (g):', 'Solute Mass (g):')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={soluteGrams}
                      onChange={(e) => setSoluteGrams(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">{t('الكتلة المولية للمذاب (g/mol):', 'Molar Mass (g/mol):')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={molarMass}
                      onChange={(e) => setMolarMass(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">{t('حجم المحلول الكلي (L):', 'Total Volume (L):')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={solnVolumeL}
                      onChange={(e) => setSolnVolumeL(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">{t('كتلة المحلول الكلية (g):', 'Total Mass (g):')}</label>
                    <input
                      type="number"
                      step="10"
                      value={solnTotalGrams}
                      onChange={(e) => setSolnTotalGrams(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-bold ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Molarity Results */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs text-slate-400 font-sans">{t('عدد مولات المذاب (n)', 'Moles of Solute (n)')}</div>
                  <div className="text-2xl font-black text-cyan-400 mt-1">{calcMoles.toFixed(4)} mol</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-1">n = mass / molar mass</div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs text-slate-400 font-sans">{t('التركيز المولاري (Molarity)', 'Molarity (M)')}</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{calcMolarity.toFixed(4)} M</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-1">M = moles / volume(L)</div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-xs text-slate-400 font-sans">{t('النسبة المئوية بالكتلة (% w/w)', 'Mass Percent (% w/w)')}</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{calcMassPercent.toFixed(2)} %</div>
                  <div className="text-[10px] text-slate-500 font-sans mt-1">% = (m_solute / m_total) × 100</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
