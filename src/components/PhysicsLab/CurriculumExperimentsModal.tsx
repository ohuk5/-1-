import React, { useState } from 'react';
import { 
  BookOpen, CheckSquare, Square, Calculator, ArrowRight, ExternalLink, 
  RotateCcw, Sparkles, Award, Compass, Search, Filter, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { playLabSound } from '../../utils/soundEffects';

export interface CurriculumExperiment {
  id: number;
  titleAr: string;
  titleEn: string;
  unitAr: string;
  unitEn: string;
  stationTarget: 'mechanics' | 'thermodynamics' | 'electromagnetism' | 'optics_quantum';
  opticsSubTab?: 'lenses' | 'refraction' | 'prism' | 'quantum';
  problemAr: string;
  problemEn: string;
  formula: string;
  theoryAr: string;
  theoryEn: string;
  materialsAr: string[];
  materialsEn: string[];
  stepsAr: string[];
  stepsEn: string[];
  defaultData: {
    labelsAr: string[];
    labelsEn: string[];
    values: (string | number)[][];
    formulaPromptAr: string;
    formulaPromptEn: string;
  };
  computeResult: (row: (string | number)[]) => { resultText: string; isAccurate: boolean };
}

export const EXPERIMENTS_LIST: CurriculumExperiment[] = [
  {
    id: 1,
    titleAr: 'تجربة 1: لماذا تبدو الصخرة خفيفة في الماء؟',
    titleEn: 'Exp 1: Why does a rock feel lighter in water?',
    unitAr: 'الفصل 1: حالات المادة (الموائع وقاعدة أرخميدس)',
    unitEn: 'Ch 1: States of Matter (Fluids & Archimedes)',
    stationTarget: 'mechanics',
    problemAr: 'كيف تقيس قوة طفو الماء المؤثرة في الأجسام المغمورة وعلاقتها بوزن المائع المزاح؟',
    problemEn: 'How do you measure buoyant force on submerged bodies and relate it to displaced fluid weight?',
    formula: 'F_buoy = F_g - F_apparent = ρ_fluid · V_disp · g',
    theoryAr: 'تنص قاعدة أرخميدس على أن الجسم المغمور كلياً أو جزئياً في مائع تؤثر فيه قوة رأسية إلى أعلى تساوي تماماً وزن المائع المزاح بوساطة الجسم. الوزن الظاهري في الماء ينقص بمقدار يساوي قوة الطفو بدقة.',
    theoryEn: 'Archimedes principle states that a submerged body experiences an upward buoyant force equal to the weight of displaced fluid. The apparent weight decreases by exactly the buoyant force.',
    materialsAr: ['مخبار مدرج 500 ml', 'ميزان نابضي 5 N', 'كتل تعليق 100g و 500g', 'كأس بلاستيكية كقارب', 'ماء نقي'],
    materialsEn: ['500 ml Graduated Cylinder', '5 N Spring Balance', '100g & 500g masses', 'Plastic beaker boat', 'Pure water'],
    stepsAr: [
      'قس وزن الكتلة 500g في الهواء باستخدام الميزان النابضي وسجل F_g.',
      'اغمر الكتلة في الماء دون ملامسة القاع، واقرأ الوزن الظاهري F_apparent.',
      'احسب الفرق (قوة الطفو F_b = F_g - F_app).',
      'اقرأ حجم الماء المزاح في المخبار واحسب وزن الماء المزاح وقارنهما.'
    ],
    stepsEn: [
      'Measure 500g weight in air with spring balance to find F_g.',
      'Submerge mass in water without touching cylinder floor, recording apparent weight F_app.',
      'Calculate difference (Buoyant force F_b = F_g - F_app).',
      'Read displaced volume in cylinder, calculate displaced water weight and compare.'
    ],
    defaultData: {
      labelsAr: ['الكتلة (g)', 'الوزن بالهواء Fg (N)', 'الوزن الظاهري بالماء (N)', 'حجم الماء المزاح (ml)'],
      labelsEn: ['Mass (g)', 'Weight in Air Fg (N)', 'Apparent Weight (N)', 'Displaced Volume (ml)'],
      values: [
        ['500', '4.90', '4.26', '65'],
        ['100', '0.98', '0.85', '13'],
        ['200 (قارب عائم)', '1.96', '0.00', '200']
      ],
      formulaPromptAr: 'قوة الطفو المحسوبة = Fg - F_apparent | وزن الماء المزاح = V(L) × 9.8 N',
      formulaPromptEn: 'Fb = Fg - F_app | Displaced Weight = V(L) * 9.8 N'
    },
    computeResult: row => {
      const fg = parseFloat(String(row[1])) || 0;
      const fapp = parseFloat(String(row[2])) || 0;
      const v = parseFloat(String(row[3])) || 0;
      const fb = Math.max(0, fg - fapp);
      const dispWeight = (v / 1000) * 1000 * 0.0098;
      const diff = Math.abs(fb - dispWeight);
      return {
        resultText: `Fb = ${fb.toFixed(2)} N | وزن المزاح = ${dispWeight.toFixed(2)} N | خطأ: ${(diff / (fb || 1) * 100).toFixed(1)}%`,
        isAccurate: diff < 0.15
      };
    }
  },
  {
    id: 2,
    titleAr: 'تجربة 2: لماذا تؤلمك أذناك عندما تغوص في الماء؟',
    titleEn: 'Exp 2: Why do your ears hurt when you dive deep in water?',
    unitAr: 'الفصل 1: حالات المادة (الضغط الهيدروستاتيكي ومبدأ باسكال)',
    unitEn: 'Ch 1: States of Matter (Hydrostatic Pressure & Pascal)',
    stationTarget: 'mechanics',
    problemAr: 'كيف يتغير ضغط السائل مع العمق؟ وكيف ينتقل الضغط في جميع الاتجاهات دون نقصان؟',
    problemEn: 'How does fluid pressure vary with depth, and transmit equally in all directions?',
    formula: 'P = ρ_fluid · g · h   |   ΔF = ΔP · A_ear',
    theoryAr: 'يزداد الضغط الهيدروستاتيكي في السائل طردياً مع العمق وكثافة السائل. يؤثر هذا الضغط في جميع الاتجاهات على طبلة الأذن، وينص مبدأ باسكال على انتقال أي تغير في الضغط عبر المائع المحصور بالتساوي.',
    theoryEn: 'Hydrostatic pressure increases linearly with fluid depth and density. Pressure acts equally in all directions upon the eardrum, obeying Pascal\'s law of equal transmission.',
    materialsAr: ['قارورة بلاستيكية 2L بثقوب عند أعماق مختلفة', 'ماصة عصير', 'كأس ماء مقلوبة مع بطاقة', 'مسطرة مترية'],
    materialsEn: ['2L Plastic bottle punctured at varying depths', 'Drinking straw', 'Inverted glass cup with card', 'Metric ruler'],
    stepsAr: [
      'اثقب القارورة عند ربع ونصف وثلاثة أرباع الارتفاع.',
      'املأ القارورة ولاحظ اندفاع الماء: الثقب السفلي يندفع منه الماء لأبعد مسافة لزيادة الضغط عند القاع.',
      'اقلب كأساً مملوءة تماماً بالماء مغطاة ببطاقة لمشاهدة تفوق الضغط الجوي على وزن عمود الماء!'
    ],
    stepsEn: [
      'Puncture bottle at 1/4, 1/2, and 3/4 depth levels.',
      'Fill bottle and observe jet distance: deepest hole ejects furthest due to maximum pressure.',
      'Invert water cup sealed by card to witness atmospheric pressure balancing water column weight!'
    ],
    defaultData: {
      labelsAr: ['العمق h (m)', 'كثافة السائل (kg/m³)', 'الضغط الهيدروستاتيكي (kPa)', 'القوة على طبلة الأذن 0.5 cm² (N)'],
      labelsEn: ['Depth h (m)', 'Fluid Density (kg/m³)', 'Pressure (kPa)', 'Eardrum Force 0.5 cm² (N)'],
      values: [
        ['1.0', '1000', '9.80', '0.49'],
        ['2.5', '1000', '24.50', '1.23'],
        ['5.0', '1000', '49.00', '2.45']
      ],
      formulaPromptAr: 'P = ρ · g · h | F = P × (0.5 × 10⁻⁴ m²)',
      formulaPromptEn: 'P = ρ · g · h | F = P * (0.5e-4 m²)'
    },
    computeResult: row => {
      const h = parseFloat(String(row[0])) || 0;
      const rho = parseFloat(String(row[1])) || 1000;
      const p = (rho * 9.8 * h) / 1000;
      const f = p * 1000 * 0.00005;
      return {
        resultText: `الضغط P = ${p.toFixed(2)} kPa | القوة على الأذن F = ${f.toFixed(2)} N`,
        isAccurate: true
      };
    }
  },
  {
    id: 3,
    titleAr: 'تجربة 3: كيف تنعكس الموجات وكيف تنكسر؟',
    titleEn: 'Exp 3: How do waves reflect and refract?',
    unitAr: 'الفصل 2: الاهتزازات والموجات (حوض الموجات في بعدين)',
    unitEn: 'Ch 2: Waves & Vibrations (Ripple Tank 2D Optics)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'refraction',
    problemAr: 'ما العلاقة بين زاوية السقوط وزاوية الانعكاس للموجات؟ وماذا يحدث لسرعتها عند تغير عمق الماء؟',
    problemEn: 'What is the relation between incident and reflected angles, and how does wave speed change with depth?',
    formula: 'θ_i = θ_r   |   v_deep > v_shallow   |   λ_deep > λ_shallow',
    theoryAr: 'تنعكس الموجات في بعدين بحيث تكون زاوية السقوط مساوية لزاوية الانعكاس (θi = θr). وعند مرور الموجة من ماء عميق إلى ماء ضحل، تنخفض سرعتها ويقل طولها الموجي مع بقاء ترددها ثابتاً، مما يؤدي لانكسارها وانحراف مسارها.',
    theoryEn: 'Waves reflect such that angle of incidence equals reflection (θi = θr). Passing from deep to shallow water, speed and wavelength decrease while frequency remains constant, causing refraction.',
    materialsAr: ['حوض موجات مع لوح كرتون سفلي', 'حاجز مستقيم وحاجز قطع مكافئ', 'لوح زجاجي لتقليل العمق', 'منقلة'],
    materialsEn: ['Ripple tank with projection card', 'Straight and parabolic barriers', 'Submerged glass plate', 'Protractor'],
    stepsAr: [
      'شغل حوض الموجات وأسقط موجات مستوية نحو حاجز مستقيم بزوايا مختلفة وقس θi و θr.',
      'استبدل بالحاجز المائل حاجز قطع مكافئ وشاهد تجمع الموجات المنعكسة في نقطة بؤرية.',
      'ضع لوحاً زجاجياً لإنتاج منطقة ضحلة ولاحظ انكسار وتباطؤ الموجة وقصر طولها الموجي.'
    ],
    stepsEn: [
      'Generate straight wave pulses against angled reflector and measure θi versus θr.',
      'Replace with parabolic barrier and observe focused convergence at the focal point.',
      'Place submerged glass plate to observe slowing and wavelength shortening in shallow zone.'
    ],
    defaultData: {
      labelsAr: ['زاوية السقوط θi (°)', 'زاوية الانعكاس θr (°)', 'السرعة بالماء العميق (m/s)', 'السرعة بالماء الضحل (m/s)'],
      labelsEn: ['Incident Angle θi (°)', 'Reflected Angle θr (°)', 'Deep Speed (m/s)', 'Shallow Speed (m/s)'],
      values: [
        ['30.0', '30.0', '0.40', '0.25'],
        ['45.0', '45.0', '0.40', '0.25'],
        ['60.0', '60.0', '0.40', '0.25']
      ],
      formulaPromptAr: 'قانون الانعكاس: θi = θr | معامل الانكسار المكافئ n = v_deep / v_shallow',
      formulaPromptEn: 'Law of reflection: θi = θr | Equivalent refractive index n = v_deep / v_shallow'
    },
    computeResult: row => {
      const i = parseFloat(String(row[0])) || 0;
      const r = parseFloat(String(row[1])) || 0;
      const vd = parseFloat(String(row[2])) || 0.4;
      const vs = parseFloat(String(row[3])) || 0.25;
      const n = (vd / (vs || 1)).toFixed(2);
      return {
        resultText: `تطابق الانعكاس: Δθ = ${Math.abs(i - r).toFixed(1)}° | معامل الانكسار المكافئ n = ${n}`,
        isAccurate: Math.abs(i - r) < 1.0
      };
    }
  },
  {
    id: 4,
    titleAr: 'تجربة 4: كيف يبدو حيود الموجات وتداخلها؟',
    titleEn: 'Exp 4: How do wave diffraction and interference appear?',
    unitAr: 'الفصل 2: الاهتزازات والموجات (الحيود والتداخل في بعدين)',
    unitEn: 'Ch 2: Waves (Diffraction & Interference)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'quantum',
    problemAr: 'كيف يؤثر عرض الفتحة في انتشار حيود الموجات؟ وما نمط التداخل الناتج عن مصدرين نقطيين؟',
    problemEn: 'How does slit width influence diffraction spread, and what interference pattern forms from two sources?',
    formula: 'θ_diff ≈ λ / w   |   d · sin θ = m · λ (هدب مضيء / بطن)',
    theoryAr: 'وفق مبدأ هيجنز، تعمل كل نقطة على مقدمة الموجة كمصدر لمويجات ثانوية دائرية. عندما تعبر الموجة فتحة ضيقة يزداد انحناؤها وتنتشر كحيود. وعند تشغيل مصدرين نقطيين متقاربين تتكون خطوط عقدية هادئة وبطون تداخل بناء.',
    theoryEn: 'By Huygens principle, wave front points act as secondary wavelet sources. Smaller apertures widen diffraction bending. Dual synchronized point sources create nodal lines and antinodal constructive fringes.',
    materialsAr: ['حوض موجات', 'قطعتان من الخشب/البرافين لعمل فتحة متغيرة', 'مولد موجات برأسين نقطيين', 'مصدر ضوء'],
    materialsEn: ['Ripple tank', 'Two paraffin blocks for variable slit', 'Dual-point dipper oscillator', 'Strobe light'],
    stepsAr: [
      'مرر موجات مستوية عبر فتحة واسعة (12 cm) ثم ضيق الفتحة ببطء وشاهد انحناء الموجات الدائري.',
      'زد تردد المولد وشاهد قصر الطول الموجي وتغير زاوية انتشار الحيود.',
      'ركب الرأسين النقطيين لمراقبة الخطوط العقدية (تداخل هدام) وبطون التداخل البناء.'
    ],
    stepsEn: [
      'Send straight waves through wide gap (12 cm), then narrow it down to watch circular curving.',
      'Increase frequency to observe shorter wavelength and altered diffraction spreading.',
      'Install dual-point dippers to observe clear nodal lines (destructive) and constructive antinodes.'
    ],
    defaultData: {
      labelsAr: ['عرض الفتحة w (cm)', 'الطول الموجي λ (cm)', 'زاوية انتشار الحيود (°)', 'نمط الموجة المتولدة'],
      labelsEn: ['Slit Width w (cm)', 'Wavelength λ (cm)', 'Diffraction Angle (°)', 'Pattern Formed'],
      values: [
        ['12.0', '1.5', '7.2', 'مستقيمة مع انحناء خفيف عند الحواف'],
        ['3.0', '1.5', '30.0', 'شبه دائرية تنتشر بزاوية واسعة'],
        ['1.5', '1.5', '90.0', 'دائرية متحدة المركز تماماً']
      ],
      formulaPromptAr: 'sin θ = λ / w | كلما صغرت الفتحة زاد الحيود',
      formulaPromptEn: 'sin θ = λ / w | Smaller slit produces broader diffraction'
    },
    computeResult: row => {
      const w = parseFloat(String(row[0])) || 1;
      const lam = parseFloat(String(row[1])) || 1;
      const sinVal = Math.min(1, lam / w);
      const angle = (Math.asin(sinVal) * 180 / Math.PI).toFixed(1);
      return {
        resultText: `زاوية الحيود المحسوبة θ = ${angle}° (تزداد كلما قل عرض الفتحة w)`,
        isAccurate: true
      };
    }
  },
  {
    id: 5,
    titleAr: 'تجربة 5: ما الديسبل؟',
    titleEn: 'Exp 5: What is a Decibel?',
    unitAr: 'الفصل 3: الصوت (مستوى شدة الصوت والسمع البشري)',
    unitEn: 'Ch 3: Sound (Sound Level, Decibels & Hearing)',
    stationTarget: 'thermodynamics',
    problemAr: 'ما العلاقة بين إدراك الأذن لعلو الصوت ومقياس الديسبل اللوغاريتمي ومخاطر فقدان السمع؟',
    problemEn: 'What is the logarithmic relationship between perceived loudness and decibel ratings?',
    formula: 'β = 10 · log₁₀(I / I₀)   |   I₀ = 1.0 × 10⁻¹² W/m²',
    theoryAr: 'حاسة السمع تدرك الصوت استجابة لوغاريتمية لتغيرات الضغط. مضاعفة شدة الصوت تزيد مستواه بمقدار 3 dB فقط، والزيادة بمقدار 10 dB تضاعف علو الصوت المدرك مرتين وتزيد شدته 10 أضعاف. التعرض لمستويات تتجاوز 85-90 dB يسبب تلفاً دائماً للسمع.',
    theoryEn: 'Human ear responds logarithmically to pressure amplitudes. Doubling intensity increases sound level by only 3 dB; +10 dB feels twice as loud and is 10x more energetic. >85 dB risks permanent damage.',
    materialsAr: ['مقياس مستوى الصوت (Sound Level Meter / ديسبل)', 'مشغل أقراص أو هاتف وسماعات', 'شريط لاصق'],
    materialsEn: ['Sound Level Meter (dB meter)', 'Media player / smartphone and headphones', 'Tape'],
    stepsAr: [
      'ثبت سماعات الأذن أمام ميكروفون مقياس الصوت وسجل المستوى عند تدريجات مختلفة.',
      'حدد مستوى استماعك المعتاد وقارنه بجدول حدود السلامة المهنية (أقصى تعرض 8 ساعات عند 90 dB).',
      'احسب نسب الشدة I/I0 وتأكد من أن كل 10 dB تعادل ضرب الشدة في 10.'
    ],
    stepsEn: [
      'Mount headphones directly on dB meter microphone and log level across volume steps.',
      'Identify preferred listening level and cross-check against occupational hazard standards.',
      'Calculate intensity ratios verifying that each +10 dB step corresponds to a 10x energy factor.'
    ],
    defaultData: {
      labelsAr: ['تدريج مستوى الصوت', 'مستوى الصوت β (dB)', 'نسبة الشدة I / I₀', 'الحد الأقصى للتعرض اليومي'],
      labelsEn: ['Volume Step', 'Sound Level β (dB)', 'Intensity Ratio I / I₀', 'Max Safe Daily Exposure'],
      values: [
        ['درجة 2 (هادئ)', '60', '1,000,000', 'غير محدود (آمن)'],
        ['درجة 6 (محادثة قوية)', '80', '100,000,000', 'أكثر من 8 ساعات'],
        ['درجة 8 (صاخب جداً)', '95', '3,160,000,000', '4 ساعات فقط!'],
        ['درجة 10 (الحد الأقصى)', '110', '100,000,000,000', '30 دقيقة فقط خطر!']
      ],
      formulaPromptAr: 'β = 10 · log₁₀(I / I₀) | كل 3dB زيادة تضاعف الطاقة الصوتية',
      formulaPromptEn: 'β = 10 · log₁₀(I / I₀) | Every +3 dB doubles acoustic energy'
    },
    computeResult: row => {
      const db = parseFloat(String(row[1])) || 0;
      const ratio = Math.pow(10, db / 10);
      return {
        resultText: `المستوى = ${db} dB | نسبة الطاقة = ${ratio.toExponential(2)} I₀`,
        isAccurate: true
      };
    }
  },
  {
    id: 6,
    titleAr: 'تجربة 6: ما مقدار سرعة الصوت؟',
    titleEn: 'Exp 6: What is the speed of sound?',
    unitAr: 'الفصل 3: الصوت (الرنين في الأعمدة الهوائية)',
    unitEn: 'Ch 3: Sound (Resonance in Air Columns)',
    stationTarget: 'thermodynamics',
    problemAr: 'كيف تستخدم رنين عمود الهواء المغلق أو المفتوح لقياس الطول الموجي وحساب سرعة الصوت عملياً؟',
    problemEn: 'How do you measure wavelength and calculate speed of sound via resonant air columns?',
    formula: 'v = f · λ   |   λ = 4(L + 0.4D)   |   v_theoretical = 331 + 0.6·T(°C)',
    theoryAr: 'عند اهتزاز شوكة رنانة فوق فوهة أنبوب هوائي، يحدث رنين عند أطوال محددة تتطابق مع التردد الطبيعي لعمود الهواء. للأنبوب المغلق يحدث الرنين الأول عند L ≈ λ/4، مع تطبيق تصحيح القطر D لحساب الطول الفعال.',
    theoryEn: 'A tuning fork over an air column produces resonance at natural harmonic lengths. For a closed pipe, first resonance occurs at L ≈ λ/4 with end correction 0.4D added for tube diameter.',
    materialsAr: ['شوكات رنانة (256, 384, 512 Hz)', 'مطرقة مطاطية', 'أنبوب رنين زجاجي في مخبار ماء', 'مسطرة مترية', 'مقياس حرارة'],
    materialsEn: ['Tuning forks (256, 384, 512 Hz)', 'Rubber mallet', 'Resonance tube in water jar', 'Meter stick', 'Thermometer'],
    stepsAr: [
      'قس درجة حرارة الغرفة لحساب سرعة الصوت المقبولة نظرياً (v = 331 + 0.6T).',
      'اطرق الشوكة الرنانة وضعها فوق فوهة الأنبوب، وارفع الأنبوب ببطء حتى تسمع أعلى صوت رنين.',
      'قس طول عمود الهواء L وقطر الأنبوب D، واحسب الطول الموجي المصحح λ = 4(L + 0.4D).',
      'احسب سرعة الصوت التجريبية v = f · λ وقارنها مع القيمة النظرية.'
    ],
    stepsEn: [
      'Measure room temperature to determine theoretical speed: v = 331 + 0.6T.',
      'Strike tuning fork and hold over tube, raising tube until loud resonance tone is heard.',
      'Record column length L and tube diameter D, calculating corrected wavelength λ = 4(L + 0.4D).',
      'Compute experimental speed v = f · λ and calculate percentage error.'
    ],
    defaultData: {
      labelsAr: ['تردد الشوكة f (Hz)', 'طول العمود L (m)', 'قطر الأنبوب D (m)', 'الطول الموجي λ (m)'],
      labelsEn: ['Frequency f (Hz)', 'Tube Length L (m)', 'Diameter D (m)', 'Wavelength λ (m)'],
      values: [
        ['512', '0.155', '0.035', '0.676'],
        ['384', '0.210', '0.035', '0.896'],
        ['256', '0.320', '0.035', '1.336']
      ],
      formulaPromptAr: 'v = f · λ | السرعة عند 20°C = 343 m/s',
      formulaPromptEn: 'v = f · λ | Target speed at 20°C = 343 m/s'
    },
    computeResult: row => {
      const f = parseFloat(String(row[0])) || 512;
      const lam = parseFloat(String(row[3])) || 0.67;
      const v = f * lam;
      const vTheo = 343;
      const err = (Math.abs(v - vTheo) / vTheo) * 100;
      return {
        resultText: `السرعة المقيسة v = ${v.toFixed(1)} m/s | نسبة الخطأ: ${err.toFixed(2)}%`,
        isAccurate: err < 5.0
      };
    }
  },
  {
    id: 7,
    titleAr: 'تجربة 7: كيف يمكنك التقليل من الوهج؟',
    titleEn: 'Exp 7: How can you reduce glare?',
    unitAr: 'الفصل 4: أساسيات الضوء (الاستقطاب، قانون مالوس، وزاوية بروستر)',
    unitEn: 'Ch 4: Fundamentals of Light (Polarization, Malus & Brewster)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'refraction',
    problemAr: 'كيف تعمل مرشحات الاستقطاب على حجب الضوء المتذبذب؟ وما زاوية بروستر للاستقطاب التام بالانعكاس؟',
    problemEn: 'How do polarizing filters block reflected glare, and what is Brewster\'s angle for total reflection polarization?',
    formula: 'I = I₀ · cos²(θ) (قانون مالوس)   |   tan θ_p = n (قانون بروستر)',
    theoryAr: 'الضوء المنعكس عن الأسطح الملساء كالماء والزجاج يكون مستقطباً جزئياً في اتجاه موازٍ للسطح. عند زاوية بروستر (tan θp = n) يكون الضوء المنعكس مستقطباً خطياً بنسبة 100%. ويوضح قانون مالوس تناقص شدة الضوء بتغير زاوية المرشحين.',
    theoryEn: 'Light reflected off glass or water becomes partially polarized parallel to the surface. At Brewster\'s angle (tan θp = n) reflected light is 100% linearly polarized. Malus\'s law describes transmission intensity.',
    materialsAr: ['مرشحا استقطاب دواران', 'مصدر ضوء', 'لوح زجاجي مصقول', 'منقلة'],
    materialsEn: ['Two rotating polarizers', 'Light source', 'Polished glass plate', 'Protractor'],
    stepsAr: [
      'انظر لضوء المصباح عبر مرشح استقطاب ودوّره: لا يتغير السطوع لأن الضوء غير مستقطب.',
      'ضع مرشحاً ثانياً ودوّره: يتناقص السطوع حتى ينعدم عند زاوية 90° (تعامد محوري الاستقطاب).',
      'اعكس ضوء المصباح عن لوح زجاجي، وانظر إليه عبر مرشح مستقطب مع تدويره لقياس زاوية بروستر θp.'
    ],
    stepsEn: [
      'Look at lamp through single polarizer and rotate: intensity stays constant (unpolarized source).',
      'Add second analyzer and rotate: brightness dims to zero at 90° cross-polarization.',
      'Reflect light off glass plate, viewing through analyzer to identify Brewster\'s extinction angle θp.'
    ],
    defaultData: {
      labelsAr: ['زاوية المحورين θ (°)', 'cos(θ)', 'cos²(θ) (الشدة المتوقعة I/I₀)', 'الشدة المقيسة %'],
      labelsEn: ['Axis Angle θ (°)', 'cos(θ)', 'cos²(θ) (Predicted I/I₀)', 'Measured Intensity %'],
      values: [
        ['0', '1.000', '1.000', '100%'],
        ['30', '0.866', '0.750', '74%'],
        ['45', '0.707', '0.500', '51%'],
        ['60', '0.500', '0.250', '26%'],
        ['90 (تعامد)', '0.000', '0.000', '0%']
      ],
      formulaPromptAr: 'I = I₀ · cos²(θ) | زاوية بروستر للزجاج (n=1.52) هي θp ≈ 56.7°',
      formulaPromptEn: 'I = I₀ · cos²(θ) | Brewster angle for glass (n=1.52) is θp ≈ 56.7°'
    },
    computeResult: row => {
      const angle = parseFloat(String(row[0])) || 0;
      const rad = (angle * Math.PI) / 180;
      const pred = Math.pow(Math.cos(rad), 2) * 100;
      return {
        resultText: `النسبة النظرية لقانون مالوس: ${pred.toFixed(1)}% | زاوية بروستر للزجاج = 56.7°`,
        isAccurate: true
      };
    }
  },
  {
    id: 8,
    titleAr: 'تجربة 8: أين تتكون صورتك في المرآة؟',
    titleEn: 'Exp 8: Where is your image formed in a mirror?',
    unitAr: 'الفصل 5: الانعكاس والمرايا (المرآة المستوية وتتبع الأشعة)',
    unitEn: 'Ch 5: Reflection & Mirrors (Plane Mirrors & Ray Tracing)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'lenses',
    problemAr: 'أين يقع موضع الصورة المتكونة في المرآة المستوية؟ وكيف ترتبط أبعاد الصورة بأبعاد الجسم؟',
    problemEn: 'Where is the image located in a plane mirror, and how do image dimensions compare to the object?',
    formula: 'd_i = -d_o   |   h_i = h_o   |   m = +1.0',
    theoryAr: 'تكون المرآة المستوية صورة خيالية (وهمية) خلف المرآة ناتجة عن التقاء امتدادات الأشعة المنعكسة. صفات الصورة: معتدلة، مساوية للجسم في الحجم (التكبير m=1)، معكوسة جانبياً، وبعدها خلف المرآة يساوي تماماً بعد الجسم أمامها (|di| = do).',
    theoryEn: 'A plane mirror produces a virtual image formed behind the mirror by intersection of backward extensions. Attributes: upright, same size (m = 1), laterally inverted, and |di| = do.',
    materialsAr: ['مرآة مستوية', 'لوح فلين', 'دبابيس طبع طويلة', 'مسطرة مترية', 'ورقة بيضاء'],
    materialsEn: ['Plane mirror', 'Cork board', 'Long pins', 'Metric ruler', 'White paper'],
    stepsAr: [
      'ارسم خط موضع المرآة M، وثبت دبوساً رأسياً عند النقطة O على بعد 4 cm أمام المرآة.',
      'باستخدام مسطرة ودبوسين إضافيين، حدد خطي الرؤية لشعاعين منعكسين بزوايا مختلفة.',
      'أزل المرآة ومد خطي الرؤية بخطوط متقطعة خلف المرآة حتى يتقاطعا عند نقطة الصورة I.',
      'قس المسافة من المرآة إلى O وإلى I للتأكد من تساويهما التام.'
    ],
    stepsEn: [
      'Draw mirror line M and plant object pin O at 4 cm in front of mirror.',
      'Sight reflection from two different vantage points aligning guide pins along reflected rays.',
      'Remove mirror and extend sightlines backward with dashed lines until they intersect at point I.',
      'Measure distances from mirror line to O and to I to verify |di| = do.'
    ],
    defaultData: {
      labelsAr: ['بعد الجسم do (cm)', 'بعد الصورة di خلف المرآة (cm)', 'طول الجسم ho (cm)', 'طول الصورة hi (cm)'],
      labelsEn: ['Object Distance do (cm)', 'Image Distance di (cm)', 'Object Height ho (cm)', 'Image Height hi (cm)'],
      values: [
        ['4.0', '4.0', '3.0', '3.0'],
        ['8.0', '8.0', '3.0', '3.0'],
        ['12.0', '12.0', '5.0', '5.0']
      ],
      formulaPromptAr: 'معادلة المرآة المستوية: |di| = do | التكبير m = +1.0 (معتدلة ومساوية)',
      formulaPromptEn: 'Plane mirror law: |di| = do | Magnification m = +1.0 (upright and true-size)'
    },
    computeResult: row => {
      const doVal = parseFloat(String(row[0])) || 4;
      const diVal = parseFloat(String(row[1])) || 4;
      const diff = Math.abs(doVal - diVal);
      return {
        resultText: `|di| = ${diVal} cm | do = ${doVal} cm | التكبير m = +1.0 (معتدلة وتقديرية)`,
        isAccurate: diff < 0.2
      };
    }
  },
  {
    id: 9,
    titleAr: 'تجربة 9: العدسات المحدبة والعدسات المقعرة',
    titleEn: 'Exp 9: Convex and Concave Lenses',
    unitAr: 'الفصل 6: الانكسار والعدسات (معادلة العدسة وتكوين الصور)',
    unitEn: 'Ch 6: Refraction & Lenses (Thin Lens Formula & Images)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'lenses',
    problemAr: 'ما الشروط الواجب توافرها لتكوين صور حقيقية وأخرى خيالية باستخدام عدسة محدبة ومقعرة؟',
    problemEn: 'What conditions dictate real versus virtual image formation for convex and concave lenses?',
    formula: '1/f = 1/d_o + 1/d_i   |   m = h_i / h_o = -d_i / d_o',
    theoryAr: 'العدسة المحدبة (المجمعة) تكون صوراً حقيقية مقلوبة عندما يوضع الجسم على بعد أكبر من البعد البؤري (do > f)، وتكون الصورة مصغرة إذا كان do > 2f ومكبرة إذا كان 2f > do > f. وتكون صورة خيالية معتدلة مكبرة إذا كان do < f. أما العدسة المقعرة فتكون دائماً صوراً خيالية معتدلة مصغرة.',
    theoryEn: 'Convex lens forms real inverted images when do > f (reduced if do > 2f, magnified if 2f > do > f), and virtual upright magnified when do < f. Concave lens always produces virtual upright reduced images.',
    materialsAr: ['عدسة محدبة رقيقة', 'عدسة مقعرة', 'مصدر ضوء (شمعة / مصباح)', 'شاشة كرتونية بيضاء', 'مسطرة مترية وحامل عدسات'],
    materialsEn: ['Thin convex lens', 'Concave lens', 'Light source (candle/bulb)', 'White screen card', 'Meter stick & optical bench'],
    stepsAr: [
      'حدد البعد البؤري f للعدسة بتجميع ضوء نافذة بعيدة على الشاشة وقياس المسافة.',
      'ضع الجسم عند مسافة do > 2f وحرك الشاشة حتى تظهر صورة حادة مقلوبة ومصغرة.',
      'ضع الجسم بين 2f و f وحرك الشاشة لتجد صورة حقيقية مقلوبة ومكبرة.',
      'قرب الجسم إلى do < f وانظر خلال العدسة لمشاهدة صورة خيالية معتدلة مكبرة.'
    ],
    stepsEn: [
      'Measure lens focal length f by projecting distant window light onto the screen.',
      'Position object at do > 2f and adjust screen for a sharp, inverted, reduced real image.',
      'Move object between 2f and f to catch an inverted magnified real image.',
      'Bring object inside focal length (do < f) and look through lens to see an upright magnified virtual image.'
    ],
    defaultData: {
      labelsAr: ['موقع الجسم do (cm)', 'موقع الصورة di (cm)', 'البعد البؤري المحسوب f (cm)', 'نوع وصفات الصورة'],
      labelsEn: ['Object Distance do (cm)', 'Image Distance di (cm)', 'Computed Focal f (cm)', 'Image Type & Properties'],
      values: [
        ['30.0', '15.0', '10.0', 'حقيقية، مقلوبة، مصغرة (m = -0.5)'],
        ['20.0', '20.0', '10.0', 'حقيقية، مقلوبة، مساوية للجسم (m = -1.0)'],
        ['15.0', '30.0', '10.0', 'حقيقية، مقلوبة، مكبرة (m = -2.0)'],
        ['6.0', '-15.0', '10.0', 'خيالية، معتدلة، مكبرة (m = +2.5)']
      ],
      formulaPromptAr: '1/f = 1/do + 1/di | m = -di / do',
      formulaPromptEn: '1/f = 1/do + 1/di | m = -di / do'
    },
    computeResult: row => {
      const doVal = parseFloat(String(row[0])) || 30;
      const diVal = parseFloat(String(row[1])) || 15;
      const f = (doVal * diVal) / (doVal + diVal);
      const m = -diVal / doVal;
      return {
        resultText: `البعد البؤري f = ${f.toFixed(1)} cm | التكبير m = ${m.toFixed(2)} (${m < 0 ? 'مقلوبة' : 'معتدلة'})`,
        isAccurate: Math.abs(f - 10) < 0.5
      };
    }
  },
  {
    id: 10,
    titleAr: 'تجربة 10: كيف ينحرف الضوء؟',
    titleEn: 'Exp 10: How does light refract?',
    unitAr: 'الفصل 6: الانكسار والعدسات (قانون سنل ومتوازي المستطيلات)',
    unitEn: 'Ch 6: Refraction & Lenses (Snell\'s Law & Glass Block)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'refraction',
    problemAr: 'كيف تقيس زاوية انكسار الضوء في الزجاج؟ وكيف تثبت أن معامل الانكسار n مقدار ثابت؟',
    problemEn: 'How do you measure angle of refraction in glass and verify that refractive index n is constant?',
    formula: 'n₁ · sin(θ₁) = n₂ · sin(θ₂)   |   n_glass = sin(θ_air) / sin(θ_glass)',
    theoryAr: 'عند انتقال الضوء من الهواء إلى وسط أكبر كثافة بصرية كالزجاج، ينكسر مقترباً من العمود المقام لأن سرعته تقل في الزجاج. وينص قانون سنل على ثبات النسبة بين جيب زاوية السقوط وجيب زاوية الانكسار مساوية لمعامل انكسار الوسط.',
    theoryEn: 'When light enters optically denser medium like glass, it bends towards the normal due to decreased wave speed. Snell\'s law proves sin(θ1)/sin(θ2) remains constant equal to refractive index n.',
    materialsAr: ['متوازي مستطيلات زجاجي شفاف', 'لوح فلين', 'دبابيس طبع ومسطرة', 'منقلة دقيقة', 'ورق رسم'],
    materialsEn: ['Rectangular glass block', 'Cork board', 'Pins and ruler', 'Precision protractor', 'White paper'],
    stepsAr: [
      'حدد حدود متوازي المستطيلات الزجاجي وارسم العمود المقام N.',
      'ثبت دبوسين عند زاوية سقوط θ1 = 30°، وانظر من الوجه المقابل لتحديد خط خروج الشعاع المنكسر.',
      'قس زاوية الانكسار داخل الزجاج θ2، واحسب sin θ1 / sin θ2.',
      'كرر التجربة لزوايا 45° و 60° وتحقق من ثبات معامل انكسار الزجاج (n ≈ 1.52).'
    ],
    stepsEn: [
      'Trace outline of rectangular glass block and construct normal line N.',
      'Align two pins at incident angle θ1 = 30°, looking through opposite edge to trace exiting refracted ray.',
      'Measure angle of refraction θ2 in glass, calculating sin(θ1) / sin(θ2).',
      'Repeat for 45° and 60° to verify constancy of glass index (n ≈ 1.52).'
    ],
    defaultData: {
      labelsAr: ['زاوية السقوط θ₁ (°)', 'زاوية الانكسار θ₂ (°)', 'sin(θ₁)', 'sin(θ₂)', 'معامل الانكسار n₂'],
      labelsEn: ['Incident Angle θ₁ (°)', 'Refracted Angle θ₂ (°)', 'sin(θ₁)', 'sin(θ₂)', 'Index n₂'],
      values: [
        ['30.0', '19.2', '0.500', '0.329', '1.52'],
        ['45.0', '27.7', '0.707', '0.465', '1.52'],
        ['60.0', '34.7', '0.866', '0.569', '1.52']
      ],
      formulaPromptAr: 'n₂ = sin(θ₁) / sin(θ₂) | زجاج التاج المعياري n = 1.52',
      formulaPromptEn: 'n₂ = sin(θ₁) / sin(θ₂) | Standard crown glass n = 1.52'
    },
    computeResult: row => {
      const theta1 = parseFloat(String(row[0])) || 30;
      const theta2 = parseFloat(String(row[1])) || 19.2;
      const s1 = Math.sin((theta1 * Math.PI) / 180);
      const s2 = Math.sin((theta2 * Math.PI) / 180);
      const n = s1 / (s2 || 1);
      return {
        resultText: `معامل الانكسار n = ${n.toFixed(3)} (مطابق لزجاج التاج n ≈ 1.52)`,
        isAccurate: Math.abs(n - 1.52) < 0.05
      };
    }
  },
  {
    id: 11,
    titleAr: 'تجربة 11: ما الطول الموجي؟',
    titleEn: 'Exp 11: What is the wavelength of light?',
    unitAr: 'الفصل 7: التداخل والحيود (تجربة شقي يونج للضوء المترابط)',
    unitEn: 'Ch 7: Interference & Diffraction (Young\'s Double-Slit)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'quantum',
    problemAr: 'كيف يمكن استخدام نمط تداخل الشق المزدوج لقياس الطول الموجي للضوء بدقة النانومتر؟',
    problemEn: 'How can double-slit interference fringes measure optical wavelengths with nanometer precision?',
    formula: 'λ = (x · d) / L   |   x_m = (m · λ · L) / d',
    theoryAr: 'أثبت توماس يونج عام 1801 الطبيعة الموجية للضوء؛ فعند مرور ضوء مترابط أحادي اللون عبر شقين متقاربين تفصلهما مسافة d، تتداخل الموجات على شاشة تبعد مسافة L لتكون أهداباً مضيئة ومعتمة، ويكون الهدب المضيء الأول على بعد x يعطي الطول الموجي بدقة.',
    theoryEn: 'Thomas Young (1801) demonstrated wave nature of light: coherent monochromatic light passing twin slits separated by d projects bright and dark interference fringes on screen at distance L.',
    materialsAr: ['مصدر ليزر أحمر (He-Ne / 633 nm)', 'شريحة شق مزدوج معلومة d', 'شاشة بيضاء', 'مسطرة مترية وشريط قياس'],
    materialsEn: ['Red laser (633 nm / diode)', 'Calibrated double-slit slide (d)', 'White screen card', 'Meter stick & tape'],
    stepsAr: [
      'وجه شعاع الليزر عبر الشق المزدوج نحو شاشة تبعد مسافة L = 1.0 m أو أكثر.',
      'قس المسافة الفاصلة بين الشقين d على الشريحة (مثلاً 0.15 mm).',
      'قس المسافة x بين مركز الهدب المركزي المضيء ومركز الهدب المضيء ذي الرتبة الأولى m=1.',
      'طبق المعادلة λ = (x · d) / L واحسب الطول الموجي بوحدة نانومتر وقارنه بقيمة الليزر.'
    ],
    stepsEn: [
      'Direct laser through double slit onto white screen placed at distance L = 1.0 m.',
      'Note calibrated slit spacing d from slide (e.g. 0.15 mm).',
      'Measure distance x from central bright maximum to first-order bright fringe m=1.',
      'Calculate wavelength λ = (x * d) / L in nanometers and evaluate error against laser spec.'
    ],
    defaultData: {
      labelsAr: ['المسافة للشقين d (mm)', 'المسافة للشاشة L (m)', 'المسافة بين الهدبين x (mm)', 'الطول الموجي المحسوب λ (nm)'],
      labelsEn: ['Slit Spacing d (mm)', 'Screen Distance L (m)', 'Fringe Spacing x (mm)', 'Computed λ (nm)'],
      values: [
        ['0.150', '1.50', '6.33', '633'],
        ['0.100', '1.20', '7.60', '633'],
        ['0.150', '1.00', '3.60', '540 (ليزر أخضر)']
      ],
      formulaPromptAr: 'λ = (x · d) / L | ليزر الهيليوم-نيون المعياري = 632.8 nm',
      formulaPromptEn: 'λ = (x · d) / L | Standard He-Ne laser = 632.8 nm'
    },
    computeResult: row => {
      const d = (parseFloat(String(row[0])) || 0.15) * 1e-3;
      const L = parseFloat(String(row[1])) || 1.5;
      const x = (parseFloat(String(row[2])) || 6.33) * 1e-3;
      const lamNm = ((x * d) / L) * 1e9;
      return {
        resultText: `الطول الموجي المحسوب λ = ${lamNm.toFixed(1)} nm`,
        isAccurate: Math.abs(lamNm - 633) < 20 || Math.abs(lamNm - 540) < 20
      };
    }
  },
  {
    id: 12,
    titleAr: 'تجربة 12: ما الهولوجرام؟',
    titleEn: 'Exp 12: What is Holography?',
    unitAr: 'الفصل 7: التداخل والحيود (الهولوجرافيا والتصوير المجسم)',
    unitEn: 'Ch 7: Interference (Holography & 3D Wavefront Reconstruction)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'quantum',
    problemAr: 'كيف يسجل الهولوجرام طور وسعة الموجة الضوئية لإنتاج صورة مجسمة ثلاثية الأبعاد بدقة؟',
    problemEn: 'How does a hologram record both amplitude and phase to reconstruct a true 3D image?',
    formula: 'I_hologram = |E_ref + E_obj|² = |E_ref|² + |E_obj|² + E_ref*·E_obj + E_ref·E_obj*',
    theoryAr: 'ابتكر دينس جابور عام 1947 مبدأ الهولوجرام؛ حيث لا يكتفي بتسجيل شدة الضوء كالتصوير الفوتوغرافي العادي بل يسجل تداخل حزمة الليزر المرجعية مع الحزمة المنعكسة عن الجسم (السعة والطور معاً). عند إضاءة الفيلم بنفس الطول الموجي، يعاد بناء جبهة الموجة الأصلية ثلاثية الأبعاد!',
    theoryEn: 'Invented by Dennis Gabor (1947), holography records both phase and amplitude through interference between an undisturbed reference beam and object-scattered light, recreating full 3D wavefront.',
    materialsAr: ['ليزر متسع الحزمة He-Ne', 'مرآة مقعرة ومرايا مستوية', 'فيلم هولوجرافي حساس', 'طاولة خرسانية معزولة عن الاهتزازات'],
    materialsEn: ['Expanded He-Ne laser beam', 'Concave & plane mirrors', 'Holographic film emulsion', 'Vibration-isolated concrete table'],
    stepsAr: [
      'ثبت الأجسام والمرآة والفيلم على طاولة خرسانية لتخميد الاهتزازات الميكانيكية تماماً.',
      'قسّم حزمة الليزر إلى حزمة مرجعية وحزمة تسقط على الجسم وتنعكس نحو الفيلم.',
      'عرّض الفيلم لزمن محدد (20 ثانية) في غرفة مظلمة، ثم حمّض الفيلم وجففه.',
      'سلّط ضوءاً أبيض أو ليزرياً على الفيلم لمشاهدة مجسم الجسم ثلاثي الأبعاد بأبعاده الحقيقية.'
    ],
    stepsEn: [
      'Rig optics on vibration-damped slab to prevent microscopic phase blurring during exposure.',
      'Split laser into reference wavefront and object-illuminating beam.',
      'Expose film for calibrated time (20 s) in dark room, then develop and dry.',
      'Illuminate processed hologram to view reconstructed parallax-rich 3D virtual image.'
    ],
    defaultData: {
      labelsAr: ['زمن التعريض (s)', 'نوع الهولوجرام', 'طريقة الرؤية', 'جودة العمق والأبعاد'],
      labelsEn: ['Exposure Time (s)', 'Hologram Type', 'Viewing Method', 'Depth & Parallax Quality'],
      values: [
        ['20.0', 'هولوجرام عاكس (Reflection)', 'ضوء أبيض ساطع', 'عمق ثلاثي أبعاد ممتاز مع تغير المنظور'],
        ['15.0', 'هولوجرام نافذ (Transmission)', 'شعاع ليزر متسع', 'دقة فائقة في الخطوط العميقة والمنظور']
      ],
      formulaPromptAr: 'تداخل حزمتين مترابطتين: السعة والطور يُسجلان على المستحلب',
      formulaPromptEn: 'Coherent interference: Phase and amplitude preserved on emulsion'
    },
    computeResult: row => {
      const time = parseFloat(String(row[0])) || 20;
      return {
        resultText: `زمن التعريض = ${time} s | تسجيل سعة وطور الموجة بنجاح ثلاثي الأبعاد!`,
        isAccurate: time >= 10 && time <= 30
      };
    }
  },
  {
    id: 13,
    titleAr: 'تجربة 13: كيف تشحن الأجسام؟',
    titleEn: 'Exp 13: How are objects charged?',
    unitAr: 'الفصل 8: الكهرباء الساكنة (طرق الشحن والكشاف الكهربائي)',
    unitEn: 'Ch 8: Static Electricity (Charging Methods & Electroscope)',
    stationTarget: 'electromagnetism',
    problemAr: 'كيف تميز بين الشحن بالدلك، التوصيل، والحث الكهروسكوني؟ وما دور التأريض في اكتساب شحنة دائمة؟',
    problemEn: 'How do you differentiate charging by friction, conduction, and induction using grounding?',
    formula: 'q_net = conserved   |   F = k_e · (|q₁ · q₂|) / r²',
    theoryAr: 'الشحنة الكهربائية محفوظة ولا تفنى ولا تستحدث، بل تنفصل. بالدلك تنتقل الإلكترونات بين مادتين بحسب سلسلة الدلك. بالتوصيل تكتسب الأجسام شحنة مماثلة للمؤثر. بالحث مع التأريض تكتسب الأجسام شحنة مخالفة لشحنة الجسم المؤثر دون فقدان شحنته.',
    theoryEn: 'Charge is strictly conserved. Friction transfers electrons based on triboelectric series. Conduction shares identical charge. Induction with grounding leaves an opposite permanent charge.',
    materialsAr: ['قضيب نايلون ومطاط صلب', 'قضيب زجاجي', 'قطعة صوف وحرير', 'كشاف كهربائي بصفائح ذهبية', 'كرة بيلسان معلقة'],
    materialsEn: ['Hard nylon & rubber rods', 'Glass rod', 'Wool & silk cloths', 'Gold-leaf electroscope', 'Suspended pith ball'],
    stepsAr: [
      'ادلك قضيب النايلون بالصوف (شحنة سالبة) وقربه من كرة البيلسان المتعادلة لمشاهدة الجذب بالحث ثم التنافر بعد الملامسة والتوصيل.',
      'اشحن الكشاف الكهربائي بالتوصيل بلمس قرصه بقضيب سالب: تنفرج الورقتان بشحنة سالبة.',
      'اشحن الكشاف بالحث: قرب القضيب السالب دون مالمسة، المس القرص بإصبعك لتأريضه، ارفع إصبعك أولاً ثم أبعد القضيب: يشحن الكشاف بشحنة موجبة دائمة!'
    ],
    stepsEn: [
      'Rub nylon rod with wool (negative), approach neutral pith ball to witness induced attraction, then contact repulsion.',
      'Charge electroscope by conduction: touching disc spreads negative charge, causing leaf repulsion.',
      'Charge by induction: hold negative rod near disc, touch disc to ground, release finger then withdraw rod: leaves positive!'
    ],
    defaultData: {
      labelsAr: ['طريقة الشحن', 'الجسم المؤثر', 'شحنة المؤثر', 'شحنة الجسم المتولدة', 'سلوك الورقتين'],
      labelsEn: ['Charging Method', 'Inducer Body', 'Inducer Charge', 'Induced Object Charge', 'Leaf Behavior'],
      values: [
        ['الدلك (Friction)', 'مطاط + صوف', 'سالب (-) للمطاط', 'موجب (+) للصوف', 'تجاذب متبادل'],
        ['التوصيل (Conduction)', 'قضيب سالب يلمس القرص', 'سالب (-)', 'سالب (-) متماثلة', 'انفراج الورقتين'],
        ['الحث + التأريض (Induction)', 'قضيب سالب مقرب دون لمس', 'سالب (-)', 'موجب (+) مخالفة', 'انفراج دائم بشحنة موجبة']
      ],
      formulaPromptAr: 'الشحن بالتوصيل = نفس الشحنة | الشحن بالحث مع التأريض = شحنة معاكسة',
      formulaPromptEn: 'Conduction = Same sign | Induction + Grounding = Opposite sign'
    },
    computeResult: row => {
      const method = String(row[0]);
      return {
        resultText: `طريقة الشحن: ${method} | الشحنة محفوظة تماماً وفق مبدأ حفظ الشحنة الكهربائية`,
        isAccurate: true
      };
    }
  },
  {
    id: 14,
    titleAr: 'تجربة 14: هل يمكن تخزين كميات كبيرة من الشحنات؟',
    titleEn: 'Exp 14: Can large amounts of charge be stored?',
    unitAr: 'الفصل 9: المجالات الكهربائية (المكثفات، التوالي والتوازي، وزمن الشحن)',
    unitEn: 'Ch 9: Electric Fields (Capacitors, Series/Parallel, & Time Constant)',
    stationTarget: 'electromagnetism',
    problemAr: 'كيف تختلف السعة المكافئة وطاقة التخزين بين توصيل المكثفات على التوازي والتوالي؟ وما ثابت الزمن RC؟',
    problemEn: 'How do equivalent capacitance and stored energy differ between parallel and series configs?',
    formula: 'C = q / ΔV   |   C_parallel = C₁ + C₂   |   1/C_series = 1/C₁ + 1/C₂   |   τ = R · C',
    theoryAr: 'المكثف يخزن الطاقة في مجاله الكهربائي. عند توصيل مكثفين متماثلين سعة كل منهما 1 Farad على التوازي تتضاعف السعة (Ceq = 2 F) وتزداد الطاقة المخزنة ومدة إضاءة الدايود الضوئي. بينما على التوالي تقل السعة إلى النصف (Ceq = 0.5 F) ويقل زمن التفريغ.',
    theoryEn: 'Capacitors store energy in electric fields. Parallel connection doubles capacitance (Ceq = C1 + C2), doubling stored energy and discharge time. Series halves capacitance (1/Ceq = 1/C1 + 1/C2).',
    materialsAr: ['مكثفان سعة كل منهما 1 Farad', 'مولد يدوي أو بطارية 9V', 'ملي أميتر ومفتاح', 'مقاوم 47 kΩ', 'دايود مشع LED وساعة إيقاف'],
    materialsEn: ['Two 1 Farad supercapacitors', 'Hand dynamo or 9V battery', 'mA meter & switch', '47 kΩ resistor', 'LED & stopwatch'],
    stepsAr: [
      'اشحن مكثفاً مفرداً 1 F بالبطارية، ثم وصله مع الدايود المشع LED وقس زمن إضاءته بالثواني.',
      'وصل المكثفين على التوازي (Ceq = 2 F) واشحنهما، ثم قس زمن إضاءة الدايود: ستلاحظ تضاعف المدة!',
      'وصل المكثفين على التوالي (Ceq = 0.5 F) واشحنهما وقس مدة إضاءة الدايود: ستلاحظ انخفاض المدة إلى النصف.'
    ],
    stepsEn: [
      'Charge single 1 F capacitor, discharge through LED and record illumination duration.',
      'Connect both in parallel (Ceq = 2 F), charge and time LED glow: duration doubles!',
      'Connect in series (Ceq = 0.5 F), charge and time LED glow: duration drops to half.'
    ],
    defaultData: {
      labelsAr: ['توصيل المكثفات', 'السعة المكافئة Ceq (F)', 'تيار الشحن الأولي (mA)', 'زمن إضاءة الدايود LED (s)'],
      labelsEn: ['Configuration', 'Equivalent Ceq (F)', 'Initial Current (mA)', 'LED Glow Duration (s)'],
      values: [
        ['مكثف مفرد (Single 1F)', '1.0', '150', '28.0'],
        ['مكثفان على التوازي (Parallel)', '2.0', '300', '56.0'],
        ['مكثفان على التوالي (Series)', '0.5', '75', '14.0']
      ],
      formulaPromptAr: 'C_parallel = C₁ + C₂ = 2 F | C_series = (C₁·C₂)/(C₁+C₂) = 0.5 F',
      formulaPromptEn: 'C_parallel = C1 + C2 = 2 F | C_series = 0.5 F'
    },
    computeResult: row => {
      const ceq = parseFloat(String(row[1])) || 1.0;
      const t = parseFloat(String(row[3])) || 28;
      return {
        resultText: `السعة Ceq = ${ceq} F | مدة تفريغ الطاقة = ${t} s (تتناسب طردياً مع السعة)`,
        isAccurate: true
      };
    }
  },
  {
    id: 15,
    titleAr: 'تجربة 15: قانون سنل والانكسار والزاوية الحرجة والألياف البصرية',
    titleEn: 'Exp 15: Snell\'s Law, Critical Angle & Fiber Optics',
    unitAr: 'فيزياء 3: انكسار الضوء والبصريات (قانون سنل والانعكاس الكلي)',
    unitEn: 'Physics 3: Light Refraction & Optics (Snell\'s Law & TIR)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'refraction',
    problemAr: 'كيف ينكسر الضوء بين وسطين مختلفين الكثافة؟ ومتى يحدث الانعكاس الكلي التام داخل كابل الألياف البصرية؟',
    problemEn: 'How does light refract across different media, and when does total internal reflection occur in optical fibers?',
    formula: 'n₁ · sin θ₁ = n₂ · sin θ₂   |   sin θ_c = n₂ / n₁   |   NA = √(n₁² - n₂²)',
    theoryAr: 'ينص قانون سنل على ثبات حاصل ضرب معامل انكسار الوسط في جيب زاوية السقوط (n₁·sin θ₁ = n₂·sin θ₂). وعندما ينتقل الضوء من وسط أكبر كثافة ضوئية (n₁) إلى وسط أقل كثافة (n₂) بزاوية سقوط تتجاوز الزاوية الحرجة (θ₁ > θ_c)، ينعكس الضوء بنسبة 100% داخل الوسط الأول دون أي نفاذ للوسط الثاني، وهو المبدأ الأساسي لكابلات الألياف البصرية والمناظير الطبية.',
    theoryEn: 'Snell\'s Law dictates n1·sin θ1 = n2·sin θ2. When light travels from denser to rarer medium exceeding critical angle θc, 100% Total Internal Reflection occurs, guiding signals through optical fibers.',
    materialsAr: ['حوض سنل المائي الزجاجي 3D', 'ليزر أحمر 632.8 nm', 'منقلة دائرية بصرية 360°', 'ماء نقي (n=1.333)', 'عينة كابل ألياف بصرية'],
    materialsEn: ['3D Snell glass water tank', '632.8 nm red laser', '360° optical protractor', 'Pure water (n=1.333)', 'Fiber optic cable'],
    stepsAr: [
      'وجه شعاع الليزر من الهواء إلى الماء بزاوية سقوط θ₁=30° وقس زاوية الانكسار θ₂ (تجدها 22.1°).',
      'اعكس اتجاه السقوط (من الماء n1=1.33 إلى الهواء n2=1.00)، وزد زاوية السقوط تدريجياً.',
      'رصد الزاوية الحرجة θ_c عندما ينكسر الشعاع مماسياً للسطح الفاصل (θ₂=90°)، ستجدها 48.7°.',
      'زد زاوية السقوط عن 48.7° ولاحظ الانعكاس الكلي الداخلي التام 100% وتطبيقه في الألياف البصرية.'
    ],
    stepsEn: [
      'Direct laser from air into water at θ1=30° and measure refracted angle θ2 (22.1°).',
      'Reverse media from water to air, increasing incident angle progressively.',
      'Record critical angle θc when ray grazes boundary at θ2=90° (48.7°).',
      'Exceed 48.7° to observe 100% Total Internal Reflection and its fiber optic application.'
    ],
    defaultData: {
      labelsAr: ['الوسط 1 ➔ الوسط 2', 'معامل n₁', 'معامل n₂', 'زاوية السقوط θ₁', 'زاوية الانكسار θ₂'],
      labelsEn: ['Medium 1 -> 2', 'Index n1', 'Index n2', 'Angle θ1', 'Angle θ2'],
      values: [
        ['هواء ➔ ماء', '1.000', '1.333', '30.0°', '22.1°'],
        ['هواء ➔ زجاج كراون', '1.000', '1.520', '45.0°', '27.7°'],
        ['ماء ➔ هواء (حرجة)', '1.333', '1.000', '48.7°', '90.0° (مماس)'],
        ['زجاج ➔ هواء (TIR)', '1.520', '1.000', '50.0°', 'TIR (انعكاس تام)']
      ],
      formulaPromptAr: 'n₁·sin θ₁ = n₂·sin θ₂ | θ_c = arcsin(n₂/n₁)',
      formulaPromptEn: 'n1·sin θ1 = n2·sin θ2 | θc = arcsin(n2/n1)'
    },
    computeResult: row => {
      const n1 = parseFloat(String(row[1])) || 1.0;
      const n2 = parseFloat(String(row[2])) || 1.0;
      const t1 = parseFloat(String(row[3])) || 30;
      const sinT2 = (n1 / n2) * Math.sin((t1 * Math.PI) / 180);
      const isTir = sinT2 > 1.0;
      const t2Deg = !isTir ? (Math.asin(sinT2) * 180) / Math.PI : 90;
      return {
        resultText: isTir
          ? `انعكاس كلي داخلي تام (TIR)! θ₁ (${t1}°) > الزاوية الحرجة (${(Math.asin(n2/n1)*180/Math.PI).toFixed(1)}°)`
          : `زاوية الانكسار المحسوبة θ₂ = ${t2Deg.toFixed(1)}° (مطابقة لقانون سنل)`,
        isAccurate: true
      };
    }
  },
  {
    id: 16,
    titleAr: 'تجربة 16: المرايا الكروية المقعرة والمحدبة ومعادلة التكبير',
    titleEn: 'Exp 16: Spherical Concave & Convex Mirrors & Magnification',
    unitAr: 'فيزياء 3: الانعكاس والمرايا (معادلة المرآة الكروية والتكبير)',
    unitEn: 'Physics 3: Reflection & Mirrors (Mirror Equation & Magnification)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'lenses',
    problemAr: 'كيف تتكون الصور في المرايا المقعرة والمحدبة؟ وما العلاقة بين بعد الجسم do وبُعد الصورة di والتكبير m؟',
    problemEn: 'How do images form in concave/convex spherical mirrors, and what is the relation between do, di, and magnification m?',
    formula: '1/f = 1/d_o + 1/d_i   |   m = -d_i / d_o = h_i / h_o   |   f = R / 2',
    theoryAr: 'المرآة المقعرة (بؤرتها موجبة f>0) تجمع الأشعة وتكون صوراً حقيقية مقلوبة عندما يقع الجسم خارج البؤرة، وصورة خيالية معتدلة مكبرة عندما يقع بين البؤرة والمرآة (do < f) كمرآة الحلاقة. بينما المرآة المحدبة (بؤرتها سالبة f<0) تفرق الأشعة وتكون دائماً صوراً خيالية معتدلة مصغرة خلف المرآة وتستخدم في مرايا السيارات الجانبية.',
    theoryEn: 'Concave mirrors (f>0) form real inverted images when do>f, and virtual upright magnified images when do<f. Convex mirrors (f<0) always produce virtual upright diminished images.',
    materialsAr: ['مرآة مقعرة بؤرية 10 cm', 'مرآة محدبة بؤرية 10 cm', 'مسطرة بصرية منزلقة', 'مصدر ضوئي (شمعة)', 'شاشة استقبال بيضاء'],
    materialsEn: ['10 cm concave mirror', '10 cm convex mirror', 'Optical bench ruler', 'Light source', 'White screen'],
    stepsAr: [
      'ضع الشمعة أمام المرآة المقعرة خلف مركز التكور (do = 30 cm > 2f)، استقبل الصورة على الشاشة: ستجدها حقيقية مقلوبة مصغرة بين F و C.',
      'حرك الجسم إلى مركز التكور تماماً (do = 20 cm = 2f): ستجد الصورة عند 20 cm بنفس حجم الجسم (m = -1).',
      'قرب الشمعة لتصبح بين F والمرآة (do = 5 cm < f): لا يمكن استقبالها على الشاشة، بل تظهر بالمرآة كصورة خيالية معتدلة مكبرة.',
      'استبدل المرآة بالمحدبة: ستجد الصورة دائماً خيالية معتدلة مصغرة.'
    ],
    stepsEn: [
      'Place candle beyond 2f (do=30cm), capture image on screen: real, inverted, diminished between F and C.',
      'Move object to 2f (do=20cm): image forms at 20cm, equal size (m=-1).',
      'Move object inside focal length (do=5cm<f): virtual, upright, magnified image behind mirror.',
      'Switch to convex mirror: image is always virtual, upright, and diminished.'
    ],
    defaultData: {
      labelsAr: ['نوع المرآة', 'البعد البؤري f (cm)', 'بعد الجسم do (cm)', 'بعد الصورة di (cm)', 'معامل التكبير m'],
      labelsEn: ['Mirror Type', 'Focal Length f', 'Object Distance do', 'Image Distance di', 'Magnification m'],
      values: [
        ['مقعرة (خلف C)', '10.0', '30.0', '15.0', '-0.50x (حقيقية مقلوبة مصغرة)'],
        ['مقعرة (عند C)', '10.0', '20.0', '20.0', '-1.00x (حقيقية مقلوبة مساوية)'],
        ['مقعرة (بين F و C)', '10.0', '15.0', '30.0', '-2.00x (حقيقية مقلوبة مكبرة)'],
        ['مقعرة (حلاقة do<f)', '10.0', '5.0', '-10.0', '+2.00x (خيالية معتدلة مكبرة)'],
        ['محدبة (مرآة سيارة)', '-10.0', '20.0', '-6.67', '+0.33x (خيالية معتدلة مصغرة)']
      ],
      formulaPromptAr: '1/di = 1/f - 1/do | m = -di/do',
      formulaPromptEn: '1/di = 1/f - 1/do | m = -di/do'
    },
    computeResult: row => {
      const f = parseFloat(String(row[1])) || 10;
      const doV = parseFloat(String(row[2])) || 20;
      const diCalc = (f * doV) / (doV - f);
      const mCalc = -diCalc / doV;
      return {
        resultText: `بعد الصورة di = ${diCalc.toFixed(1)} cm | معامل التكبير m = ${mCalc.toFixed(2)}x (${diCalc > 0 ? 'حقيقية مقلوبة' : 'خيالية معتدلة'})`,
        isAccurate: true
      };
    }
  },
  {
    id: 17,
    titleAr: 'تجربة 17: تجربة شقي يونغ ومحزوزات الحيود لقياس الطول الموجي',
    titleEn: 'Exp 17: Young\'s Double-Slit & Diffraction Gratings for Wavelength',
    unitAr: 'فيزياء 3: التداخل والحيود (الطبيعة الموجية للضوء)',
    unitEn: 'Physics 3: Interference & Diffraction (Wave Nature of Light)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'prism',
    problemAr: 'كيف يثبت تداخل الضوء الطبيعة الموجية؟ وكيف نقيس الطول الموجي λ بدقة عبر شقي يونغ ومحزوزات الحيود؟',
    problemEn: 'How does light interference prove wave nature, and how do we measure wavelength λ via Young\'s double slits & gratings?',
    formula: 'λ = (x · d) / L   |   d · sin θ = m · λ   |   Δx = (λ · L) / d',
    theoryAr: 'أثبت توماس يونغ عام 1801 الطبيعة الموجية للضوء؛ حيث تنشأ أهداب مضيئة على الشاشة نتيجة التداخل البنّاء عندما يكون فرق المسار مساوياً لأعداد صحيحة من الطول الموجي (mλ)، وأهداب معتمة نتيجة التداخل الهدام عندما يكون فرق المسار مساوياً لأعداد فردية من نصف الطول الموجي. وبقياس المسافة x بين الأهداب والمسافة بين الشقين d وبعد الشاشة L نحسب الطول الموجي للضوء بدقة متناهية.',
    theoryEn: 'Thomas Young proved the wave theory of light in 1801. Constructive interference yields bright fringes (d·sin θ = mλ), destructive yields dark fringes. Measuring fringe spacing x determines wavelength λ.',
    materialsAr: ['ليزر أحمر هيليوم-نيون (λ=632.8 nm)', 'شريحة شقي يونغ (d = 0.15 mm)', 'محزوز حيود (300 lines/mm)', 'شاشة استقبال بيضاء مع مسطرة مترية'],
    materialsEn: ['632.8 nm He-Ne laser', 'Double slit slide (d=0.15 mm)', 'Diffraction grating (300 lines/mm)', 'White screen & metric ruler'],
    stepsAr: [
      'وجه ليزر الهيليوم-نيون نحو شريحة شقي يونغ على بعد L = 1.2 m من الشاشة.',
      'لاحظ تكون أهداب مضيئة ومعتمة متناوبة على الشاشة.',
      'قس المسافة بين الهدبة المركزية والهدبة المضيئة الأولى (x = 5.06 mm).',
      'طبق قانون يونغ: λ = (x · d) / L ستجد الطول الموجي = 633 nm تقريباً.'
    ],
    stepsEn: [
      'Direct He-Ne laser toward double slits at screen distance L = 1.2 m.',
      'Observe alternating bright and dark interference fringes on screen.',
      'Measure distance from central fringe to first bright fringe (x = 5.06 mm).',
      'Apply Young formula: λ = (x · d) / L to calculate wavelength = 633 nm.'
    ],
    defaultData: {
      labelsAr: ['مصدر الليزر', 'المسافة بين الشقين d (mm)', 'بعد الشاشة L (m)', 'المسافة بين الأهداب x (mm)', 'الطول الموجي المحسوب λ (nm)'],
      labelsEn: ['Laser Source', 'Slit Spacing d (mm)', 'Screen Distance L (m)', 'Fringe Spacing x (mm)', 'Calculated λ (nm)'],
      values: [
        ['ليزر أحمر He-Ne', '0.15', '1.20', '5.06', '632.8 nm (مطابق)'],
        ['ليزر أخضر Green', '0.18', '1.50', '4.43', '532.0 nm (مطابق)'],
        ['ليزر أزرق Blue', '0.15', '1.00', '3.00', '450.0 nm (مطابق)'],
        ['محزوز حيود 300 line/mm', '0.00333', '1.00', '190.0', '633 nm']
      ],
      formulaPromptAr: 'λ = (x · d) / L | d = 1 / (N lines/mm)',
      formulaPromptEn: 'λ = (x · d) / L | d = 1 / (N lines/mm)'
    },
    computeResult: row => {
      const d = parseFloat(String(row[1])) || 0.15;
      const L = parseFloat(String(row[2])) || 1.2;
      const x = parseFloat(String(row[3])) || 5.06;
      const lambdaCalcNm = ((x * 1e-3) * (d * 1e-3)) / L * 1e9;
      return {
        resultText: `الطول الموجي المحسوب λ = ${lambdaCalcNm.toFixed(1)} nm (مطابق لقانون تداخل يونغ)`,
        isAccurate: Math.abs(lambdaCalcNm - 633) < 25
      };
    }
  },
  {
    id: 18,
    titleAr: 'تجربة 18: نموذج بور الذري وسلاسل طيف ذرة الهيدروجين وتكميم الطاقة',
    titleEn: 'Exp 18: Bohr Atomic Model & Hydrogen Quantized Spectra',
    unitAr: 'فيزياء 3: الفيزياء الذرية ونظرية الكم (سلاسل بالمر وليمان وباشن)',
    unitEn: 'Physics 3: Atomic Physics & Quantum Theory (Bohr Hydrogen Model)',
    stationTarget: 'optics_quantum',
    opticsSubTab: 'quantum',
    problemAr: 'كيف فسر نموذج بور استقرار الذرة وتكميم مستويات الطاقة؟ وما أطوال موجات فوتونات سلاسل ليمان وبالمر وباشن؟',
    problemEn: 'How does Bohr model explain atomic stability and energy quantization, and what are the wavelengths of Lyman, Balmer, and Paschen series?',
    formula: 'E_n = -13.6 / n² eV   |   ΔE = h·f = hc / λ   |   1/λ = R_H · (1/n_f² - 1/n_i²)',
    theoryAr: 'افترض نيلز بور أن الإلكترون في ذرة الهيدروجين يتحرك فقط في مدارات دائرية مكممة ومحددة بنصف قطر وزخم زاوي، ولا يشع طاقة أثناء وجوده في مداره المستقر. وعندما يقفز الإلكترون من مستوى طاقة علوي ni إلى مستوى سفلي nf ينبعث فوتون يحمل فارق الطاقة (ΔE = Ei - Ef). يعطي الهبوط إلى n=1 سلسلة ليمان (فوق بنفسجية)، والهبوط إلى n=2 سلسلة بالمر (طيف مرئي بألوان محددة بدقة كخط H-alpha أحمر 656 nm و H-beta سماوي 486 nm)، والهبوط إلى n=3 سلسلة باشن (تحت حمراء).',
    theoryEn: 'Niels Bohr postulated quantized electron orbits. Photons are emitted when an electron jumps from ni to nf with ΔE = Ei - Ef. Transitions to n=1 yield Lyman (UV), n=2 yield Balmer (visible H-alpha 656 nm, H-beta 486 nm), and n=3 yield Paschen (IR).',
    materialsAr: ['أنبوب تفريغ غاز الهيدروجين المستثار', 'مطياف بصري رقمي ومحزوز', 'مصدر جهد عالي', 'محاكي بور الكمومي'],
    materialsEn: ['Excited Hydrogen discharge tube', 'Digital spectrometer & grating', 'High voltage power supply', 'Bohr quantum simulator'],
    stepsAr: [
      'شغل أنبوب تفريغ الهيدروجين ولاحظ توهجه باللون الوردي المائل للبنفسجي.',
      'افحص الضوء بالمطياف الرقمي لتحديد خطوط انبعاث متسلسلة بالمر الأربعة في الضوء المرئي.',
      'قس الطول الموجي لخط H-alpha الأحمر: ستجده 656.3 nm (ناتج عن قفزة n=3 إلى n=2).',
      'احسب طاقة المستويين E3 = -1.51 eV و E2 = -3.40 eV، وقارن فرق الطاقة ΔE = 1.89 eV مع طاقة الفوتون المحسوبة.'
    ],
    stepsEn: [
      'Energize hydrogen discharge tube and observe distinct reddish-purple glow.',
      'Inspect with digital spectrometer to identify the 4 visible Balmer emission lines.',
      'Measure red H-alpha line: 656.3 nm (jump from n=3 to n=2).',
      'Calculate E3=-1.51 eV and E2=-3.40 eV, verifying ΔE = 1.89 eV matches photon energy.'
    ],
    defaultData: {
      labelsAr: ['الخط الطيفي', 'المستوى الابتدائي ni', 'المستوى النهائي nf', 'فرق الطاقة ΔE (eV)', 'الطول الموجي λ (nm)'],
      labelsEn: ['Spectral Line', 'Initial Level ni', 'Final Level nf', 'Energy Diff ΔE (eV)', 'Wavelength λ (nm)'],
      values: [
        ['H-α أحمر (Balmer)', '3', '2', '1.89 eV', '656.3 nm'],
        ['H-β سماوي (Balmer)', '4', '2', '2.55 eV', '486.1 nm'],
        ['H-γ أزرق (Balmer)', '5', '2', '2.86 eV', '434.0 nm'],
        ['H-δ بنفسجي (Balmer)', '6', '2', '3.02 eV', '410.2 nm'],
        ['L-α ليمان (UV)', '2', '1', '10.20 eV', '121.6 nm (فوق بنفسجي)'],
        ['P-α باشن (IR)', '4', '3', '0.66 eV', '1875.0 nm (تحت حمراء)']
      ],
      formulaPromptAr: 'ΔE = 13.6 · (1/nf² - 1/ni²) eV | λ = 1239.84 / ΔE nm',
      formulaPromptEn: 'ΔE = 13.6 * (1/nf² - 1/ni²) eV | λ = 1239.84 / ΔE nm'
    },
    computeResult: row => {
      const ni = parseFloat(String(row[1])) || 3;
      const nf = parseFloat(String(row[2])) || 2;
      const dE = 13.6 * Math.abs(1 / (nf * nf) - 1 / (ni * ni));
      const lambdaNm = 1239.84 / dE;
      return {
        resultText: `ΔE = ${dE.toFixed(2)} eV | الطول الموجي المنبعث λ = ${lambdaNm.toFixed(1)} nm (مطابق لنموذج بور)`,
        isAccurate: true
      };
    }
  }
];

interface CurriculumExperimentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSimulator: (station: 'mechanics' | 'thermodynamics' | 'electromagnetism' | 'optics_quantum', opticsSubTab?: 'lenses' | 'refraction' | 'prism' | 'quantum') => void;
}

