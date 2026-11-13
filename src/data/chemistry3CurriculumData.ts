/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Chemistry 3 (3rd Secondary / Pathways) Curriculum Datasets & Scientific Models:
 * - Organic Chemistry Functional Groups & IUPAC Name + 2D/3D Generator
 * - Reaction Kinetics & Collision Theory Presets
 * - Chemical Equilibrium & Le Chatelier Presets
 * - Stoichiometry & Limiting Reactant Presets
 * - Galvanic Half-Cells & Electrolytic Solutions
 * - VSEPR & Electronegativity Polarity Analyzer
 */

export interface OrganicFunctionalGroupDef {
  id:
    | 'alkane'
    | 'alkene'
    | 'alkyne'
    | 'alcohol'
    | 'aldehyde'
    | 'ketone'
    | 'carboxylic_acid'
    | 'ester'
    | 'amine'
    | 'haloalkane';
  nameAr: string;
  nameEn: string;
  generalFormula: string;
  suffixAr: string;
  suffixEn: string;
  functionalTag: string;
  minCarbons: number;
  polarityDescAr: string;
  polarityDescEn: string;
  usesAr: string;
  usesEn: string;
}

export const ORGANIC_FUNCTIONAL_GROUPS: OrganicFunctionalGroupDef[] = [
  {
    id: 'alkane',
    nameAr: 'الألكانات (روابط أحادية)',
    nameEn: 'Alkanes (Single Bonds)',
    generalFormula: 'CₙH₂ₙ₊₂',
    suffixAr: 'ان',
    suffixEn: 'ane',
    functionalTag: 'C–C',
    minCarbons: 1,
    polarityDescAr: 'غير قطبية، قوى تشتت لندن فقط، لا تذوب في الماء.',
    polarityDescEn: 'Non-polar, London dispersion forces only, insoluble in water.',
    usesAr: 'الوقود (الميثان، البروبان، الأوكتان) ومذيبات عضوية غير قطبية.',
    usesEn: 'Fuels (methane, propane, octane) and non-polar solvents.'
  },
  {
    id: 'alkene',
    nameAr: 'الألكينات (رابطة ثنائية)',
    nameEn: 'Alkenes (Double Bond C=C)',
    generalFormula: 'CₙH₂ₙ',
    suffixAr: 'ين',
    suffixEn: 'ene',
    functionalTag: 'C=C',
    minCarbons: 2,
    polarityDescAr: 'غير قطبية تقريباً، نشطة كيميائياً بسبب الرابطة π الثنائية.',
    polarityDescEn: 'Nearly non-polar; reactive at the π double bond via addition reactions.',
    usesAr: 'صناعة البوليمرات (البولي إيثيلين) وإنضاج الفواكه (الإيثين).',
    usesEn: 'Polymer synthesis (polyethylene) and fruit ripening (ethene).'
  },
  {
    id: 'alkyne',
    nameAr: 'الألكاينات (رابطة ثلاثية)',
    nameEn: 'Alkynes (Triple Bond C≡C)',
    generalFormula: 'CₙH₂ₙ₋₂',
    suffixAr: 'اين',
    suffixEn: 'yne',
    functionalTag: 'C≡C',
    minCarbons: 2,
    polarityDescAr: 'هندسة خطية (180°، تهجين sp) ذات كثافة إلكترونية عالية.',
    polarityDescEn: 'Linear geometry (180°, sp hybridization) with high electron density.',
    usesAr: 'شعلة اللحام بالأسيتيلين (الإيثاين) وتحضير اللدائن.',
    usesEn: 'Oxyacetylene welding torches (ethyne) and organic synthesis.'
  },
  {
    id: 'alcohol',
    nameAr: 'الكحولات (–OH)',
    nameEn: 'Alcohols (–OH)',
    generalFormula: 'R–OH',
    suffixAr: 'انول',
    suffixEn: 'anol',
    functionalTag: '–OH',
    minCarbons: 1,
    polarityDescAr: 'قطبية وتكوّن روابط هيدروجينية، لذا درجات غليانها مرتفعة وتذوب بالماء.',
    polarityDescEn: 'Polar and forms hydrogen bonds, giving high boiling points and water solubility.',
    usesAr: 'المعقمات والمذيبات الصناعية (الإيثانول، الأيزوبروبانول).',
    usesEn: 'Antiseptics, disinfectants, and industrial solvents (ethanol).'
  },
  {
    id: 'aldehyde',
    nameAr: 'الألدهيدات (–CHO)',
    nameEn: 'Aldehydes (–CHO)',
    generalFormula: 'R–CHO',
    suffixAr: 'انال',
    suffixEn: 'anal',
    functionalTag: '–C(=O)H',
    minCarbons: 1,
    polarityDescAr: 'قطبية بسبب مجموعة الكربونيل الطرفية C=O؛ لا تكوّن روابط هيدروجينية بين جزيئاتها.',
    polarityDescEn: 'Polar due to terminal C=O carbonyl; lacks intermolecular O-H hydrogen bonding.',
    usesAr: 'حفظ العينات (الفورمالدهيد/ميثانال) وصناعة العطور (السينامالدهيد).',
    usesEn: 'Preservatives (methanal/formaldehyde) and flavorings/fragrances.'
  },
  {
    id: 'ketone',
    nameAr: 'الكيتونات (–CO–)',
    nameEn: 'Ketones (–CO–)',
    generalFormula: 'R–CO–R′',
    suffixAr: 'انون',
    suffixEn: 'anone',
    functionalTag: 'C=O (داخلي)',
    minCarbons: 3,
    polarityDescAr: 'قطبية وسطية مع مجموعة كربونيل داخلية ومذيبات قوية للمركبات العضوية.',
    polarityDescEn: 'Moderately polar with internal carbonyl group; versatile solvents.',
    usesAr: 'الأسيتون (بروبانون) كمزيل لطلاء الأظافر ومذيب مختبري شائع.',
    usesEn: 'Acetone (propanone) as nail polish remover and industrial solvent.'
  },
  {
    id: 'carboxylic_acid',
    nameAr: 'الأحماض الكربوكسيلية (–COOH)',
    nameEn: 'Carboxylic Acids (–COOH)',
    generalFormula: 'R–COOH',
    suffixAr: 'انويك',
    suffixEn: 'anoic acid',
    functionalTag: '–COOH',
    minCarbons: 1,
    polarityDescAr: 'شديدة القطبية وحمضية وتكوّن أزواجاً مترابطة هيدروجينياً مزدوجة.',
    polarityDescEn: 'Strongly polar, acidic, and forms dimeric double hydrogen bonds.',
    usesAr: 'الخل (حمض الإيثانويك) وحمض الستريك والمواد الحافظة للأغذية.',
    usesEn: 'Vinegar (ethanoic acid), citric acid, and food preservatives.'
  },
  {
    id: 'ester',
    nameAr: 'الإسترات (–COO–)',
    nameEn: 'Esters (–COO–)',
    generalFormula: 'R–COO–R′',
    suffixAr: 'انوات الميثيل',
    suffixEn: 'methyl ...anoate',
    functionalTag: '–COO–',
    minCarbons: 2,
    polarityDescAr: 'قطبية متوسطة ذات روائح فاكهية وزهرية عطرة، متطايرة.',
    polarityDescEn: 'Moderately polar, volatile compounds known for fruity and floral aromas.',
    usesAr: 'النكهات الغذائية (نكهة التفاح والأناناس والموز) وصناعة العطور.',
    usesEn: 'Artificial fruit flavors (apple, banana, pineapple) and perfumes.'
  },
  {
    id: 'amine',
    nameAr: 'الأمينات (–NH₂)',
    nameEn: 'Amines (–NH₂)',
    generalFormula: 'R–NH₂',
    suffixAr: 'يل أمين / أمينو',
    suffixEn: 'anamine',
    functionalTag: '–NH₂',
    minCarbons: 1,
    polarityDescAr: 'قطبية وقاعدية (تستقبل البروتون H⁺ بواسطة زوج الإلكترونات على النيتروجين).',
    polarityDescEn: 'Polar and basic (accepts protons via nitrogen lone electron pair).',
    usesAr: 'الأحماض الأمينية، المستحضرات الدوائية، وصناعة الأصباغ.',
    usesEn: 'Amino acids, pharmaceuticals, and dye manufacturing.'
  },
  {
    id: 'haloalkane',
    nameAr: 'هاليدات الألكيل (–Cl / –Br)',
    nameEn: 'Haloalkanes (–Cl / –Br)',
    generalFormula: 'R–X',
    suffixAr: 'كلورو ألكان',
    suffixEn: 'chloroalkane',
    functionalTag: '–Cl / –Br',
    minCarbons: 1,
    polarityDescAr: 'رابطة C–X قطبية تسهل تفاعلات الاستبدال النيوكليوفيلي والحذف.',
    polarityDescEn: 'Polar C–X bond reactive in nucleophilic substitution and elimination.',
    usesAr: 'مبردات التكييف، التخدير الطبي، ومواد بادئة في التخليق العضوي.',
    usesEn: 'Refrigerants, anesthetics, and synthetic intermediates.'
  }
];

