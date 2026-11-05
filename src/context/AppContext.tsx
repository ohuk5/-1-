import React, { createContext, useContext, useState, useEffect } from 'react';
import { setGlobalSoundEnabled, playLabSound } from '../utils/soundEffects';

export type AppLanguage = 'ar' | 'en';
export type AppTheme = 'dark' | 'light';
export type ActiveTabType =
  | 'atom-builder'
  | 'molecule-builder'
  | 'states-of-matter'
  | 'radioactive-decay'
  | 'experiments-lab'
  | 'physics-lab';
export type ApparatusStationType =
  | 'main_workbench'
  | 'burette_titration'
  | 'pneumatic_gas'
  | 'digital_scale'
  | 'cylinder_pipette'
  | 'test_tube_rack'
  | 'spectrometer_discharge';

export type AppDomain = 'chemistry' | 'physics';
export type PhysicsStationId = 'gas_fluid' | 'electrostatics' | 'optics_quantum';
export type CalculatorTabType =
  | 'ph'
  | 'cell_potential'
  | 'henry'
  | 'dilution'
  | 'colligative'
  | 'molarity'
  | 'gas'
  | 'coulomb'
  | 'photoelectric'
  | 'buoyancy'
  | 'kinetic'
  | 'snell';

export interface LabExperimentTrigger {
  substanceId?: string;
  targetTemp?: number;
  volumeLidPercent?: number;
  gravityPreset?: 'earth' | 'moon' | 'jupiter' | 'zero';
  protons?: number;
  neutrons?: number;
  electrons?: number;
  isotopeId?: string;
  labPresetId?: string;
  notes?: string;
}

