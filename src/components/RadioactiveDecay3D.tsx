import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Radiation, Shield } from 'lucide-react';
import { IsotopeInfo } from '../data/isotopesData';
import { useApp } from '../context/AppContext';
import { StageViewportFrame } from './StageViewportFrame';

interface RadioactiveDecay3DProps {
  isotope: IsotopeInfo;
  shieldType: 'none' | 'paper' | 'aluminum' | 'lead';
  shieldThicknessCm?: number;
  detectorDistanceCm?: number;
  unstableCount: number;
}

interface EmittedBeam3D {
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  blocked: boolean;
  attenuatedTested?: boolean;
}

export const RadioactiveDecay3D: React.FC<RadioactiveDecay3DProps> = ({
  isotope,
  shieldType,
  shieldThicknessCm = 2.0,
  detectorDistanceCm = 22,
  unstableCount,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  const [liveCpm, setLiveCpm] = useState<number>(420);

  const stateRef = useRef({
    isotope,
    shieldType,
    shieldThicknessCm,
    detectorDistanceCm,
    unstableCount,
  });
  stateRef.current = {
    isotope,
    shieldType,
    shieldThicknessCm,
    detectorDistanceCm,
    unstableCount,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 460;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0.3, 1.9, 7.6);

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
    controls.minDistance = 4.2;
    controls.maxDistance = 13;

    const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.7 : 1.05);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    // Optical/Nuclear Bench Floor
    const benchMesh = new THREE.Mesh(
      new THREE.BoxGeometry(8.4, 0.22, 3.2),
      new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.65, roughness: 0.35 })
    );
    benchMesh.position.set(0.4, -1.65, 0);
    scene.add(benchMesh);

    // 1. Nucleus Cluster at x = -2.3
    const nucleusGroup = new THREE.Group();
    nucleusGroup.position.set(-2.3, 0, 0);
    scene.add(nucleusGroup);

    const nucleonGeo = new THREE.SphereGeometry(0.18, 18, 18);
    const protonMat = new THREE.MeshPhysicalMaterial({
      color: '#ef4444',
      emissive: '#991b1b',
      emissiveIntensity: 0.35,
      roughness: 0.2,
      clearcoat: 0.8,
    });
    const neutronMat = new THREE.MeshPhysicalMaterial({
      color: '#64748b',
      roughness: 0.25,
      metalness: 0.2,
    });
    const stableDaughterMat = new THREE.MeshPhysicalMaterial({
      color: '#10b981',
      emissive: '#047857',
      emissiveIntensity: 0.25,
      roughness: 0.2,
      clearcoat: 0.8,
    });

    const nucleons: Array<{ mesh: THREE.Mesh; basePos: THREE.Vector3 }> = [];
    for (let i = 0; i < 24; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 24);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const rad = 0.22 + (i % 3) * 0.16;
      const pos = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * rad,
        Math.sin(phi) * Math.sin(theta) * rad,
        Math.cos(phi) * rad
      );
      const m = new THREE.Mesh(nucleonGeo, i % 2 === 0 ? protonMat : neutronMat);
      m.position.copy(pos);
      nucleusGroup.add(m);
      nucleons.push({ mesh: m, basePos: pos });
    }

    // 2. Shielding Barrier at x = 0.0 (thickness scales with shieldThicknessCm)
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(0.0, -0.1, 0);
    scene.add(shieldGroup);

    const paperSlab = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 2.3, 2.0),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.85 })
    );
    const alumSlab = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 2.35, 2.05),
      new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.88, roughness: 0.22 })
    );
    const leadSlab = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 2.4, 2.1),
      new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.72, roughness: 0.45 })
    );
    shieldGroup.add(paperSlab, alumSlab, leadSlab);

    // 3. Movable Geiger-Müller Detector Cylinder
    const detectorGroup = new THREE.Group();
    detectorGroup.position.set(2.5, 0, 0);
    scene.add(detectorGroup);

    const gmTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 1.5, 28),
      new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.8, roughness: 0.25 })
    );
    gmTube.rotation.z = Math.PI / 2;
    const gmWindow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.08, 24),
      new THREE.MeshBasicMaterial({ color: '#38bdf8' })
    );
    gmWindow.rotation.z = Math.PI / 2;
    gmWindow.position.x = -0.76;

    const gmLedMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
    const gmLed = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), gmLedMat);
    gmLed.position.set(0, 0.52, 0);

    detectorGroup.add(gmTube, gmWindow, gmLed);

    // 4. Emitted Radiation Particle Pool
    const beamsGroup = new THREE.Group();
    scene.add(beamsGroup);
    const particles: EmittedBeam3D[] = [];
    const smallSphere = new THREE.SphereGeometry(0.08, 12, 12);
    const ringGeo = new THREE.TorusGeometry(0.14, 0.035, 10, 20);
    const alphaColor = new THREE.MeshBasicMaterial({ color: '#f97316' });
    const betaColor = new THREE.MeshBasicMaterial({ color: '#38bdf8' });
    const positronColor = new THREE.MeshBasicMaterial({ color: '#ec4899' });
    const gammaColor = new THREE.MeshBasicMaterial({ color: '#facc15' });

    const createBeamUnit = (mode: IsotopeInfo['decayMode'], spreadFactor: number) => {
      const g = new THREE.Group();
      if (mode === 'alpha') {
        const offsets: [number, number, number][] = [
          [0.06, 0.06, 0],
          [-0.06, -0.06, 0],
          [0.06, -0.06, 0.06],
          [-0.06, 0.06, -0.06],
        ];
        offsets.forEach((o, idx) => {
          const s = new THREE.Mesh(smallSphere, idx % 2 === 0 ? alphaColor : neutronMat);
          s.position.set(...o);
          g.add(s);
        });
      } else if (mode === 'beta' || mode === 'positron') {
        const s = new THREE.Mesh(smallSphere, mode === 'positron' ? positronColor : betaColor);
        s.scale.setScalar(0.85);
        g.add(s);
      } else {
        const ring = new THREE.Mesh(ringGeo, gammaColor);
        ring.rotation.y = Math.PI / 2;
        g.add(ring);
      }
      const y = (Math.random() - 0.5) * 0.5;
      const z = (Math.random() - 0.5) * 0.5;
      g.position.set(-2.0, y, z);
      beamsGroup.add(g);
      particles.push({
        mesh: g,
        x: -2.0,
        y,
        z,
        vx: mode === 'alpha' ? 0.045 : mode === 'beta-gamma' ? 0.085 : 0.065,
        vy: (Math.random() - 0.5) * spreadFactor,
        vz: (Math.random() - 0.5) * spreadFactor,
        blocked: false,
      });
    };

    let animId = 0;
    let tick = 0;
    let detectedPulses = 0;
    let lastCpmUpdate = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;

      tick += 1;
      const cur = stateRef.current;

      // Update detector position from detectorDistanceCm (10..40 cm -> x = 1.4..3.5)
      const detectorCenterX = 1.4 + ((cur.detectorDistanceCm - 10) / 30) * 2.1;
      detectorGroup.position.x += (detectorCenterX - detectorGroup.position.x) * 0.15;
      const detectorWindowX = detectorGroup.position.x - 0.76;

      // Update visible shield slab & physical thickness scaling
      const thickScale = Math.max(0.4, Math.min(3.2, cur.shieldThicknessCm / 2.0));
      paperSlab.visible = cur.shieldType === 'paper';
      alumSlab.visible = cur.shieldType === 'aluminum';
      leadSlab.visible = cur.shieldType === 'lead';
      alumSlab.scale.x = thickScale;
      leadSlab.scale.x = thickScale;

      // Exponential attenuation I / I0 = exp(-mu * x)
      const mode = cur.isotope.decayMode;
      let transmissionProb = 1.0;
      if (cur.shieldType === 'paper') {
        transmissionProb = mode === 'alpha' ? 0.0 : 0.98;
      } else if (cur.shieldType === 'aluminum') {
        if (mode === 'alpha') transmissionProb = 0.0;
        else if (mode === 'beta' || mode === 'positron') transmissionProb = Math.exp(-cur.shieldThicknessCm * 2.2);
        else transmissionProb = Math.exp(-cur.shieldThicknessCm * 0.12);
      } else if (cur.shieldType === 'lead') {
        if (mode === 'alpha' || mode === 'beta' || mode === 'positron') transmissionProb = 0.0;
        else transmissionProb = Math.exp(-cur.shieldThicknessCm * 0.65); // Gamma exponential HVL ~1.06cm
      }

      // Vibrate nucleus proportional to unstableCount
      const vibAmp = (cur.unstableCount / 100) * 0.045;
      nucleusGroup.rotation.y += 0.012;
      nucleons.forEach((n, idx) => {
        const isStable = (idx / nucleons.length) * 100 > cur.unstableCount;
        n.mesh.material = isStable ? stableDaughterMat : idx % 2 === 0 ? protonMat : neutronMat;
        n.mesh.position.set(
          n.basePos.x + (Math.random() - 0.5) * vibAmp,
          n.basePos.y + (Math.random() - 0.5) * vibAmp,
          n.basePos.z + (Math.random() - 0.5) * vibAmp
        );
      });

      // Spawn radiation particles with beam divergence
      const spawnProb = 0.08 + (cur.unstableCount / 100) * 0.2;
      if (particles.length < 26 && cur.unstableCount > 0 && Math.random() < spawnProb) {
        createBeamUnit(mode, 0.015);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.mesh.position.set(p.x, p.y, p.z);
        p.mesh.rotation.x += 0.08;

        // Attenuation check once crossing shield at x = -0.15
        if (!p.attenuatedTested && cur.shieldType !== 'none' && p.x >= -0.15) {
          p.attenuatedTested = true;
          if (Math.random() > transmissionProb) {
            p.blocked = true;
            p.vx = -0.022;
            p.vy = (Math.random() - 0.5) * 0.065;
            p.vz = (Math.random() - 0.5) * 0.065;
          }
        }

        // Hit GM detector window only if within radial aperture (models 1/r^2 geometric falloff!)
        if (!p.blocked && p.x >= detectorWindowX) {
          const radialOffset = Math.hypot(p.y, p.z);
          if (radialOffset <= 0.44) {
            detectedPulses++;
            gmLedMat.color.set('#22d3ee');
          }
          beamsGroup.remove(p.mesh);
          particles.splice(i, 1);
          continue;
        }

        if (p.x < -3.4 || p.x > 4.2 || Math.abs(p.y) > 2.2) {
          beamsGroup.remove(p.mesh);
          particles.splice(i, 1);
        }
      }

      if (tick % 8 === 0) {
        gmLedMat.color.set(transmissionProb < 0.08 ? '#10b981' : '#f59e0b');
      }

      // Live CPM follows inverse-square law (1 / r^2) + Beer-Lambert exponential attenuation I0 * e^(-mu*x)
      const now = performance.now();
      if (now - lastCpmUpdate > 450) {
        const distFactor = Math.pow(22 / cur.detectorDistanceCm, 2);
        const theoreticalCpm = cur.unstableCount * 4.8 * distFactor * transmissionProb;
        const measuredCpm = Math.round(theoreticalCpm * 0.75 + detectedPulses * 18 + 8);
        setLiveCpm(Math.max(8, Math.min(1800, measuredCpm)));
        detectedPulses = 0;
        lastCpmUpdate = now;
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

  const blockedMostly =
    (shieldType === 'paper' && isotope.decayMode === 'alpha') ||
    (shieldType === 'aluminum' &&
      (isotope.decayMode === 'alpha' ||
        ((isotope.decayMode === 'beta' || isotope.decayMode === 'positron') && shieldThicknessCm >= 1.5))) ||
    (shieldType === 'lead' && (isotope.decayMode !== 'beta-gamma' || shieldThicknessCm >= 4.0));

  return (
    <StageViewportFrame
      canvasHeightClass="h-[360px] sm:h-[400px]"
      accentColor="amber"
      title={
        <div className="flex items-center gap-2">
          <Radiation className="w-4 h-4 text-red-500 shrink-0" />
          <h3 className="text-sm font-bold">{t('غرفة الإشعاع النووي والحماية', '3D Nuclear & Shielding Chamber')}</h3>
          <span dir="ltr" className="text-xs font-mono font-bold text-cyan-500">
            {isotope.symbol} → {isotope.daughterSymbol}
          </span>
        </div>
      }
      toolbar={
        <div
          className={`flex items-center gap-1.5 text-xs font-mono font-bold tabular-nums ${
            blockedMostly ? 'text-emerald-500' : 'text-amber-500'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>GM: {liveCpm} CPM</span>
        </div>
      }
      bottomBar={
        <span className="text-[11px]">
          {t(
            'غرفة الإشعاع 3D: التوهين الأسي e^(-μx) وقانون التربيع العكسي 1/r² مع عداد جايجر',
            '3D Radiation Lab: Beer-Lambert e^(-μx) Shield Attenuation & 1/r² Geiger Falloff'
          )}
        </span>
      }
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </StageViewportFrame>
  );
};
