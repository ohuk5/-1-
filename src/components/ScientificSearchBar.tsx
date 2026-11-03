import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  ExternalLink,
  Loader2,
  X,
  BookOpen,
  Calculator,
  FlaskConical,
  Copy,
  Check,
  Globe,
  ArrowRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface GroundingSource {
  title: string;
  url: string;
  domain: string;
}

interface SearchResponse {
  text: string;
  sources: GroundingSource[];
  webSearchQueries?: string[];
  error?: string;
}

interface ScientificSearchBarProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const ScientificSearchBar: React.FC<ScientificSearchBarProps> = ({
  isOpen,
  onOpen,
  onClose
}) => {
  const { lang, theme, t, openCalculator, openCurriculum, setActiveTab } = useApp();
  const isDark = theme === 'dark';

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onOpen();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  const quickSuggestions = [
    {
      ar: 'أحدث استخدامات الجرافين في تخزين الطاقة',
      en: 'Latest graphene applications in energy storage',
      tag: 'مواد نانوية'
    },
    {
      ar: 'درجة غليان الإيثانول الدقيقة وضغطه البخاري',
      en: 'Exact boiling point of ethanol and vapor pressure',
      tag: 'خواص فيزيائية'
    },
    {
      ar: 'جهود الاختزال القياسية وأقوى المؤكسدات',
      en: 'Standard reduction potentials and strongest oxidizers',
      tag: 'كيمياء كهربائية'
    },
    {
      ar: 'تفاعلات عنصر الليثيوم مع النيتروجين والماء',
      en: 'Reactions of lithium with nitrogen and water',
      tag: 'تفاعلات فلزية'
    },
    {
      ar: 'خواص مادة الأيروسول وتطبيقاتها في العزل الفضائي',
      en: 'Aerogel properties and aerospace insulation applications',
      tag: 'تطبيقات متقدمة'
    }
  ];

  const handleSearch = async (searchQuery?: string) => {
    const textToSearch = searchQuery || query;
    if (!textToSearch.trim()) return;

    if (searchQuery) {
      setQuery(searchQuery);
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSearch.trim() })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(
        lang === 'ar'
          ? 'تعذر جلب البيانات الحية حالياً. يرجى التحقق من الاتصال بالإنترنت والمحاولة مجدداً.'
          : 'Unable to retrieve live data. Please check connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Header Compact Trigger Button */}
      <button
        type="button"
        onClick={onOpen}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-white shadow-inner'
            : 'bg-white border-slate-300 hover:border-cyan-500 text-slate-700 hover:text-slate-900 shadow-sm'
        }`}
        title={t('البحث العلمي الذكي المدعوم ببيانات Google (Ctrl+K)', 'Smart Scientific Search with Google data (Ctrl+K)')}
      >
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Search className="w-3.5 h-3.5" />
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
        </div>
        <span className="hidden md:inline text-slate-400 group-hover:text-slate-300">
          {t('بحث علمي مدعوم بـ Google...', 'Search science with Google...')}
        </span>
        <span className="md:hidden inline text-slate-400">
          {t('بحث علمي', 'Search')}
        </span>
        <kbd
          className={`hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono rounded border ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
          }`}
        >
          ⌘K
        </kbd>
      </button>

      {/* Search Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-3xl rounded-3xl border shadow-2xl flex flex-col overflow-hidden max-h-[90vh] my-auto ${
              isDark ? 'bg-slate-900 border-cyan-500/30 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Modal Header & Input */}
            <div className={`p-4 sm:p-5 border-b ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'}`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                      <span>{t('الباحث العلمي الذكي', 'Smart Scientific Search')}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400">
                        {t('مدعوم ببحث Google المباشر', 'Powered by Google Search')}
                      </span>
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className={`p-1.5 rounded-xl border transition-colors ${
                    isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Input Bar */}
              <div className="relative flex items-center">
                <Search className="w-5 h-5 absolute right-3.5 rtl:right-3.5 ltr:left-3.5 text-cyan-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder={t(
                    'اكتب أي سؤال، مركب، عنصر، أو تفاعل كيميائي (مثل: خواص التيتانيوم، قانون هنري)...',
                    'Ask any question, chemical compound, element, or law...'
                  )}
                  className={`w-full rtl:pr-11 rtl:pl-28 ltr:pl-11 ltr:pr-28 py-3 rounded-2xl text-sm font-medium border transition-all outline-none ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 focus:border-cyan-500 text-white placeholder-slate-500 shadow-inner'
                      : 'bg-white border-slate-300 focus:border-cyan-600 text-slate-900 placeholder-slate-400 shadow-sm'
                  }`}
                />
                <div className="absolute rtl:left-2 ltr:right-2 flex items-center gap-1.5">
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
                      title={t('مسح', 'Clear')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={loading || !query.trim()}
                    onClick={() => handleSearch()}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                      loading || !query.trim()
                        ? 'opacity-50 cursor-not-allowed bg-cyan-800 text-slate-300'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white cursor-pointer active:scale-95'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t('جاري البحث...', 'Searching...')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('بحث', 'Search')}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Quick Suggestion Chips if no query / results */}
              {!result && !loading && !error && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t('استفسارات علمية شائعة للبحث الفوري:', 'Common scientific queries:')}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSearch(item.ar)}
                        className={`text-right p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2 group ${
                          isDark
                            ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 hover:border-cyan-500/50 text-slate-300'
                            : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-cyan-500 text-slate-700 shadow-sm'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
                        <span>{t(item.ar, item.en)}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            isDark ? 'bg-slate-900 border-slate-700 text-cyan-400' : 'bg-slate-200/80 border-slate-300 text-cyan-700'
                          }`}
                        >
                          {item.tag}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className={`p-4 rounded-2xl border flex items-start gap-3 mt-4 ${
                    isDark ? 'bg-cyan-950/20 border-cyan-900/40 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-800'
                  }`}>
                    <Info className="w-5 h-5 shrink-0 mt-0.5 text-cyan-400" />
                    <div className="text-xs leading-relaxed space-y-1">
                      <p className="font-bold">
                        {t('بحث حي متصل بشبكة الويب ومحرك Google', 'Live Web Search Grounded with Google Engine')}
                      </p>
                      <p className="opacity-90">
                        {t(
                          'يستخدم نموذج الذكاء الاصطناعي أداة البحث المباشر في Google للتحقق من أحدث الاكتشافات العلمية والأرقام الدقيقة (درجات الغليان، الكتل، جهود الاختزال، أرقام CAS، وقواعد السلامة)، ويعرض لك الروابط والمصادر الموثوقة مباشرة.',
                          'The AI leverages real-time Google Search grounding to retrieve accurate facts, constants, CAS registry data, and verified scientific literature.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin flex items-center justify-center" />
                    <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-200">
                      {t('جاري استرجاع البيانات والتحقق من مصادر Google...', 'Retrieving data and verifying with Google...')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t('البحث عن أحدث المراجع العلمية والخواص الكيميائية المؤكدة', 'Scanning verified scientific references and chemical constants')}
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className={`p-4 rounded-2xl border text-sm text-rose-300 ${
                  isDark ? 'bg-rose-950/30 border-rose-800/60' : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  <p className="font-bold mb-1">{t('خطأ أثناء جلب البيانات', 'Error Fetching Data')}</p>
                  <p className="text-xs opacity-90">{error}</p>
                </div>
              )}

              {/* Result State */}
              {result && !loading && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Executed Queries */}
                  {result.webSearchQueries && result.webSearchQueries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-cyan-400" />
                        {t('استعلامات Google المنفذة:', 'Executed Google Queries:')}
                      </span>
                      {result.webSearchQueries.map((q, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          "{q}"
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Scientific Synthesis Body */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b pb-2.5 border-slate-700/50">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {t('الملخص العلمي المعتمد', 'Verified Scientific Synthesis')}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all ${
                          copied
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : isDark
                            ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-300'
                            : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                        }`}
                        title={t('نسخ الإجابة', 'Copy Response')}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? t('تم النسخ', 'Copied') : t('نسخ', 'Copy')}</span>
                      </button>
                    </div>

                    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-200 select-text">
                      {result.text}
                    </div>
                  </div>

                  {/* Sources Grounding Card */}
                  {result.sources && result.sources.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{t('مصادر بحث Google الموثوقة (Grounding Sources):', 'Google Grounding Sources:')}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all group ${
                              isDark
                                ? 'bg-slate-800/40 hover:bg-slate-800 border-slate-700 hover:border-cyan-500/60 text-slate-300'
                                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-cyan-500 text-slate-700 shadow-sm'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold truncate group-hover:text-cyan-400 transition-colors">
                                {src.title}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">
                                {src.domain}
                              </p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Shortcuts to Related App Tools */}
                  <div
                    className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 ${
                      isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-400">
                      {t('استكشف المزيد في التطبيق:', 'Explore inside app:')}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          openCalculator();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 transition-all flex items-center gap-1"
                      >
                        <Calculator className="w-3 h-3" />
                        <span>{t('حاسبة القوانين', 'Calculator')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          openCurriculum();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25 transition-all flex items-center gap-1"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>{t('مرجع كيمياء 3', 'Chemistry 3 Book')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setActiveTab('experiments-lab');
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-all flex items-center gap-1"
                      >
                        <FlaskConical className="w-3 h-3" />
                        <span>{t('معمل التجارب (14)', 'Lab (14 Experiments)')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={`p-3 sm:px-6 border-t flex items-center justify-between text-[11px] ${
                isDark ? 'border-slate-800 bg-slate-950/80 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{t('مفتاح ESC للإغلاق', 'ESC to close')}</span>
                <span>•</span>
                <span>{t('استعلامات دقيقة باللغة العربية والإنجليزية', 'Bilingual scientific search')}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="hover:underline font-bold text-cyan-400"
              >
                {t('إغلاق', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