interface AppContextType {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  t: (ar: string, en: string) => string;
  // Domain bifurcation: Chemistry vs Physics
  currentDomain: AppDomain;
  setCurrentDomain: (domain: AppDomain) => void;
  toggleDomain: () => void;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  physicsStation: PhysicsStationId;
  setPhysicsStation: (station: PhysicsStationId) => void;
  activeApparatusStation: ApparatusStationType;
  setActiveApparatusStation: (station: ApparatusStationType) => void;
  activeLabPreset: LabExperimentTrigger | null;
  launchLabExperiment: (tab: ActiveTabType, config: LabExperimentTrigger) => void;
  clearLabExperiment: () => void;
  // Curriculum Reference & Chemistry/Physics Calculator
  isCurriculumOpen: boolean;
  curriculumChapter: number;
  openCurriculum: (chapter?: number) => void;
  closeCurriculum: () => void;
  isCalculatorOpen: boolean;
  calculatorTab: CalculatorTabType;
  calculatorDomain: AppDomain;
  openCalculator: (tab?: CalculatorTabType | 'chemistry' | 'physics') => void;
  closeCalculator: () => void;
  curriculumExperimentToLaunch: string | null;
  setCurriculumExperimentToLaunch: (id: string | null) => void;
  // Multi-Turn Q&A Chatbot
  isChatOpen: boolean;
  openChat: (initialQuery?: string, rolePreset?: 'chemistry' | 'physics' | 'problem_solver' | 'quiz_master') => void;
  closeChat: () => void;
  chatInitialQuery: string | null;
  chatRolePreset: 'chemistry' | 'physics' | 'problem_solver' | 'quiz_master';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    return (localStorage.getItem('app_lang') as AppLanguage) || 'ar';
  });

  const [theme, setThemeState] = useState<AppTheme>(() => {
    return (localStorage.getItem('app_theme') as AppTheme) || 'dark';
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_sound');
    return saved === null ? true : saved === 'true';
  });

  const [currentDomain, setCurrentDomainState] = useState<AppDomain>(() => {
    return (localStorage.getItem('app_domain') as AppDomain) || 'chemistry';
  });

  const [activeTab, setActiveTabState] = useState<ActiveTabType>('atom-builder');
  const [physicsStation, setPhysicsStationState] = useState<PhysicsStationId>('gas_fluid');
  const [activeApparatusStation, setActiveApparatusStationState] = useState<ApparatusStationType>('main_workbench');
  const [activeLabPreset, setActiveLabPreset] = useState<LabExperimentTrigger | null>(null);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState<boolean>(false);
  const [curriculumChapter, setCurriculumChapter] = useState<number>(1);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [calculatorTab, setCalculatorTab] = useState<CalculatorTabType>('ph');
  const [calculatorDomain, setCalculatorDomain] = useState<AppDomain>('chemistry');
  const [curriculumExperimentToLaunch, setCurriculumExperimentToLaunch] = useState<string | null>(null);

  // Multi-Turn Q&A Chatbot State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | null>(null);
  const [chatRolePreset, setChatRolePreset] = useState<'chemistry' | 'physics' | 'problem_solver' | 'quiz_master'>('chemistry');

  const openChat = (initialQuery?: string, rolePreset?: 'chemistry' | 'physics' | 'problem_solver' | 'quiz_master') => {
    if (initialQuery) setChatInitialQuery(initialQuery);
    if (rolePreset) setChatRolePreset(rolePreset);
    else if (currentDomain === 'physics') setChatRolePreset('physics');
    else setChatRolePreset('chemistry');
    setIsChatOpen(true);
    playLabSound('click');
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setChatInitialQuery(null);
  };

  const setCurrentDomain = (domain: AppDomain) => {
    setCurrentDomainState(domain);
    localStorage.setItem('app_domain', domain);
    playLabSound('click');
  };

  const toggleDomain = () => {
    setCurrentDomain(currentDomain === 'chemistry' ? 'physics' : 'chemistry');
  };

  const setPhysicsStation = (station: PhysicsStationId) => {
    setPhysicsStationState(station);
    playLabSound('click');
  };

  const openCurriculum = (chapter?: number) => {
    if (chapter) setCurriculumChapter(chapter);
    setIsCurriculumOpen(true);
    playLabSound('click');
  };

  const closeCurriculum = () => {
    setIsCurriculumOpen(false);
  };

  const openCalculator = (tab?: CalculatorTabType | 'chemistry' | 'physics') => {
    if (tab === 'chemistry') {
      setCalculatorDomain('chemistry');
      setCalculatorTab('ph');
    } else if (tab === 'physics') {
      setCalculatorDomain('physics');
      setCalculatorTab('gas');
    } else if (tab) {
      const physicsTabs: CalculatorTabType[] = ['gas', 'coulomb', 'photoelectric', 'buoyancy', 'kinetic', 'snell'];
      if (physicsTabs.includes(tab as CalculatorTabType)) {
        setCalculatorDomain('physics');
      } else {
        setCalculatorDomain('chemistry');
      }
      setCalculatorTab(tab as CalculatorTabType);
    } else {
      // Default to current domain
      if (currentDomain === 'physics') {
        setCalculatorDomain('physics');
        setCalculatorTab('gas');
      } else {
        setCalculatorDomain('chemistry');
        setCalculatorTab('ph');
      }
    }
    setIsCalculatorOpen(true);
    playLabSound('click');
  };

  const closeCalculator = () => {
    setIsCalculatorOpen(false);
  };

  const setActiveApparatusStation = (station: ApparatusStationType) => {
    setActiveApparatusStationState(station);
    playLabSound('click');
  };

  useEffect(() => {
    setGlobalSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const setLang = (newLang: AppLanguage) => {
    setLangState(newLang);
    localStorage.setItem('app_lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
    playLabSound('click');
  };

  const toggleLang = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('app_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    playLabSound('click');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('app_sound', String(enabled));
    setGlobalSoundEnabled(enabled);
    if (enabled) {
      playLabSound('click');
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const setActiveTab = (tab: ActiveTabType) => {
    setActiveTabState(tab);
    playLabSound('click');
  };

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [lang, theme]);

  const t = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const launchLabExperiment = (tab: ActiveTabType, config: LabExperimentTrigger) => {
    setActiveLabPreset(config);
    setCurrentDomainState('chemistry');
    setActiveTabState(tab);
    playLabSound('success');
  };

  const clearLabExperiment = () => {
    setActiveLabPreset(null);
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        theme,
        setTheme,
        toggleTheme,
        soundEnabled,
        setSoundEnabled,
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
        activeLabPreset,
        launchLabExperiment,
        clearLabExperiment,
        isCurriculumOpen,
        curriculumChapter,
        openCurriculum,
        closeCurriculum,
        isCalculatorOpen,
        calculatorTab,
        calculatorDomain,
        openCalculator,
        closeCalculator,
        curriculumExperimentToLaunch,
        setCurriculumExperimentToLaunch,
        isChatOpen,
        openChat,
        closeChat,
        chatInitialQuery,
        chatRolePreset
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
