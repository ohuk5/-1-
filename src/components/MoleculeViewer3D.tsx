import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RotateCw, ZoomIn, ZoomOut, Maximize2, Minimize2, Layers, Palette, Compass, Orbit } from 'lucide-react';
import { CompoundInfo, CompositionAnalysisResult, BUILDER_ELEMENTS_MAP } from '../data/compoundsData';
import { useApp } from '../context/AppContext';
import { StageViewportFrame } from './StageViewportFrame';

export interface CustomStructure3D {
  atoms: Array<{ element: string; position: [number, number, number]; color?: string; radius?: number }>;
  bonds: Array<{ from: number; to: number; order: 1 | 2 | 3 }>;
  titleAr?: string;
  titleEn?: string;
  formula?: string;
  lonePairs?: number;
  vseprShapeAr?: string;
  vseprShapeEn?: string;
}

interface MoleculeViewer3DProps {
  compound?: CompoundInfo;
  analysis: CompositionAnalysisResult;
  elementCounts: Record<string, number>;
  customStructure?: CustomStructure3D;
  showDipoleToggle?: boolean;
}

// Known central-atom lone pairs for common VSEPR compounds
const KNOWN_LONE_PAIRS: Record<string, number> = {
  H2O: 2,
  NH3: 1,
  H2S: 2,
  SO2: 1,
  O3: 1,
  PCl3: 1,
  NF3: 1,
  SF4: 1,
  ClF3: 2,
  XeF2: 3,
  XeF4: 2,
  HCl: 3,
  HF: 3,
  CH3OH: 2,
  C2H5OH: 2
};

