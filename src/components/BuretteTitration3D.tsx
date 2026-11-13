import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useApp } from '../context/AppContext';
import { StageViewportFrame } from './StageViewportFrame';

interface BuretteTitration3DProps {
  buretteVolume: number; // 0..50 mL
  volumeDispensed: number; // 0..50 mL
  flowMode: 'closed' | 'single' | 'fast' | 'stream';
  isStirring: boolean;
  probeImmersed: boolean;
  solutionColorCss: string;
  currentPh: number;
}

function parseCssRgba(css: string): { color: THREE.Color; alpha: number } {
  const rgbaMatch = css.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (rgbaMatch) {
    const r = Number(rgbaMatch[1]) / 255;
    const g = Number(rgbaMatch[2]) / 255;
    const b = Number(rgbaMatch[3]) / 255;
    const a = rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 0.7;
    return { color: new THREE.Color(r, g, b), alpha: Math.min(0.92, Math.max(0.28, a)) };
  }
  return { color: new THREE.Color('#bae6fd'), alpha: 0.45 };
}

export const BuretteTitration3D: React.FC<BuretteTitration3DProps> = ({
  buretteVolume,
  volumeDispensed,
  flowMode,
  isStirring,
  probeImmersed,
  solutionColorCss,
  currentPh
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  const stateRef = useRef({
    buretteVolume,
    volumeDispensed,
    flowMode,
    isStirring,
    probeImmersed,
    solutionColorCss
  });
  stateRef.current = {
    buretteVolume,
    volumeDispensed,
    flowMode,
    isStirring,
    probeImmersed,
    solutionColorCss
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(2.1, 1.55, 8.8);

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
    controls.target.set(0, 0.25, 0);
    controls.minDistance = 4.5;
    controls.maxDistance = 14;

    const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.75 : 1.05);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    // 1. Retort Stand & Magnetic Stirrer Plate
    const standMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.85, roughness: 0.25 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.92, roughness: 0.16 });

    const basePlate = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 2.2), standMat);
    basePlate.position.set(-0.2, -2.25, 0);
    scene.add(basePlate);

    const verticalRod = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.1, 20), chromeMat);
    verticalRod.position.set(-1.1, 0.3, -0.35);
    scene.add(verticalRod);

    // Clamp holding burette
    const clampArm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.1), chromeMat);
    clampArm.position.set(-0.55, 1.5, -0.17);
    scene.add(clampArm);
    const clampRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 12, 24), chromeMat);
    clampRing.rotation.x = Math.PI / 2;
    clampRing.position.set(0, 1.5, 0);
    scene.add(clampRing);

    // Magnetic stirrer base unit under flask
    const stirrerBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 0.26, 1.7),
      new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.5, roughness: 0.35 })
    );
    stirrerBox.position.set(0, -2.02, 0);
    scene.add(stirrerBox);

    const stirrerPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.68, 0.05, 32),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3 })
    );
    stirrerPad.position.set(0, -1.87, 0);
    scene.add(stirrerPad);

    // 2. Erlenmeyer Conical Flask (LatheGeometry)
    const flaskProfile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.66, 0.0),
      new THREE.Vector2(0.68, 0.08),
      new THREE.Vector2(0.24, 1.05),
      new THREE.Vector2(0.24, 1.45),
      new THREE.Vector2(0.28, 1.5)
    ];
    const flaskGeo = new THREE.LatheGeometry(flaskProfile, 40);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#e0f2fe',
      transparent: true,
      opacity: 0.24,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const flaskMesh = new THREE.Mesh(flaskGeo, glassMat);
    flaskMesh.position.set(0, -1.84, 0);
    scene.add(flaskMesh);

    // Liquid inside Erlenmeyer Flask (conical frustum scaled by volume)
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#bae6fd'),
      transparent: true,
      opacity: 0.6,
      roughness: 0.14,
      clearcoat: 0.6
    });
    const flaskLiquidGeo = new THREE.CylinderGeometry(0.45, 0.63, 0.52, 36);
    const flaskLiquid = new THREE.Mesh(flaskLiquidGeo, liquidMat);
    flaskLiquid.position.set(0, -1.56, 0);
    scene.add(flaskLiquid);

    // Magnetic stir bar (flea) inside flask bottom
    const stirBar = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.24, 8, 12),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 })
    );
    stirBar.rotation.z = Math.PI / 2;
    stirBar.position.set(0, -1.78, 0);
    scene.add(stirBar);

    // 3. Graduated Burette Column above flask
    const buretteGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 2.5, 28, 1, true),
      glassMat
    );
    buretteGlass.position.set(0, 1.45, 0);
    scene.add(buretteGlass);

    // Volumetric graduation rings along burette column (0..50 mL)
    const buretteTickGeo = new THREE.TorusGeometry(0.144, 0.006, 6, 20, Math.PI * 0.55);
    const buretteTickMat = new THREE.MeshBasicMaterial({ color: '#e2e8f0' });
    for (let tIdx = 0; tIdx <= 5; tIdx++) {
      const bTick = new THREE.Mesh(buretteTickGeo, buretteTickMat);
      bTick.rotation.x = Math.PI / 2;
      bTick.rotation.z = -Math.PI * 0.25;
      bTick.position.set(0, 0.35 + tIdx * 0.42, 0);
      scene.add(bTick);
    }

    // Titrant liquid inside burette
    const titrantMat = new THREE.MeshPhysicalMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.45,
      roughness: 0.1
    });
    const titrantGeo = new THREE.CylinderGeometry(0.115, 0.115, 2.35, 24);
    const titrantMesh = new THREE.Mesh(titrantGeo, titrantMat);
    titrantMesh.position.set(0, 1.4, 0);
    scene.add(titrantMesh);

    // Burette Tip + Stopcock Valve
    const tipMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.03, 0.48, 20),
      glassMat
    );
    tipMesh.position.set(0, -0.02, 0);
    scene.add(tipMesh);

    const stopcockHandleGroup = new THREE.Group();
    stopcockHandleGroup.position.set(0.18, 0.12, 0);
    const stopcockBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: '#06b6d4', roughness: 0.3 })
    );
    stopcockHandleGroup.add(stopcockBar);
    scene.add(stopcockHandleGroup);

    // Falling droplet & liquid impact surface ripple ring
    const dropletMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 14, 14),
      new THREE.MeshPhysicalMaterial({ color: '#38bdf8', transparent: true, opacity: 0.85, roughness: 0.05 })
    );
    dropletMesh.visible = false;
    scene.add(dropletMesh);

    const rippleMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 });
    const rippleMesh = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 8, 28), rippleMat);
    rippleMesh.rotation.x = Math.PI / 2;
    rippleMesh.visible = false;
    scene.add(rippleMesh);

    // 4. Digital pH Electrode Probe
    const probeGroup = new THREE.Group();
    const probeStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.85, 16),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.35 })
    );
    const probeBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 16, 16),
      new THREE.MeshPhysicalMaterial({ color: '#f59e0b', emissive: '#d97706', emissiveIntensity: 0.2, roughness: 0.1 })
    );
    probeBulb.position.y = -0.94;
    probeGroup.add(probeStem, probeBulb);
    probeGroup.position.set(0.13, -0.78, 0.08);
    probeGroup.rotation.z = 0.08;
    scene.add(probeGroup);

    let animId = 0;
    let dropY = -0.26;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;

      const cur = stateRef.current;

      // Update Burette Titrant Level
      const frac = Math.max(0.01, Math.min(1, cur.buretteVolume / 50));
      titrantMesh.scale.y = frac;
      titrantMesh.position.y = 0.24 + (2.35 * frac) / 2;

      // Update Erlenmeyer Liquid Level & Indicator Color
      const parsed = parseCssRgba(cur.solutionColorCss);
      liquidMat.color.lerp(parsed.color, 0.15);
      liquidMat.opacity += (parsed.alpha - liquidMat.opacity) * 0.15;

      const liquidFillFrac = Math.min(1.55, 0.85 + (cur.volumeDispensed / 50) * 0.65);
      flaskLiquid.scale.y = liquidFillFrac;
      flaskLiquid.position.y = -1.82 + (0.52 * liquidFillFrac) / 2;

      // Stopcock handle angle
      const targetValveRot =
        cur.flowMode === 'closed'
          ? 0
          : cur.flowMode === 'single'
          ? Math.PI * 0.22
          : cur.flowMode === 'fast'
          ? Math.PI * 0.36
          : Math.PI * 0.5;
      stopcockHandleGroup.rotation.x += (targetValveRot - stopcockHandleGroup.rotation.x) * 0.2;

      // Falling drop animation + liquid surface splash ripple
      const liquidSurfaceY = -1.82 + 0.52 * liquidFillFrac;
      if (cur.flowMode !== 'closed' && cur.buretteVolume > 0) {
        dropletMesh.visible = true;
        const dropSpeed = cur.flowMode === 'stream' ? 0.095 : cur.flowMode === 'fast' ? 0.065 : 0.038;
        dropY -= dropSpeed;
        if (dropY < liquidSurfaceY) {
          dropY = -0.26;
          rippleMesh.visible = true;
          rippleMesh.position.set(0, liquidSurfaceY + 0.015, 0);
          rippleMesh.scale.setScalar(0.35);
          rippleMat.opacity = 0.7;
        }
        dropletMesh.position.set(0, dropY, 0);
      } else {
        dropletMesh.visible = false;
        dropY = -0.26;
      }

      if (rippleMesh.visible) {
        rippleMesh.scale.multiplyScalar(1.07);
        rippleMat.opacity *= 0.88;
        if (rippleMat.opacity < 0.04) {
          rippleMesh.visible = false;
        }
      }

      // Spin magnetic stir bar
      if (cur.isStirring) {
        stirBar.rotation.y += 0.24;
      }

      // Dip or raise pH electrode probe
      const targetProbeY = cur.probeImmersed ? -0.78 : -0.1;
      probeGroup.position.y += (targetProbeY - probeGroup.position.y) * 0.12;

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
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        const mat = (obj as THREE.Mesh).material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
      envRT.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [isDark]);

  return (
    <StageViewportFrame
      canvasHeightClass="h-[360px]"
      accentColor="cyan"
      title={
        <h3 className="text-sm font-bold">
          {t('جهاز المعايرة ثلاثي الأبعاد', '3D Titration Apparatus')}
        </h3>
      }
      toolbar={
        <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
          <span className="font-bold text-cyan-500">
            pH = {probeImmersed ? currentPh.toFixed(2) : '---'}
          </span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <span className="font-semibold">
            {buretteVolume.toFixed(1)} mL
          </span>
        </div>
      }
      bottomBar={
        <span className="text-[11px]">
          {t('اسحب للتدوير 360° · تحكم بالصنبور والمحرك المغناطيسي ومسبار pH', 'Drag to orbit 360° · Live 3D Burette, Stirrer & pH Probe')}
        </span>
      }
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </StageViewportFrame>
  );
};
