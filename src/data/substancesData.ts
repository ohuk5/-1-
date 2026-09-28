export interface SubstanceInfo {
  id: string;
  name: string;
  formula: string;
  meltingPointK: number; // T_m in Kelvin
  boilingPointK: number; // T_b in Kelvin
  particleType: 'monatomic' | 'diatomic' | 'water';
  color: string;
  themeColor: string;
  desc: string;
  defaultTempK: number;
}

export const SUBSTANCES: Record<string, SubstanceInfo> = {
  water: {
    id: 'water',
    name: 'الماء',
    formula: 'H₂O',
    meltingPointK: 273.15, // 0 °C
    boilingPointK: 373.15, // 100 °C
    particleType: 'water',
    color: '#38bdf8',
    themeColor: 'blue',
    desc: 'مذيب الحياة الكوني، يمتلك روابط هيدروجينية فريدة تجعل الجليد أقل كثافة من الماء السائل ويطفو فوقه، ويحتاج طاقة كامنة عالية للتبخر.',
    defaultTempK: 300 // 27 °C, room temperature liquid
  },
  neon: {
    id: 'neon',
    name: 'النيون',
    formula: 'Ne',
    meltingPointK: 24.56, // -248.59 °C
    boilingPointK: 27.07, // -246.08 °C
    particleType: 'monatomic',
    color: '#06b6d4',
    themeColor: 'cyan',
    desc: 'غاز نبيل خامل أحادي الذرة، قوى التجاذب البينية بين ذراته (فان دير فالس) ضعيفة جداً، لذلك يتكثف ويتصلب فقط عند درجات برودة سحيقة قريبة من الصفر المطلق.',
    defaultTempK: 50 // gas at modest temps
  },
  argon: {
    id: 'argon',
    name: 'الأرغون',
    formula: 'Ar',
    meltingPointK: 83.81, // -189.34 °C
    boilingPointK: 87.30, // -185.85 °C
    particleType: 'monatomic',
    color: '#a855f7',
    themeColor: 'purple',
    desc: 'غاز نبيل كتلته الذرية أكبر (40 u)، يتميز بنطاق سائل ضيق جداً (حوالي 3.5 كلفن فقط بين الانصهار والغليان) قبل أن يتحول لغاز عازل.',
    defaultTempK: 110 // gas
  },
  oxygen: {
    id: 'oxygen',
    name: 'الأكسجين',
    formula: 'O₂',
    meltingPointK: 54.36, // -218.79 °C
    boilingPointK: 90.20, // -182.95 °C
    particleType: 'diatomic',
    color: '#ef4444',
    themeColor: 'red',
    desc: 'جزيء ثنائي الذرة تترابط فيه ذرتا أكسجين برابطة تساهمية ثنائية متينة، الأكسجين السائل له لون أزرق باهت وخاصية مغناطيسية (بارامغناطيسي).',
    defaultTempK: 130 // gas
  },
  nitrogen: {
    id: 'nitrogen',
    name: 'النيتروجين',
    formula: 'N₂',
    meltingPointK: 63.15, // -210.00 °C
    boilingPointK: 77.36, // -195.79 °C
    particleType: 'diatomic',
    color: '#10b981',
    themeColor: 'emerald',
    desc: 'جزيء ثنائي الذرة برابطة تساهمية ثلاثية فائقة القوة، النيتروجين السائل هو المبرد الأكثر شيوعاً في المستشفيات والمختبرات العالمية.',
    defaultTempK: 100 // gas
  }
};

export type MatterPhase = 'solid' | 'melting' | 'liquid' | 'boiling' | 'gas';

export function calculatePhase(tempK: number, substance: SubstanceInfo): {
  phase: MatterPhase;
  phaseAr: string;
  badgeClass: string;
  detail: string;
} {
  const Tm = substance.meltingPointK;
  const Tb = substance.boilingPointK;
  const tolerance = Math.max(1.5, (Tb - Tm) * 0.08);

  if (Math.abs(tempK - Tm) <= tolerance) {
    return {
      phase: 'melting',
      phaseAr: 'تحول طوري: انصهار / تجمد',
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600 animate-pulse',
      detail: `الحرارة عند نقطة الانصهار (${Tm.toFixed(1)} K). تمتص الجزيئات حرارة كامنة للانصهار لكسر الروابط الشبكية البلورية الصلبة.`
    };
  }

  if (Math.abs(tempK - Tb) <= tolerance) {
    return {
      phase: 'boiling',
      phaseAr: 'تحول طوري: غليان / تكاثف',
      badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-600 animate-pulse',
      detail: `الحرارة عند نقطة الغليان (${Tb.toFixed(1)} K). تمتص الجزيئات حرارة التبخر الكامنة للتغلب تماماً على التجاذب والهروب كغاز حر.`
    };
  }

  if (tempK < Tm) {
    return {
      phase: 'solid',
      phaseAr: 'الحالة الصلبة (Solid)',
      badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-600',
      detail: `درجة الحرارة (${tempK.toFixed(1)} K) أقل من درجة الانصهار (${Tm.toFixed(1)} K). الجسيمات مقيدة في شبكة منتظمة وتهتز في مكانها فقط.`
    };
  }

  if (tempK > Tb) {
    return {
      phase: 'gas',
      phaseAr: 'الحالة الغازية (Gas)',
      badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-600',
      detail: `درجة الحرارة (${tempK.toFixed(1)} K) أعلى من درجة الغليان (${Tb.toFixed(1)} K). الجسيمات تملك طاقة حركية عالية جداً وتملأ كامل الوعاء بتصادمات عشوائية سريعة.`
    };
  }

  return {
    phase: 'liquid',
    phaseAr: 'الحالة السائلة (Liquid)',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-600',
    detail: `درجة الحرارة (${tempK.toFixed(1)} K) تقع بين نقطة الانصهار (${Tm.toFixed(1)} K) ونقطة الغليان (${Tb.toFixed(1)} K). الجزيئات متقاربة ومائعة وتنزلق فوق بعضها.`
  };
}