export const MoleculeViewer3D: React.FC<MoleculeViewer3DProps> = ({
  compound,
  analysis,
  elementCounts,
  customStructure,
  showDipoleToggle = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moleculeGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { theme, t } = useApp();
  const isDark = theme === 'dark';

  const [isRotating, setIsRotating] = useState<boolean>(true);
  const isRotatingRef = useRef<boolean>(true);
  const [viewMode, setViewMode] = useState<'ball_and_stick' | 'space_filling'>('ball_and_stick');
  const [showChargeMap, setShowChargeMap] = useState<boolean>(false);
  const [showDipoles, setShowDipoles] = useState<boolean>(false);
  const [showLonePairs, setShowLonePairs] = useState<boolean>(false);
  const [dipoleMagnitude, setDipoleMagnitude] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const fittedBaseZRef = useRef<number>(6.5);

  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  // Mouse / Touch interaction state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize Scene, Camera, Renderer with RoomEnvironment PMREM & ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 6.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights - Studio High-Fidelity Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.75 : 1.05);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.35);
    dirLight1.position.set(6, 9, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.7);
    dirLight2.position.set(-6, -5, -4);
    scene.add(dirLight2);

    const rimLight = new THREE.PointLight(0x06b6d4, 1.1, 25);
    rimLight.position.set(-5, 6, -5);
    scene.add(rimLight);

    const moleculeGroup = new THREE.Group();
    scene.add(moleculeGroup);
    moleculeGroupRef.current = moleculeGroup;

    // Render loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const curW = container.clientWidth;
      const curH = container.clientHeight;
      if (curW <= 0 || curH <= 0) return;

      if (moleculeGroupRef.current && isRotatingRef.current && !isDraggingRef.current) {
        moleculeGroupRef.current.rotation.y += 0.007;
        moleculeGroupRef.current.rotation.x += 0.0025;
      }

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(entry.contentRect.height);
        if (w > 0 && h > 0 && rendererRef.current && cameraRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isDark]);

  // Update Molecule Geometry whenever Compound / CustomStructure / Element Counts / Toggles change
  useEffect(() => {
    const group = moleculeGroupRef.current;
    if (!group) return;

    // Clear previous children & dispose
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      obj.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
        const mat = (child as THREE.Mesh).material;
        if (mat) {
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat.dispose();
        }
      });
    }

    group.rotation.set(0.12, 0.22, 0);

    let atomData: { element: string; position: [number, number, number]; color: string; radius: number }[] = [];
    let bondData: { from: number; to: number; order: 1 | 2 | 3 }[] = [];

    if (customStructure && customStructure.atoms.length > 0) {
      const posScale = viewMode === 'space_filling' ? 0.65 : 1.15;
      atomData = customStructure.atoms.map((a) => {
        const el = BUILDER_ELEMENTS_MAP.get(a.element);
        const color = a.color || el?.colorHex || '#94A3B8';
        const baseRadius = a.radius || el?.radius || 0.48;
        const radius = viewMode === 'space_filling' ? baseRadius * 1.65 : baseRadius * 0.42;
        return {
          element: a.element,
          position: [a.position[0] * posScale, a.position[1] * posScale, a.position[2] * posScale],
          color,
          radius
        };
      });
      bondData = customStructure.bonds;
    } else {
      const activeEntries = Object.entries(elementCounts).filter(([, count]) => count > 0);
      const totalAtoms = activeEntries.reduce((s, [, c]) => s + c, 0);
      if (totalAtoms === 0) {
        setDipoleMagnitude(0);
        return;
      }

      if (compound && compound.structure3D && compound.structure3D.atoms.length > 0) {
        const posScale = viewMode === 'space_filling' ? 0.65 : 1.35;
        atomData = compound.structure3D.atoms.map((a) => {
          const el = BUILDER_ELEMENTS_MAP.get(a.element);
          const color = a.color || el?.colorHex || '#94A3B8';
          const baseRadius = a.radius || el?.radius || 0.5;
          const radius = viewMode === 'space_filling' ? baseRadius * 1.75 : baseRadius * 0.42;
          return {
            element: a.element,
            position: [a.position[0] * posScale, a.position[1] * posScale, a.position[2] * posScale],
            color,
            radius
          };
        });
        bondData = compound.structure3D.bonds;
      } else {
        const flatList: string[] = [];
        for (const [sym, count] of activeEntries) {
          for (let i = 0; i < count; i++) flatList.push(sym);
        }
        flatList.sort((a, b) => {
          const va = BUILDER_ELEMENTS_MAP.get(a)?.primaryValence ?? 1;
          const vb = BUILDER_ELEMENTS_MAP.get(b)?.primaryValence ?? 1;
          return vb - va;
        });

        const n = flatList.length;
        const sphereScale = viewMode === 'space_filling' ? 1.75 : 0.42;
        if (n === 1) {
          const el = BUILDER_ELEMENTS_MAP.get(flatList[0]);
          atomData.push({
            element: flatList[0],
            position: [0, 0, 0],
            color: el?.colorHex || '#94A3B8',
            radius: (el?.radius || 0.5) * sphereScale
          });
        } else if (n === 2) {
          const el0 = BUILDER_ELEMENTS_MAP.get(flatList[0]);
          const el1 = BUILDER_ELEMENTS_MAP.get(flatList[1]);
          const dist = viewMode === 'space_filling' ? 1.5 : 2.4;
          atomData.push({
            element: flatList[0],
            position: [-dist / 2, 0, 0],
            color: el0?.colorHex || '#94A3B8',
            radius: (el0?.radius || 0.5) * sphereScale
          });
          atomData.push({
            element: flatList[1],
            position: [dist / 2, 0, 0],
            color: el1?.colorHex || '#94A3B8',
            radius: (el1?.radius || 0.5) * sphereScale
          });
          bondData.push({ from: 0, to: 1, order: 1 });
        } else {
          const centerEl = BUILDER_ELEMENTS_MAP.get(flatList[0]);
          atomData.push({
            element: flatList[0],
            position: [0, 0, 0],
            color: centerEl?.colorHex || '#94A3B8',
            radius: (centerEl?.radius || 0.6) * sphereScale
          });
          const orbitCount = n - 1;
          for (let i = 1; i < n; i++) {
            const el = BUILDER_ELEMENTS_MAP.get(flatList[i]);
            const angle = ((i - 1) / orbitCount) * Math.PI * 2;
            const zOffset = Math.sin(angle * 2) * 0.65;
            const dist = viewMode === 'space_filling' ? 1.6 : 2.45;
            atomData.push({
              element: flatList[i],
              position: [Math.cos(angle) * dist, Math.sin(angle) * dist, zOffset],
              color: el?.colorHex || '#94A3B8',
              radius: (el?.radius || 0.45) * sphereScale
            });
            bondData.push({ from: 0, to: i, order: 1 });
          }
        }
      }
    }

    // Compute per-atom Pauling partial charges (delta+ / delta-) across covalent bonds
    const partialCharges = new Array<number>(atomData.length).fill(0);
    bondData.forEach((bond) => {
      const a1 = atomData[bond.from];
      const a2 = atomData[bond.to];
      if (!a1 || !a2) return;
      const en1 = BUILDER_ELEMENTS_MAP.get(a1.element)?.electronegativity ?? 2.2;
      const en2 = BUILDER_ELEMENTS_MAP.get(a2.element)?.electronegativity ?? 2.2;
      const deltaEn = (en1 - en2) * 0.45; // negative electron draw increases negative charge on higher EN
      partialCharges[bond.from] -= deltaEn;
      partialCharges[bond.to] += deltaEn;
    });

    const getChargeHex = (q: number): THREE.Color => {
      if (q <= -0.1) {
        const strength = Math.min(1, Math.abs(q) / 0.85);
        return new THREE.Color('#94a3b8').lerp(new THREE.Color('#ef4444'), strength); // delta- Red
      }
      if (q >= 0.1) {
        const strength = Math.min(1, q / 0.85);
        return new THREE.Color('#94a3b8').lerp(new THREE.Color('#3b82f6'), strength); // delta+ Blue
      }
      return new THREE.Color('#22c55e'); // Neutral Greenish
    };

    // 1. Build Atom Meshes
    atomData.forEach((atom, idx) => {
      const atomDisplayColor = showChargeMap ? getChargeHex(partialCharges[idx]) : new THREE.Color(atom.color);
      const geometry = new THREE.SphereGeometry(atom.radius, 36, 36);
      const material = new THREE.MeshPhysicalMaterial({
        color: atomDisplayColor,
        roughness: 0.14,
        metalness: 0.06,
        clearcoat: 0.85,
        clearcoatRoughness: 0.1,
        emissive: atomDisplayColor,
        emissiveIntensity: showChargeMap ? 0.24 : 0.1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...atom.position);
      group.add(mesh);
    });

    // 2. Build Bonds
    if (viewMode === 'ball_and_stick' && bondData.length > 0) {
      const yAxis = new THREE.Vector3(0, 1, 0);

      bondData.forEach((bond) => {
        const fromAtom = atomData[bond.from];
        const toAtom = atomData[bond.to];
        if (!fromAtom || !toAtom) return;

        const p1 = new THREE.Vector3(...fromAtom.position);
        const p2 = new THREE.Vector3(...toAtom.position);
        const distance = p1.distanceTo(p2);
        if (distance < 0.001) return;

        const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
        let refUp = new THREE.Vector3(0, 1, 0);
        if (Math.abs(direction.dot(refUp)) > 0.85) {
          refUp = new THREE.Vector3(1, 0, 0);
        }
        const perp = new THREE.Vector3().crossVectors(direction, refUp).normalize();

        const renderCylinderSegment = (
          startPos: THREE.Vector3,
          segDistance: number,
          colorHex: string,
          radius: number,
          emissiveGlow = false
        ) => {
          const cylinderGeom = new THREE.CylinderGeometry(radius, radius, segDistance, 24);
          const cylinderMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(colorHex),
            roughness: emissiveGlow ? 0.05 : 0.2,
            metalness: emissiveGlow ? 0.05 : 0.18,
            clearcoat: 0.6,
            clearcoatRoughness: 0.1,
            emissive: emissiveGlow ? new THREE.Color(colorHex) : new THREE.Color(0x000000),
            emissiveIntensity: emissiveGlow ? 0.85 : 0
          });
          const cylinderMesh = new THREE.Mesh(cylinderGeom, cylinderMat);
          cylinderMesh.position.copy(startPos);
          cylinderMesh.quaternion.setFromUnitVectors(yAxis, direction);
          group.add(cylinderMesh);
        };

        const renderBondPair = (offsetVector = new THREE.Vector3(0, 0, 0), radius = 0.08) => {
          const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5).add(offsetVector);
          const halfDist = distance * 0.5;
          const color1 = showChargeMap ? `#${getChargeHex(partialCharges[bond.from]).getHexString()}` : fromAtom.color;
          const color2 = showChargeMap ? `#${getChargeHex(partialCharges[bond.to]).getHexString()}` : toAtom.color;
          const center1 = new THREE.Vector3().addVectors(p1, midPoint).multiplyScalar(0.5);
          renderCylinderSegment(center1, halfDist, color1, radius, false);
          const center2 = new THREE.Vector3().addVectors(midPoint, p2).multiplyScalar(0.5);
          renderCylinderSegment(center2, halfDist, color2, radius, false);
        };

        if (bond.order === 1) {
          renderBondPair(new THREE.Vector3(0, 0, 0), 0.085);
        } else if (bond.order === 2) {
          const offsetDist = 0.1;
          renderBondPair(perp.clone().multiplyScalar(offsetDist), 0.065);
          renderBondPair(perp.clone().multiplyScalar(-offsetDist), 0.065);
        } else if (bond.order === 3) {
          const offsetDist = 0.13;
          renderBondPair(new THREE.Vector3(0, 0, 0), 0.055);
          renderBondPair(perp.clone().multiplyScalar(offsetDist), 0.055);
          renderBondPair(perp.clone().multiplyScalar(-offsetDist), 0.055);
        }
      });
    }

    // 3. Calculate & Render Bond Dipoles + Net Molecular Dipole Moment Vector
    const netDipole = new THREE.Vector3(0, 0, 0);
    const yAxis = new THREE.Vector3(0, 1, 0);

    bondData.forEach((bond) => {
      const a1 = atomData[bond.from];
      const a2 = atomData[bond.to];
      if (!a1 || !a2) return;
      const en1 = BUILDER_ELEMENTS_MAP.get(a1.element)?.electronegativity ?? 2.2;
      const en2 = BUILDER_ELEMENTS_MAP.get(a2.element)?.electronegativity ?? 2.2;
      const diff = en2 - en1; // points toward atom2 if positive
      if (Math.abs(diff) < 0.05) return;

      const p1 = new THREE.Vector3(...a1.position);
      const p2 = new THREE.Vector3(...a2.position);
      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      const dipoleVec = dir.clone().multiplyScalar(diff);
      netDipole.add(dipoleVec);

      if (showDipoles) {
        const arrowDir = diff > 0 ? dir.clone() : dir.clone().negate();
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        // Offset slightly perpendicular so it sits neatly beside bond stick
        const perp = new THREE.Vector3(0, 1, 0).cross(arrowDir);
        if (perp.lengthSq() < 0.01) perp.set(1, 0, 0).cross(arrowDir);
        perp.normalize().multiplyScalar(0.28);

        const arrowLen = Math.min(1.1, Math.max(0.45, Math.abs(diff) * 0.55));
        const arrowHelper = new THREE.ArrowHelper(
          arrowDir,
          mid.clone().add(perp).sub(arrowDir.clone().multiplyScalar(arrowLen * 0.5)),
          arrowLen,
          0xf59e0b,
          0.22,
          0.14
        );
        group.add(arrowHelper);
      }
    });

    const computedMag = Number(netDipole.length().toFixed(2));
    setDipoleMagnitude(computedMag);

    if (showDipoles && computedMag > 0.12) {
      const netDir = netDipole.clone().normalize();
      const originOffset = netDir.clone().multiplyScalar(-1.1);
      const netArrow = new THREE.ArrowHelper(
        netDir,
        originOffset,
        2.3,
        0x22d3ee,
        0.42,
        0.24
      );
      group.add(netArrow);
    }

    // 4. Render VSEPR Lone-Pair Electron Lobes on Central Atom (if enabled)
    const activeLonePairs =
      customStructure?.lonePairs ??
      (compound ? KNOWN_LONE_PAIRS[compound.id] ?? KNOWN_LONE_PAIRS[compound.formula] ?? 0 : 0);

    if (showLonePairs && activeLonePairs > 0 && atomData.length > 0) {
      // Find central atom (most bonds)
      const bondCounts = new Array(atomData.length).fill(0);
      bondData.forEach((b) => {
        bondCounts[b.from]++;
        bondCounts[b.to]++;
      });
      let centerIdx = 0;
      let maxB = -1;
      bondCounts.forEach((c, idx) => {
        if (c > maxB) {
          maxB = c;
          centerIdx = idx;
        }
      });

      const centerPos = new THREE.Vector3(...atomData[centerIdx].position);
      // Average vector pointing away from bonded neighbors
      const awaySum = new THREE.Vector3(0, 0, 0);
      bondData.forEach((b) => {
        if (b.from === centerIdx) {
          awaySum.sub(new THREE.Vector3(...atomData[b.to].position).sub(centerPos).normalize());
        } else if (b.to === centerIdx) {
          awaySum.sub(new THREE.Vector3(...atomData[b.from].position).sub(centerPos).normalize());
        }
      });
      if (awaySum.lengthSq() < 0.01) awaySum.set(0, 1, 0);
      awaySum.normalize();

      let ortho = new THREE.Vector3(0, 0, 1);
      if (Math.abs(awaySum.dot(ortho)) > 0.9) ortho.set(1, 0, 0);
      ortho = new THREE.Vector3().crossVectors(awaySum, ortho).normalize();

      const lobeGeom = new THREE.SphereGeometry(0.45, 24, 24);
      lobeGeom.scale(0.68, 1.35, 0.68);
      const lobeMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#a855f7'),
        emissive: new THREE.Color('#9333ea'),
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.42,
        roughness: 0.18,
        depthWrite: false
      });

      const dotGeom = new THREE.SphereGeometry(0.08, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: '#fde047' });

      for (let lp = 0; lp < Math.min(3, activeLonePairs); lp++) {
        const lpDir = awaySum.clone();
        if (activeLonePairs === 2) {
          const angle = lp === 0 ? 0.62 : -0.62;
          lpDir.applyAxisAngle(ortho, angle);
        } else if (activeLonePairs === 3) {
          lpDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), (lp * Math.PI * 2) / 3);
        }
        lpDir.normalize();

        const lobeGroup = new THREE.Group();
        const lobeMesh = new THREE.Mesh(lobeGeom, lobeMat);
        lobeMesh.position.set(0, 0.72, 0);
        lobeGroup.add(lobeMesh);

        const e1 = new THREE.Mesh(dotGeom, dotMat);
        e1.position.set(-0.12, 0.95, 0);
        const e2 = new THREE.Mesh(dotGeom, dotMat);
        e2.position.set(0.12, 0.95, 0);
        lobeGroup.add(e1, e2);

        lobeGroup.position.copy(centerPos);
        lobeGroup.quaternion.setFromUnitVectors(yAxis, lpDir);
        group.add(lobeGroup);
      }
    }

    // Center geometry group bounding sphere
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);

    const sphere = box.getBoundingSphere(new THREE.Sphere());
    if (cameraRef.current && sphere.radius > 0) {
      const baseZ = Math.max(5.5, sphere.radius * 2.75);
      fittedBaseZRef.current = baseZ;
      cameraRef.current.position.z = baseZ / zoomLevel;
    }
  }, [compound, customStructure, elementCounts, viewMode, isDark, zoomLevel, showChargeMap, showDipoles, showLonePairs]);

  // Handle Drag to Rotate
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !moleculeGroupRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    moleculeGroupRef.current.rotation.y += deltaX * 0.01;
    moleculeGroupRef.current.rotation.x += deltaY * 0.01;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleResetCamera = () => {
    if (moleculeGroupRef.current) {
      moleculeGroupRef.current.rotation.set(0.12, 0.22, 0);
    }
    setZoomLevel(1);
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, fittedBaseZRef.current);
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.max(0.5, Math.min(2.5, prev + delta));
      if (cameraRef.current) {
        cameraRef.current.position.z = fittedBaseZRef.current / next;
      }
      return next;
    });
  };

  const titleLabel =
    (customStructure && t(customStructure.titleAr || '', customStructure.titleEn || '')) ||
    (compound && t(compound.nameAr, compound.nameEn)) ||
    analysis.empiricalFormula ||
    t('مجسم ثلاثي الأبعاد', '3D Molecule');

  const formulaBadge = customStructure?.formula || compound?.formula;

  return (
    <StageViewportFrame
      isFullscreen={isFullscreen}
      canvasHeightClass="h-[340px] sm:h-[400px]"
      accentColor="cyan"
      title={
        <>
          <h3 className="text-sm sm:text-base font-bold truncate">
            {titleLabel}
          </h3>
          {formulaBadge && (
            <span dir="ltr" className="text-xs sm:text-sm font-mono font-bold text-cyan-500 tabular-nums">
              {formulaBadge}
            </span>
          )}
        </>
      }
      subtitle={
        <>
          <span>
            {viewMode === 'ball_and_stick'
              ? t('نموذج الكرات والعصي', 'Ball-and-Stick')
              : t('نموذج التعبئة الفضائية', 'Space-Filling')}
          </span>
          {showDipoles && (
            <>
              <span aria-hidden="true">·</span>
              <span className={`font-mono font-bold tabular-nums ${dipoleMagnitude > 0.2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {dipoleMagnitude > 0.2
                  ? t(`قطبي (μ ≈ ${dipoleMagnitude.toFixed(2)} D)`, `Polar (μ ≈ ${dipoleMagnitude.toFixed(2)} D)`)
                  : t('غير قطبي (μ ≈ 0)', 'Non-Polar (μ ≈ 0)')}
              </span>
            </>
          )}
          {showChargeMap && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-bold text-xs">
                <span className="text-red-400">δ⁻</span> / <span className="text-blue-400">δ⁺</span>
              </span>
            </>
          )}
        </>
      }
      toolbar={
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isRotating
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isRotating ? t('إيقاف الدوران التلقائي', 'Pause Rotation') : t('تشغيل الدوران التلقائي', 'Resume Rotation')}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'ball_and_stick' ? 'space_filling' : 'ball_and_stick')}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-400'
                : 'bg-white border-slate-200 text-slate-600 hover:text-cyan-700'
            }`}
            title={t('تبديل نمط التمثيل (كرات وعصي / تعبئة فراغية)', 'Toggle Model Representation')}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {showDipoleToggle && (
            <button
              type="button"
              onClick={() => setShowDipoles(!showDipoles)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showDipoles
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-amber-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-amber-600'
              }`}
              title={t('إظهار متجهات القطبية والعزم الثنائي', 'Toggle Polarity & Dipole Moment Vectors')}
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowLonePairs(!showLonePairs)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showLonePairs
                ? 'bg-purple-600 border-purple-500 text-white'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-purple-400'
                : 'bg-white border-slate-200 text-slate-600 hover:text-purple-600'
            }`}
            title={t('إظهار أزواج الإلكترونات الحرة (VSEPR)', 'Toggle Central Lone-Pair Orbitals')}
          >
            <Orbit className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowChargeMap((v) => !v)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showChargeMap
                ? 'bg-rose-600 border-rose-500 text-white'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-rose-400'
                : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600'
            }`}
            title={t('توزيع الشحنة الكهروستاتيكية (δ⁺ / δ⁻ حسب السالبية الكهربائية)', 'Toggle Electrostatic Partial Charge Map (δ⁺ / δ⁻)')}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          <div className={`w-px h-5 mx-0.5 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />

          <button
            type="button"
            onClick={() => handleZoom(0.2)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-400'
                : 'bg-white border-slate-200 text-slate-600 hover:text-cyan-700'
            }`}
            title={t('تكبير', 'Zoom In')}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleZoom(-0.2)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-400'
                : 'bg-white border-slate-200 text-slate-600 hover:text-cyan-700'
            }`}
            title={t('تصغير', 'Zoom Out')}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-400'
                : 'bg-white border-slate-200 text-slate-600 hover:text-cyan-700'
            }`}
            title={t('إعادة ضبط الزاوية', 'Reset View')}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isFullscreen
                ? 'bg-cyan-600 border-cyan-500 text-white'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isFullscreen ? t('تصغير', 'Exit Fullscreen') : t('ملء الشاشة', 'Fullscreen')}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      }
      bottomBar={
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span>
            {t('اسحب للتدوير 360° · البوصلة لإظهار القطبية · المدار للأزواج غير الرابطة', 'Drag 360° · Compass for Dipoles · Orbit for Lone Pairs')}
          </span>
          <span className="font-mono tabular-nums opacity-75">
            {Math.round(zoomLevel * 100)}%
          </span>
        </div>
      }
    >
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
      />
    </StageViewportFrame>
  );
};

