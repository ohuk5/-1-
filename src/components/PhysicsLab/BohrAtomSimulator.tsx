import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Sliders,
  Atom,
  Play,
  Pause
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playLabSound } from '../../utils/soundEffects';

export interface SpectralLine {
  id: string;
  series: 'lyman' | 'balmer' | 'paschen';
  ni: number;
  nf: number;
  nameAr: string;
  nameEn: string;
  wavelengthNm: number;
  color: string;
}

export const BOHR_SPECTRAL_LINES: SpectralLine[] = [
  // Balmer Series (Visible - سلسلة بالمر في الضوء المرئي)
  { id: 'balmer-3-2', series: 'balmer', ni: 3, nf: 2, nameAr: 'H-α أحمر (Balmer)', nameEn: 'H-alpha (656 nm)', wavelengthNm: 656.3, color: '#ef4444' },
  { id: 'balmer-4-2', series: 'balmer', ni: 4, nf: 2, nameAr: 'H-β سماوي (Balmer)', nameEn: 'H-beta (486 nm)', wavelengthNm: 486.1, color: '#06b6d4' },
  { id: 'balmer-5-2', series: 'balmer', ni: 5, nf: 2, nameAr: 'H-γ أزرق (Balmer)', nameEn: 'H-gamma (434 nm)', wavelengthNm: 434.0, color: '#3b82f6' },
  { id: 'balmer-6-2', series: 'balmer', ni: 6, nf: 2, nameAr: 'H-δ بنفسجي (Balmer)', nameEn: 'H-delta (410 nm)', wavelengthNm: 410.2, color: '#8b5cf6' },
  // Lyman Series (UV - سلسلة ليمان فوق البنفسجية)
  { id: 'lyman-2-1', series: 'lyman', ni: 2, nf: 1, nameAr: 'L-α فوق بنفسجي (Lyman)', nameEn: 'Lyman-alpha (121.6 nm)', wavelengthNm: 121.6, color: '#a855f7' },
  { id: 'lyman-3-1', series: 'lyman', ni: 3, nf: 1, nameAr: 'L-β فوق بنفسجي (Lyman)', nameEn: 'Lyman-beta (102.6 nm)', wavelengthNm: 102.6, color: '#c084fc' },
  // Paschen Series (IR - سلسلة باشن تحت الحمراء)
  { id: 'paschen-4-3', series: 'paschen', ni: 4, nf: 3, nameAr: 'P-α تحت حمراء (Paschen)', nameEn: 'Paschen-alpha (1875 nm)', wavelengthNm: 1875.0, color: '#dc2626' }
];

