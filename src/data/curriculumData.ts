/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Comprehensive Scientific Reference & Curriculum Data for Chemistry 3 (Secondary Education - Pathways System)
 * بيانات ومرجع كيمياء 3 (المسارات) - يتضمن الفصول الأربعة، القوانين والمعادلات، جدول جهود الاختزال،
 * مسرد المصطلحات الوزارية المعتمدة (صفحات 170-175)، والتجارب المخبرية الـ 14 كاملة.
 */

export interface ChemicalTerm {
  termAr: string;
  termEn: string;
  definitionAr: string;
  definitionEn: string;
  chapter: number; // 1, 2, 3, 4
  category: 'solutions' | 'acids_bases' | 'redox' | 'electrochem' | 'general';
}

export interface ReductionPotential {
  halfReaction: string;
  species: string;
  e0: number; // Volts
}

export interface ChemicalLaw {
  id: string;
  nameAr: string;
  nameEn: string;
  formula: string;
  descriptionAr: string;
  descriptionEn: string;
  chapter: number;
  calculatorType: 'ph' | 'cell_potential' | 'henry' | 'dilution' | 'colligative' | 'molarity';
}

export interface TextbookExperiment {
  id: string;
  titleAr: string;
  titleEn: string;
  chapter: number;
  page: number;
  type: 'introductory' | 'quick_lab' | 'data_analysis' | 'main_lab' | 'field';
  objectiveAr: string;
  objectiveEn: string;
  safetyAlertAr: string;
  materialsAr: string[];
  stepsAr: string[];
  chemicalExplanationAr: string;
  balancedEquation: string;
  presetReagents: string[];
}

