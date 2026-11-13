import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Flame,
  Wind,
  Zap,
  Orbit,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { playLabSound } from '../../../utils/soundEffects';
import { createOptics3DScene, Optics3DParams, Optics3DSceneInstance } from './Optics3DScene';
import {
  createMechanics3DScene,
  MECHANICS_FLUID_DENSITIES,
  MECHANICS_OBJECT_DENSITIES,
  Mechanics3DParams,
  Mechanics3DSceneInstance,
} from './Mechanics3DScene';
import {
  createThermodynamics3DScene,
  GAS_MOLAR_MASS,
  Thermodynamics3DParams,
  Thermodynamics3DSceneInstance,
} from './Thermodynamics3DScene';
import {
  createElectrostatics3DScene,
  Electrostatics3DParams,
  Electrostatics3DSceneInstance,
} from './Electrostatics3DScene';

interface ThreePhysicsStageProps {
  station: 'mechanics' | 'thermodynamics' | 'electromagnetism' | 'optics_quantum';
  onSwitchTo2D?: () => void;
  initialOpticsMode?: 'prism' | 'lens' | 'snell';
}

interface StationCameraRig {
  perspective: { pos: [number, number, number]; target: [number, number, number] };
  front: { pos: [number, number, number]; target: [number, number, number] };
  top: { pos: [number, number, number]; target: [number, number, number] };
  side: { pos: [number, number, number]; target: [number, number, number] };
}

const STATION_CAMERAS: Record<ThreePhysicsStageProps['station'], StationCameraRig> = {
  mechanics: {
    perspective: { pos: [5.9, 4.3, 8.4], target: [-0.2, 2.25, 0] },
    front: { pos: [-0.2, 2.5, 9.2], target: [-0.2, 2.25, 0] },
    top: { pos: [-0.2, 9.8, 0.25], target: [-0.2, 1.5, 0] },
    side: { pos: [8.8, 2.5, 0], target: [-0.2, 2.25, 0] },
  },
  optics_quantum: {
    perspective: { pos: [3.7, 3.1, 7.1], target: [0.1, 1.3, 0] },
    front: { pos: [0.1, 1.7, 7.6], target: [0.1, 1.3, 0] },
    top: { pos: [0.1, 8.4, 0.2], target: [0.1, 1.2, 0] },
    side: { pos: [7.8, 1.9, 0], target: [0.1, 1.3, 0] },
  },
  thermodynamics: {
    perspective: { pos: [4.7, 3.6, 6.2], target: [0.2, 1.85, 0] },
    front: { pos: [0.2, 2.2, 7.2], target: [0.2, 1.85, 0] },
    top: { pos: [0.2, 8.6, 0.2], target: [0.2, 1.4, 0] },
    side: { pos: [7.2, 2.2, 0], target: [0.2, 1.85, 0] },
  },
  electromagnetism: {
    perspective: { pos: [0.0, 3.8, 8.0], target: [0, 1.55, 0] },
    front: { pos: [0.0, 1.85, 8.4], target: [0, 1.55, 0] },
    top: { pos: [0.0, 8.8, 0.2], target: [0, 1.5, 0] },
    side: { pos: [8.4, 2.1, 0], target: [0, 1.55, 0] },
  },
};