export type SubstituentType = 'none' | 'methyl' | 'chloro' | 'bromo';

export interface GeneratedOrganicMolecule {
  iupacAr: string;
  iupacEn: string;
  formula: string;
  molarMass: number;
  hybridization: string;
  atoms: Array<{ element: string; position: [number, number, number]; color?: string; radius?: number }>;
  bonds: Array<{ from: number; to: number; order: 1 | 2 | 3 }>;
  atomLabels2D: Array<{ x: number; y: number; text: string; color: string; isHetero?: boolean }>;
  bonds2D: Array<{ x1: number; y1: number; x2: number; y2: number; order: 1 | 2 | 3 }>;
  isomerHintAr: string;
  isomerHintEn: string;
}

const CHAIN_ROOTS_AR = ['', 'ميث', 'إيث', 'بروب', 'بيوت', 'بنت', 'هكس', 'هبت', 'أوكت'];
const CHAIN_ROOTS_EN = ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct'];

export function buildOrganicMolecule(
  groupId: OrganicFunctionalGroupDef['id'],
  carbons: number,
  funcPos: number,
  substituent: SubstituentType,
  subPos: number
): GeneratedOrganicMolecule {
  const safeC = Math.max(
    ORGANIC_FUNCTIONAL_GROUPS.find(g => g.id === groupId)?.minCarbons || 1,
    Math.min(8, carbons)
  );
  const clampedFuncPos = Math.max(1, Math.min(groupId === 'alkene' || groupId === 'alkyne' ? safeC - 1 : safeC, funcPos));
  const effectiveFuncPos = groupId === 'ketone' ? Math.max(2, Math.min(safeC - 1, clampedFuncPos)) : clampedFuncPos;
  const clampedSubPos = Math.max(1, Math.min(safeC, subPos));

  const rootAr = CHAIN_ROOTS_AR[safeC];
  const rootEn = CHAIN_ROOTS_EN[safeC];

  // Sub prefix
  let subPrefixAr = '';
  let subPrefixEn = '';
  if (substituent === 'methyl' && safeC >= 2) {
    subPrefixAr = `${clampedSubPos}-ميثيل `;
    subPrefixEn = `${clampedSubPos}-methyl`;
  } else if (substituent === 'chloro') {
    subPrefixAr = `${clampedSubPos}-كلورو `;
    subPrefixEn = `${clampedSubPos}-chloro`;
  } else if (substituent === 'bromo') {
    subPrefixAr = `${clampedSubPos}-برومو `;
    subPrefixEn = `${clampedSubPos}-bromo`;
  }

  let iupacAr = '';
  let iupacEn = '';
  let hybridization = 'sp³ (رباعي الأوجه ~109.5°)';

  if (groupId === 'alkane') {
    iupacAr = `${subPrefixAr}${rootAr}ان`;
    iupacEn = `${subPrefixEn}${rootEn}ane`;
  } else if (groupId === 'alkene') {
    const loc = safeC > 3 ? `${effectiveFuncPos}-` : '';
    iupacAr = `${subPrefixAr}${loc}${rootAr}ين`;
    iupacEn = `${subPrefixEn}${safeC > 3 ? `${rootEn}-${effectiveFuncPos}-ene` : `${rootEn}ene`}`;
    hybridization = 'sp² عند C=C (مثلثي مستوٍ 120°)';
  } else if (groupId === 'alkyne') {
    const loc = safeC > 3 ? `${effectiveFuncPos}-` : '';
    iupacAr = `${subPrefixAr}${loc}${rootAr}اين`;
    iupacEn = `${subPrefixEn}${safeC > 3 ? `${rootEn}-${effectiveFuncPos}-yne` : `${rootEn}yne`}`;
    hybridization = 'sp عند C≡C (خطي 180°)';
  } else if (groupId === 'alcohol') {
    const loc = safeC >= 3 ? `${effectiveFuncPos}-` : '';
    iupacAr = `${subPrefixAr}${loc}${rootAr}انول`;
    iupacEn = `${subPrefixEn}${safeC >= 3 ? `${rootEn}an-${effectiveFuncPos}-ol` : `${rootEn}anol`}`;
  } else if (groupId === 'aldehyde') {
    iupacAr = `${subPrefixAr}${rootAr}انال`;
    iupacEn = `${subPrefixEn}${rootEn}anal`;
    hybridization = 'sp² على مجموعة الكربونيل C=O';
  } else if (groupId === 'ketone') {
    const loc = safeC >= 5 ? `${effectiveFuncPos}-` : '';
    iupacAr = `${subPrefixAr}${loc}${rootAr}انون`;
    iupacEn = `${subPrefixEn}${safeC >= 5 ? `${rootEn}an-${effectiveFuncPos}-one` : `${rootEn}anone`}`;
    hybridization = 'sp² على مجموعة الكربونيل الداخلية C=O';
  } else if (groupId === 'carboxylic_acid') {
    iupacAr = `حمض ${subPrefixAr}${rootAr}انويك`;
    iupacEn = `${subPrefixEn}${rootEn}anoic acid`;
    hybridization = 'sp² على مجموعة الكربوكسيل –COOH';
  } else if (groupId === 'ester') {
    iupacAr = `${subPrefixAr}${rootAr}انوات الميثيل`;
    iupacEn = `methyl ${subPrefixEn}${rootEn}anoate`;
    hybridization = 'sp² على مجموعة الإستر –COO–';
  } else if (groupId === 'amine') {
    const loc = safeC >= 3 ? `${effectiveFuncPos}-` : '';
    iupacAr = `${subPrefixAr}${loc}${rootAr}انامين`;
    iupacEn = `${subPrefixEn}${safeC >= 3 ? `${rootEn}an-${effectiveFuncPos}-amine` : `${rootEn}anamine`}`;
  } else {
    iupacAr = `${subPrefixAr || `${effectiveFuncPos}-`}كلورو ${rootAr}ان`;
    iupacEn = `${subPrefixEn || `${effectiveFuncPos}-`}chloro${rootEn}ane`;
  }

  // Construct 3D coordinates & 2D coordinates along zigzag carbon backbone
  const atoms: GeneratedOrganicMolecule['atoms'] = [];
  const bonds: GeneratedOrganicMolecule['bonds'] = [];
  const atomLabels2D: GeneratedOrganicMolecule['atomLabels2D'] = [];
  const bonds2D: GeneratedOrganicMolecule['bonds2D'] = [];

  const stepX = 1.35;
  const startX = -((safeC - 1) * stepX) / 2;

  const carbonIndices: number[] = [];
  const countCounts: Record<string, number> = { C: 0, H: 0, O: 0, N: 0, Cl: 0, Br: 0 };

  // Place carbons
  for (let i = 0; i < safeC; i++) {
    const isLinearTriple =
      groupId === 'alkyne' && (i === effectiveFuncPos - 1 || i === effectiveFuncPos);
    const x = startX + i * stepX;
    const y = isLinearTriple ? 0 : (i % 2 === 0 ? 0.32 : -0.32);
    const z = 0;
    const idx = atoms.length;
    atoms.push({ element: 'C', position: [x, y, z], color: '#334155', radius: 0.52 });
    carbonIndices.push(idx);
    countCounts.C += 1;

    atomLabels2D.push({
      x: 60 + i * 52,
      y: 110 + (isLinearTriple ? 0 : (i % 2 === 0 ? -16 : 16)),
      text: 'C',
      color: '#cbd5e1'
    });

    if (i > 0) {
      let order: 1 | 2 | 3 = 1;
      if (groupId === 'alkene' && i === effectiveFuncPos) order = 2;
      if (groupId === 'alkyne' && i === effectiveFuncPos) order = 3;
      bonds.push({ from: carbonIndices[i - 1], to: idx, order });

      const prev2D = atomLabels2D[i - 1];
      const cur2D = atomLabels2D[i];
      bonds2D.push({ x1: prev2D.x, y1: prev2D.y, x2: cur2D.x, y2: cur2D.y, order });
    }
  }

  // Helper to attach atom to carbon i (0-indexed)
  const attachToCarbon = (
    cIdx: number,
    element: string,
    dx: number,
    dy: number,
    dz: number,
    color: string,
    radius: number,
    order: 1 | 2 | 3 = 1,
    dx2d = 0,
    dy2d = 0
  ) => {
    const parentPos = atoms[carbonIndices[cIdx]].position;
    const idx = atoms.length;
    atoms.push({
      element,
      position: [parentPos[0] + dx, parentPos[1] + dy, parentPos[2] + dz],
      color,
      radius
    });
    bonds.push({ from: carbonIndices[cIdx], to: idx, order });
    countCounts[element] = (countCounts[element] || 0) + 1;

    if (dx2d !== 0 || dy2d !== 0) {
      const c2d = atomLabels2D[cIdx];
      const tx = c2d.x + dx2d;
      const ty = c2d.y + dy2d;
      bonds2D.push({ x1: c2d.x, y1: c2d.y, x2: tx, y2: ty, order });
      atomLabels2D.push({ x: tx, y: ty, text: element, color, isHetero: element !== 'H' });
    }
    return idx;
  };

  // Attach functional group heteroatoms
  const targetCIdx =
    groupId === 'aldehyde' || groupId === 'carboxylic_acid' || groupId === 'ester'
      ? safeC - 1
      : Math.min(safeC - 1, Math.max(0, effectiveFuncPos - 1));

  if (groupId === 'alcohol') {
    const oIdx = attachToCarbon(targetCIdx, 'O', 0, 1.15, 0.35, '#ef4444', 0.48, 1, 0, -44);
    const oPos = atoms[oIdx].position;
    const hIdx = atoms.length;
    atoms.push({ element: 'H', position: [oPos[0] + 0.65, oPos[1] + 0.45, oPos[2]], color: '#f8fafc', radius: 0.34 });
    bonds.push({ from: oIdx, to: hIdx, order: 1 });
    countCounts.H += 1;
    const o2d = atomLabels2D[atomLabels2D.length - 1];
    bonds2D.push({ x1: o2d.x, y1: o2d.y, x2: o2d.x + 28, y2: o2d.y - 14, order: 1 });
    atomLabels2D.push({ x: o2d.x + 28, y: o2d.y - 14, text: 'H', color: '#38bdf8', isHetero: true });
  } else if (groupId === 'aldehyde' || groupId === 'ketone') {
    attachToCarbon(targetCIdx, 'O', 0, 1.25, 0, '#ef4444', 0.48, 2, 0, -46);
  } else if (groupId === 'carboxylic_acid') {
    attachToCarbon(targetCIdx, 'O', 0.25, 1.25, 0, '#ef4444', 0.48, 2, 10, -46);
    const o2 = attachToCarbon(targetCIdx, 'O', 1.1, -0.55, 0.2, '#ef4444', 0.48, 1, 44, 22);
    const oPos = atoms[o2].position;
    const hIdx = atoms.length;
    atoms.push({ element: 'H', position: [oPos[0] + 0.65, oPos[1] - 0.35, oPos[2]], color: '#f8fafc', radius: 0.34 });
    bonds.push({ from: o2, to: hIdx, order: 1 });
    countCounts.H += 1;
    const o2d = atomLabels2D[atomLabels2D.length - 1];
    bonds2D.push({ x1: o2d.x, y1: o2d.y, x2: o2d.x + 28, y2: o2d.y + 8, order: 1 });
    atomLabels2D.push({ x: o2d.x + 28, y: o2d.y + 8, text: 'H', color: '#38bdf8', isHetero: true });
  } else if (groupId === 'ester') {
    attachToCarbon(targetCIdx, 'O', 0.2, 1.25, 0, '#ef4444', 0.48, 2, 8, -46);
    const o2 = attachToCarbon(targetCIdx, 'O', 1.1, -0.45, 0, '#ef4444', 0.48, 1, 42, 20);
    const oPos = atoms[o2].position;
    const ch3CIdx = atoms.length;
    atoms.push({ element: 'C', position: [oPos[0] + 1.0, oPos[1] + 0.35, 0], color: '#334155', radius: 0.5 });
    bonds.push({ from: o2, to: ch3CIdx, order: 1 });
    countCounts.C += 1;
    const o2d = atomLabels2D[atomLabels2D.length - 1];
    bonds2D.push({ x1: o2d.x, y1: o2d.y, x2: o2d.x + 40, y2: o2d.y - 16, order: 1 });
    atomLabels2D.push({ x: o2d.x + 40, y: o2d.y - 16, text: 'CH₃', color: '#cbd5e1' });
    countCounts.H += 3;
  } else if (groupId === 'amine') {
    const nIdx = attachToCarbon(targetCIdx, 'N', 0, 1.2, 0.2, '#3b82f6', 0.5, 1, 0, -46);
    const nPos = atoms[nIdx].position;
    const h1 = atoms.length;
    atoms.push({ element: 'H', position: [nPos[0] - 0.55, nPos[1] + 0.55, 0.3], color: '#f8fafc', radius: 0.34 });
    const h2 = atoms.length;
    atoms.push({ element: 'H', position: [nPos[0] + 0.55, nPos[1] + 0.55, -0.3], color: '#f8fafc', radius: 0.34 });
    bonds.push({ from: nIdx, to: h1, order: 1 }, { from: nIdx, to: h2, order: 1 });
    countCounts.H += 2;
    const n2d = atomLabels2D[atomLabels2D.length - 1];
    n2d.text = 'NH₂';
  } else if (groupId === 'haloalkane') {
    attachToCarbon(targetCIdx, 'Cl', 0, 1.25, 0.25, '#22c55e', 0.55, 1, 0, -46);
  }

  // Substituent attachment
  const subCIdx = Math.min(safeC - 1, Math.max(0, clampedSubPos - 1));
  if (substituent === 'methyl' && safeC >= 2) {
    attachToCarbon(subCIdx, 'C', 0, -1.2, 0.45, '#475569', 0.5, 1, 0, 44);
    atomLabels2D[atomLabels2D.length - 1].text = 'CH₃';
    countCounts.H += 3;
  } else if (substituent === 'chloro') {
    attachToCarbon(subCIdx, 'Cl', 0, -1.2, 0.4, '#22c55e', 0.55, 1, 0, 44);
  } else if (substituent === 'bromo') {
    attachToCarbon(subCIdx, 'Br', 0, -1.25, 0.4, '#a855f7', 0.58, 1, 0, 44);
  }

  // Fill remaining valences on backbone carbons with 3D hydrogens so the 3D molecule looks physically complete!
  for (let i = 0; i < safeC; i++) {
    const cIdx = carbonIndices[i];
    const currentBondOrderSum = bonds
      .filter(b => b.from === cIdx || b.to === cIdx)
      .reduce((s, b) => s + b.order, 0);
    const neededH = Math.max(0, 4 - currentBondOrderSum);
    const cPos = atoms[cIdx].position;
    const hOffsets: [number, number, number][] = [
      [0, i % 2 === 0 ? 0.92 : -0.92, 0.65],
      [0, i % 2 === 0 ? 0.92 : -0.92, -0.65],
      [i === 0 ? -0.85 : 0.85, i % 2 === 0 ? -0.45 : 0.45, 0.2]
    ];
    for (let h = 0; h < neededH; h++) {
      const off = hOffsets[h % hOffsets.length];
      const hIdx = atoms.length;
      atoms.push({
        element: 'H',
        position: [cPos[0] + off[0], cPos[1] + off[1], cPos[2] + off[2]],
        color: '#f8fafc',
        radius: 0.34
      });
      bonds.push({ from: cIdx, to: hIdx, order: 1 });
      countCounts.H += 1;
    }
  }

  // Compute molecular formula & molar mass
  const subDigit = (n: number) =>
    n === 1 ? '' : String(n).replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]);
  const formula =
    `C${subDigit(countCounts.C)}H${subDigit(countCounts.H)}` +
    (countCounts.O ? `O${subDigit(countCounts.O)}` : '') +
    (countCounts.N ? `N${subDigit(countCounts.N)}` : '') +
    (countCounts.Cl ? `Cl${subDigit(countCounts.Cl)}` : '') +
    (countCounts.Br ? `Br${subDigit(countCounts.Br)}` : '');

  const molarMass =
    countCounts.C * 12.011 +
    countCounts.H * 1.008 +
    countCounts.O * 15.999 +
    countCounts.N * 14.007 +
    countCounts.Cl * 35.45 +
    countCounts.Br * 79.904;

  return {
    iupacAr,
    iupacEn,
    formula,
    molarMass: Number(molarMass.toFixed(2)),
    hybridization,
    atoms,
    bonds,
    atomLabels2D,
    bonds2D,
    isomerHintAr:
      groupId === 'aldehyde' && safeC >= 3
        ? `يتشارك الألدهيد في الصيغة الجزيئية مع الكيتون (${CHAIN_ROOTS_AR[safeC]}انون) — متشاكلان وظيفيان!`
        : groupId === 'carboxylic_acid' && safeC >= 2
        ? 'يتشارك الحمض الكربوكسيلي في الصيغة الجزيئية مع الإستر المقابل (متشاكلات وظيفية).'
        : groupId === 'alkene' && safeC >= 4
        ? 'تغيير موضع الرابطة الثنائية يعطي متشاكلات موضعية، وتُظهر الألكينات تشاكلاً هندسياً (cis / trans).'
        : 'جرّب تغيير رقم الموضع أو التفرع لمقارنة المتشاكلات البنائية والموضعية.',
    isomerHintEn:
      groupId === 'aldehyde' && safeC >= 3
        ? `Functional isomer of the corresponding ${safeC}-carbon ketone!`
        : groupId === 'carboxylic_acid' && safeC >= 2
        ? 'Carboxylic acids are functional isomers of esters with the same carbon count.'
        : groupId === 'alkene' && safeC >= 4
        ? 'Shifting C=C position yields positional isomers and supports cis/trans geometric isomerism.'
        : 'Try shifting the functional group locant or substituent position to explore structural isomers.'
  };
}