// 1. مسرد المصطلحات الرسمية المعتمدة من الكتاب (صفحات 170 - 175)
export const OFFICIAL_GLOSSARY: ChemicalTerm[] = [
  {
    termAr: 'الاختزال',
    termEn: 'Reduction',
    definitionAr: 'اكتساب ذرات المادة للإلكترونات، ويصاحبه نقصان في عدد التأكسد.',
    definitionEn: 'Gain of electrons by atoms of a substance, accompanied by a decrease in oxidation number.',
    chapter: 3,
    category: 'redox'
  },
  {
    termAr: 'الأكسدة',
    termEn: 'Oxidation',
    definitionAr: 'فقدان ذرات المادة للإلكترونات، ويصاحبه زيادة في عدد التأكسد.',
    definitionEn: 'Loss of electrons by atoms of a substance, accompanied by an increase in oxidation number.',
    chapter: 3,
    category: 'redox'
  },
  {
    termAr: 'العامل المؤكسد',
    termEn: 'Oxidizing Agent',
    definitionAr: 'المادة التي تقوم بأكسدة مادة أخرى من خلال اكتساب ذراتها للإلكترونات (المادة التي تُختزل).',
    definitionEn: 'Substance that oxidizes another substance by gaining electrons (the substance that is reduced).',
    chapter: 3,
    category: 'redox'
  },
  {
    termAr: 'العامل المختزل',
    termEn: 'Reducing Agent',
    definitionAr: 'المادة التي تقوم باختزال مادة أخرى من خلال فقدان ذراتها للإلكترونات (المادة التي تتأكسد).',
    definitionEn: 'Substance that reduces another substance by losing electrons (the substance that is oxidized).',
    chapter: 3,
    category: 'redox'
  },
  {
    termAr: 'طريقة عدد التأكسد',
    termEn: 'Oxidation-Number Method',
    definitionAr: 'طريقة لموازنة معادلات الأكسدة والاختزال تعتمد على مساواة مجموع الزيادة في أعداد التأكسد بمجموع الانخفاض فيها.',
    definitionEn: 'Method for balancing redox equations based on equating total increase and total decrease in oxidation numbers.',
    chapter: 3,
    category: 'redox'
  },
  {
    termAr: 'نصف التفاعل',
    termEn: 'Half Reaction',
    definitionAr: 'أحد جزأي تفاعل الأكسدة والاختزال؛ إما تفاعل التأكسد وحده أو تفاعل الاختزال وحده متضمناً الإلكترونات.',
    definitionEn: 'One of the two parts of a redox reaction; either the oxidation reaction or reduction reaction with electrons.',
    chapter: 3,
    category: 'redox'
  },
  {
    termAr: 'الأنود (المصعد)',
    termEn: 'Anode',
    definitionAr: 'القطب الذي يحدث عنده تفاعل الأكسدة دائماً في الخلية الكهروكيميائية وتتدفق منه الإلكترونات.',
    definitionEn: 'Electrode where oxidation occurs in an electrochemical cell, and from which electrons flow.',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'الكاثود (المهبط)',
    termEn: 'Cathode',
    definitionAr: 'القطب الذي يحدث عنده تفاعل الاختزال دائماً في الخلية الكهروكيميائية وتتدفق إليه الإلكترونات.',
    definitionEn: 'Electrode where reduction occurs in an electrochemical cell, and toward which electrons flow.',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'القنطرة الملحية',
    termEn: 'Salt Bridge',
    definitionAr: 'ممر أنبوبي يحتوي على محلول إلكتروليتي يسمح بتدفق الأيونات بين نصفي الخلية لمنع تراكم الشحنات دون اختلاط المحلولين.',
    definitionEn: 'Tube containing an electrolyte allowing ion flow between half-cells to prevent charge buildup without mixing solutions.',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'الخلية الجلفانية (الفولتية)',
    termEn: 'Voltaic / Galvanic Cell',
    definitionAr: 'نوع من الخلايا الكهروكيميائية يحوّل الطاقة الكيميائية إلى طاقة كهربائية بواسطة تفاعل أكسدة واختزال تلقائي.',
    definitionEn: 'Electrochemical cell converting chemical energy into electrical energy via spontaneous redox reaction.',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'خلية التحليل الكهربائي',
    termEn: 'Electrolytic Cell',
    definitionAr: 'خلية كهروكيميائية تستخدم الطاقة الكهربائية لإحداث تفاعل كيميائي غير تلقائي (مثل طلاء الفلزات واستخلاص الألومنيوم).',
    definitionEn: 'Electrochemical cell using electrical energy to force a non-spontaneous chemical reaction (such as electroplating).',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'جهد الاختزال القياسي',
    termEn: 'Standard Reduction Potential',
    definitionAr: 'مقياس قابلية المادة لاكتساب الإلكترونات مقارنة بقطب الهيدروجين القياسي عند ظروف 25°C و 1 atm و 1M.',
    definitionEn: 'Measure of tendency of a substance to gain electrons relative to standard hydrogen electrode at 25°C, 1 atm, 1M.',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'قطب الهيدروجين القياسي',
    termEn: 'Standard Hydrogen Electrode (SHE)',
    definitionAr: 'قطب مرجعي يتكون من صفيحة بلاتين في محلول حمض 1M يُضخ فيه غاز H₂ بضغط 1atm، وجهده الاختزالي يساوي 0.000 V.',
    definitionEn: 'Reference electrode of platinum in 1M acid solution with H₂ gas bubbled at 1 atm; standard potential is defined as 0.000 V.',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'البطارية الأولية',
    termEn: 'Primary Battery',
    definitionAr: 'بطارية تنتج طاقة كهربائية من تفاعل أكسدة واختزال لا يحدث بشكل عكسي بسهولة، وتُرمى بعد نفادها.',
    definitionEn: 'Battery producing electricity via non-easily reversible redox reactions, disposed of after single discharge.',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'البطارية الثانوية',
    termEn: 'Secondary Battery',
    definitionAr: 'بطارية تعتمد على تفاعل أكسدة واختزال عكسي يمكن إعادة شحنها بتمرير تيار في الاتجاه المعاكس (مثل مركم الرصاص والـ Li-ion).',
    definitionEn: 'Rechargeable battery based on reversible redox reactions, recharged by driving electric current in reverse.',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'خلية الوقود',
    termEn: 'Fuel Cell',
    definitionAr: 'خلية جلفانية تنتج الطاقة الكهربائية من أكسدة وقود يتم تزويده باستمرار من مصدر خارجي (مثل خلية هيدروجين-أكسجين).',
    definitionEn: 'Galvanic cell generating electricity from the oxidation of continuously supplied external fuel (e.g. H₂/O₂).',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'التآكل',
    termEn: 'Corrosion',
    definitionAr: 'خسارة الفلز وتلفه الناتج عن تفاعل أكسدة واختزال كيميائي بين الفلز والمواد المحيطة به في البيئة كالماء والأكسجين (مثل الصدأ).',
    definitionEn: 'Degradation of metal resulting from redox reaction with environmental substances like moisture and oxygen (rust).',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'الجلفنة',
    termEn: 'Galvanization',
    definitionAr: 'تغليف الحديد بفلز أكثر مقاومة للتأكسد (مثل غمسه بمصهور الخارصين Zn) لحمايته من الصدأ بحاجز ميكانيكي وكاثودي.',
    definitionEn: 'Coating iron with a more corrosion-resistant metal (like zinc) to protect against rusting.',
    chapter: 4,
    category: 'electrochem'
  },
  {
    termAr: 'حمض أرهينيوس',
    termEn: 'Arrhenius Acid',
    definitionAr: 'مادة كيميائية تحتوي على الهيدروجين وتتأين في المحاليل المائية منتجة أيونات الهيدروجين (+H).',
    definitionEn: 'Substance containing hydrogen that ionizes in water to yield hydrogen ions (H+).',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'قاعدة أرهينيوس',
    termEn: 'Arrhenius Base',
    definitionAr: 'مادة كيميائية تحتوي على مجموعة الهيدروكسيد وتتفكك في المحلول المائي منتجة أيون الهيدروكسيد (-OH).',
    definitionEn: 'Substance containing hydroxide that dissociates in water to yield hydroxide ions (OH-).',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'حمض برونستد - لوري',
    termEn: 'Brønsted-Lowry Acid',
    definitionAr: 'مادة (أيون أو جزيء) قادرة على منح أيون هيدروجين (بروتون +H) لمادة أخرى أثناء التفاعل.',
    definitionEn: 'Molecule or ion capable of donating a hydrogen ion (proton, H+) to another substance.',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'قاعدة برونستد - لوري',
    termEn: 'Brønsted-Lowry Base',
    definitionAr: 'مادة (أيون أو جزيء) قادرة على استقبال أيون هيدروجين (بروتون +H) من مادة أخرى أثناء التفاعل.',
    definitionEn: 'Molecule or ion capable of accepting a hydrogen ion (proton, H+) from another substance.',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'حمض وقاعدة لويس',
    termEn: 'Lewis Acid & Base',
    definitionAr: 'حمض لويس هو مادة تستقبل زوجاً من الإلكترونات بمدار فارغ، بينما قاعدة لويس تمنح زوجاً من الإلكترونات الحرة.',
    definitionEn: 'Lewis acid accepts an electron pair into an empty orbital; Lewis base donates an electron pair.',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'الأزواج المترافقة',
    termEn: 'Conjugate Pairs',
    definitionAr: 'مادتان ترتبطان معاً عن طريق منح واستقبال بروتون واحد؛ الحمض يمنح فيصبح قاعدة مرافقة، والقاعدة تكتسب فتصبح حمضاً مرافقاً.',
    definitionEn: 'Two substances related by the loss or gain of a single proton; acid loses H+ to become conjugate base.',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'المادة المترددة (أمفوتيرية)',
    termEn: 'Amphoteric Substance',
    definitionAr: 'مادة تسلك سلوك الحمض أو القاعدة حسب طبيعة الوسط المتفاعل معها (مثل الماء H₂O وأيون HCO₃⁻).',
    definitionEn: 'Substance capable of acting as either an acid or a base depending on the reacting environment (e.g. H₂O).',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'الرقم الهيدروجيني (pH)',
    termEn: 'pH (Hydrogen Ion Exponent)',
    definitionAr: 'سالب اللوغاريتم العشري لتركيز أيون الهيدروجين في المحلول: pH = -log[H+]. يحدد حمضية المحلول (أقل من 7 حمضي، أعلى قاعدي).',
    definitionEn: 'Negative base-10 logarithm of hydrogen ion concentration: pH = -log[H+]. Indicates acidity/basicity.',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'الرقم الهيدروكسيدي (pOH)',
    termEn: 'pOH (Hydroxide Ion Exponent)',
    definitionAr: 'سالب اللوغاريتم العشري لتركيز أيون الهيدروكسيد في المحلول: pOH = -log[OH-]. ومجموع pH + pOH = 14 عند 298 K.',
    definitionEn: 'Negative base-10 logarithm of hydroxide concentration: pOH = -log[OH-]. pH + pOH = 14 at 298 K.',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'ثابت تأين الماء (Kw)',
    termEn: 'Water Ion Product Constant (Kw)',
    definitionAr: 'حاصل ضرب تراكيز أيون الهيدروجين وأيون الهيدروكسيد في الماء النقي أو المحاليل المخففة، ويساوي 1.0 × 10⁻¹⁴ عند 298 K.',
    definitionEn: 'Product of [H+] and [OH-] in aqueous solutions, equal to 1.0 × 10⁻¹⁴ at 298 K.',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'المعايرة الحجمية',
    termEn: 'Titration',
    definitionAr: 'طريقة مخبرية كيميائية لتحديد تركيز محلول مجهول بتفاعله مع حجم مقاس بدقة من محلول قياسي معلوم التركيز.',
    definitionEn: 'Laboratory procedure to determine unknown concentration by reacting with precisely measured standard solution.',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'نقطة التكافؤ',
    termEn: 'Equivalence Point',
    definitionAr: 'النقطة التي يتساوى عندها عدد مولات أيونات H+ من الحمض تماماً مع عدد مولات أيونات OH- من القاعدة في المعايرة.',
    definitionEn: 'Point in titration where moles of H+ from acid exactly equal moles of OH- from base.',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'نقطة النهاية',
    termEn: 'End Point',
    definitionAr: 'النقطة التجريبية التي يتغير عندها لون الكاشف المستخدم في المعايرة مشيراً إلى اكتمال التفاعل.',
    definitionEn: 'The point in titration where the chemical indicator changes color, signaling reaction completion.',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'المحلول المنظم',
    termEn: 'Buffered Solution',
    definitionAr: 'محلول يقاوم التغيرات الحادة في الرقم الهيدروجيني (pH) عند إضافة كميات محدودة من حمض أو قاعدة، ويتكون من حمض ضعيف وقاعدته المرافقة.',
    definitionEn: 'Solution resisting drastic pH changes upon addition of small amounts of acid or base (weak acid + conjugate base).',
    chapter: 2,
    category: 'acids_bases'
  },
  {
    termAr: 'المخلوط المعلق',
    termEn: 'Suspension',
    definitionAr: 'مخلوط غير متجانس يحتوي على جسيمات كبيرة نسبياً يمكن أن تترسب بالترويق إذا تُرِكت دون تحريك، وتُفصل بالترشيح.',
    definitionEn: 'Heterogeneous mixture containing large particles that settle out upon standing and can be filtered.',
    chapter: 1,
    category: 'solutions'
  },
  {
    termAr: 'المخلوط الغروي',
    termEn: 'Colloid',
    definitionAr: 'مخلوط غير متجانس يتكون من جسيمات متوسطة الحجم (بين 1 nm و 1000 nm) تمنعها الطبقات الكهروستاتيكية من الترسب.',
    definitionEn: 'Heterogeneous mixture with medium particles (1-1000 nm) that stay suspended due to electrostatic charges.',
    chapter: 1,
    category: 'solutions'
  },
  {
    termAr: 'تأثير تندال',
    termEn: 'Tyndall Effect',
    definitionAr: 'ظاهرة تشتيت الضوء عند مروره خلال مخلوط غروي أو معلق بسبب اصطدامه بالجسيمات المنتشرة، ويستعمل للتمييز عن المحاليل الحقيقية.',
    definitionEn: 'Scattering of light as a beam passes through a colloid or suspension, differentiating it from true solutions.',
    chapter: 1,
    category: 'solutions'
  },
  {
    termAr: 'الحركة البراونية',
    termEn: 'Brownian Motion',
    definitionAr: 'حركة عشوائية عنيفة ومستمرة لجسيمات المذاب في المخاليط الغروية ناتجة عن تصادمها بجزيئات وسط الانتشار، تمنع ترسبها.',
    definitionEn: 'Erratic continuous movement of colloidal particles caused by collisions with dispersing medium particles.',
    chapter: 1,
    category: 'solutions'
  },
  {
    termAr: 'قانون هنري',
    termEn: 'Henry\'s Law',
    definitionAr: 'تتناسب ذائبية غاز في سائل (S) تناسباً طردياً مع ضغط الغاز (P) الموجود فوق السائل عند ثبوت درجة الحرارة: S1 / P1 = S2 / P2.',
    definitionEn: 'Solubility of a gas in a liquid is directly proportional to gas pressure above the liquid: S1/P1 = S2/P2.',
    chapter: 1,
    category: 'solutions'
  },
  {
    termAr: 'الخواص الجامعة للمحاليل',
    termEn: 'Colligative Properties',
    definitionAr: 'خواص فيزيائية للمحاليل تعتمد فقط على عدد جسيمات المذاب في حجم معين وليس على طبيعة المادة المذابة نفسها.',
    definitionEn: 'Physical properties of solutions that depend solely on number of solute particles, not their identity.',
    chapter: 1,
    category: 'solutions'
  },
  {
    termAr: 'الضغط الأسموزي',
    termEn: 'Osmotic Pressure',
    definitionAr: 'كمية الضغط الإضافي الناتج عن انتشار وانتقال جزيئات المذيب (الماء) عبر غشاء شبه منفذ نحو المحلول الأكثر تركيزاً.',
    definitionEn: 'Additional pressure produced by the diffusion of solvent molecules through a semipermeable membrane.',
    chapter: 1,
    category: 'solutions'
  }
];

