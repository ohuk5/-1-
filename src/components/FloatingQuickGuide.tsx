import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Sparkles,
  Zap,
  Lightbulb,
  BookOpen,
  Calculator,
  Layers,
  Atom,
  Flame,
  Radiation,
  FlaskConical,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  GripHorizontal,
  RotateCcw,
  Wind,
  Orbit
} from 'lucide-react';
import { useApp, ActiveTabType, PhysicsStationId, AppDomain } from '../context/AppContext';

export const FloatingQuickGuide: React.FC = () => {
  const {
    lang,
    theme,
    t,
    currentDomain,
    setCurrentDomain,
    activeTab,
    setActiveTab,
    physicsStation,
    setPhysicsStation,
    openCurriculum,
    openCalculator
  } = useApp();

  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [guideDomain, setGuideDomain] = useState<AppDomain>(currentDomain);
  const [selectedGuideKey, setSelectedGuideKey] = useState<string>('atom-builder');

  // Draggable Window State
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // Sync guide domain with current global domain when opening or switching
  useEffect(() => {
    setGuideDomain(currentDomain);
    if (currentDomain === 'chemistry') {
      setSelectedGuideKey(activeTab);
    } else {
      setSelectedGuideKey(physicsStation);
    }
  }, [currentDomain, activeTab, physicsStation]);

  // Tab scroll helper
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabScrollRef.current) {
      const scrollOffset = 180;
      tabScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollOffset : scrollOffset,
        behavior: 'smooth'
      });
    }
  };

  // Dragging logic with mouse and touch support
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: clientX,
      mouseY: clientY,
      startX: position ? position.x : rect.left,
      startY: position ? position.y : rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from the header grip area or header bar, not buttons
    if ((e.target as HTMLElement).closest('button')) return;
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !dragStartRef.current) return;
      const dx = clientX - dragStartRef.current.mouseX;
      const dy = clientY - dragStartRef.current.mouseY;

      let newX = dragStartRef.current.startX + dx;
      let newY = dragStartRef.current.startY + dy;

      // Clamp within viewport
      const cardWidth = cardRef.current?.offsetWidth || 420;
      const cardHeight = cardRef.current?.offsetHeight || 480;
      const maxX = window.innerWidth - cardWidth - 10;
      const maxY = window.innerHeight - cardHeight - 10;

      newX = Math.max(10, Math.min(newX, maxX));
      newY = Math.max(10, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  const resetPosition = () => {
    setPosition(null);
  };

  // Comprehensive Guides Definitions
  const chemistryGuides: Record<
    string,
    {
      tabId: ActiveTabType;
      num: string;
      titleAr: string;
      titleEn: string;
      shortAr: string;
      shortEn: string;
      icon: React.ReactNode;
      goalAr: string;
      goalEn: string;
      stepsAr: string[];
      stepsEn: string[];
      tipAr: string;
      tipEn: string;
    }
  > = {
    'atom-builder': {
      tabId: 'atom-builder',
      num: '01',
      titleAr: 'بناء وتوزيع الذرات (1-118)',
      titleEn: 'Atom Builder & Orbitals (1-118)',
      shortAr: 'الذرات',
      shortEn: 'Atoms',
      icon: <Atom className="w-4 h-4 text-cyan-400" />,
      goalAr: 'تركيب نواة الذرة (بروتونات ونيوترونات) والمدارات الإلكترونية ومراقبة الاستقرار وشحنة الأيون لجميع العناصر.',
      goalEn: 'Build atomic nuclei and electron shells while monitoring nuclear stability and ionic charge.',
      stepsAr: [
        'اختر عنصراً من القائمة السريعة أو أدخل عدد البروتونات مباشرة من شريط التحكم.',
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
      tabId: 'molecule-builder',
      num: '02',
      titleAr: 'تكوين الجزيئات والمجسم ثلاثي الأبعاد',
      titleEn: 'Molecule Builder & 3D Geometry',
      shortAr: 'المركبات',
      shortEn: 'Molecules',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      goalAr: 'تجميع الذرات بروابط تساهمية واستكشاف الشكل الفراغي ثلاثي الأبعاد (نموذج الكرات والعصي) والقطبية وتركيب لويس.',
      goalEn: 'Assemble atoms with covalent bonds and explore 3D ball-and-stick geometry and polarity.',
      stepsAr: [
        'انقر على أي ذرة في لوحة العناصر لإضافتها لساحة التجميع وسحب الروابط بينها.',
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
      tabId: 'states-of-matter',
      num: '03',
      titleAr: 'حالات المادة والتحولات الطورية',
      titleEn: 'States of Matter & Phase Transitions',
      shortAr: 'حالات المادة',
      shortEn: 'States',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
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
      tabId: 'radioactive-decay',
      num: '04',
      titleAr: 'النشاط الإشعاعي وعمر النصف',
      titleEn: 'Radioactive Decay & Half-Life',
      shortAr: 'النشاط الإشعاعي',
      shortEn: 'Decay',
      icon: <Radiation className="w-4 h-4 text-emerald-400" />,
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
      tabId: 'experiments-lab',
      num: '05',
      titleAr: 'معمل التجارب التفاعلي (14 تجربة معتمدة)',
      titleEn: 'Experimental Lab (14 Curriculum Labs)',
      shortAr: 'معمل التجارب',
      shortEn: 'Lab',
      icon: <FlaskConical className="w-4 h-4 text-rose-400" />,
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

  const physicsGuides: Record<
    string,
    {
      stationId: PhysicsStationId;
      num: string;
      titleAr: string;
      titleEn: string;
      shortAr: string;
      shortEn: string;
      icon: React.ReactNode;
      goalAr: string;
      goalEn: string;
      stepsAr: string[];
      stepsEn: string[];
      tipAr: string;
      tipEn: string;
    }
  > = {
    gas_fluid: {
      stationId: 'gas_fluid',
      num: '01',
      titleAr: 'قوانين الغازات والموائع وقاعدة أرخميدس',
      titleEn: 'Gas Laws & Archimedes Buoyancy',
      shortAr: 'الغازات والموائع',
      shortEn: 'Gas & Fluids',
      icon: <Wind className="w-4 h-4 text-cyan-400" />,
      goalAr: 'استكشاف قوانين بويل وشارل وغاي-لوساك وتصادمات الجسيمات المرنة، مع حوض الموائع لاختبار قوى الطفو وكثافة الأجسام.',
      goalEn: 'Explore Boyle, Charles, and Gay-Lussac gas laws, particle kinetics, and Archimedes fluid buoyancy in various fluids.',
      stepsAr: [
        'اسحب المكبس لتغيير الحجم أو ارفع شعلة الحرارة لمراقبة ارتفاع الضغط وسرعة الجسيمات.',
        'انتقل لتبويب "خزان الطفو" لغمر كتل مختلفة واختبار الطفو في الماء أو الزيت أو العسل أو الزئبق.'
      ],
      stepsEn: [
        'Drag the piston to alter volume or push the burner up to observe pressure rise and particle speeds.',
        'Switch to the Buoyancy Tank tab to submerge blocks and compare buoyancy in water, oil, honey, or mercury.'
      ],
      tipAr: 'يمكنك تثبيت درجة الحرارة لمراقبة قانون بويل (علاقة عكسية بين الحجم والضغط) بدقة بالغة.',
      tipEn: 'Lock Temperature to strictly isolate Boyle\'s law (inverse relationship between volume and pressure).'
    },
    electrostatics: {
      stationId: 'electrostatics',
      num: '02',
      titleAr: 'الكهرباء الساكنة وحقول كولوم',
      titleEn: 'Electrostatics & Coulomb Fields',
      shortAr: 'الكهرباء الساكنة',
      shortEn: 'Electrostatics',
      icon: <Zap className="w-4 h-4 text-purple-400" />,
      goalAr: 'محاكاة قانون كولوم وحساب القوة المتبادلة ورسم متجهات المجال الكهربائي والجهد وإطلاق شحنات اختبارية.',
      goalEn: 'Simulate Coulomb\'s law, calculate mutual electric force, render vector fields, and launch test charges.',
      stepsAr: [
        'اسحب الشحنة الموجبة أو السالبة في الفضاء لمشاهدة انحناء خطوط المجال الكهربائي في الوقت الفعلي.',
        'فعل زر "إطلاق شحنة اختبارية" لمشاهدة مسار تسارعها بفعل محصلة القوى الكهروستاتيكية.'
      ],
      stepsEn: [
        'Drag positive or negative charges around the canvas to see real-time dynamic electric field vectors.',
        'Click "Launch Test Charge" to observe its calculated trajectory driven by net Coulomb forces.'
      ],
      tipAr: 'قيمة ثابت كولوم القياسي: $k_e = 8.99 \\times 10^9 \\; \\text{N}\\cdot\\text{m}^2/\\text{C}^2$.',
      tipEn: 'Coulomb\'s constant: $k_e = 8.99 \\times 10^9 \\; \\text{N}\\cdot\\text{m}^2/\\text{C}^2$.'
    },
    optics_quantum: {
      stationId: 'optics_quantum',
      num: '03',
      titleAr: 'البصريات والظاهرة الكهروضوئية والكم',
      titleEn: 'Optics & Photoelectric Effect',
      shortAr: 'البصريات والكم',
      shortEn: 'Optics & Quantum',
      icon: <Orbit className="w-4 h-4 text-amber-400" />,
      goalAr: 'محاكاة تجربة أينشتاين للظاهرة الكهروضوئية، دالة الشغل للمعادن، جهد الإيقاف، وأطياف الانبعاث الذري للغازات.',
      goalEn: 'Simulate Einstein\'s photoelectric effect, metal work functions, stopping potential, and atomic emission spectra.',
      stepsAr: [
        'اضبط طول موجة الضوء الساقط إلى النطاق فوق البنفسجي حتى تتجاوز طاقة الفوتون دالة شغل المهبط.',
        'ارفع جهد الإيقاف العكسي حتى يتوقف انبعاث الإلكترونات الضوئية تماماً وقياس أقصى طاقة حركية.'
      ],
      stepsEn: [
        'Decrease wavelength to UV until photon energy exceeds the cathode metal work function.',
        'Increase reverse stopping voltage until photoelectrons cease flowing to measure kinetic energy.'
      ],
      tipAr: 'انتقل إلى تبويب "طيف الانبعاث الذري" لاستكشاف خطوط بالمر للهيدروجين وأطياف الهيليوم والنيون والصوديوم.',
      tipEn: 'Switch to the Atomic Spectra tab to explore Hydrogen Balmer lines and noble gas emission spectra.'
    }
  };

  // Determine active guide item
  const activeGuide =
    guideDomain === 'chemistry'
      ? chemistryGuides[selectedGuideKey] || chemistryGuides['atom-builder']
      : physicsGuides[selectedGuideKey] || physicsGuides['gas_fluid'];

  return (
    <>
      {/* Floating Trigger Badge - Anchored on the LEFT side away from Netlify's bottom-right badge */}
      <div className="fixed bottom-6 left-6 z-40 print:hidden">
        {!isOpen ? (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/40 text-white shadow-cyan-950/40'
                : 'bg-white hover:bg-slate-50 border-cyan-500/50 text-slate-900 shadow-cyan-500/20'
            }`}
            title={t('فتح دليل الاستعمال السريع القابل للسحب (مبتعد عن شعار Netlify)', 'Open Draggable Quick Guide')}
          >
            <div className="relative">
              {currentDomain === 'physics' ? (
                <Orbit className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300 animate-spin-slow" />
              ) : (
                <Sparkles className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
              )}
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <div className="text-start">
              <span className="block text-xs font-bold leading-tight">
                {t('دليل الاستعمال السريع', 'Quick Guide')}
              </span>
              <span className="block text-[10px] text-cyan-400 leading-none mt-0.5 font-medium">
                {isAr ? activeGuide.shortAr : activeGuide.shortEn}
              </span>
            </div>
          </button>
        ) : null}
      </div>

      {/* Draggable Floating Guide Window */}
      {isOpen && (
        <div
          ref={cardRef}
          style={
            position
              ? {
                  position: 'fixed',
                  left: `${position.x}px`,
                  top: `${position.y}px`,
                  zIndex: 50
                }
              : undefined
          }
          className={`${
            !position ? 'fixed bottom-20 left-6 z-50' : ''
          } w-[92vw] sm:w-[440px] rounded-3xl border shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden transition-shadow select-none ${
            isDark
              ? 'bg-slate-900/95 border-cyan-500/40 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
              : 'bg-white/95 border-cyan-500/50 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.2)]'
          } ${isDragging ? 'opacity-95 ring-2 ring-cyan-400/60' : ''}`}
        >
          {/* Header Bar with Drag Handle */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`p-3.5 border-b flex items-center justify-between cursor-grab active:cursor-grabbing ${
              isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-slate-50/90'
            }`}
            title={t('اسحب من هنا لتحريك النافذة في أي مكان', 'Drag here to reposition guide')}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${
                guideDomain === 'physics'
                  ? 'bg-gradient-to-tr from-purple-600 to-amber-600'
                  : 'bg-gradient-to-tr from-cyan-500 to-blue-600'
              }`}>
                {guideDomain === 'physics' ? <Orbit className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold">
                    {t('دليل الاستخدام السريع', 'Quick Guide')}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono font-bold">
                    v2.5
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <GripHorizontal className="w-3 h-3 text-cyan-500 inline" />
                  {t('نافذة قابلة للسحب والتحريك', 'Draggable window')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {position && (
                <button
                  type="button"
                  onClick={resetPosition}
                  className={`p-1.5 rounded-xl border transition-colors ${
                    isDark
                      ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                  }`}
                  title={t('إعادة للموضع الافتراضي', 'Reset default position')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-xl border transition-colors ${
                  isDark
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white'
                    : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                }`}
                title={t('تصغير الدليل', 'Minimize Guide')}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Domain Segment Selector Inside Guide (Chemistry vs Physics) */}
          <div className={`px-3 py-2 border-b flex items-center gap-2 ${
            isDark ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-100/70 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => {
                setGuideDomain('chemistry');
                setSelectedGuideKey('atom-builder');
                setCurrentDomain('chemistry');
                setActiveTab('atom-builder');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                guideDomain === 'chemistry'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isDark
                  ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>{t('أقسام الكيمياء (5)', 'Chemistry (5)')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGuideDomain('physics');
                setSelectedGuideKey('gas_fluid');
                setCurrentDomain('physics');
                setPhysicsStation('gas_fluid');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                guideDomain === 'physics'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark
                  ? 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Orbit className="w-3.5 h-3.5" />
              <span>{t('محطات الفيزياء (3)', 'Physics (3)')}</span>
            </button>
          </div>

          {/* Smoothly Scrollable Tab Bar with Arrow Navigation */}
          <div className={`relative px-2 py-2 border-b flex items-center gap-1 ${
            isDark ? 'bg-slate-950/20 border-slate-800/70' : 'bg-slate-50 border-slate-200/70'
          }`}>
            <button
              type="button"
              onClick={() => scrollTabs('right')}
              className={`p-1.5 rounded-lg border shrink-0 transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title={t('تمرير يميناً', 'Scroll Right')}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <div
              ref={tabScrollRef}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto scroll-smooth scrollbar-none py-0.5"
            >
              {guideDomain === 'chemistry'
                ? Object.keys(chemistryGuides).map((key) => {
                    const item = chemistryGuides[key];
                    const isSelected = selectedGuideKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedGuideKey(key);
                          setCurrentDomain('chemistry');
                          setActiveTab(item.tabId);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-all border ${
                          isSelected
                            ? 'bg-cyan-600 border-cyan-400 text-white shadow-sm'
                            : isDark
                            ? 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span className="font-mono text-[10px] text-slate-400">{item.num}.</span>
                        <span className="truncate max-w-[90px]">{isAr ? item.shortAr : item.shortEn}</span>
                      </button>
                    );
                  })
                : Object.keys(physicsGuides).map((key) => {
                    const item = physicsGuides[key];
                    const isSelected = selectedGuideKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedGuideKey(key);
                          setCurrentDomain('physics');
                          setPhysicsStation(item.stationId);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-all border ${
                          isSelected
                            ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                            : isDark
                            ? 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span className="font-mono text-[10px] text-slate-400">{item.num}.</span>
                        <span className="truncate max-w-[90px]">{isAr ? item.shortAr : item.shortEn}</span>
                      </button>
                    );
                  })}
            </div>

            <button
              type="button"
              onClick={() => scrollTabs('left')}
              className={`p-1.5 rounded-lg border shrink-0 transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title={t('تمرير يساراً', 'Scroll Left')}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Guide Card Body */}
          <div className="p-4 space-y-3.5 max-h-[360px] overflow-y-auto">
            {/* Active Section Goal */}
            <div
              className={`p-3 rounded-2xl border ${
                isDark ? 'bg-slate-800/50 border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                  {activeGuide.icon}
                </div>
                <h5 className="text-xs font-bold text-cyan-400">
                  {isAr ? activeGuide.titleAr : activeGuide.titleEn}
                </h5>
              </div>
              <p className="text-xs text-slate-300 dark:text-slate-300 leading-relaxed">
                {isAr ? activeGuide.goalAr : activeGuide.goalEn}
              </p>
            </div>

            {/* Quick Steps */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                {t('خطوات سريعة للبدء فوراً:', 'Quick Steps to Start:')}
              </span>
              <div className="space-y-1.5">
                {activeGuide.stepsAr.map((step, idx) => (
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
                      {isAr ? step : activeGuide.stepsEn[idx]}
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
                <span>{isAr ? activeGuide.tipAr : activeGuide.tipEn}</span>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
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

              {guideDomain === 'chemistry' ? (
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
                  <span>{t('مرجع كيمياء 3', 'Book Ref')}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Footer Bar */}
          <div
            className={`p-3 border-t text-[11px] flex items-center justify-between ${
              isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'
            }`}
          >
            <span>{t('يمكنك سحب النافذة لأي موضع مريح', 'Drag window anywhere freely')}</span>
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
    </>
  );
};
