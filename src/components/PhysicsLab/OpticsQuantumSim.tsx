import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap, Sun, Lightbulb, Compass, Waves, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playLabSound } from '../../utils/soundEffects';

interface Metal {
  id: string;
  nameAr: string;
  nameEn: string;
  workFunctionEV: number; // Φ in eV
  color: string;
}

const METALS: Metal[] = [
  { id: 'cs', nameAr: 'السيزيوم (Cesium)', nameEn: 'Cesium', workFunctionEV: 2.14, color: '#e2e8f0' },
  { id: 'k', nameAr: 'البوتاسيوم (Potassium)', nameEn: 'Potassium', workFunctionEV: 2.30, color: '#cbd5e1' },
  { id: 'na', nameAr: 'الصوديوم (Sodium)', nameEn: 'Sodium', workFunctionEV: 2.46, color: '#fef08a' },
  { id: 'zn', nameAr: 'الخارصين (Zinc)', nameEn: 'Zinc', workFunctionEV: 4.31, color: '#94a3b8' },
  { id: 'pt', nameAr: 'البلاتين (Platinum)', nameEn: 'Platinum', workFunctionEV: 6.35, color: '#f1f5f9' }
];

interface SpectralElement {
  id: string;
  nameAr: string;
  nameEn: string;
  glowColor: string;
  lines: { wavelengthNm: number; color: string; label: string }[];
}

const SPECTRAL_ELEMENTS: SpectralElement[] = [
  {
    id: 'h',
    nameAr: 'الهيدروجين (H - متسلسلة بالمر)',
    nameEn: 'Hydrogen (Balmer Series)',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    lines: [
      { wavelengthNm: 656.3, color: '#ef4444', label: 'H-α (n=3→2)' },
      { wavelengthNm: 486.1, color: '#06b6d4', label: 'H-β (n=4→2)' },
      { wavelengthNm: 434.0, color: '#3b82f6', label: 'H-γ (n=5→2)' },
      { wavelengthNm: 410.2, color: '#8b5cf6', label: 'H-δ (n=6→2)' }
    ]
  },
  {
    id: 'he',
    nameAr: 'الهيليوم (He)',
    nameEn: 'Helium',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    lines: [
      { wavelengthNm: 706.5, color: '#dc2626', label: '706 nm' },
      { wavelengthNm: 667.8, color: '#ef4444', label: '668 nm' },
      { wavelengthNm: 587.6, color: '#f59e0b', label: '588 nm' },
      { wavelengthNm: 501.6, color: '#10b981', label: '502 nm' },
      { wavelengthNm: 447.1, color: '#3b82f6', label: '447 nm' }
    ]
  },
  {
    id: 'na',
    nameAr: 'الصوديوم (Na - خط D المزدوج)',
    nameEn: 'Sodium (D Doublet)',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    lines: [
      { wavelengthNm: 589.0, color: '#eab308', label: 'D2 589.0 nm' },
      { wavelengthNm: 589.6, color: '#facc15', label: 'D1 589.6 nm' }
    ]
  },
  {
    id: 'ne',
    nameAr: 'النيون (Ne - الضوء البرتقالي/الأحمر)',
    nameEn: 'Neon',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    lines: [
      { wavelengthNm: 640.2, color: '#ea580c', label: '640 nm' },
      { wavelengthNm: 614.3, color: '#f97316', label: '614 nm' },
      { wavelengthNm: 585.2, color: '#f59e0b', label: '585 nm' },
      { wavelengthNm: 540.0, color: '#84cc16', label: '540 nm' }
    ]
  },
  {
    id: 'hg',
    nameAr: 'الزئبق (Hg)',
    nameEn: 'Mercury',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    lines: [
      { wavelengthNm: 579.0, color: '#eab308', label: '579 nm' },
      { wavelengthNm: 546.1, color: '#22c55e', label: '546 nm' },
      { wavelengthNm: 435.8, color: '#3b82f6', label: '436 nm' },
      { wavelengthNm: 404.7, color: '#a855f7', label: '405 nm' }
    ]
  }
];

