import React from 'react';
import { X, Atom, Flame, Radiation, BookOpen, Compass, Gauge, Sparkles } from 'lucide-react';

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
            <h2 className="text-base font-bold text-white">الدليل العلمي والفيزيائي الشامل للمحاكي</h2>
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
              <li><strong className="text-slate-200">البروتونات (p⁺):</strong> تحدد العدد الذري (Z) وهوية العنصر وموقعه في الجدول الدوري.</li>
              <li><strong className="text-slate-200">النيوترونات (n⁰):</strong> تحدد نظير العنصر، والعدد الكتلي (A = Z + N)، واستقرار النواة.</li>
              <li><strong className="text-slate-200">الإلكترونات (e⁻):</strong> تملأ مستويات الطاقة الكمية (K, L, M, N, O, P, Q) وتحدد الشحنة الكيميائية.</li>
              <li><strong className="text-slate-200">الجدول الدوري:</strong> يغطي كافة العناصر الـ 118 المكتشفة مع خصائصها.</li>
            </ul>
          </div>

          {/* Section 2: States of Matter, Pressure & Gravity Physics */}
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-orange-400 font-bold">
              <Flame className="w-4 h-4" />
              <span>2. حالات المادة والديناميكا الحرارية وعوامل الضغط والجاذبية:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
              <li>
                <strong className="text-slate-200">مقياس درجات الحرارة والانتقال الطوري:</strong> يعرض درجات الحرارة متصاعدة من اليسار (0 K - الصلابة) إلى اليمين (الغازات)، مع تحديد دقيق لمواقع الانصهار (Tₘ) والغليان (T_b).
              </li>
              <li>
                <strong className="text-slate-200">تأثير الجاذبية الأرضية والكونية:</strong> في الجاذبية الأرضية أو كوكب المشتري، تستقر السوائل في قاع الوعاء وتتشكل كثافة غازية متدرجة. في <em>انعدام الوزن (Zero-G)</em>، تتغلب قوى التوتر السطحي ليتجمع السائل في كرة طافية مائية في منتصف الوعاء!
              </li>
              <li>
                <strong className="text-slate-200">تأثير الضغط والمكبس (قوانين بويل وكلاوزيوس-كلابيرون):</strong> خفض حجم الوعاء عبر المكبس يرفع الضغط التصادمي ويزيد حرارة الغاز (تسخين كظومي). كما يؤدي ارتفاع الضغط لرفع نقطة الغليان مما يسبب <em>التكاثف بالضغط (Pressure Liquefaction)</em>.
              </li>
              <li>
                <strong className="text-slate-200">المواد والعناصر المضافة:</strong> تشمل الزئبق (المعدن السائل الفريد)، الهيليوم (غاز فائق البرودة)، ثاني أكسيد الكربون (تسامي الجليد الجاف)، الميثان، والحديد.
              </li>
            </ul>
          </div>

          {/* Section 3: Radioactive Decay */}
          <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Radiation className="w-4 h-4" />
              <span>3. النشاط وعمر النصف الإشعاعي (نظائر موسعة):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
              <li><strong className="text-slate-200">عمر النصف (T₁/₂):</strong> الزمن اللازم لتحلل نصف عدد النوى المشعة في العينة.</li>
              <li><strong className="text-slate-200">نظائر واقعية:</strong> كربون-14، يود-131، رادون-222، سيزيوم-137، كوبالت-60، ويورانيوم-238.</li>
              <li><strong className="text-slate-200">الاحتمالية الكمية:</strong> تحلل كل نواة حدث عشوائي بحت، لكن المجموع الكلي يتبع المنحنى الأسي.</li>
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
