import React, { useState, useEffect, useRef } from 'react';
import {
  Waves,
  RotateCcw,
  Sliders,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playLabSound } from '../../utils/soundEffects';

export const YoungInterferenceSimulator: React.FC = () => {
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  const [deviceMode, setDeviceMode] = useState<'double_slit' | 'grating'>('double_slit');
  const [wavelengthNm, setWavelengthNm] = useState<number>(632.8); // He-Ne red laser default
  const [slitDistanceMm, setSlitDistanceMm] = useState<number>(0.15); // d in mm
  const [screenDistanceM, setScreenDistanceM] = useState<number>(1.2); // L in m
  const [gratingLinesPerMm, setGratingLinesPerMm] = useState<number>(300); // Lines/mm for grating
  const [showIntensityProfile, setShowIntensityProfile] = useState<boolean>(true);
  const [showWavefronts, setShowWavefronts] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Wavelength to RGB color
  const getLaserColor = (nm: number): string => {
    if (nm < 420) return '#a855f7';
    if (nm < 480) return '#3b82f6';
    if (nm < 540) return '#06b6d4';
    if (nm < 580) return '#22c55e';
    if (nm < 610) return '#eab308';
    if (nm < 650) return '#f97316';
    return '#ef4444';
  };

  const laserColor = getLaserColor(wavelengthNm);

  // Physics Calculations for Young's Double Slit:
  // lambda = (x * d) / L  =>  x (fringe separation Delta y) = (lambda * L) / d
  // lambda in meters:
  const lambdaM = wavelengthNm * 1e-9;
  // d in meters:
  const effectiveDM = deviceMode === 'double_slit' ? (slitDistanceMm * 1e-3) : (1e-3 / gratingLinesPerMm);
  // Fringe separation Delta y in meters and millimeters:
  const deltaYM = (lambdaM * screenDistanceM) / effectiveDM;
  const deltaYMm = deltaYM * 1e3; // mm on screen

  // Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Background
    ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid
    ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(226, 232, 240, 0.6)';
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

    // Geometry layout:
    // Left: Laser source at X = 70
    // Middle: Double Slit Barrier at X = 250
    // Right: Screen at X = 680
    const laserX = 70;
    const barrierX = 250;
    const screenX = 680;

    // 1. Laser Emitter
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.fillRect(laserX - 45, centerY - 25, 45, 50);
    ctx.strokeRect(laserX - 45, centerY - 25, 45, 50);

    // Laser Aperture
    ctx.fillStyle = laserColor;
    ctx.shadowColor = laserColor;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(laserX, centerY, 8, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Beam from laser to barrier
    ctx.strokeStyle = laserColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(laserX, centerY);
    ctx.lineTo(barrierX, centerY);
    ctx.stroke();
    ctx.restore();

    // 2. Double Slit / Grating Barrier
    ctx.save();
    ctx.fillStyle = isDark ? '#334155' : '#64748b';
    ctx.fillRect(barrierX - 4, 30, 8, height - 60);

    const slitGapPx = Math.max(14, slitDistanceMm * 120); // visual representation
    const s1Y = centerY - slitGapPx / 2;
    const s2Y = centerY + slitGapPx / 2;

    // Clear the two slits in the barrier
    ctx.clearRect(barrierX - 6, s1Y - 4, 12, 8);
    ctx.clearRect(barrierX - 6, s2Y - 4, 12, 8);

    // Slits labels
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('S₁', barrierX - 10, s1Y + 4);
    ctx.fillText('S₂', barrierX - 10, s2Y + 4);
    ctx.restore();

    // 3. Huygens Wavefronts spreading from S1 & S2
    if (showWavefronts) {
      ctx.save();
      ctx.strokeStyle = laserColor;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.28;

      const maxR = screenX - barrierX;
      const stepR = Math.max(14, (wavelengthNm / 500) * 16);

      for (let r = stepR; r < maxR; r += stepR) {
        // Wavefront from S1
        ctx.beginPath();
        ctx.arc(barrierX, s1Y, r, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();

        // Wavefront from S2
        ctx.beginPath();
        ctx.arc(barrierX, s2Y, r, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Central Optical Axis (dashed line to Screen)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(barrierX, centerY);
    ctx.lineTo(screenX, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Viewing Screen (اللوح / شاشة الرصد)
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(screenX, 20, 60, height - 40);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, 20, 60, height - 40);

    // Render Interference Pattern on the Screen
    // Delta y in pixels on canvas screen:
    // Scale factor to make millimeter variations clearly visible and educational
    const pxPerMm = 14;
    const deltaYPx = Math.max(8, deltaYMm * pxPerMm);

    // Draw bright and dark bands along the screen
    const maxFringes = Math.floor((height / 2 - 30) / deltaYPx);

    for (let m = -maxFringes; m <= maxFringes; m++) {
      const fringeY = centerY + m * deltaYPx;
      if (fringeY < 25 || fringeY > height - 25) continue;

      // Intensity drops with higher order m
      const orderFalloff = deviceMode === 'double_slit' ? Math.max(0.2, 1.0 - Math.abs(m) * 0.16) : Math.max(0.4, 1.0 - Math.abs(m) * 0.12);

      // Bright Fringe Glow
      const grad = ctx.createLinearGradient(screenX, fringeY - 6, screenX + 60, fringeY + 6);
      grad.addColorStop(0, laserColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

      ctx.fillStyle = grad;
      ctx.globalAlpha = orderFalloff;
      ctx.shadowColor = laserColor;
      ctx.shadowBlur = orderFalloff * 15;
      ctx.fillRect(screenX + 3, fringeY - 5, 54, 10);
      ctx.shadowBlur = 0;

      // Order label (m=0, m=±1, etc)
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(m === 0 ? t('m=0 (مركزية)', 'm=0 (Central)') : `m=${m > 0 ? `+${m}` : m}`, screenX + 65, fringeY + 3);
    }
    ctx.restore();

    // 6. Intensity Profile Waveform Curve (منحنى شدة الإضاءة)
    if (showIntensityProfile) {
      ctx.save();
      ctx.strokeStyle = laserColor;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const profileStartX = screenX - 110;
      const profileBaseX = screenX - 20;

      for (let y = 30; y < height - 30; y += 2) {
        const dyMm = (y - centerY) / pxPerMm;
        const phase = (Math.PI * effectiveDM * (dyMm * 1e-3)) / (lambdaM * screenDistanceM);
        const cosTerm = Math.cos(phase);
        const intensity = cosTerm * cosTerm;
        const curveX = profileBaseX - intensity * 70;

        if (y === 30) ctx.moveTo(curveX, y);
        else ctx.lineTo(curveX, y);
      }
      ctx.stroke();

      // Profile Header
      ctx.fillStyle = laserColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('منحنى شدة التداخل I(y)', 'Intensity Curve I(y)'), profileStartX + 35, 25);
      ctx.restore();
    }

    // 7. Dimension Arrows & Annotations
    ctx.save();
    ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';

    // Distance L Arrow between Barrier and Screen
    const midX = (barrierX + screenX) / 2;
    ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(barrierX, height - 25);
    ctx.lineTo(screenX, height - 25);
    ctx.stroke();
    ctx.fillText(t(`L = ${screenDistanceM.toFixed(2)} m (بعد الشاشة)`, `L = ${screenDistanceM.toFixed(2)} m (Screen Dist)`), midX, height - 10);

    // Slit distance d label
    ctx.fillText(`d = ${slitDistanceMm.toFixed(2)} mm`, barrierX, s2Y + 22);

    // Fringe spacing Delta y bracket
    const y0 = centerY;
    const y1 = centerY + deltaYPx;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX + 58, y0);
    ctx.lineTo(screenX + 63, y0);
    ctx.lineTo(screenX + 63, y1);
    ctx.lineTo(screenX + 58, y1);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'left';
    ctx.fillText(`Δy = ${deltaYMm.toFixed(2)} mm`, screenX + 115, (y0 + y1) / 2 + 3);
    ctx.restore();
  }, [deviceMode, wavelengthNm, slitDistanceMm, screenDistanceM, gratingLinesPerMm, showIntensityProfile, showWavefronts, laserColor, effectiveDM, lambdaM, deltaYMm, isDark, t]);

  return (
    <div className="w-full flex flex-col gap-5 animate-fadeIn">
      {/* Top Banner */}
      <div className={`p-4 sm:p-5 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
            <Waves className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('محاكي تجربة شقي يونغ ومحزوزات الحيود (فيزياء 3 ثانوي)', 'Young\'s Double-Slit & Diffraction Gratings Simulator')}
              </h3>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                λ = (x · d) / L | d · sin θ = m · λ
              </span>
            </div>
            <p className={`text-xs max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t('إثبات الطبيعة الموجية للضوء عبر التداخل البنّاء والهدام، وحساب الطول الموجي λ ومسافة الأهداب Δy.',
                 'Demonstrate wave nature of light with constructive/destructive interference, wavelength calculation, and fringe spacing.')}
            </p>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`p-1 rounded-2xl border flex items-center gap-1 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => {
                setDeviceMode('double_slit');
                playLabSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                deviceMode === 'double_slit'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('شقا يونغ (Double Slit)', 'Young\'s Double Slit')}
            </button>
            <button
              onClick={() => {
                setDeviceMode('grating');
                playLabSound('click');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                deviceMode === 'grating'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('محزوز الحيود (Grating)', 'Diffraction Grating')}
            </button>
          </div>

          <button
            onClick={() => {
              setWavelengthNm(632.8);
              setSlitDistanceMm(0.15);
              setScreenDistanceM(1.2);
              playLabSound('click');
            }}
            className={`p-2 rounded-xl border transition-all ${isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            title={t('إعادة ضبط', 'Reset')}
          >
            <RotateCcw className="w-4 h-4" />
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
              <span className={`font-bold flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
                <Sparkles className="w-4 h-4" />
                <span>{t('نمط التداخل والحيود والأهداب المضيئة والمعتمة على الشاشة', 'Interference & Diffraction Pattern on Screen')}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowWavefronts(!showWavefronts)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                    showWavefronts
                      ? isDark ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300' : 'bg-indigo-50 border-indigo-400 text-indigo-700'
                      : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {t('الموجات', 'Waves')}
                </button>
                <button
                  onClick={() => setShowIntensityProfile(!showIntensityProfile)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border transition-all ${
                    showIntensityProfile
                      ? isDark ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-cyan-50 border-cyan-400 text-cyan-700'
                      : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {t('منحنى الشدة I', 'Profile I')}
                </button>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={780}
              height={380}
              className="w-full aspect-[780/380] h-auto max-h-[420px] block select-none"
            />
          </div>

          {/* Mathematical Results & Formula Card */}
          <div className={`p-4 rounded-3xl border grid grid-cols-2 sm:grid-cols-4 gap-3 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('المسافة بين الأهداب Δy:', 'Fringe Spacing Δy:')}</span>
              <span className="font-mono font-bold text-base text-amber-500">{deltaYMm.toFixed(2)} mm</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('الطول الموجي للضوء λ:', 'Light Wavelength λ:')}</span>
              <span className="font-mono font-bold text-sm text-cyan-500">{wavelengthNm.toFixed(1)} nm</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('المسافة بين الشقين d:', 'Slit Separation d:')}</span>
              <span className="font-mono font-bold text-sm text-indigo-500">{slitDistanceMm.toFixed(3)} mm</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('بعد الشاشة عن الشقين L:', 'Screen Distance L:')}</span>
              <span className="font-mono font-bold text-sm text-emerald-500">{screenDistanceM.toFixed(2)} m</span>
            </div>
          </div>
        </div>

        {/* Controls Deck */}
        <div className="lg:col-span-4 min-w-0 flex flex-col gap-4">
          <div className={`p-5 rounded-3xl border flex flex-col gap-4 shadow-sm ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h4 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
              <Sliders className="w-4 h-4" />
              <span>{t('معاملات التداخل والليزر', 'Interference Parameters')}</span>
            </h4>

            {/* Wavelength Slider */}
            <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>{t('الطول الموجي للضوء λ:', 'Wavelength λ:')}</span>
                <span className="font-mono font-bold text-sm" style={{ color: laserColor }}>
                  {wavelengthNm.toFixed(1)} nm
                </span>
              </div>
              <input
                type="range"
                min="380"
                max="750"
                step="1"
                value={wavelengthNm}
                onChange={e => setWavelengthNm(Number(e.target.value))}
                className="w-full cursor-pointer h-1.5"
                style={{ accentColor: laserColor }}
              />
              {/* Presets */}
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                <button
                  onClick={() => setWavelengthNm(632.8)}
                  className={`p-1 rounded border font-bold ${isDark ? 'bg-red-950/40 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}
                >
                  633 nm
                </button>
                <button
                  onClick={() => setWavelengthNm(532.0)}
                  className={`p-1 rounded border font-bold ${isDark ? 'bg-green-950/40 border-green-500/30 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}
                >
                  532 nm
                </button>
                <button
                  onClick={() => setWavelengthNm(450.0)}
                  className={`p-1 rounded border font-bold ${isDark ? 'bg-blue-950/40 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'}`}
                >
                  450 nm
                </button>
                <button
                  onClick={() => setWavelengthNm(405.0)}
                  className={`p-1 rounded border font-bold ${isDark ? 'bg-purple-950/40 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'}`}
                >
                  405 nm
                </button>
              </div>
            </div>

            {/* Slit Distance d Slider */}
            <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-800'}`}>
                  {deviceMode === 'double_slit' ? t('المسافة بين الشقين d:', 'Slit Separation d:') : t('كثافة المحزوز (خط/mm):', 'Grating density:')}
                </span>
                <span className={`font-mono font-bold text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                  {deviceMode === 'double_slit' ? `${slitDistanceMm.toFixed(2)} mm` : `${gratingLinesPerMm} lines/mm`}
                </span>
              </div>
              {deviceMode === 'double_slit' ? (
                <input
                  type="range"
                  min="0.05"
                  max="0.40"
                  step="0.01"
                  value={slitDistanceMm}
                  onChange={e => setSlitDistanceMm(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer h-1.5"
                />
              ) : (
                <input
                  type="range"
                  min="100"
                  max="600"
                  step="50"
                  value={gratingLinesPerMm}
                  onChange={e => setGratingLinesPerMm(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer h-1.5"
                />
              )}
            </div>

            {/* Screen Distance L Slider */}
            <div className={`flex flex-col gap-1.5 p-3 rounded-2xl border ${isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>{t('بعد الشاشة عن الشقين L:', 'Screen Distance L:')}</span>
                <span className={`font-mono font-bold text-sm ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>{screenDistanceM.toFixed(2)} m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={screenDistanceM}
                onChange={e => setScreenDistanceM(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5"
              />
            </div>

            {/* Curriculum Textbook Cases */}
            <div className={`flex flex-col gap-1.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {t('مسائل كتاب الفيزياء 3-1 المعتمدة:', 'Textbook Practice Problems:')}
              </span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setWavelengthNm(632.8);
                    setSlitDistanceMm(0.12);
                    setScreenDistanceM(1.0);
                    playLabSound('click');
                  }}
                  className={`p-1.5 rounded-lg border text-[11px] text-start flex items-center justify-between transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <span>{t('مثال 1: ليزر هيليوم-نيون (λ=633 nm)', 'Ex 1: He-Ne laser')}</span>
                  <span className="font-mono text-cyan-500 font-bold">Δy = 5.27 mm</span>
                </button>

                <button
                  onClick={() => {
                    setWavelengthNm(532.0);
                    setSlitDistanceMm(0.18);
                    setScreenDistanceM(1.5);
                    playLabSound('click');
                  }}
                  className={`p-1.5 rounded-lg border text-[11px] text-start flex items-center justify-between transition-colors ${isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                >
                  <span>{t('مسألة 2: ليزر أخضر (λ=532 nm)', 'Prob 2: Green laser')}</span>
                  <span className="font-mono text-cyan-500 font-bold">Δy = 4.43 mm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
