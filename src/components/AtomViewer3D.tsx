import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Compass,
  Eye,
  Layers,
  Play,
  Pause,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playLabSound } from '../utils/soundEffects';
import { StageViewportFrame } from './StageViewportFrame';

export interface AtomViewer3DProps {
  protons: number;
  neutrons: number;
  electrons: number;
  elementSymbol: string;
  elementName: string;
  isStable: boolean;
  showSpinArrows: boolean;
  orbitSpeed: number;
  dimensionMode?: '3d' | '2d';
}

type ModelViewType = 'bohr_spatial' | 'quantum_cloud' | 'orbital_lobes' | 'rutherford';

export const AtomViewer3D: React.FC<AtomViewer3DProps> = ({
  protons,
  neutrons,
  electrons,
  elementSymbol,
  elementName,
  isStable,
  showSpinArrows,
  orbitSpeed,
  dimensionMode = '3d'
}) => {
  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D View Modes & Settings
  const [viewType, setViewType] = useState<ModelViewType>('bohr_spatial');
  const [orbitalFilter, setOrbitalFilter] = useState<'all' | 's' | 'p' | 'd'>('all');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showRings, setShowRings] = useState<boolean>(true);
  const [showNucleusCluster, setShowNucleusCluster] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const excitationProgressRef = useRef<number>(-1); // <0 idle, 0..1 active jump & photon emission

  // References to keep Three.js animation and camera in sync
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Camera Orbit State (Spherical coords)
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 75,
    theta: Math.PI / 4,
    phi: Math.PI / 3
  });

  // Calculate electron shells (2, 8, 18, 32, 32, 18, 8)
  const shells = React.useMemo(() => {
    const capacities = [2, 8, 18, 32, 32, 18, 8];
    const distribution: number[] = [0, 0, 0, 0, 0, 0, 0];
    let remaining = electrons;
    for (let i = 0; i < capacities.length; i++) {
      if (remaining <= 0) break;
      const count = Math.min(remaining, capacities[i]);
      distribution[i] = count;
      remaining -= count;
    }
    return distribution;
  }, [electrons]);

  const activeShellCount = React.useMemo(
    () => Math.max(1, shells.reduce((acc, c, idx) => (c > 0 ? idx + 1 : acc), 1)),
    [shells]
  );
  const recommendedCamRadius = React.useMemo(() => {
    const outerRadius = 9.0 + Math.max(0, activeShellCount - 1) * 5.2;
    return Math.max(44, Math.min(135, outerRadius * 2.45));
  }, [activeShellCount]);

  useEffect(() => {
    cameraSphericalRef.current.radius = recommendedCamRadius;
  }, [recommendedCamRadius]);

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // 1. Scene & Background
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // 3. Renderer + PMREM Studio Environment
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    const pmremGen = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGen.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGen.dispose();

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(40, 60, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 0.8);
    dirLight2.position.set(-40, -30, -40);
    scene.add(dirLight2);

    const nucleusPointLight = new THREE.PointLight(0xff4444, 2.5, 60);
    nucleusPointLight.position.set(0, 0, 0);
    scene.add(nucleusPointLight);

    // Root Group for the Atom
    const atomGroup = new THREE.Group();
    scene.add(atomGroup);

    // Dynamic objects arrays to update per frame
    const electronMeshes: Array<{
      mesh: THREE.Group;
      shellIndex: number;
      orbitRadius: number;
      speed: number;
      angle: number;
      inclinationX: number;
      inclinationY: number;
      inclinationZ: number;
      isSpinUp: boolean;
      arrowGroup?: THREE.Group;
    }> = [];

    // --- A. BUILD 3D NUCLEUS CLUSTER ---
    const nucleusGroup = new THREE.Group();
    atomGroup.add(nucleusGroup);

    const cappedP = Math.min(50, protons);
    const cappedN = Math.min(60, neutrons);
    const totalNucleons = cappedP + cappedN;

    const sphereR = 1.35;
    const protonGeo = new THREE.SphereGeometry(sphereR, 20, 20);
    const neutronGeo = new THREE.SphereGeometry(sphereR, 20, 20);

    const protonMat = new THREE.MeshPhysicalMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.65,
      roughness: 0.18,
      metalness: 0.25,
      clearcoat: 0.85,
      clearcoatRoughness: 0.1
    });

    const neutronMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      emissive: 0x334155,
      emissiveIntensity: 0.25,
      roughness: 0.22,
      metalness: 0.70,
      clearcoat: 0.90,
      clearcoatRoughness: 0.1
    });

    let clusterMaxRadius = 2.0;

    if (showNucleusCluster && totalNucleons > 0) {
      // 1. Interleave protons and neutrons evenly so they are intimately bonded together
      const nucleonTypes: Array<'proton' | 'neutron'> = [];
      let pLeft = cappedP;
      let nLeft = cappedN;
      while (pLeft > 0 || nLeft > 0) {
        if (pLeft > 0 && (nLeft === 0 || pLeft >= nLeft)) {
          nucleonTypes.push('proton');
          pLeft--;
        } else if (nLeft > 0) {
          nucleonTypes.push('neutron');
          nLeft--;
        }
      }

      // 2. Generate tight, physically touching sphere positions (Close-Packing with zero empty gaps)
      const touchDist = sphereR * 1.96; // slightly fused by 2% to represent strong nuclear force binding
      const positions: THREE.Vector3[] = [];

      if (totalNucleons === 1) {
        positions.push(new THREE.Vector3(0, 0, 0));
      } else if (totalNucleons === 2) {
        positions.push(new THREE.Vector3(-touchDist * 0.5, 0, 0));
        positions.push(new THREE.Vector3(touchDist * 0.5, 0, 0));
      } else if (totalNucleons === 3) {
        const r = touchDist / Math.sqrt(3);
        for (let k = 0; k < 3; k++) {
          const a = (k * 2 * Math.PI) / 3;
          positions.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
        }
      } else if (totalNucleons === 4) {
        // Regular tetrahedron (Helium-4 / alpha particle: densest 4-sphere cluster)
        const a = touchDist / Math.SQRT2;
        positions.push(new THREE.Vector3( a * 0.5,  a * 0.5,  a * 0.5));
        positions.push(new THREE.Vector3(-a * 0.5, -a * 0.5,  a * 0.5));
        positions.push(new THREE.Vector3(-a * 0.5,  a * 0.5, -a * 0.5));
        positions.push(new THREE.Vector3( a * 0.5, -a * 0.5, -a * 0.5));
      } else {
        // Face-Centered Cubic (FCC) close-packing (Kepler conjecture: maximum 74% density of touching spheres)
        const latticePoints: THREE.Vector3[] = [];
        const maxL = 5;
        const step = touchDist / Math.SQRT2;
        for (let x = -maxL; x <= maxL; x++) {
          for (let y = -maxL; y <= maxL; y++) {
            for (let z = -maxL; z <= maxL; z++) {
              if ((Math.abs(x) + Math.abs(y) + Math.abs(z)) % 2 === 0) {
                latticePoints.push(new THREE.Vector3(x * step, y * step, z * step));
              }
            }
          }
        }
        // Sort strictly by distance from origin (0,0,0) so the nucleus grows as a dense, solid cluster
        latticePoints.sort((a, b) => a.lengthSq() - b.lengthSq());
        for (let k = 0; k < totalNucleons; k++) {
          positions.push(latticePoints[k]);
        }
      }

      // Add spheres to nucleus group
      positions.forEach((pos, idx) => {
        const isProton = nucleonTypes[idx] === 'proton';
        const mat = isProton ? protonMat : neutronMat;
        const geo = isProton ? protonGeo : neutronGeo;
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);

        mesh.userData = {
          origX: pos.x,
          origY: pos.y,
          origZ: pos.z,
          jitterOffset: idx * 0.618
        };

        nucleusGroup.add(mesh);
      });

      clusterMaxRadius = positions.length > 0 ? Math.max(...positions.map(p => p.length())) + sphereR : 2.0;

      // Add Glowing Nuclear Field Halo tightly around the dense cluster (smooth glowing shell, non-wireframe)
      const haloGeo = new THREE.SphereGeometry(clusterMaxRadius * 1.15, 32, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: isStable ? 0x38bdf8 : 0xf43f5e,
        transparent: true,
        opacity: 0.10,
        blending: THREE.AdditiveBlending,
        wireframe: false,
        side: THREE.BackSide
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      nucleusGroup.add(haloMesh);
    }

    // --- B. BUILD 3D ELECTRON SHELLS & ORBITALS ---
    const baseRadius = Math.max(9.0, clusterMaxRadius + 4.2);
    const radiusStep = 5.2;

    // Electron Geometries & Materials with high-fidelity MeshPhysicalMaterial
    const electronGeo = new THREE.SphereGeometry(0.75, 18, 18);
    const spinUpMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });
    const spinDownMat = new THREE.MeshPhysicalMaterial({
      color: 0xfb923c,
      emissive: 0xea580c,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });

    if (viewType === 'bohr_spatial') {
      // Bohr 3D Spatial: Each principal quantum shell has its own tilted spatial plane.
      // ALL electrons belonging to that shell travel STRICTLY on that shell's ring.
      shells.forEach((count, shellIdx) => {
        if (count === 0) return;

        const shellRadius = baseRadius + shellIdx * radiusStep;
        
        // Coordinated 3D tilt angle per shell giving authentic spatial depth
        const tiltX = (shellIdx * 0.26) - 0.2;
        const tiltY = (shellIdx * 0.42);
        const tiltZ = (shellIdx * 0.18) - 0.1;

        // 1. Build and add the visible 3D Orbit Ring for this shell
        if (showRings) {
          const curve = new THREE.EllipseCurve(
            0, 0,
            shellRadius, shellRadius,
            0, 2 * Math.PI,
            false,
            0
          );
          const points = curve.getPoints(128);
          const ringGeo = new THREE.BufferGeometry().setFromPoints(
            points.map(p => new THREE.Vector3(p.x, 0, p.y))
          );
          const ringMat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.45
          });
          const ringLine = new THREE.LineLoop(ringGeo, ringMat);
          ringLine.rotation.set(tiltX, tiltY, tiltZ);
          atomGroup.add(ringLine);
        }

        // 2. Distribute all electrons in this shell strictly along this ring
        for (let e = 0; e < count; e++) {
          const isSpinUp = e % 2 === 0;

          // Single Electron 3D Group
          const eGroup = new THREE.Group();
          const eMesh = new THREE.Mesh(electronGeo, isSpinUp ? spinUpMat : spinDownMat);
          eGroup.add(eMesh);

          // 3D Directional Vector Arrow (Cone + Cylinder)
          let arrowGroup: THREE.Group | undefined;
          if (showSpinArrows) {
            arrowGroup = new THREE.Group();
            
            // Tangent Arrow head (Cone) & shaft
            const coneGeo = new THREE.ConeGeometry(0.7, 1.8, 12);
            coneGeo.rotateX(Math.PI / 2); // point forward
            const arrowMat = new THREE.MeshBasicMaterial({
              color: isSpinUp ? 0x38bdf8 : 0xf97316
            });
            const coneMesh = new THREE.Mesh(coneGeo, arrowMat);
            coneMesh.position.set(0, 0, 2.4);
            arrowGroup.add(coneMesh);

            // Small shaft line
            const shaftGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.8, 8);
            shaftGeo.rotateX(Math.PI / 2);
            const shaftMesh = new THREE.Mesh(shaftGeo, arrowMat);
            shaftMesh.position.set(0, 0, 1.2);
            arrowGroup.add(shaftMesh);

            eGroup.add(arrowGroup);
          }

          atomGroup.add(eGroup);

          // Base angular speed (alternating direction per Pauli principle)
          const direction = isSpinUp ? -1 : 1;
          const baseSpeed = (0.024 / (shellIdx + 1)) * direction;
          const initialAngle = (e / count) * Math.PI * 2;

          electronMeshes.push({
            mesh: eGroup,
            shellIndex: shellIdx,
            orbitRadius: shellRadius,
            speed: baseSpeed,
            angle: initialAngle,
            inclinationX: tiltX,
            inclinationY: tiltY,
            inclinationZ: tiltZ,
            isSpinUp,
            arrowGroup
          });
        }
      });
    } else if (viewType === 'rutherford') {
      // Classic Rutherford crossed orbital planes (iconic 3 crossed 3D orbits)
      const rutherfordPlanes = [
        { incX: 0.85, incY: 0.1, incZ: 0.35, color: 0x38bdf8 },
        { incX: -0.75, incY: 0.5, incZ: -0.4, color: 0x818cf8 },
        { incX: 0.15, incY: 0.95, incZ: 0.8, color: 0x34d399 }
      ];

      shells.forEach((count, shellIdx) => {
        if (count === 0) return;
        const shellRadius = baseRadius + shellIdx * radiusStep;

        // Draw rings for each crossed plane used in this shell
        const activePlanesCount = Math.min(3, Math.max(1, Math.ceil(count / 2)));
        for (let pIdx = 0; pIdx < activePlanesCount; pIdx++) {
          if (showRings) {
            const curve = new THREE.EllipseCurve(
              0, 0,
              shellRadius, shellRadius,
              0, 2 * Math.PI,
              false,
              0
            );
            const points = curve.getPoints(128);
            const ringGeo = new THREE.BufferGeometry().setFromPoints(
              points.map(p => new THREE.Vector3(p.x, 0, p.y))
            );
            const ringMat = new THREE.LineBasicMaterial({
              color: rutherfordPlanes[pIdx].color,
              transparent: true,
              opacity: 0.45
            });
            const ringLine = new THREE.LineLoop(ringGeo, ringMat);
            ringLine.rotation.set(
              rutherfordPlanes[pIdx].incX,
              rutherfordPlanes[pIdx].incY,
              rutherfordPlanes[pIdx].incZ
            );
            atomGroup.add(ringLine);
          }
        }

        // Distribute electrons strictly onto these crossed planes
        for (let e = 0; e < count; e++) {
          const isSpinUp = e % 2 === 0;
          const planeIdx = Math.floor(e / 2) % activePlanesCount;
          const plane = rutherfordPlanes[planeIdx];

          const eGroup = new THREE.Group();
          const eMesh = new THREE.Mesh(electronGeo, isSpinUp ? spinUpMat : spinDownMat);
          eGroup.add(eMesh);

          let arrowGroup: THREE.Group | undefined;
          if (showSpinArrows) {
            arrowGroup = new THREE.Group();
            const coneGeo = new THREE.ConeGeometry(0.7, 1.8, 12);
            coneGeo.rotateX(Math.PI / 2);
            const arrowMat = new THREE.MeshBasicMaterial({
              color: isSpinUp ? 0x38bdf8 : 0xf97316
            });
            const coneMesh = new THREE.Mesh(coneGeo, arrowMat);
            coneMesh.position.set(0, 0, 2.4);
            arrowGroup.add(coneMesh);

            const shaftGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.8, 8);
            shaftGeo.rotateX(Math.PI / 2);
            const shaftMesh = new THREE.Mesh(shaftGeo, arrowMat);
            shaftMesh.position.set(0, 0, 1.2);
            arrowGroup.add(shaftMesh);

            eGroup.add(arrowGroup);
          }

          atomGroup.add(eGroup);

          const direction = isSpinUp ? -1 : 1;
          const baseSpeed = (0.024 / (shellIdx + 1)) * direction;
          const initialAngle = (e / count) * Math.PI * 2;

          electronMeshes.push({
            mesh: eGroup,
            shellIndex: shellIdx,
            orbitRadius: shellRadius,
            speed: baseSpeed,
            angle: initialAngle,
            inclinationX: plane.incX,
            inclinationY: plane.incY,
            inclinationZ: plane.incZ,
            isSpinUp,
            arrowGroup
          });
        }
      });
    }

    // --- C. QUANTUM PROBABILITY CLOUD MODE (|ψ|²) ---
    // Authentic Schrödinger wavefunctions ψ_nlm(r, θ, φ) and Acceptance-Rejection Sampling
    let cloudPoints: THREE.Points | null = null;
    if (viewType === 'quantum_cloud') {
      const particleCount = Math.min(4500, 800 + electrons * 160);
      const cloudPositions = new Float32Array(particleCount * 3);
      const cloudColors = new Float32Array(particleCount * 3);

      const colorPeak = new THREE.Color(0x22d3ee);  // Cyan for high probability density antinodes
      const colorMid = new THREE.Color(0xa855f7);   // Purple for medium density
      const colorTail = new THREE.Color(0x312e81);  // Deep indigo for exponential tails
      const colorNode = new THREE.Color(0x0284c7);  // Royal blue near nodes

      // Active subshells to sample based on atom's electron count and user's orbital filter
      const availableOrbitals: ('1s' | '2s' | '2px' | '2py' | '2pz' | '3s' | '3px' | '3py' | '3pz' | '3d_z2' | '3d_xy' | '3d_x2y2')[] = [];

      // Determine populated orbitals by Aufbau principle
      if (orbitalFilter === 'all' || orbitalFilter === 's') {
        availableOrbitals.push('1s');
        if (electrons > 2) availableOrbitals.push('2s');
        if (electrons > 10) availableOrbitals.push('3s');
      }
      if (orbitalFilter === 'all' || orbitalFilter === 'p') {
        if (electrons > 4 || orbitalFilter === 'p') {
          availableOrbitals.push('2px', '2py', '2pz');
        }
        if (electrons > 12) {
          availableOrbitals.push('3px', '3py', '3pz');
        }
      }
      if (orbitalFilter === 'all' || orbitalFilter === 'd') {
        if (electrons > 20 || orbitalFilter === 'd') {
          availableOrbitals.push('3d_z2', '3d_xy', '3d_x2y2');
        }
      }

      if (availableOrbitals.length === 0) {
        availableOrbitals.push('1s');
      }

      // Exact Hydrogenic Probability Density Evaluator: P(r, θ, φ) = r² |ψ_nlm|²
      const evaluateDensity = (
        orb: '1s' | '2s' | '2px' | '2py' | '2pz' | '3s' | '3px' | '3py' | '3pz' | '3d_z2' | '3d_xy' | '3d_x2y2',
        r: number,
        theta: number,
        phi: number
      ): number => {
        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);
        const sinP = Math.sin(phi);
        const cosP = Math.cos(phi);

        if (orb === '1s') {
          // ψ_100 = 2 * exp(-r), P = r² * 4 * exp(-2r)
          const psi = 2 * Math.exp(-r);
          return r * r * psi * psi;
        }
        if (orb === '2s') {
          // ψ_200 = (1/2√2) * (2 - r) * exp(-r/2). Radial node at r = 2.0!
          const psi = (2 - r) * Math.exp(-r / 2);
          return r * r * psi * psi * 0.45;
        }
        if (orb === '2pz') {
          // ψ_210 = (1/2√6) * r * exp(-r/2) * cos(θ). Dumbbell along Z!
          const psi = r * Math.exp(-r / 2) * cosT;
          return r * r * psi * psi * 0.45;
        }
        if (orb === '2px') {
          // Dumbbell along X: sin(θ)*cos(φ)
          const psi = r * Math.exp(-r / 2) * (sinT * cosP);
          return r * r * psi * psi * 0.45;
        }
        if (orb === '2py') {
          // Dumbbell along Y: sin(θ)*sin(φ)
          const psi = r * Math.exp(-r / 2) * (sinT * sinP);
          return r * r * psi * psi * 0.45;
        }
        if (orb === '3s') {
          // ψ_300 has TWO radial nodes!
          const rho = (2 * r) / 3;
          const psi = (6 - 6 * rho + rho * rho) * Math.exp(-rho / 2);
          return r * r * psi * psi * 0.025;
        }
        if (orb === '3px' || orb === '3py' || orb === '3pz') {
          const rho = (2 * r) / 3;
          const angular = orb === '3pz' ? cosT : orb === '3px' ? sinT * cosP : sinT * sinP;
          const psi = (4 - rho) * rho * Math.exp(-rho / 2) * angular;
          return r * r * psi * psi * 0.035;
        }
        if (orb === '3d_z2') {
          // Torus + 2 lobes: (3*cos²θ - 1)
          const rho = (2 * r) / 3;
          const psi = rho * rho * Math.exp(-rho / 2) * (3 * cosT * cosT - 1);
          return r * r * psi * psi * 0.028;
        }
        if (orb === '3d_xy') {
          // Cloverleaf in xy plane: sin²θ * sin(2φ)
          const rho = (2 * r) / 3;
          const psi = rho * rho * Math.exp(-rho / 2) * (sinT * sinT * Math.sin(2 * phi));
          return r * r * psi * psi * 0.08;
        }
        // 3d_x2y2 cloverleaf: sin²θ * cos(2φ)
        const rho = (2 * r) / 3;
        const psi = rho * rho * Math.exp(-rho / 2) * (sinT * sinT * Math.cos(2 * phi));
        return r * r * psi * psi * 0.08;
      };

      // Scale factor to map atomic Bohr radii to 3D scene units
      const a0Scale = 4.2;
      let acceptedCount = 0;
      let attempts = 0;
      const maxAttempts = particleCount * 25;

      while (acceptedCount < particleCount && attempts < maxAttempts) {
        attempts++;
        const targetOrb = availableOrbitals[Math.floor(Math.random() * availableOrbitals.length)];

        // Radial coordinate sampling r ∈ [0.1, 14.0]
        const maxR = targetOrb.startsWith('3') ? 14.0 : targetOrb.startsWith('2') ? 10.0 : 6.0;
        const rBohr = 0.1 + Math.random() * maxR;
        const theta = Math.acos(2 * Math.random() - 1); // uniform spherical distribution
        const phi = Math.random() * Math.PI * 2;

        const density = evaluateDensity(targetOrb, rBohr, theta, phi);
        const maxProbEstimate = 0.65; // normalization reference

        // Acceptance-Rejection test
        if (Math.random() < density / maxProbEstimate) {
          const rSpatial = rBohr * a0Scale;
          const x = rSpatial * Math.sin(theta) * Math.cos(phi);
          const y = rSpatial * Math.cos(theta);
          const z = rSpatial * Math.sin(theta) * Math.sin(phi);

          cloudPositions[acceptedCount * 3] = x;
          cloudPositions[acceptedCount * 3 + 1] = y;
          cloudPositions[acceptedCount * 3 + 2] = z;

          // Compute color gradient according to local quantum density:
          // Antinodes (high density) -> Electric Cyan / Emerald, Nodes/Tails -> Indigo
          const normDensity = Math.min(1.0, density / 0.35);
          const pColor = colorTail.clone().lerp(colorMid, normDensity * 0.7).lerp(colorPeak, Math.pow(normDensity, 1.8));

          cloudColors[acceptedCount * 3] = pColor.r;
          cloudColors[acceptedCount * 3 + 1] = pColor.g;
          cloudColors[acceptedCount * 3 + 2] = pColor.b;

          acceptedCount++;
        }
      }

      const cloudGeo = new THREE.BufferGeometry();
      cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPositions.subarray(0, acceptedCount * 3), 3));
      cloudGeo.setAttribute('color', new THREE.BufferAttribute(cloudColors.subarray(0, acceptedCount * 3), 3));

      const cloudMat = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending
      });

      cloudPoints = new THREE.Points(cloudGeo, cloudMat);
      atomGroup.add(cloudPoints);
    }

    // --- D. SOLID 3D ORBITAL LOBES MODE (s, p, d HARMONIC GEOMETRY) ---
    let orbitalLobesGroup: THREE.Group | null = null;
    if (viewType === 'orbital_lobes') {
      orbitalLobesGroup = new THREE.Group();
      atomGroup.add(orbitalLobesGroup);

      // Faint XYZ Cartesian reference axes for spatial orientation
      const axisLen = 28;
      const axisMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.4 });
      [
        [new THREE.Vector3(-axisLen, 0, 0), new THREE.Vector3(axisLen, 0, 0)],
        [new THREE.Vector3(0, -axisLen, 0), new THREE.Vector3(0, axisLen, 0)],
        [new THREE.Vector3(0, 0, -axisLen), new THREE.Vector3(0, 0, axisLen)]
      ].forEach(pts => {
        const g = new THREE.BufferGeometry().setFromPoints(pts);
        orbitalLobesGroup!.add(new THREE.Line(g, axisMat));
      });

      const posPhaseMat = new THREE.MeshPhysicalMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.25,
        roughness: 0.18,
        metalness: 0.05,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      });
      const negPhaseMat = new THREE.MeshPhysicalMaterial({
        color: 0xf43f5e,
        emissive: 0xbe123c,
        emissiveIntensity: 0.22,
        roughness: 0.18,
        metalness: 0.05,
        transparent: true,
        opacity: 0.38,
        depthWrite: false
      });
      const torusMat = new THREE.MeshPhysicalMaterial({
        color: 0xa855f7,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.25,
        roughness: 0.2,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      });

      // s-orbitals (1s, 2s, 3s spherical shells)
      if (orbitalFilter === 'all' || orbitalFilter === 's') {
        const sMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.2,
          roughness: 0.2,
          transparent: true,
          opacity: orbitalFilter === 's' ? 0.36 : 0.18,
          depthWrite: false
        });
        const sRadius = orbitalFilter === 's' ? (electrons > 10 ? 18 : electrons > 2 ? 14 : 9) : 8.5;
        const sMesh = new THREE.Mesh(new THREE.SphereGeometry(sRadius, 32, 32), sMat);
        orbitalLobesGroup.add(sMesh);
        if (electrons > 2 && orbitalFilter === 's') {
          const innerS = new THREE.Mesh(new THREE.SphereGeometry(sRadius * 0.52, 24, 24), sMat);
          orbitalLobesGroup.add(innerS);
        }
      }

      // p-orbitals (px, py, pz dumbbell lobes with +/- wave phase colors)
      if (orbitalFilter === 'all' || orbitalFilter === 'p') {
        const makeTeardropLobe = (dir: THREE.Vector3, mat: THREE.Material, dist = 10.5, scaleXZ = 4.6, scaleY = 8.4) => {
          const lobeGeo = new THREE.SphereGeometry(1, 24, 24);
          const lobe = new THREE.Mesh(lobeGeo, mat);
          lobe.scale.set(scaleXZ, scaleY, scaleXZ);
          lobe.position.copy(dir).multiplyScalar(dist);
          lobe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          return lobe;
        };

        // Always draw pz; add px and py if electrons > 6 or specifically viewing 'p'
        orbitalLobesGroup.add(makeTeardropLobe(new THREE.Vector3(0, 1, 0), posPhaseMat));
        orbitalLobesGroup.add(makeTeardropLobe(new THREE.Vector3(0, -1, 0), negPhaseMat));

        if (electrons >= 6 || orbitalFilter === 'p') {
          orbitalLobesGroup.add(makeTeardropLobe(new THREE.Vector3(1, 0, 0), posPhaseMat));
          orbitalLobesGroup.add(makeTeardropLobe(new THREE.Vector3(-1, 0, 0), negPhaseMat));
        }
        if (electrons >= 7 || orbitalFilter === 'p') {
          orbitalLobesGroup.add(makeTeardropLobe(new THREE.Vector3(0, 0, 1), posPhaseMat));
          orbitalLobesGroup.add(makeTeardropLobe(new THREE.Vector3(0, 0, -1), negPhaseMat));
        }
      }

      // d-orbitals (3d_z2 + 3d_xy cloverleaf)
      if (orbitalFilter === 'd' || (orbitalFilter === 'all' && electrons > 20)) {
        const scaleD = orbitalFilter === 'd' ? 1.15 : 0.85;
        // 4 cloverleaf lobes in XZ plane (d_x2-y2 / d_xy style)
        const dirs: Array<[THREE.Vector3, THREE.Material]> = [
          [new THREE.Vector3(1, 0, 1).normalize(), posPhaseMat],
          [new THREE.Vector3(-1, 0, -1).normalize(), posPhaseMat],
          [new THREE.Vector3(1, 0, -1).normalize(), negPhaseMat],
          [new THREE.Vector3(-1, 0, 1).normalize(), negPhaseMat]
        ];
        dirs.forEach(([d, m]) => {
          const lobe = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 22), m);
          lobe.scale.set(4.2 * scaleD, 9.2 * scaleD, 4.2 * scaleD);
          lobe.position.copy(d).multiplyScalar(13 * scaleD);
          lobe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
          orbitalLobesGroup!.add(lobe);
        });

        // d_z2 collar torus + axial lobes when focused on 'd'
        if (orbitalFilter === 'd') {
          const collar = new THREE.Mesh(new THREE.TorusGeometry(8.2, 2.2, 18, 48), torusMat);
          collar.rotation.x = Math.PI / 2;
          orbitalLobesGroup.add(collar);
          [1, -1].forEach(sign => {
            const axial = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 22), posPhaseMat);
            axial.scale.set(4.4, 9.0, 4.4);
            axial.position.set(0, sign * 12.5, 0);
            orbitalLobesGroup!.add(axial);
          });
        }
      }
    }

    // Photon Emission Pulse Ring for Quantum Excitation (n -> n+1 -> n)
    const photonWaveGeo = new THREE.TorusGeometry(2.5, 0.28, 12, 36);
    const photonWaveMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    const photonWaveMesh = new THREE.Mesh(photonWaveGeo, photonWaveMat);
    photonWaveMesh.visible = false;
    atomGroup.add(photonWaveMesh);

    // --- ANIMATION LOOP ---
    let time = 0;
    const animate = () => {
      time += 0.016 * orbitSpeed;

      // Advance Quantum Excitation Cycle if active
      let excitedRadialBoost = 0;
      if (excitationProgressRef.current >= 0) {
        excitationProgressRef.current += 0.016;
        const p = excitationProgressRef.current;
        if (p < 0.45) {
          // Rising to n+1 shell
          excitedRadialBoost = Math.sin((p / 0.45) * (Math.PI / 2)) * 5.2;
          photonWaveMesh.visible = false;
        } else if (p < 1.15) {
          // Relaxing back to n while emitting photon wavepacket
          const tRelax = (p - 0.45) / 0.7;
          excitedRadialBoost = Math.max(0, (1 - tRelax * 2.2) * 5.2);
          photonWaveMesh.visible = true;
          const waveScale = 1 + tRelax * 9.5;
          photonWaveMesh.scale.setScalar(waveScale);
          photonWaveMat.opacity = Math.max(0, 0.85 * (1 - tRelax));
        } else {
          excitationProgressRef.current = -1;
          photonWaveMesh.visible = false;
        }
      }

      // 1. Update Camera Position from Spherical Coordinates
      if (autoRotate && !isDraggingRef.current) {
        cameraSphericalRef.current.theta += 0.0035 * orbitSpeed;
      }

      const { radius, theta, phi } = cameraSphericalRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 0, 0);

      // 2. Jitter & Pulse 3D Nucleus
      if (showNucleusCluster) {
        nucleusGroup.children.forEach(child => {
          if (child.userData && child.userData.origX !== undefined) {
            const jitterSpeed = 3.5;
            const jitterScale = isStable ? 0.03 : 0.12; // tight nuclear binding vibration
            const offset = child.userData.jitterOffset;
            child.position.x = child.userData.origX + Math.sin(time * jitterSpeed + offset) * jitterScale;
            child.position.y = child.userData.origY + Math.cos(time * jitterSpeed + offset * 1.5) * jitterScale;
            child.position.z = child.userData.origZ + Math.sin(time * jitterSpeed + offset * 2) * jitterScale;
          }
        });
      }

      // 3. Move Orbiting 3D Electrons with Velocity Vectors (+ Quantum Excitation Jump on outermost valence electron)
      const valenceIdx = electronMeshes.length - 1;
      electronMeshes.forEach((eData, idx) => {
        eData.angle += eData.speed * orbitSpeed;
        const r = idx === valenceIdx ? eData.orbitRadius + excitedRadialBoost : eData.orbitRadius;

        const localX = Math.cos(eData.angle) * r;
        const localZ = Math.sin(eData.angle) * r;
        const localPos = new THREE.Vector3(localX, 0, localZ);

        const euler = new THREE.Euler(eData.inclinationX, eData.inclinationY, eData.inclinationZ, 'XYZ');
        localPos.applyEuler(euler);

        eData.mesh.position.copy(localPos);
        if (idx === valenceIdx && excitedRadialBoost > 0.3 && photonWaveMesh.visible === false) {
          photonWaveMesh.position.copy(localPos);
          photonWaveMesh.rotation.set(eData.inclinationX, eData.inclinationY, eData.inclinationZ);
        }

        if (eData.arrowGroup && showSpinArrows) {
          const tangentDir = eData.speed >= 0 ? 1 : -1;
          const tangentLocal = new THREE.Vector3(
            -Math.sin(eData.angle) * tangentDir,
            0,
            Math.cos(eData.angle) * tangentDir
          ).normalize().applyEuler(euler);

          eData.arrowGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangentLocal);
        }
      });

      // 4. Subtle rotation for Quantum Cloud & Orbital Lobes
      if (cloudPoints) {
        cloudPoints.rotation.y += 0.002 * orbitSpeed;
        cloudPoints.rotation.x += 0.001 * orbitSpeed;
      }
      if (orbitalLobesGroup) {
        orbitalLobesGroup.rotation.y += 0.003 * orbitSpeed;
      }

      if (container.clientWidth > 0 && container.clientHeight > 0) {
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const pr = renderer.getPixelRatio();
        if (
          Math.abs(renderer.domElement.width - Math.floor(cw * pr)) > 2 ||
          Math.abs(renderer.domElement.height - Math.floor(ch * pr)) > 2
        ) {
          camera.aspect = cw / ch;
          camera.updateProjectionMatrix();
          renderer.setSize(cw, ch, false);
        }
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW <= 0 || newH <= 0) return;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH, false);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount or dependency change
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
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
  }, [
    protons,
    neutrons,
    electrons,
    shells,
    viewType,
    orbitalFilter,
    showRings,
    showNucleusCluster,
    showSpinArrows,
    orbitSpeed,
    autoRotate,
    isStable,
    dimensionMode
  ]);

  // Mouse & Touch Orbit Controls Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    const rotateSpeed = 0.007;
    cameraSphericalRef.current.theta -= deltaX * rotateSpeed;
    cameraSphericalRef.current.phi = Math.max(
      0.15,
      Math.min(Math.PI - 0.15, cameraSphericalRef.current.phi - deltaY * rotateSpeed)
    );
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.06;
    cameraSphericalRef.current.radius = Math.max(
      25,
      Math.min(180, cameraSphericalRef.current.radius + e.deltaY * zoomSpeed)
    );
  };

  // Touch Handlers for Mobile Orbit Drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - prevMousePosRef.current.x;
    const deltaY = e.touches[0].clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    const rotateSpeed = 0.009;
    cameraSphericalRef.current.theta -= deltaX * rotateSpeed;
    cameraSphericalRef.current.phi = Math.max(
      0.15,
      Math.min(Math.PI - 0.15, cameraSphericalRef.current.phi - deltaY * rotateSpeed)
    );
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const zoomIn = () => {
    cameraSphericalRef.current.radius = Math.max(25, cameraSphericalRef.current.radius - 12);
  };

  const zoomOut = () => {
    cameraSphericalRef.current.radius = Math.min(180, cameraSphericalRef.current.radius + 12);
  };

  const resetCamera = () => {
    cameraSphericalRef.current = {
      radius: recommendedCamRadius,
      theta: Math.PI / 4,
      phi: Math.PI / 3
    };
  };

  const triggerQuantumJump = () => {
    playLabSound('spark');
    excitationProgressRef.current = 0;
  };

  return (
    <div className="w-full max-w-[460px]">
      <StageViewportFrame
        isFullscreen={isFullscreen}
        canvasHeightClass="h-[340px] sm:h-[380px]"
        accentColor="cyan"
        title={
          <>
            <h3 className="text-sm sm:text-base font-bold truncate">
              {elementName}
            </h3>
            <span dir="ltr" className="text-xs font-mono font-bold text-cyan-500">
              {elementSymbol}
            </span>
          </>
        }
        subtitle={
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <div className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <button
                type="button"
                onClick={() => {
                  playLabSound('click');
                  setViewType('bohr_spatial');
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                  viewType === 'bohr_spatial' ? 'bg-cyan-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('بور 3D', '3D Bohr')}
              </button>
              <button
                type="button"
                onClick={() => {
                  playLabSound('click');
                  setViewType('rutherford');
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                  viewType === 'rutherford' ? 'bg-cyan-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('رذرفورد', 'Rutherford')}
              </button>
              <button
                type="button"
                onClick={() => {
                  playLabSound('click');
                  setViewType('quantum_cloud');
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                  viewType === 'quantum_cloud' ? 'bg-cyan-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('السحابة', 'Cloud')}
              </button>
              <button
                type="button"
                onClick={() => {
                  playLabSound('click');
                  setViewType('orbital_lobes');
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                  viewType === 'orbital_lobes' ? 'bg-cyan-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('أفلاك s/p/d', 's/p/d')}
              </button>
            </div>

            {(viewType === 'quantum_cloud' || viewType === 'orbital_lobes') && (
              <div className={`inline-flex items-center gap-0.5 p-0.5 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                {(['all', 's', 'p', 'd'] as const).map((orb) => (
                  <button
                    key={orb}
                    type="button"
                    onClick={() => {
                      playLabSound('click');
                      setOrbitalFilter(orb);
                    }}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-colors ${
                      orbitalFilter === orb ? 'bg-cyan-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {orb === 'all' ? t('الكل', 'All') : orb}
                  </button>
                ))}
              </div>
            )}
          </div>
        }
        toolbar={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-lg border transition-colors ${
                autoRotate
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title={autoRotate ? t('إيقاف الدوران التلقائي', 'Pause auto-rotation') : t('تشغيل الدوران التلقائي', 'Auto-rotate')}
            >
              {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={triggerQuantumJump}
              disabled={electrons === 0 || (viewType !== 'bohr_spatial' && viewType !== 'rutherford')}
              className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-purple-300 hover:text-white hover:border-purple-500'
                  : 'bg-white border-slate-200 text-purple-600 hover:border-purple-500'
              }`}
              title={t('تحفيز قفزة كمومية للإلكترون (n → n+1) وانبعاث فوتون', 'Trigger Quantum Jump (n → n+1) & Photon Emission')}
            >
              <Zap className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowNucleusCluster(!showNucleusCluster)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showNucleusCluster
                  ? 'border-red-500/50 text-red-400 bg-red-500/10'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title={t('إظهار/إخفاء تجمع البروتونات والنيوترونات بالنواة', 'Toggle 3D Nucleus Cluster')}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setShowRings(!showRings)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showRings
                  ? 'border-cyan-500/60 text-cyan-500 bg-cyan-500/10'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title={t('إظهار/إخفاء حلقات المدارات ثلاثية الأبعاد', 'Toggle 3D Orbit Rings')}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={zoomIn}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-400' : 'bg-white border-slate-200 text-slate-600 hover:text-cyan-700'
              }`}
              title={t('تقريب (+)', 'Zoom In')}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={zoomOut}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-400' : 'bg-white border-slate-200 text-slate-600 hover:text-cyan-700'
              }`}
              title={t('تبعيد (-)', 'Zoom Out')}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={resetCamera}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-400' : 'bg-white border-slate-200 text-slate-600 hover:text-cyan-700'
              }`}
              title={t('إعادة ضبط زاوية الكاميرا', 'Reset Camera')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isFullscreen
                  ? 'bg-cyan-600 border-cyan-500 text-white'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title={isFullscreen ? t('تصغير النافذة', 'Exit fullscreen') : t('تكبير ثلاثي الأبعاد', '3D Fullscreen')}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        }
        bottomBar={
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <span>{t('اسحب للف والدوران 360° · مرر للتقريب', 'Drag 360° · Scroll to zoom')}</span>
            </span>
            <span className="font-mono tabular-nums">
              {protons}p⁺ · {neutrons}n⁰ · {electrons}e⁻
            </span>
          </div>
        }
      >
        <div
          ref={containerRef}
          className="w-full h-full select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing block"
          />
        </div>
      </StageViewportFrame>
    </div>
  );
};
