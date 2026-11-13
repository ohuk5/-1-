import * as THREE from 'three';

export interface Optics3DParams {
  lightMode: 'white' | 'laser';
  laserWavelength: number; // 400..700 nm
  prismAngle: number; // -45..45 deg
  prismMaterial: 'crown' | 'flint' | 'diamond';
  elementMode: 'prism' | 'lens' | 'snell';
  lensType: 'convex' | 'concave';
  lensFocalLength: number; // 0.9 to 3.2 m
  screenDistance: number; // 1.4 to 4.2 m
  beamSpread: number; // 0.22 to 0.72 ray bundle radius
  snellN1?: number;
  snellN2?: number;
  snellTheta1Deg?: number;
}

export interface Optics3DSceneInstance {
  group: THREE.Group;
  update: (delta: number, params: Optics3DParams) => void;
  dispose: () => void;
}

function wavelengthToColor(nm: number): THREE.Color {
  const clamped = Math.max(400, Math.min(700, nm));
  const hue = Math.max(0, Math.min(1, (700 - clamped) / 300)) * 0.76;
  return new THREE.Color().setHSL(hue, 1.0, 0.52);
}

function orientBeamBetween(mesh: THREE.Mesh, p1: THREE.Vector3, p2: THREE.Vector3) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 0.001) {
    mesh.visible = false;
    return;
  }
  mesh.position.copy(p1).addScaledVector(dir, 0.5);
  mesh.scale.set(1, len, 1);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
}

// 2D ray-segment intersection in XZ plane for prism faces
function intersectRaySegment2D(
  ox: number,
  oz: number,
  dx: number,
  dz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number
): { t: number; u: number; x: number; z: number; nx: number; nz: number } | null {
  const sx = bx - ax;
  const sz = bz - az;
  const denom = dx * sz - dz * sx;
  if (Math.abs(denom) < 1e-6) return null;
  const qpx = ax - ox;
  const qpz = az - oz;
  const t = (qpx * sz - qpz * sx) / denom;
  const u = (qpx * dz - qpz * dx) / denom;
  if (t > 1e-4 && u >= -1e-4 && u <= 1 + 1e-4) {
    const segLen = Math.hypot(sx, sz) || 1;
    // Outward normal (rotated 90 deg CCW on edge vector)
    let nx = -sz / segLen;
    let nz = sx / segLen;
    if (nx * dx + nz * dz > 0) {
      nx = -nx;
      nz = -nz;
    }
    return { t, u, x: ox + t * dx, z: oz + t * dz, nx, nz };
  }
  return null;
}

// Snell's Law 2D vector refraction; returns null if Total Internal Reflection occurs
function refract2D(dx: number, dz: number, nx: number, nz: number, eta: number): { dx: number; dz: number } | null {
  const cosI = -(nx * dx + nz * dz);
  const sinT2 = eta * eta * (1.0 - cosI * cosI);
  if (sinT2 > 1.0) return null;
  const cosT = Math.sqrt(Math.max(0, 1.0 - sinT2));
  const rx = eta * dx + (eta * cosI - cosT) * nx;
  const rz = eta * dz + (eta * cosI - cosT) * nz;
  const len = Math.hypot(rx, rz) || 1;
  return { dx: rx / len, dz: rz / len };
}

function reflect2D(dx: number, dz: number, nx: number, nz: number): { dx: number; dz: number } {
  const dot = dx * nx + dz * nz;
  const rx = dx - 2 * dot * nx;
  const rz = dz - 2 * dot * nz;
  const len = Math.hypot(rx, rz) || 1;
  return { dx: rx / len, dz: rz / len };
}

