import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Flame,
  Scale,
  Calculator,
  Box,
  TrendingUp,
  Sliders,
  Zap,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Gauge
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  EQUILIBRIUM_REACTIONS,
  KINETICS_REACTIONS,
  STOICHIOMETRY_REACTIONS
} from '../data/chemistry3CurriculumData';
import { playLabSound } from '../utils/soundEffects';
import { StageViewportFrame } from './StageViewportFrame';

export type Chemistry3SubTab = 'kinetics' | 'equilibrium' | 'stoichiometry';

interface ChemistryKineticsEqLabProps {
  mode: Chemistry3SubTab;
}

interface KineticParticle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  type: 'A' | 'B' | 'P';
}

export const ChemistryKineticsEqLab: React.FC<ChemistryKineticsEqLabProps> = ({ mode }) => {
  const { theme, t, lang, openCalculator } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');

  // ---------- 1. KINETICS STATE ----------
  const [kineticsId, setKineticsId] = useState<string>(KINETICS_REACTIONS[0].id);
  const [kinTempK, setKinTempK] = useState<number>(380);
  const [concA, setConcA] = useState<number>(1.2);
  const [concB, setConcB] = useState<number>(1.0);
  const [hasCatalyst, setHasCatalyst] = useState<boolean>(false);

  const activeKin = useMemo(
    () => KINETICS_REACTIONS.find((r) => r.id === kineticsId) || KINETICS_REACTIONS[0],
    [kineticsId]
  );

  const kinMetrics = useMemo(() => {
    const activeEa = hasCatalyst ? activeKin.eaCatKj : activeKin.eaUncatKj;
    // Arrhenius relative k compared to 298K
    const R = 8.314e-3; // kJ/(mol*K)
    const expFactor = Math.exp((-activeEa / R) * (1 / kinTempK - 1 / 380));
    const effectiveK = Math.min(25, Math.max(0.002, activeKin.baseK * expFactor));
    const rate = effectiveK * Math.pow(concA, activeKin.orderA) * Math.pow(concB, activeKin.orderB);
    const boltzmannFraction = Math.min(98, Math.max(2, 100 * Math.exp(-activeEa / (R * kinTempK * 4.2))));
    return {
      activeEa,
      effectiveK: Number(effectiveK.toFixed(4)),
      rate: Number(rate.toFixed(4)),
      boltzmannFraction: Number(boltzmannFraction.toFixed(1))
    };
  }, [activeKin, kinTempK, concA, concB, hasCatalyst]);

  // ---------- 2. EQUILIBRIUM STATE ----------
  const [eqId, setEqId] = useState<string>(EQUILIBRIUM_REACTIONS[1].id);
  const [eqTempK, setEqTempK] = useState<number>(298);
  const [eqPistonVol, setEqPistonVol] = useState<number>(65); // % volume (lower = higher P)
  const [eqReactantStress, setEqReactantStress] = useState<number>(1.0);
  const [eqProductStress, setEqProductStress] = useState<number>(1.0);
  const [eqCatalyst, setEqCatalyst] = useState<boolean>(false);
  const [eqTimeSeries, setEqTimeSeries] = useState<Array<{ t: number; r: number; p: number }>>([
    { t: 0, r: 80, p: 20 },
    { t: 1, r: 58, p: 42 },
    { t: 2, r: 44, p: 56 },
    { t: 3, r: 38, p: 62 },
    { t: 4, r: 36, p: 64 }
  ]);

  const activeEq = useMemo(
    () => EQUILIBRIUM_REACTIONS.find((r) => r.id === eqId) || EQUILIBRIUM_REACTIONS[0],
    [eqId]
  );

  const eqMetrics = useMemo(() => {
    const R = 8.314e-3;
    // Van't Hoff approximation around 298 K
    const kTemp = activeEq.kEq298 * Math.exp((-activeEq.deltaHKj / R) * (1 / eqTempK - 1 / 298) * 0.08);
    const clampedK = Math.min(40, Math.max(0.15, kTemp));

    // Pressure effect factor when gasDeltaN !== 0: compressing volume (smaller eqPistonVol) shifts toward fewer gas moles
    const volRatio = 65 / eqPistonVol;
    const pressureShift = Math.pow(volRatio, -activeEq.gasDeltaN * 0.45);
    const effectiveRatio = clampedK * pressureShift * (eqReactantStress / Math.max(0.2, eqProductStress));

    const productFrac = Math.min(0.92, Math.max(0.08, effectiveRatio / (1 + effectiveRatio)));
    const reactantFrac = 1 - productFrac;

    // Reaction quotient Q before re-equilibration
    const qInstant = (eqProductStress / Math.max(0.2, eqReactantStress)) * Math.pow(volRatio, activeEq.gasDeltaN);
    let shiftDir: 'forward' | 'reverse' | 'balanced' = 'balanced';
    if (qInstant < clampedK * 0.92) shiftDir = 'forward';
    else if (qInstant > clampedK * 1.08) shiftDir = 'reverse';

    return {
      kEq: Number(clampedK.toFixed(2)),
      qInstant: Number(qInstant.toFixed(2)),
      productPct: Math.round(productFrac * 100),
      reactantPct: Math.round(reactantFrac * 100),
      pressureAtm: Number((65 / eqPistonVol).toFixed(2)),
      shiftDir
    };
  }, [activeEq, eqTempK, eqPistonVol, eqReactantStress, eqProductStress]);

  // Update 2D concentration-vs-time curve cleanly whenever stresses change
  useEffect(() => {
    const prod = eqMetrics.productPct;
    const react = eqMetrics.reactantPct;
    const speedBoost = eqCatalyst ? 0.65 : 1.0;
    const pts: Array<{ t: number; r: number; p: number }> = [];
    for (let i = 0; i <= 8; i++) {
      const decay = Math.exp((-i * 0.55) / speedBoost);
      const rVal = react + (65 - react) * decay;
      const pVal = prod + (35 - prod) * decay;
      pts.push({ t: i, r: Math.round(rVal), p: Math.round(pVal) });
    }
    setEqTimeSeries(pts);
  }, [eqMetrics.productPct, eqMetrics.reactantPct, eqCatalyst]);

  // ---------- 3. STOICHIOMETRY STATE ----------
  const [stoichId, setStoichId] = useState<string>(STOICHIOMETRY_REACTIONS[0].id);
  const [massA, setMassA] = useState<number>(12);
  const [massB, setMassB] = useState<number>(64);
  const [actualYieldPct, setActualYieldPct] = useState<number>(88);

  const activeStoich = useMemo(
    () => STOICHIOMETRY_REACTIONS.find((r) => r.id === stoichId) || STOICHIOMETRY_REACTIONS[0],
    [stoichId]
  );

  const stoichMetrics = useMemo(() => {
    const nA = massA / activeStoich.reactantA.molarMass;
    const nB = massB / activeStoich.reactantB.molarMass;
    const rxnExtentA = nA / activeStoich.reactantA.coeff;
    const rxnExtentB = nB / activeStoich.reactantB.coeff;

    const limiting: 'A' | 'B' | 'exact' =
      Math.abs(rxnExtentA - rxnExtentB) < 0.01 ? 'exact' : rxnExtentA < rxnExtentB ? 'A' : 'B';

    const xi = Math.min(rxnExtentA, rxnExtentB);
    const nARemaining = Math.max(0, nA - xi * activeStoich.reactantA.coeff);
    const nBRemaining = Math.max(0, nB - xi * activeStoich.reactantB.coeff);
    const nProductFormed = xi * activeStoich.product.coeff;

    const theoreticalYieldG = nProductFormed * activeStoich.product.molarMass;
    const actualYieldG = theoreticalYieldG * (actualYieldPct / 100);

    return {
      nA: Number(nA.toFixed(3)),
      nB: Number(nB.toFixed(3)),
      limiting,
      nARemaining: Number(nARemaining.toFixed(3)),
      nBRemaining: Number(nBRemaining.toFixed(3)),
      massARemaining: Number((nARemaining * activeStoich.reactantA.molarMass).toFixed(2)),
      massBRemaining: Number((nBRemaining * activeStoich.reactantB.molarMass).toFixed(2)),
      nProductFormed: Number(nProductFormed.toFixed(3)),
      theoreticalYieldG: Number(theoreticalYieldG.toFixed(2)),
      actualYieldG: Number(actualYieldG.toFixed(2))
    };
  }, [activeStoich, massA, massB, actualYieldPct]);

  // ---------- 3D THREE.JS ENGINE ----------
  const mount3DRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({
    mode,
    kinTempK,
    concA,
    concB,
    hasCatalyst,
    boltzmannFraction: kinMetrics.boltzmannFraction,
    eqMetrics,
    activeEq,
    eqPistonVol,
    stoichMetrics,
    activeStoich
  });
  stateRef.current = {
    mode,
    kinTempK,
    concA,
    concB,
    hasCatalyst,
    boltzmannFraction: kinMetrics.boltzmannFraction,
    eqMetrics,
    activeEq,
    eqPistonVol,
    stoichMetrics,
    activeStoich
  };

  useEffect(() => {
    if (viewMode !== '3d') return;
    const container = mount3DRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 7.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.5;
    controls.maxDistance = 12;

    const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 1.0);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    // Build shared Vessel Box / Cylinder
    const vesselGroup = new THREE.Group();
    scene.add(vesselGroup);

    // Base stand
    const baseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.5, 0.25, 48),
      new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.75, roughness: 0.25 })
    );
    baseMesh.position.y = -2.1;
    vesselGroup.add(baseMesh);

    // Glass wall
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#bae6fd',
      transparent: true,
      opacity: 0.16,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const glassWall = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 4.0, 48, 1, true), glassMat);
    glassWall.position.y = 0;
    vesselGroup.add(glassWall);

    // Inner Tinted Solution / Gas Volume (for equilibrium color visualization)
    const mediumMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#38bdf8'),
      transparent: true,
      opacity: 0.14,
      roughness: 0.2,
      depthWrite: false
    });
    const mediumCylinder = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 1.98, 3.8, 36), mediumMat);
    mediumCylinder.position.y = -0.1;
    vesselGroup.add(mediumCylinder);

    // Movable Piston Disc
    const pistonGroup = new THREE.Group();
    const pistonDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.98, 1.98, 0.22, 40),
      new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.85, roughness: 0.2 })
    );
    const pistonRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 2.4, 16),
      new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9, roughness: 0.18 })
    );
    pistonRod.position.y = 1.25;
    pistonGroup.add(pistonDisc, pistonRod);
    pistonGroup.position.y = 1.7;
    vesselGroup.add(pistonGroup);

    // Collision flash ring
    const sparkRingMat = new THREE.MeshBasicMaterial({
      color: '#facc15',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const sparkRing = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.34, 24), sparkRingMat);
    vesselGroup.add(sparkRing);

    // Particle pool
    const MAX_PARTICLES = 72;
    const particles: KineticParticle3D[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * 1.45;
      particles.push({
        x: Math.cos(angle) * rad,
        y: (Math.random() - 0.5) * 2.8,
        z: Math.sin(angle) * rad,
        vx: (Math.random() - 0.5) * 0.04,
        vy: (Math.random() - 0.5) * 0.04,
        vz: (Math.random() - 0.5) * 0.04,
        type: i % 3 === 0 ? 'P' : i % 2 === 0 ? 'A' : 'B'
      });
    }

    const sphereGeo = new THREE.SphereGeometry(0.13, 18, 18);
    const particleMat = new THREE.MeshPhysicalMaterial({
      roughness: 0.15,
      metalness: 0.08,
      clearcoat: 0.8
    });
    const instancedParticles = new THREE.InstancedMesh(sphereGeo, particleMat, MAX_PARTICLES);
    vesselGroup.add(instancedParticles);

    const dummy = new THREE.Object3D();
    const colorA = new THREE.Color('#38bdf8');
    const colorB = new THREE.Color('#f43f5e');
    const colorP = new THREE.Color('#10b981');
    const tmpColor = new THREE.Color();

    let animId = 0;
    let flashLife = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;

      const cur = stateRef.current;

      // Determine top ceiling Y from piston position in equilibrium mode
      const pistonY =
        cur.mode === 'equilibrium'
          ? -1.2 + (cur.eqPistonVol / 100) * 3.0
          : 1.75;
      pistonGroup.position.y += (pistonY - pistonGroup.position.y) * 0.12;
      const ceilingY = pistonGroup.position.y - 0.25;
      const floorY = -1.85;

      // Tint inner fluid/gas volume
      if (cur.mode === 'equilibrium') {
        const rCol = new THREE.Color(cur.activeEq.reactantColor);
        const pCol = new THREE.Color(cur.activeEq.productColor);
        const mixFactor = cur.eqMetrics.productPct / 100;
        mediumMat.color.copy(rCol).lerp(pCol, mixFactor);
        mediumMat.opacity = 0.22;
        const heightScale = Math.max(0.22, (ceilingY - floorY) / 3.8);
        mediumCylinder.scale.y = heightScale;
        mediumCylinder.position.y = floorY + (3.8 * heightScale) / 2;
      } else {
        mediumMat.color.set('#38bdf8');
        mediumMat.opacity = 0.08;
        mediumCylinder.scale.y = 1;
        mediumCylinder.position.y = -0.05;
      }

      // Active particle counts and speed based on mode
      let activeCount = 48;
      let speedMul = 1.0;
      let aThreshold = 20;
      let bThreshold = 40;

      if (cur.mode === 'kinetics') {
        activeCount = Math.min(MAX_PARTICLES, Math.max(14, Math.round((cur.concA + cur.concB) * 18)));
        speedMul = 0.55 + (cur.kinTempK - 250) / 200;
        aThreshold = Math.round(activeCount * (cur.concA / Math.max(0.2, cur.concA + cur.concB)));
        bThreshold = activeCount;
      } else if (cur.mode === 'equilibrium') {
        activeCount = 54;
        speedMul = 0.6 + (cur.eqMetrics.pressureAtm - 0.5) * 0.35;
        const prodCount = Math.round((cur.eqMetrics.productPct / 100) * activeCount);
        aThreshold = activeCount - prodCount;
        bThreshold = activeCount - prodCount;
      } else {
        // stoichiometry
        const totalMoles = Math.max(0.1, cur.stoichMetrics.nARemaining + cur.stoichMetrics.nBRemaining + cur.stoichMetrics.nProductFormed);
        const fracA = cur.stoichMetrics.nARemaining / totalMoles;
        const fracB = cur.stoichMetrics.nBRemaining / totalMoles;
        activeCount = 50;
        speedMul = 0.85;
        aThreshold = Math.round(fracA * activeCount);
        bThreshold = Math.round((fracA + fracB) * activeCount);
      }

      if (cur.mode === 'kinetics') {
        colorA.set('#38bdf8');
        colorB.set('#f43f5e');
        colorP.set('#facc15');
      } else if (cur.mode === 'equilibrium') {
        colorA.set(cur.activeEq.reactantColor);
        colorB.set(cur.activeEq.reactantColor);
        colorP.set(cur.activeEq.productColor);
      } else {
        colorA.set(cur.activeStoich.reactantA.color);
        colorB.set(cur.activeStoich.reactantB.color);
        colorP.set(cur.activeStoich.product.color);
      }

      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (i >= activeCount) {
          dummy.position.set(0, -10, 0);
          dummy.scale.setScalar(0.001);
          dummy.updateMatrix();
          instancedParticles.setMatrixAt(i, dummy.matrix);
          continue;
        }

        p.x += p.vx * speedMul;
        p.y += p.vy * speedMul;
        p.z += p.vz * speedMul;

        const r = Math.hypot(p.x, p.z);
        if (r > 1.72) {
          const nx = p.x / r;
          const nz = p.z / r;
          p.x = nx * 1.72;
          p.z = nz * 1.72;
          const dot = p.vx * nx + p.vz * nz;
          p.vx -= 2 * dot * nx;
          p.vz -= 2 * dot * nz;
        }

        if (p.y < floorY) {
          p.y = floorY;
          p.vy = Math.abs(p.vy);
        } else if (p.y > ceilingY) {
          p.y = ceilingY;
          p.vy = -Math.abs(p.vy);
        }

        // Occasional reactive collision spark in kinetics mode
        if (cur.mode === 'kinetics' && i === 0 && Math.random() < cur.boltzmannFraction / 250) {
          sparkRing.position.set(p.x, p.y, p.z);
          sparkRing.lookAt(camera.position);
          flashLife = 1.0;
        }

        if (i < aThreshold) tmpColor.copy(colorA);
        else if (i < bThreshold) tmpColor.copy(colorB);
        else tmpColor.copy(colorP);

        instancedParticles.setColorAt(i, tmpColor);

        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.setScalar(i >= bThreshold ? 1.18 : 0.96);
        dummy.updateMatrix();
        instancedParticles.setMatrixAt(i, dummy.matrix);
      }

      instancedParticles.instanceMatrix.needsUpdate = true;
      if (instancedParticles.instanceColor) instancedParticles.instanceColor.needsUpdate = true;

      if (flashLife > 0) {
        flashLife = Math.max(0, flashLife - 0.06);
        sparkRingMat.opacity = flashLife;
        sparkRing.scale.setScalar(1 + (1 - flashLife) * 1.8);
      } else {
        sparkRingMat.opacity = 0;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(entry.contentRect.height);
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();
      sphereGeo.dispose();
      particleMat.dispose();
      glassMat.dispose();
      mediumMat.dispose();
      sparkRingMat.dispose();
      envRT.dispose();
      renderer.dispose();
    };
  }, [viewMode, isDark]);

  return (
    <div className="w-full space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Controls & Preset Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {mode === 'kinetics' && (
            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>{t('سرعة التفاعل ونظرية التصادم', 'Reaction Kinetics & Collision Theory')}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => openCalculator('rate_law')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-1"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{t('حاسبة السرعة', 'Rate Calc')}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 block">{t('التفاعل المختار:', 'Select Reaction:')}</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {KINETICS_REACTIONS.map((rxn) => (
                    <button
                      key={rxn.id}
                      type="button"
                      onClick={() => {
                        playLabSound('click');
                        setKineticsId(rxn.id);
                      }}
                      className={`p-2.5 rounded-xl border text-start transition-all ${
                        kineticsId === rxn.id
                          ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                          : isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold">{t(rxn.nameAr, rxn.nameEn)}</div>
                      <div className="text-[11px] font-mono text-amber-400 mt-0.5">{rxn.equation}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-300">{t('درجة الحرارة (T):', 'Temperature (T):')}</span>
                    <span className="font-mono font-bold text-orange-400 tabular-nums">{kinTempK} K ({kinTempK - 273} °C)</span>
                  </div>
                  <input type="range" min={260} max={620} step={5} value={kinTempK} onChange={(e) => setKinTempK(Number(e.target.value))} className="w-full accent-orange-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-sky-400 font-bold">[A] (M):</span>
                      <span className="font-mono text-slate-200">{concA.toFixed(1)}</span>
                    </div>
                    <input type="range" min={0.2} max={3.0} step={0.1} value={concA} onChange={(e) => setConcA(Number(e.target.value))} className="w-full accent-sky-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-rose-400 font-bold">[B] (M):</span>
                      <span className="font-mono text-slate-200">{concB.toFixed(1)}</span>
                    </div>
                    <input type="range" min={0.2} max={3.0} step={0.1} value={concB} onChange={(e) => setConcB(Number(e.target.value))} className="w-full accent-rose-500" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playLabSound('spark');
                    setHasCatalyst(!hasCatalyst);
                  }}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    hasCatalyst
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                      : isDark ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>{hasCatalyst ? t('المحفّز نشط (خفض Ea ✓)', 'Catalyst Active (Lower Ea ✓)') : t('إضافة مادة محفزة (Catalyst)', 'Add Catalyst')}</span>
                </button>
              </div>

              {/* Rate Readout */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">{t('طاقة التنشيط Ea', 'Activation Ea')}</span>
                  <strong className="font-mono text-amber-400 tabular-nums">{kinMetrics.activeEa} kJ</strong>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">{t('التصادم الفعّال', 'Effective Coll.')}</span>
                  <strong className="font-mono text-emerald-400 tabular-nums">{kinMetrics.boltzmannFraction}%</strong>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">{t('سرعة التفاعل Rate', 'Rate')}</span>
                  <strong className="font-mono text-cyan-400 tabular-nums">{kinMetrics.rate}</strong>
                </div>
              </div>
            </div>
          )}

          {mode === 'equilibrium' && (
            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Scale className="w-5 h-5 text-cyan-400" />
                  <span>{t('الاتزان الكيميائي ومبدأ لوشاتيليه', 'Equilibrium & Le Chatelier Lab')}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => openCalculator('equilibrium')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-xs font-bold flex items-center gap-1"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{t('حاسبة Keq', 'Keq Calc')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {EQUILIBRIUM_REACTIONS.map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => {
                      playLabSound('click');
                      setEqId(eq.id);
                      setEqReactantStress(1.0);
                      setEqProductStress(1.0);
                    }}
                    className={`p-2.5 rounded-xl border text-start transition-all ${
                      eqId === eq.id
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                        : isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{t(eq.nameAr, eq.nameEn)}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${eq.deltaHKj < 0 ? 'bg-orange-500/20 text-orange-300' : 'bg-sky-500/20 text-sky-300'}`}>
                        ΔH {eq.deltaHKj > 0 ? `+${eq.deltaHKj}` : eq.deltaHKj} kJ
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-amber-400 mt-0.5">{eq.equation}</div>
                  </button>
                ))}
              </div>

              {/* Le Chatelier Stress Controls */}
              <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-300">{t('حجم المكبس والضغط (V / P):', 'Piston Volume & Pressure:')}</span>
                    <span className="font-mono font-bold text-cyan-400 tabular-nums">{eqPistonVol}% ({eqMetrics.pressureAtm} Atm)</span>
                  </div>
                  <input type="range" min={25} max={100} step={5} value={eqPistonVol} onChange={(e) => setEqPistonVol(Number(e.target.value))} className="w-full accent-cyan-500" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-300">{t('درجة الحرارة (T):', 'Temperature (T):')}</span>
                    <span className="font-mono font-bold text-orange-400 tabular-nums">{eqTempK} K</span>
                  </div>
                  <input type="range" min={250} max={680} step={10} value={eqTempK} onChange={(e) => setEqTempK(Number(e.target.value))} className="w-full accent-orange-500" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEqReactantStress((v) => Math.min(3.0, Number((v + 0.5).toFixed(1))))}
                    className="py-1.5 px-2 rounded-lg bg-sky-600/20 border border-sky-500/40 text-sky-300 font-bold"
                  >
                    + {t('ضخ متفاعلات', 'Add Reactants')} ({eqReactantStress}x)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEqProductStress((v) => Math.min(3.0, Number((v + 0.5).toFixed(1))))}
                    className="py-1.5 px-2 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold"
                  >
                    + {t('ضخ نواتج', 'Add Products')} ({eqProductStress}x)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEqCatalyst(!eqCatalyst)}
                    className={`py-1.5 px-2 rounded-lg border font-bold ${
                      eqCatalyst ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    {eqCatalyst ? t('محفز مضاف (لا يغير Keq)', 'Catalyst ON (Keq Unchanged)') : t('إضافة محفز', 'Add Catalyst')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEqTempK(298);
                      setEqPistonVol(65);
                      setEqReactantStress(1.0);
                      setEqProductStress(1.0);
                      setEqCatalyst(false);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('إعادة الاتزان', 'Reset')}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">Keq(T)</span>
                  <strong className="font-mono text-cyan-400 tabular-nums">{eqMetrics.kEq}</strong>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">Q</span>
                  <strong className="font-mono text-amber-400 tabular-nums">{eqMetrics.qInstant}</strong>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] text-slate-400 block">{t('اتجاه الإزاحة', 'Shift')}</span>
                  <strong className="text-emerald-400 font-bold">
                    {eqMetrics.shiftDir === 'forward'
                      ? t('الأمام ⟶', 'Forward ⟶')
                      : eqMetrics.shiftDir === 'reverse'
                      ? t('⟵ العكسي', '⟵ Reverse')
                      : t('متزن ⇌', 'Balanced ⇌')}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {mode === 'stoichiometry' && (
            <div className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-base font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Gauge className="w-5 h-5 text-emerald-400" />
                  <span>{t('الحسابات الكيميائية والمادة المحددة', 'Stoichiometry & Limiting Reactant')}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => openCalculator('stoichiometry')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{t('حاسبة المول', 'Stoich Calc')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {STOICHIOMETRY_REACTIONS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      playLabSound('click');
                      setStoichId(st.id);
                    }}
                    className={`p-2.5 rounded-xl border text-start transition-all ${
                      stoichId === st.id
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold">{t(st.nameAr, st.nameEn)}</div>
                    <div className="text-[11px] font-mono text-cyan-400 mt-0.5">{st.equation}</div>
                  </button>
                ))}
              </div>

              <div className={`p-3.5 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-sky-400">{t(`كتلة ${activeStoich.reactantA.symbol} (g):`, `Mass of ${activeStoich.reactantA.symbol} (g):`)}</span>
                    <span className="font-mono text-white font-bold tabular-nums">{massA} g ({stoichMetrics.nA} mol)</span>
                  </div>
                  <input type="range" min={2} max={120} step={2} value={massA} onChange={(e) => setMassA(Number(e.target.value))} className="w-full accent-sky-500" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-rose-400">{t(`كتلة ${activeStoich.reactantB.symbol} (g):`, `Mass of ${activeStoich.reactantB.symbol} (g):`)}</span>
                    <span className="font-mono text-white font-bold tabular-nums">{massB} g ({stoichMetrics.nB} mol)</span>
                  </div>
                  <input type="range" min={2} max={160} step={2} value={massB} onChange={(e) => setMassB(Number(e.target.value))} className="w-full accent-rose-500" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-400">{t('نسبة المردود الفعلي (%):', 'Actual Percent Yield (%):')}</span>
                    <span className="font-mono text-emerald-300 font-bold tabular-nums">{actualYieldPct}%</span>
                  </div>
                  <input type="range" min={40} max={100} step={2} value={actualYieldPct} onChange={(e) => setActualYieldPct(Number(e.target.value))} className="w-full accent-emerald-500" />
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${isDark ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('المادة المحددة للتفاعل:', 'Limiting Reactant:')}</span>
                  </span>
                  <span className="font-mono text-sm text-white">
                    {stoichMetrics.limiting === 'exact'
                      ? t('نسبة متكافئة تامة', 'Stoichiometric Exact')
                      : stoichMetrics.limiting === 'A'
                      ? activeStoich.reactantA.symbol
                      : activeStoich.reactantB.symbol}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1 border-t border-slate-800/50">
                  <div>
                    <span className="text-slate-400 block">{t('المردود النظري:', 'Theoretical Yield:')}</span>
                    <strong className="text-cyan-400">{stoichMetrics.theoreticalYieldG} g ({stoichMetrics.nProductFormed} mol)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t('المردود الفعلي:', 'Actual Yield:')}</span>
                    <strong className="text-emerald-400">{stoichMetrics.actualYieldG} g</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main 2D / 3D Viewport (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className={`p-4 rounded-2xl border space-y-3 shadow-lg ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === '2d' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('مخطط بياني 2D', '2D Analytics Chart')}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === '3d' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Box className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{t('وعاء تفاعل 3D', '3D Reaction Vessel')}</span>
                </button>
              </div>

              <span className="text-xs font-mono font-bold text-cyan-400">
                {mode === 'kinetics'
                  ? activeKin.equation
                  : mode === 'equilibrium'
                  ? activeEq.equation
                  : activeStoich.equation}
              </span>
            </div>

            {viewMode === '3d' ? (
              <StageViewportFrame
                canvasHeightClass="h-[360px] sm:h-[400px]"
                accentColor="cyan"
                title={
                  <h3 className="text-sm font-bold">
                    {mode === 'kinetics'
                      ? t('غرفة التصادم الجزيئي 3D', '3D Molecular Collision Chamber')
                      : mode === 'equilibrium'
                      ? t('وعاء المكبس للاتزان 3D', '3D Equilibrium Piston Vessel')
                      : t('وعاء التفاعل والمادة المحددة 3D', '3D Stoichiometry Reaction Vessel')}
                  </h3>
                }
                toolbar={
                  <span dir="ltr" className="text-xs font-mono font-bold text-cyan-500">
                    {mode === 'kinetics'
                      ? activeKin.equation
                      : mode === 'equilibrium'
                      ? activeEq.equation
                      : activeStoich.equation}
                  </span>
                }
                bottomBar={
                  <span className="text-[11px]">
                    {mode === 'kinetics'
                      ? t('اسحب للتدوير · الحلقات الصفراء تمثل التصادمات الفعالة أعلى من Ea', 'Drag to orbit · Yellow rings show effective collisions above Ea')
                      : mode === 'equilibrium'
                      ? t('تحرك المكبس يغير الضغط واللون يعكس إزاحة لوشاتيليه', 'Piston adjusts pressure while vessel color reflects Le Chatelier shift')
                      : t('توزيع الجزيئات الناتجة والمادة الفائضة المتبقية داخل الوعاء', 'Proportional remaining excess reactant vs formed product spheres')}
                  </span>
                }
              >
                <div ref={mount3DRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
              </StageViewportFrame>
            ) : (
              /* 2D Analytical Charts per Curriculum Sub-Mode */
              <div className="w-full h-[380px] sm:h-[430px] rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between">
                {mode === 'kinetics' && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400">{t('منحنى طاقة التنشيط (Potential Energy Diagram)', 'Reaction Coordinate & Activation Energy')}</span>
                      <span className="font-mono text-amber-400">ΔH = {activeKin.deltaHKj} kJ/mol</span>
                    </div>
                    <svg viewBox="0 0 380 210" className="w-full h-64">
                      <line x1="35" y1="20" x2="35" y2="185" stroke="#475569" strokeWidth="1.5" />
                      <line x1="35" y1="185" x2="355" y2="185" stroke="#475569" strokeWidth="1.5" />
                      {/* Uncatalyzed Curve */}
                      <path
                        d={`M 45 120 Q 170 ${Math.max(22, 120 - activeKin.eaUncatKj * 0.6)} 340 ${activeKin.deltaHKj < 0 ? 155 : 95}`}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeDasharray={hasCatalyst ? '5 4' : 'none'}
                      />
                      {/* Catalyzed Curve */}
                      {hasCatalyst && (
                        <path
                          d={`M 45 120 Q 170 ${Math.max(48, 120 - activeKin.eaCatKj * 0.6)} 340 ${activeKin.deltaHKj < 0 ? 155 : 95}`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                        />
                      )}
                      <text x="50" y="112" fill="#38bdf8" fontSize="10" fontWeight="bold">{t('المتفاعلات', 'Reactants')}</text>
                      <text x="290" y={activeKin.deltaHKj < 0 ? 172 : 85} fill="#10b981" fontSize="10" fontWeight="bold">{t('النواتج', 'Products')}</text>
                      <text x="155" y={Math.max(18, 114 - activeKin.eaUncatKj * 0.35)} fill="#f43f5e" fontSize="9.5" fontFamily="monospace">Ea = {activeKin.eaUncatKj} kJ</text>
                      {hasCatalyst && (
                        <text x="155" y={Math.max(45, 115 - activeKin.eaCatKj * 0.35)} fill="#10b981" fontSize="9.5" fontFamily="monospace">Ea(cat) = {activeKin.eaCatKj} kJ</text>
                      )}
                    </svg>
                    <p className="text-xs text-slate-400 text-center">
                      {t('تُخفض المادة المحفزة حاجز طاقة التنشيط Ea فتزداد نسبة الجزيئات القادرة على التفاعل دون تغيير ΔH.', 'A catalyst lowers Ea so more molecules react effectively without altering ΔH.')}
                    </p>
                  </>
                )}

                {mode === 'equilibrium' && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400">{t('تغيّر التراكيز حتى الوصول للاتزان (Concentration vs Time)', 'Concentration vs Time to Equilibrium')}</span>
                      <span className="font-mono text-emerald-400">{t('النواتج', 'Products')}: {eqMetrics.productPct}%</span>
                    </div>
                    <svg viewBox="0 0 380 210" className="w-full h-64">
                      <line x1="35" y1="20" x2="35" y2="185" stroke="#475569" strokeWidth="1.5" />
                      <line x1="35" y1="185" x2="355" y2="185" stroke="#475569" strokeWidth="1.5" />
                      <path
                        d={eqTimeSeries
                          .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${40 + idx * 38} ${180 - pt.r * 1.45}`)
                          .join(' ')}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3"
                      />
                      <path
                        d={eqTimeSeries
                          .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${40 + idx * 38} ${180 - pt.p * 1.45}`)
                          .join(' ')}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                      />
                      <text x="275" y={180 - eqMetrics.reactantPct * 1.45 - 8} fill="#38bdf8" fontSize="10" fontWeight="bold">{t('المتفاعلات', 'Reactants')} {eqMetrics.reactantPct}%</text>
                      <text x="275" y={180 - eqMetrics.productPct * 1.45 - 8} fill="#10b981" fontSize="10" fontWeight="bold">{t('النواتج', 'Products')} {eqMetrics.productPct}%</text>
                    </svg>
                    <p className="text-xs text-slate-300 text-center">
                      {t(activeEq.descriptionAr, activeEq.descriptionEn)}
                    </p>
                  </>
                )}

                {mode === 'stoichiometry' && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400">{t('جدول المولات المحدد والفائض (Stoichiometric Balance)', 'Stoichiometric Mole Comparison')}</span>
                      <span className="font-mono text-cyan-400">{activeStoich.equation}</span>
                    </div>
                    <div className="space-y-4 my-auto px-2">
                      {[
                        {
                          label: `${activeStoich.reactantA.symbol} (${t('متبقي فائض', 'Remaining Excess')})`,
                          val: stoichMetrics.nARemaining,
                          total: stoichMetrics.nA,
                          color: 'bg-sky-500'
                        },
                        {
                          label: `${activeStoich.reactantB.symbol} (${t('متبقي فائض', 'Remaining Excess')})`,
                          val: stoichMetrics.nBRemaining,
                          total: stoichMetrics.nB,
                          color: 'bg-rose-500'
                        },
                        {
                          label: `${activeStoich.product.symbol} (${t('الناتج المتكوّن', 'Formed Product')})`,
                          val: stoichMetrics.nProductFormed,
                          total: Math.max(stoichMetrics.nA, stoichMetrics.nB, stoichMetrics.nProductFormed),
                          color: 'bg-emerald-500'
                        }
                      ].map((bar, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-200 font-bold">{bar.label}</span>
                            <span className="text-cyan-300">{bar.val} mol</span>
                          </div>
                          <div className="w-full h-3.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${bar.color} transition-all duration-300`}
                              style={{ width: `${Math.min(100, Math.round((bar.val / Math.max(0.01, bar.total)) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 text-center">
                      {t(
                        `المتبقي من ${activeStoich.reactantA.symbol}: ${stoichMetrics.massARemaining} g | المتبقي من ${activeStoich.reactantB.symbol}: ${stoichMetrics.massBRemaining} g`,
                        `Excess ${activeStoich.reactantA.symbol}: ${stoichMetrics.massARemaining} g | Excess ${activeStoich.reactantB.symbol}: ${stoichMetrics.massBRemaining} g`
                      )}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
