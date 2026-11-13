import React, { useState } from 'react';
import {
  X,
  Atom,
  Flame,
  Radiation,
  BookOpen,
  Compass,
  Gauge,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Zap,
  Globe2,
  Layers,
  Thermometer,
  ShieldAlert,
  Wind,
  Orbit,
  Waves
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScrollableRibbon } from './ScrollableRibbon';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'basics' | 'states' | 'atoms' | 'decay' | 'missions';
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'basics'
}) => {
  const { lang, theme, t, currentDomain } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    return currentDomain === 'physics' ? 'physics_mechanics' : initialCategory;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  React.useEffect(() => {
    if (currentDomain === 'physics' && !activeCategory.startsWith('physics_')) {
      setActiveCategory('physics_mechanics');
    } else if (currentDomain === 'chemistry' && activeCategory.startsWith('physics_')) {
      setActiveCategory('basics');
    }
  }, [currentDomain]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className={`border rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh] ${
          isAr ? 'text-right' : 'text-left'
        } ${isDark ? 'bg-slate-900 border-slate-700/80 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}
      >
        {/* Top Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              currentDomain === 'chemistry'
                ? 'bg-cyan-950/90 border border-cyan-500/50 text-cyan-400 shadow-cyan-500/20'
                : 'bg-purple-950/90 border border-purple-500/50 text-purple-400 shadow-purple-500/20'
            }`}>
              {currentDomain === 'chemistry' ? <BookOpen className="w-5 h-5" /> : <Orbit className="w-5 h-5" />}
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>
                  {currentDomain === 'chemistry'
                    ? t('دليل وموسوعة مختبر الكيمياء التفاعلي', 'Interactive Chemistry Lab Encyclopedia')
                    : t('دليل وموسوعة مختبر الفيزياء التفاعلي', 'Interactive Physics Lab Encyclopedia')}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border hidden sm:inline-block ${
                  currentDomain === 'chemistry'
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                    : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                }`}>
                  {currentDomain === 'chemistry' ? t('كيمياء 3 مسارات', 'Chemistry 3') : t('فيزياء حركية', 'Physics Engine')}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentDomain === 'chemistry'
                  ? t('شرح بنية الذرات، تكوين الروابط، حالات المادة، النشاط الإشعاعي، وتجارب المعمل العملية', 'Atoms, molecules, phase thermodynamics, radioactivity, and 14 curriculum labs')
                  : t('شرح محاكي الميكانيكا والطفو، محاكي الديناميكا الحرارية والغازات، ومحاكي الكهرومغناطيسية والكم', 'Mechanics, gas thermodynamics kinetics, Coulomb electrostatics, and photoelectric effect')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900'
            }`}
            title={t('إغلاق الدليل', 'Close Guide')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Navigation Bar */}
        <div
          className={`px-4 py-3 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-100 border-slate-200'
          }`}
        >
          {/* Category Tabs - Strictly isolated for Chemistry vs Physics */}
          <div className="flex-1 min-w-0">
            <ScrollableRibbon
              alwaysShowArrows={true}
              arrowSize="xs"
              scrollAmount={160}
              className="gap-1.5 text-xs font-bold"
            >
              {currentDomain === 'chemistry' ? (
                <>
                  <button
                    onClick={() => setActiveCategory('basics')}
                    className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === 'basics'
                        ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/30'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>🐣</span>
                    <span>{t('مقدمة المبتدئين', 'Beginner Basics')}</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory('states')}
                    className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === 'states'
                        ? 'bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/30'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{t('أسرار حالات المادة والضغط', 'States & Pressure')}</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory('atoms')}
                    className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === 'atoms'
                        ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-600/30'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Atom className="w-3.5 h-3.5" />
                    <span>{t('بنية الذرة والجدول الدوري', 'Atoms & Table')}</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory('decay')}
                    className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === 'decay'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Radiation className="w-3.5 h-3.5" />
                    <span>{t('عمر النصف والإشعاع', 'Half-Life & Decay')}</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory('missions')}
                    className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === 'missions'
                        ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t('مهمات وتجارب عملية', 'Missions & Labs')}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveCategory('physics_mechanics')}
                    className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === 'physics_mechanics'
                        ? 'bg-cyan-600 border-cyan-500 text-white shadow-md shadow-cyan-600/30'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Waves className="w-3.5 h-3.5" />
                    <span>{t('محاكي الميكانيكا والطفو', 'Mechanics & Buoyancy')}</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory('physics_thermo')}
                    className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === 'physics_thermo'
                        ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/30'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>{t('محاكي الديناميكا الحرارية', 'Thermodynamics & Kinetics')}</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory('physics_electro')}
                    className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === 'physics_electro'
                        ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{t('محاكي الكهرومغناطيسية وكولوم', 'Electromagnetism & Coulomb')}</span>
                  </button>

                  <button
                    onClick={() => setActiveCategory('physics_optics')}
                    className={`px-3 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === 'physics_optics'
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Orbit className="w-3.5 h-3.5" />
                    <span>{t('البصريات والظاهرة الكهروضوئية', 'Optics & Photoelectric')}</span>
                  </button>
                </>
              )}
            </ScrollableRibbon>
          </div>

          {/* Quick Search Box */}
          <div className="relative min-w-[200px]">
            <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-3' : 'right-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('ابحث في الدليل العلمي...', 'Search scientific guide...')}
              className={`w-full border rounded-xl py-1.5 text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 ${
                isAr ? 'pl-9 pr-3' : 'pr-9 pl-3'
              } ${isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'}`}
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className={`p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          {/* TAB 1: BEGINNER BASICS */}
          {activeCategory === 'basics' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border border-amber-500/30 p-4 sm:p-5 rounded-2xl">
                <h3 className="text-base sm:text-lg font-black text-amber-400 flex items-center gap-2">
                  <span>
                    {t(
                      '💡 ما هي الذرة والمادة؟ تخيل أن الكون مبني من مكعبات ليغو مجهرية!',
                      '💡 What are Atoms and Matter? Imagine the universe built of microscopic Legos!'
                    )}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {t(
                    'كل شيء تراه أو تلمسه حولك — الهواء الذي تتنفسه، الماء الذي تشربه، شاشة هاتفك، وحتى خلايا جسدك — كلها تتكون من لبنات بناء صغيرة جداً لا تُرى حتى بأقوى المجاهر العادية تسمى الذرات (Atoms).',
                    'Everything you see or touch around you — the air you breathe, the water you drink, your smartphone screen, and even your living cells — is assembled from tiny sub-microscopic building blocks called Atoms.'
                  )}
                </p>
              </div>

              {/* Analogy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Analogy 1: Football Stadium Atom */}
                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <span>🏟️</span>
                    <span>{t('تشبيه ملعب كرة القدم (كم يبلغ حجم الذرة؟):', 'Football Stadium Analogy (How big is an atom?):')}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('لو كبّرنا الذرة لتصبح بحجم استاد كرة قدم ضخم:', 'If we scaled up a single atom to the size of a massive football stadium:')}
                  </p>
                  <ul className={`text-xs space-y-1.5 list-disc list-inside p-3 rounded-xl border ${
                    isDark ? 'bg-slate-900/60 border-slate-800/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <li>
                      <strong className="text-cyan-400">{t('النواة:', 'The Nucleus:')}</strong>{' '}
                      {t('ستكون في منتصف الملعب تماماً بحجم حبة بازلاء أو خرزة صغيرة!', 'Would sit at the exact center spot, the size of a tiny green pea!')}
                    </li>
                    <li>
                      <strong className="text-blue-400">{t('الإلكترونات:', 'The Electrons:')}</strong>{' '}
                      {t('حشرات مجهرية سريعة جداً تطير حول أعلى صفوف مدرجات الملعب!', 'Would be microscopic gnats buzzing around the highest stadium spectator rows!')}
                    </li>
                    <li>
                      <strong className="text-amber-400">{t('المفاجأة العلمية:', 'Scientific Reality:')}</strong>{' '}
                      {t('باقي الملعب بالكامل (99.99999%) عبارة عن فراغ محض! الذرة معظمها فراغ!', 'The entire rest of the stadium (99.99999%) is completely empty space! Matter is mostly void!')}
                    </li>
                  </ul>
                </div>

                {/* Analogy 2: Heat as a Dance Party */}
                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                    <span>🕺</span>
                    <span>{t('ما هي الحرارة حقاً؟ (ليست سائلاً سحرياً!):', 'What is Heat Really? (Not a fluid, but motion!):')}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t(
                      'كثير من الناس يظنون أن الحرارة مادة تضاف، لكن في الفيزياء الحرارة هي ببساطة سرعة رقص واهتزاز الجزيئات:',
                      'Heat is not a mysterious substance; in physics, temperature simply measures the average kinetic energy and vibrational dance of particles:'
                    )}
                  </p>
                  <ul className={`text-xs space-y-1.5 list-disc list-inside p-3 rounded-xl border ${
                    isDark ? 'bg-slate-900/60 border-slate-800/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <li>
                      <strong className="text-blue-400">{t('البرد القارس (الصلب):', 'Extreme Cold (Solid):')}</strong>{' '}
                      {t('الجزيئات تمسك أيدي بعضها بإحكام، وتهتز فقط في مكانها دون أن تفلت.', 'Particles lock arms firmly in a rigid crystal lattice, merely shivering in place.')}
                    </li>
                    <li>
                      <strong className="text-cyan-400">{t('الحرارة المعتدلة (السائل):', 'Moderate Heat (Liquid):')}</strong>{' '}
                      {t('تفلت الأيدي قليلاً وتنزلق الجزيئات فوق بعضها مثل ممر المشاة المزدحم.', 'Bonds loosen enough for molecules to slip and roll over one another like a crowded street.')}
                    </li>
                    <li>
                      <strong className="text-orange-400">{t('الحرارة العالية (الغاز):', 'High Heat (Gas):')}</strong>{' '}
                      {t('تتحرر الجزيئات وتركض بسرعة جنونية وتطير في كل الاتجاهات وتصطدم بالجدران!', 'Particles break completely free, flying at supersonic speeds and bouncing off walls!')}
                    </li>
                  </ul>
                </div>

                {/* Analogy 3: Pressure as Tennis Balls */}
                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <span>🎾</span>
                    <span>{t('ما هو الضغط (Pressure)؟:', 'What is Pressure?:')}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t(
                      'تخيل غرفة مغلقة بداخلها 100 شخص يقذفون كرات تنس بسرعة هائلة نحو الجدران باستمرار:',
                      'Imagine a closed room where billions of tiny rubber balls bounce continuously off every wall:'
                    )}
                  </p>
                  <p className={`text-xs p-3 rounded-xl border leading-relaxed ${
                    isDark ? 'bg-slate-900/60 border-slate-800/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    {t(
                      'كل ضربة كرة على الجدار هي دفعة صغيرة. مجموع مليارات الضربات في الثانية الواحدة هو ما نسميه الضغط! إذا صغّرت حجم الغرفة (كبست المكبس)، أو زدت سرعة الكرات (رفعت الحرارة)، ستضرب الكرات الجدران بمعدل أكبر، وسيقفز مؤشر الضغط عالياً!',
                      'Each collision exerts a tiny push. The sum of billions of impacts per square centimeter per second is Pressure! If you compress the chamber (lower the piston) or heat up the particles, they strike the boundaries more violently, and the pressure gauge rises!'
                    )}
                  </p>
                </div>

                {/* Analogy 4: Absolute Zero */}
                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <span>❄️</span>
                    <span>{t('الصفر المطلق (0 Kelvin = -273.15 °C):', 'Absolute Zero (0 Kelvin = -273.15 °C):')}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('هل يمكن تبريد الأشياء إلى ما لا نهاية؟ الإجابة: لا!', 'Can matter be cooled down forever? The answer is: No!')}
                  </p>
                  <p className={`text-xs p-3 rounded-xl border leading-relaxed ${
                    isDark ? 'bg-slate-900/60 border-slate-800/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    {t(
                      'بما أن الحرارة هي حركة الجزيئات، فهناك حد أدنى تتوقف عنده الجزيئات عن الحركة تماماً وتسكن كلياً! هذا الحد يسمى الصفر المطلق (0 كلفن)، ولا يمكن لأي شيء في الكون أن يكون أبرد منه أبداً.',
                      'Because temperature represents atomic motion, there is a fundamental theoretical minimum where molecular kinetic motion drops to zero. That limit is Absolute Zero (0 K). Nothing in the cosmos can ever be colder than this point.'
                    )}
                  </p>
                </div>
              </div>

              {/* Quick FAQ Cards */}
              <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>{t('أسئلة شائعة يجيب عنها هذا المحاكي:', 'Everyday Questions Answered by This Simulator:')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-cyan-400 block mb-1">
                      {t('❓ لماذا يطفو الماء ككرة سحرية في الفضاء؟', '❓ Why does water float as a floating sphere in space?')}
                    </span>
                    <span className="text-slate-400">
                      {t(
                        'لأنه في غياب الجاذبية تسحبه قوى التوتر السطحي لأقل مساحة سطح ممكنة وهي الكرة الهندسية!',
                        'Without gravity pulling it to the bottom, surface tension pulls all water molecules into the minimal surface area shape: a perfect sphere!'
                      )}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-orange-400 block mb-1">
                      {t('❓ لماذا يطهى الطعام بسرعة في قدر الضغط؟', '❓ Why does food cook so quickly in a pressure cooker?')}
                    </span>
                    <span className="text-slate-400">
                      {t(
                        'لأن حبس البخار يرفع الضغط، والضغط العالي يمنع الماء من التبخر حتى يصل إلى 120°C بدلاً من 100°C فيطهى أسرع بكثير!',
                        'Trapping steam raises pressure, which elevates water’s boiling point up to 120°C instead of 100°C, cooking food much faster!'
                      )}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-blue-400 block mb-1">
                      {t('❓ لماذا لا يذوب الجليد الجاف (CO₂) إلى ماء؟', '❓ Why does dry ice (CO₂) never melt into a puddle?')}
                    </span>
                    <span className="text-slate-400">
                      {t(
                        'لأنه يتسامى مباشرة من صلب إلى غاز عند الضغط العادي، ويحتاج ضغطاً يفوق 5.1 ضغط جوي لكي يظهر في الحالة السائلة!',
                        'It sublimates directly from solid to gas at standard pressure. It requires over 5.1 atmospheres to exist as a liquid!'
                      )}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-purple-400 block mb-1">
                      {t('❓ ما هو المعدن الوحيد السائل في حرارة الغرفة؟', '❓ What is the only metal that is liquid at room temperature?')}
                    </span>
                    <span className="text-slate-400">
                      {t(
                        'إنه الزئبق (Hg)، روابطه الإلكترونية المميزة تجعل درجة انصهاره منخفضة (-38.8°C) فيبقى سائلاً كثيفاً ولامعاً.',
                        'Mercury (Hg), whose relativistic electron shell effects weaken metallic bonding so that it melts at -38.8°C and remains a dense liquid.'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STATES OF MATTER, PRESSURE & GRAVITY */}
          {activeCategory === 'states' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-orange-950/60 via-slate-900 to-slate-950 border border-orange-500/30 p-4 sm:p-5 rounded-2xl">
                <h3 className="text-base sm:text-lg font-black text-orange-400 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span>{t('حالات المادة الثلاث وقوانين الغازات والضغط والجاذبية', 'States of Matter, Gas Laws, Pressure & Gravity')}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {t(
                    'شرح علمي لكيفية تأثير درجة الحرارة (T)، والضغط (P)، والحجم (V)، والجاذبية (g) على المادة وسلوكها الحركي.',
                    'Scientific explanation of how Temperature (T), Pressure (P), Volume (V), and Gravity (g) govern matter.'
                  )}
                </p>
              </div>

              {/* The Three States Table / Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`border p-4 rounded-2xl space-y-2 ${isDark ? 'bg-blue-950/40 border-blue-500/40' : 'bg-blue-50/60 border-blue-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-black text-sm">{t('الحالة الصلبة (Solid)', 'Solid State (Crystal)')}</span>
                    <span className="text-xl">🧊</span>
                  </div>
                  <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
                    <li><strong className="text-blue-300">{t('الشكل والحجم:', 'Shape & Volume:')}</strong> {t('ثابتان ومحددان بدقة.', 'Definite shape and volume.')}</li>
                    <li><strong className="text-blue-300">{t('حركة الجزيئات:', 'Motion:')}</strong> {t('اهتزاز موضعي حول مراكز اتزانها.', 'Vibrating in fixed lattice positions.')}</li>
                    <li><strong className="text-blue-300">{t('قوى التماسك:', 'Intermolecular Forces:')}</strong> {t('قوية جداً تقاوم التفكك.', 'Strong attractions resisting shear.')}</li>
                    <li><strong className="text-blue-300">{t('تأثير الحرارة:', 'Thermal Effect:')}</strong> {t('التسخين يكسبها طاقة انصهار لكسر الشبكة.', 'Heat provides latent energy to melt.')}</li>
                  </ul>
                </div>

                <div className={`border p-4 rounded-2xl space-y-2 ${isDark ? 'bg-cyan-950/40 border-cyan-500/40' : 'bg-cyan-50/60 border-cyan-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-black text-sm">{t('الحالة السائلة (Liquid)', 'Liquid State (Fluid)')}</span>
                    <span className="text-xl">💧</span>
                  </div>
                  <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
                    <li><strong className="text-cyan-300">{t('الشكل والحجم:', 'Shape & Volume:')}</strong> {t('حجم ثابت ويأخذ شكل الإناء.', 'Definite volume, adapts to vessel.')}</li>
                    <li><strong className="text-cyan-300">{t('حركة الجزيئات:', 'Motion:')}</strong> {t('انسيابية وانزلاقية مائعة.', 'Fluid sliding and rolling motion.')}</li>
                    <li><strong className="text-cyan-300">{t('قوى التماسك:', 'Intermolecular Forces:')}</strong> {t('متوسطة تسمح بالتوتر السطحي.', 'Moderate, enabling surface tension.')}</li>
                    <li><strong className="text-cyan-300">{t('تأثير الحرارة:', 'Thermal Effect:')}</strong> {t('التسخين يفلت الجزيئات بالتبخر والغليان.', 'Heat triggers evaporation & boiling.')}</li>
                  </ul>
                </div>

                <div className={`border p-4 rounded-2xl space-y-2 ${isDark ? 'bg-orange-950/40 border-orange-500/40' : 'bg-orange-50/60 border-orange-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-400 font-black text-sm">{t('الحالة الغازية (Gas)', 'Gas State (Vapor)')}</span>
                    <span className="text-xl">💨</span>
                  </div>
                  <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300">
                    <li><strong className="text-orange-300">{t('الشكل والحجم:', 'Shape & Volume:')}</strong> {t('يتمدد ليملأ أي وعاء بالكامل.', 'Expands to fill entire container.')}</li>
                    <li><strong className="text-orange-300">{t('حركة الجزيئات:', 'Motion:')}</strong> {t('عشوائية وسريعة جداً في كل اتجاه.', 'High-velocity random trajectories.')}</li>
                    <li><strong className="text-orange-300">{t('قوى التماسك:', 'Intermolecular Forces:')}</strong> {t('تكاد تكون معدومة بين الذرات.', 'Negligible intermolecular attraction.')}</li>
                    <li><strong className="text-orange-300">{t('تأثير الضغط:', 'Pressure Effect:')}</strong> {t('قابل للانضغاط بدرجة كبيرة جداً.', 'Highly compressible via piston work.')}</li>
                  </ul>
                </div>
              </div>

              {/* Deep Dive: Pressure & Boyle's Law */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  <span>{t('تأثير الضغط والمكبس: قوانين بويل والكبس الأديباتي', 'Pressure & Piston Impact: Boyle\'s Law & Adiabatic Liquefaction')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
                  <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-slate-900/60 border-slate-800/70' : 'bg-white border-slate-200'}`}>
                    <strong className="text-cyan-400 font-bold block">{t('1. قانون بويل (Boyle\'s Law):', '1. Boyle\'s Law (Inverse P-V Relation):')}</strong>
                    <p className="text-slate-400 leading-relaxed">
                      {t('عند ثبات درجة الحرارة، يتناسب ضغط الغاز عكسياً مع حجمه:', 'At constant temperature, pressure is inversely proportional to volume:')}
                    </p>
                    <div className="font-mono text-center bg-slate-950 py-1.5 rounded-lg border border-slate-800 text-cyan-400 font-bold text-sm" dir="ltr">
                      P₁ × V₁ = P₂ × V₂
                    </div>
                    <p className="text-slate-400">
                      {t(
                        'عند إنزال المكبس وتقليل الحجم إلى النصف، يتضاعف معدل اصطدام الجزيئات بالجدران فيتضاعف الضغط فوراً!',
                        'Halving the chamber volume doubles particle collision frequency against walls, doubling internal pressure!'
                      )}
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-xl border space-y-1.5 ${isDark ? 'bg-slate-900/60 border-slate-800/70' : 'bg-white border-slate-200'}`}>
                    <strong className="text-orange-400 font-bold block">{t('2. التكاثف بالضغط (Pressure Liquefaction):', '2. Pressure Liquefaction (Clausius-Clapeyron):')}</strong>
                    <p className="text-slate-400 leading-relaxed">
                      {t('لماذا يتحول البخار إلى سائل عند كبسه بالمكبس دون تبريد؟', 'Why does vapor condense into liquid when compressed without cooling?')}
                    </p>
                    <div className="font-mono text-center bg-slate-950 py-1.5 rounded-lg border border-slate-800 text-orange-400 font-bold text-sm" dir="ltr">
                      ↑ Pressure (P) ⟹ ↑ Boiling Point (T_b)
                    </div>
                    <p className="text-slate-400">
                      {t(
                        'الضغط العالي يقرب الجزيئات ويرفع درجة الغليان فوق درجة الحرارة الحالية، مما يجبر الغاز على التحول إلى سائل مائع!',
                        'Compression forces molecules together and elevates the boiling point above current temperature, forcing vapor to condense into liquid!'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Deep Dive: Gravity in Action */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  <span>{t('تأثير الجاذبية الأرضية والكونية على الموائع', 'Gravitational Field Impact on Fluid Dynamics')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-cyan-400 block mb-1">{t('🌍 جاذبية الأرض (1.0 g):', '🌍 Earth Gravity (1.0 g):')}</span>
                    <p className="text-slate-400">
                      {t(
                        'تسحب السائل ليستقر أفقياً في قاع الإناء وتشكل تدرجاً ضغطياً طبيعياً.',
                        'Pulls liquids down into a flat pool at the vessel floor with standard hydrostatic pressure.'
                      )}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-orange-400 block mb-1">{t('🪐 جاذبية المشتري (2.5 g):', '🪐 Jupiter Gravity (2.5 g):')}</span>
                    <p className="text-slate-400">
                      {t(
                        'قوة ساحقة تسطح السائل وتضغط الجزيئات بشدة نحو القاع.',
                        'Extreme downward force flattens fluids tightly against the base, increasing bottom density.'
                      )}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-purple-400 block mb-1">{t('🚀 انعدام الوزن (Zero-G):', '🚀 Zero Gravity (0.0 g):')}</span>
                    <p className="text-slate-400">
                      {t(
                        'تختفي قوة السحب نحو القاع، فتسود قوى التوتر السطحي لتشكل كرة مائية طافية معلقة في المنتصف!',
                        'Downward pull vanishes; surface tension dominates, coalescing particles into a floating suspended water sphere!'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exotic Substances Showcase */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('معرض المواد وظواهرها الفيزيائية الخارقة في المحاكي:', 'Exotic Substances Showcase in the Simulator:')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-sky-400 block mb-1">🌡️ {t('الغاليوم (Ga):', 'Gallium (Ga):')}</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('معدن ينصهر في راحة يدك عند 29.8 °C، ولكنه يغلي عند 2400 °C! أوسع نطاق حراري سائل في الكون.', 'Melts in your palm at 29.8 °C but boils at 2400 °C! Widest liquid range in the universe.')}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-slate-300 block mb-1">🚀 {t('التيتانيوم (Ti):', 'Titanium (Ti):')}</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('معدن الصواريخ الفائقة؛ ينصهر عند 1941 K ويغلي عند 3560 K، صلب كالصلب ونصف وزنه ومقاوم لكل العوامل.', 'Aerospace metal; melts at 1941 K and boils at 3560 K, high tensile strength and ultralight.')}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-indigo-400 block mb-1">⚡ {t('الزينون (Xe):', 'Xenon (Xe):')}</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('أثقل الغازات النبيلة المستقرة، أثقل من الهواء بخمس مرات، وقود الدفع الأيوني لمسبارات الفضاء السحيق.', 'Heaviest noble gas, 5x denser than air, propellant for deep-space ion propulsion thrusters.')}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-cyan-400 block mb-1">🧪 {t('الإيثانول (C₂H₅OH):', 'Ethanol (C₂H₅OH):')}</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('كحول طيار يغلي عند 78.3 °C ويمتص حرارة هائلة أثناء التبخر، مما يفسر إحساس البرودة عند وضعه على الجلد.', 'Volatile alcohol boiling at 78.3 °C with strong evaporative cooling on contact with skin.')}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-amber-500 block mb-1">👑 {t('الذهب (Au):', 'Gold (Au):')}</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('فلز نبيل فائق الكثافة والبريق، لا يتأكسد ولا يصدأ، ينصهر عند 1337 K بحمم ذهبية متوهجة نقية.', 'Noble dense metal that never tarnishes, melting at 1337 K into glowing golden liquid magma.')}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="font-bold text-yellow-400 block mb-1">❄️ {t('الهيليوم (He):', 'Helium (He):')}</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('أقل نقطة غليان في الكون (4.2 K)، لا يتجمد حتى عند الصفر المطلق تحت الضغط الجوي العادي!', 'Lowest boiling point in existence (4.2 K); never freezes at 1 atm even at absolute zero!')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATOM BUILDER & PERIODIC TABLE */}
          {activeCategory === 'atoms' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-500/30 p-4 sm:p-5 rounded-2xl">
                <h3 className="text-base sm:text-lg font-black text-cyan-400 flex items-center gap-2">
                  <Atom className="w-5 h-5 text-cyan-400" />
                  <span>{t('دليل بناء الذرة الشامل والجدول الدوري (118 عنصراً)', 'Atom Builder Guide & Periodic Table (118 Elements)')}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {t(
                    'كيف تُبنى النواة؟ ومن أين تكتسب المادة خصائصها الكيميائية والفيزيائية؟',
                    'How are atomic nuclei structured? Where do elements acquire chemical and physical properties?'
                  )}
                </p>
              </div>

              {/* Subatomic Particles Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className={`border p-4 rounded-2xl space-y-2 ${isDark ? 'bg-rose-950/40 border-rose-500/40' : 'bg-rose-50/60 border-rose-200'}`}>
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 inline-block shadow-sm shadow-rose-500/50" />
                    <span>{t('البروتونات (p⁺) - شحنة موجبة (+1)', 'Protons (p⁺) - Charge (+1)')}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-rose-400">{t('هوية العنصر (Z):', 'Atomic Identity (Z):')}</strong>{' '}
                    {t(
                      'عدد البروتونات هو الرقم الذري الذي يحدد اسم ونوع العنصر بشكل قاطع كالهوية الوطنية: 1 بروتون = هيدروجين، 6 = كربون، 79 = ذهب!',
                      'The proton count (Z) uniquely identifies the element like an ID number: 1 proton = Hydrogen, 6 = Carbon, 79 = Gold!'
                    )}
                  </p>
                </div>

                <div className={`border p-4 rounded-2xl space-y-2 ${isDark ? 'bg-slate-800/60 border-slate-600/50' : 'bg-slate-100 border-slate-300'}`}>
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-400 inline-block" />
                    <span>{t('النيوترونات (n⁰) - متعادلة (0)', 'Neutrons (n⁰) - Neutral (0)')}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-slate-400">{t('غراء النواة النووي:', 'Nuclear Glue:')}</strong>{' '}
                    {t(
                      'البروتونات تتنافر كهربائياً بشدة. تعمل النيوترونات كغراء يربط النواة بالقوة النووية الشديدة، ويحدد نظير العنصر واستقراره.',
                      'Protons repel each other electrostatically. Neutrons provide the strong nuclear force glue that binds the nucleus and dictates isotope stability.'
                    )}
                  </p>
                </div>

                <div className={`border p-4 rounded-2xl space-y-2 ${isDark ? 'bg-blue-950/40 border-blue-500/40' : 'bg-blue-50/60 border-blue-200'}`}>
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50" />
                    <span>{t('الإلكترونات (e⁻) - شحنة سالبة (-1)', 'Electrons (e⁻) - Charge (-1)')}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-blue-400">{t('حارس التفاعلات:', 'Chemical Reactivity:')}</strong>{' '}
                    {t(
                      'تدور في مدارات طاقة كمية (K, L, M, N). عددها يحدد الشحنة الكلية والتكافؤ وتكوين الروابط الكيميائية مع الذرات المجاورة.',
                      'Orbit in quantized electron shells (K, L, M...). Their valence count dictates ionization charge and chemical bonding behavior.'
                    )}
                  </p>
                </div>
              </div>

              {/* Quantum Shells & Capacity */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>{t('مستويات الطاقة الكمية وسعة المدارات (قاعدة 2n²):', 'Quantum Shell Energy Levels & Capacity (2n² Rule):')}</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-center" dir="ltr">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-cyan-400 font-bold block">Shell K (n=1)</span>
                    <span className="text-slate-400 text-[11px]">{t('يتسع لـ 2 إلكترون', 'Capacity: 2 e⁻')}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-cyan-400 font-bold block">Shell L (n=2)</span>
                    <span className="text-slate-400 text-[11px]">{t('يتسع لـ 8 إلكترونات', 'Capacity: 8 e⁻')}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-cyan-400 font-bold block">Shell M (n=3)</span>
                    <span className="text-slate-400 text-[11px]">{t('يتسع لـ 18 إلكترون', 'Capacity: 18 e⁻')}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-cyan-400 font-bold block">Shell N (n=4)</span>
                    <span className="text-slate-400 text-[11px]">{t('يتسع لـ 32 إلكترون', 'Capacity: 32 e⁻')}</span>
                  </div>
                </div>

                <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{t('متى تكون النواة غير مستقرة (مشعة)؟', 'When does a nucleus become unstable (radioactive)?')}</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {t(
                      'إذا كان عدد النيوترونات قليلاً جداً أو كثيراً جداً بالنسبة للبروتونات، تتغلب قوى التنافر وتصبح النواة غير مستقرة، مما يضطرها لإطلاق جسيمات إشعاعية نووية لتصل لحالة الاستقرار!',
                      'When the neutron-to-proton ratio falls outside the valley of stability, electrostatic repulsion overpowers binding energy, prompting spontaneous radioactive disintegration!'
                    )}
                  </p>
                </div>

                {/* Teacher's Note: Electron Spin & Opposite Motion Direction (Pauli Exclusion) */}
                <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-cyan-950/30 border-cyan-500/40' : 'bg-cyan-50/70 border-cyan-300'}`}>
                  <h5 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    <span>{t('توجيه المعلم: لماذا لا تدور الإلكترونات في نفس الاتجاه؟ (مبدأ باولي واللف المغزلي)', 'Teacher Rule: Why Electrons Orbit in Opposite Directions (Pauli Exclusion & Spin)')}</span>
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t(
                      'في المدار الواحد لا تدور الإلكترونات في نفس الاتجاه أبداً! وفقاً لمبدأ باولي للاستبعاد وقواعد ميكانيكا الكم، الإلكترونات جسيمات سالبة تتنافر كهربائياً ومغناطيسياً. لكي يسكن إلكترونان في مدار فرعي واحد، يجب أن يكون لهما لف مغزلي متعاكس: إلكترون يدور مع عقارب الساعة (Spin Down ↓ برتقالي)، والآخر يدور عكس عقارب الساعة (Spin Up ↑ سماوي). هذا التعاكس يولد مجالين مغناطيسيين متضادين يلغيان التنافر ويحققان أقصى استقرار للذرة!',
                      'Electrons never rotate in the exact same direction in an orbit! Under the Pauli Exclusion Principle, two electrons sharing an orbital must have opposite spins (+½ Spin-Up ↑ cyan and -½ Spin-Down ↓ orange). This opposing rotation produces paired magnetic moments that minimize electromagnetic repulsion and establish atomic stability!'
                    )}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-900 border border-sky-800/50 text-sky-300 flex items-center gap-2">
                      <span className="font-bold text-sm">↑</span>
                      <span>{t('غزل للأعلى (+½): حركة دورانية بعكس عقارب الساعة (سماوي)', 'Spin-Up (+½): Counter-clockwise motion (Cyan)')}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-orange-800/50 text-orange-300 flex items-center gap-2">
                      <span className="font-bold text-sm">↓</span>
                      <span>{t('غزل للأسفل (-½): حركة دورانية مع عقارب الساعة (برتقالي)', 'Spin-Down (-½): Clockwise motion (Orange)')}</span>
                    </div>
                  </div>

                  {/* 3D Spatial Model & Quantum Cloud Explainer */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-cyan-800/40 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <span>🌐</span>
                      <span>{t('النموذج الفضائي ثلاثي الأبعاد (3D Model):', '3D Spatial Model Capabilities:')}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      {t(
                        'في الفضاء الحقيقي ثلاثي الأبعاد، لا تقع مدارات الإلكترونات في قرص مسطح! يمكنك التبديل بين نموذج بور الفضائي ذو المدارات المائلة ثلاثية الأبعاد، ونموذج رذرفورد المتقاطع، والسحابة الإلكترونية الكمية (|ψ|²) الاحتمالية، مع إمكانية تحريك وتدوير الذرة في كافة المحاور ودراسة أسهم الدوران المداري ثلاثية الأبعاد.',
                        'In real 3D space, electron orbitals are not planar disks! You can toggle between the 3D Tilted Bohr Spatial model, Rutherford Crossed Orbits, and the Quantum Probability Cloud (|ψ|²), rotating the atom freely along all axes with full 3D orbital velocity vectors.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Nuclear Magic Numbers Scientific Guide (مفهوم الأرقام السحرية في الفيزياء النووية) */}
                <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 shadow-lg ${
                  isDark
                    ? 'bg-gradient-to-br from-purple-950/40 via-slate-900 to-amber-950/20 border-purple-500/40'
                    : 'bg-gradient-to-br from-purple-50/80 via-white to-amber-50/50 border-purple-200'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-purple-500/30">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h4 className="text-sm sm:text-base font-extrabold text-purple-300">
                        {t('الأرقام السحرية في الفيزياء النووية (Nuclear Magic Numbers)', 'Nuclear Magic Numbers in Quantum Physics')}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-600 text-purple-300">
                      2, 8, 20, 28, 50, 82, 126
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {t(
                      'مثلما تمتلئ مدارات الإلكترونات الخارجية لتعطي الغازات الخاملة فائقة الاستقرار الكيميائي (كالهيليوم والنيون والآرجون)، تمتلك النواة أيضاً "أغلفة كمية نووية" خاصة بالبروتونات والنيوترونات تُعرف بـ (نموذج الغلاف النووي - Nuclear Shell Model). عندما يكتمل غلاف نووي بعدد محدد من النيوكليونات، تصبح النواة فائقة الاستقرار والتماسك وتسمى هذه الأعداد: الأرقام السحرية (Magic Numbers).',
                      'Just as complete electron shells give noble gases extreme chemical stability (like He, Ne, Ar), atomic nuclei possess quantum nuclear energy shells for protons and neutrons (Nuclear Shell Model). When a nuclear shell is completely filled, the nucleus attains extraordinary binding energy and stability. These magical threshold counts are known as Nuclear Magic Numbers.'
                    )}
                  </p>

                  {/* Magic Numbers Badge Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs font-mono">
                    {[
                      { num: 2, label: 'Helium Shell', ar: 'غلاف الهيليوم (²He)' },
                      { num: 8, label: 'Oxygen Shell', ar: 'غلاف الأكسجين (¹⁶O)' },
                      { num: 20, label: 'Calcium Shell', ar: 'غلاف الكالسيوم (⁴⁰Ca)' },
                      { num: 28, label: 'Nickel Shell', ar: 'غلاف النيكل (⁵⁶Ni)' },
                      { num: 50, label: 'Tin Shell', ar: 'غلاف القصدير (¹²⁰Sn)' },
                      { num: 82, label: 'Lead Shell', ar: 'غلاف الرصاص (²⁰⁸Pb)' },
                      { num: 126, label: 'Neutron Shell', ar: 'غلاف النيوترونات (126n)' }
                    ].map(m => (
                      <div key={m.num} className="p-2 rounded-xl bg-slate-950/70 border border-purple-800/50 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-amber-400 font-mono">{m.num}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{t(m.ar, m.label)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Deep Scientific Concepts Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    {/* Doubly Magic Nuclei */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/40 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <span>🌟</span>
                        <span>{t('النوى سحرية الازدواج (Doubly Magic Nuclei):', 'Doubly Magic Nuclei:')}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {t(
                          'إذا احتوت النواة على رقم سحري من البروتونات ورقم سحري آخر من النيوترونات معاً، تسمى "سحرية الازدواج" وتعد أصلب النوى في الكون على الإطلاق! أمثلتها: الهيليوم-4 (2p + 2n)، والأكسجين-16 (8p + 8n)، والرصاص-208 (82p + 126n) وهو أثقل عنصر مستقر في الطبيعة ومحطة نهاية سلاسل الاضمحلال الإشعاعي لليورانيوم.',
                          'When a nucleus possesses BOTH a magic number of protons and a magic number of neutrons, it is "doubly magic" — the most tightly bound and stable matter in the cosmos! Prime examples: Helium-4 (2p, 2n), Oxygen-16 (8p, 8n), and Lead-208 (82p, 126n), the heaviest stable nucleus in the universe and the ultimate terminus of radioactive decay chains.'
                        )}
                      </p>
                    </div>

                    {/* Nobel Prize & Island of Stability */}
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-purple-500/40 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                        <span>🏝️</span>
                        <span>{t('نوبل فيزياء 1963 وجزيرة الاستقرار:', 'Nobel Prize & The Island of Stability:')}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {t(
                          'اكتشفت العالمة ماريا غوبرت-ماير وهانس ينسن أن هذه الأرقام تنشأ بسبب اقتران الغزل والمدار النووي (Spin-Orbit Coupling) ونالا نوبل 1963. ويتوقع الفيزيائيون وجود "جزيرة استقرار" لعناصر فائقة الثقل اصطناعية بعمر نصف طويل إذا امتلكت أرقاماً سحرية تالية مثل Z=114 أو Z=120 و N=184!',
                          'Physicists Maria Goeppert Mayer and J. Hans D. Jensen discovered that spin-orbit coupling explains these exact quantum gaps (1963 Nobel Prize in Physics). This model predicts a theoretical "Island of Stability" for superheavy synthetic elements with prolonged half-lives around Z=114 or 120 and N=184.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RADIOACTIVE DECAY & HALF-LIFE */}
          {activeCategory === 'decay' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 p-4 sm:p-5 rounded-2xl">
                <h3 className="text-base sm:text-lg font-black text-emerald-400 flex items-center gap-2">
                  <Radiation className="w-5 h-5 text-emerald-400" />
                  <span>{t('النشاط الإشعاعي وعمر النصف (Half-Life T₁/₂)', 'Radioactivity & Half-Life Principles (T₁/₂)')}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {t(
                    'كيف يتحول عنصر إلى عنصر آخر مع مرور الوقت؟ وما هو قانون الاضمحلال الأسي؟',
                    'How does one element transmute into another over time? How does exponential decay work?'
                  )}
                </p>
              </div>

              {/* Microwave Popcorn Analogy */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm">
                  <span>🍿</span>
                  <span>{t('تشبيه حبات الفشار في الميكروويف (فهم عمر النصف دون تعقيد):', 'Microwave Popcorn Analogy (Understanding Half-Life Simply):')}</span>
                </div>
                <p className={`text-xs sm:text-sm p-3.5 rounded-xl border leading-relaxed ${
                  isDark ? 'bg-slate-900/60 border-slate-800/60 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  {t(
                    'لو وضعت كيساً من حبوب الفشار في الميكروويف: لا يمكنك أبداً التنبؤ أي حبة ذرة ستفرقع أولاً لأن كل فرقعة هي حدث عشوائي بحت! ولكنك تستطيع أن تجزم رياضياً بدقة مذهلة أنه بعد مرور دقيقة واحدة، سيفرقع نصف عدد الحبوب في الكيس تماماً! هذه الدقيقة تسمى في الفيزياء عمر النصف (Half-Life).',
                    'Imagine heating a bag of popcorn: you can never predict exactly which kernel will pop next because individual disintegrations are quantum random events! Yet, statistically, you can know with astonishing precision that after exactly one unit of time, exactly 50% of the kernels will have popped! That exact duration is called the Half-Life (T₁/₂).'
                  )}
                </p>
              </div>

              {/* Real World Applications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <span>🏛️</span>
                    <span>{t('الكربون-14 (عمر النصف: 5,730 سنة):', 'Carbon-14 (Half-Life: 5,730 years):')}</span>
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t(
                      'يستخدمه علماء الآثار لتحديد عمر المومياوات الفرعونية والأشجار القديمة والمخطوطات التاريخية بدقة متناهية عبر قياس ما تبقى من كربون-14 في العينة.',
                      'Used by archeologists to date ancient organic artifacts, pharaonic mummies, and historical manuscripts up to 50,000 years old by measuring residual C-14.'
                    )}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
                    <span>🏥</span>
                    <span>{t('اليود-131 (عمر النصف: 8.02 أيام):', 'Iodine-131 (Half-Life: 8.02 days):')}</span>
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t(
                      'يستخدم في الطب النووي لعلاج أورام الغدة الدرقية؛ حيث يتحلل سريعاً خلال أيام قليلة دون أن يترك آثاراً إشعاعية طويلة الأمد في جسم المريض.',
                      'Used in targeted nuclear medicine for thyroid cancer therapy; decays within days so patient tissues recover without prolonged radiation exposure.'
                    )}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <span>🚀</span>
                    <span>{t('البولونيوم-210 (عمر النصف: 138.4 يوماً):', 'Polonium-210 (Space RTG Power):')}</span>
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t(
                      'باعث ألفا مكثف جداً اكتشفته ماري كوري. يُولّد جرام واحد منه 140 واط من الحرارة الذاتية، ويستخدم لتوليد الكهرباء في مركبات الفضاء ومسبارات الكواكب.',
                      'Intense alpha emitter discovered by Marie Curie; 1 gram yields 140 W of thermal heat, powering thermoelectric generators in deep space probes.'
                    )}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-bold text-teal-400 text-xs flex items-center gap-1.5">
                    <span>🌱</span>
                    <span>{t('الثوريوم-232 (عمر النصف: 14.05 مليار سنة):', 'Thorium-232 (Green Nuclear Fuel):')}</span>
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t(
                      'وقود المفاعلات النووية الخضراء للمستقبل. عمر نصفه يفوق عمر الكون المعروف (13.8 مليار سنة)، ويتميز باستحالة الانصهار النووي وإنتاجه نفايات آمنة.',
                      'Green nuclear fuel with a half-life exceeding the age of the universe (14.05 billion years), powering walk-away safe Molten Salt Reactors.'
                    )}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-bold text-purple-400 text-xs flex items-center gap-1.5">
                    <span>🩺</span>
                    <span>{t('التكنيشيوم-99m (عمر النصف: 6.01 ساعات):', 'Technetium-99m (Diagnostic Scan King):')}</span>
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t(
                      'النظير الطبي الأكثر استخداماً في العالم (85% من الفحوصات). باعث غاما نقي دون جسيمات مؤذية، ويختفي إشعاعه من جسم المريض خلال يوم واحد.',
                      'The gold standard in diagnostic medical imaging (85% of scans worldwide). Emits pure 140 keV gamma with a 6-hour half-life for safe diagnosis.'
                    )}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                    <span>⚡</span>
                    <span>{t('البلوتونيوم-239 (عمر النصف: 24,110 سنة):', 'Plutonium-239 (Fission Energy):')}</span>
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t(
                      'نظير انشطاري فائق الكثافة الطاقية يُستخدم في مفاعلات التوليد السريعة، ينتج طاقة كهربائية تفوق احتراق أطنان الفحم بملايين المرات.',
                      'Key fissile transuranic isotope for fast breeder power reactors, generating millions of times more electrical energy per mass than fossil fuels.'
                    )}
                  </p>
                </div>
              </div>

              {/* Decay Formula Explained */}
              <div className={`p-4 rounded-2xl border space-y-2 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <span className="font-bold text-cyan-300 text-xs block">
                  {t('📐 القانون الرياضي الأسي للاضمحلال الإشعاعي:', '📐 Exponential Radioactive Decay Equation:')}
                </span>
                <div className="font-mono text-center bg-slate-950 py-2 rounded-xl border border-slate-800 text-emerald-400 font-bold text-sm" dir="ltr">
                  N(t) = N₀ × (1/2)^(t / T₁/₂)
                </div>
                <p className="text-xs text-slate-400 text-center">
                  {t(
                    'كلما انقضى عمر نصف واحد، يتبقى 50% من الذرات، بعد عمرين يتبقى 25%، ثم 12.5%، وهكذا أبدياً!',
                    'After 1 half-life, 50% remains; after 2 half-lives, 25% remains; after 3, 12.5% remains in an asymptotic exponential curve!'
                  )}
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: HANDS-ON MISSIONS & LAB EXPERIMENTS */}
          {activeCategory === 'missions' && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/30 p-4 sm:p-5 rounded-2xl">
                <h3 className="text-base sm:text-lg font-black text-purple-400 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>{t('تحديات ومهمات عملية مقترحة للتطبيق في المحاكي', 'Hands-On Missions & Experiments to Try in the Simulator')}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {t(
                    'قم بتطبيق هذه التجارب بنفسك الآن في المحاكي ولاحظ النتائج العلمية المباشرة:',
                    'Execute these experiments step-by-step in the interactive simulator and observe the physical results:'
                  )}
                </p>
              </div>

              <div className="space-y-3">
                {/* Mission 1 */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/50 flex items-center justify-center text-purple-300 font-black shrink-0 text-sm">
                    1
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-purple-400">
                      {t('تحدي فقاعة الماء الكونية في محطة الفضاء (Zero-G Water Sphere)', 'Challenge: Zero-G Water Sphere (Space Station Physics)')}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(
                        'اختر مادة الماء (H₂O) عند حرارة 300 K، ثم اضغط على زر انعدام وزن (🚀). الملاحظة: شاهد كيف تتجمع الجزيئات تلقائياً في كرة مائية معلقة تطوف في منتصف الوعاء بفعل التوتر السطحي!',
                        'Select Water (H₂O) at 300 K, then click Zero-G (🚀). Observation: Watch molecules coalesce into a floating liquid sphere suspended in mid-air due to surface tension!'
                      )}
                    </p>
                  </div>
                </div>

                {/* Mission 2 */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-black shrink-0 text-sm">
                    2
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-cyan-400">
                      {t('تحدي قدر الضغط وتسييل الغاز دون تبريد (Pressure Liquefaction)', 'Challenge: Pressure Liquefaction without Cooling')}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(
                        'سخن الماء إلى 390 K حتى يملأ البخار الوعاء. الآن، اسحب المكبس للأسفل حتى 25% لرفع الضغط فوق 3.5 Atm. الملاحظة: ستشاهد تكاثف البخار إلى قطرات سائلة رغماً عن حرارته العالية!',
                        'Heat water to 390 K until it vaporizes. Then push the piston down to 25% volume to raise pressure above 3.5 Atm. Observation: Steam condenses into liquid despite being hot!'
                      )}
                    </p>
                  </div>
                </div>

                {/* Mission 3 */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-300 font-black shrink-0 text-sm">
                    3
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-amber-400">
                      {t('تحدي تسامي الجليد الجاف (CO₂ Sublimation)', 'Challenge: Dry Ice Sublimation (CO₂ Direct Phase Change)')}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(
                        'اختر ثاني أكسيد الكربون (CO₂)، واضغط زر صلب 🧊 ثم سخّنه ببطء فوق 195 K عند ضغط جوي عادي. الملاحظة: لن ترى أي قطرة سائل! الجليد الصلب يتحول فوراً لدخان غازي متطاير.',
                        'Select Carbon Dioxide (CO₂), choose Solid 🧊, and heat above 195 K at 1 Atm. Observation: No liquid puddle forms! Solid dry ice sublimes straight into vapor.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Mission 4 */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-black shrink-0 text-sm">
                    4
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-emerald-400">
                      {t('تحدي بناء ذرة النيتروجين أو الذهب المستقر', 'Challenge: Building Stable Nitrogen or Gold')}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(
                        'انتقل إلى قسم بناء الذرة، وضع 7 بروتونات و 7 نيوترونات و 7 إلكترونات لبناء ذرة النيتروجين المستقرة. ثم جرّب إزالة كل النيوترونات وشاهد كيف تضطرب النواة ويحذرك المحاكي!',
                        'Switch to Atom Builder, assemble 7 protons, 7 neutrons, and 7 electrons for stable Nitrogen-14. Then remove neutrons to watch the nucleus vibrate under radioactive instability!'
                      )}
                    </p>
                  </div>
                </div>

                {/* Mission 5: Peroxide Oxygen Volcano */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-pink-950 border border-pink-500/50 flex items-center justify-center text-pink-300 font-black shrink-0 text-sm">
                    5
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-pink-400">
                      {t('تحدي بركان الأكسجين ومعجون الفيل (H₂O₂ + المحفز)', 'Challenge: Oxygen Volcano & Elephant Toothpaste (H₂O₂ Catalysis)')}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(
                        'في معمل التجارب: أضف 15 مل من ماء الأكسجين H₂O₂، ثم أضف بلورات برمنغنات البوتاسيوم KMnO₄ أو برادة الحديد Fe. الملاحظة: يحدث تفكك حفزي عنيف يطلق فقاعات غاز الأكسجين O₂ الصافي ويرفع الحرارة فورياً لأكثر من 65°C!',
                        'In Experimental Lab: Add 15 mL H₂O₂, then add KMnO₄ crystals or Fe iron filings. Observation: Instant catalytic decomposition furiously releases pure O₂ bubbles and drives temperature past 65°C!'
                      )}
                    </p>
                  </div>
                </div>

                {/* Mission 6: Silver Chloride Precipitation */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-white font-black shrink-0 text-sm">
                    6
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-slate-200">
                      {t('تحدي كشف الكلوريد الكيميائي بنترات الفضة (AgCl)', 'Challenge: Qualitative Chloride Test (AgNO₃ + Cl⁻)')}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(
                        'في معمل التجارب: ضع حمض الهيدروكلوريك HCl أو ملح CaCl₂، ثم اسكب قطرات من نترات الفضة AgNO₃. الملاحظة: يتكون فوراً راسب كلوريد الفضة الأبيض الحليبي الشهير غير القابل للذوبان في الماء!',
                        'In Experimental Lab: Add dilute HCl or CaCl₂, then pour drops of AgNO₃ silver nitrate. Observation: Dense milky white insoluble AgCl precipitate forms instantly!'
                      )}
                    </p>
                  </div>
                </div>

                {/* Mission 7: Royal Navy Copper-Ammonia Complex */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-blue-950 border border-blue-500/50 flex items-center justify-center text-blue-300 font-black shrink-0 text-sm">
                    7
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-blue-400">
                      {t('تحدي معقد النحاس الأمينياتي الأزرق النيلي الملكي', 'Challenge: Royal Navy Tetraamminecopper(II) Complex')}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(
                        'في معمل التجارب: أضف كبريتات النحاس الزرقاء CuSO₄ ثم أضف محلول الأمونيا NH₄OH. الملاحظة: يتحول اللون السماوي فورياً إلى أزرق نيلي داكن ملكي ساحر لتشكل معقد التناسق [Cu(NH₃)₄]²⁺!',
                        'In Experimental Lab: Add blue CuSO₄ solution then add ammonia NH₄OH. Observation: The sky-blue fluid dramatically transforms into an intense, deep royal navy coordination complex [Cu(NH₃)₄]²⁺!'
                      )}
                    </p>
                  </div>
                </div>

                {/* Mission 8: Sodium Metal Detonation */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-300 font-black shrink-0 text-sm">
                    8
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-amber-400">
                      {t('💥 تفاعل وانفجار الصوديوم الفلزي مع الماء (2Na + 2H₂O)', 'Challenge: Violent Sodium Metal Water Detonation')}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(
                        'في معمل التجارب: ضع 100 مل من الماء المقطر، ثم أضف قطعة من فلز الصوديوم النشط Na. الملاحظة: يحدث تفاعل طارد للحرارة بانفجار فوري، وتتطاير شرارات نارية صفراء باهرة مع تصاعد غاز الهيدروجين الحارق وارتفاع قلوية المحلول فورياً (pH > 13) لتكون هيدروكسيد الصوديوم!',
                        'In Experimental Lab: Add 100 mL water, then drop active sodium metal Na. Observation: Violent exothermic detonation with bright yellow sparks, flammable H2 gas evolution, and immediate alkaline pH surge!'
                      )}
                    </p>
                  </div>
                </div>

                {/* Mission 9: Magnesium Combustion Flare */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center text-white font-black shrink-0 text-sm">
                    9
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-slate-200">
                      {t('🔥 احتراق شريط المغنيسيوم بالوهج الأبيض الساطع (2Mg + O₂)', 'Challenge: Magnesium Ribbon Fireworks Flare')}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(
                        'في معمل التجارب: أضف شريط المغنيسيوم Mg ثم شغّل موقد بنزن أو اضغط زر «شرارة إشعال ⚡». الملاحظة: يشتعل المغنيسيوم بوهج أبيض ناصع باهر وفائق السطوع يحاكي احتراق الألعاب النارية، مخلفاً رماد أكسيد المغنيسيوم الأبيض MgO!',
                        'In Experimental Lab: Add magnesium ribbon Mg, then ignite Bunsen burner or strike the Spark Igniter ⚡. Observation: Blinding white solar-intensity combustion flare emitting sparks and white MgO ash!'
                      )}
                    </p>
                  </div>
                </div>

                {/* Mission 10: Hydrogen Pop Test */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-black shrink-0 text-sm">
                    10
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-sm text-cyan-400">
                      {t('⚡ اختبار فرقعة غاز الهيدروجين النقي (Hydrogen Pop Test)', 'Challenge: Hydrogen Gas Pop Detonation Test')}
                    </h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {t(
                        'في معمل التجارب: بعد توليد غاز الهيدروجين H₂ من تفاعل الصوديوم مع الماء أو المغنيسيوم مع الحمض، انقر فوق أداة «شرارة إشعال ⚡». الملاحظة: يحدث انفجار صوتي سريع وفرقعة مبهجة ناتجة عن اتحاد الهيدروجين بالأكسجين مشكلاً بخار الماء!',
                        'In Experimental Lab: After releasing flammable H2 gas, click "Spark Igniter ⚡". Observation: Fast acoustic Pop detonation occurs as H2 reacts explosively with O2 forming water vapor!'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* CATEGORY: PHYSICS - MECHANICS & BUOYANCY (محاكي الميكانيكا والطفو)  */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {activeCategory === 'physics_mechanics' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-cyan-950/30 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Waves className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-cyan-400">
                      {t('موسوعة ميكانيكا الموائع وقاعدة أرخميدس والطفو', 'Fluid Mechanics & Archimedes Buoyancy Encyclopedia')}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {t('دراسة متعمقة في ضغط السوائل، قوة الطفو، هندسة الغواصات، وشذوذ كثافة الماء في الطبيعة', 'Deep physics of hydrostatic pressure, buoyant forces, naval engineering, and water anomalies')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Historical & Scientific Discovery */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-cyan-400 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{t('القصة التاريخية والاكتشاف: صرخة «يوريكا!» أرخميدس', 'Historical Discovery: The "Eureka!" of Archimedes')}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(
                    'في القرن الثالث قبل الميلاد بمدينة سيراكيوز، طلب الملك هيرو الثاني من العالم اليوناني أرخميدس التحقق مما إذا كان الصائغ قد غش في صناعة تاجه الملكي بخلط الذهب الخالص بالفضة الأقل قيمة، دون إتلاف التاج أو صهره. أثناء غمر أرخميدس لجسمه في حوض الاستحمام، لاحظ فوراً تدفق الماء إلى الخارج وارتفاع منسوبه بمقدار يعادل حجم جسمه المغمور، فخرج مسرعاً في شوارع المدينة وهو يصيح «وجدتها! يوريكا!». قام أرخميدس بوزن كمية متساوية من الذهب الخالص والتاج في الهواء ثم غمرهما في الماء، فاكتشف أن التاج أزاح ماءً أكثر من كتلة الذهب الخالص، مما أثبت علمياً أن كثافة التاج أقل وأن الصائغ قد خلطه بالفعل بالفضة!',
                    'In 3rd century BC Syracuse, King Hiero II tasked Archimedes to determine if his crown had been adulterated with cheaper silver without melting it. Stepping into a public bath, Archimedes noticed water overflow directly matching his submerged body volume, yelling "Eureka!" into the streets. Comparing displaced water of pure gold vs the crown proved the crown displaced more fluid, confirming silver adulteration through density.'
                  )}
                </p>
              </div>

              {/* 2. Core Mathematical Laws & Units */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-cyan-400 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>{t('القوانين والمعادلات الرياضية المعيارية مع الوحدات الدولية', 'Mathematical Formulas & SI Units')}</span>
                </h4>
                
                {/* Archimedes Law Box */}
                <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 text-center mb-4">
                  <span className="font-mono text-cyan-300 text-lg sm:text-xl font-black block mb-1">
                    F_b = ρ_fluid · V_displaced · g
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 mt-2 text-start pt-2 border-t border-slate-800">
                    <div><b className="text-cyan-400 font-mono">F_b:</b> قوة الطفو (N - نيوتن)</div>
                    <div><b className="text-cyan-400 font-mono">ρ_fluid:</b> كثافة المائع (kg/m³)</div>
                    <div><b className="text-cyan-400 font-mono">V_sub:</b> حجم السائل المزاح (m³)</div>
                    <div><b className="text-cyan-400 font-mono">g:</b> تسارع الجاذبية (9.8 m/s²)</div>
                  </div>
                </div>

                {/* Additional fluid laws */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl border border-sky-500/30 bg-sky-950/20">
                    <span className="font-bold text-sky-400 block mb-1">
                      {t('الضغط الهيدروستاتيكي في باطن السائل (Hydrostatic Pressure)', 'Hydrostatic Pressure in Liquids')}
                    </span>
                    <span className="font-mono text-sky-300 font-bold block mb-1">P = P₀ + ρ · g · h</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('يزداد الضغط طردياً كلما تعمقنا إلى أسفل (h)، وفارق الضغط بين السطح السفلي والعلوي لأي جسم هو التفسير الفيزيائي الحقيقي لنشأة قوة الطفو للأعلى!', 'Pressure grows linearly with depth h; the pressure difference between object top and bottom generates the upward buoyant net force.')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-teal-500/30 bg-teal-950/20">
                    <span className="font-bold text-teal-400 block mb-1">
                      {t('مبدأ باسكال والأنظمة الهيدروليكية (Pascal\'s Law)', 'Pascal\'s Principle & Hydraulics')}
                    </span>
                    <span className="font-mono text-teal-300 font-bold block mb-1">F₁ / A₁ = F₂ / A₂</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('الضغط المطبق على مائع محصور ينتقل بالتساوي إلى جميع جدران الإناء؛ وهو الأساس الهندسي لفرامل السيارات، والروافع الثقيلة، والمكابس الصناعية.', 'Pressure applied to enclosed fluid transmits uniformly; enabling car brake lines, hydraulic cranes, and industrial presses.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. The 3 States of Buoyancy */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-cyan-400 mb-3 flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  <span>{t('الحالات الفيزيائية الثلاث لتوازن الأجسام في السوائل', 'The Three Equilibrium Regimes of Buoyancy')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 text-sm">1. يطفو (Floating)</span>
                      <span className="font-mono text-emerald-300 text-[11px] font-bold">ρ_obj &lt; ρ_fluid</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {t('قوة الطفو عند الغمر الكامل أكبر من وزن الجسم، فيرتفع الجسم للأعلى حتى يستقر طافياً بنسبة حجم مغمور تساوي بالضبط نسبة الكثافتين: V_sub / V_total = ρ_obj / ρ_fluid.', 'Max buoyancy exceeds weight; object bobs up until fraction submerged equals ratio of densities.')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 text-sm">2. معلق (Neutral)</span>
                      <span className="font-mono text-amber-300 text-[11px] font-bold">ρ_obj = ρ_fluid</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {t('قوة الطفو تتساوى تماماً مع وزن الجسم، فيستقر الجسم متزناً في أي عمق يوضع فيه دون أن يطفو للسطح أو يهبط للقاع (حالة الطفو المحايد كما في الغواصات والغواصين).', 'Buoyancy balances weight precisely; object stays stationary at any depth (neutral buoyancy used by submersibles and divers).')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-950/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-400 text-sm">3. يغرق (Sinking)</span>
                      <span className="font-mono text-rose-300 text-[11px] font-bold">ρ_obj &gt; ρ_fluid</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {t('وزن الجسم يتغلب على أقصى قوة طفو يمكن أن يوفرها السائل، فيتسارع الجسم نحو القاع وتصبح القوة الضاغطة على أرضية الحوض مساوية للوزن الظاهري: W_app = W - F_b.', 'Weight overcomes maximum buoyant capacity; object descends to base with apparent weight W_apparent = W - F_b.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Real-World Engineering & Natural Applications */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-cyan-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('تطبيقات هندسية مذهلة في العالم الواقعي', 'Remarkable Real-World Engineering Applications')}</span>
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                    <span className="font-bold text-cyan-300 block text-[13px]">
                      {t('1. هندسة الغواصات البحرية وخزانات الصابورة (Ballast Tanks)', '1. Submarines & Ballast Tank Fluid Dynamics')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {t(
                        'تمتلك الغواصة خزانات صابورة مزدوجة؛ عندما ترغب في الغوص، تفتح صمامات الخزانات ليدخل ماء البحر ليحل محل الهواء، فيزداد متوسط كثافة الغواصة لتصبح أكبر من الماء فتغوص. وعند الرغبة في الصعود للسطح، يُضخ هواء عالي الضغط لطرد ماء البحر خارجاً، فتنخفض الكثافة المتوسطة وتطفو الغواصة!',
                        'Submarines vent ballast tanks to flood seawater replacing air to submerge, and blow compressed air into the tanks to expel water to surface.'
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                    <span className="font-bold text-cyan-300 block text-[13px]">
                      {t('2. سر طفو السفن الفولاذية العملاقة (Steel Container Ships)', '2. Giant Steel Ships & Displaced Volume Engineering')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {t(
                        'تبلغ كثافة الفولاذ والحديد 7,850 kg/m³ (أثقل بـ 8 أضعاف من الماء)، ومع ذلك تحمل السفن عشرات الآلاف من الأطنان وتطفو! السر يكمن في التصميم الهندسي للهيكل، حيث يحتوي على تجويف هوائي داخلي هائل؛ هذا الحجم الضخم يزيح كمية مياه هائلة وزنها يفوق وزن السفينة بالكامل، فيصبح متوسط كثافة السفينة (كتلة السفينة الكلية ÷ حجمها الكلي) أقل من 1,000 kg/m³ فتطفو بأمان.',
                        'Steel is 8 times denser than water, yet ships float because the hollow interior hull volume displaces sufficient water weight to lower mean bulk density below water.'
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                    <span className="font-bold text-cyan-300 block text-[13px]">
                      {t('3. مقياس كثافة السوائل (الهيدرومتر Hydrometer)', '3. Hydrometers & Quality Testing in Industries')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {t(
                        'أنبوب زجاجي مدرج يحتوي على ثقل رصاصي في قاعدته؛ عند وضعه في سائل، يطفو رأسياً ويشير خط انغماره مباشرة إلى كثافة السائل. يُستخدم لفحص نقاء العسل، واختبار نسبة السكر، وتحديد شحن بطاريات حمض الرصاص في السيارات، وفحص جودة الحليب.',
                        'Calibrated floating glass instruments measure fluid specific gravity directly; utilized in testing honey purity, battery acid electrolyte, and dairy quality.'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Physical Data Reference Table */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-cyan-400 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>{t('جدول الكثافات المعيارية للمواد والسوائل في الفيزياء (kg/m³)', 'Standard Density Reference Table (kg/m³)')}</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-center font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">البلاتين (Pt)</span>
                    <span className="text-cyan-300 font-bold">21,450 kg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">الذهب الخالص (Au)</span>
                    <span className="text-amber-400 font-bold">19,300 kg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">الزئبق السائل (Hg)</span>
                    <span className="text-purple-300 font-bold">13,600 kg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">الرصاص (Pb)</span>
                    <span className="text-slate-300 font-bold">11,340 kg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">الحديد والصلب (Fe)</span>
                    <span className="text-blue-300 font-bold">7,850 kg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">الألومنيوم (Al)</span>
                    <span className="text-sky-300 font-bold">2,700 kg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">الماء العذب (H₂O)</span>
                    <span className="text-emerald-400 font-bold">1,000 kg/m³</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">الجليد المائي</span>
                    <span className="text-cyan-200 font-bold">917 kg/m³</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* CATEGORY: PHYSICS - THERMODYNAMICS (محاكي الديناميكا الحرارية)         */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {activeCategory === 'physics_thermo' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-amber-950/30 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-amber-400">
                      {t('موسوعة الديناميكا الحرارية والنظرية الحركية للغازات', 'Thermodynamics & Gas Kinetics Encyclopedia')}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {t('شرح قوانين الديناميكا الحرارية الأربعة، الإنتروبيا، معادلة الغاز المثالي، ودورة كارنو الحرارية', 'The 4 laws of thermodynamics, entropy, ideal gas equation, kinetic theory, and heat engines')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Historical & Scientific Context */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-amber-400 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{t('تطور علم الديناميكا الحرارية: من الآلة البخارية إلى الإنتروبيا', 'Origins of Thermodynamics: From Steam Engines to Entropy')}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(
                    'تأسس علم الديناميكا الحرارية في مطلع القرن التاسع عشر خلال الثورة الصناعية، للإجابة على سؤال هندسي محوري: ما هو الحد الأقصى لكفاءة تحويل الحرارة إلى شغل ميكانيكي نافع؟ قام المهندس الفرنسي سادي كارنو عام 1824 بوضع الأساس النظري للمحركات الحرارية (دورة كارنو)، تلاه جيمس بريسكوت جول الذي أثبت بتجارب دقيقة أن الحرارة شكل من أشكال الطاقة الميكانيكية المكافئة، وصولاً إلى لودفيغ بولتزمان ورودولف كلاوزيوس اللذين ربطا الحرارة بالحركة العشوائية المجهرية للجزيئات وصاغا مفهوم «الإنتروبيا» وسهم الزمن الكوني.',
                    'Thermodynamics was born in the 19th-century Industrial Revolution seeking maximum steam engine efficiency. Sadi Carnot (1824) formulated ideal thermal cycles, James Joule proved heat is energy equivalence, and Ludwig Boltzmann linked macro states to microscopic statistical mechanics and entropy.'
                  )}
                </p>
              </div>

              {/* 2. The 4 Laws of Thermodynamics */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-amber-400 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>{t('قوانين الديناميكا الحرارية الأربعة (The 4 Fundamental Laws)', 'The 4 Fundamental Laws of Thermodynamics')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl border border-sky-500/30 bg-sky-950/20 space-y-1">
                    <span className="font-bold text-sky-400 text-sm">القانون الصفري (Zeroth Law) - الاتزان الحراري</span>
                    <p className="text-slate-300 leading-relaxed">
                      {t('إذا كان النظام A في اتزان حراري مع B، وكان B في اتزان حراري مع C، فإن A في اتزان حراري مع C. هذا القانون هو الأساس المنطقي لاختراع مقاييس الحرارة (الثيرمومترات).', 'Thermal equilibrium is transitive; establishing empirical temperature measurement via thermometers.')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-1">
                    <span className="font-bold text-amber-400 text-sm">القانون الأول (First Law) - حفظ الطاقة</span>
                    <span className="font-mono text-amber-300 font-bold block">ΔU = Q - W</span>
                    <p className="text-slate-300 leading-relaxed">
                      {t('الطاقة لا تفنى ولا تُستحدث من العدم بل تتحول من شكل لآخر؛ التغير في الطاقة الداخلية للنظام يساوي الحرارة المضافة مطروحاً منها الشغل المنجز.', 'Total energy is conserved; internal energy change ΔU equals heat absorbed Q minus work done W.')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-950/20 space-y-1">
                    <span className="font-bold text-rose-400 text-sm">القانون الثاني (Second Law) - الإنتروبيا وسهم الزمن</span>
                    <span className="font-mono text-rose-300 font-bold block">ΔS_universe ≥ 0</span>
                    <p className="text-slate-300 leading-relaxed">
                      {t('تنتقل الحرارة تلقائياً دائماً من الجسم الأسخن إلى الأبرد وليس العكس؛ وإنتروبيا (عشوائية) أي نظام معزول تزداد حتماً بمرور الزمن ولا يمكن بناء محرك حراري بكفاءة 100%.', 'Natural processes are irreversible; universe entropy grows, preventing perpetual 100% efficient heat engines.')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-teal-500/30 bg-teal-950/20 space-y-1">
                    <span className="font-bold text-teal-400 text-sm">القانون الثالث (Third Law) - الصفر المطلق</span>
                    <span className="font-mono text-teal-300 font-bold block">T → 0 K  ⇒  S → 0</span>
                    <p className="text-slate-300 leading-relaxed">
                      {t('عند الاقتراب من الصفر المطلق (0 K = -273.15°C)، تصبح إنتروبيا البلورة النقية المنتظمة تماماً صفراً، ويستحيل تبريد أي نظام إلى الصفر المطلق في خطوات محدودة.', 'As temperature approaches absolute zero, pure crystal entropy approaches zero; 0 K is unreachable in finite steps.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Gas Laws & Microscopic Kinetic Theory */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-amber-400 mb-3 flex items-center gap-2">
                  <Wind className="w-4 h-4" />
                  <span>{t('النظرية الحركية المجهرية ومعادلات الغاز المثالي', 'Microscopic Kinetic Theory & Gas State Equations')}</span>
                </h4>
                
                <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 text-center mb-4">
                  <span className="font-mono text-amber-300 text-lg sm:text-xl font-black block mb-1">
                    P · V = n · R · T   =   N · k_B · T
                  </span>
                  <p className="text-xs text-slate-400 mt-2">
                    {t(
                      'P: الضغط | V: الحجم | n: المولات | R: ثابت الغازات العام (8.314 J/mol·K) | k_B: ثابت بولتزمان (1.38 × 10⁻²³ J/K) | T: درجة الحرارة المطلقة (K)',
                      'P: Pressure | V: Volume | n: Moles | R: Gas Constant (8.314 J/mol·K) | k_B: Boltzmann Constant | T: Kelvin'
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl border border-sky-500/30 bg-sky-950/20 space-y-1">
                    <span className="font-bold text-sky-400 block text-sm">قانون بويل (Boyle)</span>
                    <span className="font-mono text-sky-300 block font-bold">P₁ · V₁ = P₂ · V₂</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('عند ثبوت الحرارة (T): مضاعفة الضغط تؤدي لنصف الحجم فورياً؛ لأن تقليص الحجم يضاعف عدد اصطدامات الجسيمات بالجدار.', 'Fixed T: Pressure inversely proportional to volume. Halving volume doubles wall collision frequency.')}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-950/20 space-y-1">
                    <span className="font-bold text-rose-400 block text-sm">قانون شارل (Charles)</span>
                    <span className="font-mono text-rose-300 block font-bold">V₁ / T₁ = V₂ / T₂</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('عند ثبوت الضغط (P): يتمدد الغاز طردياً مع ارتفاع الحرارة بالكلفن؛ لتعويض تزايد سرعة الجزيئات والحفاظ على اتزان الضغط.', 'Fixed P: Volume proportional to Kelvin temp. Heated gas expands to maintain balanced pressure.')}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-1">
                    <span className="font-bold text-amber-400 block text-sm">قانون غاي-لوساك (Gay-Lussac)</span>
                    <span className="font-mono text-amber-300 block font-bold">P₁ / T₁ = P₂ / T₂</span>
                    <p className="text-slate-400 leading-relaxed">
                      {t('عند ثبوت الحجم (V): تسخين الغاز المحصور يزيد طاقة حركة الجزيئات وعنف اصطدامها فيرتفع الضغط الداخلي رأسياً.', 'Fixed V: Confined gas heating boosts particle impact kinetic energy, driving internal pressure.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Real-World Engineering Applications */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-amber-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('تطبيقات واقعية في التكنولوجيا والحياة المعاصرة', 'Real-World Technology Applications')}</span>
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                    <span className="font-bold text-amber-300 block text-[13px]">
                      {t('1. دورة كارنو وكفاءة محركات السيارات ومحطات توليد الطاقة', '1. Carnot Cycle & Power Plant Efficiency Limits')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {t(
                        'وضع كارنو المعادلة الرياضية للحد الأقصى لكفاءة أي محرك حراري يعمل بين مستودع ساخن (T_hot) ومستودع بارد (T_cold): η = 1 - (T_cold / T_hot). لذلك تسعى محطات الكهرباء وتوربينات الطائرات للعمل بأعلى درجات حرارة ممكنة لرفع الكفاءة وتقليل الوقود المهدور.',
                        'Carnot established max thermal efficiency η = 1 - (T_cold / T_hot). Jet turbines and power plants burn fuels at maximum safe temperatures to minimize thermodynamic loss.'
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                    <span className="font-bold text-amber-300 block text-[13px]">
                      {t('2. كيف تعمل الثلاجات والمكيفات؟ (دورة التبريد الانضغاطية)', '2. How Refrigerators & Air Conditioners Work')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {t(
                        'لا يُنشئ المكيف "برودة"، بل ينقل الحرارة من داخل الغرفة إلى الشارع! يضغط الضاغط غاز الفريون لترتفع حرارته ويتحول لسائل مكثف في المشتت الخارجي طارداً الحرارة، ثم يمر عبر صمام تمدد دقيق (تأثير جول-طومسون) فينخفض ضغطه فجأة ويتبخر ممتصاً كميات هائلة من حرارة الغرفة.',
                        'Refrigerators transfer indoor heat outside through cyclic vapor compression, condensing hot gas and expanding it across throttling valves to chill air.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* CATEGORY: PHYSICS - ELECTROMAGNETISM (محاكي الكهرومغناطيسية وكولوم)    */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {activeCategory === 'physics_electro' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-purple-950/30 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-purple-400">
                      {t('موسوعة الكهرومغناطيسية وقانون كولوم والمجالات الكهربائية', 'Electromagnetism & Coulomb Fields Encyclopedia')}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {t('شرح القوة الكهروستاتيكية، متجهات المجال والجهد، قفص فاراداي، وتطبيقات الطابعات الليزرية', 'Coulomb\'s inverse-square law, vector field lines, potential energy, Faraday cages, and electrostatic tech')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Historical & Scientific Context */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-purple-400 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{t('الاكتشاف وتجربة ميزان الالتواء لشارل كولوم (1785)', 'Discovery & Charles Coulomb\'s Torsion Balance (1785)')}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(
                    'في عام 1785، صمم الفيزيائي والمهندس الفرنسي شارل كولوم جهازاً فائق الدقة سُمي «ميزان الالتواء» (Torsion Balance) لقياس القوى بالغة الضآلة بين الكرات المشحونة بالكهرباء الساكنة. من خلال قياس زاوية التواء خيط حريري رفيع بدقة، استنتج كولوم أن القوة تتناسب طردياً مع حاصل ضرب الشحنتين، وعكسياً مع مربع المسافة بينهما، مشابهاً في شكله لقانون الجاذبية الكونية لنيوتن، لكنه يفوقه بمليارات المليارات من المرات في القوة والشدة!',
                    'In 1785, Charles-Augustin de Coulomb invented the torsion balance to measure miniscule electrostatic forces. Measuring fiber twist angles established the inverse-square force law proportional to charge product.'
                  )}
                </p>
              </div>

              {/* 2. Coulomb's Law & Core Equations */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-purple-400 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>{t('قانون كولوم والمعادلات الحاكمة للمجال والجهد الكهربائي', 'Coulomb\'s Law, Electric Fields & Potential')}</span>
                </h4>
                
                <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 text-center mb-4">
                  <span className="font-mono text-purple-300 text-lg sm:text-xl font-black block mb-1">
                    F = k_e · (|q₁ · q₂|) / r²
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 mt-2 text-start pt-2 border-t border-slate-800">
                    <div><b className="text-purple-400 font-mono">F:</b> القوة المتبادلة (N)</div>
                    <div><b className="text-purple-400 font-mono">q₁, q₂:</b> الشحنات (C - كولوم)</div>
                    <div><b className="text-purple-400 font-mono">k_e:</b> 8.98755 × 10⁹ N·m²/C²</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-950/20 space-y-1">
                    <span className="font-bold text-purple-400 text-sm">شدة المجال الكهربائي (Electric Field E)</span>
                    <span className="font-mono text-purple-300 font-bold block">E = F / q = k_e · |Q| / r²  (N/C)</span>
                    <p className="text-slate-300 leading-relaxed">
                      {t('المجال الكهربائي هو خاصية فيزيائية للفضاء المحيط بالشحنة؛ يعبر اتجاهه عن اتجاه القوة المؤثرة على شحنة اختبارية موجبة افتراضية، وتخرج خطوطه من الشحنات الموجبة وتدخل في السالبة.', 'Electric field measures force per unit positive test charge; vector lines emanate from positive toward negative charges.')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 space-y-1">
                    <span className="font-bold text-cyan-400 text-sm">الجهد وطاقة الوضع (Potential & Energy)</span>
                    <span className="font-mono text-cyan-300 font-bold block">V = k_e · Q / r  (Volt) | U = q · V</span>
                    <p className="text-slate-300 leading-relaxed">
                      {t('الجهد الكهربائي هو طاقة الوضع لكل وحدة شحنة؛ وتتحرك الشحنات الموجبة تلقائياً من الجهد المرتفع إلى المنخفض، بينما تتحرك الإلكترونات السالبة نحو الجهد المرتفع.', 'Electric potential represents potential energy per unit charge; positive charges fall toward lower potentials, while electrons drift up.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Real-World Engineering Applications */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-purple-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('تطبيقات هندسية وتكنولوجية ملموسة', 'Engineering & Everyday Technologies')}</span>
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                    <span className="font-bold text-purple-300 block text-[13px]">
                      {t('1. قفص فاراداي (Faraday Cage) وحماية الطائرات والسيارات من الصواعق', '1. Faraday Cages: Lightning Protection in Airplanes & Cars')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {t(
                        'عندما يتعرض موصل مجوف (مثل هيكل الطائرة أو السيارة المصنوع من الألمنيوم والصلب) لشحنات خارجية أو ضربة صاعقة بآلاف الفولتات، تتوزع الشحنات فورياً على السطح الخارجي فقط ويتلاشى المجال الكهربائي تماماً داخل المقصورة (E = 0)، مما يحمي الركاب والأجهزة الإلكترونية الحساسة من أي صعق.',
                        'Charges placed on a hollow conductor rapidly redistribute entirely to exterior surfaces, ensuring net interior field is strictly zero and shielding passengers.'
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                    <span className="font-bold text-purple-300 block text-[13px]">
                      {t('2. الطابعات الليزرية وماكينات التصوير (Laser Printing & Electro-Xerography)', '2. Laser Printing & Electrostatic Toners')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {t(
                        'تعتمد الطباعة الليزرية بالكامل على الكهروستاتيكا؛ حيث تُشحن أسطوانة الطباعة بشحنة ساكنة موجبة، ثم يرسم شعاع الليزر الحروف بإلغاء الشحنة في مناطق محددة، فتنجذب حبيبات الحبر السالبة (Toner) حصراً للأماكن المشحونة وتُنقل إلى الورق ثم تُثبت حرارياً.',
                        'Laser printers use electrostatic drums where laser pulses discharge text patterns, attracting charged powdered toner particles onto paper.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* CATEGORY: PHYSICS - QUANTUM & OPTICS (محاكي البصريات والكم)           */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {activeCategory === 'physics_optics' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Orbit className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-indigo-400">
                      {t('موسوعة البصريات والظاهرة الكهروضوئية وفيزياء الكم', 'Quantum Physics & Photoelectric Effect Encyclopedia')}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {t('تفسير أينشتاين الحائز على نوبل، فوتونات الضوء، دالة الشغل، وازدواجية الموجة والجسيم', 'Einstein\'s Nobel-winning quantum photoelectric law, photon energy, work function, and wave-particle duality')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Historical & Scientific Context */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-indigo-400 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{t('ثورة فيزياء الكم وورقة أينشتاين المعجزة (1905)', 'Quantum Revolution & Einstein\'s Miracle Year (1905)')}</span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t(
                    'في نهاية القرن التاسع عشر، وقفت الفيزياء الكلاسيكية عاجزة تماماً عن تفسير الظاهرة الكهروضوئية: لماذا لا يحرر الضوء الأحمر الشديد إلكتروناً واحداً مهما زادت شدته، بينما ومضة خافتة جداً من الضوء فوق البنفسجي تحرر إلكترونات فورياً دون أي تأخير زمني؟ في عام 1905، قدّم ألبرت أينشتاين حلاً ثورياً حاز عليه جائزة نوبل في الفيزياء عام 1921: اقترح أن الضوء لا ينتقل فقط كموجات مستمرة، بل يتألف من حزم طاقة كمية مكممة منفصلة سميت "فوتونات" (Photons)، حيث يصطدم فوتون واحد بإلكترون واحد وينقل إليه طاقته بالكامل!',
                    'Classical physics failed to explain why intense red light emitted zero electrons while faint ultraviolet instantly freed electrons. In 1905, Albert Einstein proposed that light consists of quantized energy packets (photons) E = hf, winning him the 1921 Nobel Prize.'
                  )}
                </p>
              </div>

              {/* 2. Photoelectric Equations & Core Laws */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-indigo-400 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>{t('معادلة أينشتاين الكهروضوئية وحساب دالة الشغل', 'Einstein Photoelectric Equation & Work Function')}</span>
                </h4>
                
                <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 text-center mb-4">
                  <span className="font-mono text-indigo-300 text-lg sm:text-xl font-black block mb-1">
                    E_photon = h · f = Φ + K_max = Φ + e · V_stop
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 mt-2 text-start pt-2 border-t border-slate-800">
                    <div><b className="text-indigo-400 font-mono">h:</b> ثابت بلانك (6.626 × 10⁻³⁴ J·s)</div>
                    <div><b className="text-indigo-400 font-mono">f:</b> تردد الضوء الساقط (Hz)</div>
                    <div><b className="text-indigo-400 font-mono">Φ:</b> دالة الشغل للفلز (eV)</div>
                    <div><b className="text-indigo-400 font-mono">V_stop:</b> جهد الإيقاف (Volt)</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 space-y-1">
                    <span className="font-bold text-indigo-400 text-sm">تردد العتبة (Cutoff Threshold f₀)</span>
                    <span className="font-mono text-indigo-300 font-bold block">f₀ = Φ / h</span>
                    <p className="text-slate-300 leading-relaxed">
                      {t('هو أقل تردد للفوتون يمكنه تحرير إلكترون من سطح الفلز. إذا كان f < f₀ فلن تنبعث أي إلكترونات مهما بلغت شدة الإضاءة أو مدة التعرض.', 'Minimum light frequency required to liberate an electron. If f < f₀, no electrons can escape regardless of beam intensity.')}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-1">
                    <span className="font-bold text-amber-400 text-sm">الطبيعة المزدوجة وموجة دي برولي</span>
                    <span className="font-mono text-amber-300 font-bold block">λ = h / p = h / (m · v)</span>
                    <p className="text-slate-300 leading-relaxed">
                      {t('أثبت لويس دي برولي أن كل جسيم مادي متحرك (مثل الإلكترون) تصاحبه موجة حقيقية؛ وهو الاكتشاف الذي فتح الباب لاختراع المجهر الإلكتروني الفائق.', 'Louis de Broglie demonstrated moving matter exhibits wave characteristics, enabling electron microscopy.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Real-World Quantum Technologies */}
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <h4 className="font-bold text-sm text-indigo-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('تطبيقات تكنولوجية معاصرة غيرت العالم', 'Contemporary Technologies Powered by Quantum Optics')}</span>
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                    <span className="font-bold text-indigo-300 block text-[13px]">
                      {t('1. الخلايا والألواح الشمسية الكهروضوئية (Solar PV Cells)', '1. Solar Photovoltaic Panels')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {t(
                        'تعتمد الألواح الشمسية المصنوعة من السيليكون على الظاهرة الكهروضوئية؛ فعندما تصطدم فوتونات أشعة الشمس بسطح الخلية الشمسية، تنقل طاقتها إلى إلكترونات السيليكون فتتحرر وتتدفق عبر موصلات الخلية مشكلة تياراً كهربائياً نظيفاً يغذي المنازل والمدن.',
                        'Silicon solar panels absorb solar photons to free conduction electrons across p-n semiconductor junctions, producing clean electricity.'
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-1">
                    <span className="font-bold text-indigo-300 block text-[13px]">
                      {t('2. مستشعرات كاميرات الهواتف الذكية والتصوير الرقمي (CMOS Sensors)', '2. Digital Camera & Smartphone Image Sensors')}
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {t(
                        'كل بكسل في كاميرا هاتفك يحتوي على صمام ثنائي ضوئي يحرر شحنات إلكترونية عند سقوط فوتونات المشهد، ويحولها إلى إشارات رقمية ترسم تفاصيل صورتك بدقة متناهية.',
                        'Every pixel on smartphone camera sensors contains photodiodes liberating electrons upon photon impact to assemble digital images.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
            {t('نصيحة: يمكنك النقر على مقياس الأطوار في أي وقت لقفز الحرارة فورياً!', 'Tip: Click any phase scale mark anytime to jump temperatures instantly!')}
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-cyan-600/30 flex items-center justify-center gap-2"
          >
            <span>{t('فهمت كل شيء، عودة للمحاكي', 'Got it, return to simulator')}</span>
            {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
