import React, { useState } from 'react';
import {
  Compass,
  X,
  ChevronDown,
  Sparkles,
  Zap,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Calculator,
  Layers,
  Atom,
  Flame,
  Radiation,
  FlaskConical,
  Minimize2
} from 'lucide-react';
import { useApp, ActiveTabType } from '../context/AppContext';

export const FloatingQuickGuide: React.FC = () => {
  const { lang, theme, t, activeTab, setActiveTab, openCurriculum, openCalculator } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [selectedGuideTab, setSelectedGuideTab] = useState<ActiveTabType>(activeTab);

  // Sync with global tab change if guide is closed or open
  React.useEffect(() => {
    setSelectedGuideTab(activeTab);
  }, [activeTab]);

  const guides: Record<
    ActiveTabType,
    {
      titleAr: string;
      titleEn: string;
      icon: React.ReactNode;
      color: string;
      goalAr: string;
      goalEn: string;
      stepsAr: string[];
      stepsEn: string[];
      tipAr: string;
      tipEn: string;
    }
  > = {
    'atom-builder': {
      titleAr: 'بناء وتوزيع الذرات (1-118)',
      titleEn: 'Atom Builder & Orbitals (1-118)',
      icon: <Atom className="w-4 h-4 text-cyan-400" />,
      color: 'from-cyan-500 to-blue-600',
      goalAr: 'تركيب نواة الذرة (بروتونات ونيوترونات) والمدارات الإلكترونية ومراقبة الاستقرار وشحنة الأيون لجميع العناصر.',
      goalEn: 'Build atomic nuclei and electron shells while monitoring nuclear stability and ionic charge.',
      stepsAr: [
        'اختر عنصراً من القائمة السريعة أو أدخل عدد البروتونات مباشرة من لوحة التحكم.',
        'وازن النيوترونات لتحقيق استقرار النواة، ووازن الإلكترونات للوصول لذرة متعادلة كهربائياً.'
      ],
      stepsEn: [
        'Pick an element from the quick presets or adjust protons directly on the slider.',
        'Balance neutrons for nuclear stability and electrons for an electrically neutral atom.'
      ],
      tipAr: 'اضغط على زر "أعداد التأكسد" لمشاهدة حالات التأكسد المعتمدة من الفصل 3 في كيمياء 3.',
      tipEn: 'Click the Oxidation Numbers button to view textbook rules from Chapter 3.'
    },
    'molecule-builder': {
      titleAr: 'تكوين الجزيئات والمجسم ثلاثي الأبعاد',
      titleEn: 'Molecule Builder & 3D Geometry',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      color: 'from-purple-500 to-indigo-600',
      goalAr: 'تجميع الذرات بروابط كيميائية واستكشاف الشكل الفراغي ثلاثي الأبعاد (نموذج الكرات والعصي) والقطبية وتركيب لويس.',
      goalEn: 'Assemble atoms with covalent bonds and explore 3D ball-and-stick geometry and polarity.',
      stepsAr: [
        'انقر على أي ذرة في لوحة العناصر لإضافتها لساحة التجميع.',
        'استكشف المجسم ثلاثي الأبعاد بالتدوير والتكبير، واكتشف خواص المركب فور اكتمال التكافؤات.'
      ],
      stepsEn: [
        'Click any atom in the right panel to add it to the assembly workspace.',
        'Rotate and zoom the 3D model to inspect geometry once all valencies are satisfied.'
      ],
      tipAr: 'استخدم زر "إرسال للمعمل" لنقل أي مركب جاهز مباشرة إلى كؤوس التفاعل لاختبار تفاعلاته.',
      tipEn: 'Use the "Send to Lab" button to transfer your molecule directly to the experimental beakers.'
    },
    'states-of-matter': {
      titleAr: 'حالات المادة والتحولات الطورية',
      titleEn: 'States of Matter & Phase Transitions',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      color: 'from-amber-500 to-orange-600',
      goalAr: 'دراسة حركة الجسيمات في الحالات الصلبة والسائلة والغازية والبلازما تحت تأثير درجات الحرارة والضغط والجاذبية.',
      goalEn: 'Study particle dynamics in solid, liquid, gas, and plasma under temperature, pressure, and gravity.',
      stepsAr: [
        'اسحب موقد النار للأعلى للتسخين أو للأسفل للتبريد، ولاحظ سرعة تباعد الجسيمات.',
        'اضبط ارتفاع المكبس لتغيير الحجم والضغط ومراقبة ظاهرة الغليان والتسامي.'
      ],
      stepsEn: [
        'Push the burner slider up to heat or down to freeze, observing kinetic particle motion.',
        'Adjust the lid height to change pressure and observe boiling and condensation points.'
      ],
      tipAr: 'افتح "حاسبة الغليان والتجمد" لحساب الارتفاع في درجة الغليان والانخفاض في التجمد بدقة.',
      tipEn: 'Open the Boiling & Freezing calculator to compute colligative property shifts.'
    },
    'radioactive-decay': {
      titleAr: 'النشاط الإشعاعي وعمر النصف',
      titleEn: 'Radioactive Decay & Half-Life',
      icon: <Radiation className="w-4 h-4 text-emerald-400" />,
      color: 'from-emerald-500 to-teal-600',
      goalAr: 'محاكاة اضمحلال النظائر المشعة واكتشاف أشعة ألفا وبيتا وجاما وتتبع منحنى عمر النصف بمرور الزمن.',
      goalEn: 'Simulate isotope decay, discover alpha/beta/gamma radiation, and track the half-life curve over time.',
      stepsAr: [
        'اختر النظير المشع (كربون-14، يورانيوم-238، تريتيوم، أو بولونيوم).',
        'انقر على "بدء المحاكاة" وشاهد النوى المشعة وهي تتحول إلى نظائر مستقرة مع عداد الجسيمات.'
      ],
      stepsEn: [
        'Select an isotope (Carbon-14, Uranium-238, Tritium, or Polonium).',
        'Click Start Simulation and watch radioactive nuclei decay into daughter isotopes.'
      ],
      tipAr: 'راقب المخطط البياني التفاعلي لملاحظة كيف تتناقص المادة إلى 50% مع كل فترة عمر نصف.',
      tipEn: 'Observe the interactive curve showing remaining substance dropping to 50% each half-life.'
    },
    'experiments-lab': {
      titleAr: 'معمل التجارب التفاعلي (14 تجربة معتمدة)',
      titleEn: 'Experimental Lab (14 Curriculum Labs)',
      icon: <FlaskConical className="w-4 h-4 text-rose-400" />,
      color: 'from-rose-500 to-red-600',
      goalAr: 'إجراء جميع تجارب كتاب كيمياء 3 العملية: المعايرة، خلايا الجلفان، قياس pH، الصدأ، والتحليل الكهربائي.',
      goalEn: 'Conduct all 14 official Chemistry 3 experiments: titration, galvanic cells, pH testing, and electrolysis.',
      stepsAr: [
        'اختر تجربة من شريط "فهرس التجارب (14)" لتحضير الكواشف والأدوات تلقائياً.',
        'أضف المواد إلى الكؤوس وراقب التغير اللوني وتصاعد الغازات والمؤشرات الرقمية.'
      ],
      stepsEn: [
        'Pick any lab from the 14-experiment directory to automatically configure beakers and apparatus.',
        'Add reagents to the containers to observe color changes, gas evolution, and pH readings.'
      ],
      tipAr: 'انقر على "حاسبة القوانين" لحساب جهد الخلية ($E^\\circ_{\\text{cell}}$) وقوانين التخفيف والأس الهيدروجيني فوراً.',
      tipEn: 'Click the Chemical Calculator to compute cell EMF, dilution, and pH directly during the lab.'
    }
  };

  const currentGuide = guides[selectedGuideTab];

  return (
    <>
      {/* Floating Action Trigger Badge (Bottom Left/Right based on locale) */}
      <div className="fixed bottom-5 rtl:left-5 ltr:right-5 z-40 print:hidden">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/40 text-white shadow-cyan-950/40'
                : 'bg-white hover:bg-slate-50 border-cyan-500/50 text-slate-900 shadow-cyan-500/20'
            }`}
            title={t('دليل الاستعمال السريع والبديهي', 'Quick Intuitive Guide')}
          >
            <div className="relative">
              <Compass className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold leading-tight">
                {t('دليل الاستعمال السريع', 'Quick Guide')}
              </span>
              <span className="block text-[10px] text-cyan-400 leading-none mt-0.5">
                {t(currentGuide.titleAr.split(' ')[0], currentGuide.titleEn.split(' ')[0])}
              </span>
            </div>
          </button>
        ) : null}

        {/* Floating Expanded Guide Card */}
        {isOpen && (
          <div
            className={`w-[92vw] sm:w-[420px] rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200 ${
              isDark ? 'bg-slate-900/95 border-cyan-500/40 text-slate-100 shadow-2xl' : 'bg-white/95 border-cyan-500/50 text-slate-900 shadow-2xl'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                    <span>{t('دليل الاستخدام السريع', 'Quick Interactive Guide')}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono">
                      v2.0
                    </span>
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-xl border transition-colors ${
                  isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
                title={t('تصغير الدليل', 'Minimize Guide')}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Section Mini-Pills */}
            <div className={`p-2 border-b flex items-center gap-1 overflow-x-auto scrollbar-none ${
              isDark ? 'bg-slate-950/30 border-slate-800/80' : 'bg-slate-100/60 border-slate-200/80'
            }`}>
              {(Object.keys(guides) as ActiveTabType[]).map((tabKey) => {
                const item = guides[tabKey];
                const isCurrent = selectedGuideTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => {
                      setSelectedGuideTab(tabKey);
                      setActiveTab(tabKey);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : isDark
                        ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="truncate max-w-[85px]">{t(item.titleAr.split(' ')[0], item.titleEn.split(' ')[0])}</span>
                  </button>
                );
              })}
            </div>

            {/* Guide Card Body */}
            <div className="p-4 space-y-3.5 max-h-[380px] overflow-y-auto">
              {/* Active Section Title & Goal */}
              <div
                className={`p-3 rounded-2xl border ${
                  isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                    {currentGuide.icon}
                  </div>
                  <h5 className="text-xs font-bold text-cyan-400">
                    {t(currentGuide.titleAr, currentGuide.titleEn)}
                  </h5>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(currentGuide.goalAr, currentGuide.goalEn)}
                </p>
              </div>

              {/* Quick Steps */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {t('خطوات سريعة للبدء فوراً:', 'Quick Steps to Start:')}
                </span>
                <div className="space-y-1.5">
                  {currentGuide.stepsAr.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                        isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {t(step, currentGuide.stepsEn[idx])}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tip */}
              <div
                className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                  isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold block mb-0.5">{t('نصيحة ذكية:', 'Pro Tip:')}</span>
                  <span>{t(currentGuide.tipAr, currentGuide.tipEn)}</span>
                </div>
              </div>

              {/* Direct Jump Buttons */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openCalculator();
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isDark
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-700'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{t('حاسبة القوانين', 'Calculator')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openCurriculum();
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isDark
                      ? 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t('مرجع كيمياء 3', 'Book Reference')}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div
              className={`p-3 border-t text-[11px] flex items-center justify-between ${
                isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'
              }`}
            >
              <span>{t('يمكنك إغلاق الدليل أو تركه مفتوحاً', 'You can minimize anytime')}</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-cyan-400 font-bold hover:underline"
              >
                {t('تصغير', 'Minimize')}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
