import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  BatteryCharging,
  Zap,
  Box,
  Calculator,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ELECTRODE_HALF_CELLS,
  ELECTROLYSIS_ELECTROLYTES
} from '../data/chemistry3CurriculumData';
import { playLabSound } from '../utils/soundEffects';
import { StageViewportFrame } from './StageViewportFrame';

interface ElectrochemistryCellLabProps {
  soundEnabled?: boolean;
}

export const ElectrochemistryCellLab: React.FC<ElectrochemistryCellLabProps> = ({
  soundEnabled = true
}) => {
  const { theme, t, lang, openCalculator } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [cellMode, setCellMode] = useState<'galvanic' | 'electrolysis'>('galvanic');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simProgress, setSimProgress] = useState<number>(0.25); // 0..1 plating/consumption progression

  // Galvanic Cell State
  const [leftCellId, setLeftCellId] = useState<string>('Zn');
  const [rightCellId, setRightCellId] = useState<string>('Cu');
  const [leftConcM, setLeftConcM] = useState<number>(1.0);
  const [rightConcM, setRightConcM] = useState<number>(1.0);
  const [tempC, setTempC] = useState<number>(25);

  // Electrolysis State
  const [electrolyteId, setElectrolyteId] = useState<string>('cuso4_aq');
  const [appliedVoltage, setAppliedVoltage] = useState<number>(4.5);
  const [currentAmps, setCurrentAmps] = useState<number>(2.5);
  const [durationMin, setDurationMin] = useState<number>(30);

  const leftCell = useMemo(
    () => ELECTRODE_HALF_CELLS.find((c) => c.id === leftCellId) || ELECTRODE_HALF_CELLS[3],
    [leftCellId]
  );
  const rightCell = useMemo(
    () => ELECTRODE_HALF_CELLS.find((c) => c.id === rightCellId) || ELECTRODE_HALF_CELLS[8],
    [rightCellId]
  );

  // Galvanic Nernst Calculations
  const galvanicStats = useMemo(() => {
    // Spontaneous direction: lower E0 oxidizes (anode), higher E0 reduces (cathode)
    const isLeftAnode = leftCell.e0 <= rightCell.e0;
    const anode = isLeftAnode ? leftCell : rightCell;
    const cathode = isLeftAnode ? rightCell : leftCell;
    const anodeConc = isLeftAnode ? leftConcM : rightConcM;
    const cathodeConc = isLeftAnode ? rightConcM : leftConcM;

    const e0Cell = Number((cathode.e0 - anode.e0).toFixed(3));
    const nLcm = anode.nElectrons === cathode.nElectrons ? anode.nElectrons : anode.nElectrons * cathode.nElectrons;
    const T = tempC + 273.15;
    const R = 8.314;
    const F = 96485;

    // Q = [AnodeIon]^(n/nA) / [CathodeIon]^(n/nC)
    const expA = nLcm / anode.nElectrons;
    const expC = nLcm / cathode.nElectrons;
    const Q = Math.pow(anodeConc, expA) / Math.max(1e-4, Math.pow(cathodeConc, expC));
    const eCell = e0Cell === 0 ? 0 : Number((e0Cell - ((R * T) / (nLcm * F)) * Math.log(Q)).toFixed(3));
    const deltaGKj = Number(((-nLcm * F * eCell) / 1000).toFixed(2));

    return {
      isLeftAnode,
      anode,
      cathode,
      e0Cell,
      eCell,
      nLcm,
      Q: Number(Q.toFixed(3)),
      deltaGKj,
      isSpontaneous: eCell > 0.01
    };
  }, [leftCell, rightCell, leftConcM, rightConcM, tempC]);

  // Electrolytic Faraday Calculations
  const activeElectrolyte = useMemo(
    () => ELECTROLYSIS_ELECTROLYTES.find((e) => e.id === electrolyteId) || ELECTROLYSIS_ELECTROLYTES[0],
    [electrolyteId]
  );

  const electrolysisStats = useMemo(() => {
    const isPowered = appliedVoltage >= activeElectrolyte.minVoltage;
    const chargeC = isPowered ? currentAmps * (durationMin * 60) : 0;
    const F = 96485;
    const molesE = chargeC / F;
    const massDepositedG = (molesE * activeElectrolyte.cathodeMolarMass) / activeElectrolyte.nElectrons;
    return {
      isPowered,
      chargeC: Math.round(chargeC),
      molesE: Number(molesE.toFixed(3)),
      massDepositedG: Number(massDepositedG.toFixed(3))
    };
  }, [activeElectrolyte, appliedVoltage, currentAmps, durationMin]);

  // Increment progress slowly when running
  useEffect(() => {
    if (!isRunning) return;
    const active =
      cellMode === 'galvanic' ? galvanicStats.isSpontaneous : electrolysisStats.isPowered;
    if (!active) return;

    const timer = window.setInterval(() => {
      setSimProgress((p) => (p >= 1 ? 0.1 : Number((p + 0.025).toFixed(3))));
    }, 350);
    return () => clearInterval(timer);
  }, [isRunning, cellMode, galvanicStats.isSpontaneous, electrolysisStats.isPowered]);

  // ---------- 3D THREE.JS BENCH ----------
  const mount3DRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({
    cellMode,
    isRunning,
    simProgress,
    leftCell,
    rightCell,
    galvanicStats,
    activeElectrolyte,
    electrolysisStats
  });
  stateRef.current = {
    cellMode,
    isRunning,
    simProgress,
    leftCell,
    rightCell,
    galvanicStats,
    activeElectrolyte,
    electrolysisStats
  };

  useEffect(() => {
    if (viewMode !== '3d') return;
    const container = mount3DRef.current;
    if (!container) return;

    const width = container.clientWidth || 460;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.0, 7.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

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
    controls.maxDistance = 13;

    const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.72 : 1.05);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    // Bench Base
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.24, 3.2),
      new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.65, roughness: 0.35 })
    );
    bench.position.set(0, -1.75, 0);
    scene.add(bench);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#e0f2fe',
      transparent: true,
      opacity: 0.2,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // ---- GALVANIC GROUP ----
    const galvanicGroup = new THREE.Group();
    scene.add(galvanicGroup);

    const leftBeakerGlass = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 36, 1, true), glassMat);
    leftBeakerGlass.position.set(-1.75, -0.5, 0);
    const rightBeakerGlass = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 36, 1, true), glassMat);
    rightBeakerGlass.position.set(1.75, -0.5, 0);
    galvanicGroup.add(leftBeakerGlass, rightBeakerGlass);

    const leftSolMat = new THREE.MeshPhysicalMaterial({ color: '#cbd5e1', transparent: true, opacity: 0.48, roughness: 0.15 });
    const rightSolMat = new THREE.MeshPhysicalMaterial({ color: '#0ea5e9', transparent: true, opacity: 0.48, roughness: 0.15 });
    const leftSol = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.04, 1.65, 32), leftSolMat);
    leftSol.position.set(-1.75, -0.75, 0);
    const rightSol = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.04, 1.65, 32), rightSolMat);
    rightSol.position.set(1.75, -0.75, 0);
    galvanicGroup.add(leftSol, rightSol);

    const leftPlateMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.85, roughness: 0.25 });
    const rightPlateMat = new THREE.MeshStandardMaterial({ color: '#ea580c', metalness: 0.85, roughness: 0.25 });
    const leftPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.9, 0.14), leftPlateMat);
    leftPlate.position.set(-2.15, -0.15, 0);
    const rightPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.9, 0.14), rightPlateMat);
    rightPlate.position.set(2.15, -0.15, 0);
    galvanicGroup.add(leftPlate, rightPlate);

    // U-Shaped Salt Bridge
    const bridgeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.35, -0.8, 0),
      new THREE.Vector3(-1.35, 0.72, 0),
      new THREE.Vector3(0, 0.92, 0),
      new THREE.Vector3(1.35, 0.72, 0),
      new THREE.Vector3(1.35, -0.8, 0)
    ]);
    const saltBridge = new THREE.Mesh(
      new THREE.TubeGeometry(bridgeCurve, 40, 0.16, 16, false),
      glassMat
    );
    galvanicGroup.add(saltBridge);

    // Overhead Wire + Voltmeter Box
    const wireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.15, 0.82, 0),
      new THREE.Vector3(-2.15, 1.85, 0),
      new THREE.Vector3(0, 2.05, 0),
      new THREE.Vector3(2.15, 1.85, 0),
      new THREE.Vector3(2.15, 0.82, 0)
    ]);
    const wireMesh = new THREE.Mesh(
      new THREE.TubeGeometry(wireCurve, 44, 0.045, 12, false),
      new THREE.MeshStandardMaterial({ color: '#b45309', metalness: 0.85, roughness: 0.22 })
    );
    galvanicGroup.add(wireMesh);

    const meterBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.65, 0.45),
      new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.5, roughness: 0.35 })
    );
    meterBox.position.set(0, 2.05, 0);
    const meterScreenMat = new THREE.MeshBasicMaterial({ color: '#06b6d4' });
    const meterScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 0.36),
      meterScreenMat
    );
    meterScreen.position.set(0, 2.05, 0.24);
    galvanicGroup.add(meterBox, meterScreen);

    // Animated Electron Beads along wireCurve
    const electronGeo = new THREE.SphereGeometry(0.085, 12, 12);
    const electronMat = new THREE.MeshBasicMaterial({ color: '#fde047' });
    const electronBeads: THREE.Mesh[] = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(electronGeo, electronMat);
      galvanicGroup.add(m);
      electronBeads.push(m);
    }

    // Salt bridge ions (K+ and NO3-)
    const ionGeo = new THREE.SphereGeometry(0.065, 10, 10);
    const cationMat = new THREE.MeshBasicMaterial({ color: '#a855f7' });
    const anionMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const saltIons: Array<{ mesh: THREE.Mesh; t: number; isCation: boolean }> = [];
    for (let i = 0; i < 8; i++) {
      const isCat = i % 2 === 0;
      const m = new THREE.Mesh(ionGeo, isCat ? cationMat : anionMat);
      galvanicGroup.add(m);
      saltIons.push({ mesh: m, t: i / 8, isCation: isCat });
    }

    // ---- ELECTROLYSIS GROUP ----
    const electrolysisGroup = new THREE.Group();
    scene.add(electrolysisGroup);

    const singleTank = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 2.3, 44, 1, true), glassMat);
    singleTank.position.set(0, -0.48, 0);
    electrolysisGroup.add(singleTank);

    const elecSolMat = new THREE.MeshPhysicalMaterial({ color: '#0284c7', transparent: true, opacity: 0.48, roughness: 0.15 });
    const elecSol = new THREE.Mesh(new THREE.CylinderGeometry(2.08, 2.08, 1.75, 40), elecSolMat);
    elecSol.position.set(0, -0.72, 0);
    electrolysisGroup.add(elecSol);

    const anodeElecMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.35 });
    const cathodeElecMat = new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.75, roughness: 0.3 });
    const elecLeftBar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.95, 0.16), anodeElecMat);
    elecLeftBar.position.set(-1.15, -0.1, 0);
    const elecRightBar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.95, 0.16), cathodeElecMat);
    elecRightBar.position.set(1.15, -0.1, 0);
    electrolysisGroup.add(elecLeftBar, elecRightBar);

    const elecPlatingMat = new THREE.MeshStandardMaterial({ color: '#ea580c', metalness: 0.9, roughness: 0.18 });
    const elecPlatingShell = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.35, 0.22), elecPlatingMat);
    elecPlatingShell.position.set(1.15, -0.4, 0);
    electrolysisGroup.add(elecPlatingShell);

    const elecWireCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.15, 0.88, 0),
      new THREE.Vector3(-1.15, 1.88, 0),
      new THREE.Vector3(0, 2.05, 0),
      new THREE.Vector3(1.15, 1.88, 0),
      new THREE.Vector3(1.15, 0.88, 0)
    ]);
    const elecWireMesh = new THREE.Mesh(
      new THREE.TubeGeometry(elecWireCurve, 36, 0.045, 12, false),
      new THREE.MeshStandardMaterial({ color: '#b45309', metalness: 0.85, roughness: 0.22 })
    );
    const dcBattery = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.65, 0.45),
      new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.6, roughness: 0.3 })
    );
    dcBattery.position.set(0, 2.05, 0);
    const dcLedMat = new THREE.MeshBasicMaterial({ color: '#10b981' });
    const dcLed = new THREE.Mesh(
      new THREE.PlaneGeometry(0.8, 0.32),
      dcLedMat
    );
    dcLed.position.set(0, 2.05, 0.24);
    electrolysisGroup.add(elecWireMesh, dcBattery, dcLed);

    const elecBeads: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(electronGeo, electronMat);
      electrolysisGroup.add(m);
      elecBeads.push(m);
    }

    // Gas Bubbles pool for Electrolysis
    const bubbleGeo = new THREE.SphereGeometry(0.055, 10, 10);
    const bubbleMat = new THREE.MeshPhysicalMaterial({ color: '#f8fafc', transparent: true, opacity: 0.75, roughness: 0.05 });
    const bubbles: Array<{ mesh: THREE.Mesh; side: 'anode' | 'cathode'; y: number; speed: number }> = [];
    for (let i = 0; i < 24; i++) {
      const side = i < 12 ? 'anode' : 'cathode';
      const m = new THREE.Mesh(bubbleGeo, bubbleMat);
      m.position.set((side === 'anode' ? -1.15 : 1.15) + (Math.random() - 0.5) * 0.45, -1.4 + Math.random() * 1.4, (Math.random() - 0.5) * 0.3);
      electrolysisGroup.add(m);
      bubbles.push({ mesh: m, side, y: m.position.y, speed: 0.018 + Math.random() * 0.015 });
    }

    let animId = 0;
    let phaseT = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;

      const cur = stateRef.current;
      phaseT += 0.008;

      galvanicGroup.visible = cur.cellMode === 'galvanic';
      electrolysisGroup.visible = cur.cellMode === 'electrolysis';

      if (cur.cellMode === 'galvanic') {
        leftSolMat.color.set(cur.leftCell.solutionColor);
        rightSolMat.color.set(cur.rightCell.solutionColor);
        leftPlateMat.color.set(cur.leftCell.metalColor);
        rightPlateMat.color.set(cur.rightCell.metalColor);

        // Anode thins subtly while Cathode grows
        const pScale = cur.simProgress * 0.25;
        if (cur.galvanicStats.isLeftAnode) {
          leftPlate.scale.set(1 - pScale, 1, 1 - pScale);
          rightPlate.scale.set(1 + pScale, 1, 1 + pScale);
        } else {
          leftPlate.scale.set(1 + pScale, 1, 1 + pScale);
          rightPlate.scale.set(1 - pScale, 1, 1 - pScale);
        }

        const flowing = cur.isRunning && cur.galvanicStats.isSpontaneous;
        meterScreenMat.color.set(flowing ? '#06b6d4' : '#475569');

        electronBeads.forEach((b, idx) => {
          b.visible = flowing;
          if (!flowing) return;
          const rawT = (phaseT + idx / electronBeads.length) % 1;
          const u = cur.galvanicStats.isLeftAnode ? rawT : 1 - rawT;
          b.position.copy(wireCurve.getPointAt(u));
        });

        saltIons.forEach((ion) => {
          ion.mesh.visible = flowing;
          if (!flowing) return;
          const dir = cur.galvanicStats.isLeftAnode
            ? ion.isCation ? 1 : -1
            : ion.isCation ? -1 : 1;
          ion.t = (ion.t + dir * 0.003 + 1) % 1;
          ion.mesh.position.copy(bridgeCurve.getPointAt(ion.t));
        });
      } else {
        elecSolMat.color.set(cur.activeElectrolyte.solutionColor);
        elecPlatingMat.color.set(cur.activeElectrolyte.depositedMetalColor);

        const active = cur.isRunning && cur.electrolysisStats.isPowered;
        dcLedMat.color.set(active ? '#10b981' : '#ef4444');
        const showPlating = !cur.activeElectrolyte.hasCathodeGas && active;
        elecPlatingShell.visible = !cur.activeElectrolyte.hasCathodeGas;
        elecPlatingShell.scale.set(1 + (showPlating ? cur.simProgress * 0.32 : 0), 1, 1 + (showPlating ? cur.simProgress * 0.32 : 0));

        elecBeads.forEach((b, idx) => {
          b.visible = active;
          if (!active) return;
          const u = (phaseT * 1.4 + idx / elecBeads.length) % 1;
          b.position.copy(elecWireCurve.getPointAt(u));
        });

        bubbles.forEach((bub) => {
          const shouldBubble =
            active &&
            ((bub.side === 'anode' && cur.activeElectrolyte.hasAnodeGas) ||
              (bub.side === 'cathode' && cur.activeElectrolyte.hasCathodeGas));
          bub.mesh.visible = shouldBubble;
          if (!shouldBubble) return;
          bub.y += bub.speed;
          if (bub.y > 0.1) bub.y = -1.45;
          bub.mesh.position.y = bub.y;
        });
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
      glassMat.dispose();
      leftSolMat.dispose();
      rightSolMat.dispose();
      leftPlateMat.dispose();
      rightPlateMat.dispose();
      electronGeo.dispose();
      electronMat.dispose();
      ionGeo.dispose();
      cationMat.dispose();
      anionMat.dispose();
      elecSolMat.dispose();
      anodeElecMat.dispose();
      cathodeElecMat.dispose();
      elecPlatingMat.dispose();
      bubbleGeo.dispose();
      bubbleMat.dispose();
      meterScreenMat.dispose();
      dcLedMat.dispose();
      envRT.dispose();
      renderer.dispose();
    };
  }, [viewMode, isDark]);

  return (
    <div className={`rounded-2xl p-4 md:p-6 shadow-xl space-y-5 border ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Bar: Galvanic vs Electrolysis & 2D/3D Switcher */}
      <div className={`flex flex-wrap items-center justify-between gap-3 pb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className={`inline-flex p-1 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playLabSound('click');
                setCellMode('galvanic');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                cellMode === 'galvanic' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BatteryCharging className="w-4 h-4" />
              <span>{t('الخلية الجلفانية ومعادلة نرنست', 'Galvanic Cell & Nernst')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (soundEnabled) playLabSound('click');
                setCellMode('electrolysis');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                cellMode === 'electrolysis' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{t('التحليل الكهربائي وفاراداي', 'Electrolysis & Faraday')}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === '2d' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('مخطط 2D', '2D Diagram')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === '3d' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-cyan-300" />
              <span>{t('خلية 3D', '3D Cell')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              isRunning ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? t('إيقاف الدائرة', 'Pause') : t('تشغيل الدائرة', 'Run')}</span>
          </button>

          <button
            type="button"
            onClick={() => setSimProgress(0.1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            title={t('إعادة الأقطاب', 'Reset Electrodes')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {cellMode === 'galvanic' ? (
            <>
              <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-cyan-400">{t('اختيار نصفي الخلية والأقطاب:', 'Select Half-Cells:')}</span>
                  <button
                    type="button"
                    onClick={() => openCalculator('nernst')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>{t('حاسبة نرنست', 'Nernst Calc')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">{t('القطب الأيسر:', 'Left Electrode:')}</label>
                    <select
                      value={leftCellId}
                      onChange={(e) => setLeftCellId(e.target.value)}
                      className={`w-full p-2 rounded-xl border font-bold text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                    >
                      {ELECTRODE_HALF_CELLS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.metalSymbol} | {c.ionFormula} ({c.e0 >= 0 ? `+${c.e0}` : c.e0} V)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">{t('القطب الأيمن:', 'Right Electrode:')}</label>
                    <select
                      value={rightCellId}
                      onChange={(e) => setRightCellId(e.target.value)}
                      className={`w-full p-2 rounded-xl border font-bold text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                    >
                      {ELECTRODE_HALF_CELLS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.metalSymbol} | {c.ionFormula} ({c.e0 >= 0 ? `+${c.e0}` : c.e0} V)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Concentrations & Temperature for Nernst */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">[ {leftCell.ionFormula} ] ({t('اليسار', 'Left')}):</span>
                      <span className="font-mono text-cyan-400 font-bold">{leftConcM.toFixed(2)} M</span>
                    </div>
                    <input type="range" min={0.01} max={2.5} step={0.05} value={leftConcM} onChange={(e) => setLeftConcM(Number(e.target.value))} className="w-full accent-cyan-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">[ {rightCell.ionFormula} ] ({t('اليمين', 'Right')}):</span>
                      <span className="font-mono text-amber-400 font-bold">{rightConcM.toFixed(2)} M</span>
                    </div>
                    <input type="range" min={0.01} max={2.5} step={0.05} value={rightConcM} onChange={(e) => setRightConcM(Number(e.target.value))} className="w-full accent-amber-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">{t('درجة الحرارة (T):', 'Temperature (T):')}</span>
                      <span className="font-mono text-orange-400 font-bold">{tempC} °C ({tempC + 273} K)</span>
                    </div>
                    <input type="range" min={5} max={85} step={5} value={tempC} onChange={(e) => setTempC(Number(e.target.value))} className="w-full accent-orange-500" />
                  </div>
                </div>
              </div>

              {/* Galvanic Telemetry & Half-Reactions */}
              <div className={`p-4 rounded-xl border space-y-3 text-xs ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 block">E°cell</span>
                    <strong className="font-mono text-sm text-cyan-400 tabular-nums">+{galvanicStats.e0Cell.toFixed(2)} V</strong>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 block">Ecell (Nernst)</span>
                    <strong className="font-mono text-sm text-emerald-400 tabular-nums">{galvanicStats.eCell.toFixed(3)} V</strong>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 block">ΔG</span>
                    <strong className="font-mono text-sm text-amber-400 tabular-nums">{galvanicStats.deltaGKj} kJ</strong>
                  </div>
                </div>

                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300">
                    <strong>{t('المصعد (أكسدة - Anode):', 'Anode (Oxidation):')}</strong> {galvanicStats.anode.metalSymbol} → {galvanicStats.anode.ionFormula} + {galvanicStats.anode.nElectrons}e⁻
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                    <strong>{t('المهبط (اختزال - Cathode):', 'Cathode (Reduction):')}</strong> {galvanicStats.cathode.halfReaction}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-cyan-300 text-center">
                  {t('الرمز الاصطلاحي للخلية:', 'Cell Notation:')}{' '}
                  {galvanicStats.anode.metalSymbol}(s) | {galvanicStats.anode.ionFormula}({leftConcM}M) || {galvanicStats.cathode.ionFormula}({rightConcM}M) | {galvanicStats.cathode.metalSymbol}(s)
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Electrolysis Controls */}
              <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-400">{t('اختيار محلول / مصهور التحليل الكهربائي:', 'Select Electrolyte:')}</span>
                  <button
                    type="button"
                    onClick={() => openCalculator('faraday')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[11px] font-bold flex items-center gap-1"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>{t('حاسبة فاراداي', 'Faraday Calc')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {ELECTROLYSIS_ELECTROLYTES.map((el) => (
                    <button
                      key={el.id}
                      type="button"
                      onClick={() => {
                        if (soundEnabled) playLabSound('click');
                        setElectrolyteId(el.id);
                      }}
                      className={`p-2.5 rounded-xl border text-start transition-all ${
                        electrolyteId === el.id
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                          : isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{t(el.nameAr, el.nameEn)}</span>
                        <span className="font-mono text-cyan-400">Vmin = {el.minVoltage}V</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{t('جهد البطارية المطبق (V):', 'Applied DC Voltage (V):')}</span>
                      <span className={`font-mono font-bold ${electrolysisStats.isPowered ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {appliedVoltage.toFixed(1)} V
                      </span>
                    </div>
                    <input type="range" min={0.5} max={9.0} step={0.2} value={appliedVoltage} onChange={(e) => setAppliedVoltage(Number(e.target.value))} className="w-full accent-amber-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{t('شدة التيار (I):', 'Current (I):')}</span>
                      <span className="font-mono font-bold text-cyan-400">{currentAmps.toFixed(1)} A</span>
                    </div>
                    <input type="range" min={0.5} max={10} step={0.5} value={currentAmps} onChange={(e) => setCurrentAmps(Number(e.target.value))} className="w-full accent-cyan-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{t('زمن التشغيل (t):', 'Duration (t):')}</span>
                      <span className="font-mono font-bold text-slate-200">{durationMin} min</span>
                    </div>
                    <input type="range" min={5} max={120} step={5} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="w-full accent-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Electrolysis Faraday Readout */}
              <div className={`p-4 rounded-xl border space-y-2 text-xs ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 block">{t('الشحنة Q', 'Charge Q')}</span>
                    <strong className="font-mono text-cyan-400 tabular-nums">{electrolysisStats.chargeC} C</strong>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 block">{t('مولات e⁻', 'Moles e⁻')}</span>
                    <strong className="font-mono text-amber-400 tabular-nums">{electrolysisStats.molesE}</strong>
                  </div>
                  <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 block">{t('الكتلة المترسبة', 'Mass Deposited')}</span>
                    <strong className="font-mono text-emerald-400 tabular-nums">{electrolysisStats.massDepositedG} g</strong>
                  </div>
                </div>
                <div className="font-mono text-[11px] space-y-1 pt-1">
                  <div className="text-emerald-300">
                    <strong>{t('المهبط (-):', 'Cathode (-):')}</strong> {activeElectrolyte.cathodeReaction}
                  </div>
                  <div className="text-rose-300">
                    <strong>{t('المصعد (+):', 'Anode (+):')}</strong> {activeElectrolyte.anodeReaction}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 2D / 3D Visualization Viewport (7 cols) */}
        <div className="lg:col-span-7">
          {viewMode === '3d' ? (
            <StageViewportFrame
              canvasHeightClass="h-[380px] sm:h-[420px]"
              accentColor={cellMode === 'galvanic' ? 'cyan' : 'amber'}
              title={
                <h3 className="text-sm font-bold">
                  {cellMode === 'galvanic'
                    ? t('الخلية الجلفانية ثلاثية الأبعاد', '3D Galvanic Cell')
                    : t('خلية التحليل الكهربائي 3D', '3D Electrolytic Cell')}
                </h3>
              }
              toolbar={
                <span dir="ltr" className="text-xs font-mono font-bold text-cyan-500 tabular-nums">
                  {cellMode === 'galvanic'
                    ? `Ecell = ${galvanicStats.eCell.toFixed(3)} V`
                    : `${appliedVoltage.toFixed(1)} V · ${electrolysisStats.massDepositedG} g`}
                </span>
              }
              bottomBar={
                <span className="text-[11px]">
                  {cellMode === 'galvanic'
                    ? t('سريان الإلكترونات من المصعد إلى المهبط · حركة أيونات القنطرة الملحية 3D', 'Electrons flow Anode → Cathode · Salt Bridge ion drift')
                    : t('التحليل الكهربائي 3D: ترسب فلزي على المهبط وتصاعد فقاعات الغاز', '3D Electrolysis: Cathode metal plating & gas evolution')}
                </span>
              }
            >
              <div ref={mount3DRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </StageViewportFrame>
          ) : (
            /* 2D Schematic Cell View */
            <div className="w-full h-[420px] sm:h-[460px] rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400">
                  {cellMode === 'galvanic'
                    ? t('مخطط الخلية الجلفانية القياسية', '2D Galvanic Cell Schematic')
                    : t('مخطط خلية التحليل الكهربائي', '2D Electrolytic Cell Schematic')}
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {cellMode === 'galvanic'
                    ? `e⁻ Flow: ${galvanicStats.anode.metalSymbol} → ${galvanicStats.cathode.metalSymbol}`
                    : `m = ${electrolysisStats.massDepositedG} g`}
                </span>
              </div>

              <svg viewBox="0 0 420 240" className="w-full h-72">
                {cellMode === 'galvanic' ? (
                  <g>
                    {/* External Circuit */}
                    <path d="M 95 75 L 95 28 L 325 28 L 325 75" fill="none" stroke="#f59e0b" strokeWidth="3" />
                    <rect x="175" y="12" width="70" height="32" rx="6" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                    <text x="210" y="32" fill="#22d3ee" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      {galvanicStats.eCell.toFixed(2)} V
                    </text>
                    {/* Beakers */}
                    <rect x="45" y="95" width="110" height="115" rx="8" fill={leftCell.solutionColor} fillOpacity="0.25" stroke="#64748b" strokeWidth="2.5" />
                    <rect x="265" y="95" width="110" height="115" rx="8" fill={rightCell.solutionColor} fillOpacity="0.25" stroke="#64748b" strokeWidth="2.5" />
                    {/* Salt Bridge */}
                    <path d="M 135 140 L 135 65 L 285 65 L 285 140" fill="none" stroke="#cbd5e1" strokeWidth="14" strokeOpacity="0.35" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="210" y="70" fill="#e2e8f0" fontSize="9.5" textAnchor="middle" fontFamily="monospace">K⁺ / NO₃⁻</text>
                    {/* Electrodes */}
                    <rect x="82" y="75" width="26" height="105" rx="3" fill={leftCell.metalColor} stroke="#e2e8f0" strokeWidth="1.5" />
                    <rect x="312" y="75" width="26" height="105" rx="3" fill={rightCell.metalColor} stroke="#e2e8f0" strokeWidth="1.5" />
                    <text x="95" y="226" fill={galvanicStats.isLeftAnode ? '#fb7185' : '#34d399'} fontSize="11" fontWeight="bold" textAnchor="middle">
                      {leftCell.metalSymbol} ({galvanicStats.isLeftAnode ? 'Anode −' : 'Cathode +'})
                    </text>
                    <text x="325" y="226" fill={!galvanicStats.isLeftAnode ? '#fb7185' : '#34d399'} fontSize="11" fontWeight="bold" textAnchor="middle">
                      {rightCell.metalSymbol} ({!galvanicStats.isLeftAnode ? 'Anode −' : 'Cathode +'})
                    </text>
                  </g>
                ) : (
                  <g>
                    {/* DC Battery Circuit */}
                    <path d="M 135 75 L 135 28 L 285 28 L 285 75" fill="none" stroke="#f59e0b" strokeWidth="3" />
                    <rect x="170" y="12" width="80" height="32" rx="6" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
                    <text x="210" y="32" fill="#34d399" fontSize="11.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      DC {appliedVoltage.toFixed(1)}V
                    </text>
                    {/* Single Tank */}
                    <rect x="90" y="95" width="240" height="115" rx="10" fill={activeElectrolyte.solutionColor} fillOpacity="0.28" stroke="#64748b" strokeWidth="2.5" />
                    <rect x="122" y="75" width="26" height="105" rx="3" fill="#475569" stroke="#f43f5e" strokeWidth="1.8" />
                    <rect x="272" y="75" width="26" height="105" rx="3" fill={activeElectrolyte.depositedMetalColor} stroke="#10b981" strokeWidth="1.8" />
                    <text x="135" y="226" fill="#fb7185" fontSize="11" fontWeight="bold" textAnchor="middle">
                      Anode (+) · {t(activeElectrolyte.anodeProductAr, activeElectrolyte.anodeProductEn)}
                    </text>
                    <text x="285" y="226" fill="#34d399" fontSize="11" fontWeight="bold" textAnchor="middle">
                      Cathode (−)
                    </text>
                  </g>
                )}
              </svg>

              <p className="text-xs text-slate-400 text-center">
                {cellMode === 'galvanic'
                  ? t('القنطرة الملحية تمنع تراكم الشحنات وتسمح باستمرار سريان الإلكترونات.', 'The salt bridge maintains electrical neutrality so electron flow continues.')
                  : t(activeElectrolyte.cathodeProductAr, activeElectrolyte.cathodeProductEn)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
