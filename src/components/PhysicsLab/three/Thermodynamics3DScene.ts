import * as THREE from 'three';

export type GasSpeciesType = 'He' | 'N2' | 'CO2';

export const GAS_MOLAR_MASS: Record<GasSpeciesType, number> = {
  He: 4,
  N2: 28,
  CO2: 44,
};

export interface Thermodynamics3DParams {
  temperatureK: number; // 120K to 800K
  volumeL: number; // 6L to 30L (controls piston height)
  gasMoles: number; // 0.5 to 4.0 moles
  gasType: GasSpeciesType;
  pistonLocked: boolean;
  heatSourceOn: boolean;
}

export interface Thermodynamics3DSceneInstance {
  group: THREE.Group;
  update: (delta: number, params: Thermodynamics3DParams) => void;
  dispose: () => void;
}

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export function createThermodynamics3DScene(isSoftwareGl: boolean): Thermodynamics3DSceneInstance {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Thermodynamics3DScene';

  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  // ==========================================
  // 1. BASE STAND & HEAVY MANIFOLD
  // ==========================================
  const baseGroup = new THREE.Group();

  const standBaseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.35, 32);
  disposables.push(standBaseGeo);
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.3,
  });
  disposables.push(darkMetalMat);
  const standBase = new THREE.Mesh(standBaseGeo, darkMetalMat);
  standBase.position.y = 0.175;
  standBase.receiveShadow = !isSoftwareGl;
  baseGroup.add(standBase);

  const legGeo = new THREE.BoxGeometry(0.25, 0.45, 0.8);
  disposables.push(legGeo);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const legMesh = new THREE.Mesh(legGeo, darkMetalMat);
    legMesh.position.set(Math.cos(angle) * 1.6, 0.22, Math.sin(angle) * 1.6);
    legMesh.rotation.y = angle;
    baseGroup.add(legMesh);
  }

  rootGroup.add(baseGroup);

  // ==========================================
  // 2. TRANSPARENT GLASS CYLINDER CHAMBER
  // ==========================================
  const chamberGroup = new THREE.Group();
  chamberGroup.position.set(0, 0.35, 0);

  const cylRadius = 1.35;
  const cylHeight = 3.6;

  const glassCylGeo = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 36, 1, true);
  disposables.push(glassCylGeo);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.04,
    transmission: isSoftwareGl ? 0.3 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.4 : 0.92,
    ior: 1.5,
    thickness: 0.5,
    side: THREE.DoubleSide,
  });
  disposables.push(glassMat);
  const glassCylinder = new THREE.Mesh(glassCylGeo, glassMat);
  glassCylinder.position.y = cylHeight / 2;
  chamberGroup.add(glassCylinder);

  const ringGeo = new THREE.TorusGeometry(cylRadius, 0.08, 16, 36);
  disposables.push(ringGeo);
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.2,
  });
  disposables.push(brassMat);
  const btmRing = new THREE.Mesh(ringGeo, brassMat);
  btmRing.rotation.x = Math.PI / 2;
  btmRing.position.y = 0.05;
  chamberGroup.add(btmRing);

  const topRing = new THREE.Mesh(ringGeo, brassMat);
  topRing.rotation.x = Math.PI / 2;
  topRing.position.y = cylHeight;
  chamberGroup.add(topRing);

  rootGroup.add(chamberGroup);

  // ==========================================
  // 3. MOVABLE METALLIC PISTON & LOCK CLAMP
  // ==========================================
  const pistonGroup = new THREE.Group();
  pistonGroup.position.set(0, 2.4, 0);

  const pistonHeadGeo = new THREE.CylinderGeometry(cylRadius * 0.97, cylRadius * 0.97, 0.24, 32);
  disposables.push(pistonHeadGeo);
  const alumMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.92,
    roughness: 0.15,
  });
  disposables.push(alumMat);
  const pistonHead = new THREE.Mesh(pistonHeadGeo, alumMat);
  pistonHead.castShadow = !isSoftwareGl;
  pistonGroup.add(pistonHead);

  const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.9, 16);
  disposables.push(shaftGeo);
  const shaftMesh = new THREE.Mesh(shaftGeo, alumMat);
  shaftMesh.position.y = 0.95;
  pistonGroup.add(shaftMesh);

  const gripGeo = new THREE.TorusGeometry(0.32, 0.055, 12, 24);
  disposables.push(gripGeo);
  const gripMesh = new THREE.Mesh(gripGeo, brassMat);
  gripMesh.rotation.x = Math.PI / 2;
  gripMesh.position.y = 1.9;
  pistonGroup.add(gripMesh);

  // Visual locking pin clamp around piston shaft when volume is locked (Isochoric)
  const lockClampGroup = new THREE.Group();
  const lockPinGeo = new THREE.BoxGeometry(0.7, 0.12, 0.22);
  disposables.push(lockPinGeo);
  const lockPinMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    metalness: 0.5,
    roughness: 0.3,
  });
  disposables.push(lockPinMat);
  const lockPin = new THREE.Mesh(lockPinGeo, lockPinMat);
  lockPin.position.y = 0.24;
  lockClampGroup.add(lockPin);
  pistonGroup.add(lockClampGroup);

  rootGroup.add(pistonGroup);

  // ==========================================
  // 4. BOURDON PRESSURE GAUGE DIAL
  // ==========================================
  const gaugeGroup = new THREE.Group();
  gaugeGroup.position.set(cylRadius + 0.38, 1.75, 0);

  const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 16);
  pipeGeo.rotateZ(Math.PI / 2);
  disposables.push(pipeGeo);
  const pipeMesh = new THREE.Mesh(pipeGeo, brassMat);
  pipeMesh.position.x = -0.22;
  gaugeGroup.add(pipeMesh);

  const gaugeBodyGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.15, 32);
  gaugeBodyGeo.rotateZ(Math.PI / 2);
  disposables.push(gaugeBodyGeo);
  const gaugeBody = new THREE.Mesh(gaugeBodyGeo, darkMetalMat);
  gaugeGroup.add(gaugeBody);

  const dialCanvas = document.createElement('canvas');
  dialCanvas.width = 256;
  dialCanvas.height = 256;
  const dCtx = dialCanvas.getContext('2d');
  if (dCtx) {
    dCtx.fillStyle = '#ffffff';
    dCtx.beginPath();
    dCtx.arc(128, 128, 120, 0, Math.PI * 2);
    dCtx.fill();
    dCtx.strokeStyle = '#0f172a';
    dCtx.lineWidth = 4;
    dCtx.stroke();

    dCtx.strokeStyle = '#ef4444';
    dCtx.lineWidth = 3;
    dCtx.fillStyle = '#0f172a';
    dCtx.font = 'bold 20px sans-serif';
    dCtx.textAlign = 'center';
    dCtx.fillText('PRESSURE', 128, 90);
    dCtx.font = 'bold 16px monospace';
    dCtx.fillText('atm (0-12)', 128, 115);

    for (let deg = 40; deg <= 320; deg += 20) {
      const rad = (deg * Math.PI) / 180;
      dCtx.beginPath();
      dCtx.moveTo(128 + Math.cos(rad) * 110, 128 + Math.sin(rad) * 110);
      dCtx.lineTo(128 + Math.cos(rad) * 92, 128 + Math.sin(rad) * 92);
      dCtx.stroke();
    }
  }
  const dialTex = new THREE.CanvasTexture(dialCanvas);
  dialTex.colorSpace = THREE.SRGBColorSpace;
  disposables.push(dialTex);

  const dialPlateGeo = new THREE.CircleGeometry(0.44, 32);
  dialPlateGeo.rotateY(Math.PI / 2);
  disposables.push(dialPlateGeo);
  const dialPlateMat = new THREE.MeshBasicMaterial({ map: dialTex });
  disposables.push(dialPlateMat);
  const dialPlate = new THREE.Mesh(dialPlateGeo, dialPlateMat);
  dialPlate.position.x = 0.08;
  gaugeGroup.add(dialPlate);

  const needleGroup = new THREE.Group();
  needleGroup.position.set(0.085, 0, 0);

  const needleGeo = new THREE.BoxGeometry(0.01, 0.32, 0.02);
  needleGeo.translate(0, 0.14, 0);
  disposables.push(needleGeo);
  const redNeedleMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
  disposables.push(redNeedleMat);
  const needleMesh = new THREE.Mesh(needleGeo, redNeedleMat);
  needleGroup.add(needleMesh);
  gaugeGroup.add(needleGroup);

  rootGroup.add(gaugeGroup);

  // ==========================================
  // 5. BUNSEN BURNER FLAME ASSEMBLY
  // ==========================================
  const flameGroup = new THREE.Group();
  flameGroup.position.set(0, 0.35, 0);

  const burnerGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.28, 20);
  disposables.push(burnerGeo);
  const burnerMesh = new THREE.Mesh(burnerGeo, darkMetalMat);
  burnerMesh.position.y = -0.14;
  flameGroup.add(burnerMesh);

  const flameOuterGeo = new THREE.ConeGeometry(0.35, 0.85, 16);
  flameOuterGeo.translate(0, 0.42, 0);
  disposables.push(flameOuterGeo);
  const flameOuterMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });
  disposables.push(flameOuterMat);
  const flameOuter = new THREE.Mesh(flameOuterGeo, flameOuterMat);
  flameGroup.add(flameOuter);

  const flameInnerGeo = new THREE.ConeGeometry(0.18, 0.55, 16);
  flameInnerGeo.translate(0, 0.27, 0);
  disposables.push(flameInnerGeo);
  const flameInnerMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
  });
  disposables.push(flameInnerMat);
  const flameInner = new THREE.Mesh(flameInnerGeo, flameInnerMat);
  flameGroup.add(flameInner);

  const flameLight = new THREE.PointLight(0xf59e0b, 1.5, 3.5);
  flameLight.position.set(0, 0.4, 0);
  flameGroup.add(flameLight);

  rootGroup.add(flameGroup);

  // ==========================================
  // 6. INSTANCED 3D KINETIC GAS PARTICLES (Moles & Molar Mass)
  // ==========================================
  const MAX_PARTICLES = 120;
  const particleGeo = new THREE.SphereGeometry(0.068, 12, 12);
  disposables.push(particleGeo);

  const particleMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.2,
    metalness: 0.45,
    emissive: 0x0284c7,
    emissiveIntensity: 0.55,
  });
  disposables.push(particleMat);

  const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, MAX_PARTICLES);
  particleInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rootGroup.add(particleInstanced);

  const particles: Particle3D[] = [];
  const dummyObj = new THREE.Object3D();
  const dummyColor = new THREE.Color();

  for (let i = 0; i < MAX_PARTICLES; i++) {
    const r = Math.random() * (cylRadius - 0.2);
    const theta = Math.random() * Math.PI * 2;
    const speedMag = 1.1 + Math.random() * 1.1;
    const dirTheta = Math.random() * Math.PI * 2;
    const dirPhi = (Math.random() - 0.5) * Math.PI;
    particles.push({
      x: Math.cos(theta) * r,
      y: 0.55 + Math.random() * 1.6,
      z: Math.sin(theta) * r,
      vx: Math.cos(dirTheta) * Math.cos(dirPhi) * speedMag,
      vy: Math.sin(dirPhi) * speedMag,
      vz: Math.sin(dirTheta) * Math.cos(dirPhi) * speedMag,
    });
  }

  // ==========================================
  // UPDATE LOOP (Maxwell-Boltzmann Speeds & Ideal Gas Law)
  // ==========================================
  let elapsed = 0;

  const update = (delta: number, params: Thermodynamics3DParams) => {
    elapsed += delta;

    // 1. Piston height based on Volume L (6L..30L -> y: 1.1..3.6)
    const targetPistonY = 0.72 + (params.volumeL / 30) * 2.9;
    pistonGroup.position.y += (targetPistonY - pistonGroup.position.y) * Math.min(1, delta * 9);
    const currentCeiling = pistonGroup.position.y - 0.14;
    const currentFloor = 0.45;
    lockClampGroup.visible = params.pistonLocked;

    // 2. Flame animation
    flameGroup.visible = params.heatSourceOn;
    if (params.heatSourceOn) {
      const flicker = 1.0 + 0.18 * Math.sin(elapsed * 18) * Math.cos(elapsed * 11);
      flameOuter.scale.set(flicker, flicker * 1.1, flicker);
      flameInner.scale.set(flicker, flicker * 1.05, flicker);
      flameLight.intensity = 1.5 * flicker;
    }

    // 3. Kinetic RMS speed scaling: v_rms ~ sqrt(T / MolarMass) normalized to N2 @ 300K
    const molarMass = GAS_MOLAR_MASS[params.gasType];
    const speedFactor = Math.sqrt((params.temperatureK / 300) * (28 / molarMass));

    // Molecular scale by species (He smallest, N2 medium, CO2 largest)
    const particleScale = params.gasType === 'He' ? 0.72 : params.gasType === 'CO2' ? 1.24 : 1.0;

    // Thermal + species color cue
    const tempRatio = Math.max(0, Math.min(1, (params.temperatureK - 120) / 680));
    const speciesHueOffset = params.gasType === 'He' ? 0.08 : params.gasType === 'CO2' ? -0.05 : 0;
    const hue = Math.max(0.0, Math.min(0.68, 0.58 - tempRatio * 0.56 + speciesHueOffset));
    dummyColor.setHSL(hue, 0.95, 0.54);
    particleMat.color.copy(dummyColor);
    particleMat.emissive.copy(dummyColor);

    // 4. Active molecule count strictly proportional to moles (n)
    const activeCount = Math.min(MAX_PARTICLES, Math.max(12, Math.round(params.gasMoles * 30)));
    particleInstanced.count = activeCount;

    const maxR = cylRadius - 0.12 * particleScale;

    for (let i = 0; i < activeCount; i++) {
      const p = particles[i];

      p.x += p.vx * speedFactor * delta * 2.1;
      p.y += p.vy * speedFactor * delta * 2.1;
      p.z += p.vz * speedFactor * delta * 2.1;

      const distR = Math.hypot(p.x, p.z);
      if (distR > maxR) {
        const nx = p.x / distR;
        const nz = p.z / distR;
        const dot = p.vx * nx + p.vz * nz;
        p.vx -= 2 * dot * nx;
        p.vz -= 2 * dot * nz;
        p.x = nx * maxR;
        p.z = nz * maxR;
      }

      if (p.y < currentFloor) {
        p.y = currentFloor;
        p.vy = Math.abs(p.vy);
      }

      if (p.y > currentCeiling) {
        p.y = currentCeiling;
        p.vy = -Math.abs(p.vy);
      }

      dummyObj.position.set(p.x, p.y, p.z);
      dummyObj.scale.setScalar(particleScale);
      dummyObj.updateMatrix();
      particleInstanced.setMatrixAt(i, dummyObj.matrix);
    }
    particleInstanced.instanceMatrix.needsUpdate = true;

    // 5. Ideal Gas Law Pressure P = (n R T) / V on calibrated Bourdon Gauge (0..12 atm)
    const idealPressure = (params.gasMoles * 0.0821 * params.temperatureK) / Math.max(1, params.volumeL);
    const needleAngle = -1.4 + Math.min(2.8, (idealPressure / 12.0) * 2.8);
    needleGroup.rotation.x = needleAngle;
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return { group: rootGroup, update, dispose };
}
