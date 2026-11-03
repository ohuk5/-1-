import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Zap, Info, Move, Crosshair, Sparkles, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playLabSound } from '../../utils/soundEffects';

interface Charge {
  id: string;
  x: number;
  y: number;
  q: number; // in microCoulombs (µC), e.g. +1, -1, +5, -5
}

interface TestParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  q: number; // e.g. +1e-3
  trail: { x: number; y: number }[];
}

export const ElectrostaticsSim: React.FC = () => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [charges, setCharges] = useState<Charge[]>([
    { id: 'c1', x: 260, y: 230, q: 2 },
    { id: 'c2', x: 540, y: 230, q: -2 }
  ]);
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>('c1');
  const [draggingChargeId, setDraggingChargeId] = useState<string | null>(null);
  const [showFieldVectors, setShowFieldVectors] = useState<boolean>(true);
  const [showPotentialHeatmap, setShowPotentialHeatmap] = useState<boolean>(true);
  const [testParticle, setTestParticle] = useState<TestParticle | null>(null);
  const [isSimulatingParticle, setIsSimulatingParticle] = useState<boolean>(true);

  // Constants
  const K_COULOMB = 8.98755e9; // N·m²/C²
  const SCALE_PIXELS_TO_METERS = 0.005; // 1 pixel = 5 mm, so 200px = 1 meter

  // Preset Configurations
  const applyPreset = (preset: 'dipole' | 'repulsion' | 'quadrupole' | 'capacitor') => {
    playLabSound('click');
    setTestParticle(null);
    if (preset === 'dipole') {
      setCharges([
        { id: 'c1', x: 280, y: 230, q: 3 },
        { id: 'c2', x: 520, y: 230, q: -3 }
      ]);
    } else if (preset === 'repulsion') {
      setCharges([
        { id: 'c1', x: 280, y: 230, q: 3 },
        { id: 'c2', x: 520, y: 230, q: 3 }
      ]);
    } else if (preset === 'quadrupole') {
      setCharges([
        { id: 'c1', x: 300, y: 150, q: 3 },
        { id: 'c2', x: 500, y: 150, q: -3 },
        { id: 'c3', x: 300, y: 310, q: -3 },
        { id: 'c4', x: 500, y: 310, q: 3 }
      ]);
    } else if (preset === 'capacitor') {
      // Parallel plates
      const newCharges: Charge[] = [];
      for (let y = 130; y <= 330; y += 40) {
        newCharges.push({ id: `pos_${y}`, x: 300, y, q: 1 });
        newCharges.push({ id: `neg_${y}`, x: 500, y, q: -1 });
      }
      setCharges(newCharges);
    }
    setSelectedChargeId(null);
  };

  // Add new charge
  const addCharge = (qVal: number) => {
    playLabSound('click');
    const newId = `c_${Date.now()}`;
    const newCharge: Charge = {
      id: newId,
      x: 350 + (Math.random() - 0.5) * 100,
      y: 200 + (Math.random() - 0.5) * 100,
      q: qVal
    };
    setCharges(prev => [...prev, newCharge]);
    setSelectedChargeId(newId);
  };

  // Remove selected charge
  const removeSelectedCharge = () => {
    if (!selectedChargeId) return;
    playLabSound('click');
    setCharges(prev => prev.filter(c => c.id !== selectedChargeId));
    setSelectedChargeId(null);
  };

  // Release test particle at random or specific position
  const spawnTestParticle = (qSign: number = 1) => {
    playLabSound('success');
    setTestParticle({
      x: 400 + (Math.random() - 0.5) * 40,
      y: 230 + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      q: qSign * 0.1,
      trail: []
    });
  };

  // Mouse / Touch handlers for dragging charges
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if clicked on a charge (hit radius ~22px)
    const clicked = charges.find(c => Math.hypot(c.x - clickX, c.y - clickY) < 22);
    if (clicked) {
      setDraggingChargeId(clicked.id);
      setSelectedChargeId(clicked.id);
      playLabSound('click');
    } else {
      setSelectedChargeId(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingChargeId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const curX = Math.max(20, Math.min(canvas.width - 20, (e.clientX - rect.left) * scaleX));
    const curY = Math.max(20, Math.min(canvas.height - 20, (e.clientY - rect.top) * scaleY));

    setCharges(prev =>
      prev.map(c => (c.id === draggingChargeId ? { ...c, x: curX, y: curY } : c))
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggingChargeId(null);
  };

  // 60FPS Render Loop
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Equipotential Heatmap / Glow if enabled
      if (showPotentialHeatmap && charges.length > 0) {
        // Coarse grid for performance
        const step = 20;
        for (let x = step / 2; x < width; x += step) {
          for (let y = step / 2; y < height; y += step) {
            let potential = 0;
            for (const c of charges) {
              const r = Math.hypot(x - c.x, y - c.y) * SCALE_PIXELS_TO_METERS;
              if (r > 0.05) {
                potential += (K_COULOMB * (c.q * 1e-6)) / r;
              }
            }

            // Map potential to color
            if (Math.abs(potential) > 500) {
              const alpha = Math.min(0.2, Math.abs(potential) / 30000);
              ctx.fillStyle = potential > 0
                ? `rgba(239, 68, 68, ${alpha})` // Red for positive
                : `rgba(59, 130, 246, ${alpha})`; // Blue for negative
              ctx.fillRect(x - step / 2, y - step / 2, step, step);
            }
          }
        }
      }

      // 2. Draw Electric Field Vectors (E)
      if (showFieldVectors && charges.length > 0) {
        const gridSpacing = 36;
        for (let x = gridSpacing / 2; x < width; x += gridSpacing) {
          for (let y = gridSpacing / 2; y < height; y += gridSpacing) {
            let Ex = 0;
            let Ey = 0;

            for (const c of charges) {
              const dx = x - c.x;
              const dy = y - c.y;
              const distPixels = Math.hypot(dx, dy);
              if (distPixels < 15) continue; // inside charge radius

              const distMeters = distPixels * SCALE_PIXELS_TO_METERS;
              const E_mag = (K_COULOMB * Math.abs(c.q * 1e-6)) / (distMeters * distMeters);
              const sign = c.q > 0 ? 1 : -1;
              Ex += sign * E_mag * (dx / distPixels);
              Ey += sign * E_mag * (dy / distPixels);
            }

            const totalE = Math.hypot(Ex, Ey);
            if (totalE > 10) {
              const angle = Math.atan2(Ey, Ex);
              const arrowLen = Math.min(16, Math.max(6, Math.log10(totalE) * 3));

              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(angle);

              // Color intensity by field strength
              const intensity = Math.min(1, Math.log10(totalE) / 7);
              ctx.strokeStyle = isDark
                ? `rgba(56, 189, 248, ${0.25 + intensity * 0.65})`
                : `rgba(2, 132, 199, ${0.25 + intensity * 0.65})`;
              ctx.fillStyle = ctx.strokeStyle;
              ctx.lineWidth = 1.2;

              // Arrow stem
              ctx.beginPath();
              ctx.moveTo(-arrowLen / 2, 0);
              ctx.lineTo(arrowLen / 2, 0);
              ctx.stroke();

              // Arrow head
              ctx.beginPath();
              ctx.moveTo(arrowLen / 2, 0);
              ctx.lineTo(arrowLen / 2 - 4, -2.5);
              ctx.lineTo(arrowLen / 2 - 4, 2.5);
              ctx.closePath();
              ctx.fill();

              ctx.restore();
            }
          }
        }
      }

      // 3. Draw Coulomb Force Interaction line if 2 charges exist
      if (charges.length >= 2) {
        const c1 = charges[0];
        const c2 = charges[1];
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = isDark ? 'rgba(244, 63, 94, 0.4)' : 'rgba(225, 29, 72, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Update & Render Test Particle (if active)
      if (testParticle && isSimulatingParticle) {
        let fx = 0;
        let fy = 0;

        for (const c of charges) {
          const dx = testParticle.x - c.x;
          const dy = testParticle.y - c.y;
          const distPx = Math.hypot(dx, dy);
          if (distPx < 18) continue; // Collided or absorbed

          const distM = distPx * SCALE_PIXELS_TO_METERS;
          const fMag = (K_COULOMB * Math.abs(c.q * 1e-6) * Math.abs(testParticle.q * 1e-6)) / (distM * distM);
          const isAttract = (c.q * testParticle.q) < 0;
          const sign = isAttract ? -1 : 1;

          fx += sign * fMag * (dx / distPx);
          fy += sign * fMag * (dy / distPx);
        }

        // F = m*a (assume particle mass m = 0.05)
        const ax = fx / 0.05;
        const ay = fy / 0.05;

        testParticle.vx = (testParticle.vx + ax * 0.016) * 0.98; // slight drag
        testParticle.vy = (testParticle.vy + ay * 0.016) * 0.98;

        testParticle.x += testParticle.vx;
        testParticle.y += testParticle.vy;

        // Add to trail
        testParticle.trail.push({ x: testParticle.x, y: testParticle.y });
        if (testParticle.trail.length > 50) testParticle.trail.shift();

        // Draw Trail
        ctx.strokeStyle = testParticle.q > 0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < testParticle.trail.length; i++) {
          const pt = testParticle.trail[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Draw particle head
        ctx.beginPath();
        ctx.arc(testParticle.x, testParticle.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = testParticle.q > 0 ? '#ef4444' : '#3b82f6';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 5. Draw Charges
      for (const c of charges) {
        const isPos = c.q > 0;
        const radius = 16 + Math.min(8, Math.abs(c.q) * 2);
        const isSelected = c.id === selectedChargeId;

        // Selection ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Charge body with radial gradient
        const grad = ctx.createRadialGradient(c.x - 4, c.y - 4, 2, c.x, c.y, radius);
        if (isPos) {
          grad.addColorStop(0, '#fca5a5');
          grad.addColorStop(0.6, '#ef4444');
          grad.addColorStop(1, '#991b1b');
        } else {
          grad.addColorStop(0, '#93c5fd');
          grad.addColorStop(0.6, '#3b82f6');
          grad.addColorStop(1, '#1e3a8a');
        }

        ctx.beginPath();
        ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = isPos ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sign & value label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${c.q > 0 ? '+' : ''}${c.q}µC`, c.x, c.y);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [charges, selectedChargeId, showFieldVectors, showPotentialHeatmap, testParticle, isSimulatingParticle, isDark]);

  // Selected charge data
  const selectedCharge = charges.find(c => c.id === selectedChargeId);

  // Coulomb force between first 2 charges
  let pairDistanceM = 0;
  let pairForceN = 0;
  let isAttractive = false;
  if (charges.length >= 2) {
    const c1 = charges[0];
    const c2 = charges[1];
    const distPx = Math.hypot(c1.x - c2.x, c1.y - c2.y);
    pairDistanceM = Number((distPx * SCALE_PIXELS_TO_METERS).toFixed(2));
    if (pairDistanceM > 0) {
      pairForceN = (K_COULOMB * Math.abs(c1.q * 1e-6) * Math.abs(c2.q * 1e-6)) / (pairDistanceM * pairDistanceM);
    }
    isAttractive = (c1.q * c2.q) < 0;
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Canvas Visualizer (Col 1-8) */}
        <div className={`lg:col-span-8 rounded-3xl border p-4 sm:p-6 flex flex-col gap-4 shadow-sm ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Zap className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-100 dark:text-white">
                  {t('المجال الكهروستاتيكي وقانون كولوم', 'Electrostatic Fields & Coulomb\'s Law')}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('اسحب الشحنات في الفضاء لمشاهدة خطوط المجال وحساب قوى التجاذب والتنافر اللحظية', 'Drag charges to observe electric field vectors and Coulomb forces')}
                </p>
              </div>
            </div>

            {/* Presets and Tools */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => applyPreset('dipole')}
                className={`py-1.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {t('ثنائي قطب (+ -)', 'Dipole (+ -)')}
              </button>
              <button
                onClick={() => applyPreset('repulsion')}
                className={`py-1.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {t('تنافر (+ +)', 'Repulsion (+ +)')}
              </button>
              <button
                onClick={() => applyPreset('capacitor')}
                className={`py-1.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {t('لوحا مكثف', 'Capacitor')}
              </button>
            </div>
          </div>

          {/* Canvas Workspace */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center cursor-crosshair select-none">
            <canvas
              ref={canvasRef}
              width={800}
              height={460}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              className="w-full h-full block object-contain"
            />

            {/* Overlays / Toggles */}
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => setShowFieldVectors(!showFieldVectors)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all ${
                  showFieldVectors
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700'
                }`}
              >
                {t('متجهات المجال (E)', 'Field Vectors')}
              </button>
              <button
                onClick={() => setShowPotentialHeatmap(!showPotentialHeatmap)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all ${
                  showPotentialHeatmap
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700'
                }`}
              >
                {t('الجهد الكهربائي (V)', 'Potential (V)')}
              </button>
            </div>

            {/* Bottom HUD: Live Coulomb Force */}
            {charges.length >= 2 && (
              <div className="absolute bottom-3 left-3 px-3 py-2 rounded-2xl bg-slate-900/90 border border-slate-700 text-xs backdrop-blur-md flex items-center gap-3">
                <span className="text-slate-400">{t('المسافة r:', 'Distance r:')}</span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">{pairDistanceM} m</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">{t('قوة كولوم F:', 'Coulomb Force F:')}</span>
                <span className={`font-mono font-bold tabular-nums ${isAttractive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {pairForceN >= 1000 ? `${(pairForceN / 1000).toFixed(2)} kN` : `${pairForceN.toFixed(2)} N`}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  isAttractive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {isAttractive ? t('تجاذب', 'Attractive') : t('تنافر', 'Repulsive')}
                </span>
              </div>
            )}
          </div>

          {/* Test Particle Controls Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-cyan-400" />
              {t('إطلاق شحنة اختبارية لمشاهدة مسار التسارع في المجال:', 'Launch a test particle into the field:')}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => spawnTestParticle(1)}
                className="py-1.5 px-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-all font-medium"
              >
                {t('+ إطلاق شحنة موجبة (+q)', '+ Launch Positive')}
              </button>
              <button
                onClick={() => spawnTestParticle(-1)}
                className="py-1.5 px-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 transition-all font-medium"
              >
                {t('- إطلاق إلكترون سالب (-e)', '- Launch Electron')}
              </button>
              {testParticle && (
                <button
                  onClick={() => setTestParticle(null)}
                  className="py-1.5 px-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 transition-all"
                >
                  {t('مسح', 'Clear')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Electrostatics Control Deck (Col 9-12) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Add Charges Deck */}
          <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <span className="text-xs font-bold text-slate-200">
              {t('إضافة شحنات نقطية إلى الفضاء:', 'Add Point Charges to Workspace:')}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addCharge(2)}
                className="py-2.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-rose-400" />
                <span>+2 µC</span>
              </button>
              <button
                onClick={() => addCharge(-2)}
                className="py-2.5 px-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Minus className="w-4 h-4 text-blue-400" />
                <span>-2 µC</span>
              </button>
              <button
                onClick={() => addCharge(5)}
                className="py-2.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-rose-400" />
                <span>+5 µC</span>
              </button>
              <button
                onClick={() => addCharge(-5)}
                className="py-2.5 px-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Minus className="w-4 h-4 text-blue-400" />
                <span>-5 µC</span>
              </button>
            </div>
          </div>

          {/* Selected Charge Properties */}
          {selectedCharge ? (
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {t('الشحنة المحددة (Selected Charge):', 'Selected Charge:')}
                </span>
                <button
                  onClick={removeSelectedCharge}
                  className="p-1.5 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                  title={t('حذف الشحنة', 'Delete Charge')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{t('المقدار (q):', 'Magnitude (q):')}</span>
                <span className="font-mono font-bold text-sm text-cyan-400 tabular-nums">
                  {selectedCharge.q > 0 ? `+${selectedCharge.q}` : selectedCharge.q} µC
                </span>
              </div>

              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={selectedCharge.q}
                onChange={(e) => {
                  const val = Number(e.target.value) || 1;
                  setCharges(prev => prev.map(c => c.id === selectedCharge.id ? { ...c, q: val } : c));
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>{t('شحنة سالبة (-10µC)', 'Negative (-10µC)')}</span>
                <span>{t('شحنة موجبة (+10µC)', 'Positive (+10µC)')}</span>
              </div>
            </div>
          ) : (
            <div className={`p-5 rounded-3xl border text-center text-xs text-slate-400 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <Info className="w-5 h-5 mx-auto mb-2 text-slate-500" />
              <span>{t('انقر على أي شحنة لتعديل قيمتها أو حذفها أو اسحبها لتحريكها.', 'Click any charge to modify value or drag to move.')}</span>
            </div>
          )}

          {/* Coulomb Formula Reference Box */}
          <div className={`p-5 rounded-3xl border flex flex-col gap-2 shadow-sm ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <span className="text-xs font-bold text-slate-300">
              {t('قانون كولوم الرياضي (Coulomb\'s Law):', 'Coulomb\'s Law Equation:')}
            </span>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 font-mono text-center text-xs text-cyan-300">
              F = k_e · (|q₁ · q₂|) / r²
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t('ثابت كولوم k_e = 8.99 × 10⁹ N·m²/C². الشحنات المتشابهة تتنافر والشحنات المختلفة تتجاذب طردياً مع حاصل ضرب الشحنتين وعكسياً مع مربع المسافة بينهما.',
                 'Coulomb constant k_e = 8.99 × 10⁹ N·m²/C². Like charges repel and unlike charges attract inversely proportional to r².')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
