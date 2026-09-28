import React from 'react';
import { X, Atom, Flame, Radiation, BookOpen } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">الدليل العلمي لمحاكي سلوك الذرات والمادة</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[75vh] overflow-y-auto">
          {/* Section 1: Atom Builder */}
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Atom className="w-4 h-4" />
              <span>1. بناء الذرة والجدول الدوري الشامل (118 عنصراً):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
              <li><strong className="text-slate-200">البروتونات (p⁺):</strong> تحدد العدد الذري (Z) وهوية العنصر الكيميائي وموقعه في الجدول الدوري.</li>
              <li><strong className="text-slate-200">النيوترونات (n⁰):</strong> تحدد نظير العنصر، والعدد الكتلي (A = Z + N)، واستقرار النواة.</li>
              <li><strong className="text-slate-200">الإلكترونات (e⁻):</strong> تدور في مستويات الطاقة الكمية (K, L, M, N, O, P, Q) وتحدد الشحنة الكيميائية الصافية.</li>
              <li><strong className="text-slate-200">الجدول الدوري:</strong> يحتوي على كافة العناصر الـ 118 المكتشفة مع تصنيفاتها وبياناتها الدقيقة.</li>
            </ul>
          </div>

          {/* Section 2: States of Matter & Phase Transitions */}
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-orange-400 font-bold">
              <Flame className="w-4 h-4" />
              <span>2. حالات المادة والتحولات الحرارية التفاعلية:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
              <li><strong className="text-slate-200">الرصد الآلي للانتقال الطوري:</strong> بمجرد رفع الحرارة لتتجاوز درجة الانصهار أو الغليان، يعلن المحاكي فوراً عن حدوث التحول الطوري (انصهار، تبخر، تكاثف، تجمد).</li>
              <li><strong className="text-slate-200">الحالة الصلبة:</strong> الجسيمات مقيدة في شبكة بلورية متراصة وتهتز في مكانها فقط.</li>
              <li><strong className="text-slate-200">الحالة السائلة:</strong> تمتلك طاقة كافية للانزلاق والتدفق مع بقاء قوى التجاذب متماسكة.</li>
              <li><strong className="text-slate-200">الحالة الغازية:</strong> تكسر الجزيئات كل الروابط وتتحرك بسرعات عالية وتتصادم مع الجدران مسببة الضغط الغازي.</li>
              <li><strong className="text-slate-200">قوانين الغازات (بويل وغاي-لوساك):</strong> انخفاض حجم الوعاء عبر المكبس يرفع الضغط، وزيادة الحرارة ترفع سرعة الارتطام والضغط.</li>
            </ul>
          </div>

          {/* Section 3: Radioactive Decay & Half-life */}
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Radiation className="w-4 h-4" />
              <span>3. النشاط وعمر النصف الإشعاعي (نظائر موسعة):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
              <li><strong className="text-slate-200">عمر النصف (T₁/₂):</strong> هو الزمن اللازم لتحلل نصف عدد النوى المشعة غير المستقرة في عينة ما.</li>
              <li><strong className="text-slate-200">الأمثلة الواقعية المضافة:</strong> تشمل الكربون-14، واليود-131 (علاج الغدة الدرقية)، والرادون-222 (غاز الصخور المشع)، والسيزيوم-137 (المفاعلات والصناعة)، والكوبالت-60، واليورانيوم-238.</li>
              <li><strong className="text-slate-200">الاحتمالية الكمية:</strong> تحلل نواة معينة أمر عشوائي، لكن سلوك 100 نواة مجتمعة يتبع بدقة منحنى الاضمحلال الأسي الطبيعي.</li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs transition-colors"
          >
            فهمت، العودة للمحاكي
          </button>
        </div>
      </div>
    </div>
  );
};