// 2. جدول جهود الاختزال القياسية المعتمد من الكتاب (جدول 4-1 صفحة 138)
export const STANDARD_REDUCTION_POTENTIALS: ReductionPotential[] = [
  { halfReaction: 'F₂ + 2e⁻ → 2F⁻', species: 'الفلور (F₂/F⁻)', e0: 2.866 },
  { halfReaction: 'S₂O₈²⁻ + 2e⁻ → 2SO₄²⁻', species: 'فوق كبريتات (S₂O₈²⁻)', e0: 2.010 },
  { halfReaction: 'Co³⁺ + e⁻ → Co²⁺', species: 'الكوبالت (Co³⁺/Co²⁺)', e0: 1.92 },
  { halfReaction: 'H₂O₂ + 2H⁺ + 2e⁻ → 2H₂O', species: 'فوق أكسيد الهيدروجين', e0: 1.776 },
  { halfReaction: 'Au⁺ + e⁻ → Au', species: 'الذهب (Au⁺/Au)', e0: 1.692 },
  { halfReaction: 'MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O', species: 'البرمنغنات (MnO₄⁻)', e0: 1.507 },
  { halfReaction: 'Au³⁺ + 3e⁻ → Au', species: 'الذهب (Au³⁺/Au)', e0: 1.498 },
  { halfReaction: 'Cl₂ + 2e⁻ → 2Cl⁻', species: 'الكلور (Cl₂/Cl⁻)', e0: 1.358 },
  { halfReaction: 'O₂ + 4H⁺ + 4e⁻ → 2H₂O', species: 'الأكسجين في وسط حمضي', e0: 1.229 },
  { halfReaction: 'Pt²⁺ + 2e⁻ → Pt', species: 'البلاتين (Pt²⁺/Pt)', e0: 1.18 },
  { halfReaction: 'Br₂ + 2e⁻ → 2Br⁻', species: 'البروم (Br₂/Br⁻)', e0: 1.066 },
  { halfReaction: 'NO₃⁻ + 4H⁺ + 3e⁻ → NO + 2H₂O', species: 'النترات (NO₃⁻)', e0: 0.957 },
  { halfReaction: '2Hg²⁺ + 2e⁻ → Hg₂²⁺', species: 'الزئبق (Hg²⁺)', e0: 0.920 },
  { halfReaction: 'Ag⁺ + e⁻ → Ag', species: 'الفضة (Ag⁺/Ag)', e0: 0.7996 },
  { halfReaction: 'Fe³⁺ + e⁻ → Fe²⁺', species: 'الحديد (Fe³⁺/Fe²⁺)', e0: 0.771 },
  { halfReaction: 'I₂ + 2e⁻ → 2I⁻', species: 'اليود (I₂/I⁻)', e0: 0.5355 },
  { halfReaction: 'Cu²⁺ + 2e⁻ → Cu', species: 'النحاس (Cu²⁺/Cu)', e0: 0.3419 },
  { halfReaction: 'Cu²⁺ + e⁻ → Cu⁺', species: 'النحاس (Cu²⁺/Cu⁺)', e0: 0.153 },
  { halfReaction: '2H⁺ + 2e⁻ → H₂', species: 'الهيدروجين القياسي (SHE)', e0: 0.000 },
  { halfReaction: 'Fe³⁺ + 3e⁻ → Fe', species: 'الحديد (Fe³⁺/Fe)', e0: -0.037 },
  { halfReaction: 'Pb²⁺ + 2e⁻ → Pb', species: 'الرصاص (Pb²⁺/Pb)', e0: -0.1262 },
  { halfReaction: 'Sn²⁺ + 2e⁻ → Sn', species: 'القصدير (Sn²⁺/Sn)', e0: -0.1375 },
  { halfReaction: 'Ni²⁺ + 2e⁻ → Ni', species: 'النيكل (Ni²⁺/Ni)', e0: -0.257 },
  { halfReaction: 'Co²⁺ + 2e⁻ → Co', species: 'الكوبالت (Co²⁺/Co)', e0: -0.28 },
  { halfReaction: 'PbSO₄ + 2e⁻ → Pb + SO₄²⁻', species: 'كبريتات الرصاص (مركم)', e0: -0.3588 },
  { halfReaction: 'Cd²⁺ + 2e⁻ → Cd', species: 'الكادميوم (Cd²⁺/Cd)', e0: -0.4030 },
  { halfReaction: 'Fe²⁺ + 2e⁻ → Fe', species: 'الحديد (Fe²⁺/Fe)', e0: -0.447 },
  { halfReaction: 'Cr³⁺ + 3e⁻ → Cr', species: 'الكروم (Cr³⁺/Cr)', e0: -0.744 },
  { halfReaction: 'Zn²⁺ + 2e⁻ → Zn', species: 'الخارصين (Zn²⁺/Zn)', e0: -0.7618 },
  { halfReaction: '2H₂O + 2e⁻ → H₂ + 2OH⁻', species: 'الماء في وسط قاعدي', e0: -0.8277 },
  { halfReaction: 'Mn²⁺ + 2e⁻ → Mn', species: 'المنجنيز (Mn²⁺/Mn)', e0: -1.185 },
  { halfReaction: 'Al³⁺ + 3e⁻ → Al', species: 'الألومنيوم (Al³⁺/Al)', e0: -1.662 },
  { halfReaction: 'Mg²⁺ + 2e⁻ → Mg', species: 'الماغنسيوم (Mg²⁺/Mg)', e0: -2.372 },
  { halfReaction: 'Na⁺ + e⁻ → Na', species: 'الصوديوم (Na⁺/Na)', e0: -2.71 },
  { halfReaction: 'Ca²⁺ + 2e⁻ → Ca', species: 'الكالسيوم (Ca²⁺/Ca)', e0: -2.868 },
  { halfReaction: 'Li⁺ + e⁻ → Li', species: 'الليثيوم (Li⁺/Li)', e0: -3.0401 }
];