export function createOptics3DScene(isSoftwareGl: boolean): Optics3DSceneInstance {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Optics3DScene';

  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
  const OPTICAL_AXIS_Y = 1.45;

  // ==========================================
  // 1. OPTICAL BENCH RAIL & RULER
  // ==========================================
  const benchGroup = new THREE.Group();

  const railGeo = new THREE.BoxGeometry(10.6, 0.35, 2.2);
  disposables.push(railGeo);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.85,
  });
  disposables.push(railMat);
  const railMesh = new THREE.Mesh(railGeo, railMat);
  railMesh.position.y = 0.175;
  railMesh.receiveShadow = !isSoftwareGl;
  benchGroup.add(railMesh);

  const scaleCanvas = document.createElement('canvas');
  scaleCanvas.width = 1024;
  scaleCanvas.height = 64;
  const sCtx = scaleCanvas.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 1024, 64);
    sCtx.strokeStyle = '#94a3b8';
    sCtx.fillStyle = '#cbd5e1';
    sCtx.font = 'bold 16px monospace';
    sCtx.textAlign = 'center';
    for (let x = 0; x < 1024; x += 16) {
      const isMajor = x % 64 === 0;
      sCtx.lineWidth = isMajor ? 2 : 1;
      sCtx.beginPath();
      sCtx.moveTo(x, 0);
      sCtx.lineTo(x, isMajor ? 32 : 16);
      sCtx.stroke();
      if (isMajor) {
        sCtx.fillText(`${((x - 512) / 128).toFixed(0)}m`, x, 52);
      }
    }
  }
  const scaleTex = new THREE.CanvasTexture(scaleCanvas);
  scaleTex.colorSpace = THREE.SRGBColorSpace;
  disposables.push(scaleTex);

  const scaleStripGeo = new THREE.PlaneGeometry(10.0, 0.28);
  disposables.push(scaleStripGeo);
  const scaleStripMat = new THREE.MeshBasicMaterial({ map: scaleTex, transparent: true });
  disposables.push(scaleStripMat);
  const scaleStrip = new THREE.Mesh(scaleStripGeo, scaleStripMat);
  scaleStrip.rotation.x = -Math.PI / 2;
  scaleStrip.position.set(0, 0.355, 0.9);
  benchGroup.add(scaleStrip);

  const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 10.6, 16);
  disposables.push(rodGeo);
  const rodMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.95,
    roughness: 0.12,
  });
  disposables.push(rodMat);

  const rodLeft = new THREE.Mesh(rodGeo, rodMat);
  rodLeft.rotation.z = Math.PI / 2;
  rodLeft.position.set(0, 0.38, -0.5);
  benchGroup.add(rodLeft);

  const rodRight = new THREE.Mesh(rodGeo, rodMat);
  rodRight.rotation.z = Math.PI / 2;
  rodRight.position.set(0, 0.38, 0.5);
  benchGroup.add(rodRight);

  // Faint optical centerline axis line along bench at y = 1.45
  const axisLineGeo = new THREE.CylinderGeometry(0.008, 0.008, 8.6, 8);
  axisLineGeo.rotateZ(Math.PI / 2);
  disposables.push(axisLineGeo);
  const axisLineMat = new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.45 });
  disposables.push(axisLineMat);
  const opticalAxisLine = new THREE.Mesh(axisLineGeo, axisLineMat);
  opticalAxisLine.position.set(0.4, OPTICAL_AXIS_Y, 0);
  benchGroup.add(opticalAxisLine);

  rootGroup.add(benchGroup);

  // ==========================================
  // 2. CENTRAL STAGE MOUNT
  // ==========================================
  const stageGroup = new THREE.Group();
  stageGroup.position.set(0, 0.38, 0);

  const mountBaseGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.18, 32);
  disposables.push(mountBaseGeo);
  const mountBaseMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.8,
    roughness: 0.25,
  });
  disposables.push(mountBaseMat);
  const mountBase = new THREE.Mesh(mountBaseGeo, mountBaseMat);
  mountBase.position.y = 0.09;
  stageGroup.add(mountBase);

  const degRingGeo = new THREE.RingGeometry(0.75, 0.88, 36);
  disposables.push(degRingGeo);
  const degRingMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.7,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  disposables.push(degRingMat);
  const degRing = new THREE.Mesh(degRingGeo, degRingMat);
  degRing.rotation.x = -Math.PI / 2;
  degRing.position.y = 0.185;
  stageGroup.add(degRing);

  // ==========================================
  // 3. EQUILATERAL GLASS PRISM
  // ==========================================
  const prismGroup = new THREE.Group();
  prismGroup.position.y = 0.18;

  const prismSide = 1.75;
  const prismHeight = 1.95;
  const triR = prismSide / Math.sqrt(3);
  const baseVertices2D: [number, number][] = [
    [Math.cos(Math.PI / 2) * triR, Math.sin(Math.PI / 2) * triR],
    [Math.cos(Math.PI / 2 + (2 * Math.PI) / 3) * triR, Math.sin(Math.PI / 2 + (2 * Math.PI) / 3) * triR],
    [Math.cos(Math.PI / 2 + (4 * Math.PI) / 3) * triR, Math.sin(Math.PI / 2 + (4 * Math.PI) / 3) * triR],
  ];

  const triShape = new THREE.Shape();
  triShape.moveTo(baseVertices2D[0][0], baseVertices2D[0][1]);
  triShape.lineTo(baseVertices2D[1][0], baseVertices2D[1][1]);
  triShape.lineTo(baseVertices2D[2][0], baseVertices2D[2][1]);
  triShape.closePath();

  const prismGeo = new THREE.ExtrudeGeometry(triShape, {
    depth: prismHeight,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  });
  disposables.push(prismGeo);
  prismGeo.center();

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    metalness: 0.0,
    roughness: 0.04,
    transmission: isSoftwareGl ? 0.35 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.5 : 0.85,
    ior: 1.56,
    thickness: 1.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    attenuationColor: new THREE.Color(0xdbeafe),
    attenuationDistance: 2.5,
  });
  disposables.push(glassMat);

  const prismMesh = new THREE.Mesh(prismGeo, glassMat);
  prismMesh.rotation.x = Math.PI / 2;
  prismMesh.position.y = prismHeight / 2 + 0.04;
  prismMesh.castShadow = !isSoftwareGl;
  prismGroup.add(prismMesh);
  stageGroup.add(prismGroup);

  // ==========================================
  // 4. SPHERICAL LENS ASSEMBLY (CONVEX & CONCAVE)
  // ==========================================
  const lensGroup = new THREE.Group();
  lensGroup.position.y = 0.18;
  lensGroup.visible = false;

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.2,
  });
  disposables.push(brassMat);

  // Center at local y = OPTICAL_AXIS_Y - 0.38 - 0.18 = 0.89 so world y = 1.45
  const LENS_LOCAL_Y = OPTICAL_AXIS_Y - 0.56;

  const holderGeo = new THREE.TorusGeometry(0.95, 0.07, 16, 48);
  holderGeo.rotateY(Math.PI / 2); // Align lens plane orthogonal to X optical axis!
  disposables.push(holderGeo);
  const lensHolder = new THREE.Mesh(holderGeo, brassMat);
  lensHolder.position.y = LENS_LOCAL_Y;
  lensGroup.add(lensHolder);

  const pillarGeo = new THREE.CylinderGeometry(0.06, 0.06, LENS_LOCAL_Y, 16);
  disposables.push(pillarGeo);
  const pillarMesh = new THREE.Mesh(pillarGeo, brassMat);
  pillarMesh.position.y = LENS_LOCAL_Y / 2;
  lensGroup.add(pillarMesh);

  // Biconvex Lens Mesh
  const convexLensGeo = new THREE.SphereGeometry(0.92, 32, 24);
  convexLensGeo.scale(0.24, 1.0, 1.0); // Thin along X axis
  disposables.push(convexLensGeo);
  const convexLensMesh = new THREE.Mesh(convexLensGeo, glassMat);
  convexLensMesh.position.y = LENS_LOCAL_Y;
  lensGroup.add(convexLensMesh);

  // Biconcave Diverging Lens Mesh (Lathe profile rotated around X axis)
  const concavePts: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const r = (i / 14) * 0.91;
    const halfThick = 0.04 + 0.16 * (r * r);
    concavePts.push(new THREE.Vector2(r, halfThick));
  }
  for (let i = 14; i >= 0; i--) {
    const r = (i / 14) * 0.91;
    const halfThick = 0.04 + 0.16 * (r * r);
    concavePts.push(new THREE.Vector2(r, -halfThick));
  }
  const concaveLensGeo = new THREE.LatheGeometry(concavePts, 36);
  concaveLensGeo.rotateZ(Math.PI / 2); // Revolution axis along X!
  disposables.push(concaveLensGeo);
  const concaveLensMesh = new THREE.Mesh(concaveLensGeo, glassMat);
  concaveLensMesh.position.y = LENS_LOCAL_Y;
  concaveLensMesh.visible = false;
  lensGroup.add(concaveLensMesh);

  stageGroup.add(lensGroup);
  rootGroup.add(stageGroup);

  // Focal Point Markers (F and 2F along rail)
  const focalMarkersGroup = new THREE.Group();
  const markerGeo = new THREE.SphereGeometry(0.085, 16, 16);
  disposables.push(markerGeo);
  const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, OPTICAL_AXIS_Y - 0.35, 8);
  disposables.push(stemGeo);
  const fMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const f2Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
  disposables.push(fMat, f2Mat);

  const focalPinF = new THREE.Group();
  const pinHeadF = new THREE.Mesh(markerGeo, fMat);
  pinHeadF.position.y = OPTICAL_AXIS_Y;
  const pinStemF = new THREE.Mesh(stemGeo, fMat);
  pinStemF.position.y = (OPTICAL_AXIS_Y + 0.35) / 2;
  focalPinF.add(pinHeadF, pinStemF);
  focalMarkersGroup.add(focalPinF);

  const focalPin2F = new THREE.Group();
  const pinHead2F = new THREE.Mesh(markerGeo, f2Mat);
  pinHead2F.position.y = OPTICAL_AXIS_Y;
  pinHead2F.scale.setScalar(0.85);
  const pinStem2F = new THREE.Mesh(stemGeo, f2Mat);
  pinStem2F.position.y = (OPTICAL_AXIS_Y + 0.35) / 2;
  focalPin2F.add(pinHead2F, pinStem2F);
  focalMarkersGroup.add(focalPin2F);

  rootGroup.add(focalMarkersGroup);

  // ==========================================
  // 5. LIGHT SOURCE TORCH / COLLIMATOR
  // ==========================================
  const torchGroup = new THREE.Group();
  torchGroup.position.set(-3.8, OPTICAL_AXIS_Y, 0);

  const torchBodyGeo = new THREE.CylinderGeometry(0.26, 0.3, 1.3, 24);
  disposables.push(torchBodyGeo);
  const torchMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.75,
    roughness: 0.3,
  });
  disposables.push(torchMat);
  const torchBody = new THREE.Mesh(torchBodyGeo, torchMat);
  torchBody.rotation.z = Math.PI / 2;
  torchGroup.add(torchBody);

  const bezelGeo = new THREE.CylinderGeometry(0.36, 0.28, 0.24, 24);
  disposables.push(bezelGeo);
  const bezelMesh = new THREE.Mesh(bezelGeo, brassMat);
  bezelMesh.rotation.z = Math.PI / 2;
  bezelMesh.position.x = 0.72;
  torchGroup.add(bezelMesh);

  const bulbGeo = new THREE.CircleGeometry(0.3, 24);
  disposables.push(bulbGeo);
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  disposables.push(bulbMat);
  const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
  bulbMesh.rotation.y = Math.PI / 2;
  bulbMesh.position.x = 0.85;
  torchGroup.add(bulbMesh);

  const torchStandGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.15, 16);
  disposables.push(torchStandGeo);
  const torchStand = new THREE.Mesh(torchStandGeo, railMat);
  torchStand.position.set(0, -0.58, 0);
  torchGroup.add(torchStand);

  rootGroup.add(torchGroup);

  // ==========================================
  // 6. OPTICAL RAYS SYSTEM (Prism Dispersion + Multi-Ray Lens Bundle)
  // ==========================================
  const unitRayGeo = new THREE.CylinderGeometry(0.028, 0.028, 1.0, 12);
  disposables.push(unitRayGeo);

  // A. Lens 5-Ray Bundle (Incident + Refracted + Virtual Backward Extensions)
  const LENS_OFFSETS = [-1.0, -0.5, 0.0, 0.5, 1.0];
  const lensRaysGroup = new THREE.Group();
  const lensIncRays: THREE.Mesh[] = [];
  const lensRefrRays: THREE.Mesh[] = [];
  const lensVirtualRays: THREE.Mesh[] = [];

  const lensRayMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const lensVirtualMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.42,
  });
  disposables.push(lensRayMat, lensVirtualMat);

  LENS_OFFSETS.forEach(() => {
    const incM = new THREE.Mesh(unitRayGeo, lensRayMat);
    const refrM = new THREE.Mesh(unitRayGeo, lensRayMat);
    const virtM = new THREE.Mesh(unitRayGeo, lensVirtualMat);
    virtM.scale.x = 0.65;
    virtM.scale.z = 0.65;
    lensIncRays.push(incM);
    lensRefrRays.push(refrM);
    lensVirtualRays.push(virtM);
    lensRaysGroup.add(incM, refrM, virtM);
  });
  rootGroup.add(lensRaysGroup);

  // B. Prism Rays (Incident beam, Internal beams, Exiting Spectrum / TIR rays)
  const prismRaysGroup = new THREE.Group();
  const prismIncMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
  });
  disposables.push(prismIncMat);
  const prismIncRay = new THREE.Mesh(unitRayGeo, prismIncMat);
  prismIncRay.scale.set(1.5, 1, 1.5);
  prismRaysGroup.add(prismIncRay);

  const SPECTRAL_BANDS = [
    { hex: 0xef4444, nOffset: -0.025, nm: 660 },
    { hex: 0xf97316, nOffset: -0.016, nm: 605 },
    { hex: 0xeab308, nOffset: -0.008, nm: 575 },
    { hex: 0x22c55e, nOffset: 0.0, nm: 532 },
    { hex: 0x06b6d4, nOffset: 0.010, nm: 485 },
    { hex: 0x3b82f6, nOffset: 0.020, nm: 450 },
    { hex: 0x8b5cf6, nOffset: 0.032, nm: 410 },
  ];

  const prismInternalRays: THREE.Mesh[] = [];
  const prismExitRays: THREE.Mesh[] = [];
  SPECTRAL_BANDS.forEach((b) => {
    const mat = new THREE.MeshBasicMaterial({
      color: b.hex,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });
    disposables.push(mat);
    const intM = new THREE.Mesh(unitRayGeo, mat);
    const extM = new THREE.Mesh(unitRayGeo, mat);
    prismInternalRays.push(intM);
    prismExitRays.push(extM);
    prismRaysGroup.add(intM, extM);
  });
  rootGroup.add(prismRaysGroup);

  // ==========================================
  // 7. MOVABLE PROJECTION SCREEN + ILLUMINATED LIGHT SPOT
  // ==========================================
  const screenGroup = new THREE.Group();
  screenGroup.position.set(2.5, 0.38, 0);

  const sheetGeo = new THREE.BoxGeometry(0.12, 2.5, 2.8);
  disposables.push(sheetGeo);
  const sheetMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.88,
    metalness: 0.05,
  });
  disposables.push(sheetMat);
  const sheetMesh = new THREE.Mesh(sheetGeo, sheetMat);
  sheetMesh.position.y = 1.25;
  screenGroup.add(sheetMesh);

  const screenBaseGeo = new THREE.BoxGeometry(0.55, 0.12, 2.4);
  disposables.push(screenBaseGeo);
  const screenBase = new THREE.Mesh(screenBaseGeo, mountBaseMat);
  screenBase.position.y = 0.06;
  screenGroup.add(screenBase);

  // Soft glowing projected spot on screen front face (-X face)
  const spotCanvas = document.createElement('canvas');
  spotCanvas.width = 128;
  spotCanvas.height = 128;
  const spCtx = spotCanvas.getContext('2d');
  if (spCtx) {
    const g = spCtx.createRadialGradient(64, 64, 2, 64, 64, 62);
    g.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    g.addColorStop(0.35, 'rgba(255, 255, 255, 0.72)');
    g.addColorStop(0.75, 'rgba(255, 255, 255, 0.22)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    spCtx.fillStyle = g;
    spCtx.fillRect(0, 0, 128, 128);
  }
  const spotTex = new THREE.CanvasTexture(spotCanvas);
  disposables.push(spotTex);

  const spotGeo = new THREE.PlaneGeometry(1.0, 1.0);
  disposables.push(spotGeo);
  const spotMat = new THREE.MeshBasicMaterial({
    map: spotTex,
    color: 0x22c55e,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  disposables.push(spotMat);
  const screenSpotMesh = new THREE.Mesh(spotGeo, spotMat);
  screenSpotMesh.rotation.y = -Math.PI / 2;
  screenSpotMesh.position.set(-0.07, OPTICAL_AXIS_Y - 0.38, 0);
  screenGroup.add(screenSpotMesh);

  // Spectrum stripe spots on screen for prism white dispersion
  const prismScreenDots: THREE.Mesh[] = [];
  const dotGeo = new THREE.PlaneGeometry(0.28, 0.9);
  disposables.push(dotGeo);
  SPECTRAL_BANDS.forEach((b) => {
    const dMat = new THREE.MeshBasicMaterial({
      map: spotTex,
      color: b.hex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    disposables.push(dMat);
    const dMesh = new THREE.Mesh(dotGeo, dMat);
    dMesh.rotation.y = -Math.PI / 2;
    dMesh.position.set(-0.075, OPTICAL_AXIS_Y - 0.38, 0);
    screenGroup.add(dMesh);
    prismScreenDots.push(dMesh);
  });

  rootGroup.add(screenGroup);

  // ==========================================
  // 8. SNELL'S LAW 3D GLASS TANK
  // ==========================================
  const snellGroup = new THREE.Group();
  snellGroup.name = 'SnellGroup';
  snellGroup.visible = false;

  const tankOuterGeo = new THREE.BoxGeometry(4.6, 2.2, 2.6);
  disposables.push(tankOuterGeo);
  const tankGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.05,
    roughness: 0.04,
    transmission: isSoftwareGl ? 0.35 : 0.94,
    transparent: true,
    opacity: isSoftwareGl ? 0.45 : 0.85,
    ior: 1.52,
    thickness: 0.8,
  });
  disposables.push(tankGlassMat);
  const tankMesh = new THREE.Mesh(tankOuterGeo, tankGlassMat);
  tankMesh.position.y = 1.1;
  snellGroup.add(tankMesh);

  const tankRimGeo = new THREE.BoxGeometry(4.66, 0.08, 2.66);
  disposables.push(tankRimGeo);
  const tankRimTop = new THREE.Mesh(tankRimGeo, brassMat);
  tankRimTop.position.y = 2.2;
  snellGroup.add(tankRimTop);
  const tankRimBottom = new THREE.Mesh(tankRimGeo, brassMat);
  tankRimBottom.position.y = 0.04;
  snellGroup.add(tankRimBottom);

  const liquidGeo = new THREE.BoxGeometry(4.5, 1.08, 2.5);
  disposables.push(liquidGeo);
  const liquidMat = new THREE.MeshPhysicalMaterial({
    color: 0x06b6d4,
    metalness: 0.02,
    roughness: 0.05,
    transmission: 0.88,
    transparent: true,
    opacity: 0.65,
    ior: 1.333,
  });
  disposables.push(liquidMat);
  const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
  liquidMesh.position.y = 0.55;
  snellGroup.add(liquidMesh);

  const boundaryGeo = new THREE.PlaneGeometry(4.5, 2.5);
  disposables.push(boundaryGeo);
  const boundaryMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    side: THREE.DoubleSide,
  });
  disposables.push(boundaryMat);
  const boundaryMesh = new THREE.Mesh(boundaryGeo, boundaryMat);
  boundaryMesh.rotation.x = -Math.PI / 2;
  boundaryMesh.position.y = 1.1;
  snellGroup.add(boundaryMesh);

  const normalGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.5, 8);
  disposables.push(normalGeo);
  const normalMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.8,
  });
  disposables.push(normalMat);
  const normalMesh = new THREE.Mesh(normalGeo, normalMat);
  normalMesh.position.set(0, 1.1, 0);
  snellGroup.add(normalMesh);

  const snellArcGeo = new THREE.TorusGeometry(2.05, 0.025, 12, 64, Math.PI);
  disposables.push(snellArcGeo);
  const snellArcMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.8,
    roughness: 0.25,
  });
  disposables.push(snellArcMat);
  const snellArc = new THREE.Mesh(snellArcGeo, snellArcMat);
  snellArc.position.set(0, 1.1, 0);
  snellGroup.add(snellArc);

  const snellLaserTurret = new THREE.Group();
  const snellTurretGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.65, 16);
  snellTurretGeo.rotateZ(Math.PI / 2);
  disposables.push(snellTurretGeo);
  const snellTurretMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.85,
    roughness: 0.25,
  });
  disposables.push(snellTurretMat);
  snellLaserTurret.add(new THREE.Mesh(snellTurretGeo, snellTurretMat));

  const snellNozzleGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.25, 16);
  snellNozzleGeo.rotateZ(Math.PI / 2);
  disposables.push(snellNozzleGeo);
  const snellNozzle = new THREE.Mesh(snellNozzleGeo, brassMat);
  snellNozzle.position.x = 0.38;
  snellLaserTurret.add(snellNozzle);
  snellGroup.add(snellLaserTurret);

  const snellIncMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.92,
    blending: THREE.AdditiveBlending,
  });
  const snellRefrMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.88,
    blending: THREE.AdditiveBlending,
  });
  const snellReflMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
  });
  disposables.push(snellIncMat, snellRefrMat, snellReflMat);

  const snellIncRay = new THREE.Mesh(unitRayGeo, snellIncMat);
  const snellRefrRay = new THREE.Mesh(unitRayGeo, snellRefrMat);
  const snellReflRay = new THREE.Mesh(unitRayGeo, snellReflMat);
  snellGroup.add(snellIncRay, snellRefrRay, snellReflRay);

  const tirConeGeo = new THREE.ConeGeometry(0.4, 0.8, 16);
  disposables.push(tirConeGeo);
  const tirConeMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    transparent: true,
    opacity: 0.75,
    wireframe: true,
  });
  disposables.push(tirConeMat);
  const tirCone = new THREE.Mesh(tirConeGeo, tirConeMat);
  tirCone.position.set(0, 1.1, 0);
  tirCone.visible = false;
  snellGroup.add(tirCone);

  rootGroup.add(snellGroup);

  // ==========================================
  // UPDATE LOOP (True Ray-Tracing Optics)
  // ==========================================
  const update = (_delta: number, params: Optics3DParams) => {
    const beamColor = params.lightMode === 'laser' ? wavelengthToColor(params.laserWavelength) : new THREE.Color(0xffffff);
    bulbMat.color.copy(beamColor);

    const screenX = Math.max(1.2, Math.min(4.4, params.screenDistance || 2.5));
    screenGroup.position.x = screenX;

    // --------------------------------------------------------
    // MODE 1: SNELL'S LAW TANK
    // --------------------------------------------------------
    if (params.elementMode === 'snell') {
      benchGroup.visible = false;
      stageGroup.visible = false;
      torchGroup.visible = false;
      screenGroup.visible = false;
      lensRaysGroup.visible = false;
      prismRaysGroup.visible = false;
      focalMarkersGroup.visible = false;
      snellGroup.visible = true;

      const laserColor = wavelengthToColor(params.laserWavelength || 532);
      snellIncMat.color.copy(laserColor);
      snellRefrMat.color.copy(laserColor);

      const theta1Deg = Math.max(0.1, Math.min(88, params.snellTheta1Deg ?? 45));
      const theta1Rad = (theta1Deg * Math.PI) / 180;
      const n1 = params.snellN1 ?? 1.0003;
      const n2 = params.snellN2 ?? 1.333;
      const sinTheta2 = (n1 / n2) * Math.sin(theta1Rad);
      const isTIR = sinTheta2 > 1.0;
      const theta2Rad = !isTIR ? Math.asin(sinTheta2) : 0;

      // Liquid optical visual reflects n2 density
      liquidMat.ior = n2;
      if (n2 > 2.0) liquidMat.color.setHex(0xa855f7);
      else if (n2 > 1.45) liquidMat.color.setHex(0x38bdf8);
      else if (n2 > 1.2) liquidMat.color.setHex(0x06b6d4);
      else liquidMat.color.setHex(0xe2e8f0);
      liquidMat.opacity = n2 <= 1.02 ? 0.16 : 0.58;

      const R = 2.05;
      const lx = -R * Math.sin(theta1Rad);
      const ly = 1.1 + R * Math.cos(theta1Rad);
      snellLaserTurret.position.set(lx, ly, 0);
      snellLaserTurret.rotation.z = -theta1Rad;

      snellIncRay.visible = true;
      snellIncRay.scale.set(1.2, 1, 1.2);
      orientBeamBetween(snellIncRay, new THREE.Vector3(lx, ly, 0), new THREE.Vector3(0, 1.1, 0));

      const rx = R * Math.sin(theta1Rad);
      const ry = 1.1 + R * Math.cos(theta1Rad);
      snellReflRay.visible = true;
      snellReflRay.scale.set(1.1, 1, 1.1);
      orientBeamBetween(snellReflRay, new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(rx, ry, 0));

      if (!isTIR) {
        snellRefrRay.visible = true;
        tirCone.visible = false;
        const refrX = R * Math.sin(theta2Rad);
        const refrY = 1.1 - R * Math.cos(theta2Rad);
        snellRefrRay.scale.set(1.2, 1, 1.2);
        orientBeamBetween(snellRefrRay, new THREE.Vector3(0, 1.1, 0), new THREE.Vector3(refrX, refrY, 0));

        const fresnel = Math.min(0.85, 0.22 + 0.55 * Math.pow(theta1Deg / 88, 2));
        snellReflMat.opacity = fresnel;
        snellReflMat.color.copy(laserColor);
      } else {
        snellRefrRay.visible = false;
        tirCone.visible = true;
        snellReflMat.opacity = 0.96;
        snellReflMat.color.setHex(0xef4444);
      }
      return;
    }

    // Optical bench visible for both Lens and Prism modes
    benchGroup.visible = true;
    stageGroup.visible = true;
    torchGroup.visible = true;
    screenGroup.visible = true;
    snellGroup.visible = false;

    // --------------------------------------------------------
    // MODE 2: CONVEX / CONCAVE LENS WITH TRUE REFRACTED RAYS
    // --------------------------------------------------------
    if (params.elementMode === 'lens') {
      prismGroup.visible = false;
      lensGroup.visible = true;
      lensRaysGroup.visible = true;
      prismRaysGroup.visible = false;
      focalMarkersGroup.visible = true;
      stageGroup.rotation.y = 0;

      const isConvex = params.lensType !== 'concave';
      convexLensMesh.visible = isConvex;
      concaveLensMesh.visible = !isConvex;

      // Chromatic focal shift: violet bends slightly stronger than red
      const wl = params.lightMode === 'laser' ? params.laserWavelength : 532;
      const chromaticFactor = 1.0 + ((wl - 532) / 300) * 0.04;
      const baseF = Math.max(0.85, Math.min(3.5, params.lensFocalLength || 1.8));
      const f = baseF * chromaticFactor;
      const spread = Math.max(0.18, Math.min(0.74, params.beamSpread || 0.52));

      // Position focal markers along the rail
      focalPinF.position.x = isConvex ? f : -f;
      focalPin2F.position.x = isConvex ? Math.min(4.8, 2 * f) : -Math.min(3.0, 2 * f);
      focalPin2F.visible = isConvex && 2 * f <= 4.8;

      const rayCol = params.lightMode === 'laser' ? wavelengthToColor(wl) : new THREE.Color(0xfef08a);
      lensRayMat.color.copy(rayCol);
      spotMat.color.copy(rayCol);

      // Update each parallel beam entering lens at x = 0 and exiting to screenX
      LENS_OFFSETS.forEach((k, idx) => {
        const yIn = OPTICAL_AXIS_Y + k * spread;
        const pStart = new THREE.Vector3(-3.05, yIn, 0);
        const pLens = new THREE.Vector3(0, yIn, 0);

        const incM = lensIncRays[idx];
        incM.visible = true;
        orientBeamBetween(incM, pStart, pLens);

        // Thin-lens equation ray slope:
        // Convex: passes through (f, OPTICAL_AXIS_Y, 0)
        // Concave: diverges as if originating from (-f, OPTICAL_AXIS_Y, 0)
        const h = k * spread;
        const yAtScreen = isConvex
          ? OPTICAL_AXIS_Y + h * (1 - screenX / f)
          : OPTICAL_AXIS_Y + h * (1 + screenX / f);

        const pScreen = new THREE.Vector3(screenX, yAtScreen, 0);
        const refrM = lensRefrRays[idx];
        refrM.visible = true;
        orientBeamBetween(refrM, pLens, pScreen);

        // Virtual backward divergence dashed-like guide ray for concave lens
        const virtM = lensVirtualRays[idx];
        if (!isConvex && Math.abs(k) > 0.05) {
          virtM.visible = true;
          orientBeamBetween(virtM, new THREE.Vector3(-f, OPTICAL_AXIS_Y, 0), pLens);
        } else {
          virtM.visible = false;
        }
      });

      // Projected Light Spot on Screen
      screenSpotMesh.visible = true;
      prismScreenDots.forEach((d) => {
        d.visible = false;
      });
      const spotRadiusAtScreen = isConvex
        ? Math.max(0.08, Math.abs(spread * (1 - screenX / f)) * 2.2)
        : Math.max(0.18, spread * (1 + screenX / f) * 1.9);
      screenSpotMesh.position.set(-0.075, OPTICAL_AXIS_Y - 0.38, 0);
      screenSpotMesh.scale.set(spotRadiusAtScreen, spotRadiusAtScreen, 1);
      const focusSharpness = isConvex ? Math.max(0.25, 1.0 - Math.min(0.75, Math.abs(screenX - f) * 0.4)) : 0.35;
      spotMat.opacity = focusSharpness;
      return;
    }

    // --------------------------------------------------------
    // MODE 3: GLASS PRISM DISPERSION (TRUE SNELL RAY TRACING)
    // --------------------------------------------------------
    prismGroup.visible = true;
    lensGroup.visible = false;
    lensRaysGroup.visible = false;
    prismRaysGroup.visible = true;
    focalMarkersGroup.visible = false;
    screenSpotMesh.visible = false;

    const rotY = (params.prismAngle * Math.PI) / 180;
    stageGroup.rotation.y = rotY;

    const baseIOR = params.prismMaterial === 'diamond' ? 2.41 : params.prismMaterial === 'flint' ? 1.66 : 1.52;
    glassMat.ior = baseIOR;

    // Rotate 2D triangle vertices by -rotY (Three.js rotation.y rotates (x, z) by cos/-sin)
    const cosA = Math.cos(-rotY);
    const sinA = Math.sin(-rotY);
    const vertsWorld: [number, number][] = baseVertices2D.map(([vx, vz]) => [
      vx * cosA - vz * sinA,
      vx * sinA + vz * cosA,
    ]);
    const edges: [[number, number], [number, number]][] = [
      [vertsWorld[0], vertsWorld[1]],
      [vertsWorld[1], vertsWorld[2]],
      [vertsWorld[2], vertsWorld[0]],
    ];

    // Incident beam along +X at (z = 0, y = OPTICAL_AXIS_Y)
    const ox = -3.05;
    const oz = 0;
    let firstHit: { t: number; x: number; z: number; nx: number; nz: number; edgeIdx: number } | null = null;
    for (let idx = 0; idx < edges.length; idx++) {
      const [a, b] = edges[idx];
      const hit = intersectRaySegment2D(ox, oz, 1, 0, a[0], a[1], b[0], b[1]);
      if (hit && (!firstHit || hit.t < firstHit.t)) {
        firstHit = { ...hit, edgeIdx: idx };
      }
    }

    if (!firstHit) {
      prismIncRay.visible = true;
      orientBeamBetween(
        prismIncRay,
        new THREE.Vector3(-3.05, OPTICAL_AXIS_Y, 0),
        new THREE.Vector3(screenX, OPTICAL_AXIS_Y, 0)
      );
      prismInternalRays.forEach((m) => (m.visible = false));
      prismExitRays.forEach((m) => (m.visible = false));
      prismScreenDots.forEach((d) => (d.visible = false));
      return;
    }

    const resolvedEntry = firstHit;
    const entryPoint = new THREE.Vector3(resolvedEntry.x, OPTICAL_AXIS_Y, resolvedEntry.z);
    prismIncRay.visible = true;
    prismIncMat.color.copy(beamColor);
    orientBeamBetween(prismIncRay, new THREE.Vector3(-3.05, OPTICAL_AXIS_Y, 0), entryPoint);

    // Trace each spectral band (or single active wavelength band if laser mode)
    const dispersionScale = params.prismMaterial === 'diamond' ? 2.4 : params.prismMaterial === 'flint' ? 1.55 : 1.0;

    SPECTRAL_BANDS.forEach((band, idx) => {
      const intM = prismInternalRays[idx];
      const extM = prismExitRays[idx];
      const dotM = prismScreenDots[idx];

      if (params.lightMode === 'laser' && idx !== 3) {
        intM.visible = false;
        extM.visible = false;
        dotM.visible = false;
        return;
      }

      const activeBandColor = params.lightMode === 'laser' ? wavelengthToColor(params.laserWavelength) : new THREE.Color(band.hex);
      (intM.material as THREE.MeshBasicMaterial).color.copy(activeBandColor);
      (extM.material as THREE.MeshBasicMaterial).color.copy(activeBandColor);
      (dotM.material as THREE.MeshBasicMaterial).color.copy(activeBandColor);

      const nGlass =
        params.lightMode === 'laser'
          ? baseIOR + ((532 - params.laserWavelength) / 100) * 0.015 * dispersionScale
          : baseIOR + band.nOffset * dispersionScale;

      const refrIn = refract2D(1, 0, resolvedEntry.nx, resolvedEntry.nz, 1.0 / nGlass);
      if (!refrIn) {
        intM.visible = false;
        extM.visible = false;
        dotM.visible = false;
        return;
      }

      // Find exit edge inside prism
      let exitHit: { t: number; x: number; z: number; nx: number; nz: number } | null = null;
      for (let eIdx = 0; eIdx < edges.length; eIdx++) {
        if (eIdx === resolvedEntry.edgeIdx) continue;
        const [a, b] = edges[eIdx];
        const h = intersectRaySegment2D(resolvedEntry.x, resolvedEntry.z, refrIn.dx, refrIn.dz, a[0], a[1], b[0], b[1]);
        if (h && (!exitHit || h.t < exitHit.t)) {
          exitHit = h;
        }
      }

      if (!exitHit) {
        intM.visible = false;
        extM.visible = false;
        dotM.visible = false;
        return;
      }

      const exitVec = new THREE.Vector3(exitHit.x, OPTICAL_AXIS_Y, exitHit.z);
      intM.visible = true;
      orientBeamBetween(intM, entryPoint, exitVec);

      // Exit refraction (Glass -> Air), or Total Internal Reflection!
      const refrOut = refract2D(refrIn.dx, refrIn.dz, exitHit.nx, exitHit.nz, nGlass);
      const outDir = refrOut || reflect2D(refrIn.dx, refrIn.dz, exitHit.nx, exitHit.nz);

      extM.visible = true;
      if (outDir.dx > 0.08 && screenX > exitHit.x) {
        const tScreen = (screenX - exitHit.x) / outDir.dx;
        const zHit = exitHit.z + outDir.dz * tScreen;
        const endPt = new THREE.Vector3(screenX, OPTICAL_AXIS_Y, zHit);
        orientBeamBetween(extM, exitVec, endPt);

        // Light up rainbow stripe on projection screen if within screen width (±1.35)
        if (Math.abs(zHit) <= 1.35) {
          dotM.visible = true;
          dotM.position.set(-0.075, OPTICAL_AXIS_Y - 0.38, zHit);
          dotM.scale.set(params.lightMode === 'laser' ? 1.4 : 0.85, 0.9, 1);
        } else {
          dotM.visible = false;
        }
      } else {
        const endPt = new THREE.Vector3(exitHit.x + outDir.dx * 2.5, OPTICAL_AXIS_Y, exitHit.z + outDir.dz * 2.5);
        orientBeamBetween(extM, exitVec, endPt);
        dotM.visible = false;
      }
    });
  };

  const dispose = () => {
    disposables.forEach((item) => item.dispose());
  };

  return { group: rootGroup, update, dispose };
}
