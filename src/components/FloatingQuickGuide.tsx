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
  Orbit,
  GraduationCap,
  Info
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
  const [physicsTabMode, setPhysicsTabMode] = useState<'info' | 'steps'>('info');

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
      coreFormula: string;
      scientificInfoAr: {
        concept: string;
        explanation: string;
        applications: string[];
        fact: string;
      };
      scientificInfoEn: {
        concept: string;
        explanation: string;
        applications: string[];
        fact: string;
      };
      stepsAr: string[];
      stepsEn: string[];
      tipAr: string;
      tipEn: string;
    }
  > = {
    mechanics: {
      stationId: 'mechanics',
      num: '01',
      titleAr: 'محاكي الميكانيكا وقاعدة أرخميدس',
      titleEn: 'Mechanics & Archimedes Simulator',
      shortAr: 'محاكي الميكانيكا',
      shortEn: 'Mechanics',
      icon: <Wind className="w-4 h-4 text-cyan-400" />,
      goalAr: 'دراسة ميكانيكا الموائع، قاعدة أرخميدس، حساب قوى الطفو وضغط السوائل واختبار طفو المواد وكثافتها.',
      goalEn: 'Study fluid mechanics, Archimedes buoyancy force, hydrostatic pressure, and density testing.',
      coreFormula: 'F_b = ρ_fluid · V_displaced · g',
      scientificInfoAr: {
        concept: 'قاعدة أرخميدس والضغط الهيدروستاتيكي',
        explanation: 'ينص مبدأ أرخميدس على أن أي جسم مغمور كلياً أو جزئياً في مائع تؤثر عليه قوة رأسية للأعلى تسمى قوة الطفو، وتساوي تماماً وزن المائع الذي يزيحه الجسم. يطفو الجسم إذا كانت كثافته الإجمالية أقل من كثافة السائل المحيط به، ويغوص إذا تجاوزتها.',
        applications: [
          'هندسة الغواصات: تملأ وتفرغ خزانات الصابورة (Ballast) بالماء للتحكم بمعدل الغوص والطفو.',
          'السفن الفولاذية: حجم التجويف الهوائي يرفع الحجم الكلي المزاح مما يجعل متوسط كثافة السفينة أقل من الماء.',
          'المناطيد وبالونات الطقس: ملء الغلاف بغاز الهيليوم أو الهواء الساخن الأقل كثافة من الهواء الجوي.'
        ],
        fact: 'شذوذ كثافة الماء: يصل الماء لأعلى كثافة عند 4°C ويتمدد عند التجمّد ليطفو الجليد، مما يحمي الحياة البحرية شتاءً!'
      },
      scientificInfoEn: {
        concept: 'Archimedes Principle & Hydrostatic Pressure',
        explanation: 'Any object wholly or partly submerged in a fluid is buoyed up by a force equal to the weight of fluid displaced. Objects float if their overall density is below fluid density and sink if greater.',
        applications: [
          'Submarines: Flood and blow ballast tanks to control net buoyancy for diving and surfacing.',
          'Steel Cargo Ships: Massive internal hollow volume keeps mean vessel density far below water density.',
          'Hot Air Balloons & Airships: Use lower-density heated air or helium to float in atmospheric fluid.'
        ],
        fact: 'Water Density Anomaly: Water is densest at 4°C and expands when freezing, allowing ice to float and insulate marine ecosystems!'
      },
      stepsAr: [
        'اختر نوع السائل (ماء نقي 1000 kg/m³، زيت 920 kg/m³، عسل 1420 kg/m³، أو زئبق 13600 kg/m³) ولاحظ تغير قوة الطفو.',
        'اضبط كثافة وحجم الجسم واختبر طفوه أو غوصه مع تغيير تسارع الجاذبية في كواكب مختلفة (الأرض، القمر، المشتري).'
      ],
      stepsEn: [
        'Select fluid type (water, oil, honey, mercury) to observe buoyant force scaling with fluid density.',
        'Adjust object density and displacement volume across Earth, Moon, and Jupiter gravity regimes.'
      ],
      tipAr: 'قوة الطفو لا تعتمد على عمق الغمر بمجرد أن يغمر الجسم بالكامل، بل تعتمد حصراً على حجم السائل المزاح وكثافته.',
      tipEn: 'Buoyant force does not depend on depth once fully submerged; it depends solely on fluid density and displaced volume.'
    },
    thermodynamics: {
      stationId: 'thermodynamics',
      num: '02',
      titleAr: 'محاكي الديناميكا الحرارية والغازات',
      titleEn: 'Thermodynamics & Gas Kinetics',
      shortAr: 'محاكي الديناميكا الحرارية',
      shortEn: 'Thermodynamics',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      goalAr: 'استكشاف النظرية الحركية للغازات، معادلة الحالة العامة PV=nRT، وعلاقات بويل وشارل وغاي-لوساك.',
      goalEn: 'Explore kinetic theory of gases, ideal gas equation PV=nRT, and gas laws.',
      coreFormula: 'P · V = n · R · T   |   K_avg = (3/2) · k_B · T',
      scientificInfoAr: {
        concept: 'النظرية الحركية للغازات والديناميكا الحرارية',
        explanation: 'يفسر النموذج المجهري ضغط الغاز بأنه محصلة مليارات التصادمات المرنة لجسيمات الغاز العشوائية مع الجدران. درجة الحرارة المطلقة بالكلفن هي مقياس مباشر لمتوسط الطاقة الحركية الانتقالية لجزيئات الغاز.',
        applications: [
          'محركات الاحتراق الداخلي: استغلال التمدد الحراري اللحظي للغاز المحترق لدفع مكابس المحرك.',
          'الثلاجات والمكيفات: دورة التبريد بالانضغاط وتأثير التمدد الخانق للغازات (تأثير جول-طومسون).',
          'أسطوانات الغاز وإطارات السيارات: زيادة حرارة الجو ترفع ضغط الإطارات تلقائياً حسب قانون غاي-لوساك.'
        ],
        fact: 'الصفر المطلق (0 Kelvin = -273.15°C) هو أدنى درجة حرارة ممكنة نظرياً تتوقف عندها الحركة الانتقالية الكلاسيكية للجسيمات!'
      },
      scientificInfoEn: {
        concept: 'Kinetic Theory of Gases & Thermodynamics',
        explanation: 'Gas pressure emerges from billions of microscopic elastic collisions against boundary walls. Absolute temperature in Kelvin is directly proportional to mean translational kinetic energy.',
        applications: [
          'Internal Combustion Engines: Rapid thermal expansion of ignited gas mixture drives pistons.',
          'Refrigeration & Heat Pumps: Vapor compression cycles and throttling Joule-Thomson expansion.',
          'Vehicle Tire Safety: Temperature increases directly drive tire air pressure via Gay-Lussac\'s law.'
        ],
        fact: 'Absolute Zero (0 K = -273.15°C) represents the lowest theoretical temperature where classical thermal motion ceases!'
      },
      stepsAr: [
        'اسحب المكبس لتغيير الحجم أو ارفع شعلة الحرارة لمراقبة ارتفاع الضغط ومعدل تصادمات الجسيمات.',
        'فعّل تثبيت أحد المتغيرات لعزل قوانين بويل (ثبات T) أو شارل (ثبات P) أو غاي-لوساك (ثبات V).'
      ],
      stepsEn: [
        'Drag the piston to alter volume or ignite the burner to watch pressure climb alongside particle velocities.',
        'Lock a variable to isolate Boyle\'s law (const T), Charles\'s law (const P), or Gay-Lussac\'s law (const V).'
      ],
      tipAr: 'ثابت الغازات العام: R = 8.314 J/(mol·K) = 0.08206 L·atm/(mol·K).',
      tipEn: 'Universal gas constant: R = 8.314 J/(mol·K) = 0.08206 L·atm/(mol·K).'
    },
    electromagnetism: {
      stationId: 'electromagnetism',
      num: '03',
      titleAr: 'محاكي الكهرومغناطيسية وحقول كولوم',
      titleEn: 'Electromagnetism & Coulomb Fields',
      shortAr: 'محاكي الكهرومغناطيسية',
      shortEn: 'Electromagnetism',
      icon: <Zap className="w-4 h-4 text-purple-400" />,
      goalAr: 'محاكاة قانون كولوم وحساب القوة المتبادلة ورسم متجهات المجال الكهربائي والجهد وإطلاق شحنات اختبارية.',
      goalEn: 'Simulate Coulomb\'s law, calculate mutual electric force, render vector fields, and launch test charges.',
      coreFormula: 'F = k_e · (|q₁ · q₂|) / r²   |   k_e ≈ 8.99 × 10⁹ N·m²/C²',
      scientificInfoAr: {
        concept: 'قانون كولوم وخصائص المجال الكهروستاتيكي',
        explanation: 'تتناسب القوة الكهروستاتيكية المتبادلة بين أي شحنتين نقطيتين طردياً مع حاصل ضرب مقدار الشحنتين وعكسياً مع مربع المسافة الفاصلة بينهما. تتنافر الشحنات المتشابهة وتتجاذب الشحنات المختلفة، وتتجه خطوط المجال من الشحنة الموجبة إلى السالبة.',
        applications: [
          'قفص فاراداي (Faraday Cage): انعدام المجال الكهربائي داخل الموصلات المجوفة لحماية الطائرات والسيارات من الصواعق.',
          'الطابعات الليزرية وماكينات التصوير: شحن الأسطوانة الكهروستاتيكية لجذب دقائق الحبر الأسود بدقة متناهية.',
          'مرسبات الدخان الصناعية: شحن جزيئات السخام والرماد في مداخن المصانع لجذبها وتصفيتها قبل خروجها للجو.'
        ],
        fact: 'القوة الكهروستاتيكية بين إلكترون وبروتون أقوى من قوة الجاذبية بينهما بحوالي 10³⁹ مرة!'
      },
      scientificInfoEn: {
        concept: 'Coulomb\'s Law & Electrostatic Field Properties',
        explanation: 'The electrostatic force between two point charges is proportional to the product of charges and inversely proportional to distance squared. Like charges repel, opposite charges attract, and field lines emanate from positive toward negative.',
        applications: [
          'Faraday Cages: Zero electric field inside hollow conductors protects passengers in airplanes and cars from lightning strikes.',
          'Laser Printers & Photocopiers: Static charge patterns attract toner powder to paper with microscopic precision.',
          'Industrial Precipitators: Electrostatic charging of smokestack soot particles captures air pollutants.'
        ],
        fact: 'The electrostatic force between an electron and proton is approximately 10³⁹ times stronger than their mutual gravitational pull!'
      },
      stepsAr: [
        'اسحب الشحنات الموجبة والسالبة في الفضاء لمشاهدة انحناء خطوط المجال الكهربائي في الوقت الفعلي.',
        'فعل زر "إطلاق شحنة اختبارية" لمشاهدة مسار تسارعها بفعل محصلة القوى الكهروستاتيكية.'
      ],
      stepsEn: [
        'Drag positive and negative charges around the canvas to see real-time dynamic electric field vectors.',
        'Click "Launch Test Charge" to observe its calculated trajectory driven by net Coulomb forces.'
      ],
      tipAr: 'المجال الكهربائي عند أي نقطة هو القوة المؤثرة على وحدة الشحنات الموجبة الموضوعة عند تلك النقطة (E = F / q).',
      tipEn: 'The electric field at any point represents the force per unit positive test charge placed there (E = F / q).'
    },
    optics_quantum: {
      stationId: 'optics_quantum',
      num: '04',
      titleAr: 'محاكي البصريات الهندسية والفيزياء الموجية والكم',
      titleEn: 'Optics, Wave Physics & Quantum Simulator',
      shortAr: 'البصريات والكم (4 محطات)',
      shortEn: 'Optics & Quantum',
      icon: <Orbit className="w-4 h-4 text-indigo-400" />,
      goalAr: 'استكشاف شامل للعدسات المحدبة والمقعرة، انعكاس وانكسار الضوء وقانون سنيل، تشتت الضوء بالمنشور، والظاهرة الكهروضوئية وأطياف الانبعاث الذري.',
      goalEn: 'Comprehensive exploration of convex/concave lenses, Snell\'s law refraction, prism dispersion, and photoelectric effect with atomic spectra.',
      coreFormula: '1/f = 1/d_o + 1/d_i   |   n₁·sin θ₁ = n₂·sin θ₂   |   E = h·f = Φ + K_max',
      scientificInfoAr: {
        concept: 'البصريات الهندسية، الانكسار والمنشور، وتكميم طاقة الضوء',
        explanation: 'تجمع المحطة بين البصريات الهندسية والضوئية والفيزياء الكمية: من انكسار الأشعة في العدسات المحدبة (المجمعة) والمقعرة (المفرقة) وتحديد صفات الصور، إلى قانون سنيل والانعكاس الكلي الداخلي عند الزاوية الحرجة (θ_c = arcsin n₂/n₁)، وتشتت الضوء الأبيض في المنشور الزجاجي إلى ألوان الطيف السبعة بفعل اختلاف معاملات انكسار الأطوال الموجية، وصولاً إلى ثورة الكم وتفسير أينشتاين لتحرير الإلكترونات بالفوتونات المنفصلة.',
        applications: [
          'العدسات الطبية والكاميرات والتلسكوبات الفلكية: تصحيح قصر وطول النظر وتركيب المجاهر الفائقة.',
          'كابلات الألياف الضوئية (Fiber Optics): نقل الإنترنت فائق السرعة بالاعتماد على الانعكاس الكلي الداخلي بنسبة 100%.',
          'المطيافية الضوئية والتحليل الطيفي: استخدام المناشير ومحززات الحيود لتحليل الغازات والنجوم البعيدة.',
          'الخلايا الشمسية ومستشعرات الكاميرات (CMOS/CCD): تحويل فوتونات الضوء إلى طاقة كهربائية وصور رقمية.'
        ],
        fact: 'في عام 1666 استخدم إسحاق نيوتن منشورين زجاجيين ليثبت أن الضوء الأبيض ليس نقياً بل يتكون من جميع ألوان الطيف مجتمعة، بينما نال أينشتاين نوبل 1921 لتفسير الظاهرة الكهروضوئية!'
      },
      scientificInfoEn: {
        concept: 'Geometrical Optics, Refraction, Prisms & Quantum Light',
        explanation: 'Unifies classical ray optics, wave dispersion, and modern quantum physics: from convex/concave lens image formation and ray tracing, to Snell\'s law and Total Internal Reflection (TIR) at critical angles, prism chromatic dispersion of white light into the visible spectrum, and Einstein\'s photoelectric quantization.',
        applications: [
          'Ophthalmic Lenses & Telescopes: Vision correction (myopia/hyperopia) and high-power astronomical observatories.',
          'Fiber Optics Telecommunications: High-speed internet backbone using 100% Total Internal Reflection.',
          'Spectroscopy & Prism Analysis: Unraveling elemental chemical signatures in distant stars.',
          'Photovoltaics & Digital Camera Sensors: Converting light quanta directly into electricity and digital pixels.'
        ],
        fact: 'Sir Isaac Newton used glass prisms in 1666 to prove white light contains all rainbow colors, while Albert Einstein won the 1921 Nobel Prize for unlocking the quantum photoelectric effect!'
      },
      stepsAr: [
        '01. العدسات: اختر عدسة محدبة أو مقعرة، واسحب الجسم (الشمعة أو السهم) لمراقبة مسارات الأشعة الثلاثة وتكون الصور الحقيقية والتقديرية وحساب التكبير.',
        '02. الانكسار وقانون سنيل: حرّك زاوية مصدر الليزر وغيّر وسطي السقوط والانكسار (هواء، ماء، زيت، زجاج، ألماس) ولاحظ زاوية الانعكاس والانكسار وظهور الانعكاس الكلي الداخلي عند تجاوز الزاوية الحرجة.',
        '03. المنشور الزجاجي: اسحب الكشاف الضوئي، واختبر تشتت الضوء الأبيض إلى ألوان الطيف السبعة أو مرر شعاع ليزر أحادي اللون، وقارن بين زجاج التاج وفلنت.',
        '04. الكهروضوئية والكم ومطياف الانبعاث: اختر فلز المهبط واضبط الطول الموجي λ وجهد الإيقاف بالبطارية المعاكسة، أو تصفح أطياف التفريغ الكهربائي في المطياف الضوئي.',
      ],
      stepsEn: [
        '01. Lenses: Select convex or concave lens, drag the object candle/arrow to observe real-time 3-ray tracing, real/virtual images, and magnification.',
        '02. Refraction & Snell\'s Law: Drag laser angle and test different media (air, water, oil, glass, diamond) to watch refraction and Total Internal Reflection at critical angle.',
        '03. Glass Prism: Drag the flashlight, toggle between white light rainbow dispersion and monochromatic laser, comparing crown vs flint glass dispersion.',
        '04. Photoelectric, Bohr & Spectrometer: Choose cathode metal and stopping voltage, or explore discharge gas emission lines in the integrated Optical Spectrometer.',
      ],
      tipAr: 'يمكنك سحب مصدر الضوء والجسم مباشرة بالفأرة أو اللمس داخل أي محاكاة للتفاعل الفوري مع الأشعة والنتائج الحسابية!',
      tipEn: 'You can drag light sources and objects directly with mouse or touch on canvas for instant ray-tracing and calculation updates!'
    }
  };

  // Determine active guide item based strictly on currentDomain
  const activeGuide =
    currentDomain === 'chemistry'
      ? chemistryGuides[selectedGuideKey] || chemistryGuides['atom-builder']
      : physicsGuides[selectedGuideKey] || physicsGuides['mechanics'] || physicsGuides['thermodynamics'] || physicsGuides['electromagnetism'] || physicsGuides['optics_quantum'];

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
                <Orbit className="w-5 h-5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Sparkles className="w-5 h-5 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
              )}
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
          } w-[92vw] sm:w-[440px] tablet-quick-guide rounded-3xl border shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden transition-shadow select-none ${
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

          {/* Domain Dedicated Isolated Header Banner (Chemistry Only OR Physics Only) */}
          <div className={`px-4 py-2 border-b flex items-center justify-between gap-2 ${
            currentDomain === 'chemistry'
              ? isDark ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-300' : 'bg-cyan-50/80 border-cyan-200 text-cyan-800'
              : isDark ? 'bg-purple-950/40 border-purple-800/40 text-purple-300' : 'bg-purple-50/80 border-purple-200 text-purple-800'
          }`}>
            <div className="flex items-center gap-2 font-bold text-xs">
              {currentDomain === 'chemistry' ? (
                <>
                  <FlaskConical className="w-4 h-4 text-cyan-400" />
                  <span>{t('دليل استخدام الكيمياء (5 أقسام)', 'Chemistry Lab Guide (5 Sections)')}</span>
                </>
              ) : (
                <>
                  <Orbit className="w-4 h-4 text-purple-400" />
                  <span>{t('دليل استخدام الفيزياء (4 محطات وتجارب المنهج)', 'Physics Lab Guide (4 Simulators & Curriculum)')}</span>
                </>
              )}
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-current opacity-80">
              {currentDomain === 'chemistry' ? t('كيمياء 3', 'Chem 3') : t('فيزياء حركية', 'Physics Engine')}
            </span>
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
                    const isSelected =
                      selectedGuideKey === key ||
                      (key === 'mechanics' && (physicsStation === 'mechanics' || physicsStation === 'gas_fluid')) ||
                      (key === 'electromagnetism' && (physicsStation === 'electromagnetism' || physicsStation === 'electrostatics')) ||
                      (key === 'optics_quantum' && physicsStation === 'optics_quantum');
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

            {/* Mode Switcher for Physics */}
            {guideDomain === 'physics' && (
              <div className={`flex items-center gap-1 p-1 rounded-xl border text-[11px] font-bold ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setPhysicsTabMode('info')}
                  className={`flex-1 py-1 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    physicsTabMode === 'info'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{t('معلومات وحقائق علمية', 'Scientific Facts & Info')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhysicsTabMode('steps')}
                  className={`flex-1 py-1 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    physicsTabMode === 'steps'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t('خطوات المحاكي', 'Simulation Steps')}</span>
                </button>
              </div>
            )}

            {/* Scientific Info Section for Physics */}
            {guideDomain === 'physics' && physicsTabMode === 'info' ? (
              <div className="space-y-2.5">
                {/* Core Formula Card */}
                {('coreFormula' in activeGuide) && (
                  <div className={`p-3 rounded-2xl border text-center ${
                    isDark ? 'bg-purple-950/30 border-purple-500/40 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-900'
                  }`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {t('القانون الرياضي الأساسي', 'Fundamental Formula')}
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-black tracking-wide block">
                      {(activeGuide as any).coreFormula}
                    </span>
                  </div>
                )}

                {/* Physics Concept & Deep Explanation */}
                {('scientificInfoAr' in activeGuide) && (
                  <div className={`p-3 rounded-2xl border space-y-1.5 text-xs ${
                    isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
                      <Info className="w-3.5 h-3.5" />
                      <span>{isAr ? (activeGuide as any).scientificInfoAr.concept : (activeGuide as any).scientificInfoEn.concept}</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {isAr ? (activeGuide as any).scientificInfoAr.explanation : (activeGuide as any).scientificInfoEn.explanation}
                    </p>
                  </div>
                )}

                {/* Real-World Applications */}
                {('scientificInfoAr' in activeGuide) && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      {t('تطبيقات واقعية وهندسية:', 'Real-World & Engineering Uses:')}
                    </span>
                    <div className="space-y-1.5">
                      {((isAr ? (activeGuide as any).scientificInfoAr.applications : (activeGuide as any).scientificInfoEn.applications) as string[]).map((app, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl border flex items-start gap-2 text-[11px] ${
                            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                          <span className="text-slate-300 leading-relaxed">{app}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Did You Know Fact */}
                {('scientificInfoAr' in activeGuide) && (
                  <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                    isDark ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <span className="font-bold block mb-0.5">{t('هل تعلم؟', 'Did You Know?')}</span>
                      <span>{isAr ? (activeGuide as any).scientificInfoAr.fact : (activeGuide as any).scientificInfoEn.fact}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
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
              </>
            )}

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
