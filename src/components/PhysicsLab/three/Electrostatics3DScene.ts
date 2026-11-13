import * as THREE from 'three';

export interface Electrostatics3DParams {
  q1Sign: 'positive' | 'negative';
  q2Sign: 'positive' | 'negative';
  q1Mag: number; // 1 to 10 uC
  q2Mag: number; // 1 to 10 uC
  chargeDistance: number; // 2.0 to 5.0 m
  showFieldLines: boolean;
  showTestCharge: boolean;
  relaunchKey?: number;
}

export interface Electrostatics3DSceneInstance {
  group: THREE.Group;
  update: (delta: number, params: Electrostatics3DParams) => void;
  dispose: () => void;
}

export function createElectrostatics3DScene(isSoftwareGl: boolean): Electrostatics3DSceneInstance {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Electrostatics3DScene';

  const disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  // ==========================================
  // 1. INSULATING DIELECTRIC BENCH BASE
  // ==========================================
  const benchGroup = new THREE.Group();

  const benchGeo = new THREE.BoxGeometry(8.6, 0.28, 4.4);
  disposables.push(benchGeo);
  const benchMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.6,
  });
  disposables.push(benchMat);
  const benchMesh = new THREE.Mesh(benchGeo, benchMat);
  benchMesh.position.y = 0.14;
  benchMesh.receiveShadow = !isSoftwareGl;
  benchGroup.add(benchMesh);

  const stripeGeo = new THREE.BoxGeometry(8.6, 0.04, 0.12);
  disposables.push(stripeGeo);
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  disposables.push(stripeMat);
  const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
  stripeMesh.position.set(0, 0.28, 2.15);
  benchGroup.add(stripeMesh);

  rootGroup.add(benchGroup);

  // ==========================================
  // 2. PRIMARY CHARGED SPHERES (Q1 & Q2)
  // ==========================================
  const sphereGeo = new THREE.SphereGeometry(0.48, 32, 24);
  disposables.push(sphereGeo);

  const pedGeo = new THREE.CylinderGeometry(0.08, 0.14, 1.4, 20);
  disposables.push(pedGeo);
  const pedMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.1,
    transmission: isSoftwareGl ? 0.3 : 0.85,
    transparent: true,
    opacity: isSoftwareGl ? 0.5 : 0.9,
    ior: 1.5,
  });
  disposables.push(pedMat);

  const q1Group = new THREE.Group();
  q1Group.position.set(-1.8, 1.6, 0);
  const q1Ped = new THREE.Mesh(pedGeo, pedMat);
  q1Ped.position.y = -0.7;
  q1Group.add(q1Ped);

  const q1Mat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.15,
    metalness: 0.8,
    emissive: 0xdc2626,
    emissiveIntensity: 0.4,
  });
  disposables.push(q1Mat);
  const q1Mesh = new THREE.Mesh(sphereGeo, q1Mat);
  q1Mesh.castShadow = !isSoftwareGl;
  q1Group.add(q1Mesh);

  const q1Light = new THREE.PointLight(0xef4444, 1.8, 4.5);
  q1Group.add(q1Light);
  rootGroup.add(q1Group);

  const q2Group = new THREE.Group();
  q2Group.position.set(1.8, 1.6, 0);
  const q2Ped = new THREE.Mesh(pedGeo, pedMat);
  q2Ped.position.y = -0.7;
  q2Group.add(q2Ped);

  const q2Mat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.15,
    metalness: 0.8,
    emissive: 0x2563eb,
    emissiveIntensity: 0.4,
  });
  disposables.push(q2Mat);
  const q2Mesh = new THREE.Mesh(sphereGeo, q2Mat);
  q2Mesh.castShadow = !isSoftwareGl;
  q2Group.add(q2Mesh);

  const q2Light = new THREE.PointLight(0x3b82f6, 1.8, 4.5);
  q2Group.add(q2Light);
  rootGroup.add(q2Group);

  // ==========================================
  // 2b. 3D COULOMB FORCE VECTORS (F12 & F21)
  // ==========================================
  const fShaftGeo = new THREE.CylinderGeometry(0.032, 0.032, 1.0, 12);
  fShaftGeo.rotateZ(-Math.PI / 2);
  fShaftGeo.translate(0.5, 0, 0);
  disposables.push(fShaftGeo);

  const fConeGeo = new THREE.ConeGeometry(0.1, 0.24, 12);
  fConeGeo.rotateZ(-Math.PI / 2);
  fConeGeo.translate(1.12, 0, 0);
  disposables.push(fConeGeo);

  const forceMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  disposables.push(forceMat);

  const f1Arrow = new THREE.Group();
  f1Arrow.add(new THREE.Mesh(fShaftGeo, forceMat));
  f1Arrow.add(new THREE.Mesh(fConeGeo, forceMat));
  q1Group.add(f1Arrow);

  const f2Arrow = new THREE.Group();
  f2Arrow.add(new THREE.Mesh(fShaftGeo, forceMat));
  f2Arrow.add(new THREE.Mesh(fConeGeo, forceMat));
  q2Group.add(f2Arrow);

  // ==========================================
  // 3. NUMERICALLY INTEGRATED 3D ELECTRIC FIELD STREAMLINES
  // ==========================================
  const linesGroup = new THREE.Group();
  rootGroup.add(linesGroup);

  const lineMat = new THREE.MeshBasicMaterial({
    color: 0xc084fc,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
  });
  disposables.push(lineMat);

  let fieldLineGeos: THREE.BufferGeometry[] = [];
  let lastFieldKey = '';

  const evalE = (
    p: THREE.Vector3,
    q1Pos: THREE.Vector3,
    q2Pos: THREE.Vector3,
    q1: number,
    q2: number
  ): THREE.Vector3 => {
    const d1 = new THREE.Vector3().subVectors(p, q1Pos);
    const r1Sq = Math.max(0.04, d1.lengthSq());
    const d2 = new THREE.Vector3().subVectors(p, q2Pos);
    const r2Sq = Math.max(0.04, d2.lengthSq());

    const out = new THREE.Vector3();
    out.addScaledVector(d1, q1 / (r1Sq * Math.sqrt(r1Sq)));
    out.addScaledVector(d2, q2 / (r2Sq * Math.sqrt(r2Sq)));
    return out;
  };

  const rebuildFieldLines = (params: Electrostatics3DParams) => {
    // Clear and dispose old tube geometries cleanly
    while (linesGroup.children.length > 0) {
      linesGroup.remove(linesGroup.children[0]);
    }
    fieldLineGeos.forEach((g) => g.dispose());
    fieldLineGeos = [];

    const halfDist = params.chargeDistance / 2;
    const q1Pos = new THREE.Vector3(-halfDist, 1.6, 0);
    const q2Pos = new THREE.Vector3(halfDist, 1.6, 0);
    const q1 = (params.q1Sign === 'positive' ? 1 : -1) * params.q1Mag;
    const q2 = (params.q2Sign === 'positive' ? 1 : -1) * params.q2Mag;

    // Color streamlines by regime: Violet for dipole attraction, Cyan/Amber for repulsion
    const isAttraction = q1 * q2 < 0;
    lineMat.color.setHex(isAttraction ? 0xc084fc : q1 > 0 ? 0xfb7185 : 0x38bdf8);

    const traceStreamline = (seed: THREE.Vector3, dirSign: number) => {
      const pts: THREE.Vector3[] = [seed.clone()];
      const curr = seed.clone();
      const step = 0.14;

      for (let s = 0; s < 48; s++) {
        const eVec = evalE(curr, q1Pos, q2Pos, q1, q2);
        const len = eVec.length();
        if (len < 1e-5) break;
        curr.addScaledVector(eVec, (dirSign * step) / len);

        // Clamp above dielectric bench
        if (curr.y < 0.34 || curr.y > 4.2 || Math.abs(curr.x) > 4.2 || Math.abs(curr.z) > 2.2) {
          pts.push(curr.clone());
          break;
        }
        pts.push(curr.clone());

        // Stop if hitting either charged sphere
        if (curr.distanceTo(q1Pos) < 0.44 || curr.distanceTo(q2Pos) < 0.44) {
          break;
        }
      }

      if (pts.length >= 4) {
        const curve = new THREE.CatmullRomCurve3(pts);
        const tubeGeo = new THREE.TubeGeometry(curve, Math.min(28, pts.length * 2), 0.017, 6, false);
        fieldLineGeos.push(tubeGeo);
        linesGroup.add(new THREE.Mesh(tubeGeo, lineMat));
      }
    };

    // Seed streamlines symmetrically in azimuth rings around charges
    const rings = [0.35, 0.85, 1.45];
    const azimuths = 6;

    // Trace outward from positive charges (or inward into negative charges if both negative)
    const traceFromQ1Sign = q1 > 0 ? 1 : -1;
    for (const phi of rings) {
      for (let a = 0; a < azimuths; a++) {
        const theta = (a / azimuths) * Math.PI * 2;
        const dirToOther = q1Pos.x < 0 ? 1 : -1;
        const seed1 = new THREE.Vector3(
          q1Pos.x + dirToOther * Math.cos(phi) * 0.54,
          q1Pos.y + Math.sin(phi) * Math.cos(theta) * 0.54,
          q1Pos.z + Math.sin(phi) * Math.sin(theta) * 0.54
        );
        traceStreamline(seed1, traceFromQ1Sign);
      }
    }

    // If like charges, also trace symmetrically from Q2 to visualize true hyperbolic repulsion saddle
    if (!isAttraction) {
      const traceFromQ2Sign = q2 > 0 ? 1 : -1;
      for (const phi of rings) {
        for (let a = 0; a < azimuths; a++) {
          const theta = (a / azimuths) * Math.PI * 2;
          const seed2 = new THREE.Vector3(
            q2Pos.x - Math.cos(phi) * 0.54,
            q2Pos.y + Math.sin(phi) * Math.cos(theta) * 0.54,
            q2Pos.z + Math.sin(phi) * Math.sin(theta) * 0.54
          );
          traceStreamline(seed2, traceFromQ2Sign);
        }
      }
    }
  };

  // ==========================================
  // 4. PHYSICS-DRIVEN 3D TEST CHARGE (q0 > 0)
  // ==========================================
  const testChargeGroup = new THREE.Group();

  const testGeo = new THREE.SphereGeometry(0.11, 16, 16);
  disposables.push(testGeo);
  const testMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  disposables.push(testMat);
  const testMesh = new THREE.Mesh(testGeo, testMat);
  testChargeGroup.add(testMesh);

  const glowLight = new THREE.PointLight(0xfbbf24, 1.2, 2.5);
  testChargeGroup.add(glowLight);
  rootGroup.add(testChargeGroup);

  const testPos = new THREE.Vector3(0, 2.25, 0.85);
  const testVel = new THREE.Vector3(0.4, 0, -0.35);
  let lastRelaunchKey = -1;

  const resetTestCharge = () => {
    testPos.set(0, 2.25, 0.9);
    testVel.set(0.45, -0.05, -0.45);
  };

  // ==========================================
  // UPDATE LOOP
  // ==========================================
  let elapsed = 0;

  const update = (delta: number, params: Electrostatics3DParams) => {
    elapsed += delta;

    if (params.relaunchKey !== undefined && params.relaunchKey !== lastRelaunchKey) {
      lastRelaunchKey = params.relaunchKey;
      resetTestCharge();
    }

    const halfDist = params.chargeDistance / 2;
    q1Group.position.x = -halfDist;
    q2Group.position.x = halfDist;

    // Scale spheres proportionally to magnitude (1..10 uC)
    const s1 = 0.78 + params.q1Mag * 0.045;
    const s2 = 0.78 + params.q2Mag * 0.045;
    q1Mesh.scale.setScalar(s1);
    q2Mesh.scale.setScalar(s2);

    // Polarities & Glow
    if (params.q1Sign === 'positive') {
      q1Mat.color.setHex(0xef4444);
      q1Mat.emissive.setHex(0xdc2626);
      q1Light.color.setHex(0xef4444);
    } else {
      q1Mat.color.setHex(0x3b82f6);
      q1Mat.emissive.setHex(0x2563eb);
      q1Light.color.setHex(0x3b82f6);
    }

    if (params.q2Sign === 'positive') {
      q2Mat.color.setHex(0xef4444);
      q2Mat.emissive.setHex(0xdc2626);
      q2Light.color.setHex(0xef4444);
    } else {
      q2Mat.color.setHex(0x3b82f6);
      q2Mat.emissive.setHex(0x2563eb);
      q2Light.color.setHex(0x3b82f6);
    }

    // Coulomb Force Arrows: Attract if opposite, Repel if same
    const isAttraction = params.q1Sign !== params.q2Sign;
    const forceMagnitudeFactor = (params.q1Mag * params.q2Mag) / (params.chargeDistance * params.chargeDistance);
    const arrowLen = Math.max(0.35, Math.min(1.65, forceMagnitudeFactor * 0.22));

    forceMat.color.setHex(isAttraction ? 0x10b981 : 0xf97316);
    f1Arrow.rotation.y = isAttraction ? 0 : Math.PI;
    f2Arrow.rotation.y = isAttraction ? Math.PI : 0;
    f1Arrow.scale.set(arrowLen, 1, 1);
    f2Arrow.scale.set(arrowLen, 1, 1);

    // Rebuild 3D electric field streamlines when charge configuration changes
    const fieldKey = `${params.q1Sign}-${params.q1Mag}-${params.q2Sign}-${params.q2Mag}-${params.chargeDistance.toFixed(1)}`;
    if (fieldKey !== lastFieldKey) {
      lastFieldKey = fieldKey;
      rebuildFieldLines(params);
    }

    linesGroup.visible = params.showFieldLines;
    if (params.showFieldLines) {
      lineMat.opacity = 0.62 + 0.18 * Math.sin(elapsed * 3.0);
    }

    // Physics-integrated Test Charge motion under F = q0 * E(r)
    testChargeGroup.visible = params.showTestCharge;
    if (params.showTestCharge) {
      const q1Pos = new THREE.Vector3(-halfDist, 1.6, 0);
      const q2Pos = new THREE.Vector3(halfDist, 1.6, 0);
      const q1 = (params.q1Sign === 'positive' ? 1 : -1) * params.q1Mag;
      const q2 = (params.q2Sign === 'positive' ? 1 : -1) * params.q2Mag;

      const eField = evalE(testPos, q1Pos, q2Pos, q1, q2);
      // Acceleration from Coulomb field (sub-stepped for numerical stability)
      testVel.addScaledVector(eField, delta * 0.42);
      // Gentle speed clamp & light drag so motion stays observable
      testVel.multiplyScalar(0.992);
      if (testVel.length() > 3.5) testVel.setLength(3.5);
      testPos.addScaledVector(testVel, delta);

      // Relaunch smoothly if captured by a sphere or exiting laboratory bench volume
      if (
        testPos.distanceTo(q1Pos) < 0.56 ||
        testPos.distanceTo(q2Pos) < 0.56 ||
        Math.abs(testPos.x) > 4.2 ||
        testPos.y < 0.45 ||
        testPos.y > 4.2 ||
        Math.abs(testPos.z) > 2.4
      ) {
        resetTestCharge();
      }

      testChargeGroup.position.copy(testPos);
    }
  };

  const dispose = () => {
    fieldLineGeos.forEach((g) => g.dispose());
    disposables.forEach((item) => item.dispose());
  };

  return { group: rootGroup, update, dispose };
}