export const ThreePhysicsStage: React.FC<ThreePhysicsStageProps> = ({
  station,
  onSwitchTo2D,
  initialOpticsMode,
}) => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const mountRef = useRef<HTMLDivElement | null>(null);

  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 1. Optics Parameters
  const [opticsParams, setOpticsParams] = useState<Optics3DParams>({
    lightMode: 'white',
    laserWavelength: 532,
    prismAngle: 6,
    prismMaterial: 'flint',
    elementMode: initialOpticsMode || 'lens',
    lensType: 'convex',
    lensFocalLength: 1.8,
    screenDistance: 2.8,
    beamSpread: 0.45,
    snellN1: 1.0003,
    snellN2: 1.333,
    snellTheta1Deg: 45,
  });

  // Sync element mode if prop changes externally
  useEffect(() => {
    if (initialOpticsMode) {
      setOpticsParams((p) => ({ ...p, elementMode: initialOpticsMode }));
    }
  }, [initialOpticsMode]);

  // 2. Mechanics Parameters
  const [mechanicsParams, setMechanicsParams] = useState<Mechanics3DParams>({
    submersionPercent: 65,
    equilibriumMode: 'free',
    fluidType: 'water',
    objectMaterial: 'wood',
    blockVolumeL: 1.5,
    showVectors: true,
  });

  // 3. Thermodynamics Parameters
  const [thermoParams, setThermoParams] = useState<Thermodynamics3DParams>({
    temperatureK: 320,
    volumeL: 16,
    gasMoles: 2.0,
    gasType: 'N2',
    pistonLocked: false,
    heatSourceOn: true,
  });

  // 4. Electrostatics Parameters
  const [electroParams, setElectroParams] = useState<Electrostatics3DParams>({
    q1Sign: 'positive',
    q2Sign: 'negative',
    q1Mag: 5,
    q2Mag: 5,
    chargeDistance: 3.6,
    showFieldLines: true,
    showTestCharge: true,
    relaunchKey: 0,
  });

  // Active Bunsen Burner thermal loop when Thermodynamics station is active
  useEffect(() => {
    if (station !== 'thermodynamics') return;
    const id = window.setInterval(() => {
      setThermoParams((prev) => {
        let nextT = prev.temperatureK;
        if (prev.heatSourceOn) {
          if (nextT < 740) nextT = Math.min(740, nextT + 2.5);
        } else {
          if (nextT > 295) nextT = Math.max(295, nextT - 1.5);
        }
        let nextV = prev.volumeL;
        if (!prev.pistonLocked) {
          // Charles/Ideal gas free-piston expansion at ~2.6 atm external weight
          const equilibriumV = (prev.gasMoles * 0.0821 * nextT) / 2.6;
          nextV = Math.max(6, Math.min(30, prev.volumeL + (equilibriumV - prev.volumeL) * 0.12));
        }
        if (Math.abs(nextT - prev.temperatureK) < 0.05 && Math.abs(nextV - prev.volumeL) < 0.05) {
          return prev;
        }
        return {
          ...prev,
          temperatureK: Number(nextT.toFixed(1)),
          volumeL: Number(nextV.toFixed(1)),
        };
      });
    }, 150);
    return () => window.clearInterval(id);
  }, [station]);

  // Mutable refs for 60fps render loop
  const opticsParamsRef = useRef(opticsParams);
  opticsParamsRef.current = opticsParams;

  const mechanicsParamsRef = useRef(mechanicsParams);
  mechanicsParamsRef.current = mechanicsParams;

  const thermoParamsRef = useRef(thermoParams);
  thermoParamsRef.current = thermoParams;

  const electroParamsRef = useRef(electroParams);
  electroParamsRef.current = electroParams;

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // ==========================================
  // THREE.JS LIFECYCLE & SCENE INITIALIZATION
  // ==========================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgColor = isDark ? 0x050811 : 0xf8fafc;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.036);

    const rig = STATION_CAMERAS[station];
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    camera.position.set(...rig.perspective.pos);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 + 0.04;
    controls.minDistance = 2.5;
    controls.maxDistance = 24;
    controls.target.set(...rig.perspective.target);
    controlsRef.current = controls;

    // RoomEnvironment PMREM for PBR glass/metals
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3-Point Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.3);
    keyLight.position.set(5, 8.5, 5.5);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 25;
      const d = 5.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xe0e7ff, 0x1e1b4b, 1.1);
    scene.add(hemiLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const groundGrid = new THREE.GridHelper(18, 36, isDark ? 0x334155 : 0xcbd5e1, isDark ? 0x1e293b : 0xe2e8f0);
    groundGrid.position.y = 0.001;
    scene.add(groundGrid);

    const groundGeo = new THREE.PlaneGeometry(34, 34);
    const groundMat = new THREE.MeshStandardMaterial({
      color: bgColor,
      roughness: 0.95,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = !isSoftwareGl;
    scene.add(groundMesh);

    let sceneInstance:
      | Optics3DSceneInstance
      | Mechanics3DSceneInstance
      | Thermodynamics3DSceneInstance
      | Electrostatics3DSceneInstance;

    if (station === 'optics_quantum') {
      sceneInstance = createOptics3DScene(isSoftwareGl);
    } else if (station === 'mechanics') {
      sceneInstance = createMechanics3DScene(isSoftwareGl);
    } else if (station === 'thermodynamics') {
      sceneInstance = createThermodynamics3DScene(isSoftwareGl);
    } else {
      sceneInstance = createElectrostatics3DScene(isSoftwareGl);
    }
    scene.add(sceneInstance.group);

    let frameId = 0;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      controls.update();

      if (station === 'optics_quantum') {
        (sceneInstance as Optics3DSceneInstance).update(delta, opticsParamsRef.current);
      } else if (station === 'mechanics') {
        (sceneInstance as Mechanics3DSceneInstance).update(delta, mechanicsParamsRef.current);
      } else if (station === 'thermodynamics') {
        (sceneInstance as Thermodynamics3DSceneInstance).update(delta, thermoParamsRef.current);
      } else {
        (sceneInstance as Electrostatics3DSceneInstance).update(delta, electroParamsRef.current);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      controls.dispose();
      sceneInstance.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      groundGrid.dispose();
      keyLight.dispose();
      hemiLight.dispose();
      fillLight.dispose();
      envRT.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [station, isDark]);

  // Per-station camera preset handler
  const setCameraView = (view: 'perspective' | 'front' | 'top' | 'side') => {
    const controls = controlsRef.current;
    const camera = cameraRef.current;
    if (!controls || !camera) return;

    playLabSound('click');
    const preset = STATION_CAMERAS[station][view];
    camera.position.set(...preset.pos);
    controls.target.set(...preset.target);
    controls.update();
  };

  // Precompute live telemetry summaries
  const fluidRho = MECHANICS_FLUID_DENSITIES[mechanicsParams.fluidType];
  const objRho = MECHANICS_OBJECT_DENSITIES[mechanicsParams.objectMaterial];
  const effectiveSubFraction =
    mechanicsParams.equilibriumMode === 'free'
      ? objRho < fluidRho
        ? objRho / fluidRho
        : 1.0
      : mechanicsParams.submersionPercent / 100;
  const volM3 = mechanicsParams.blockVolumeL * 0.001;
  const fgN = objRho * volM3 * 9.81;
  const fbN = fluidRho * (effectiveSubFraction * volM3) * 9.81;
  const tensionN = mechanicsParams.equilibriumMode === 'free' && objRho < fluidRho ? 0 : Math.max(0, fgN - fbN);

  const idealPressureAtm =
    (thermoParams.gasMoles * 0.0821 * thermoParams.temperatureK) / Math.max(1, thermoParams.volumeL);
  const molarMassKg = GAS_MOLAR_MASS[thermoParams.gasType] * 0.001;
  const vRmsMs = Math.sqrt((3 * 8.314 * thermoParams.temperatureK) / molarMassKg);

  const coulombForceN =
    (8.988e9 * (electroParams.q1Mag * 1e-6) * (electroParams.q2Mag * 1e-6)) /
    (electroParams.chargeDistance * electroParams.chargeDistance);
  const isAttracting = electroParams.q1Sign !== electroParams.q2Sign;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`w-full flex flex-col rounded-2xl border overflow-hidden shadow-md select-none transition-colors ${
        isFullscreen ? 'fixed inset-3 sm:inset-5 z-50 border-2 border-indigo-500/60 shadow-2xl' : ''
      } ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* External Top Header & Camera Toolbar (Zero Overlap with 3D Stage) */}
      <div
        className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Orbit className="w-4 h-4 text-indigo-500 shrink-0" />
          <h2 className="text-sm font-bold">
            {station === 'optics_quantum' && t('محاكي البصريات والمنشور ثلاثي الأبعاد', '3D Optics, Snell & Prism Studio')}
            {station === 'mechanics' && t('محاكي الميكانيكا والطفو ثلاثي الأبعاد', '3D Mechanics & Buoyancy Studio')}
            {station === 'thermodynamics' && t('محاكي الديناميكا الحرارية والمكبس ثلاثي الأبعاد', '3D Thermodynamics & Gas Piston Studio')}
            {station === 'electromagnetism' && t('محاكي الكهرومغناطيسية وحقول كولوم ثلاثي الأبعاد', '3D Electromagnetism & Coulomb Studio')}
          </h2>
          <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>· WebGL 3D</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            {([
              { id: 'perspective' as const, ar: 'منظوري', en: '3D View' },
              { id: 'front' as const, ar: 'أمامي', en: 'Front' },
              { id: 'top' as const, ar: 'علوي', en: 'Top' },
              { id: 'side' as const, ar: 'جانبي', en: 'Side' },
            ]).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setCameraView(v.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {t(v.ar, v.en)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isFullscreen
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isFullscreen ? t('تصغير', 'Exit Fullscreen') : t('ملء الشاشة', 'Fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {onSwitchTo2D && (
            <button
              type="button"
              onClick={() => {
                playLabSound('click');
                onSwitchTo2D();
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{t('الوضع 2D', '2D Mode')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Pure Unobstructed 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className={`w-full relative overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing touch-none ${
          isFullscreen ? 'flex-1 min-h-0' : 'h-[450px] sm:h-[510px]'
        }`}
      />

      {/* Collapsible Unified Bottom Control Dock */}
      <div
        className={`px-4 py-3 border-t flex flex-col gap-3 shrink-0 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-xs sm:text-sm">
              {t('إعدادات التجربة الفيزيائية الحية 3D', 'Live 3D Experiment Variables')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDockCollapsed((p) => !p)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 whitespace-nowrap transition-colors ${
              isDark
                ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-white'
            }`}
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>{t('إظهار التحكم', 'Show Controls')}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>{t('الوضع السينمائي', 'Cinema Mode')}</span>
              </>
            )}
          </button>
        </div>

        {!isDockCollapsed && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
            {/* ======================================= */}
            {/* 1. OPTICS 3D CONTROLS                   */}
            {/* ======================================= */}
            {station === 'optics_quantum' && (
              <>
                <div className={`flex flex-col gap-1.5 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                  <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('التجربة البصرية 3D:', '3D Optical Apparatus:')}</span>
                  <div className="grid grid-cols-3 gap-1">
                    {([
                      { id: 'lens' as const, ar: 'عدسة', en: 'Lens' },
                      { id: 'prism' as const, ar: 'منشور', en: 'Prism' },
                      { id: 'snell' as const, ar: 'حوض سنل', en: 'Snell' },
                    ]).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setOpticsParams((p) => ({ ...p, elementMode: m.id }))}
                        className={`p-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition-colors ${
                          opticsParams.elementMode === m.id
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : isDark
                            ? 'border-slate-800 text-slate-400 hover:bg-slate-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {t(m.ar, m.en)}
                      </button>
                    ))}
                  </div>
                </div>

                {opticsParams.elementMode === 'snell' && (
                  <>
                    <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('زاوية السقوط θ₁:', 'Incidence Angle θ₁:')}</span>
                        <span className="font-mono text-cyan-500 font-bold">{opticsParams.snellTheta1Deg}°</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="85"
                        value={opticsParams.snellTheta1Deg}
                        onChange={(e) => setOpticsParams((p) => ({ ...p, snellTheta1Deg: Number(e.target.value) }))}
                        className="accent-cyan-500 cursor-pointer"
                      />
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('الطول الموجي λ:', 'Wavelength λ:')}</span>
                        <span className="font-mono font-bold text-emerald-400">{opticsParams.laserWavelength} nm</span>
                      </div>
                      <input
                        type="range"
                        min="405"
                        max="680"
                        value={opticsParams.laserWavelength}
                        onChange={(e) => setOpticsParams((p) => ({ ...p, laserWavelength: Number(e.target.value) }))}
                        className="accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                      <span className={`font-medium text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('أوساط قانون سنل (n₁ ➔ n₂):', 'Snell Media (n₁ ➔ n₂):')}</span>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        {[
                          { n1: 1.0003, n2: 1.333, ar: 'هواء ➔ ماء', en: 'Air ➔ Water' },
                          { n1: 1.333, n2: 1.0003, ar: 'ماء ➔ هواء', en: 'Water ➔ Air' },
                          { n1: 1.52, n2: 1.333, ar: 'زجاج ➔ ماء', en: 'Glass ➔ Water' },
                          { n1: 2.42, n2: 1.0003, ar: 'ألماس ➔ هواء', en: 'Diamond ➔ Air' },
                        ].map((preset) => {
                          const active =
                            Math.abs((opticsParams.snellN1 ?? 1) - preset.n1) < 0.02 &&
                            Math.abs((opticsParams.snellN2 ?? 1.33) - preset.n2) < 0.02;
                          return (
                            <button
                              key={preset.en}
                              type="button"
                              onClick={() => setOpticsParams((p) => ({ ...p, snellN1: preset.n1, snellN2: preset.n2 }))}
                              className={`p-1.5 rounded-lg border font-bold transition-colors ${
                                active
                                  ? 'bg-cyan-600 border-cyan-500 text-white'
                                  : isDark
                                  ? 'border-slate-800 text-slate-400 hover:bg-slate-800'
                                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {t(preset.ar, preset.en)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {(() => {
                      const sinT1 = Math.sin(((opticsParams.snellTheta1Deg ?? 45) * Math.PI) / 180);
                      const n1 = opticsParams.snellN1 ?? 1.0003;
                      const n2 = opticsParams.snellN2 ?? 1.333;
                      const sinT2 = (n1 / n2) * sinT1;
                      const isTIR = sinT2 > 1.0;
                      const t2Deg = !isTIR ? ((Math.asin(sinT2) * 180) / Math.PI).toFixed(1) : null;
                      const critDeg = n1 > n2 ? ((Math.asin(n2 / n1) * 180) / Math.PI).toFixed(1) : null;
                      return (
                        <div
                          className={`p-2.5 rounded-xl border flex flex-col justify-center gap-1 text-xs ${
                            isTIR
                              ? isDark
                                ? 'border-red-500/50 bg-red-950/30 text-red-200'
                                : 'border-red-300 bg-red-50 text-red-900'
                              : isDark
                              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono font-bold">
                            <span>θ₂ = {isTIR ? t('انعكاس كلي TIR', 'TIR') : `${t2Deg}°`}</span>
                            {critDeg && <span>θc = {critDeg}°</span>}
                          </div>
                          <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {isTIR
                              ? t('تجاوزت الزاوية الحرجة θc؛ ينعكس الشعاع داخلياً بالكامل.', 'Exceeded critical angle θc; total internal reflection.')
                              : `${n1}·sin(${opticsParams.snellTheta1Deg}°) = ${n2}·sin(${t2Deg}°)`}
                          </span>
                        </div>
                      );
                    })()}
                  </>
                )}

                {opticsParams.elementMode === 'lens' && (
                  <>
                    <div className={`flex flex-col gap-1.5 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                      <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('نوع العدسة والحزمة:', 'Lens Shape & Source:')}</span>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setOpticsParams((p) => ({ ...p, lensType: 'convex' }))}
                          className={`p-1.5 rounded-lg border font-bold transition-colors ${
                            opticsParams.lensType === 'convex'
                              ? 'bg-cyan-600 border-cyan-500 text-white'
                              : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {t('عدسة محدبة (+)', 'Convex (+)')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpticsParams((p) => ({ ...p, lensType: 'concave' }))}
                          className={`p-1.5 rounded-lg border font-bold transition-colors ${
                            opticsParams.lensType === 'concave'
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {t('عدسة مقعرة (-)', 'Concave (-)')}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setOpticsParams((p) => ({ ...p, lightMode: 'white' }))}
                          className={`p-1 rounded-md border font-semibold transition-colors ${
                            opticsParams.lightMode === 'white'
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {t('ضوء أبيض', 'White Rays')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpticsParams((p) => ({ ...p, lightMode: 'laser' }))}
                          className={`p-1 rounded-md border font-semibold transition-colors ${
                            opticsParams.lightMode === 'laser'
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {t('ليزر ملون', 'Color Laser')}
                        </button>
                      </div>
                    </div>

                    <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('البعد البؤري |f|:', 'Focal Length |f|:')}</span>
                        <span className="font-mono text-amber-500 font-bold">
                          {opticsParams.lensType === 'concave' ? '-' : '+'}
                          {opticsParams.lensFocalLength.toFixed(1)} m
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.9"
                        max="3.2"
                        step="0.1"
                        value={opticsParams.lensFocalLength}
                        onChange={(e) => setOpticsParams((p) => ({ ...p, lensFocalLength: Number(e.target.value) }))}
                        className="accent-amber-500 cursor-pointer"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('بُعد الشاشة:', 'Screen Distance:')}</span>
                        <span className="font-mono text-cyan-500 font-bold">{opticsParams.screenDistance.toFixed(1)} m</span>
                      </div>
                      <input
                        type="range"
                        min="1.4"
                        max="4.2"
                        step="0.1"
                        value={opticsParams.screenDistance}
                        onChange={(e) => setOpticsParams((p) => ({ ...p, screenDistance: Number(e.target.value) }))}
                        className="accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('اتساع الحزمة:', 'Beam Aperture:')}</span>
                        <span className="font-mono text-indigo-400 font-bold">{Math.round(opticsParams.beamSpread * 100)} mm</span>
                      </div>
                      <input
                        type="range"
                        min="0.22"
                        max="0.72"
                        step="0.02"
                        value={opticsParams.beamSpread}
                        onChange={(e) => setOpticsParams((p) => ({ ...p, beamSpread: Number(e.target.value) }))}
                        className="accent-indigo-500 cursor-pointer"
                      />
                      {opticsParams.lightMode === 'laser' ? (
                        <>
                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('الطول الموجي λ:', 'Wavelength λ:')}</span>
                            <span className="font-mono font-bold text-emerald-400">{opticsParams.laserWavelength} nm</span>
                          </div>
                          <input
                            type="range"
                            min="405"
                            max="680"
                            value={opticsParams.laserWavelength}
                            onChange={(e) => setOpticsParams((p) => ({ ...p, laserWavelength: Number(e.target.value) }))}
                            className="accent-emerald-500 cursor-pointer"
                          />
                        </>
                      ) : (
                        <div className={`mt-1 text-[11px] font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                          {opticsParams.lensType === 'convex'
                            ? Math.abs(opticsParams.screenDistance - opticsParams.lensFocalLength) < 0.25
                              ? t('الشاشة في البؤرة تماماً — بقعة حادة مركزة!', 'Screen at Focus — sharp concentrated spot!')
                              : opticsParams.screenDistance > opticsParams.lensFocalLength
                              ? t('تجاوزت الأشعة البؤرة (صورة مقلوبة متسعة)', 'Rays crossed F (expanding beyond focus)')
                              : t('الشاشة قبل البؤرة — الأشعة تتجمع نحو البؤرة', 'Screen before F — converging bundle')
                            : t('عدسة مفرقة: امتدادات متقطعة تتقاطع في البؤرة التقديرية F', 'Diverging lens: dashed virtual extensions meet at -F')}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {opticsParams.elementMode === 'prism' && (
                  <>
                    <div className={`flex flex-col gap-1.5 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                      <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('الحزمة ومادة المنشور:', 'Beam & Glass Material:')}</span>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setOpticsParams((p) => ({ ...p, lightMode: 'white' }))}
                          className={`p-1.5 rounded-lg border font-bold transition-colors ${
                            opticsParams.lightMode === 'white'
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {t('طيف أبيض', 'White Spectrum')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpticsParams((p) => ({ ...p, lightMode: 'laser' }))}
                          className={`p-1.5 rounded-lg border font-bold transition-colors ${
                            opticsParams.lightMode === 'laser'
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {t('ليزر أحادي', 'Single Laser')}
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-1 pt-0.5 text-[11px]">
                        {([
                          { id: 'crown' as const, ar: 'كراون 1.52', en: 'Crown' },
                          { id: 'flint' as const, ar: 'فلينت 1.66', en: 'Flint' },
                          { id: 'diamond' as const, ar: 'ألماس 2.41', en: 'Diamond' },
                        ]).map((mat) => (
                          <button
                            key={mat.id}
                            type="button"
                            onClick={() => setOpticsParams((p) => ({ ...p, prismMaterial: mat.id }))}
                            className={`p-1 rounded-md border font-bold transition-colors ${
                              opticsParams.prismMaterial === mat.id
                                ? 'bg-amber-500 border-amber-400 text-slate-950'
                                : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            {t(mat.ar, mat.en)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('تدوير المنشور:', 'Rotate Prism:')}</span>
                        <span className="font-mono text-indigo-400 font-bold">{opticsParams.prismAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        value={opticsParams.prismAngle}
                        onChange={(e) => setOpticsParams((p) => ({ ...p, prismAngle: Number(e.target.value) }))}
                        className="accent-indigo-500 cursor-pointer"
                      />
                      <div className="flex items-center justify-between pt-1">
                        <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('بُعد الشاشة:', 'Screen Distance:')}</span>
                        <span className="font-mono text-cyan-400 font-bold">{opticsParams.screenDistance.toFixed(1)} m</span>
                      </div>
                      <input
                        type="range"
                        min="1.6"
                        max="4.2"
                        step="0.1"
                        value={opticsParams.screenDistance}
                        onChange={(e) => setOpticsParams((p) => ({ ...p, screenDistance: Number(e.target.value) }))}
                        className="accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div className={`flex flex-col justify-center gap-1.5 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                      {opticsParams.lightMode === 'laser' ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('الطول الموجي λ:', 'Wavelength λ:')}</span>
                            <span className="font-mono text-emerald-400 font-bold">{opticsParams.laserWavelength} nm</span>
                          </div>
                          <input
                            type="range"
                            min="405"
                            max="680"
                            value={opticsParams.laserWavelength}
                            onChange={(e) => setOpticsParams((p) => ({ ...p, laserWavelength: Number(e.target.value) }))}
                            className="accent-emerald-500 cursor-pointer"
                          />
                        </>
                      ) : (
                        <div className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {t(
                            'تحليل الضوء الأبيض عبر تتبع سنل ثلاثي الأبعاد: يزداد التشتت الطيفي بالانتقال من الكراون إلى الفلينت ثم الألماس.',
                            '3D Snell dispersion: chromatic spread increases from Crown glass to Flint and Diamond.'
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* ======================================= */}
            {/* 2. MECHANICS & BUOYANCY 3D CONTROLS     */}
            {/* ======================================= */}
            {station === 'mechanics' && (
              <>
                <div className={`flex flex-col gap-1.5 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('وضع التجربة:', 'Mode:')}</span>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setMechanicsParams((p) => ({ ...p, equilibriumMode: 'free' }))}
                        className={`px-2 py-1 rounded-md border font-bold transition-colors ${
                          mechanicsParams.equilibriumMode === 'free'
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {t('اتزان حر', 'Free Float/Sink')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMechanicsParams((p) => ({ ...p, equilibriumMode: 'manual' }))}
                        className={`px-2 py-1 rounded-md border font-bold transition-colors ${
                          mechanicsParams.equilibriumMode === 'manual'
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {t('رافعة الميزان', 'Crane Lift')}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {mechanicsParams.equilibriumMode === 'manual' ? t('عمق الغمر اليدوي:', 'Manual Depth:') : t('حجم الجسم V:', 'Block Volume V:')}
                    </span>
                    <span className="font-mono text-cyan-500 font-bold">
                      {mechanicsParams.equilibriumMode === 'manual'
                        ? `${mechanicsParams.submersionPercent}%`
                        : `${mechanicsParams.blockVolumeL.toFixed(1)} L`}
                    </span>
                  </div>
                  {mechanicsParams.equilibriumMode === 'manual' ? (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={mechanicsParams.submersionPercent}
                      onChange={(e) => setMechanicsParams((p) => ({ ...p, submersionPercent: Number(e.target.value) }))}
                      className="accent-cyan-500 cursor-pointer"
                    />
                  ) : (
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={mechanicsParams.blockVolumeL}
                      onChange={(e) => setMechanicsParams((p) => ({ ...p, blockVolumeL: Number(e.target.value) }))}
                      className="accent-cyan-500 cursor-pointer"
                    />
                  )}
                </div>

                <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                  <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('كثافة السائل (kg/m³):', 'Fluid Density:')}</span>
                  <div className="grid grid-cols-2 gap-1">
                    {([
                      { id: 'oil' as const, ar: 'زيت 880', en: 'Oil 880' },
                      { id: 'water' as const, ar: 'ماء 1000', en: 'Water 1000' },
                      { id: 'seawater' as const, ar: 'بحر 1025', en: 'Sea 1025' },
                      { id: 'honey' as const, ar: 'عسل 1420', en: 'Honey 1420' },
                    ]).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setMechanicsParams((p) => ({ ...p, fluidType: f.id }))}
                        className={`p-1 rounded-md border font-bold text-[11px] transition-colors ${
                          mechanicsParams.fluidType === f.id
                            ? 'bg-cyan-600 border-cyan-500 text-white'
                            : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {t(f.ar, f.en)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                  <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('كثافة مادة الجسم:', 'Object Density:')}</span>
                  <div className="grid grid-cols-2 gap-1">
                    {([
                      { id: 'wood' as const, ar: 'خشب 600', en: 'Wood 600' },
                      { id: 'brick' as const, ar: 'طوب 1900', en: 'Brick 1900' },
                      { id: 'aluminum' as const, ar: 'ألومنيوم 2700', en: 'Al 2700' },
                      { id: 'iron' as const, ar: 'حديد 7870', en: 'Iron 7870' },
                    ]).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMechanicsParams((p) => ({ ...p, objectMaterial: m.id }))}
                        className={`p-1 rounded-md border font-bold text-[11px] transition-colors ${
                          mechanicsParams.objectMaterial === m.id
                            ? 'bg-slate-700 border-slate-500 text-white'
                            : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {t(m.ar, m.en)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`flex flex-col justify-between gap-1.5 p-2.5 rounded-xl border ${isDark ? 'border-cyan-500/30 bg-cyan-950/20' : 'border-cyan-200 bg-cyan-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold flex items-center gap-1 ${isDark ? 'text-cyan-300' : 'text-cyan-900'}`}>
                      <Wind className="w-3.5 h-3.5 text-cyan-500" />
                      {objRho < fluidRho ? t('حالة طفو', 'Floating') : t('حالة غرق', 'Sinking')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setMechanicsParams((p) => ({ ...p, showVectors: !p.showVectors }))}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                        mechanicsParams.showVectors
                          ? 'bg-cyan-500 text-slate-950'
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {mechanicsParams.showVectors ? t('الأسهم ON', 'Vectors ON') : t('الأسهم OFF', 'OFF')}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
                    <div className="text-red-400 font-bold">Fg: {fgN.toFixed(1)}N</div>
                    <div className="text-cyan-400 font-bold">Fb: {fbN.toFixed(1)}N</div>
                    <div className="text-amber-400 font-bold">T: {tensionN.toFixed(1)}N</div>
                  </div>
                </div>
              </>
            )}

            {/* ======================================= */}
            {/* 3. THERMODYNAMICS & GAS PISTON CONTROLS */}
            {/* ======================================= */}
            {station === 'thermodynamics' && (
              <>
                <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('درجة الحرارة T:', 'Temperature T:')}</span>
                    <span className="font-mono text-amber-500 font-bold">{Math.round(thermoParams.temperatureK)} K</span>
                  </div>
                  <input
                    type="range"
                    min="120"
                    max="760"
                    value={thermoParams.temperatureK}
                    onChange={(e) => setThermoParams((p) => ({ ...p, temperatureK: Number(e.target.value) }))}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('حجم المكبس V:', 'Volume V:')}</span>
                    <span className="font-mono text-cyan-500 font-bold">{thermoParams.volumeL.toFixed(1)} L</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="30"
                    step="0.5"
                    value={thermoParams.volumeL}
                    onChange={(e) => setThermoParams((p) => ({ ...p, volumeL: Number(e.target.value) }))}
                    className="accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('عدد المولات n:', 'Gas Moles n:')}</span>
                    <span className="font-mono text-indigo-400 font-bold">{thermoParams.gasMoles.toFixed(1)} mol</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="4.0"
                    step="0.2"
                    value={thermoParams.gasMoles}
                    onChange={(e) => setThermoParams((p) => ({ ...p, gasMoles: Number(e.target.value) }))}
                    className="accent-indigo-500 cursor-pointer"
                  />
                  <span className={`font-medium pt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('نوع الغاز (الكتلة المولية):', 'Gas Species (Speed):')}</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['He', 'N2', 'CO2'] as const).map((gType) => (
                      <button
                        key={gType}
                        type="button"
                        onClick={() => setThermoParams((p) => ({ ...p, gasType: gType }))}
                        className={`p-1 rounded-md border font-bold text-[11px] transition-colors ${
                          thermoParams.gasType === gType
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {gType} ({GAS_MOLAR_MASS[gType]})
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`flex flex-col justify-between gap-1.5 p-2.5 rounded-xl border ${isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span className="font-bold">{t('لهب بنسن النشط', 'Active Bunsen Heat')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setThermoParams((p) => ({ ...p, heatSourceOn: !p.heatSourceOn }))}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                        thermoParams.heatSourceOn
                          ? 'bg-amber-500 text-slate-950'
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {thermoParams.heatSourceOn ? t('تسخين ON', 'Heating ON') : t('مطفأ OFF', 'Off')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className={`text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {thermoParams.pistonLocked ? t('مكبس مقفل (ثبات الحجم)', 'Piston Locked (Isochoric)') : t('مكبس حر (يتمدد بالتسخين)', 'Free Piston (Isobaric)')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setThermoParams((p) => ({ ...p, pistonLocked: !p.pistonLocked }))}
                      className={`px-2 py-1 rounded-lg border font-bold flex items-center gap-1 text-[11px] transition-colors ${
                        thermoParams.pistonLocked
                          ? 'bg-red-600 border-red-500 text-white'
                          : 'bg-emerald-600 border-emerald-500 text-white'
                      }`}
                    >
                      {thermoParams.pistonLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      {thermoParams.pistonLocked ? t('مقفل', 'Locked') : t('حر', 'Free')}
                    </button>
                  </div>
                </div>

                <div className={`flex flex-col justify-center gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between font-mono font-bold text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('الضغط P:', 'Pressure P:')}</span>
                    <span className="text-red-400">{idealPressureAtm.toFixed(2)} atm ({(idealPressureAtm * 101.3).toFixed(0)} kPa)</span>
                  </div>
                  <div className="flex items-center justify-between font-mono font-bold text-xs">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('متوسط السرعة v_rms:', 'RMS Speed:')}</span>
                    <span className="text-cyan-400">{Math.round(vRmsMs)} m/s</span>
                  </div>
                  <div className={`text-[10px] pt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    PV = nRT · {thermoParams.gasMoles.toFixed(1)} × 0.0821 × {Math.round(thermoParams.temperatureK)} / {thermoParams.volumeL.toFixed(1)}
                  </div>
                </div>
              </>
            )}

            {/* ======================================= */}
            {/* 4. ELECTROSTATICS & COULOMB CONTROLS    */}
            {/* ======================================= */}
            {station === 'electromagnetism' && (
              <>
                <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('الشحنة Q₁:', 'Charge Q₁:')}</span>
                    <span className="font-mono font-bold text-red-400">
                      {electroParams.q1Sign === 'positive' ? '+' : '-'}{electroParams.q1Mag} μC
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setElectroParams((p) => ({ ...p, q1Sign: 'positive' }))}
                      className={`p-1 rounded-md border font-bold transition-colors ${
                        electroParams.q1Sign === 'positive'
                          ? 'bg-red-600 border-red-500 text-white'
                          : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      + {t('موجب', '+Pos')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setElectroParams((p) => ({ ...p, q1Sign: 'negative' }))}
                      className={`p-1 rounded-md border font-bold transition-colors ${
                        electroParams.q1Sign === 'negative'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      - {t('سالب', '-Neg')}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={electroParams.q1Mag}
                    onChange={(e) => setElectroParams((p) => ({ ...p, q1Mag: Number(e.target.value) }))}
                    className="accent-red-500 cursor-pointer mt-1"
                  />
                </div>

                <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('الشحنة Q₂:', 'Charge Q₂:')}</span>
                    <span className="font-mono font-bold text-blue-400">
                      {electroParams.q2Sign === 'positive' ? '+' : '-'}{electroParams.q2Mag} μC
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setElectroParams((p) => ({ ...p, q2Sign: 'positive' }))}
                      className={`p-1 rounded-md border font-bold transition-colors ${
                        electroParams.q2Sign === 'positive'
                          ? 'bg-red-600 border-red-500 text-white'
                          : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      + {t('موجب', '+Pos')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setElectroParams((p) => ({ ...p, q2Sign: 'negative' }))}
                      className={`p-1 rounded-md border font-bold transition-colors ${
                        electroParams.q2Sign === 'negative'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      - {t('سالب', '-Neg')}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={electroParams.q2Mag}
                    onChange={(e) => setElectroParams((p) => ({ ...p, q2Mag: Number(e.target.value) }))}
                    className="accent-blue-500 cursor-pointer mt-1"
                  />
                </div>

                <div className={`flex flex-col gap-1 p-2.5 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t('المسافة بين الشحنتين r:', 'Distance r:')}</span>
                    <span className="font-mono text-indigo-400 font-bold">{electroParams.chargeDistance.toFixed(1)} m</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="5.0"
                    step="0.2"
                    value={electroParams.chargeDistance}
                    onChange={(e) => setElectroParams((p) => ({ ...p, chargeDistance: Number(e.target.value) }))}
                    className="accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between pt-1.5 font-mono text-[11px]">
                    <span className={isAttracting ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {isAttracting ? t('تجاذب (Attraction)', 'Attraction') : t('تنافر (Repulsion)', 'Repulsion')}
                    </span>
                    <span className="font-bold">F = {coulombForceN.toFixed(3)} N</span>
                  </div>
                </div>

                <div className={`flex flex-col justify-between gap-1.5 p-2.5 rounded-xl border ${isDark ? 'border-indigo-500/30 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-bold ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>
                      {t('خطوط المجال 3D', '3D Field Lines')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setElectroParams((p) => ({ ...p, showFieldLines: !p.showFieldLines }))}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                        electroParams.showFieldLines
                          ? 'bg-purple-600 text-white'
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {electroParams.showFieldLines ? t('ظاهرة', 'ON') : t('مخفية', 'OFF')}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className={`flex items-center gap-1 ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}>
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="font-bold">{t('شحنة الاختبار q₀', 'Test Charge q₀')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setElectroParams((p) => ({ ...p, showTestCharge: true, relaunchKey: (p.relaunchKey ?? 0) + 1 }))
                        }
                        className={`p-1 rounded-md border transition-colors ${
                          isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-white'
                        }`}
                        title={t('إعادة إطلاق شحنة الاختبار', 'Relaunch test charge')}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setElectroParams((p) => ({ ...p, showTestCharge: !p.showTestCharge }))}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                          electroParams.showTestCharge
                            ? 'bg-indigo-600 text-white'
                            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {electroParams.showTestCharge ? t('نشطة', 'ON') : t('موقوفة', 'OFF')}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
