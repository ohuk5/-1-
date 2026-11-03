import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Flame, Snowflake, Plus, Minus, Wind, Gauge, Orbit, Waves, CheckCircle2, Info, ArrowUp, ArrowDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playLabSound } from '../../utils/soundEffects';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  color: string;
  type: 'heavy' | 'light';
}

export const GasThermodynamicsSim: React.FC = () => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  // Sub-mode: Gas Laws vs Fluid Buoyancy
  const [subMode, setSubMode] = useState<'gas' | 'buoyancy'>('gas');

  // --- Gas Laws State ---
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [tempK, setTempK] = useState<number>(300); // Kelvin
  const [volumePercent, setVolumePercent] = useState<number>(75); // 20% to 100%
  const [gasLawLock, setGasLawLock] = useState<'none' | 'boyle' | 'charles' | 'gay_lussac'>('none');
  const [heavyCount, setHeavyCount] = useState<number>(40);
  const [lightCount, setLightCount] = useState<number>(40);
  const [gravity, setGravity] = useState<number>(0); // 0 = zero G, 9.8 = earth
  const [wallCollisionsPerSec, setWallCollisionsPerSec] = useState<number>(0);
  const [calculatedPressureAtm, setCalculatedPressureAtm] = useState<number>(1.0);

  // --- Buoyancy State ---
  const [fluidType, setFluidType] = useState<'water' | 'oil' | 'honey' | 'mercury'>('water');
  const [blockDensity, setBlockDensity] = useState<number>(600); // kg/m³
  const [blockVolume, setBlockVolume] = useState<number>(0.005); // m³ (5 Liters)
  const [buoyancyGravity, setBuoyancyGravity] = useState<'earth' | 'moon' | 'jupiter' | 'zero'>('earth');
  const [blockY, setBlockY] = useState<number>(0.5); // 0 (top) to 1 (bottom)
  const [blockVelocityY, setBlockVelocityY] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const collisionCounterRef = useRef<number>(0);
  const lastCollisionResetRef = useRef<number>(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);

  // Constants
  const R_CONST = 0.08206; // L·atm / (mol·K)
  const FLUID_DENSITIES: Record<'water' | 'oil' | 'honey' | 'mercury', { nameAr: string; nameEn: string; density: number; color: string }> = {
    water: { nameAr: 'الماء الصافي (1000 كغ/م³)', nameEn: 'Pure Water (1000 kg/m³)', density: 1000, color: 'rgba(56, 189, 248, 0.55)' },
    oil: { nameAr: 'زيت نباتي (800 كغ/م³)', nameEn: 'Vegetable Oil (800 kg/m³)', density: 800, color: 'rgba(251, 191, 36, 0.55)' },
    honey: { nameAr: 'عسل كثيف (1420 كغ/م³)', nameEn: 'Dense Honey (1420 kg/m³)', density: 1420, color: 'rgba(217, 119, 6, 0.65)' },
    mercury: { nameAr: 'زئبق سائل (13600 كغ/م³)', nameEn: 'Liquid Mercury (13600 kg/m³)', density: 13600, color: 'rgba(148, 163, 184, 0.85)' }
  };

  const GRAVITY_PRESETS: Record<'earth' | 'moon' | 'jupiter' | 'zero', { nameAr: string; nameEn: string; g: number }> = {
    earth: { nameAr: 'الأرض (9.8 م/ث²)', nameEn: 'Earth (9.8 m/s²)', g: 9.8 },
    moon: { nameAr: 'القمر (1.62 م/ث²)', nameEn: 'Moon (1.62 m/s²)', g: 1.62 },
    jupiter: { nameAr: 'المشتري (24.8 م/ث²)', nameEn: 'Jupiter (24.8 m/s²)', g: 24.79 },
    zero: { nameAr: 'انعدام الجاذبية (0 م/ث²)', nameEn: 'Zero Gravity (0 m/s²)', g: 0 }
  };

  // Initialize or re-populate particles
  const initParticles = useCallback((hCount: number, lCount: number, currentTemp: number) => {
    const particles: Particle[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;
    const currentContainerWidth = width * (volumePercent / 100);

    const speedScale = Math.sqrt(currentTemp / 300);

    // Heavy particles (Argon - blue/cyan, mass 4, radius 6)
    for (let i = 0; i < hCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.2 + Math.random() * 1.5) * speedScale;
      particles.push({
        x: 10 + Math.random() * (currentContainerWidth - 25),
        y: 10 + Math.random() * (height - 25),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 6,
        mass: 4,
        color: '#06b6d4', // Cyan
        type: 'heavy'
      });
    }

    // Light particles (Helium - amber/orange, mass 1, radius 4)
    for (let i = 0; i < lCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2.4 + Math.random() * 2.5) * speedScale;
      particles.push({
        x: 10 + Math.random() * (currentContainerWidth - 25),
        y: 10 + Math.random() * (height - 25),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4,
        mass: 1,
        color: '#f59e0b', // Amber
        type: 'light'
      });
    }

    particlesRef.current = particles;
  }, [volumePercent]);

  // Handle gas law lock constraints
  const handleVolumeChange = (newVol: number) => {
    setVolumePercent(newVol);
    if (gasLawLock === 'boyle') {
      // P1*V1 = P2*V2 -> T is constant, pressure changes inversely
    } else if (gasLawLock === 'charles') {
      // V1/T1 = V2/T2 -> P is constant, T must adjust proportionally
      const ratio = newVol / volumePercent;
      setTempK(prev => Math.min(1000, Math.max(50, Math.round(prev * ratio))));
    }
  };

  const handleTempChange = (newTemp: number) => {
    setTempK(newTemp);
    if (gasLawLock === 'charles') {
      // V1/T1 = V2/T2 -> Volume adjusts with T
      const ratio = newTemp / tempK;
      setVolumePercent(prev => Math.min(100, Math.max(20, Math.round(prev * ratio))));
    } else if (gasLawLock === 'gay_lussac') {
      // V is constant, pressure changes with T
    }
  };

  // Re-scale particle velocities when temperature changes
  useEffect(() => {
    const factor = Math.sqrt(tempK / 300);
    particlesRef.current.forEach(p => {
      const baseSpeed = p.type === 'heavy' ? 2.0 : 3.5;
      const curSpeed = Math.hypot(p.vx, p.vy) || 1;
      const targetSpeed = baseSpeed * factor;
      p.vx = (p.vx / curSpeed) * targetSpeed;
      p.vy = (p.vy / curSpeed) * targetSpeed;
    });
  }, [tempK]);

  // Update ideal gas pressure calculation
  useEffect(() => {
    const totalMoles = (heavyCount + lightCount) * 0.01;
    const volLiters = (volumePercent / 100) * 10; // 2L to 10L
    const p = (totalMoles * R_CONST * tempK) / (volLiters || 1);
    setCalculatedPressureAtm(Number(p.toFixed(2)));
  }, [tempK, volumePercent, heavyCount, lightCount]);

  // Initialize canvas
  useEffect(() => {
    initParticles(heavyCount, lightCount, tempK);
  }, []);

  // Main 60FPS physics animation loop for Gas Simulator
  useEffect(() => {
    if (subMode !== 'gas') return;

    let isMounted = true;

    const render = () => {
      if (!isMounted) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameIdRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const containerW = width * (volumePercent / 100);

      // Clear Canvas
      ctx.fillStyle = isDark ? '#090d16' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Draw container boundary
      ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, containerW - 4, height - 8);

      // Draw movable piston on the right
      const pistonX = containerW;
      const gradient = ctx.createLinearGradient(pistonX - 12, 0, pistonX + 16, 0);
      gradient.addColorStop(0, isDark ? '#475569' : '#94a3b8');
      gradient.addColorStop(0.5, isDark ? '#64748b' : '#64748b');
      gradient.addColorStop(1, isDark ? '#334155' : '#475569');
      ctx.fillStyle = gradient;
      ctx.fillRect(pistonX - 8, 4, 16, height - 8);

      // Piston handle / rod
      ctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
      ctx.fillRect(pistonX + 8, height / 2 - 8, width - pistonX, 16);

      // Inactive area beyond piston
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(226, 232, 240, 0.7)';
      ctx.fillRect(pistonX + 8, 0, width - pistonX, height);
      ctx.strokeStyle = isDark ? 'rgba(71, 85, 105, 0.4)' : 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      for (let x = pistonX + 16; x < width; x += 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 10, height);
        ctx.stroke();
      }

      // Update and draw particles
      const particles = particlesRef.current;
      const gAccel = (gravity / 9.8) * 0.05;

      if (isPlaying) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Apply gravity
          p.vy += gAccel;

          // Move
          p.x += p.vx;
          p.y += p.vy;

          // Wall collision: Left
          if (p.x - p.radius <= 6) {
            p.x = 6 + p.radius;
            p.vx = -p.vx;
            collisionCounterRef.current++;
          }
          // Wall collision: Right (Piston)
          if (p.x + p.radius >= pistonX - 8) {
            p.x = pistonX - 8 - p.radius;
            p.vx = -p.vx;
            collisionCounterRef.current++;
          }
          // Wall collision: Top
          if (p.y - p.radius <= 6) {
            p.y = 6 + p.radius;
            p.vy = -p.vy;
            collisionCounterRef.current++;
          }
          // Wall collision: Bottom
          if (p.y + p.radius >= height - 6) {
            p.y = height - 6 - p.radius;
            p.vy = -p.vy;
            collisionCounterRef.current++;
          }

          // Particle-Particle Elastic Collisions
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p2.x - p.x;
            const dy = p2.y - p.y;
            const dist = Math.hypot(dx, dy);
            const minDist = p.radius + p2.radius;

            if (dist < minDist && dist > 0.001) {
              // Normal vector
              const nx = dx / dist;
              const ny = dy / dist;

              // Separate overlapping particles
              const overlap = 0.5 * (minDist - dist);
              p.x -= nx * overlap;
              p.y -= ny * overlap;
              p2.x += nx * overlap;
              p2.y += ny * overlap;

              // Velocities along normal
              const kx = p.vx - p2.vx;
              const ky = p.vy - p2.vy;
              const p_val = 2 * (nx * kx + ny * ky) / (p.mass + p2.mass);

              p.vx -= p_val * p2.mass * nx;
              p.vy -= p_val * p2.mass * ny;
              p2.vx += p_val * p.mass * nx;
              p2.vy += p_val * p.mass * ny;
            }
          }
        }

        // Measure collision frequency per second for pressure
        const now = performance.now();
        if (now - lastCollisionResetRef.current >= 500) {
          const count = collisionCounterRef.current;
          setWallCollisionsPerSec(count * 2);
          collisionCounterRef.current = 0;
          lastCollisionResetRef.current = now;
        }
      }

      // Draw particles with subtle glow
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    animationFrameIdRef.current = requestAnimationFrame(render);
    return () => {
      isMounted = false;
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [subMode, isPlaying, volumePercent, gravity]);

  // Main 60FPS physics loop for Buoyancy Simulation
  useEffect(() => {
    if (subMode !== 'buoyancy') return;

    let isMounted = true;
    const gValue = GRAVITY_PRESETS[buoyancyGravity].g;
    const rhoFluid = FLUID_DENSITIES[fluidType].density;
    const blockMass = blockDensity * blockVolume;

    const interval = setInterval(() => {
      if (!isPlaying) return;

      setBlockY(prevY => {
        // Tank fluid surface is at Y = 0.35 (air is 0 to 0.35, fluid is 0.35 to 1.0)
        const fluidSurfaceY = 0.35;
        const blockHeightNormalized = 0.22; // Height of block in normalized coords

        // Determine submerged fraction (0 = fully in air, 1 = fully submerged)
        const blockTop = prevY;
        const blockBottom = prevY + blockHeightNormalized;

        let submergedFraction = 0;
        if (blockBottom <= fluidSurfaceY) {
          submergedFraction = 0; // completely above fluid
        } else if (blockTop >= fluidSurfaceY) {
          submergedFraction = 1; // fully submerged
        } else {
          submergedFraction = (blockBottom - fluidSurfaceY) / blockHeightNormalized;
        }

        // Downward gravity force
        const F_gravity = blockMass * gValue;

        // Upward buoyant force: rho_fluid * V_submerged * g
        const V_submerged = blockVolume * submergedFraction;
        const F_buoyancy = rhoFluid * V_submerged * gValue;

        // Viscous drag / damping
        const dragCoefficient = submergedFraction > 0 ? 0.92 : 0.98;

        // Net force and acceleration
        const F_net = F_gravity - F_buoyancy; // Positive downward
        const acceleration = F_net / blockMass; // m/s²

        let nextVel = (blockVelocityY + acceleration * 0.003) * dragCoefficient;
        let nextY = prevY + nextVel;

        // Boundaries: bottom of tank (y = 0.78) and top of tank (y = 0.05)
        if (nextY > 0.75) {
          nextY = 0.75;
          nextVel = -nextVel * 0.2; // small bounce
        } else if (nextY < 0.05) {
          nextY = 0.05;
          nextVel = 0;
        }

        setBlockVelocityY(nextVel);
        return nextY;
      });
    }, 16);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [subMode, isPlaying, buoyancyGravity, fluidType, blockDensity, blockVolume, blockVelocityY]);

  // Buoyancy calculations for telemetry
  const activeFluid = FLUID_DENSITIES[fluidType];
  const gCurrent = GRAVITY_PRESETS[buoyancyGravity].g;
  const massKg = blockDensity * blockVolume;
  const gravityForceN = massKg * gCurrent;
  const maxBuoyancyForceN = activeFluid.density * blockVolume * gCurrent;
  const isFloating = blockDensity < activeFluid.density;
  const submergedPercent = Math.min(100, Math.round((blockDensity / activeFluid.density) * 100));

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Station Sub-Navigation */}
      <div className={`p-1.5 rounded-2xl border flex items-center gap-2 max-w-md mx-auto ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => {
            setSubMode('gas');
            playLabSound('click');
          }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            subMode === 'gas'
              ? 'bg-cyan-500 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>{t('قوانين الغازات وحركة الجسيمات', 'Gas Laws & Kinetics')}</span>
        </button>
        <button
          onClick={() => {
            setSubMode('buoyancy');
            playLabSound('click');
          }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            subMode === 'buoyancy'
              ? 'bg-cyan-500 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Waves className="w-4 h-4" />
          <span>{t('الموائع وقاعدة أرخميدس والطفو', 'Fluids & Buoyancy')}</span>
        </button>
      </div>

      {/* MODE 1: GAS LAWS & THERMODYNAMICS */}
      {subMode === 'gas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Simulation Viewport (Col 1-8) */}
          <div className={`lg:col-span-8 rounded-3xl border p-4 sm:p-6 flex flex-col gap-4 shadow-sm ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Wind className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white">
                    {t('محاكاة الغاز المثالي وحركة الجزيئات', 'Ideal Gas Molecular Kinetics')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('تصادمات مرنة مستمرة وحساب آني للضغط والحجم والحرارة (PV = nRT)', 'Elastic collisions & real-time calculation of P, V, T')}
                  </p>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-2.5 rounded-xl border font-medium text-xs flex items-center gap-1.5 transition-all ${
                    isPlaying
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? t('إيقاف مؤقت', 'Pause') : t('تشغيل', 'Play')}</span>
                </button>
                <button
                  onClick={() => {
                    initParticles(heavyCount, lightCount, tempK);
                    playLabSound('click');
                  }}
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                  title={t('إعادة نشر الجسيمات', 'Reset particles')}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('إعادة ضبط', 'Reset')}</span>
                </button>
              </div>
            </div>

            {/* Canvas Stage */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={800}
                height={460}
                className="w-full h-full block object-contain"
              />

              {/* HUD Overlays on Canvas */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2 pointer-events-none">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs backdrop-blur-md flex items-center gap-2">
                  <span className="text-slate-400">{t('الضغط الفعلي:', 'Pressure:')}</span>
                  <span className="font-mono font-bold text-cyan-400 tabular-nums">
                    {calculatedPressureAtm} atm
                  </span>
                  <span className="text-slate-500">({(calculatedPressureAtm * 101.325).toFixed(1)} kPa)</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs backdrop-blur-md flex items-center gap-2">
                  <span className="text-slate-400">{t('الحجم (V):', 'Volume:')}</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {((volumePercent / 100) * 10).toFixed(1)} L
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs backdrop-blur-md flex items-center gap-2">
                  <span className="text-slate-400">{t('الحرارة (T):', 'Temp:')}</span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {tempK} K
                  </span>
                  <span className="text-slate-500">({tempK - 273}°C)</span>
                </div>
              </div>

              {/* Bottom collision counter HUD */}
              <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs backdrop-blur-md flex items-center gap-2 pointer-events-none">
                <span className="text-slate-400">{t('معدل التصادمات/ث:', 'Collisions/s:')}</span>
                <span className="font-mono font-bold text-purple-400 tabular-nums">
                  {wallCollisionsPerSec}
                </span>
              </div>
            </div>

            {/* Presets & Gas Laws Selector */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400">
                {t('تثبيت أحد المتغيرات لاختبار القوانين الخاصة (Gas Laws Locks):', 'Lock a variable to test special gas laws:')}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => setGasLawLock('none')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    gasLawLock === 'none'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : isDark ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {t('حر (الغاز المثالي)', 'Free (Ideal Gas)')}
                </button>
                <button
                  onClick={() => setGasLawLock('boyle')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    gasLawLock === 'boyle'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : isDark ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {t('قانون بويل (ثبات T)', "Boyle's (T fixed)")}
                </button>
                <button
                  onClick={() => setGasLawLock('charles')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    gasLawLock === 'charles'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : isDark ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {t('قانون شارل (ثبات P)', "Charles's (P fixed)")}
                </button>
                <button
                  onClick={() => setGasLawLock('gay_lussac')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    gasLawLock === 'gay_lussac'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : isDark ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {t('غاي-لوساك (ثبات V)', "Gay-Lussac (V fixed)")}
                </button>
              </div>
            </div>
          </div>

          {/* Control Deck (Col 9-12) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Temperature Control */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  {t('درجة الحرارة (Temperature):', 'Temperature (T):')}
                </span>
                <span className="font-mono font-bold text-sm text-amber-400 tabular-nums">
                  {tempK} K
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="10"
                value={tempK}
                onChange={(e) => handleTempChange(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTempChange(Math.max(50, tempK - 50))}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-blue-400' : 'border-slate-200 hover:bg-slate-100 text-blue-600'
                  }`}
                >
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>{t('تبريد (-50K)', 'Cool (-50K)')}</span>
                </button>
                <button
                  onClick={() => handleTempChange(Math.min(800, tempK + 50))}
                  className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-amber-400' : 'border-slate-200 hover:bg-slate-100 text-amber-600'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{t('تسخين (+50K)', 'Heat (+50K)')}</span>
                </button>
              </div>
            </div>

            {/* Volume / Piston Control */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  {t('حجم الإناء (موضع المكبس V):', 'Volume / Piston Position:')}
                </span>
                <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
                  {((volumePercent / 100) * 10).toFixed(1)} L
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="2"
                disabled={gasLawLock === 'gay_lussac'}
                value={volumePercent}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer disabled:opacity-40"
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t('ضغط المكبس (2.0L)', 'Compress (2.0L)')}</span>
                <span>{t('سحب المكبس (10.0L)', 'Expand (10.0L)')}</span>
              </div>
            </div>

            {/* Particle Counts & Gas Types */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-slate-200">
                {t('نوع وعدد جزيئات الغاز المحقونة:', 'Injected Gas Particles:')}
              </span>

              {/* Heavy Gas (Argon) */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span className="text-xs text-slate-300">
                    {t('غاز ثقيل (أرغون Ar)', 'Heavy Gas (Argon)')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const count = Math.max(0, heavyCount - 10);
                      setHeavyCount(count);
                      initParticles(count, lightCount, tempK);
                    }}
                    className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-xs w-7 text-center font-bold text-cyan-400">
                    {heavyCount}
                  </span>
                  <button
                    onClick={() => {
                      const count = Math.min(100, heavyCount + 10);
                      setHeavyCount(count);
                      initParticles(count, lightCount, tempK);
                    }}
                    className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Light Gas (Helium) */}
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-xs text-slate-300">
                    {t('غاز خفيف (هيليوم He)', 'Light Gas (Helium)')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const count = Math.max(0, lightCount - 10);
                      setLightCount(count);
                      initParticles(heavyCount, count, tempK);
                    }}
                    className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-xs w-7 text-center font-bold text-amber-400">
                    {lightCount}
                  </span>
                  <button
                    onClick={() => {
                      const count = Math.min(100, lightCount + 10);
                      setLightCount(count);
                      initParticles(heavyCount, count, tempK);
                    }}
                    className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Gravity Switcher */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{t('الجاذبية في الإناء:', 'Chamber Gravity:')}</span>
                <button
                  onClick={() => setGravity(prev => (prev === 0 ? 9.8 : 0))}
                  className={`px-3 py-1 rounded-xl border font-mono transition-all ${
                    gravity > 0
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  {gravity > 0 ? t('أرضية (9.8 م/ث²)', 'Earth (9.8)') : t('انعدام (0G)', 'Zero-G')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: FLUID MECHANICS & BUOYANCY (قاعدة أرخميدس) */}
      {subMode === 'buoyancy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Buoyancy Simulation Tank (Col 1-8) */}
          <div className={`lg:col-span-8 rounded-3xl border p-4 sm:p-6 flex flex-col gap-4 shadow-sm ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Waves className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100 dark:text-white">
                    {t('خزان تجارب الطفو وقاعدة أرخميدس', 'Archimedes Buoyancy Tank')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {t('قوة الطفو تساوي وزن السائل المزاح (F_b = ρ · V · g)', 'Buoyant force equals weight of displaced fluid')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setBlockY(0.1);
                  setBlockVelocityY(0);
                  playLabSound('click');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('إسقاط الجسم من الأعلى', 'Drop from top')}</span>
              </button>
            </div>

            {/* Tank Visualizer Stage */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col justify-end">
              {/* Air Region (Top 35%) */}
              <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-sky-950/20 to-transparent flex items-start p-3">
                <span className="text-xs font-mono text-slate-400/80 uppercase tracking-wider">
                  {t('الهواء الجوي (Air ρ ≈ 1.2 kg/m³)', 'Ambient Air (ρ ≈ 1.2 kg/m³)')}
                </span>
              </div>

              {/* Fluid Surface Divider Line */}
              <div className="absolute inset-x-0 top-[35%] h-1 bg-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.5)] z-10" />

              {/* Fluid Region (Bottom 65%) */}
              <div
                className="absolute inset-x-0 bottom-0 top-[35%] transition-colors duration-500 backdrop-blur-[1px] flex flex-col justify-between p-4"
                style={{ backgroundColor: activeFluid.color }}
              >
                <span className="text-xs font-mono font-bold text-slate-900 bg-white/70 px-2 py-0.5 rounded-md inline-block w-fit">
                  {isAr ? activeFluid.nameAr : activeFluid.nameEn}
                </span>
                <span className="text-xs font-mono text-slate-900/60 self-end">
                  {t('قاع الخزان (Bottom)', 'Tank Floor')}
                </span>
              </div>

              {/* Suspended / Floating Test Block */}
              <div
                className="absolute left-1/2 -translate-x-1/2 w-28 h-20 rounded-xl border-2 shadow-2xl transition-all duration-75 flex flex-col items-center justify-center p-2 z-20"
                style={{
                  top: `${blockY * 100}%`,
                  borderColor: isFloating ? '#10b981' : '#f43f5e',
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'
                }}
              >
                <span className="text-xs font-bold font-mono text-slate-200">
                  {blockDensity} kg/m³
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {massKg.toFixed(2)} kg
                </span>

                {/* Force Vector Arrows */}
                <div className="absolute -top-7 flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-400">
                  <ArrowUp className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>F_b = {Math.round(maxBuoyancyForceN * (submergedPercent / 100))} N</span>
                </div>
                <div className="absolute -bottom-7 flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400">
                  <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>F_g = {Math.round(gravityForceN)} N</span>
                </div>
              </div>
            </div>

            {/* Dynamic Result Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              isFloating
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">
                  {isFloating
                    ? t(`الجسم يطفو مستقراً! كثافة الجسم (${blockDensity}) أقل من كثافة السائل (${activeFluid.density}). الجزء المغمور: ${submergedPercent}%.`,
                        `Object floats! Block density (${blockDensity}) is less than fluid density (${activeFluid.density}). Submerged: ${submergedPercent}%.`)
                    : t(`الجسم يغوص للقعر! كثافة الجسم (${blockDensity}) أكبر من كثافة السائل (${activeFluid.density}) فقوة الجاذبية تفوقت على قوة الطفو.`,
                        `Object sinks! Block density (${blockDensity}) exceeds fluid density (${activeFluid.density}), gravitational force overcomes buoyancy.`)}
                </span>
              </div>
            </div>
          </div>

          {/* Buoyancy Control Deck (Col 9-12) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Select Fluid Type */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-slate-200">
                {t('نوع السائل في الخزان (Fluid Type):', 'Tank Fluid Density:')}
              </span>
              <div className="flex flex-col gap-2">
                {(Object.keys(FLUID_DENSITIES) as Array<keyof typeof FLUID_DENSITIES>).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFluidType(key);
                      playLabSound('click');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                      fluidType === key
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : isDark ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span>{isAr ? FLUID_DENSITIES[key].nameAr : FLUID_DENSITIES[key].nameEn}</span>
                    <span className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: FLUID_DENSITIES[key].color }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Block Density Slider */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">
                  {t('كثافة الجسم الصلب (ρ):', 'Block Density (ρ):')}
                </span>
                <span className="font-mono font-bold text-sm text-cyan-400 tabular-nums">
                  {blockDensity} kg/m³
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="2500"
                step="50"
                value={blockDensity}
                onChange={(e) => setBlockDensity(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{t('خشب خفيف (200)', 'Wood (200)')}</span>
                <span>{t('بلاستيك (950)', 'Plastic (950)')}</span>
                <span>{t('ألمنيوم (2700)', 'Aluminum (2700)')}</span>
              </div>
            </div>

            {/* Gravity Field Presets */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-sm ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Orbit className="w-4 h-4 text-purple-400" />
                {t('حقل الجاذبية المطبق (Gravity Field):', 'Gravity Field Preset:')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(GRAVITY_PRESETS) as Array<keyof typeof GRAVITY_PRESETS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setBuoyancyGravity(key);
                      playLabSound('click');
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                      buoyancyGravity === key
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                        : isDark ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isAr ? GRAVITY_PRESETS[key].nameAr : GRAVITY_PRESETS[key].nameEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
