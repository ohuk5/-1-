import React, { useState } from 'react';
import { Calculator, ArrowRight, CheckCircle2, RotateCcw, Zap, Wind, Waves, Sun, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playLabSound } from '../../utils/soundEffects';

type CalcType = 'gas' | 'coulomb' | 'photoelectric' | 'buoyancy' | 'kinetic' | 'snell';

export const PhysicsCalculator: React.FC = () => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [activeCalc, setActiveCalc] = useState<CalcType>('gas');

  // --- 1. Ideal Gas Law state: PV = nRT ---
  const [gasTarget, setGasTarget] = useState<'P' | 'V' | 'n' | 'T'>('P');
  const [gasP, setGasP] = useState<number>(1.0); // atm
  const [gasV, setGasV] = useState<number>(22.4); // L
  const [gasN, setGasN] = useState<number>(1.0); // mol
  const [gasT, setGasT] = useState<number>(273.15); // K
  const R_GAS = 0.08206; // L·atm / (mol·K)

  // --- 2. Coulomb's Law: F = k*|q1*q2| / r^2 ---
  const [q1Micro, setQ1Micro] = useState<number>(2); // µC
  const [q2Micro, setQ2Micro] = useState<number>(-4); // µC
  const [distanceM, setDistanceM] = useState<number>(0.5); // meters
  const K_E = 8.98755e9;

  // --- 3. Photon Energy & Photoelectric: E = hc/λ, K_max = E - Φ ---
  const [lambdaNm, setLambdaNm] = useState<number>(350); // nm
  const [workPhiEV, setWorkPhiEV] = useState<number>(2.46); // Sodium (2.46 eV)
  const HC_EV_NM = 1239.84;

  // --- 4. Buoyancy & Archimedes: Fb = rho * V * g ---
  const [fluidDensity, setFluidDensity] = useState<number>(1000); // kg/m³
  const [displacedVolumeL, setDisplacedVolumeL] = useState<number>(5); // L
  const [gravityG, setGravityG] = useState<number>(9.8); // m/s²

  // --- 5. Kinetic Energy & Momentum: Ek = 0.5*m*v^2, p = m*v ---
  const [massKg, setMassKg] = useState<number>(2.5); // kg
  const [velocityMs, setVelocityMs] = useState<number>(12); // m/s

  // --- 6. Snell's Law: n1*sin(θ1) = n2*sin(θ2) ---
  const [n1, setN1] = useState<number>(1.0); // Air
  const [theta1Deg, setTheta1Deg] = useState<number>(30); // degrees
  const [n2, setN2] = useState<number>(1.5); // Glass

  // Calculation Results
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

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Formula Selector Bar */}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { id: 'gas', labelAr: 'معادلة الغاز المثالي (PV=nRT)', labelEn: 'Ideal Gas Law (PV=nRT)', icon: <Wind className="w-4 h-4" /> },
          { id: 'coulomb', labelAr: 'قانون كولوم والشحنات (Coulomb)', labelEn: "Coulomb's Law (Electrostatics)", icon: <Zap className="w-4 h-4" /> },
          { id: 'photoelectric', labelAr: 'الظاهرة الكهروضوئية (E=hf)', labelEn: 'Photoelectric (E=hf)', icon: <Sun className="w-4 h-4" /> },
          { id: 'buoyancy', labelAr: 'قاعدة أرخميدس والطفو (Buoyancy)', labelEn: 'Archimedes Buoyancy (Fb)', icon: <Waves className="w-4 h-4" /> },
          { id: 'kinetic', labelAr: 'الطاقة الحركية والزخم (Ek, p)', labelEn: 'Kinetic Energy & Momentum', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'snell', labelAr: 'قانون سنيل والانكسار (Snell)', labelEn: "Snell's Law (Optics)", icon: <Calculator className="w-4 h-4" /> }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveCalc(item.id as CalcType);
              playLabSound('click');
            }}
            className={`py-2 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              activeCalc === item.id
                ? 'bg-cyan-500 text-white shadow-md border-cyan-400'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {item.icon}
            <span>{isAr ? item.labelAr : item.labelEn}</span>
          </button>
        ))}
      </div>

      {/* Active Calculator Box */}
      <div className={`rounded-3xl border p-5 sm:p-7 shadow-sm ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* 1. IDEAL GAS */}
        {activeCalc === 'gas' && (() => {
          const res = calculateGasResult();
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white">
                    {t('معادلة الغاز المثالي (The Ideal Gas Equation)', 'The Ideal Gas Law Equation')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('P · V = n · R · T (حيث R = 0.0821 L·atm/mol·K)', 'P · V = n · R · T (with R = 0.0821 L·atm/mol·K)')}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-300">{t('المتغير المطلوب حسابه:', 'Target variable to solve for:')}</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(['P', 'V', 'n', 'T'] as const).map(target => (
                      <button
                        key={target}
                        onClick={() => setGasTarget(target)}
                        className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                          gasTarget === target
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                            : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {target} {target === 'P' ? '(الضغط)' : target === 'V' ? '(الحجم)' : target === 'n' ? '(المولات)' : '(الحرارة)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {gasTarget !== 'P' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">{t('الضغط P (atm):', 'Pressure P (atm):')}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={gasP}
                        onChange={e => setGasP(Number(e.target.value))}
                        className={`p-2 rounded-xl border text-xs font-mono ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  )}
                  {gasTarget !== 'V' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">{t('الحجم V (L):', 'Volume V (L):')}</label>
                      <input
                        type="number"
                        step="0.5"
                        value={gasV}
                        onChange={e => setGasV(Number(e.target.value))}
                        className={`p-2 rounded-xl border text-xs font-mono ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  )}
                  {gasTarget !== 'n' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">{t('كمية المادة n (mol):', 'Amount n (mol):')}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={gasN}
                        onChange={e => setGasN(Number(e.target.value))}
                        className={`p-2 rounded-xl border text-xs font-mono ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  )}
                  {gasTarget !== 'T' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">{t('الحرارة المطلقة T (K):', 'Temp T (K):')}</label>
                      <input
                        type="number"
                        step="1"
                        value={gasT}
                        onChange={e => setGasT(Number(e.target.value))}
                        className={`p-2 rounded-xl border text-xs font-mono ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Output Card */}
              <div className="p-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                  {t('القيمة المحسوبة (Calculated Output)', 'Calculated Output')}
                </span>
                <span className="text-4xl font-mono font-bold text-cyan-300 tabular-nums">
                  {res.val.toFixed(3)} {res.unit}
                </span>
                <p className="text-xs text-slate-400 max-w-sm">
                  {gasTarget === 'P' && `يعادل ${(res.val * 101.325).toFixed(2)} kPa أو ${(res.val * 760).toFixed(0)} mmHg`}
                  {gasTarget === 'T' && `يعادل ${(res.val - 273.15).toFixed(2)} °C`}
                  {gasTarget === 'V' && `حجم الغاز عند هذه الشروط باللتر`}
                  {gasTarget === 'n' && `عدد جزيئات الغاز = ${(res.val * 6.022e23).toExponential(3)} جزيء`}
                </p>
              </div>
            </div>
          );
        })()}

        {/* 2. COULOMB'S LAW */}
        {activeCalc === 'coulomb' && (() => {
          const res = calculateCoulombResult();
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white">
                    {t('قانون كولوم الكهروستاتيكي (Coulomb\'s Law)', "Coulomb's Law Equation")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('F = k_e · |q₁ · q₂| / r² (حيث k_e = 8.99 × 10⁹ N·m²/C²)', 'F = k_e · |q₁ · q₂| / r²')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('الشحنة الأولى q₁ (µC):', 'Charge q₁ (µC):')}</label>
                    <input
                      type="number"
                      step="0.5"
                      value={q1Micro}
                      onChange={e => setQ1Micro(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('الشحنة الثانية q₂ (µC):', 'Charge q₂ (µC):')}</label>
                    <input
                      type="number"
                      step="0.5"
                      value={q2Micro}
                      onChange={e => setQ2Micro(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('المسافة الفاصلة r (m):', 'Distance r (m):')}</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.01"
                      value={distanceM}
                      onChange={e => setDistanceM(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Output Card */}
              <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-500/5 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">
                  {t('القوة الكهربائية المتبادلة (Coulomb Force)', 'Coulomb Force')}
                </span>
                <span className="text-4xl font-mono font-bold text-purple-300 tabular-nums">
                  {res.fN >= 1000 ? `${(res.fN / 1000).toFixed(3)} kN` : `${res.fN.toFixed(3)} N`}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  res.isAttract ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {res.isAttract ? t('قوة تجاذب (شحنتان مختلفتان)', 'Attractive Force (Opposite Charges)') : t('قوة تنافر (شحنتان متشابهتان)', 'Repulsive Force (Same Sign)')}
                </span>
              </div>
            </div>
          );
        })()}

        {/* 3. PHOTOELECTRIC */}
        {activeCalc === 'photoelectric' && (() => {
          const res = calculatePhotoelectricResult();
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white">
                    {t('طاقة الفوتون ومعادلة أينشتاين الكهروضوئية', 'Einstein Photoelectric Equation')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('E = hc / λ  |  K_max = E - Φ', 'E = hc / λ  |  K_max = E - Φ')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('طول الموجة λ (nm):', 'Wavelength λ (nm):')}</label>
                    <input
                      type="number"
                      step="10"
                      min="100"
                      max="1000"
                      value={lambdaNm}
                      onChange={e => setLambdaNm(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('دالة شغل المعدن Φ (eV):', 'Work Function Φ (eV):')}</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      max="8.0"
                      value={workPhiEV}
                      onChange={e => setWorkPhiEV(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Output Card */}
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                  {t('طاقة الفوتون E:', 'Photon Energy E:')} {res.energyEV.toFixed(2)} eV
                </span>
                <span className="text-4xl font-mono font-bold text-amber-300 tabular-nums">
                  K_max = {res.kMaxEV.toFixed(2)} eV
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  res.isEmitted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {res.isEmitted
                    ? t('يحدث انبعاث للإلكترونات (E ≥ Φ)', 'Photoelectrons are ejected')
                    : t('لا يحدث انبعاث (طاقة الفوتون غير كافية)', 'No emission (E < Φ)')}
                </span>
                <span className="text-[11px] text-slate-400">
                  {t(`طول موجة العتبة λ₀ = ${res.thresholdNm.toFixed(0)} nm`, `Threshold Wavelength λ₀ = ${res.thresholdNm.toFixed(0)} nm`)}
                </span>
              </div>
            </div>
          );
        })()}

        {/* 4. BUOYANCY */}
        {activeCalc === 'buoyancy' && (() => {
          const res = calculateBuoyancyResult();
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white">
                    {t('قوة الطفو وقاعدة أرخميدس', 'Archimedes Buoyant Force (Fb)')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('F_b = ρ_fluid · V_displaced · g', 'F_b = ρ_fluid · V_displaced · g')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('كثافة السائل (kg/m³):', 'Fluid Density:')}</label>
                    <input
                      type="number"
                      step="50"
                      value={fluidDensity}
                      onChange={e => setFluidDensity(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('الحجم المزاح (L):', 'Volume (L):')}</label>
                    <input
                      type="number"
                      step="0.5"
                      value={displacedVolumeL}
                      onChange={e => setDisplacedVolumeL(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('الجاذبية g (m/s²):', 'Gravity g:')}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gravityG}
                      onChange={e => setGravityG(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Output Card */}
              <div className="p-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                  {t('قوة الطفو الصاعدة (Buoyant Force)', 'Upward Buoyant Force')}
                </span>
                <span className="text-4xl font-mono font-bold text-cyan-300 tabular-nums">
                  {res.forceN.toFixed(2)} N
                </span>
                <p className="text-xs text-slate-400">
                  {t(`تساوي وزن السائل المزاح البالغ كتلته ${res.massDisplacedKg.toFixed(2)} kg`,
                     `Equal to the weight of ${res.massDisplacedKg.toFixed(2)} kg displaced fluid`)}
                </p>
              </div>
            </div>
          );
        })()}

        {/* 5. KINETIC ENERGY */}
        {activeCalc === 'kinetic' && (() => {
          const res = calculateKineticResult();
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white">
                    {t('الطاقة الحركية وكمية الحركة (Kinetic Energy & Momentum)', 'Kinetic Energy & Momentum')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('E_k = 1/2 · m · v²  |  p = m · v', 'E_k = 1/2 · m · v²  |  p = m · v')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('الكتلة m (kg):', 'Mass m (kg):')}</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={massKg}
                      onChange={e => setMassKg(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('السرعة v (m/s):', 'Velocity v (m/s):')}</label>
                    <input
                      type="number"
                      step="1"
                      value={velocityMs}
                      onChange={e => setVelocityMs(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Output Card */}
              <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
                  {t('الطاقة الحركية (Kinetic Energy)', 'Kinetic Energy')}
                </span>
                <span className="text-4xl font-mono font-bold text-emerald-300 tabular-nums">
                  {res.ek >= 1000 ? `${(res.ek / 1000).toFixed(2)} kJ` : `${res.ek.toFixed(2)} J`}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {t('كمية الحركة (Momentum p):', 'Momentum p:')} {res.p.toFixed(2)} kg·m/s
                </span>
              </div>
            </div>
          );
        })()}

        {/* 6. SNELL'S LAW */}
        {activeCalc === 'snell' && (() => {
          const res = calculateSnellResult();
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white">
                    {t('قانون سنيل للانكسار الضوئي (Snell\'s Law)', "Snell's Law of Refraction")}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('n₁ · sin(θ₁) = n₂ · sin(θ₂)', 'n₁ · sin(θ₁) = n₂ · sin(θ₂)')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('معامل الوسط الأول n₁:', 'Refractive Index n₁:')}</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      value={n1}
                      onChange={e => setN1(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('زاوية السقوط θ₁ (°):', 'Incident Angle θ₁ (°):')}</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="89"
                      value={theta1Deg}
                      onChange={e => setTheta1Deg(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">{t('معامل الوسط الثاني n₂:', 'Refractive Index n₂:')}</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1.0"
                      value={n2}
                      onChange={e => setN2(Number(e.target.value))}
                      className={`p-2 rounded-xl border text-xs font-mono ${
                        isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Output Card */}
              <div className="p-6 rounded-2xl border border-sky-500/30 bg-sky-500/5 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-xs font-mono text-sky-400 uppercase tracking-widest">
                  {t('زاوية الانكسار (Refraction Angle θ₂)', 'Refraction Angle θ₂')}
                </span>
                {res.tir ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-bold text-rose-400">
                      {t('انعكاس كلي داخلي (TIR)', 'Total Internal Reflection')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {t(`الزاوية الحرجة θ_c = ${res.criticalAngleDeg?.toFixed(1)}° (θ₁ تجاوزت الزاوية الحرجة)`,
                         `Critical Angle θ_c = ${res.criticalAngleDeg?.toFixed(1)}°`)}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl font-mono font-bold text-sky-300 tabular-nums">
                      θ₂ = {res.theta2Deg.toFixed(2)}°
                    </span>
                    {res.criticalAngleDeg && (
                      <span className="text-xs text-slate-400">
                        {t(`الزاوية الحرجة لهذا الوسطين: ${res.criticalAngleDeg.toFixed(1)}°`,
                           `Critical Angle: ${res.criticalAngleDeg.toFixed(1)}°`)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