export const CurriculumExperimentsModal: React.FC<CurriculumExperimentsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSimulator
}) => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [selectedExpId, setSelectedExpId] = useState<number>(1);
  const [completedExps, setCompletedExps] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('physics_curriculum_completed_exps');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');

  // Custom data table edits per experiment
  const [expTableData, setExpTableData] = useState<Record<number, (string | number)[][]>>(() => {
    const initial: Record<number, (string | number)[][]> = {};
    EXPERIMENTS_LIST.forEach(exp => {
      initial[exp.id] = exp.defaultData.values.map(row => [...row]);
    });
    return initial;
  });

  if (!isOpen) return null;

  const currentExp = EXPERIMENTS_LIST.find(e => e.id === selectedExpId) || EXPERIMENTS_LIST[0];
  const currentTable = expTableData[currentExp.id] || currentExp.defaultData.values;

  const toggleComplete = (id: number) => {
    setCompletedExps(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem('physics_curriculum_completed_exps', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    playLabSound('click');
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    setExpTableData(prev => {
      const existing = prev[currentExp.id] ? prev[currentExp.id].map(r => [...r]) : currentExp.defaultData.values.map(r => [...r]);
      existing[rowIndex][colIndex] = val;
      return { ...prev, [currentExp.id]: existing };
    });
  };

  const resetTableData = () => {
    setExpTableData(prev => ({
      ...prev,
      [currentExp.id]: currentExp.defaultData.values.map(r => [...r])
    }));
    playLabSound('click');
  };

  const completedCount = Object.values(completedExps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / EXPERIMENTS_LIST.length) * 100);

  const filteredExperiments = EXPERIMENTS_LIST.filter(exp => {
    const title = isAr ? exp.titleAr : exp.titleEn;
    const unit = isAr ? exp.unitAr : exp.unitEn;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          exp.formula.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnit = selectedUnitFilter === 'all' || exp.stationTarget === selectedUnitFilter;
    return matchesSearch && matchesUnit;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className={`w-full max-w-6xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
        }`}
      >
        {/* Modal Top Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-4 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold">
                  {t('قائمة مراجعة وجداول تجارب مقرر الفيزياء 3-1 (الجزء الأول: 14 تجربة)', 'Physics 3-1 Practical Lab Guide (Part 1: 14 Experiments)')}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {completedCount} / 14 {t('مكتملة', 'Completed')} ({progressPercent}%)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t('دليل التجارب العملية المعتمد مع خطوات العمل، القوانين الفيزيائية، والجداول الحسابية التفاعلية المرتبطة بالمحاكيات', 
                   'Official secondary physics lab curriculum with procedures, formulas, and interactive dynamic calculation tables')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={t('إغلاق', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5">
          <div 
            className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-1.5 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Modal Main Content: Split List & Detail View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left / Navigation List (Col 1-4) */}
          <div className={`lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col h-full overflow-hidden ${
            isDark ? 'bg-slate-950/40' : 'bg-slate-50/70'
          }`}>
            {/* Search & Filters */}
            <div className="p-3 border-b border-slate-800 flex flex-col gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute top-2.5 left-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('بحث في التجارب أو القوانين...', 'Search experiments or formulas...')}
                  className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border transition-all ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
                <button
                  onClick={() => setSelectedUnitFilter('all')}
                  className={`px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                    selectedUnitFilter === 'all'
                      ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                      : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {t('الكل', 'All')} (14)
                </button>
                <button
                  onClick={() => setSelectedUnitFilter('mechanics')}
                  className={`px-2 py-1 rounded-lg border whitespace-nowrap transition-all ${
                    selectedUnitFilter === 'mechanics'
                      ? 'bg-cyan-600 border-cyan-400 text-white font-bold'
                      : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {t('الموائع', 'Fluids')} (2)
                </button>
                <button
                  onClick={() => setSelectedUnitFilter('optics_quantum')}
                  className={`px-2 py-1 rounded-lg border whitespace-nowrap transition-all ${
                    selectedUnitFilter === 'optics_quantum'
                      ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                      : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {t('الضوء والبصريات', 'Optics')} (8)
                </button>
                <button
                  onClick={() => setSelectedUnitFilter('electromagnetism')}
                  className={`px-2 py-1 rounded-lg border whitespace-nowrap transition-all ${
                    selectedUnitFilter === 'electromagnetism'
                      ? 'bg-purple-600 border-purple-400 text-white font-bold'
                      : isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {t('الكهرباء', 'Electro')} (2)
                </button>
              </div>
            </div>

            {/* Experiments Items Scroll Area */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar">
              {filteredExperiments.map(exp => {
                const isSelected = exp.id === selectedExpId;
                const isDone = !!completedExps[exp.id];

                return (
                  <div
                    key={exp.id}
                    onClick={() => {
                      setSelectedExpId(exp.id);
                      playLabSound('click');
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? isDark
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                          : 'bg-indigo-50/80 border-indigo-300 shadow-sm'
                        : isDark
                        ? 'border-slate-800/80 hover:bg-slate-900/60 text-slate-300'
                        : 'border-slate-200 hover:bg-white text-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete(exp.id);
                      }}
                      className="mt-0.5 text-indigo-400 hover:text-indigo-300 shrink-0"
                    >
                      {isDone ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs truncate">
                          {isAr ? exp.titleAr : exp.titleEn}
                        </span>
                        {isDone && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                            ✓ {t('منجزة', 'Done')}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate">
                        {isAr ? exp.unitAr : exp.unitEn}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 truncate">
                        {exp.formula}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right / Detailed View (Col 5-12) */}
          <div className="lg:col-span-8 overflow-y-auto p-4 sm:p-6 flex flex-col gap-5 custom-scrollbar">
            {/* Experiment Title Card */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 relative overflow-hidden ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    {isAr ? currentExp.unitAr : currentExp.unitEn}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-100 dark:text-white">
                    {isAr ? currentExp.titleAr : currentExp.titleEn}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleComplete(currentExp.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      completedExps[currentExp.id]
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm'
                        : isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {completedExps[currentExp.id] ? (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        <span>{t('تم إنجاز التجربة', 'Completed')}</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        <span>{t('تحديد كمكتملة', 'Mark Completed')}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToSimulator(currentExp.stationTarget, currentExp.opticsSubTab);
                      onClose();
                      playLabSound('click');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>{t('فتح في المحاكي', 'Open in Simulator')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Problem / Core Question */}
              <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs">
                <span className="font-bold text-indigo-300 block mb-0.5">
                  ❓ {t('سؤال واستقصاء التجربة:', 'Investigation Question:')}
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {isAr ? currentExp.problemAr : currentExp.problemEn}
                </p>
              </div>

              {/* Core Formula Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">{t('القانون الرياضي الحاكم:', 'Governing Law:')}</span>
                <code className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 font-mono font-bold text-xs">
                  {currentExp.formula}
                </code>
              </div>
            </div>

            {/* Scientific Theory & Procedure Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Theory Box */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h4 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('المبدأ والنظرية العلمية', 'Scientific Theory')}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAr ? currentExp.theoryAr : currentExp.theoryEn}
                </p>
              </div>

              {/* Materials Box */}
              <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h4 className="font-bold text-xs text-cyan-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  <span>{t('المواد والأدوات المطلوبة', 'Required Materials')}</span>
                </h4>
                <ul className="text-xs text-slate-300 flex flex-col gap-1 list-disc list-inside">
                  {(isAr ? currentExp.materialsAr : currentExp.materialsEn).map((mat, idx) => (
                    <li key={idx} className="leading-snug">{mat}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Experimental Steps */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" />
                <span>{t('خطوات العمل المنهجية (دليل التجارب)', 'Curriculum Step-by-Step Procedure')}</span>
              </h4>
              <ol className="text-xs text-slate-300 flex flex-col gap-1.5 list-decimal list-inside leading-relaxed">
                {(isAr ? currentExp.stepsAr : currentExp.stepsEn).map((st, idx) => (
                  <li key={idx} className="pl-1">{st}</li>
                ))}
              </ol>
            </div>

            {/* Interactive Data & Computation Table */}
            <div className={`p-5 rounded-3xl border flex flex-col gap-3 shadow-inner ${
              isDark ? 'bg-slate-950 border-indigo-500/30' : 'bg-slate-50 border-indigo-200'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-bold text-sm text-indigo-300">
                    {t('جدول البيانات والحسابات التفاعلي', 'Interactive Data & Computation Table')}
                  </h4>
                </div>
                <button
                  onClick={resetTableData}
                  className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-white flex items-center gap-1 transition-all"
                  title={t('استعادة القيم الافتراضية', 'Reset to Defaults')}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('إعادة ضبط', 'Reset')}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                {isAr ? currentExp.defaultData.formulaPromptAr : currentExp.defaultData.formulaPromptEn}
              </p>

              {/* Table Element */}
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className={`border-b border-slate-800 ${
                      isDark ? 'bg-slate-900 text-slate-200' : 'bg-slate-200 text-slate-800'
                    }`}>
                      <th className="p-2.5 font-bold">#</th>
                      {(isAr ? currentExp.defaultData.labelsAr : currentExp.defaultData.labelsEn).map((lbl, idx) => (
                        <th key={idx} className="p-2.5 font-bold border-l border-slate-800 whitespace-nowrap">
                          {lbl}
                        </th>
                      ))}
                      <th className="p-2.5 font-bold border-l border-slate-800 text-indigo-400 whitespace-nowrap">
                        {t('النتيجة والتحليل الآلي', 'Computed Output')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTable.map((row, rIdx) => {
                      const analysis = currentExp.computeResult(row);

                      return (
                        <tr 
                          key={rIdx} 
                          className={`border-b border-slate-800/60 transition-colors ${
                            isDark ? 'hover:bg-slate-900/50' : 'hover:bg-white'
                          }`}
                        >
                          <td className="p-2 font-mono font-bold text-slate-400">{rIdx + 1}</td>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1 border-l border-slate-800">
                              <input
                                type="text"
                                value={String(cell)}
                                onChange={e => handleCellChange(rIdx, cIdx, e.target.value)}
                                className={`w-full text-center px-2 py-1 rounded-lg border font-mono text-xs transition-all ${
                                  isDark 
                                    ? 'bg-slate-900/90 border-slate-800 text-white focus:border-indigo-500' 
                                    : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                                }`}
                              />
                            </td>
                          ))}
                          <td className="p-2 border-l border-slate-800 font-mono text-[11px] font-bold text-emerald-400 whitespace-nowrap">
                            {analysis.resultText}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
