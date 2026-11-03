import React, { useEffect, useState } from 'react';
import {
  Atom,
  Flame,
  Radiation,
  BookOpen,
  FlaskConical,
  Sun,
  Moon,
  Globe2,
  Volume2,
  VolumeX,
  Sparkles,
  Network,
  Calculator,
  Search,
  Orbit,
  Wind,
  Zap,
  HelpCircle
} from 'lucide-react';
import { useApp, ActiveTabType, ApparatusStationType, PhysicsStationId } from '../context/AppContext';
import { ScientificSearchBar } from './ScientificSearchBar';

interface HeaderProps {
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenGuide }) => {
  const {
    lang,
    toggleLang,
    theme,
    toggleTheme,
    soundEnabled,
    toggleSound,
    t,
    currentDomain,
    setCurrentDomain,
    toggleDomain,
    activeTab,
    setActiveTab,
    physicsStation,
    setPhysicsStation,
    activeApparatusStation,
    setActiveApparatusStation,
    openCurriculum,
    openCalculator
  } = useApp();

  const isDark = theme === 'dark';
  const isAr = lang === 'ar';
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Keyboard Navigation Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        setCurrentDomain('chemistry');
      } else if (e.key === 'p' || e.key === 'P') {
        setCurrentDomain('physics');
      } else if (e.key === '1') {
        if (currentDomain === 'chemistry') setActiveTab('atom-builder');
        else setPhysicsStation('gas_fluid');
      } else if (e.key === '2') {
        if (currentDomain === 'chemistry') setActiveTab('molecule-builder');
        else setPhysicsStation('electrostatics');
      } else if (e.key === '3') {
        if (currentDomain === 'chemistry') setActiveTab('states-of-matter');
        else setPhysicsStation('optics_quantum');
      } else if (e.key === '4') {
        if (currentDomain === 'chemistry') setActiveTab('radioactive-decay');
      } else if (e.key === '5') {
        if (currentDomain === 'chemistry') setActiveTab('experiments-lab');
      } else if (e.key === 't' || e.key === 'T') {
        toggleTheme();
      } else if (e.key === 'l' || e.key === 'L') {
        toggleLang();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      } else if (e.key === '?' || e.key === 'g' || e.key === 'G') {
        onOpenGuide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDomain, setCurrentDomain, setActiveTab, setPhysicsStation, toggleTheme, toggleLang, toggleSound, onOpenGuide]);

  // Chemistry Domain Sections (strictly 5 modules)
  const chemistryNavItems: {
    id: ActiveTabType;
    num: string;
    labelAr: string;
    labelEn: string;
    shortAr: string;
    shortEn: string;
    badgeAr: string;
    badgeEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'atom-builder',
      num: '01',
      labelAr: 'بناء وتوزيع الذرات',
      labelEn: 'Atom Builder & Orbitals',
      shortAr: 'الذرات (1-118)',
      shortEn: 'Atoms (1-118)',
      badgeAr: '1-118 عنصر',
      badgeEn: '1-118 Elements',
      icon: <Atom className="w-4 h-4 shrink-0" />
    },
    {
      id: 'molecule-builder',
      num: '02',
      labelAr: 'تكوين الروابط والمركبات',
      labelEn: 'Molecule Builder & 3D',
      shortAr: 'المركبات',
      shortEn: 'Molecules',
      badgeAr: '3D تفاعلي',
      badgeEn: '3D Geometry',
      icon: <Network className="w-4 h-4 shrink-0" />
    },
    {
      id: 'states-of-matter',
      num: '03',
      labelAr: 'حالات المادة والديناميكا',
      labelEn: 'States of Matter',
      shortAr: 'حالات المادة',
      shortEn: 'States',
      badgeAr: 'صلب/سائل/غاز',
      badgeEn: 'Phases',
      icon: <Flame className="w-4 h-4 shrink-0" />
    },
    {
      id: 'radioactive-decay',
      num: '04',
      labelAr: 'النشاط الإشعاعي وعمر النصف',
      labelEn: 'Radioactive Decay',
      shortAr: 'النشاط الإشعاعي',
      shortEn: 'Radiation',
      badgeAr: 'ألفا/بيتا/جاما',
      badgeEn: 'α / β / γ',
      icon: <Radiation className="w-4 h-4 shrink-0" />
    },
    {
      id: 'experiments-lab',
      num: '05',
      labelAr: 'معمل التجارب التفاعلي',
      labelEn: 'Experimental Lab',
      shortAr: 'معمل التجارب',
      shortEn: 'Exp Lab',
      badgeAr: '14 تجربة وزارية',
      badgeEn: '14 Labs',
      icon: <FlaskConical className="w-4 h-4 shrink-0" />
    }
  ];

  // Physics Domain Stations (strictly 3 simulation stations; calculator is merged into global modal)
  const physicsNavItems: {
    id: PhysicsStationId;
    num: string;
    labelAr: string;
    labelEn: string;
    shortAr: string;
    shortEn: string;
    badgeAr: string;
    badgeEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'gas_fluid',
      num: '01',
      labelAr: 'الغازات والموائع والطفو',
      labelEn: 'Gas Laws & Fluids',
      shortAr: 'الغازات والموائع والطفو',
      shortEn: 'Gas & Fluids',
      badgeAr: 'بويل وأرخميدس',
      badgeEn: 'Boyle & Buoyancy',
      icon: <Wind className="w-4 h-4 shrink-0" />
    },
    {
      id: 'electrostatics',
      num: '02',
      labelAr: 'الكهرباء الساكنة وكولوم',
      labelEn: 'Electrostatics & Fields',
      shortAr: 'الكهرباء الساكنة وكولوم',
      shortEn: 'Electrostatics',
      badgeAr: 'حقول وقوى كولوم',
      badgeEn: 'Coulomb Fields',
      icon: <Zap className="w-4 h-4 shrink-0" />
    },
    {
      id: 'optics_quantum',
      num: '03',
      labelAr: 'البصريات والكم والكهروضوئية',
      labelEn: 'Optics & Photoelectric',
      shortAr: 'البصريات والكم والكهروضوئية',
      shortEn: 'Optics & Quantum',
      badgeAr: 'فوتونات وأطياف',
      badgeEn: 'Photons & Spectra',
      icon: <Orbit className="w-4 h-4 shrink-0" />
    }
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors ${
        isDark ? 'bg-slate-950/95 border-slate-800/90 shadow-md' : 'bg-white/95 border-slate-200/90 shadow-sm'
      }`}
    >
      {/* Upper Deck: Brand Wordmark, Dual Domain Switcher, and Global Utilities */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Brand Wordmark & Domain Status */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 transition-all ${
              currentDomain === 'chemistry'
                ? 'bg-gradient-to-tr from-cyan-600 to-blue-600'
                : 'bg-gradient-to-tr from-purple-600 to-amber-500'
            }`}>
              {currentDomain === 'chemistry' ? (
                <FlaskConical className="w-5 h-5 animate-pulse" />
              ) : (
                <Orbit className="w-5 h-5 animate-spin-slow" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-base sm:text-lg font-black tracking-tight whitespace-nowrap ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {t('المختبر العلمي التفاعلي', 'Interactive Science Lab')}
                </span>
                <span className={`hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  currentDomain === 'chemistry'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                }`}>
                  {currentDomain === 'chemistry' ? t('كيمياء 3', 'Chemistry 3') : t('فيزياء حركية', 'Kinetic Physics')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {currentDomain === 'chemistry'
                  ? t('منهاج كيمياء 3 (المسارات) والتجارب المعتمدة', 'Saudi Chemistry 3 Curriculum & Experiments')
                  : t('محاكاة ديناميكا الموائع والغازات والكهرباء والكم', 'Fluids, Gas Kinetics, Coulomb & Quantum Sims')}
              </p>
            </div>
          </div>

          {/* Mobile Utility Actions */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={toggleDomain}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                currentDomain === 'chemistry'
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                  : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400'
              }`}
            >
              <span>{currentDomain === 'chemistry' ? '⚡ فيزياء' : '🧪 كيمياء'}</span>
            </button>

            <button
              type="button"
              onClick={() => openCalculator(currentDomain)}
              className={`p-2 rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-slate-100 border-slate-200 text-amber-700'
              }`}
              title={t('حاسبة القوانين', 'Calculator')}
            >
              <Calculator className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className={`p-2 rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800 text-cyan-400' : 'bg-slate-100 border-slate-200 text-cyan-700'
              }`}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: The Dual Domain Switcher (Chemistry vs Physics) */}
        <div className="w-full lg:w-auto flex items-center justify-center">
          <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 w-full sm:w-auto shadow-inner ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {/* Chemistry Branch Toggle */}
            <button
              type="button"
              onClick={() => setCurrentDomain('chemistry')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                currentDomain === 'chemistry'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md ring-1 ring-cyan-400/50'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <FlaskConical className={`w-4 h-4 ${currentDomain === 'chemistry' ? 'text-white' : 'text-cyan-400'}`} />
              <span>{t('مختبر الكيمياء', 'Chemistry Lab')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                currentDomain === 'chemistry' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {t('5 أقسام', '5 Modules')}
              </span>
            </button>

            {/* Physics Branch Toggle */}
            <button
              type="button"
              onClick={() => setCurrentDomain('physics')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                currentDomain === 'physics'
                  ? 'bg-gradient-to-r from-purple-600 to-amber-600 text-white shadow-md ring-1 ring-purple-400/50'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Orbit className={`w-4 h-4 ${currentDomain === 'physics' ? 'text-white' : 'text-amber-400'}`} />
              <span>{t('مختبر الفيزياء', 'Physics Lab')}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                currentDomain === 'physics' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {t('3 محطات', '3 Stations')}
              </span>
            </button>
          </div>
        </div>

        {/* Global Utility Actions (Desktop & Tablet) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {/* Smart Google Grounded Search */}
          <ScientificSearchBar
            isOpen={isSearchOpen}
            onOpen={() => setIsSearchOpen(true)}
            onClose={() => setIsSearchOpen(false)}
          />

          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? isDark
                  ? 'bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-cyan-700 hover:bg-slate-200'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
            }`}
            title={soundEnabled ? t('كتم المؤثرات الصوتية (M)', 'Mute Sound Effects (M)') : t('تشغيل المؤثرات الصوتية (M)', 'Enable Sound Effects (M)')}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={t('تبديل المظهر الداكن/الفاتح (T)', 'Toggle Dark/Light Theme (T)')}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLang}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={t('تبديل اللغة (L)', 'Switch Language (L)')}
          >
            <Globe2 className="w-4 h-4 text-cyan-500" />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Unified Calculator Launcher (Opens chemistry or physics based on active domain) */}
          <button
            type="button"
            onClick={() => openCalculator(currentDomain)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                : 'bg-slate-100 border-slate-200 text-amber-700 hover:bg-slate-200'
            }`}
            title={t('حاسبة القوانين الشاملة (كيمياء وفيزياء)', 'Comprehensive Laws Calculator')}
          >
            <Calculator className="w-4 h-4" />
            <span>{currentDomain === 'physics' ? t('حاسبة الفيزياء', 'Physics Calc') : t('حاسبة الكيمياء', 'Chem Calc')}</span>
          </button>

          {/* Curriculum Guide Shortcut (Relevant to chemistry) */}
          {currentDomain === 'chemistry' && (
            <button
              type="button"
              onClick={() => openCurriculum()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md"
              title={t('مرجع كتاب كيمياء 3 والمصطلحات', 'Chemistry 3 Textbook Reference')}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden xl:inline">{t('كتاب كيمياء 3', 'Chem 3 Book')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Lower Deck: Full-Width Domain Sub-Navigation Strip (Spacious, Zero Clutter) */}
      <div className={`border-t px-4 sm:px-6 lg:px-8 py-2.5 transition-colors ${
        isDark ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-200/80 bg-slate-50/80'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Active Domain Indicator Label */}
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 shrink-0">
            <span className={`w-2 h-2 rounded-full ${
              currentDomain === 'chemistry' ? 'bg-cyan-400 animate-ping' : 'bg-purple-400 animate-ping'
            }`} />
            <span>
              {currentDomain === 'chemistry'
                ? t('أقسام الكيمياء المعتمدة (5):', 'Chemistry Sections (5):')
                : t('محطات المختبر الفيزيائي (3):', 'Physics Lab Stations (3):')}
            </span>
          </div>

          {/* The Spacious Module Ribbon - Spanning clean and centered */}
          <nav
            aria-label="Active Sub-Module Navigation"
            className="w-full flex-1 flex items-center justify-start md:justify-center gap-2 overflow-x-auto scrollbar-none py-0.5"
          >
            {/* Case 1: Chemistry Domain Sub-Sections (5 items) */}
            {currentDomain === 'chemistry' &&
              chemistryNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 border ${
                      isActive
                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-md'
                        : isDark
                        ? 'bg-slate-900/80 border-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-cyan-400'}>{item.icon}</span>
                    <span className={`font-mono text-xs ${isActive ? 'text-cyan-100' : 'text-slate-400'}`}>
                      {item.num}.
                    </span>
                    <span>{isAr ? item.shortAr : item.shortEn}</span>
                    <span className={`hidden xl:inline text-[10px] px-1.5 py-0.5 rounded-md font-normal ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isAr ? item.badgeAr : item.badgeEn}
                    </span>
                  </button>
                );
              })}

            {/* Case 2: Physics Domain Sub-Stations (3 items) */}
            {currentDomain === 'physics' &&
              physicsNavItems.map((st) => {
                const isActive = physicsStation === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setPhysicsStation(st.id)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 border ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-md ring-1 ring-purple-400/50'
                        : isDark
                        ? 'bg-slate-900/80 border-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-purple-400'}>{st.icon}</span>
                    <span className={`font-mono text-xs ${isActive ? 'text-purple-100' : 'text-slate-400'}`}>
                      {st.num}.
                    </span>
                    <span>{isAr ? st.shortAr : st.shortEn}</span>
                    <span className={`hidden xl:inline text-[10px] px-1.5 py-0.5 rounded-md font-normal ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isAr ? st.badgeAr : st.badgeEn}
                    </span>
                  </button>
                );
              })}
          </nav>

          {/* Side Helper Telemetry / Guide Trigger */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {currentDomain === 'physics' ? (
              <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono flex items-center gap-2 ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <span className="text-slate-500">g:</span>
                <span className="text-cyan-400 font-bold">9.8 m/s²</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-500">c:</span>
                <span className="text-amber-400 font-bold">3×10⁸</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onOpenGuide}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isDark ? 'border-slate-800 bg-slate-900/80 text-cyan-400 hover:bg-slate-800' : 'border-slate-200 bg-white text-cyan-700 hover:bg-slate-100'
              }`}
              title={t('دليل المفاهيم والاستخدام', 'Guide & Concepts')}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden xl:inline">{t('دليل القسم', 'Guide')}</span>
            </button>
          </div>
        </div>

        {/* Quick Apparatus Suite Sub-Bar when Experimental Lab is active */}
        {currentDomain === 'chemistry' && activeTab === 'experiments-lab' && (
          <div className={`mt-2 pt-2 border-t max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5 ${
            isDark ? 'border-slate-800/80' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold text-cyan-500">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('محطات وأجهزة المعمل:', 'Lab Apparatus Stations:')}</span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              {[
                { id: 'main_workbench', labelAr: 'كأس التفاعلات والدليل', labelEn: 'Reaction Beaker', icon: '🧪' },
                { id: 'burette_titration', labelAr: 'السحاحة ومعايرة pH', labelEn: 'Burette & pH', icon: '🎯' },
                { id: 'pneumatic_gas', labelAr: 'حوض إزاحة الغاز', labelEn: 'Gas Trough', icon: '🌊' },
                { id: 'digital_scale', labelAr: 'الميزان الرقمي 0.01g', labelEn: 'Analytical Balance', icon: '⚖️' },
                { id: 'cylinder_pipette', labelAr: 'المخبار والماصة', labelEn: 'Cylinder & Pipette', icon: '💧' },
                { id: 'test_tube_rack', labelAr: 'حامل الأنابيب (4)', labelEn: 'Test Tube Rack', icon: '🧪' },
                { id: 'spectrometer_discharge', labelAr: 'مطياف الانبعاث والتفريغ', labelEn: 'Spectrometer & Discharge', icon: '🌈' }
              ].map((appItem) => {
                const isSelected = activeApparatusStation === appItem.id;
                return (
                  <button
                    key={appItem.id}
                    type="button"
                    onClick={() => setActiveApparatusStation(appItem.id as ApparatusStationType)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 border ${
                      isSelected
                        ? 'bg-cyan-600 border-cyan-400 text-white shadow-xs'
                        : isDark
                        ? 'bg-slate-900 border-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{appItem.icon}</span>
                    <span>{t(appItem.labelAr, appItem.labelEn)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
