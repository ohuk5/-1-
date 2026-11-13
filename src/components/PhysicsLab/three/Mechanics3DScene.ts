import * as THREE from 'three';

export type FluidType = 'water' | 'oil' | 'honey' | 'seawater';
export type ObjectMaterialType = 'iron' | 'aluminum' | 'wood' | 'brick';

export const MECHANICS_FLUID_DENSITIES: Record<FluidType, number> = {
  oil: 880,
  water: 1000,
  seawater: 1025,
  honey: 1420,
};

export const MECHANICS_OBJECT_DENSITIES: Record<ObjectMaterialType, number> = {
  wood: 600,
  brick: 1900,
  aluminum: 2700,
  iron: 7870,
};

export interface Mechanics3DParams {
  submersionPercent: number; // 0 to 100% (used in manual crane mode)
  equilibriumMode: 'free' | 'manual';
  fluidType: FluidType;
  objectMaterial: ObjectMaterialType;
  blockVolumeL: number; // 0.5 to 3.0 L
  showVectors: boolean;
}

export interface Mechanics3DSceneInstance {
  group: THREE.Group;
  update: (delta: number, params: Mechanics3DParams) => void;
  dispose: () => void;
}

export function createMechanics3DScene(isSoftwareGl: boolean): Mechanics3DSceneInstance {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Mechanics3DScene';

  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  // ==========================================
  // 1. LABORATORY RETORT STAND & SUSPENSION
  // ==========================================
  const standGroup = new THREE.Group();

  const baseGeo = new THREE.BoxGeometry(2.4, 0.22, 3.2);
  disposables.push(baseGeo);
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.35,
  });
  disposables.push(ironMat);
  const baseMesh = new THREE.Mesh(baseGeo, ironMat);
  baseMesh.position.set(-1.0, 0.11, 0);
  baseMesh.receiveShadow = !isSoftwareGl;
  standGroup.add(baseMesh);

  const uprightGeo = new THREE.CylinderGeometry(0.065, 0.065, 5.1, 24);
  disposables.push(uprightGeo);
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.96,
    roughness: 0.1,
  });
  disposables.push(chromeMat);
  const uprightMesh = new THREE.Mesh(uprightGeo, chromeMat);
  uprightMesh.position.set(-1.6, 2.65, 0);
  uprightMesh.castShadow = !isSoftwareGl;
  standGroup.add(uprightMesh);

  const clampGeo = new THREE.BoxGeometry(0.32, 0.34, 0.26);
  disposables.push(clampGeo);
  const clampMesh = new THREE.Mesh(clampGeo, ironMat);
  clampMesh.position.set(-1.6, 4.75, 0);
  standGroup.add(clampMesh);

  const crossarmGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.0, 16);
  disposables.push(crossarmGeo);
  const crossarmMesh = new THREE.Mesh(crossarmGeo, chromeMat);
  crossarmMesh.rotation.z = Math.PI / 2;
  crossarmMesh.position.set(-0.7, 4.75, 0);
  standGroup.add(crossarmMesh);

  rootGroup.add(standGroup);

  // ==========================================
  // 2. SPRING BALANCE DYNAMOMETER (Newton Meter)
  // ==========================================
  const dynamometerGroup = new THREE.Group();
  dynamometerGroup.position.set(0.2, 4.12, 0);

  const dynBarrelGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.2, 24);
  disposables.push(dynBarrelGeo);
  const acrylicMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.1,
    transmission: isSoftwareGl ? 0.3 : 0.88,
    transparent: true,
    opacity: isSoftwareGl ? 0.5 : 0.9,
    ior: 1.49,
    thickness: 0.4,
  });
  disposables.push(acrylicMat);
  const dynBarrel = new THREE.Mesh(dynBarrelGeo, acrylicMat);
  dynamometerGroup.add(dynBarrel);

  // Graduated tick rings on dynamometer barrel
  const tickRingGeo = new THREE.TorusGeometry(0.185, 0.008, 6, 20);
  disposables.push(tickRingGeo);
  const tickMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
  disposables.push(tickMat);
  for (let i = -4; i <= 4; i++) {
    const tRing = new THREE.Mesh(tickRingGeo, tickMat);
    tRing.rotation.x = Math.PI / 2;
    tRing.position.y = i * 0.11;
    dynamometerGroup.add(tRing);
  }

  const capGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 24);
  disposables.push(capGeo);
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.2,
  });
  disposables.push(brassMat);

  const topCap = new THREE.Mesh(capGeo, brassMat);
  topCap.position.y = 0.65;
  dynamometerGroup.add(topCap);

  const btmCap = new THREE.Mesh(capGeo, brassMat);
  btmCap.position.y = -0.65;
  dynamometerGroup.add(btmCap);

  const plungerGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.35, 16);
  disposables.push(plungerGeo);
  const plungerMesh = new THREE.Mesh(plungerGeo, chromeMat);
  plungerMesh.position.y = -0.22;
  dynamometerGroup.add(plungerMesh);

  const indicatorGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.06, 24);
  disposables.push(indicatorGeo);
  const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  disposables.push(redMat);
  const indicatorMesh = new THREE.Mesh(indicatorGeo, redMat);
  dynamometerGroup.add(indicatorMesh);

  rootGroup.add(dynamometerGroup);

  // ==========================================
  // 3. GRADUATED GLASS BEAKER (Archimedes Vessel)
  // ==========================================
  const beakerGroup = new THREE.Group();
  beakerGroup.position.set(0.2, 0, 0);

  const beakerRadius = 1.25;
  const beakerHeight = 2.45;

  const glassGeo = new THREE.CylinderGeometry(beakerRadius, beakerRadius, beakerHeight, 36, 1, true);
  disposables.push(glassGeo);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: isSoftwareGl ? 0.3 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.4 : 0.95,
    ior: 1.52,
    thickness: 0.6,
    side: THREE.DoubleSide,
  });
  disposables.push(glassMat);
  const beakerCylinder = new THREE.Mesh(glassGeo, glassMat);
  beakerCylinder.position.y = beakerHeight / 2 + 0.05;
  beakerGroup.add(beakerCylinder);

  const btmPlateGeo = new THREE.CylinderGeometry(beakerRadius, beakerRadius, 0.08, 36);
  disposables.push(btmPlateGeo);
  const btmPlate = new THREE.Mesh(btmPlateGeo, glassMat);
  btmPlate.position.y = 0.04;
  beakerGroup.add(btmPlate);

  // Volume graduation tick rings around beaker
  const beakerTickGeo = new THREE.TorusGeometry(beakerRadius + 0.008, 0.009, 6, 36, Math.PI * 0.45);
  disposables.push(beakerTickGeo);
  const beakerTickMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  disposables.push(beakerTickMat);
  for (let i = 1; i <= 5; i++) {
    const tick = new THREE.Mesh(beakerTickGeo, beakerTickMat);
    tick.rotation.x = Math.PI / 2;
    tick.rotation.z = -Math.PI * 0.225;
    tick.position.y = 0.25 + i * 0.38;
    beakerGroup.add(tick);
  }

  // ==========================================
  // 4. FLUID VOLUME INSIDE BEAKER
  // ==========================================
  const fluidGeo = new THREE.CylinderGeometry(beakerRadius * 0.97, beakerRadius * 0.97, 1.45, 32);
  disposables.push(fluidGeo);
  const fluidMat = new THREE.MeshPhysicalMaterial({
    color: 0x06b6d4,
    metalness: 0.05,
    roughness: 0.06,
    transmission: isSoftwareGl ? 0.4 : 0.85,
    transparent: true,
    opacity: isSoftwareGl ? 0.6 : 0.85,
    ior: 1.333,
    thickness: 1.2,
  });
  disposables.push(fluidMat);
  const fluidMesh = new THREE.Mesh(fluidGeo, fluidMat);
  fluidMesh.position.y = 0.78;
  beakerGroup.add(fluidMesh);

  rootGroup.add(beakerGroup);

  // ==========================================
  // 5. TEST BLOCK & SUSPENSION STRING
  // ==========================================
  const objectGroup = new THREE.Group();
  objectGroup.position.set(0.2, 1.8, 0);

  const blockCoreGroup = new THREE.Group();
  objectGroup.add(blockCoreGroup);

  const blockGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.88, 24);
  disposables.push(blockGeo);

  const blockMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.85,
    roughness: 0.25,
  });
  disposables.push(blockMat);

  const blockMesh = new THREE.Mesh(blockGeo, blockMat);
  blockMesh.castShadow = !isSoftwareGl;
  blockCoreGroup.add(blockMesh);

  const eyeBoltGeo = new THREE.TorusGeometry(0.11, 0.028, 12, 24);
  disposables.push(eyeBoltGeo);
  const eyeBoltMesh = new THREE.Mesh(eyeBoltGeo, brassMat);
  eyeBoltMesh.position.y = 0.5;
  blockCoreGroup.add(eyeBoltMesh);

  // Suspension cable in root coordinates so string smoothly spans block hook <-> dynamometer hook
  const lineGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.0, 8);
  disposables.push(lineGeo);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  disposables.push(lineMat);
  const stringMesh = new THREE.Mesh(lineGeo, lineMat);
  stringMesh.position.set(0.2, 2.8, 0);
  rootGroup.add(stringMesh);

  // ==========================================
  // 6. 3D FORCE VECTOR ARROWS (Weight Fg & Buoyancy Fb)
  // ==========================================
  const vectorsGroup = new THREE.Group();

  const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 16);
  shaftGeo.translate(0, 0.5, 0);
  disposables.push(shaftGeo);
  const coneGeo = new THREE.ConeGeometry(0.13, 0.3, 16);
  disposables.push(coneGeo);

  // Gravity arrow (downward, Red)
  const fgArrowGroup = new THREE.Group();
  const fgMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  disposables.push(fgMat);
  const fgShaft = new THREE.Mesh(shaftGeo, fgMat);
  fgShaft.rotation.x = Math.PI;
  fgArrowGroup.add(fgShaft);
  const fgCone = new THREE.Mesh(coneGeo, fgMat);
  fgCone.rotation.x = Math.PI;
  fgCone.position.y = -1.15;
  fgArrowGroup.add(fgCone);
  vectorsGroup.add(fgArrowGroup);

  // Buoyancy arrow (upward, Cyan)
  const fbArrowGroup = new THREE.Group();
  const fbMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  disposables.push(fbMat);
  const fbShaft = new THREE.Mesh(shaftGeo, fbMat);
  fbArrowGroup.add(fbShaft);
  const fbCone = new THREE.Mesh(coneGeo, fbMat);
  fbCone.position.y = 1.15;
  fbArrowGroup.add(fbCone);
  vectorsGroup.add(fbArrowGroup);

  objectGroup.add(vectorsGroup);
  rootGroup.add(objectGroup);

  // ==========================================
  // UPDATE LOOP (True Archimedes Equilibrium & Force Physics)
  // ==========================================
  let elapsed = 0;
  let currentY = 1.8;

  const update = (delta: number, params: Mechanics3DParams) => {
    elapsed += delta;

    const fluidRho = MECHANICS_FLUID_DENSITIES[params.fluidType];
    const objRho = MECHANICS_OBJECT_DENSITIES[params.objectMaterial];
    const volumeM3 = params.blockVolumeL * 0.001;
    const g = 9.81;

    // Scale block dimensions cube-root with selected volume
    const volScale = Math.cbrt(params.blockVolumeL / 1.5);
    blockCoreGroup.scale.set(volScale, volScale, volScale);
    const blockHalfH = 0.44 * volScale;

    // Determine effective submersion fraction [0..1]
    // Liquid top surface rests around y_surf_base = 1.505 before displacement
    let targetSubmersion = params.submersionPercent / 100;
    const isFloatingEquilibrium = params.equilibriumMode === 'free' && objRho < fluidRho;

    if (params.equilibriumMode === 'free') {
      if (objRho < fluidRho) {
        // Floating equilibrium: submerged fraction = rho_obj / rho_fluid
        targetSubmersion = Math.max(0.05, Math.min(0.99, objRho / fluidRho));
      } else {
        // Sinking: fully submerged near vessel floor
        targetSubmersion = 1.0;
      }
    }

    // Fluid level rises from displaced volume (V_sub = f * V_obj)
    const displacedVolumeL = targetSubmersion * params.blockVolumeL;
    const riseM = Math.min(0.32, displacedVolumeL * 0.095);
    const baseFluidHeight = 1.45;
    const currentFluidHeight = baseFluidHeight + riseM;
    fluidMesh.scale.y = currentFluidHeight / baseFluidHeight;
    fluidMesh.position.y = 0.08 + currentFluidHeight / 2;
    const surfaceY = 0.08 + currentFluidHeight;

    // Position object vertically according to submersion fraction relative to liquid surface:
    // At submersion=0 -> bottom sits slightly above liquid surface (surfaceY + blockHalfH + 0.45)
    // At submersion=0.5 -> center right on surfaceY
    // At submersion=1.0 -> sinks down toward beaker floor (0.12 + blockHalfH)
    let targetY: number;
    if (targetSubmersion <= 0.01) {
      targetY = surfaceY + blockHalfH + 0.55;
    } else if (params.equilibriumMode === 'free' && objRho >= fluidRho) {
      // Sunk onto bottom floor of glass beaker
      targetY = 0.12 + blockHalfH;
    } else if (targetSubmersion < 1.0) {
      // Partially submerged across the water line
      targetY = surfaceY + blockHalfH * (1 - 2 * targetSubmersion);
    } else {
      // Fully submerged just below surface / mid-tank in manual mode
      targetY = Math.max(0.15 + blockHalfH, surfaceY - blockHalfH - 0.18);
    }

    // Gentle buoyant oscillation when floating or submerged
    const bobAmp = targetSubmersion > 0.03 ? (isFloatingEquilibrium ? 0.035 : 0.012) : 0;
    const bob = Math.sin(elapsed * 2.6) * bobAmp;

    currentY += (targetY - currentY) * Math.min(1, delta * 7.5);
    objectGroup.position.y = currentY + bob;

    // Physical Forces (N)
    const fgNewtons = objRho * volumeM3 * g;
    const fbNewtons = fluidRho * (targetSubmersion * volumeM3) * g;
    const tensionNewtons = Math.max(0, fgNewtons - fbNewtons);

    // Dynamometer cable & plunger tension response
    const hookTopY = 3.47; // Bottom cap of dynamometer at 4.12 - 0.65
    const blockHookY = objectGroup.position.y + 0.5 * volScale;
    const spanLen = Math.max(0.1, hookTopY - blockHookY);

    if (isFloatingEquilibrium) {
      // Free-floating on fluid without cable pull (cable unlatched / slack retracted)
      stringMesh.visible = false;
      indicatorMesh.position.y = 0.42; // 0 N zero-load resting mark
      plungerMesh.position.y = -0.05;
    } else {
      stringMesh.visible = true;
      stringMesh.scale.y = spanLen;
      stringMesh.position.y = blockHookY + spanLen / 2;

      // Plunger & red Newton needle scale proportionally with tension (0..200 N full scale)
      const loadRatio = Math.min(1, tensionNewtons / 180);
      indicatorMesh.position.y = 0.42 - loadRatio * 0.84;
      plungerMesh.position.y = -0.05 - loadRatio * 0.25;
    }

    // Force Vector Arrows scaled proportionally to actual Newton magnitudes
    vectorsGroup.visible = params.showVectors;
    if (params.showVectors) {
      const fgScale = Math.max(0.35, Math.min(1.85, fgNewtons / 75));
      fgArrowGroup.scale.set(1, fgScale, 1);
      fgArrowGroup.position.y = -blockHalfH * 0.4;

      const fbScale = Math.max(0.1, Math.min(1.85, fbNewtons / 75));
      fbArrowGroup.scale.set(1, fbScale, 1);
      fbArrowGroup.position.y = blockHalfH * 0.4;
      fbArrowGroup.visible = fbNewtons > 0.4;
    }

    // Fluid visual properties matching real liquids
    if (params.fluidType === 'oil') {
      fluidMat.color.setHex(0xf59e0b);
      fluidMat.opacity = isSoftwareGl ? 0.58 : 0.78;
    } else if (params.fluidType === 'honey') {
      fluidMat.color.setHex(0xb45309);
      fluidMat.opacity = isSoftwareGl ? 0.78 : 0.9;
    } else if (params.fluidType === 'seawater') {
      fluidMat.color.setHex(0x0284c7);
      fluidMat.opacity = isSoftwareGl ? 0.62 : 0.84;
    } else {
      fluidMat.color.setHex(0x06b6d4);
      fluidMat.opacity = isSoftwareGl ? 0.56 : 0.8;
    }

    // Object material appearance
    if (params.objectMaterial === 'wood') {
      blockMat.color.setHex(0xb45309);
      blockMat.metalness = 0.05;
      blockMat.roughness = 0.82;
    } else if (params.objectMaterial === 'aluminum') {
      blockMat.color.setHex(0xe2e8f0);
      blockMat.metalness = 0.92;
      blockMat.roughness = 0.18;
    } else if (params.objectMaterial === 'brick') {
      blockMat.color.setHex(0xb91c1c);
      blockMat.metalness = 0.02;
      blockMat.roughness = 0.92;
    } else {
      blockMat.color.setHex(0x475569);
      blockMat.metalness = 0.86;
      blockMat.roughness = 0.3;
    }
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return { group: rootGroup, update, dispose };
}
