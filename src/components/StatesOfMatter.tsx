import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flame,
  Snowflake,
  Gauge,
  Maximize2,
  Minimize2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { SUBSTANCES, calculatePhase, MatterPhase, SubstanceInfo } from '../data/substancesData';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetX: number;
  targetY: number;
  angle: number;
  vRot: number;
}

export const StatesOfMatter: React.FC = () => {
  const [substanceId, setSubstanceId] = useState<string>('water');
  const [targetTemp, setTargetTemp] = useState<number>(300); // 300K default (liquid for water)
  const [actualTemp, setActualTemp] = useState<number>(300);
  const [volumeLidPercent, setVolumeLidPercent] = useState<number>(80); // 30-100%
  const [gravityEnabled, setGravityEnabled] = useState<boolean>(true);
  const [pressureAtm, setPressureAtm] = useState<number>(1.02);
  const [burnerActive, setBurnerActive] = useState<'heat' | 'cool' | null>(null);

  // Transition announcement banner state
  const [lastAnnouncedPhase, setLastAnnouncedPhase] = useState<string>('liquid');
  const [transitionNotification, setTransitionNotification] = useState<{
    title: string;
    description: string;
    type: 'melting' | 'boiling' | 'condensation' | 'freezing';
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const momentumExchangeRef = useRef<number>(0);
  const rollingPressureRef = useRef<number[]>([]);
  const burnerIntervalRef = useRef<number | null>(null);
  const prevPhaseRef = useRef<string>('liquid');

  const substance: SubstanceInfo = SUBSTANCES[substanceId] || SUBSTANCES['water'];
  const phaseInfo = calculatePhase(actualTemp, substance);

  // Detect and announce phase changes whenever phaseInfo.phase changes
  useEffect(() => {
    const currentPhase = phaseInfo.phase;
    const prevPhase = prevPhaseRef.current;

    if (prevPhase !== currentPhase) {
      prevPhaseRef.current = currentPhase;
      setLastAnnouncedPhase(currentPhase);

      // Check transition type
      if (
        (prevPhase === 'solid' && (currentPhase === 'melting' || currentPhase === 'liquid')) ||
        (prevPhase === 'melting' && currentPhase === 'liquid')
      ) {
        setTransitionNotification({
          title: '🔥 حدوث الانصهار (Melting)!',
          description: `تجاوزت درجة الحرارة نقطة انصهار ${substance.name} (${substance.meltingPointK} K). تكسرت الروابط الصلبة وتحولت المادة إلى الحالة السائلة المائعة.`,
          type: 'melting'
        });
      } else if (
        (prevPhase === 'liquid' && (currentPhase === 'boiling' || currentPhase === 'gas')) ||
        (prevPhase === 'boiling' && currentPhase === 'gas')
      ) {
        setTransitionNotification({
          title: '💨 حدوث التبخر والغليان (Boiling / Vaporization)!',
          description: `تجاوزت درجة الحرارة نقطة غليان ${substance.name} (${substance.boilingPointK} K). تغلبت الطاقة الحركية للجزيئات على قوى التجاذب البيني، وتوسعت المادة لتملأ الوعاء كغاز حر.`,
          type: 'boiling'
        });
      } else if (
        (prevPhase === 'gas' && (currentPhase === 'boiling' || currentPhase === 'liquid')) ||
        (prevPhase === 'boiling' && currentPhase === 'liquid')
      ) {
        setTransitionNotification({
          title: '💧 حدوث التكاثف (Condensation)!',
          description: `انخفضت الحرارة دون نقطة الغليان (${substance.boilingPointK} K). فقدت جزيئات الغاز طاقتها الحركية وتقاربت لتشكل قطرات سائلة مائعة.`,
          type: 'condensation'
        });
      } else if (
        (prevPhase === 'liquid' && (currentPhase === 'melting' || currentPhase === 'solid')) ||
        (prevPhase === 'melting' && currentPhase === 'solid')
      ) {
        setTransitionNotification({
          title: '❄️ حدوث التجمد والتصلب (Freezing / Solidification)!',
          description: `انخفضت الحرارة دون نقطة الانصهار (${substance.meltingPointK} K). ترابطت الجزيئات مجدداً في شبكة بلورية صلبة ثابتة لا تتدفق.`,
          type: 'freezing'
        });
      }

      // Auto-hide notification banner after 6 seconds
      const timer = setTimeout(() => {
        setTransitionNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [phaseInfo.phase, substance]);

  // Initialize particles when substance or container reset
  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;
    const rows = 6;
    const cols = 8;
    const totalP = rows * cols; // 48 particles

    const left = 25;
    const right = w - 25;
    const bottom = h - 20;

    let pRadius = 7.5;
    if (substance.id === 'argon') pRadius = 10;

    const currentP = phaseInfo.phase;
    const particles: Particle[] = [];

    for (let i = 0; i < totalP; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      let px: number;
      let py: number;

      if (currentP === 'solid') {
        px = w / 2 - (cols * 22) / 2 + col * 22 + 11;
        py = bottom - rows * 22 + row * 22 + 11;
      } else if (currentP === 'liquid' || currentP === 'melting') {
        px = w / 2 - (cols * 24) / 2 + col * 24 + (Math.random() - 0.5) * 6;
        py = bottom - rows * 20 + row * 20 + (Math.random() - 0.5) * 6;
      } else {
        // Gas
        const maxLidY = h - (volumeLidPercent / 100) * (h - 70);
        px = left + pRadius + Math.random() * (right - left - pRadius * 2);
        py = maxLidY + pRadius + Math.random() * (bottom - maxLidY - pRadius * 2);
      }

      particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * (targetTemp * 0.04),
        vy: (Math.random() - 0.5) * (targetTemp * 0.04),
        radius: pRadius,
        targetX: w / 2 - (cols * 22) / 2 + col * 22 + 11,
        targetY: bottom - rows * 22 + row * 22 + 11,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.08
      });
    }

    particlesRef.current = particles;
  }, [substance, targetTemp, phaseInfo.phase, volumeLidPercent]);

  // Re-init particles on substance switch
  useEffect(() => {
    setTargetTemp(substance.defaultTempK);
    setActualTemp(substance.defaultTempK);
    initParticles();
  }, [substanceId]);

  // Burner continuous heating/cooling interval
  const startBurner = (type: 'heat' | 'cool') => {
    setBurnerActive(type);
    if (burnerIntervalRef.current) clearInterval(burnerIntervalRef.current);

    burnerIntervalRef.current = window.setInterval(() => {
      setTargetTemp(prev => {
        if (type === 'heat') {
          return Math.min(800, prev + 8);
        } else {
          return Math.max(5, prev - 8);
        }
      });
    }, 40);
  };

  const stopBurner = () => {
    if (burnerIntervalRef.current) {
      clearInterval(burnerIntervalRef.current);
      burnerIntervalRef.current = null;
    }
    setBurnerActive(null);
  };

  // Main Physics Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (particlesRef.current.length === 0) {
      initParticles();
    }

    let isRunning = true;
    let animId: number;

    const render = () => {
      if (!isRunning) return;

      const w = canvas.width;
      const h = canvas.height;
      const leftWall = 22;
      const rightWall = w - 22;
      const bottomWall = h - 20;

      // Lid Y based on volume slider
      const lidY = 45 + ((100 - volumeLidPercent) * (h - 110)) / 100;

      ctx.clearRect(0, 0, w, h);

      // Background container vessel
      ctx.fillStyle = 'rgba(11, 16, 28, 0.95)';
      ctx.fillRect(leftWall, lidY, rightWall - leftWall, bottomWall - lidY);

      // Thermal heat / ice background glow
      if (burnerActive === 'heat') {
        const heatGrad = ctx.createLinearGradient(0, bottomWall, 0, bottomWall - 60);
        heatGrad.addColorStop(0, 'rgba(234, 88, 12, 0.35)');
        heatGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = heatGrad;
        ctx.fillRect(leftWall, bottomWall - 60, rightWall - leftWall, 60);
      } else if (burnerActive === 'cool') {
        const coolGrad = ctx.createLinearGradient(0, bottomWall, 0, bottomWall - 60);
        coolGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        coolGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = coolGrad;
        ctx.fillRect(leftWall, bottomWall - 60, rightWall - leftWall, 60);
      }

      // Container border walls
      ctx.beginPath();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.moveTo(leftWall, lidY);
      ctx.lineTo(leftWall, bottomWall);
      ctx.lineTo(rightWall, bottomWall);
      ctx.lineTo(rightWall, lidY);
      ctx.stroke();

      // Movable Piston / Lid
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(leftWall - 4, lidY - 14, rightWall - leftWall + 8, 14);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.strokeRect(leftWall - 4, lidY - 14, rightWall - leftWall + 8, 14);

      // Piston rod
      ctx.fillStyle = '#475569';
      ctx.fillRect(w / 2 - 12, 10, 24, lidY - 24);

      // Kinetic Temperature scaling
      const particles = particlesRef.current;
      const n = particles.length;

      let totalKE = 0;
      particles.forEach(p => {
        totalKE += 0.5 * (p.vx * p.vx + p.vy * p.vy);
      });
      const avgKE = n > 0 ? totalKE / n : 0.001;
      const desiredKE = targetTemp * 0.055;

      const scale = Math.sqrt(desiredKE / (avgKE + 0.001));
      const velocityScale = Math.max(0.65, Math.min(1.35, scale));

      // Gradual convergence of actualTemp towards targetTemp
      setActualTemp(prev => {
        const diff = targetTemp - prev;
        if (Math.abs(diff) < 0.5) return targetTemp;
        return prev + diff * 0.08;
      });

      // Particle physics update
      const currentP = phaseInfo.phase;

      particles.forEach(p => {
        // Temperature velocity regulation
        if (targetTemp > 0) {
          p.vx *= 1 + (velocityScale - 1) * 0.12;
          p.vy *= 1 + (velocityScale - 1) * 0.12;
        }

        if (currentP === 'solid') {
          // Spring pull to anchor point in lattice
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          p.vx += dx * 0.08;
          p.vy += dy * 0.08;

          // Thermal vibration jitter
          const noise = Math.sqrt(actualTemp) * 0.12;
          p.vx += (Math.random() - 0.5) * noise;
          p.vy += (Math.random() - 0.5) * noise;

          p.vx *= 0.72;
          p.vy *= 0.72;
        } else if (currentP === 'melting') {
          // Lattice begins to destabilize
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          p.vx += dx * 0.03;
          p.vy += dy * 0.03;

          if (gravityEnabled) p.vy += 0.06;
          p.vx *= 0.88;
          p.vy *= 0.88;
        } else if (currentP === 'liquid') {
          // Flow and sliding at bottom with gravity
          if (gravityEnabled) p.vy += 0.09;

          // Cohesion attraction to keep fluid together
          particles.forEach(other => {
            if (other === p) return;
            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0 && dist < 42) {
              p.vx += (dx / dist) * 0.032;
              p.vy += (dy / dist) * 0.032;
            }
          });

          p.vx *= 0.98;
          p.vy *= 0.98;
        } else if (currentP === 'boiling') {
          // Boiling bubbles & expansion
          if (gravityEnabled) p.vy += 0.03;
          p.vy -= 0.08; // upward thermal buoyancy
        } else {
          // Gas: free random motion
          if (gravityEnabled) p.vy += 0.01;
        }

        p.angle += p.vRot;
        p.x += p.vx;
        p.y += p.vy;

        // Wall collisions and momentum transfer for pressure
        const r = p.radius;
        const bounce = currentP === 'gas' ? 1.0 : 0.45;

        // Left
        if (p.x < leftWall + r) {
          p.x = leftWall + r;
          momentumExchangeRef.current += Math.abs(p.vx * 2);
          p.vx = -p.vx * bounce;
        }
        // Right
        if (p.x > rightWall - r) {
          p.x = rightWall - r;
          momentumExchangeRef.current += Math.abs(p.vx * 2);
          p.vx = -p.vx * bounce;
        }
        // Bottom
        if (p.y > bottomWall - r) {
          p.y = bottomWall - r;
          momentumExchangeRef.current += Math.abs(p.vy * 2);
          p.vy = -p.vy * bounce;
        }
        // Top Lid
        if (p.y < lidY + r) {
          p.y = lidY + r;
          momentumExchangeRef.current += Math.abs(p.vy * 2);
          p.vy = -p.vy * bounce;
        }
      });

      // Elastic circle-to-circle collisions
      for (let i = 0; i < n; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < n; j++) {
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = p1.radius + p2.radius;

          if (dist < minDist) {
            if (dist === 0) dist = 0.1;
            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            p1.x -= nx * overlap * 0.5;
            p1.y -= ny * overlap * 0.5;
            p2.x += nx * overlap * 0.5;
            p2.y += ny * overlap * 0.5;

            const kx = p1.vx - p2.vx;
            const ky = p1.vy - p2.vy;
            const impulse = nx * kx + ny * ky;

            p1.vx -= impulse * nx;
            p1.vy -= impulse * ny;
            p2.vx += impulse * nx;
            p2.vy += impulse * ny;
          }
        }
      }

      // Pressure Gauge calculation: Force / Area
      const vesselArea = (rightWall - leftWall) * (bottomWall - lidY);
      const instantP = (momentumExchangeRef.current / (vesselArea + 1)) * 9500;
      momentumExchangeRef.current = 0;

      rollingPressureRef.current.push(instantP);
      if (rollingPressureRef.current.length > 25) {
        const avgP =
          rollingPressureRef.current.reduce((a, b) => a + b, 0) /
          rollingPressureRef.current.length;
        rollingPressureRef.current = [];

        let calibratedP = avgP;
        if (currentP === 'solid') calibratedP = actualTemp * 0.001;
        if (currentP === 'liquid') calibratedP = actualTemp * 0.004;

        setPressureAtm(Math.max(0.05, parseFloat(calibratedP.toFixed(2))));
      }

      // Render Molecules
      particles.forEach(p => {
        const rx = p.x;
        const ry = p.y;
        const theta = p.angle;

        if (substance.particleType === 'water') {
          // Triatomic H2O: Central Oxygen (red) + 2 Hydrogens (white) at 104.5 degrees
          const hOffset = 6.5;
          const hRadius = 3.5;
          const hAngle1 = theta + ((104.5 * Math.PI) / 180) / 2;
          const hAngle2 = theta - ((104.5 * Math.PI) / 180) / 2;

          const hx1 = rx + Math.cos(hAngle1) * hOffset;
          const hy1 = ry + Math.sin(hAngle1) * hOffset;
          const hx2 = rx + Math.cos(hAngle2) * hOffset;
          const hy2 = ry + Math.sin(hAngle2) * hOffset;

          // Covalent bonds lines
          ctx.beginPath();
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.6;
          ctx.moveTo(rx, ry); ctx.lineTo(hx1, hy1);
          ctx.moveTo(rx, ry); ctx.lineTo(hx2, hy2);
          ctx.stroke();

          // Hydrogen 1
          ctx.beginPath();
          ctx.arc(hx1, hy1, hRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#f1f5f9';
          ctx.fill();

          // Hydrogen 2
          ctx.beginPath();
          ctx.arc(hx2, hy2, hRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#f1f5f9';
          ctx.fill();

          // Central Oxygen
          const oGrad = ctx.createRadialGradient(rx - 2, ry - 2, 1, rx, ry, 6);
          oGrad.addColorStop(0, '#fca5a5');
          oGrad.addColorStop(0.4, '#ef4444');
          oGrad.addColorStop(1, '#991b1b');
          ctx.beginPath();
          ctx.arc(rx, ry, 6, 0, Math.PI * 2);
          ctx.fillStyle = oGrad;
          ctx.fill();
        } else if (substance.particleType === 'diatomic') {
          // O2 or N2: Two bonded atoms
          const offsetDist = 5.5;
          const subX1 = rx + Math.cos(theta) * offsetDist;
          const subY1 = ry + Math.sin(theta) * offsetDist;
          const subX2 = rx - Math.cos(theta) * offsetDist;
          const subY2 = ry - Math.sin(theta) * offsetDist;

          ctx.beginPath();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2.5;
          ctx.moveTo(subX1, subY1); ctx.lineTo(subX2, subY2);
          ctx.stroke();

          const color = substance.color;
          [ {x: subX1, y: subY1}, {x: subX2, y: subY2} ].forEach(pos => {
            const grad = ctx.createRadialGradient(pos.x - 2, pos.y - 2, 1, pos.x, pos.y, 6);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, color);
            grad.addColorStop(1, '#1e293b');
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
          });
        } else {
          // Monatomic Neon / Argon sphere
          const color = substance.color;
          const grad = ctx.createRadialGradient(rx - 2, ry - 2, 1, rx, ry, p.radius);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.35, color);
          grad.addColorStop(1, '#0f172a');

          ctx.beginPath();
          ctx.arc(rx, ry, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.shadowColor = color;
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [substance, targetTemp, gravityEnabled, volumeLidPercent, phaseInfo.phase, burnerActive]);

  // Jump to specific state presets
  const jumpToPhase = (phase: 'solid' | 'liquid' | 'gas') => {
    let t: number;
    if (phase === 'solid') {
      t = Math.max(5, substance.meltingPointK - 35);
    } else if (phase === 'liquid') {
      t = (substance.meltingPointK + substance.boilingPointK) / 2;
    } else {
      t = substance.boilingPointK + 45;
    }
    setTargetTemp(Math.round(t));
  };

  return (
    <div className="space-y-6">
      {/* Live Phase Transition Alert Banner (Directly solves user request #2) */}
      {transitionNotification && (
        <div className="bg-gradient-to-l from-cyan-950 via-slate-900 to-slate-950 border-2 border-cyan-500 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 text-2xl shrink-0">
              {transitionNotification.type === 'melting' && '🔥'}
              {transitionNotification.type === 'boiling' && '💨'}
              {transitionNotification.type === 'condensation' && '💧'}
              {transitionNotification.type === 'freezing' && '❄️'}
            </div>
            <div>
              <h4 className="text-base font-black text-cyan-300 flex items-center gap-2">
                <span>{transitionNotification.title}</span>
                <span className="text-xs font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 text-white">
                  T = {actualTemp.toFixed(1)} K
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {transitionNotification.description}
              </p>
            </div>
          </div>
          <button
            onClick={() => setTransitionNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            إغلاق
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Substance Selection & Thermal Controls (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Substance Selector Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <h3 className="font-bold text-slate-200 text-base pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>المادة الكيميائية</span>
              <span className="text-xs font-mono text-cyan-400">{substance.formula}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(SUBSTANCES).map(sub => {
                const isSelected = sub.id === substanceId;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSubstanceId(sub.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-sm shadow-cyan-500/30'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{sub.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">({sub.formula})</span>
                  </button>
                );
              })}
            </div>

            {/* Substance Thermal Constants */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-slate-400">
                <span>درجة الانصهار (Tₘ):</span>
                <span className="font-mono font-bold text-blue-400">
                  {substance.meltingPointK.toFixed(1)} K ({(substance.meltingPointK - 273.15).toFixed(1)} °C)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>درجة الغليان (T_b):</span>
                <span className="font-mono font-bold text-orange-400">
                  {substance.boilingPointK.toFixed(1)} K ({(substance.boilingPointK - 273.15).toFixed(1)} °C)
                </span>
              </div>
            </div>
          </div>

          {/* Thermal & Burner Controls Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-slate-200 text-base pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>التحكم الحراري والميكانيكي</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </h3>

            {/* Target Temperature Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">درجة الحرارة المطلوبة:</span>
                <span className="font-mono font-extrabold text-orange-400 text-sm">
                  {targetTemp} K ({Math.round(targetTemp - 273.15)} °C)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="800"
                value={targetTemp}
                onChange={(e) => setTargetTemp(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5 K (تبريد فائق)</span>
                <span>300 K (حرارة الغرفة)</span>
                <span>800 K (حرارة فائقة)</span>
              </div>
            </div>

            {/* Continuous Burner Controls (Fire & Ice) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onMouseDown={() => startBurner('heat')}
                onMouseUp={stopBurner}
                onMouseLeave={stopBurner}
                onTouchStart={() => startBurner('heat')}
                onTouchEnd={stopBurner}
                className={`py-3 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all select-none ${
                  burnerActive === 'heat'
                    ? 'bg-orange-600 border-orange-400 text-white shadow-lg shadow-orange-500/40 scale-[0.98]'
                    : 'bg-orange-950/40 border-orange-900/50 text-orange-400 hover:bg-orange-900/40'
                }`}
              >
                <Flame className={`w-4 h-4 ${burnerActive === 'heat' ? 'animate-bounce' : 'animate-pulse'}`} />
                <span>تسخين مستمر (استمر بالضغط)</span>
              </button>

              <button
                onMouseDown={() => startBurner('cool')}
                onMouseUp={stopBurner}
                onMouseLeave={stopBurner}
                onTouchStart={() => startBurner('cool')}
                onTouchEnd={stopBurner}
                className={`py-3 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all select-none ${
                  burnerActive === 'cool'
                    ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/40 scale-[0.98]'
                    : 'bg-cyan-950/40 border-cyan-900/50 text-cyan-400 hover:bg-cyan-900/40'
                }`}
              >
                <Snowflake className={`w-4 h-4 ${burnerActive === 'cool' ? 'animate-spin' : ''}`} />
                <span>تبريد مستمر (استمر بالضغط)</span>
              </button>
            </div>

            {/* Container Volume Lid Slider (Boyle's Law) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">حجم الوعاء (مستوى المكبس):</span>
                <span className="font-mono font-bold text-cyan-400">{volumeLidPercent}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={volumeLidPercent}
                onChange={(e) => setVolumeLidPercent(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Gravity Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">الجاذبية الأرضية:</span>
              <button
                onClick={() => setGravityEnabled(g => !g)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  gravityEnabled ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {gravityEnabled ? 'مفعلة' : 'معطلة (انعدام وزن)'}
              </button>
            </div>
          </div>
        </div>

        {/* Middle Column: Physical Simulation Vessel & Phase Gauge (Span 5) */}
        <div className="lg:col-span-5 flex flex-col items-center gap-4">
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col items-center">
            {/* Top State Badge */}
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">حالة المادة الحالية:</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black border ${phaseInfo.badgeClass}`}>
                  {phaseInfo.phaseAr}
                </span>
              </div>

              <span className="text-xs font-mono text-slate-400">
                P ≈ {pressureAtm} Atm
              </span>
            </div>

            {/* Interactive Canvas */}
            <div className="relative w-full aspect-[4/3] max-w-[440px] bg-slate-950/80 border-2 border-slate-700/60 rounded-xl overflow-hidden shadow-2xl">
              <canvas
                ref={canvasRef}
                width={440}
                height={330}
                className="w-full h-full relative z-10"
              />
            </div>

            {/* Quick State Presets */}
            <div className="w-full grid grid-cols-3 gap-2 mt-4">
              <button
                onClick={() => jumpToPhase('solid')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  phaseInfo.phase === 'solid'
                    ? 'bg-blue-950/80 border-blue-500 text-blue-300 shadow-md ring-1 ring-blue-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🧊 صلب (بلوري)
              </button>
              <button
                onClick={() => jumpToPhase('liquid')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  phaseInfo.phase === 'liquid'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md ring-1 ring-cyan-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                💧 سائل (مائع)
              </button>
              <button
                onClick={() => jumpToPhase('gas')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  phaseInfo.phase === 'gas'
                    ? 'bg-orange-950/80 border-orange-500 text-orange-300 shadow-md ring-1 ring-orange-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                💨 غاز (حر التمدد)
              </button>
            </div>
          </div>

          {/* Temperature Phase Diagram Bar (Visual Ruler) */}
          <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
              <span>شريط أطوار المادة ومواقع الانتقال الطوري:</span>
              <span className="font-mono text-cyan-400">{actualTemp.toFixed(1)} K</span>
            </div>

            {/* Visual Bar */}
            <div className="relative h-6 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center text-[10px] font-bold text-center">
              {/* Solid Zone */}
              <div
                style={{ width: `${Math.min(40, (substance.meltingPointK / 600) * 100)}%` }}
                className="h-full bg-blue-950/60 text-blue-400 flex items-center justify-center border-l border-blue-500/40 truncate"
              >
                صلب
              </div>

              {/* Liquid Zone */}
              <div
                style={{
                  width: `${Math.max(15, ((substance.boilingPointK - substance.meltingPointK) / 600) * 100)}%`
                }}
                className="h-full bg-cyan-950/60 text-cyan-300 flex items-center justify-center border-l border-cyan-500/40 truncate"
              >
                سائل
              </div>

              {/* Gas Zone */}
              <div className="flex-1 h-full bg-orange-950/60 text-orange-400 flex items-center justify-center truncate">
                غاز
              </div>

              {/* Needle Indicator for current actualTemp */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white z-20 transition-all duration-150"
                style={{
                  left: `${Math.max(2, Math.min(98, (actualTemp / 600) * 100))}%`
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 pt-1">
              <span>0 K (الصفر المطلق)</span>
              <span className="text-blue-400 font-mono">Tₘ: {substance.meltingPointK.toFixed(0)} K</span>
              <span className="text-orange-400 font-mono">T_b: {substance.boilingPointK.toFixed(0)} K</span>
              <span>600 K</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Gauges & Thermodynamics Explanations (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-slate-200 text-base pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>لوحة القياسات الحركية</span>
              <Gauge className="w-4 h-4 text-cyan-400" />
            </h3>

            {/* Temperature Gauge */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">الحرارة الفعلية</span>
                <span className="text-2xl font-mono font-black text-orange-400 block mt-0.5">
                  {actualTemp.toFixed(1)} K
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({(actualTemp - 273.15).toFixed(1)} °C)
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-950/40 border border-orange-500/30 flex items-center justify-center text-orange-400 text-xl">
                🌡️
              </div>
            </div>

            {/* Pressure Gauge */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">الضغط الداخلي (Atm)</span>
                <span className="text-2xl font-mono font-black text-cyan-400 block mt-0.5">
                  {pressureAtm} Atm
                </span>
                <span className="text-[10px] text-slate-500">
                  ارتطامات الجزيئات بالجدران
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xl">
                ⚡
              </div>
            </div>

            {/* Phase Explanation Note */}
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
              <h5 className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>التفسير الفيزيائي للحالة:</span>
              </h5>
              <p className="text-slate-300 text-xs leading-relaxed">
                {phaseInfo.detail}
              </p>
            </div>

            {/* Gas Laws Note */}
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed space-y-1">
              <strong className="text-cyan-300 block">💡 قوانين الغازات التفاعلية:</strong>
              <p>
                • <strong>قانون بويل:</strong> جرّب خفض حجم الوعاء عبر المكبس، ستلاحظ ارتفاعاً فورياً في الضغط بسبب تقارب الجزيئات وزيادة معدل الارتطام.
              </p>
              <p>
                • <strong>قانون غاي-لوساك:</strong> عند تسخين الغاز في وعاء مغلق، تزداد السرعة والطاقة الحركية، مما يرفع الضغط طردياً مع الحرارة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