// =========================================================================
// REACTION KINETICS, EQUILIBRIUM & STOICHIOMETRY DATASETS
// =========================================================================

export interface EquilibriumReactionDef {
  id: string;
  equation: string;
  nameAr: string;
  nameEn: string;
  deltaHKj: number; // < 0 exothermic, > 0 endothermic
  kEq298: number;
  reactantCoeffs: number[]; // e.g., [1, 3] for N2 + 3H2
  productCoeffs: number[]; // e.g., [2] for 2NH3
  reactantNames: string[];
  productNames: string[];
  gasDeltaN: number; // sum(prod gas coeffs) - sum(reactant gas coeffs)
  reactantColor: string;
  productColor: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const EQUILIBRIUM_REACTIONS: EquilibriumReactionDef[] = [
  {
    id: 'haber_nh3',
    equation: 'N₂(g) + 3H₂(g) ⇌ 2NH₃(g)',
    nameAr: 'تصنيع الأمونيا (عملية هابر)',
    nameEn: 'Ammonia Synthesis (Haber Process)',
    deltaHKj: -92.4,
    kEq298: 4.5,
    reactantCoeffs: [1, 3],
    productCoeffs: [2],
    reactantNames: ['N₂', 'H₂'],
    productNames: ['NH₃'],
    gasDeltaN: -2,
    reactantColor: '#38bdf8',
    productColor: '#10b981',
    descriptionAr: 'تفاعل طارد للحرارة (ΔH = -92.4 kJ)؛ يقل عدد المولات الغازية من 4 إلى 2، لذا زيادة الضغط والتبريد يدفعان الاتزان للأمام.',
    descriptionEn: 'Exothermic reaction (ΔH = -92.4 kJ) reducing gas moles from 4 to 2; higher pressure and cooling shift forward.'
  },
  {
    id: 'no2_n2o4',
    equation: '2NO₂(g) [بني] ⇌ N₂O₄(g) [عديم اللون]',
    nameAr: 'اتزان ثاني أكسيد النيتروجين البني',
    nameEn: 'NO₂ / N₂O₄ Color Equilibrium',
    deltaHKj: -57.2,
    kEq298: 6.8,
    reactantCoeffs: [2],
    productCoeffs: [1],
    reactantNames: ['NO₂'],
    productNames: ['N₂O₄'],
    gasDeltaN: -1,
    reactantColor: '#c2410c',
    productColor: '#e2e8f0',
    descriptionAr: 'التسخين يزيد لون البني المحمر (NO₂) لأنه طارد للحرارة، بينما الضغط أو التبريد يميلان لتكوين N₂O₄ عديم اللون.',
    descriptionEn: 'Heating deepens the reddish-brown NO₂ color; cooling or higher pressure favors colorless N₂O₄.'
  },
  {
    id: 'hi_synthesis',
    equation: 'H₂(g) + I₂(g) ⇌ 2HI(g)',
    nameAr: 'تكوّن يوديد الهيدروجين',
    nameEn: 'Hydrogen Iodide Equilibrium',
    deltaHKj: +53.0,
    kEq298: 2.2,
    reactantCoeffs: [1, 1],
    productCoeffs: [2],
    reactantNames: ['H₂', 'I₂'],
    productNames: ['HI'],
    gasDeltaN: 0,
    reactantColor: '#a855f7',
    productColor: '#facc15',
    descriptionAr: 'عدد المولات الغازية متساوٍ في الطرفين (Δn = 0) فلا يتأثر موضع الاتزان بالضغط أو الحجم، بينما التسخين يزيح الاتزان نحو النواتج لكونه ماصاً.',
    descriptionEn: 'Equal gas moles on both sides (Δn = 0) so pressure does not shift equilibrium; endothermic heating shifts right.'
  },
  {
    id: 'fe_scn',
    equation: 'Fe³⁺(aq) + SCN⁻(aq) ⇌ [Fe(SCN)]²⁺(aq)',
    nameAr: 'أيّون ثيوسيانات الحديد III (الأحمر الدموي)',
    nameEn: 'Iron(III) Thiocyanate Complex',
    deltaHKj: -28.0,
    kEq298: 5.2,
    reactantCoeffs: [1, 1],
    productCoeffs: [1],
    reactantNames: ['Fe³⁺', 'SCN⁻'],
    productNames: ['[Fe(SCN)]²⁺'],
    gasDeltaN: 0,
    reactantColor: '#f59e0b',
    productColor: '#dc2626',
    descriptionAr: 'مثال محاليل مائية شهير في كيمياء مسارات؛ إضافة Fe³⁺ أو SCN⁻ تعمّق اللون الأحمر الدموي للناتج.',
    descriptionEn: 'Classic aqueous equilibrium; adding Fe³⁺ or SCN⁻ intensifies the deep blood-red complex.'
  }
];

export interface KineticsReactionDef {
  id: string;
  nameAr: string;
  nameEn: string;
  equation: string;
  eaUncatKj: number;
  eaCatKj: number;
  deltaHKj: number;
  orderA: number;
  orderB: number;
  baseK: number;
}

export const KINETICS_REACTIONS: KineticsReactionDef[] = [
  {
    id: 'h2_i2_kinetics',
    nameAr: 'تفاعل الهيدروجين واليود',
    nameEn: 'Hydrogen + Iodine Gas Reaction',
    equation: 'H₂(g) + I₂(g) → 2HI(g)',
    eaUncatKj: 165,
    eaCatKj: 95,
    deltaHKj: -10,
    orderA: 1,
    orderB: 1,
    baseK: 0.08
  },
  {
    id: 'no_o2_kinetics',
    nameAr: 'أكسدة أكسيد النيتريك (رتبة كلية 3)',
    nameEn: 'Nitric Oxide Oxidation (3rd Order)',
    equation: '2NO(g) + O₂(g) → 2NO₂(g)',
    eaUncatKj: 120,
    eaCatKj: 70,
    deltaHKj: -114,
    orderA: 2,
    orderB: 1,
    baseK: 0.14
  },
  {
    id: 'h2o2_decomp',
    nameAr: 'تفكك فوق أكسيد الهيدروجين بمحفز MnO₂',
    nameEn: 'H₂O₂ Decomposition with MnO₂ Catalyst',
    equation: '2H₂O₂(aq) → 2H₂O(l) + O₂(g)',
    eaUncatKj: 75,
    eaCatKj: 32,
    deltaHKj: -196,
    orderA: 1,
    orderB: 0,
    baseK: 0.18
  }
];

export interface StoichiometryReactionDef {
  id: string;
  nameAr: string;
  nameEn: string;
  equation: string;
  reactantA: { symbol: string; coeff: number; molarMass: number; color: string };
  reactantB: { symbol: string; coeff: number; molarMass: number; color: string };
  product: { symbol: string; coeff: number; molarMass: number; color: string };
  byproduct?: { symbol: string; coeff: number; molarMass: number };
}

export const STOICHIOMETRY_REACTIONS: StoichiometryReactionDef[] = [
  {
    id: 'water_synth',
    nameAr: 'تفاعل تكوّن الماء',
    nameEn: 'Water Synthesis',
    equation: '2H₂ + O₂ → 2H₂O',
    reactantA: { symbol: 'H₂', coeff: 2, molarMass: 2.016, color: '#f8fafc' },
    reactantB: { symbol: 'O₂', coeff: 1, molarMass: 32.0, color: '#ef4444' },
    product: { symbol: 'H₂O', coeff: 2, molarMass: 18.015, color: '#38bdf8' }
  },
  {
    id: 'haber_stoich',
    nameAr: 'تفاعل تكوّن الأمونيا',
    nameEn: 'Ammonia Formation',
    equation: 'N₂ + 3H₂ → 2NH₃',
    reactantA: { symbol: 'N₂', coeff: 1, molarMass: 28.014, color: '#3b82f6' },
    reactantB: { symbol: 'H₂', coeff: 3, molarMass: 2.016, color: '#f8fafc' },
    product: { symbol: 'NH₃', coeff: 2, molarMass: 17.031, color: '#10b981' }
  },
  {
    id: 'methane_comb',
    nameAr: 'احتراق الميثان الكامل',
    nameEn: 'Methane Combustion',
    equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    reactantA: { symbol: 'CH₄', coeff: 1, molarMass: 16.043, color: '#94a3b8' },
    reactantB: { symbol: 'O₂', coeff: 2, molarMass: 32.0, color: '#ef4444' },
    product: { symbol: 'CO₂', coeff: 1, molarMass: 44.01, color: '#f59e0b' },
    byproduct: { symbol: 'H₂O', coeff: 2, molarMass: 18.015 }
  },
  {
    id: 'fe_cl2',
    nameAr: 'تكوّن كلوريد الحديد III',
    nameEn: 'Iron(III) Chloride Synthesis',
    equation: '2Fe + 3Cl₂ → 2FeCl₃',
    reactantA: { symbol: 'Fe', coeff: 2, molarMass: 55.845, color: '#9ca3af' },
    reactantB: { symbol: 'Cl₂', coeff: 3, molarMass: 70.906, color: '#84cc16' },
    product: { symbol: 'FeCl₃', coeff: 2, molarMass: 162.2, color: '#a855f7' }
  }
];

// =========================================================================
// ELECTROCHEMISTRY HALF-CELLS & ELECTROLYSIS
// =========================================================================

export interface HalfCellElectrodeDef {
  id: string;
  metalSymbol: string;
  ionFormula: string;
  nameAr: string;
  nameEn: string;
  halfReaction: string;
  e0: number;
  nElectrons: number;
  molarMass: number;
  metalColor: string;
  solutionColor: string;
}

export const ELECTRODE_HALF_CELLS: HalfCellElectrodeDef[] = [
  { id: 'Li', metalSymbol: 'Li', ionFormula: 'Li⁺', nameAr: 'ليثيوم', nameEn: 'Lithium', halfReaction: 'Li⁺ + e⁻ → Li', e0: -3.04, nElectrons: 1, molarMass: 6.94, metalColor: '#cbd5e1', solutionColor: '#e0f2fe' },
  { id: 'Mg', metalSymbol: 'Mg', ionFormula: 'Mg²⁺', nameAr: 'ماغنسيوم', nameEn: 'Magnesium', halfReaction: 'Mg²⁺ + 2e⁻ → Mg', e0: -2.37, nElectrons: 2, molarMass: 24.305, metalColor: '#e2e8f0', solutionColor: '#e0f2fe' },
  { id: 'Al', metalSymbol: 'Al', ionFormula: 'Al³⁺', nameAr: 'ألومنيوم', nameEn: 'Aluminum', halfReaction: 'Al³⁺ + 3e⁻ → Al', e0: -1.66, nElectrons: 3, molarMass: 26.982, metalColor: '#d1d5db', solutionColor: '#f1f5f9' },
  { id: 'Zn', metalSymbol: 'Zn', ionFormula: 'Zn²⁺', nameAr: 'خارصين', nameEn: 'Zinc', halfReaction: 'Zn²⁺ + 2e⁻ → Zn', e0: -0.76, nElectrons: 2, molarMass: 65.38, metalColor: '#94a3b8', solutionColor: '#cbd5e1' },
  { id: 'Fe', metalSymbol: 'Fe', ionFormula: 'Fe²⁺', nameAr: 'حديد', nameEn: 'Iron', halfReaction: 'Fe²⁺ + 2e⁻ → Fe', e0: -0.44, nElectrons: 2, molarMass: 55.845, metalColor: '#64748b', solutionColor: '#86efac' },
  { id: 'Ni', metalSymbol: 'Ni', ionFormula: 'Ni²⁺', nameAr: 'نيكل', nameEn: 'Nickel', halfReaction: 'Ni²⁺ + 2e⁻ → Ni', e0: -0.25, nElectrons: 2, molarMass: 58.693, metalColor: '#a8a29e', solutionColor: '#34d399' },
  { id: 'Pb', metalSymbol: 'Pb', ionFormula: 'Pb²⁺', nameAr: 'رصاص', nameEn: 'Lead', halfReaction: 'Pb²⁺ + 2e⁻ → Pb', e0: -0.13, nElectrons: 2, molarMass: 207.2, metalColor: '#475569', solutionColor: '#e2e8f0' },
  { id: 'H2', metalSymbol: 'Pt (H₂)', ionFormula: 'H⁺', nameAr: 'الهيدروجين القياسي SHE', nameEn: 'Hydrogen (SHE)', halfReaction: '2H⁺ + 2e⁻ → H₂', e0: 0.0, nElectrons: 2, molarMass: 2.016, metalColor: '#f8fafc', solutionColor: '#bae6fd' },
  { id: 'Cu', metalSymbol: 'Cu', ionFormula: 'Cu²⁺', nameAr: 'نحاس', nameEn: 'Copper', halfReaction: 'Cu²⁺ + 2e⁻ → Cu', e0: +0.34, nElectrons: 2, molarMass: 63.546, metalColor: '#ea580c', solutionColor: '#0ea5e9' },
  { id: 'Ag', metalSymbol: 'Ag', ionFormula: 'Ag⁺', nameAr: 'فضة', nameEn: 'Silver', halfReaction: 'Ag⁺ + e⁻ → Ag', e0: +0.80, nElectrons: 1, molarMass: 107.868, metalColor: '#f1f5f9', solutionColor: '#e0f2fe' },
  { id: 'Au', metalSymbol: 'Au', ionFormula: 'Au³⁺', nameAr: 'ذهب', nameEn: 'Gold', halfReaction: 'Au³⁺ + 3e⁻ → Au', e0: +1.50, nElectrons: 3, molarMass: 196.967, metalColor: '#facc15', solutionColor: '#fef08a' }
];

export interface ElectrolysisElectrolyteDef {
  id: string;
  nameAr: string;
  nameEn: string;
  formula: string;
  cathodeProductAr: string;
  cathodeProductEn: string;
  anodeProductAr: string;
  anodeProductEn: string;
  cathodeReaction: string;
  anodeReaction: string;
  depositedMetalColor: string;
  cathodeMolarMass: number;
  nElectrons: number;
  minVoltage: number;
  hasCathodeGas: boolean;
  hasAnodeGas: boolean;
  solutionColor: string;
}

export const ELECTROLYSIS_ELECTROLYTES: ElectrolysisElectrolyteDef[] = [
  {
    id: 'cuso4_aq',
    nameAr: 'محلول كبريتات النحاس II (طلاء نحاسي)',
    nameEn: 'Aqueous CuSO₄ (Copper Electroplating)',
    formula: 'CuSO₄(aq)',
    cathodeProductAr: 'ترسّب فلز النحاس Cu الأحمر',
    cathodeProductEn: 'Red Metallic Cu Plating',
    anodeProductAr: 'تصاعد غاز الأكسجين O₂',
    anodeProductEn: 'Oxygen Gas O₂ Bubbles',
    cathodeReaction: 'Cu²⁺(aq) + 2e⁻ → Cu(s)',
    anodeReaction: '2H₂O(l) → O₂(g) + 4H⁺(aq) + 4e⁻',
    depositedMetalColor: '#ea580c',
    cathodeMolarMass: 63.546,
    nElectrons: 2,
    minVoltage: 1.25,
    hasCathodeGas: false,
    hasAnodeGas: true,
    solutionColor: '#0284c7'
  },
  {
    id: 'agno3_aq',
    nameAr: 'محلول نترات الفضة (طلاء بالفضة)',
    nameEn: 'Aqueous AgNO₃ (Silver Plating)',
    formula: 'AgNO₃(aq)',
    cathodeProductAr: 'طلاء فضي لامع Ag',
    cathodeProductEn: 'Bright Silver Plating Ag',
    anodeProductAr: 'تصاعد غاز الأكسجين O₂',
    anodeProductEn: 'Oxygen Gas O₂ Bubbles',
    cathodeReaction: 'Ag⁺(aq) + e⁻ → Ag(s)',
    anodeReaction: '2H₂O(l) → O₂(g) + 4H⁺ + 4e⁻',
    depositedMetalColor: '#e2e8f0',
    cathodeMolarMass: 107.868,
    nElectrons: 1,
    minVoltage: 0.9,
    hasCathodeGas: false,
    hasAnodeGas: true,
    solutionColor: '#bae6fd'
  },
  {
    id: 'nacl_aq',
    nameAr: 'محلول كلوريد الصوديوم المركز (تحليل ماء البحر)',
    nameEn: 'Concentrated NaCl(aq) (Brine Electrolysis)',
    formula: 'NaCl(aq)',
    cathodeProductAr: 'غاز الهيدروجين H₂ + وسط قاعدي NaOH',
    cathodeProductEn: 'H₂ Gas Bubbles + NaOH(aq)',
    anodeProductAr: 'غاز الكلور Cl₂ المصفر',
    anodeProductEn: 'Chlorine Gas Cl₂',
    cathodeReaction: '2H₂O + 2e⁻ → H₂(g) + 2OH⁻',
    anodeReaction: '2Cl⁻(aq) → Cl₂(g) + 2e⁻',
    depositedMetalColor: '#94a3b8',
    cathodeMolarMass: 2.016,
    nElectrons: 2,
    minVoltage: 2.2,
    hasCathodeGas: true,
    hasAnodeGas: true,
    solutionColor: '#38bdf8'
  },
  {
    id: 'nacl_molten',
    nameAr: 'مصهور كلوريد الصوديوم (خلية داون)',
    nameEn: 'Molten NaCl (Downs Cell)',
    formula: 'NaCl(l)',
    cathodeProductAr: 'فلز الصوديوم المنصهر Na',
    cathodeProductEn: 'Molten Sodium Metal Na',
    anodeProductAr: 'غاز الكلور Cl₂',
    anodeProductEn: 'Chlorine Gas Cl₂',
    cathodeReaction: 'Na⁺(l) + e⁻ → Na(l)',
    anodeReaction: '2Cl⁻(l) → Cl₂(g) + 2e⁻',
    depositedMetalColor: '#cbd5e1',
    cathodeMolarMass: 22.99,
    nElectrons: 1,
    minVoltage: 4.1,
    hasCathodeGas: false,
    hasAnodeGas: true,
    solutionColor: '#fb923c'
  },
  {
    id: 'h2o_acid',
    nameAr: 'التحليل الكهربائي للماء المحمّض (جهاز هوفمان)',
    nameEn: 'Acidified Water Electrolysis (H₂ : O₂ = 2:1)',
    formula: 'H₂O / H₂SO₄',
    cathodeProductAr: 'غاز الهيدروجين H₂ (حجم 2×)',
    cathodeProductEn: 'Hydrogen Gas H₂ (2x Volume)',
    anodeProductAr: 'غاز الأكسجين O₂ (حجم 1×)',
    anodeProductEn: 'Oxygen Gas O₂ (1x Volume)',
    cathodeReaction: '4H⁺ + 4e⁻ → 2H₂(g)',
    anodeReaction: '2H₂O → O₂(g) + 4H⁺ + 4e⁻',
    depositedMetalColor: '#cbd5e1',
    cathodeMolarMass: 2.016,
    nElectrons: 2,
    minVoltage: 1.5,
    hasCathodeGas: true,
    hasAnodeGas: true,
    solutionColor: '#7dd3fc'
  }
];