export const OpticsQuantumSim: React.FC = () => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [opticsMode, setOpticsMode] = useState<'photoelectric' | 'spectra' | 'prism'>('photoelectric');

  // --- Photoelectric State ---
  const [selectedMetalId, setSelectedMetalId] = useState<string>('cs');
  const [wavelengthNm, setWavelengthNm] = useState<number>(380); // 200nm to 800nm
  const [intensityPercent, setIntensityPercent] = useState<number>(70);
  const [appliedVoltage, setAppliedVoltage] = useState<number>(0); // -5V to +5V

  // --- Spectra State ---
  const [selectedSpectraId, setSelectedSpectraId] = useState<string>('h');

  // --- Prism Refraction State ---
  const [incidentAngleDeg, setIncidentAngleDeg] = useState<number>(45);
  const [prismMaterial, setPrismMaterial] = useState<'crown' | 'flint' | 'diamond'>('flint');

  // Physical Constants
  const PLANCK_H_EV_S = 4.135667696e-15; // eV·s
  const SPEED_OF_LIGHT = 2.99792458e8; // m/s
  const HC_EV_NM = 1239.84193; // hc in eV·nm

  // Calculations for Photoelectric effect
  const activeMetal = METALS.find(m => m.id === selectedMetalId) || METALS[0];
  const photonEnergyEV = Number((HC_EV_NM / wavelengthNm).toFixed(3));
  const workFunctionEV = activeMetal.workFunctionEV;
  const maxKineticEnergyEV = Math.max(0, Number((photonEnergyEV - workFunctionEV).toFixed(3)));
  const thresholdWavelengthNm = Math.round(HC_EV_NM / workFunctionEV);
  const thresholdFrequencyHz = (workFunctionEV / PLANCK_H_EV_S).toExponential(3);
  const isEmissionOccurring = photonEnergyEV >= workFunctionEV && intensityPercent > 0;
  const stoppingPotentialV = maxKineticEnergyEV;
  const isCurrentFlowing = isEmissionOccurring && (appliedVoltage > -stoppingPotentialV);

  // Helper to convert wavelength to approximate RGB hex
  const wavelengthToColor = (nm: number): string => {
    if (nm < 380) return '#a855f7'; // UV / Violet
    if (nm < 440) return '#6366f1';
    if (nm < 490) return '#06b6d4'; // Cyan
    if (nm < 560) return '#22c55e'; // Green
    if (nm < 590) return '#eab308'; // Yellow
    if (nm < 630) return '#f97316'; // Orange
    if (nm <= 750) return '#ef4444'; // Red
    return '#881337'; // Infrared
  };

  // Canvas animations for Photoelectric Vacuum Chamber
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const electronsRef = useRef<{ x: number; y: number; vx: number; vy: number; id: number }[]>([]);

  useEffect(() => {
    if (opticsMode !== 'photoelectric') return;

    let animId: number;

    const render = () => {
      const canvas = photoCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Vacuum Tube Enclosure (Glass capsule)
      ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(80, 50, width - 160, height - 100, 40);
      ctx.stroke();

      // Inside vacuum glow
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.4)' : 'rgba(241, 245, 249, 0.6)';
      ctx.fill();

      // Cathode Plate (Left) - Target Metal
      const cathodeX = 140;
      ctx.fillStyle = activeMetal.color;
      ctx.fillRect(cathodeX, 80, 24, height - 160);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(cathodeX, 80, 24, height - 160);

      // Anode Collector Plate (Right)
      const anodeX = width - 164;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(anodeX, 80, 24, height - 160);
      ctx.strokeRect(anodeX, 80, 24, height - 160);

      // Labels on plates
      ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('مهبط (-)', 'Cathode (-)'), cathodeX + 12, 70);
      ctx.fillText(t('مصعد (+)', 'Anode (+)'), anodeX + 12, 70);

      // Incoming Light Beam (from top-left onto Cathode)
      const beamColor = wavelengthToColor(wavelengthNm);
      ctx.save();
      ctx.strokeStyle = beamColor;
      ctx.lineWidth = 4 + (intensityPercent / 100) * 12;
      ctx.globalAlpha = 0.5 + (intensityPercent / 100) * 0.4;
      ctx.shadowColor = beamColor;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(30, 20);
      ctx.lineTo(cathodeX + 12, height / 2);
      ctx.stroke();
      ctx.restore();

      // Spawn ejected electrons if emission condition met
      if (isEmissionOccurring && Math.random() < (intensityPercent / 100) * 0.6) {
        // Initial electron speed depends on max kinetic energy
        const speed = Math.sqrt(maxKineticEnergyEV) * 3 + 1;
        electronsRef.current.push({
          x: cathodeX + 24,
          y: 90 + Math.random() * (height - 180),
          vx: speed,
          vy: (Math.random() - 0.5) * 1.2,
          id: Date.now() + Math.random()
        });
      }

      // Electric field deceleration / acceleration inside tube due to appliedVoltage
      const fieldAcc = (appliedVoltage * 0.2); // positive accelerates to anode, negative retards

      // Update and draw electrons
      const currentElectrons = electronsRef.current;
      for (let i = currentElectrons.length - 1; i >= 0; i--) {
        const el = currentElectrons[i];
        el.vx += fieldAcc * 0.05;
        el.x += el.vx;
        el.y += el.vy;

        // Draw electron
        ctx.beginPath();
        ctx.arc(el.x, el.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Remove if hit anode, returned to cathode, or went out of bounds
        if (el.x >= anodeX || el.x <= cathodeX || el.y < 60 || el.y > height - 60) {
          currentElectrons.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [opticsMode, wavelengthNm, intensityPercent, appliedVoltage, activeMetal, isEmissionOccurring, maxKineticEnergyEV, isDark]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Station Sub-Navigation */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-2 max-w-lg mx-auto ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => {
            setOpticsMode('photoelectric');
            playLabSound('click');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            opticsMode === 'photoelectric'
              ? 'bg-cyan-500 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{t('الظاهرة الكهروضوئية', 'Photoelectric Effect')}</span>
        </button>
        <button
          onClick={() => {
            setOpticsMode('spectra');
            playLabSound('click');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            opticsMode === 'spectra'
              ? 'bg-cyan-500 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Waves className="w-4 h-4" />
          <span>{t('طيف الانبعاث الذري', 'Atomic Emission Spectra')}</span>
        </button>
      </div>

      {/* 1. PHOTOELECTRIC EFFECT SIMULATOR */}
      {opticsMode === 'photoelectric' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Visualizer (Col 1-8) */}
          <div className={`lg:col-span-8 rounded-3xl border p-4 sm:p-6 flex flex-col gap-4 shadow-sm ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Sun className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white">
                    {t('محاكاة تجربة الظاهرة الكهروضوئية (Photoelectric Effect)', 'Photoelectric Effect Vacuum Chamber')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('سقوط الفوتونات وتحرير الإلكترونات عند تجاوز طاقة الفوتون لدالة الشغل (E = hf ≥ Φ)', 'Photon absorption and electron emission')}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                isEmissionOccurring
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {isEmissionOccurring ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>
                  {isEmissionOccurring
                    ? t('انبعاث كهروضوئي نشط!', 'Active Photoelectric Emission!')
                    : t('لا يوجد انبعاث (E < Φ)', 'No Emission (E < Φ)')}
                </span>
              </div>
            </div>

            {/* Canvas Vacuum Tube */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              <canvas
                ref={photoCanvasRef}
                width={800}
                height={460}
                className="w-full h-full block object-contain"
              />

              {/* Real-time Telemetry Overlay */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs backdrop-blur-md flex items-center gap-2">
                  <span className="text-slate-400">{t('طاقة الفوتون E:', 'Photon Energy:')}</span>
                  <span className="font-mono font-bold text-cyan-400 tabular-nums">{photonEnergyEV} eV</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs backdrop-blur-md flex items-center gap-2">
                  <span className="text-slate-400">{t('أقصى طاقة حركية K_max:', 'Max Kinetic Energy:')}</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">{maxKineticEnergyEV} eV</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs backdrop-blur-md flex items-center gap-2">
                  <span className="text-slate-400">{t('جهد الإيقاف V_0:', 'Stopping Voltage:')}</span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">{stoppingPotentialV} V</span>
                </div>
              </div>
            </div>

            {/* Explanatory Einstein Formula Strip */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-cyan-400">K_max = hf - Φ = {maxKineticEnergyEV} eV</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300">
                  {t(`طول موجة العتبة لمعدن ${isAr ? activeMetal.nameAr : activeMetal.nameEn}: ${thresholdWavelengthNm} nm`,
                     `Threshold Wavelength for ${activeMetal.nameEn}: ${thresholdWavelengthNm} nm`)}
                </span>
              </div>
            </div>
          </div>

          {/* Control Deck (Col 9-12) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Target Metal Selection */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-slate-200">
                {t('معدن المهبط ودالة الشغل (Work Function Φ):', 'Target Metal & Work Function (Φ):')}
              </span>
              <div className="flex flex-col gap-2">
                {METALS.map(metal => (
                  <button
                    key={metal.id}
                    onClick={() => {
                      setSelectedMetalId(metal.id);
                      playLabSound('click');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                      selectedMetalId === metal.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : isDark ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span>{isAr ? metal.nameAr : metal.nameEn}</span>
                    <span className="font-mono font-bold text-amber-400">Φ = {metal.workFunctionEV} eV</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wavelength Slider */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {t('طول موجة الضوء الساقط (λ):', 'Light Wavelength (λ):')}
                </span>
                <span className="font-mono font-bold text-sm tabular-nums" style={{ color: wavelengthToColor(wavelengthNm) }}>
                  {wavelengthNm} nm
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="800"
                step="5"
                value={wavelengthNm}
                onChange={(e) => setWavelengthNm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-purple-400">{t('فوق بنفسجي (200nm)', 'UV (200nm)')}</span>
                <span className="text-emerald-400">{t('مرئي (500nm)', 'Visible')}</span>
                <span className="text-rose-400">{t('تحت أحمر (800nm)', 'IR (800nm)')}</span>
              </div>
            </div>

            {/* Intensity & Voltage Controls */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {t('شدة الضوء (Intensity / Brightness):', 'Light Intensity:')}
                </span>
                <span className="font-mono font-bold text-xs text-amber-400">{intensityPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={intensityPercent}
                onChange={(e) => setIntensityPercent(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {t('جهد الأنبوب العكسي (Stopping Voltage V):', 'Applied Voltage:')}
                </span>
                <span className="font-mono font-bold text-xs text-cyan-400">{appliedVoltage.toFixed(1)} V</span>
              </div>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.2"
                value={appliedVoltage}
                onChange={(e) => setAppliedVoltage(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. ATOMIC EMISSION SPECTRA */}
      {opticsMode === 'spectra' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Spectra Viewer (Col 1-8) */}
          <div className={`lg:col-span-8 rounded-3xl border p-4 sm:p-6 flex flex-col gap-6 shadow-sm ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div>
              <h3 className="text-base font-bold text-slate-100 dark:text-white">
                {t('أطياف الانبعاث الخطي للغازات المستثارة', 'Atomic Line Emission Spectra')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('بصمة ذرية فريدة لكل عنصر ناتجة عن هبوط الإلكترونات بين مستويات الطاقة المكممة', 'Unique quantum fingerprint from electron energy level transitions')}
              </p>
            </div>

            {/* Spectrometer Dark Chamber */}
            {(() => {
              const element = SPECTRAL_ELEMENTS.find(e => e.id === selectedSpectraId) || SPECTRAL_ELEMENTS[0];
              return (
                <div className="flex flex-col gap-4">
                  {/* Gas Discharge Tube Graphic */}
                  <div className="relative w-full h-24 rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center overflow-hidden">
                    <div
                      className="w-3/4 h-6 rounded-full border border-white/20 shadow-2xl transition-all duration-500 flex items-center justify-center"
                      style={{ backgroundColor: element.glowColor, boxShadow: `0 0 25px ${element.glowColor}` }}
                    >
                      <span className="text-xs font-bold font-mono text-white/90 drop-shadow">
                        {isAr ? element.nameAr : element.nameEn}
                      </span>
                    </div>
                  </div>

                  {/* Spectral Scale (400nm to 750nm) */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-300">
                      {t('شريط مرسمة الطيف (Spectrograph):', 'Spectrograph Plate:')}
                    </span>
                    <div className="relative w-full h-20 rounded-2xl border border-slate-800 bg-black flex items-center overflow-hidden">
                      {/* Emission Lines */}
                      {element.lines.map((line, idx) => {
                        // Map 400nm (0%) to 750nm (100%)
                        const leftPercent = Math.max(0, Math.min(100, ((line.wavelengthNm - 390) / (720 - 390)) * 100));
                        return (
                          <div
                            key={idx}
                            className="absolute top-0 bottom-0 w-1 shadow-lg transition-all"
                            style={{
                              left: `${leftPercent}%`,
                              backgroundColor: line.color,
                              boxShadow: `0 0 12px ${line.color}`
                            }}
                          >
                            <span
                              className="absolute -top-1 -translate-x-1/2 text-[10px] font-mono font-bold px-1 rounded bg-slate-900 border border-slate-700 text-white whitespace-nowrap"
                            >
                              {line.wavelengthNm} nm
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>390 nm (Violet)</span>
                      <span>550 nm (Green)</span>
                      <span>720 nm (Red)</span>
                    </div>
                  </div>

                  {/* Lines Table */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {element.lines.map((l, i) => (
                      <div key={i} className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                          <span className="text-xs text-slate-300 font-medium">{l.label}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-cyan-400 tabular-nums">
                          {l.wavelengthNm} nm
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Select Element Deck (Col 9-12) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-slate-200">
                {t('أنبوب التفريغ الغازي (Gas Discharge):', 'Discharge Gas Element:')}
              </span>
              <div className="flex flex-col gap-2">
                {SPECTRAL_ELEMENTS.map(el => (
                  <button
                    key={el.id}
                    onClick={() => {
                      setSelectedSpectraId(el.id);
                      playLabSound('click');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                      selectedSpectraId === el.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : isDark ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span>{isAr ? el.nameAr : el.nameEn}</span>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: el.glowColor }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Quantum Physics Reference */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-2 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-slate-300">
                {t('معادلة ريدبرغ للهيدروجين (Rydberg Formula):', 'Rydberg Formula:')}
              </span>
              <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 font-mono text-center text-xs text-amber-300">
                1/λ = R_H · (1/n₁² - 1/n₂²)
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('ينبعث فوتون الضوء المرئي عند هبوط الإلكترون من المدارات العليا (n = 3, 4, 5, 6) إلى المدار الثاني (n = 2) مشكلاً خطوط بالمر الأربعة الشهيرة.',
                   'Visible photons are emitted when electrons cascade from n = 3, 4, 5, 6 down to n = 2, producing the four distinct Balmer lines.')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
