import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  Layers,
  FlaskConical,
  Zap,
  Scale,
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Atom,
  HelpCircle,
  Calculator,
  Droplet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OFFICIAL_GLOSSARY, CURRICULUM_LAWS, TEXTBOOK_EXPERIMENTS } from '../data/curriculumData';

interface CurriculumReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChapter?: number; // 1, 2, 3, 4
  onLaunchExperiment?: (expId: string) => void;
  onOpenCalculator?: (tab: 'ph' | 'cell_potential' | 'henry' | 'dilution' | 'colligative' | 'molarity') => void;
}

export const CurriculumReferenceModal: React.FC<CurriculumReferenceModalProps> = ({
  isOpen,
  onClose,
  initialChapter = 1,
  onLaunchExperiment,
  onOpenCalculator
}) => {
  const { lang, theme, t } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [activeSection, setActiveSection] = useState<'chapters' | 'glossary' | 'laws' | 'experiments'>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [glossaryFilter, setGlossaryFilter] = useState<'all' | 'solutions' | 'acids_bases' | 'redox' | 'electrochem'>('all');

  if (!isOpen) return null;

  // Filter Glossary
  const filteredGlossary = OFFICIAL_GLOSSARY.filter((item) => {
    const matchesFilter = glossaryFilter === 'all' || item.category === glossaryFilter;
    const matchesQuery =
      item.termAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.termEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definitionAr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  // Filter Experiments
  const chapterExperiments = TEXTBOOK_EXPERIMENTS.filter((exp) => exp.chapter === selectedChapter);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className={`border rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] ${
          isAr ? 'text-right' : 'text-left'
        } ${isDark ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 shadow-sm shadow-cyan-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
                <span>{t('المرجع العلمي الشامل: كتاب الكيمياء 3', 'Comprehensive Scientific Reference: Chemistry 3')}</span>
                <span className="text-[11px] font-bold bg-cyan-500/20 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/30 hidden sm:inline-block">
                  {t('نظام المسارات - المنهج الرسمي المعتمد', 'Pathways System - Official Curriculum')}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t(
                  'فصول المنهج الأربعة، القوانين الرياضية، 14 تجربة مخبرية حقيقية، ومسرد المصطلحات المعتمدة',
                  'The 4 core units, chemical laws, 14 real lab experiments, and official terminology index'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900'
            }`}
            title={t('إغلاق المرجع', 'Close Reference')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div
          className={`px-4 py-2.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold">
            <button
              onClick={() => setActiveSection('chapters')}
              className={`px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSection === 'chapters'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t('فصول المنهج الأربعة', 'The 4 Chapters')}</span>
            </button>

            <button
              onClick={() => setActiveSection('glossary')}
              className={`px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSection === 'glossary'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('مسرد المصطلحات المعتمدة (ص 170-175)', 'Official Glossary (p. 170-175)')}</span>
            </button>

            <button
              onClick={() => setActiveSection('laws')}
              className={`px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSection === 'laws'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>{t('القوانين الرياضية والحسابات', 'Chemical Laws & Formulas')}</span>
            </button>

            <button
              onClick={() => setActiveSection('experiments')}
              className={`px-3.5 py-2 rounded-xl border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeSection === 'experiments'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>{t('دليل تجارب الكتاب (14 تجربة)', 'Textbook 14 Labs')}</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className={`w-3.5 h-3.5 absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('ابحث في المفاهيم والمصطلحات...', 'Search concepts & terms...')}
              className={`w-full py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'
              } ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'}`}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* SECTION 1: 4 CHAPTERS OVERVIEW */}
          {activeSection === 'chapters' && (
            <div className="space-y-6">
              {/* Chapter Selector Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { ch: 1, title: t('الفصل 1: المخاليط والمحاليل', 'Ch 1: Mixtures & Solutions'), icon: FlaskConical },
                  { ch: 2, title: t('الفصل 2: الأحماض والقواعد', 'Ch 2: Acids and Bases'), icon: Droplet },
                  { ch: 3, title: t('الفصل 3: الأكسدة والاختزال', 'Ch 3: Redox Reactions'), icon: Sparkles },
                  { ch: 4, title: t('الفصل 4: الكيمياء الكهربائية', 'Ch 4: Electrochemistry'), icon: Zap }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.ch}
                      onClick={() => setSelectedChapter(item.ch)}
                      className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                        selectedChapter === item.ch
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 shadow-sm'
                          : isDark
                          ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-2 text-cyan-400" />
                      <div className="text-xs font-black">{item.title}</div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Chapter Content */}
              {selectedChapter === 1 && (
                <div className={`p-5 rounded-3xl border space-y-4 ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-800/80">
                    <div>
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">{t('الصفحات 12 - 53 من الكتاب', 'Pages 12 - 53')}</span>
                      <h3 className="text-lg font-black mt-0.5">{t('الفصل الأول: المخاليط والمحاليل (Mixtures and Solutions)', 'Chapter 1: Mixtures and Solutions')}</h3>
                    </div>
                    {onOpenCalculator && (
                      <button
                        onClick={() => onOpenCalculator('dilution')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 self-start"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>{t('حاسبة التخفيف والخواص الجامعة', 'Dilution & Colligative Calculator')}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">1-1 أنواع المخاليط</h4>
                      <p className="text-slate-300">
                        المخاليط إما متجانسة (محاليل حقيقية قطر جسيماتها &lt; 1 nm ولا تترسب ولا تشتت الضوء) أو غير متجانسة، وتنقسم إلى:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                        <li><strong>المعلق (Suspension):</strong> جسيمات كبيرة تترسب بالترويق إذا تُرِكت، وتُفصل بالترشيح (كالطين بالماء).</li>
                        <li><strong>الغروي (Colloid):</strong> جسيمات متوسطة (1-1000 nm) تمنعها الشحنات المتشابهة والحركة البراونية العشوائية من الترسب، وتشتت الضوء بوضوح (تأثير تندال) كالحليب والدم والضباب.</li>
                      </ul>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">1-2 تركيز المحلول</h4>
                      <p className="text-slate-300">
                        التعبير الكمي عن نسبة المذاب للمذيب:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 font-mono text-[11px] text-slate-400">
                        <li>المولارية: M = mol solute / L solution</li>
                        <li>المولالية: m = mol solute / kg solvent (لا تتأثر بالحرارة)</li>
                        <li>معادلة التخفيف: M₁ · V₁ = M₂ · V₂</li>
                        <li>الكسر المولي: X_A = n_A / (n_A + n_B)</li>
                      </ul>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">1-3 العوامل المؤثرة في الذوبان</h4>
                      <p className="text-slate-300">
                        عملية الذوبان تتضمن إحاطة جسيمات المذيب بجسيمات المذاب. قاعدة "المذيب يذيب شبيهه". العوامل المسرعة: التحريك، زيادة مساحة السطح (طحن البلورات)، ورفع درجة الحرارة (للمواد الصلبة).
                      </p>
                      <p className="mt-2 text-cyan-400 font-bold">
                        قانون هنري للغازات: S₁ / P₁ = S₂ / P₂ (تقل ذائبية الغازات برفع الحرارة وتزداد بزيادة الضغط).
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">1-4 الخواص الجامعة للمحاليل</h4>
                      <p className="text-slate-300">
                        خواص تعتمد على عدد جسيمات المذاب فقط وليس طبيعته:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                        <li>الانخفاض في الضغط البخاري للمذيب بوجود مذاب غير متطاير.</li>
                        <li>الارتفاع في درجة الغليان: ΔTb = Kb · m · i (الماء: Kb = 0.512 °C/m).</li>
                        <li>الانخفاض في درجة التجمد: ΔTf = Kf · m · i (الماء: Kf = 1.86 °C/m).</li>
                        <li>الخاصية والضغط الأسموزي: انتقال الماء للمحلول الأكثر تركيزاً.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {selectedChapter === 2 && (
                <div className={`p-5 rounded-3xl border space-y-4 ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-800/80">
                    <div>
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">{t('الصفحات 54 - 101 من الكتاب', 'Pages 54 - 101')}</span>
                      <h3 className="text-lg font-black mt-0.5">{t('الفصل الثاني: الأحماض والقواعد (Acids and Bases)', 'Chapter 2: Acids and Bases')}</h3>
                    </div>
                    {onOpenCalculator && (
                      <button
                        onClick={() => onOpenCalculator('ph')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 self-start"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>{t('حاسبة الرقم الهيدروجيني pH', 'pH / pOH Calculator')}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">2-1 النظريات الثلاث للأحماض والقواعد</h4>
                      <ul className="space-y-2 text-slate-300">
                        <li><strong>1. نظرية أرهينيوس:</strong> الحمض ينتج H⁺ في الماء (مثل HCl)، والقاعدة تنتج OH⁻ (مثل NaOH). عيبها: لا تفسر قاعدية الأمونيا NH₃ وكربونات الصوديوم.</li>
                        <li><strong>2. نظرية برونستد-لوري:</strong> الحمض مانح للبروتون (+H)، والقاعدة مستقبلة للبروتون. ينتج عنها "أزواج مترافقة" (حمض وقاعدته المرافقة).</li>
                        <li><strong>3. نظرية لويس (الأشمل):</strong> حمض لويس يستقبل زوجاً من الإلكترونات (مدار فارغ مثل BF₃)، وقاعدة لويس تمنح زوجاً من الإلكترونات غير المشتركة (مثل NH₃).</li>
                      </ul>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">2-2 قوة الأحماض والقواعد وثوابت التأين</h4>
                      <p className="text-slate-300">
                        <strong>الأحماض والقواعد القوية:</strong> تتأين كلياً في الماء (100%) وتوصل الكهرباء بقوة (HCl, HNO₃, H₂SO₄, NaOH, KOH).
                      </p>
                      <p className="text-slate-300 mt-2">
                        <strong>الأحماض والقواعد الضعيفة:</strong> تتأين جزئياً ويبقى معظمها جزيئات غير مفككة، وتوصف بثابت تأين الحمض Ka وثابت تأين القاعدة Kb:
                      </p>
                      <div className="font-mono text-[11px] text-cyan-400 mt-1">
                        Ka = [H⁺][A⁻] / [HA]  |  Kb = [BH⁺][OH⁻] / [B]
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">2-3 أيونات الهيدروجين والـ pH</h4>
                      <p className="text-slate-300">
                        التأين الذاتي للماء: H₂O + H₂O ⇌ H₃O⁺ + OH⁻.
                      </p>
                      <p className="font-mono text-cyan-400 mt-1">
                        Kw = [H⁺][OH⁻] = 1.0 × 10⁻¹⁴ (عند 25°C)
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400 font-mono text-[11px]">
                        <li>pH = -log[H⁺]  ||  pOH = -log[OH⁻]</li>
                        <li>pH + pOH = 14.00</li>
                        <li>المحلول الحمضي: pH &lt; 7  ([H⁺] &gt; 10⁻⁷ M)</li>
                        <li>المحلول المتعادل: pH = 7  ([H⁺] = 10⁻⁷ M)</li>
                        <li>المحلول القاعدي: pH &gt; 7  ([H⁺] &lt; 10⁻⁷ M)</li>
                      </ul>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">2-4 التعادل والمعايرة والمحاليل المنظمة</h4>
                      <p className="text-slate-300">
                        <strong>تفاعل التعادل:</strong> حمض + قاعدة → ملح + ماء. المعادلة الأيونية النهائية: H⁺(aq) + OH⁻(aq) → H₂O(l).
                      </p>
                      <p className="text-slate-300 mt-2">
                        <strong>المعايرة:</strong> حساب تركيز مجهول بسحاحة حتى نقطة النهاية الدقيقة باستخدام كواشف متخصصة (الفينولفثالين وأزرق البروموثيمول).
                      </p>
                      <p className="text-slate-300 mt-2">
                        <strong>المحاليل المنظمة:</strong> تقاوم تغير pH (مثل نظام H₂CO₃ / HCO₃⁻ المنظم لدم الإنسان عند 7.4).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedChapter === 3 && (
                <div className={`p-5 rounded-3xl border space-y-4 ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-800/80">
                    <div>
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">{t('الصفحات 102 - 131 من الكتاب', 'Pages 102 - 131')}</span>
                      <h3 className="text-lg font-black mt-0.5">{t('الفصل الثالث: تفاعلات الأكسدة والاختزال (Redox Reactions)', 'Chapter 3: Redox Reactions')}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">3-1 مفهوم الأكسدة والاختزال</h4>
                      <p className="text-slate-300">
                        <strong>الأكسدة:</strong> فقدان إلكترونات وزيادة في عدد التأكسد. المادة التي تتأكسد تسمى <em>عاملاً مختزلاً</em>.
                      </p>
                      <p className="text-slate-300 mt-2">
                        <strong>الاختزال:</strong> اكتساب إلكترونات ونقصان في عدد التأكسد. المادة التي تُختزل تسمى <em>عاملاً مؤكسداً</em>.
                      </p>
                      <p className="text-cyan-400 mt-2 font-bold">
                        تفاعلان متلازمان ومتكاملان تماماً: عدد الإلكترونات المفقودة = عدد الإلكترونات المكتسبة.
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">القواعد التسع لتحديد أعداد التأكسد (جدول 3-2 ص 110)</h4>
                      <ul className="space-y-1 text-slate-300 list-decimal list-inside text-[11px]">
                        <li>الذرة غير المتحدة = 0 (مثل Na, O₂, H₂).</li>
                        <li>الأيون أحادي الذرة = شحنته (Ca²⁺ = +2, Br⁻ = -1).</li>
                        <li>الفلور دائماً = -1 في جميع مركباته.</li>
                        <li>الأكسجين = -2 دائماً (إلا في فوق الأكاسيد H₂O₂ فيكون -1، ومع الفلور OF₂ فيكون +2).</li>
                        <li>الهيدروجين = +1 (إلا في هيدريدات الفلزات NaH فيكون -1).</li>
                        <li>فلزات المجموعة 1 = +1، والمجموعة 2 = +2، والألومنيوم = +3.</li>
                        <li>مجموع أعداد التأكسد في المركب المتعادل = 0.</li>
                        <li>مجموع أعداد التأكسد في الأيون عديد الذرات = شحنة الأيون.</li>
                      </ul>
                    </div>

                    <div className={`p-4 rounded-2xl border md:col-span-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">3-2 وزن معادلات الأكسدة والاختزال</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                        <div>
                          <strong>طريقة عدد التأكسد:</strong> تحديد العناصر المتأكسدة والمختزلة، حساب التغير في أعداد التأكسد، ضبط المعاملات لجعل التغير متساوياً، ثم وزن بقية الذرات بالطريقة التقليدية.
                        </div>
                        <div>
                          <strong>طريقة نصف التفاعل:</strong> تقسيم التفاعل لنصف أكسدة ونصف اختزال، وزن الذرات الأخرى ثم وزن O بإضافة H₂O ووزن H بإضافة H⁺، موازنة الشحنات بالإلكترونات، ضرب المعاملات لتوحيد الإلكترونات المتبادلة، ثم الجمع.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedChapter === 4 && (
                <div className={`p-5 rounded-3xl border space-y-4 ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-800/80">
                    <div>
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">{t('الصفحات 132 - 169 من الكتاب', 'Pages 132 - 169')}</span>
                      <h3 className="text-lg font-black mt-0.5">{t('الفصل الرابع: الكيمياء الكهربائية (Electrochemistry)', 'Chapter 4: Electrochemistry')}</h3>
                    </div>
                    {onOpenCalculator && (
                      <button
                        onClick={() => onOpenCalculator('cell_potential')}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 self-start"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>{t('حاسبة جهد الخلية E°cell', 'Cell EMF Calculator')}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">4-1 الخلايا الجلفانية وجهد الخلية</h4>
                      <p className="text-slate-300">
                        تحول الطاقة الكيميائية إلى طاقة كهربائية بتفاعل تلقائي. تتكون من نصفي خلية وقنطرة ملحية وسلك توصيل:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
                        <li><strong>الأنود (المصعد):</strong> قطب سالب تحدث عنده الأكسدة وتتدفق منه الإلكترونات.</li>
                        <li><strong>الكاثود (المهبط):</strong> قطب موجب تحدث عنده الاختزال وتتدفق إليه الإلكترونات.</li>
                        <li><strong>معادلة جهد الخلية:</strong> E°cell = E°cathode - E°anode. إذا كانت موجبة فالتفاعل تلقائي.</li>
                        <li><strong>قطب الهيدروجين القياسي (SHE):</strong> مرجع دولي جهده 0.000 V.</li>
                      </ul>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">4-2 البطاريات وخلايا الوقود والتآكل</h4>
                      <ul className="space-y-1.5 text-slate-300">
                        <li><strong>البطاريات الأولية:</strong> لا يُعاد شحنها (خلية الخارصين-الكربون الجافة، القلوية، الفضة).</li>
                        <li><strong>البطاريات الثانوية:</strong> قابلة للشحن (مركم الرصاص في السيارات Pb/PbO₂/H₂SO₄، وبطاريات الليثيوم Li-ion).</li>
                        <li><strong>خلايا الوقود:</strong> تتزود بالوقود باستمرار من الخارج (خلية H₂/O₂ وناتجها الوحيد ماء نقي وطاقة).</li>
                        <li><strong>التآكل والجلفنة:</strong> حماية الحديد من الصدأ بطلائه بالخارصين أو بوصل كتل ماغنسيوم كأنود مضحٍّ.</li>
                      </ul>
                    </div>

                    <div className={`p-4 rounded-2xl border md:col-span-2 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <h4 className="font-black text-sm text-cyan-400 mb-2">4-3 التحليل الكهربائي وتطبيقاته الصناعية</h4>
                      <p className="text-slate-300">
                        استعمال تيار كهربائي خارجي لإجبار تفاعل أكسدة واختزال غير تلقائي على الحدوث:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-slate-400">
                        <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40">
                          <strong>خلية داون:</strong> التحليل الكهربائي لمصهور NaCl لإنتاج فلز الصوديوم النقي وغاز الكلور.
                        </div>
                        <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40">
                          <strong>تحليل ماء البحر:</strong> ينتج غاز الهيدروجين وغاز الكلور ومحلول هيدروكسيد الصوديوم الصناعي.
                        </div>
                        <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40">
                          <strong>الطلاء بالكهرباء:</strong> طلاء المفاتيح والمجوهرات بالفضة أو النحاس لحمايتها ومنحها مظهراً جميلاً.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: OFFICIAL GLOSSARY */}
          {activeSection === 'glossary' && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
                {[
                  { id: 'all', label: t('جميع المصطلحات (35+)', 'All Terms (35+)') },
                  { id: 'solutions', label: t('المخاليط والمحاليل (فصل 1)', 'Solutions (Ch 1)') },
                  { id: 'acids_bases', label: t('الأحماض والقواعد (فصل 2)', 'Acids & Bases (Ch 2)') },
                  { id: 'redox', label: t('الأكسدة والاختزال (فصل 3)', 'Redox (Ch 3)') },
                  { id: 'electrochem', label: t('الكيمياء الكهربائية (فصل 4)', 'Electrochemistry (Ch 4)') }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setGlossaryFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl border transition-colors whitespace-nowrap ${
                      glossaryFilter === cat.id
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Glossary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredGlossary.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all hover:border-cyan-500/50 flex flex-col justify-between ${
                      isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="font-black text-sm text-cyan-400">{item.termAr}</h4>
                        <span className="text-[11px] font-mono text-slate-400 font-bold">{item.termEn}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.definitionAr}</p>
                      <p className="text-[11px] text-slate-500 italic mt-1 leading-snug">{item.definitionEn}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500">
                      <span>الفصل {item.chapter} في الكتاب</span>
                      <span className="uppercase tracking-wider font-mono font-bold text-cyan-400/80">{item.category}</span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredGlossary.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {t('لم يتم العثور على مصطلحات تطابق بحثك.', 'No terms matching your query.')}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: LAWS & CALCULATIONS */}
          {activeSection === 'laws' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CURRICULUM_LAWS.map((law) => (
                  <div
                    key={law.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-black text-sm text-cyan-400">{law.nameAr}</h4>
                        <span className="text-[11px] font-bold text-slate-500">الفصل {law.chapter}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono text-xs sm:text-sm font-bold text-cyan-300 my-2 select-all" dir="ltr">
                        {law.formula}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mt-2">{law.descriptionAr}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">{law.nameEn}</span>
                      {onOpenCalculator && (
                        <button
                          onClick={() => onOpenCalculator(law.calculatorType)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>{t('افتح في الحاسبة', 'Open in Calculator')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: 14 TEXTBOOK LABS */}
          {activeSection === 'experiments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEXTBOOK_EXPERIMENTS.map((exp, idx) => (
                  <div
                    key={exp.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                          تجربة {idx + 1} · الفصل {exp.chapter} (ص {exp.page})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 text-cyan-300 bg-cyan-500/10 font-bold">
                          {exp.type === 'introductory' ? 'تجربة استهلالية' : exp.type === 'quick_lab' ? 'تجربة سريعة' : exp.type === 'data_analysis' ? 'تحليل بيانات' : 'مختبر كيمياء'}
                        </span>
                      </div>
                      <h4 className="font-black text-sm text-white mb-2">{exp.titleAr}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">{exp.objectiveAr}</p>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 my-2 select-all overflow-x-auto" dir="ltr">
                        {exp.balancedEquation}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-2 space-y-1">
                        <div><strong>الأدوات والمواد:</strong> {exp.materialsAr.join('، ')}</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 italic truncate">{exp.titleEn}</span>
                      {onLaunchExperiment && (
                        <button
                          onClick={() => {
                            onClose();
                            onLaunchExperiment(exp.id);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          <span>{t('إجراء التجربة في المعمل', 'Run in Lab')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