export const BohrAtomSimulator: React.FC = () => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [initialN, setInitialN] = useState<number>(3);
  const [finalN, setFinalN] = useState<number>(2);
  const [electronAngle, setElectronAngle] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [photonPacket, setPhotonPacket] = useState<{ x: number; y: number; progress: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Physics Calculations:
  // En = -13.6 / n^2 eV
  const eInitial = -13.6 / (initialN * initialN);
  const eFinal = -13.6 / (finalN * finalN);
  const deltaE = Math.abs(eInitial - eFinal); // in eV
  // lambda = hc / deltaE = 1239.84 / deltaE nm
  const wavelengthNm = deltaE > 0.001 ? 1239.84 / deltaE : 0;
  // frequency f = deltaE * 1.602e-19 / 6.626e-34 Hz
  const frequencyHz = deltaE * 2.418e14; // in Hz

  // Identify series
  const seriesLabel = finalN === 1
    ? t('سلسلة ليمان (Lyman Series - أشعة فوق بنفسجية UV)', 'Lyman Series (Ultraviolet UV)')
    : finalN === 2
    ? t('سلسلة بالمر (Balmer Series - الضوء المرئي Visible)', 'Balmer Series (Visible Light)')
    : t('سلسلة باشن (Paschen Series - أشعة تحت حمراء IR)', 'Paschen Series (Infrared IR)');

  // Photon color from wavelength
  const getPhotonColor = (nm: number): string => {
    if (nm < 380) return '#c084fc'; // UV
    if (nm < 420) return '#8b5cf6';
    if (nm < 480) return '#3b82f6';
    if (nm < 540) return '#06b6d4';
    if (nm < 580) return '#22c55e';
    if (nm < 610) return '#eab308';
    if (nm < 750) return '#ef4444';
    return '#dc2626'; // IR
  };

  const photonColor = getPhotonColor(wavelengthNm);

  // Animation Loop for Orbiting Electron
  useEffect(() => {
    let isMounted = true;
    let animId = 0;
    const animate = () => {
      if (!isMounted) return;
      setElectronAngle(prev => (prev + 0.03 / Math.sqrt(initialN)) % (Math.PI * 2));
      setPhotonPacket(prev => {
        if (!prev) return null;
        if (prev.progress >= 1.0) return null;
        return {
          ...prev,
          progress: prev.progress + 0.03,
          x: prev.x + 5,
          y: prev.y - 1
        };
      });
      animId = requestAnimationFrame(animate);
    };
    if (isAnimating) {
      animId = requestAnimationFrame(animate);
    }
    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
    };
  }, [isAnimating, initialN]);

  // Trigger Transition Animation
  const triggerTransition = (ni: number, nf: number) => {
    setInitialN(ni);
    setFinalN(nf);
    setPhotonPacket({ x: 220, y: 190, progress: 0.05 });
    playLabSound('spark');
  };

  // Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const atomCenterX = 220;
    const atomCenterY = 190;

    // Clear
    ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid
    ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.5)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // ==========================================
    // 1. LEFT HALF: BOHR ATOM ORBITS & NUCLEUS
    // ==========================================
    // Nucleus (Proton +e)
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(atomCenterX, atomCenterY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+p', atomCenterX, atomCenterY);
    ctx.restore();

    // Quantized Orbits n=1 to n=6
    const baseRadius = 26;
    for (let n = 1; n <= 6; n++) {
      // Scaled radius for clean visual spacing: r_n = baseRadius * sqrt(n) * 1.35
      const orbitR = baseRadius + (n - 1) * 28;
      const isInitial = n === initialN;
      const isFinal = n === finalN;

      ctx.save();
      ctx.strokeStyle = isInitial
        ? '#38bdf8'
        : isFinal
        ? '#10b981'
        : isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = isInitial || isFinal ? 2.5 : 1;
      ctx.setLineDash(isInitial || isFinal ? [] : [3, 4]);

      ctx.beginPath();
      ctx.arc(atomCenterX, atomCenterY, orbitR, 0, Math.PI * 2);
      ctx.stroke();

      // Orbit label
      ctx.fillStyle = isInitial ? '#38bdf8' : isFinal ? '#10b981' : isDark ? '#64748b' : '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`n=${n}`, atomCenterX + orbitR - 4, atomCenterY - 6);
      ctx.restore();
    }

    // Animated Orbiting Electron on initialN orbit
    const activeRadius = baseRadius + (initialN - 1) * 28;
    const electX = atomCenterX + Math.cos(electronAngle) * activeRadius;
    const electY = atomCenterY + Math.sin(electronAngle) * activeRadius;

    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(electX, electY, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('e⁻', electX, electY);
    ctx.restore();

    // Emitted Photon Wavepacket Animation
    if (photonPacket && initialN > finalN) {
      ctx.save();
      ctx.strokeStyle = photonColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = photonColor;
      ctx.shadowBlur = 15;

      // Draw sinusoidal wavepacket
      ctx.beginPath();
      for (let i = 0; i < 40; i++) {
        const px = photonPacket.x + i;
        const py = photonPacket.y + Math.sin(i * 0.5) * 6;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      ctx.fillStyle = photonColor;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`h·ν (λ = ${wavelengthNm.toFixed(1)} nm)`, photonPacket.x + 20, photonPacket.y - 12);
      ctx.restore();
    }

    // Atom Header
    ctx.save();
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('نموذج بور الذري لذرة الهيدروجين', 'Bohr Hydrogen Atom Model'), atomCenterX, 22);
    ctx.restore();

    // ==========================================
    // 2. RIGHT HALF: QUANTIZED ENERGY LEVEL LADDER
    // ==========================================
    const ladderLeftX = 470;
    const ladderRightX = 730;

    // Divider line between Atom and Ladder
    ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(430, 20);
    ctx.lineTo(430, height - 20);
    ctx.stroke();

    // Levels Y coordinates (E1 at bottom, E6 near top, E_inf at top)
    const levelYMap: Record<number, number> = {
      1: 340, // -13.6 eV
      2: 240, // -3.4 eV
      3: 180, // -1.51 eV
      4: 140, // -0.85 eV
      5: 110, // -0.54 eV
      6: 85,  // -0.38 eV
    };

    // Draw Ionization Level E_infinity = 0 eV
    const eInfY = 50;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ladderLeftX, eInfY);
    ctx.lineTo(ladderRightX, eInfY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(t('n = ∞ (E = 0 eV) طاقة التأين', 'n = ∞ (E = 0 eV) Ionization'), ladderLeftX, eInfY - 6);

    // Draw Levels n=1 to 6
    for (let n = 1; n <= 6; n++) {
      const ly = levelYMap[n];
      const en = (-13.6 / (n * n)).toFixed(2);
      const isSelectedInit = n === initialN;
      const isSelectedFinal = n === finalN;

      ctx.save();
      ctx.strokeStyle = isSelectedInit
        ? '#38bdf8'
        : isSelectedFinal
        ? '#10b981'
        : isDark ? '#475569' : '#94a3b8';
      ctx.lineWidth = isSelectedInit || isSelectedFinal ? 3 : 1.5;

      ctx.beginPath();
      ctx.moveTo(ladderLeftX, ly);
      ctx.lineTo(ladderRightX, ly);
      ctx.stroke();

      // Energy text
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = isSelectedInit ? '#38bdf8' : isSelectedFinal ? '#10b981' : isDark ? '#94a3b8' : '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText(`n = ${n}`, ladderLeftX + 5, ly - 4);
      ctx.textAlign = 'right';
      ctx.fillText(`E${n} = ${en} eV`, ladderRightX - 5, ly - 4);
      ctx.restore();
    }

    // Draw Transition Arrow between initialN and finalN
    if (initialN !== finalN) {
      const yInit = levelYMap[initialN];
      const yFin = levelYMap[finalN];
      const arrowX = 600;

      ctx.save();
      ctx.strokeStyle = photonColor;
      ctx.fillStyle = photonColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = photonColor;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(arrowX, yInit);
      ctx.lineTo(arrowX, yFin);
      ctx.stroke();

      // Arrow head pointing towards final level
      const headDir = yFin > yInit ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(arrowX, yFin);
      ctx.lineTo(arrowX - 6, yFin - 10 * headDir);
      ctx.lineTo(arrowX + 6, yFin - 10 * headDir);
      ctx.closePath();
      ctx.fill();

      // Delta E text
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`ΔE = ${deltaE.toFixed(2)} eV`, arrowX + 12, (yInit + yFin) / 2 + 4);
      ctx.restore();
    }
  }, [initialN, finalN, electronAngle, photonPacket, deltaE, wavelengthNm, photonColor, isDark, t]);

  return (
    <div className="w-full flex flex-col gap-5 animate-fadeIn">
      {/* Top Banner */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
            <Atom className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('محاكي نموذج بور الذري وتكميم الطاقة (فيزياء 3 ثانوي)', 'Bohr Hydrogen Atom & Quantization Simulator')}
              </h3>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${isDark ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
                En = -13.6 / n² eV | ΔE = h·f = hc / λ
              </span>
            </div>
            <p className={`text-xs max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('تكميم مستويات طاقة ذرة الهيدروجين، رصد قفزات الإلكترون، وانبعاث أطياف ليمان وبالمر وباشن.',
                 'Quantized Hydrogen energy levels, electron orbital jumps, and Lyman, Balmer, and Paschen emission series.')}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setIsAnimating(v => !v)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isDark ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isAnimating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAnimating ? t('إيقاف المدار', 'Pause Orbit') : t('تشغيل المدار', 'Resume Orbit')}</span>
          </button>
          <button
            onClick={() => triggerTransition(3, 2)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
          >
            <Play className="w-4 h-4" />
            <span>{t('إطلاق فوتون H-α (بالمر 656 nm)', 'Emit H-alpha photon')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Canvas Section */}
        <div className="lg:col-span-8 min-w-0 flex flex-col gap-3">
          <div className={`rounded-3xl border overflow-hidden relative shadow-md ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-3 border-b flex items-center justify-between gap-2 flex-wrap text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`font-bold flex items-center gap-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                <Sparkles className="w-4 h-4" />
                <span>{seriesLabel}</span>
              </span>
              <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                n₁ = {initialN} ➔ n₂ = {finalN}
              </span>
            </div>

            <canvas
              ref={canvasRef}
              width={780}
              height={380}
              className="w-full aspect-[780/380] h-auto max-h-[420px] block select-none"
            />
          </div>

          {/* Mathematical Results & Spectrum Attributes */}
          <div className={`p-4 rounded-3xl border grid grid-cols-2 sm:grid-cols-4 gap-3 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('فارق الطاقة المنبعثة ΔE:', 'Emitted Energy ΔE:')}</span>
              <span className="font-mono font-bold text-base text-amber-500">{deltaE.toFixed(3)} eV</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('الطول الموجي للفوتون λ:', 'Photon Wavelength λ:')}</span>
              <span className="font-mono font-bold text-sm" style={{ color: photonColor }}>
                {wavelengthNm.toFixed(1)} nm
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('تردد الفوتون المنبعث f:', 'Frequency f:')}</span>
              <span className="font-mono font-bold text-sm text-cyan-500">
                {(frequencyHz / 1e14).toFixed(2)} × 10¹⁴ Hz
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('السلسلة الطيفية المعتمدة:', 'Spectral Series:')}</span>
              <span className="font-bold text-xs text-purple-500 truncate">
                {finalN === 1 ? t('ليمان (UV)', 'Lyman (UV)') : finalN === 2 ? t('بالمر (مرئي)', 'Balmer (Visible)') : t('باشن (IR)', 'Paschen (IR)')}
              </span>
            </div>
          </div>
        </div>

        {/* Controls Deck */}
        <div className="lg:col-span-4 min-w-0 flex flex-col gap-4">
          <div className={`p-5 rounded-3xl border flex flex-col gap-4 shadow-sm ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h4 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
              <Sliders className="w-4 h-4" />
              <span>{t('إعدادات القفزات الكمومية ومستويات الطاقة', 'Quantum Jumps & Energy Levels')}</span>
            </h4>

            {/* Level Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'}`}>
                <span className={`text-xs font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>{t('المستوى الابتدائي n_initial:', 'Initial Level n_i:')}</span>
                <select
                  value={initialN}
                  onChange={e => triggerTransition(Number(e.target.value), finalN)}
                  className={`p-2 rounded-xl border text-xs font-bold font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-cyan-300' : 'bg-white border-cyan-200 text-cyan-800'}`}
                >
                  {[6, 5, 4, 3, 2].map(n => (
                    <option key={`init-${n}`} value={n}>
                      n = {n} ({(-13.6 / (n * n)).toFixed(2)} eV)
                    </option>
                  ))}
                </select>
              </div>

              <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className={`text-xs font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>{t('المستوى النهائي n_final:', 'Final Level n_f:')}</span>
                <select
                  value={finalN}
                  onChange={e => triggerTransition(initialN, Number(e.target.value))}
                  className={`p-2 rounded-xl border text-xs font-bold font-mono ${isDark ? 'bg-slate-900 border-slate-700 text-emerald-300' : 'bg-white border-emerald-200 text-emerald-800'}`}
                >
                  {[1, 2, 3, 4, 5].filter(n => n < initialN).map(n => (
                    <option key={`fin-${n}`} value={n}>
                      n = {n} ({(-13.6 / (n * n)).toFixed(2)} eV)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Standard Spectral Series Buttons */}
            <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('خطوط طيف الهيدروجين المعتمدة بكتاب الفيزياء 3:', 'Curriculum Hydrogen Spectral Lines:')}
              </span>
              <div className="flex flex-col gap-1.5">
                {BOHR_SPECTRAL_LINES.map(line => (
                  <button
                    key={line.id}
                    onClick={() => triggerTransition(line.ni, line.nf)}
                    className={`p-2 rounded-xl border text-xs text-start flex items-center justify-between transition-all ${
                      initialN === line.ni && finalN === line.nf
                        ? isDark ? 'bg-purple-600/30 border-purple-500 text-white font-bold' : 'bg-purple-50 border-purple-400 text-purple-950 font-bold'
                        : isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: line.color }} />
                      <span>{isAr ? line.nameAr : line.nameEn}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold" style={{ color: line.color }}>
                      {line.wavelengthNm} nm
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