// 3. القوانين الكيميائية والمعادلات الرياضية للمنهج
export const CURRICULUM_LAWS: ChemicalLaw[] = [
  {
    id: 'ph_calc',
    nameAr: 'حساب الرقم الهيدروجيني والهيدروكسيدي',
    nameEn: 'pH and pOH Calculation',
    formula: 'pH = -log[H⁺]  |  pOH = -log[OH⁻]  |  pH + pOH = 14',
    descriptionAr: 'حساب تركيز أيونات الهيدروجين والهيدروكسيل، وثابت تأين الماء Kw = 1.0 × 10⁻¹⁴، وتحديد طبيعة المحلول (حمضي/متعادل/قاعدي).',
    descriptionEn: 'Compute [H+], [OH-], pH, pOH, and Kw self-ionization relation.',
    chapter: 2,
    calculatorType: 'ph'
  },
  {
    id: 'cell_potential',
    nameAr: 'جهد الخلية الجلفانية القياسي',
    nameEn: 'Standard Cell Potential',
    formula: 'E°cell = E°cathode - E°anode',
    descriptionAr: 'حساب القوة الدافعة الكهربائية للخلية بفارق جهدي الاختزال لنصفي التفاعل، وتحديد هل التفاعل الكلي تلقائي (E° > 0).',
    descriptionEn: 'Calculate electromotive force of galvanic cell and determine spontaneity.',
    chapter: 4,
    calculatorType: 'cell_potential'
  },
  {
    id: 'henry_law',
    nameAr: 'قانون هنري لذائبية الغازات',
    nameEn: 'Henry\'s Law for Gas Solubility',
    formula: 'S₁ / P₁ = S₂ / P₂',
    descriptionAr: 'حساب ذائبية الغاز في السائل عند تغير الضغط الواقع عليه بثبوت درجة الحرارة (مثل تحرر غاز CO₂ عند فتح علبة الصودا).',
    descriptionEn: 'Calculate gas solubility changes under pressure variations at constant temperature.',
    chapter: 1,
    calculatorType: 'henry'
  },
  {
    id: 'dilution_law',
    nameAr: 'معادلة التخفيف للمحاليل القياسية',
    nameEn: 'Solution Dilution Equation',
    formula: 'M₁ · V₁ = M₂ · V₂',
    descriptionAr: 'حساب الحجم المطلوب من المحلول المركز أو التركيز الجديد بعد إضافة المذيب مع ثبات عدد مولات المذاب قبل وبعد التخفيف.',
    descriptionEn: 'Calculate volume or molarity when preparing dilute solutions from stock standards.',
    chapter: 1,
    calculatorType: 'dilution'
  },
  {
    id: 'colligative_law',
    nameAr: 'الخواص الجامعة (الارتفاع بالغليان والانخفاض بالتجمد)',
    nameEn: 'Colligative Elevation & Depression',
    formula: 'ΔTb = Kb · m · i  |  ΔTf = Kf · m · i',
    descriptionAr: 'حساب مقدار تغير درجتي الغليان والتجمد بدلالة المولالية m وثابتي الغليان والتجمد ومعامل فانت هوف i لعدد الأيونات.',
    descriptionEn: 'Calculate boiling point elevation and freezing point depression based on molality.',
    chapter: 1,
    calculatorType: 'colligative'
  },
  {
    id: 'molarity_molality',
    nameAr: 'المولارية والمولالية والنسب المئوية',
    nameEn: 'Molarity, Molality & Mass %',
    formula: 'M = n / V(L)  |  m = n / kg(solvent)  |  % = (m_solute / m_soln) × 100',
    descriptionAr: 'حساب التراكيز الكيميائية بدلالة المولات لكل لتر، أو المولات لكل كيلوغرام من المذيب، أو النسبة المئوية بالكتلة والحجم.',
    descriptionEn: 'Calculate chemical concentration expressions in molarity, molality, or mass/volume percent.',
    chapter: 1,
    calculatorType: 'molarity'
  }
];

// 4. التجارب الـ 14 المعتمدة الكاملة من كتاب كيمياء 3
export const TEXTBOOK_EXPERIMENTS: TextbookExperiment[] = [
  {
    id: 'exp_solvation_energy',
    titleAr: 'تغير الطاقة عند تكوين المحاليل',
    titleEn: 'Energy Changes in Solution Formation',
    chapter: 1,
    page: 13,
    type: 'introductory',
    objectiveAr: 'ملاحظة الفارق الحراري بين الذوبان الماص للحرارة والذوبان الطارد للحرارة عند إذابة الأملاح في الماء.',
    objectiveEn: 'Observe temperature differences between endothermic and exothermic dissolution.',
    safetyAlertAr: 'ارتد النظارات الواقية والقفازات. محاليل الأملاح يجب التخلص منها بأمان.',
    materialsAr: ['كأس ماء مقطر 50mL', 'ملح كلوريد الأمونيوم NH₄Cl (ماص)', 'ملح كلوريد الكالسيوم CaCl₂ (طارد)', 'مقياس حرارة رقمي', 'ساق تحريك'],
    stepsAr: [
      'قس 30 mL من الماء في كأس وسجل درجة الحرارة الابتدائية (25°C).',
      'أضف 10 g من كلوريد الأمونيوم NH₄Cl وحرك جيداً، ولاحظ هبوط الحرارة بمقدار -10 إلى -15 درجات مئوية.',
      'كرر التجربة بكأس جديدة مع إضافة 10 g من كلوريد الكالسيوم CaCl₂، ولاحظ الارتفاع الكبير في الحرارة بمقدار +25°C.'
    ],
    chemicalExplanationAr: 'عملية الذوبان تتضمن خطوتين ماصتين (كسر الروابط في المذاب والمذيب) وخطوة طاردة (التميه). عندما تكون طاقة التميه أكبر يكون الذوبان طارداً (CaCl₂)، وعندما تكون أقل يكون ماصاً (NH₄Cl).',
    balancedEquation: 'NH₄Cl(s) + H₂O + Heat → NH₄⁺(aq) + Cl⁻(aq)  ||  CaCl₂(s) → Ca²⁺(aq) + 2Cl⁻(aq) + Heat',
    presetReagents: ['water', 'ammonium_chloride', 'calcium_chloride']
  },
  {
    id: 'exp_freezing_depression',
    titleAr: 'الانخفاض في درجة التجمد بالملح',
    titleEn: 'Freezing Point Depression by Salt',
    chapter: 1,
    page: 42,
    type: 'quick_lab',
    objectiveAr: 'إثبات أن إضافة جسيمات المذاب (ملح الطعام) إلى الماء والجليد تُضعف قوى التجاذب بين جزيئات الماء وتهبط بدرجة التجمد تحت الصفر.',
    objectiveEn: 'Demonstrate how adding solute particles lowers freezing point below 0°C.',
    safetyAlertAr: 'الجليد شديد البرودة، تعامل بحذر عند استخدام الخليط المبرد.',
    materialsAr: ['كأس جليد مجروش 100g', 'ملح كلوريد الصوديوم NaCl صلب', 'مقياس حرارة رقمي حساس', 'ماء مقطر'],
    stepsAr: [
      'ضع الجليد المجروش مع قليل من الماء وسجل درجة الحرارة (0.0°C).',
      'أضف 30 g من ملح الطعام NaCl إلى الجليد وحرك باستمرار.',
      'راقب هبوط مؤشر الحرارة حتى -6°C إلى -10°C، مما يفسر استخدامه في إذابة ثلوج الطرق وصنع الآيس كريم.'
    ],
    chemicalExplanationAr: 'تتدخل أيونات Na+ و Cl- بين جزيئات الماء وتمنعها من الانتظام في شبكة بلورية صلبة عند 0°C، مما يجبر المحلول على التجمد عند درجات حرارة أبرد بكثير (ΔTf = Kf · m · i).',
    balancedEquation: 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)  (i = 2 particles)',
    presetReagents: ['ice', 'water', 'table_salt']
  },
  {
    id: 'exp_solubility_factors',
    titleAr: 'استقصاء العوامل المؤثرة في الذائبية',
    titleEn: 'Investigating Factors Affecting Solvation',
    chapter: 1,
    page: 46,
    type: 'main_lab',
    objectiveAr: 'مقارنة أثر مساحة السطح (طحن البلورة)، التحريك بالساق، والحرارة في سرعة تكون المحلول وتصادم الجسيمات.',
    objectiveEn: 'Compare effect of surface area, stirring, and temperature on dissolution speed.',
    safetyAlertAr: 'كبريتات النحاس سامة في حال البلع ومهيجة للعين. لا تتخلص منها في المغسلة مباشرة.',
    materialsAr: ['بلورات كبريتات نحاس CuSO₄·5H₂O كبيرة', 'مسحوق كبريتات نحاس مطحون', 'ماء ساخن (60°C)', 'ماء بارد (15°C)', 'أنابيب اختبار وحامل'],
    stepsAr: [
      'أنبوب 1: ضع بلورة كبريتات نحاس في ماء دون تحريك (ذوبان بطيء جداً).',
      'أنبوب 2: ضع بلورة كبريتات نحاس مع تحريك مستمر (انتشار أسرع بسبب إبعاد جزيئات المذاب المشبعة).',
      'أنبوب 3: ضع مسحوق كبريتات نحاس مطحون بالهاون (ذوبان فائق السرعة لزيادة مساحة التماس).',
      'أنبوب 4: ضع المسحوق في ماء ساخن (ذوبان لحظي لطاقة التصادم العالية للماء الساخن).'
    ],
    chemicalExplanationAr: 'التحريك يبعد طبقات التشبع عن السطح، والطحن يزيد مساحة التصادم، ورفع الحرارة يرفع الطاقة الحركية ويزيد عدد التصادمات الفعالة بين جزيئات المذيب وسطح البلورة.',
    balancedEquation: 'CuSO₄·5H₂O(s) → Cu²⁺(aq) + SO₄²⁻(aq) + 5H₂O(l)',
    presetReagents: ['copper_sulfate', 'water']
  },
  {
    id: 'exp_tyndall_effect',
    titleAr: 'تأثير تندال وتشتيت الضوء في المخاليط',
    titleEn: 'Tyndall Effect & Light Scattering',
    chapter: 1,
    page: 16,
    type: 'data_analysis',
    objectiveAr: 'التمييز بين المحلول الحقيقي والمخلوط الغروي والمعلق بتسليط شعاع ضوئي ومراقبة التشتيت.',
    objectiveEn: 'Differentiate true solutions from colloids and suspensions using light beam scattering.',
    safetyAlertAr: 'تجنب توجيه شعاع الليزر مباشرة نحو العين.',
    materialsAr: ['كأس محلول ملحي نقي (محلول حقيقي)', 'كأس ماء مضاف إليه قطرات حليب أو نشا (غروي)', 'كأس ماء ورمل ناعم (معلق)', 'مؤشر ليزر أحمر/أخضر'],
    stepsAr: [
      'سلط شعاع الليزر عبر كأس الماء الملحي: لا يُرى مسار الشعاع في السائل (تأثير تندال = صفر).',
      'سلط الشعاع عبر المخلوط الغروي: يظهر مسار الشعاع ساطعاً وواضحاً جداً نتيجة تشتت الضوء على الجسيمات الغروية (1-1000 nm).',
      'سلط الشعاع عبر المعلق: تشتت قوي واعتام، مع ملاحظة ترسب الدقائق في القاع بعد دقيقة.'
    ],
    chemicalExplanationAr: 'جسيمات المذاب في المحلول الحقيقي صغيرة جداً (< 1 nm) ولا تشتت الضوء، بينما في المخاليط الغروية والمعلقة يتطابق حجم الجسيمات مع الأطوال الموجية للضوء المرئي مسببة تشتتاً مخروطياً واضحاً.',
    balancedEquation: 'Colloidal Particles (1-1000 nm) + Light Ray → Light Scattering',
    presetReagents: ['water', 'table_salt', 'milk_colloid']
  },
  {
    id: 'exp_household_acids_bases',
    titleAr: 'تصنيف المواد المنزلية والأحماض والقواعد',
    titleEn: 'Classifying Household Acids & Bases',
    chapter: 2,
    page: 55,
    type: 'introductory',
    objectiveAr: 'استعمال كاشف تباع الشمس والفينولفثالين لتصنيف المنتجات اليومية إلى أحماض وقواعد ومتعادلة.',
    objectiveEn: 'Use litmus and phenolphthalein indicators to classify common household materials.',
    safetyAlertAr: 'لا تتذوق أو تلمس أي مادة كيميائية في المعمل أبداً. الفينولفثالين قابل للاشتعال.',
    materialsAr: ['حمض هيدروكلوريك مخفف أو خل', 'هيدروكسيد صوديوم مخفف أو منظف أفران', 'بيكربونات صوديوم', 'كاشف فينولفثالين', 'كاشف أزرق بروموثيمول'],
    stepsAr: [
      'ضع عينة من المحلول الحمضي (pH < 7) وأضف قطرة فينولفثالين: يبقى المحلول شفافاً عديم اللون.',
      'أضف قطرة أزرق بروموثيمول للحمض: يتحول اللون للأصفر الفاقع.',
      'ضع عينة من المحلول القاعدي (pH > 7) وأضف فينولفثالين: يتحول فوراً للون الوردي/الأرجواني الساحر.',
      'أضف أزرق بروموثيمول للقاعدة: يتحول للون الأزرق الملكي.'
    ],
    chemicalExplanationAr: 'الكواشف الكيميائية هي أحماض أو قواعد عضوية ضعيفة تختلف ألوان صورتها المتأينة عن غير المتأينة حسب تركيز أيونات H+ في الوسط وفق مبدأ لوتشاتلييه.',
    balancedEquation: 'HIn(aq) [Color A] ⇌ H⁺(aq) + In⁻(aq) [Color B]',
    presetReagents: ['acid_hcl', 'base_naoh', 'phenolphthalein', 'bromothymol_blue']
  },
  {
    id: 'exp_acid_strengths',
    titleAr: 'مقارنة قوى الأحماض والتوصيل الكهربائي',
    titleEn: 'Comparing Acid Strengths & Conductivity',
    chapter: 2,
    page: 66,
    type: 'quick_lab',
    objectiveAr: 'إثبات أن قوة الحمض تعتمد على نسبة تأينه وليس على تركيزه فقط، بمقارنة توهج مصباح الدارة الكهربائية.',
    objectiveEn: 'Demonstrate that acid strength depends on degree of ionization by measuring lamp brightness.',
    safetyAlertAr: 'افصل مصدر التيار قبل تعديل قطبي الدارة. تجنب استنشاق أبخرة الأحماض المركزة.',
    materialsAr: ['محلول حمض قوي HCl (0.1M)', 'محلول حمض ضعيف CH₃COOH (0.1M)', 'دارة فحص التوصيل الكهربائي بمصباح', 'مقياس موصلية'],
    stepsAr: [
      'اغمس قطبي الدارة في كأس حمض الهيدروكلوريك 0.1M: يتوهج المصباح بقوة فائقة لكونه إلكتروليتاً قوياً تام التأين (100%).',
      'اغمس القطبين في كأس حمض الخليك 0.1M: يتوهج المصباح بضوء خافت وضعيف لكونه يتأين جزئياً فقط (حوالي 1.3%).'
    ],
    chemicalExplanationAr: 'التوصيل الكهربائي يعتمد على وفرة الأيونات الحرة في المحلول؛ الأحماض القوية تتفكك كلياً بينما الأحماض الضعيفة تملك اتزاناً مائلاً بشدة لليسار وقيمة Ka صغيرة جداً.',
    balancedEquation: 'HCl + H₂O → H₃O⁺ + Cl⁻ (100%)  ||  CH₃COOH + H₂O ⇌ H₃O⁺ + CH₃COO⁻ (~1.3%)',
    presetReagents: ['acid_hcl', 'acetic_acid', 'water']
  },
  {
    id: 'exp_base_titration',
    titleAr: 'معايرة القاعدة بالسحاحة الكيميائية',
    titleEn: 'Base Titration with Burette',
    chapter: 2,
    page: 85,
    type: 'main_lab',
    objectiveAr: 'تحديد التركيز المولاري الدقيق لمحلول هيدروكسيد الصوديوم بالمعايرة الحجمية مع حمض معلوم بدلالة نقطة النهاية.',
    objectiveEn: 'Determine exact molarity of sodium hydroxide by volumetric titration against standard acid.',
    safetyAlertAr: 'املأ السحاحة بحذر دون انسكاب. استخدم قمعاً ونظارة واقية.',
    materialsAr: ['سحاحة مدرجة 50mL مثبتة على حامل', 'دورق مخروطي 250mL', 'محلول NaOH مجهول التركيز', 'محلول حمض قياسي معلوم', 'كاشف الفينولفثالين'],
    stepsAr: [
      'املأ السحاحة بمحلول القاعدة وسجل القراءة الأولية لحافة السائل المقعر.',
      'ضع في الدورق المخروطي 25.0 mL من الحمض وأضف قطرتين من الفينولفثالين.',
      'افتح صنبور السحاحة ببطء مع التدوير المستمر للدورق.',
      'عند اقتراب التعادل يظهر وميض وردي يتلاشى، أضف قطرة قطرة حتى يثبت اللون الوردي الفاتح (نقطة النهاية).'
    ],
    chemicalExplanationAr: 'عند نقطة التكافؤ يتساوى عدد مولات H+ مع OH- تماماً (n_acid = n_base). وبمعرفة الحجم المستهلك من السحاحة يُحسب التركيز بالقانون: MA·VA = MB·VB.',
    balancedEquation: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)',
    presetReagents: ['acid_hcl', 'base_naoh', 'phenolphthalein']
  },
  {
    id: 'exp_salt_hydrolysis',
    titleAr: 'تميّه الأملاح في المحاليل المائية',
    titleEn: 'Salt Hydrolysis in Aqueous Solutions',
    chapter: 2,
    page: 87,
    type: 'quick_lab',
    objectiveAr: 'إثبات أن الأملاح ليست كلها متعادلة، بل يعتمد pH محلولها على قوة الحمض والقاعدة المكونين لها.',
    objectiveEn: 'Demonstrate how salt solutions vary in pH depending on conjugate acid/base strength.',
    safetyAlertAr: 'نترات الصوديوم وفلوريد البوتاسيوم مواد كيميائية تتطلب التعامل بحذر.',
    materialsAr: ['محلول نترات الصوديوم NaNO₃ (حمض قوي + قاعدة قوية)', 'محلول فلوريد البوتاسيوم KF (حمض ضعيف + قاعدة قوية)', 'محلول كلوريد الأمونيوم NH₄Cl (حمض قوي + قاعدة ضعيفة)', 'كاشف أزرق بروموثيمول'],
    stepsAr: [
      'أضف كاشف البروموثيمول لكأس NaNO₃: يتلون بالأخضر (محلول متعادل pH ≈ 7.0) لعدم تميه أيوناته.',
      'أضفه لكأس KF: يتلون بالأزرق (محلول قاعدي pH ≈ 8.5) لأن أيون F- يتميه منتجاً OH-.',
      'أضفه لكأس NH₄Cl: يتلون بالأصفر (محلول حمضي pH ≈ 5.5) لأن أيون NH₄+ يتميه منتجاً H₃O+.'
    ],
    chemicalExplanationAr: 'التميّه هو تفاعل أيونات الملح مع الماء؛ الشق السالب للحمض الضعيف يكتسب H+ منتجاً OH- (قاعدي)، والشق الموجب للقاعدة الضعيفة يمنح H+ منتجاً H₃O+ (حمضي).',
    balancedEquation: 'F⁻ + H₂O ⇌ HF + OH⁻ (قاعدي)  ||  NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺ (حمضي)',
    presetReagents: ['sodium_nitrate', 'potassium_fluoride', 'ammonium_chloride', 'bromothymol_blue']
  },
  {
    id: 'exp_iron_copper_redox',
    titleAr: 'تفاعل الحديد وكبريتات النحاس II (إحلال وأكسدة)',
    titleEn: 'Iron and Copper(II) Sulfate Redox Reaction',
    chapter: 3,
    page: 103,
    type: 'introductory',
    objectiveAr: 'ملاحظة انتقال الإلكترونات من فلز الحديد إلى أيونات النحاس وترسب النحاس الفلزي الأحمر على المسمار.',
    objectiveEn: 'Observe electron transfer from iron metal to copper ions, precipitating metallic copper.',
    safetyAlertAr: 'احذر من الحواف الحادة للمسامير ورقائق الفلزات.',
    materialsAr: ['مسمار حديدي ملمع بورق الصنفرة (Fe)', 'محلول كبريتات النحاس الزرقاء CuSO₄ (1.0M)', 'أنبوب اختبار زجاجي'],
    stepsAr: [
      'ضع 10 mL من محلول كبريتات النحاس الأزرق في أنبوب الاختبار.',
      'اغمس المسمار الحديدي الملمع في المحلول وانتظر 5 إلى 10 دقائق.',
      'أخرج المسمار ولاحظ تغطية سطحه بطبقة حمراء نحاسية لامعة من فلز Cu، مع تحول لون المحلول الأزرق تدريجياً إلى الأخضر الفاتح (أيونات Fe²⁺).'
    ],
    chemicalExplanationAr: 'الحديد أكثر نشاطاً وأقل في جهد الاختزال (-0.44V) من النحاس (+0.34V)، لذا يتأكسد الحديد طارداً إلكترونين يكتسبهما النحاس ليختزل ويترسب كفلز نقي.',
    balancedEquation: 'Fe(s) + Cu²⁺(aq) → Fe²⁺(aq) + Cu(s)',
    presetReagents: ['copper_sulfate', 'iron_filings', 'water']
  },
  {
    id: 'exp_silver_tarnish_removal',
    titleAr: 'إزالة شوائب الفضة وتلميعها بالأكسدة والاختزال',
    titleEn: 'Silver Tarnish Removal via Redox',
    chapter: 3,
    page: 107,
    type: 'quick_lab',
    objectiveAr: 'استعادة بريق الفضة بإزالة طبقة كبريتيد الفضة السوداء Ag₂S باختزالها برقيقة الألومنيوم الأكثر نشاطاً في ماء ساخن.',
    objectiveEn: 'Restore silver luster by reducing black Ag₂S tarnish using active aluminum in hot water.',
    safetyAlertAr: 'الماء الساخن وصودا الخبز يسببان فوراناً خفيفاً. تعامل بحذر.',
    materialsAr: ['قطعة أو ملعقة فضة معتمة بالصدأ (Ag₂S)', 'رقائق ألومنيوم مطبخ ناعمة (Al)', 'مسحوق بيكربونات الصوديوم NaHCO₃', 'ماء ساخن مغلي'],
    stepsAr: [
      'بطن قاع الكأس برقاقة الألومنيوم اللامعة وضع قطعة الفضة المعتمة ملامسة للألومنيوم تماماً.',
      'أضف ملعقة من صودا الخبز ورشة ملح لتكوين وسط إلكتروليتي موصل.',
      'اسكب الماء الساخن حتى يغمر القطعتين؛ ستلاحظ زوال السواد فوراً وعودة الفضة لبريقها الفضي اللامع مع تصاعد رائحة كبريتيد خفيفة.'
    ],
    chemicalExplanationAr: 'الألومنيوم أكثر قابلية للتأكسد (عامل مختزل قوي E° = -1.66V) فيمنح إلكترونات لأيونات الفضة المختزلة في Ag₂S لتتحول إلى Ag فلزي حر ونظيف.',
    balancedEquation: '3Ag₂S(s) + 2Al(s) + 3H₂O(l) → 6Ag(s) + Al₂O₃(s) + 3H₂S(g)',
    presetReagents: ['silver_nitrate', 'baking_soda', 'water']
  },
  {
    id: 'exp_luminol_forensic',
    titleAr: 'توهج اللومينول المضيء في التحقيق الجنائي',
    titleEn: 'Luminol Chemiluminescence in Forensics',
    chapter: 3,
    page: 121,
    type: 'field',
    objectiveAr: 'محاكاة كشف بقع الدماء غير المرئية بظاهرة التوهج الكيميائي الضوئي البارد (Chemiluminescence).',
    objectiveEn: 'Simulate forensic detection of invisible blood traces using cold chemiluminescent light.',
    safetyAlertAr: 'فوق أكسيد الهيدروجين مؤكسد جلدي. استخدم القفازات.',
    materialsAr: ['محلول لومينول قاعدي C₈H₇N₃O₂', 'فوق أكسيد الهيدروجين H₂O₂', 'محلول يحوي أثر حديد (Fe²⁺/Fe³⁺ يمثل الهيموجلوبين في الدم)', 'غرفة مظلمة بالمحاكي'],
    stepsAr: [
      'امزج مسحوق اللومينول مع ماء الأكسجين H₂O₂ في وسط قلوي خفيف.',
      'في غرفة مظلمة، أضف قطرات من أثر الحديد أو رش الرذاذ فوق بقعة الحديد.',
      'شاهد التوهج الأزرق المخضر الساحر والمشع في الظلام دون أي حرارة (ضوء بارد).'
    ],
    chemicalExplanationAr: 'يعمل الحديد الموجود في هيموجلوبين الدم كعامل محفز يسرع أكسدة اللومينول بواسطة H₂O₂، وتتحرر طاقة التفاعل في صورة فوتونات ضوئية زرقاء (425 nm).',
    balancedEquation: 'Luminol + H₂O₂ + [Fe Catalyst] → 3-Aminophthalate* → 3-Aminophthalate + Blue Light (hν)',
    presetReagents: ['hydrogen_peroxide', 'iron_filings', 'water']
  },
  {
    id: 'exp_dilapidated_truck_series',
    titleAr: 'لغز الشاحنة المتهالكة وسلسلة نشاط الفلزات',
    titleEn: 'Dilapidated Truck Redox Metal Activity Series',
    chapter: 3,
    page: 122,
    type: 'main_lab',
    objectiveAr: 'اختبار عينات الفلزات (Cu, Pb, Fe, Mg) مع المحاليل الملوثة (AgNO₃, HCl, ZnSO₄) لكشف الملوث وتحديد ترتيب الكهروسالبية والنشاط.',
    objectiveEn: 'Test metal specimens to detect river contaminants and establish the activity series.',
    safetyAlertAr: 'نترات الفضة تسبب بقعاً داكنة، وأملاح الرصاص ملوثة وسامة.',
    materialsAr: ['شريط ماغنسيوم Mg', 'برادة حديد Fe', 'حبيبات رصاص Pb', 'سلك نحاس Cu', 'محلول نترات فضة AgNO₃', 'محلول حمض HCl', 'محلول كبريتات خارصين ZnSO₄'],
    stepsAr: [
      'فجوات الصف 1 (نحاس): يتفاعل فقط مع AgNO₃ مترسباً بلورات الفضة الفاقعة، ولا يتفاعل مع HCl أو ZnSO₄.',
      'فجوات الصف 2 (حديد): يتفاعل مع AgNO₃ و HCl بفقاعات هيدروجين، ولا يتفاعل مع ZnSO₄.',
      'فجوات الصف 4 (ماغنسيوم): يتفاعل بعنف مع المحاليل الثلاثة جميعها لأنه أنشط الفلزات.',
      'استنتج ترتيب نشاط الفلزات تصاعدياً: Cu < Pb < Fe < Zn < Mg.'
    ],
    chemicalExplanationAr: 'يستطيع الفلز الأكثر نشاطاً (الأقل في جهد الاختزال القياسي) أن يحل محل أيونات الفلز الأقل نشاطاً في محاليلها باختزالها وترسيبها.',
    balancedEquation: 'Mg(s) + 2Ag⁺(aq) → Mg²⁺(aq) + 2Ag(s)  ||  Fe(s) + 2H⁺(aq) → Fe²⁺(aq) + H₂(g)',
    presetReagents: ['silver_nitrate', 'acid_hcl', 'magnesium_ribbon', 'iron_filings']
  },
  {
    id: 'exp_lemon_battery',
    titleAr: 'صنع بطارية جلفانية من حبة ليمون',
    titleEn: 'Lemon Voltaic Battery Simulation',
    chapter: 4,
    page: 133,
    type: 'introductory',
    objectiveAr: 'توليد تيار كهربائي حقيقي من تفاعل أكسدة واختزال تلقائي باستخدام عصير الليمون كإلكتروليت وقطبي Zn و Cu.',
    objectiveEn: 'Generate electrical voltage via spontaneous redox using lemon juice electrolyte.',
    safetyAlertAr: 'تجربة آمنة وبيئية تماماً. لا تأكل الليمون بعد غرس المعادن فيه.',
    materialsAr: ['حبة ليمون طازجة (حمض الستريك كإلكتروليت)', 'شريحة خارصين Zn (الأنود المصعد)', 'شريحة نحاس Cu (الكاثود المهبط)', 'فولتمتر ومصباح LED صغير'],
    stepsAr: [
      'اغرس شريحة الخارصين وأخرى من النحاس في الليمونة على مسافة 2 cm بينهما.',
      'صل القطب الأسود للفولتمتر بشريحة الخارصين والقطب الأحمر بالنحاس.',
      'اقرأ فرق الجهد المتولد (حوالي 0.90 V إلى 1.05 V)، وشاهد إضاءة الدايود الصغير.',
      'انزع إحدى الشريحتين ولاحظ هبوط الجهد للصفر فوراً لانقطاع الدائرة.'
    ],
    chemicalExplanationAr: 'يتأكسد الخارصين في الوسط الحمضي وتتحرك إلكتروناته عبر السلك نحو النحاس حيث تختزل أيونات +H في عصير الليمون منتجة غاز الهيدروجين.',
    balancedEquation: 'Zn(s) + 2H⁺(aq) → Zn²⁺(aq) + H₂(g)  (E° ≈ +0.76 V)',
    presetReagents: ['water', 'acid_hcl']
  },
  {
    id: 'exp_galvanic_cell_potential',
    titleAr: 'قياس جهد الخلايا الجلفانية والطلاء بالكهرباء',
    titleEn: 'Galvanic Cell Potential & Electroplating',
    chapter: 4,
    page: 158,
    type: 'main_lab',
    objectiveAr: 'تركيب خلية دانيال الجلفانية (خارصين/نحاس) بقنطرة ملحية وقياس جهدها النظري (+1.10 V)، ثم عكس التيار لطلاء مفتاح بالنحاس.',
    objectiveEn: 'Assemble Daniel cell to measure standard voltage (+1.10V) and perform copper electroplating.',
    safetyAlertAr: 'كبريتات النحاس سامة. لا تقصر أقطاب البطارية لتجنب السخونة.',
    materialsAr: ['نصف خلية خارصين (شريحة Zn في 1M ZnSO₄)', 'نصف خلية نحاس (شريحة Cu في 1M CuSO₄)', 'قنطرة ملحية بمحلول KNO₃', 'فولتمتر رقمي ومصدر جهد خارجي للطلاء', 'مفتاح معدني'],
    stepsAr: [
      'صل نصفي الخلية بالقنطرة الملحية وسلك الفولتمتر: يعطي الفولتمتر قراءة قياسية +1.104 V.',
      'الخارصين هو الأنود (يتآكل ويقل كتلته)، والنحاس هو الكاثود (يترسب عليه النحاس ويزداد وزنه).',
      'صل مصدر جهد خارجي 6V واجعل المفتاح كاثوداً في محلول النحاس: يترسب غطاء نحاسي أحمر ناعم يغلف المفتاح بالطلاء الكهربائي.'
    ],
    chemicalExplanationAr: 'في الخلية الجلفانية: E°cell = E°(Cu²⁺/Cu) - E°(Zn²⁺/Zn) = +0.342 - (-0.762) = +1.104 V. في التحليل الكهربائي يجبر المصدر الخارجي تفاعل الاختزال غير التلقائي على الحدوث عند الكاثود.',
    balancedEquation: 'Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)  [Galvanic]  ||  Cu²⁺ + 2e⁻ → Cu(s) [Plating]',
    presetReagents: ['copper_sulfate', 'water']
  }
];
