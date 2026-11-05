import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  FlaskConical,
  Orbit,
  Calculator,
  HelpCircle,
  Brain,
  MessageSquare,
  Zap,
  Target,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playLabSound } from '../utils/soundEffects';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isFallback?: boolean;
}

interface ScientificChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string | null;
  initialRole?: 'chemistry' | 'physics' | 'problem_solver' | 'quiz_master';
}

export const ScientificChatModal: React.FC<ScientificChatModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
  initialRole = 'chemistry'
}) => {
  const { lang, theme, t, currentDomain } = useApp();
  const isDark = theme === 'dark';
  const isAr = lang === 'ar';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<'chemistry' | 'physics' | 'problem_solver' | 'quiz_master'>(
    initialRole || (currentDomain === 'physics' ? 'physics' : 'chemistry')
  );
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset chat with tailored welcome message
  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        const welcomeText = isAr
          ? `مرحباً بك! أنا مساعدك العلمي الذكي المدعوم بنموذج Gemini 3.8 Flash. 
أنا جاهز للإجابة على جميع أسئلتك واستفساراتك في **الكيمياء** و**الفيزياء**، وحل المسائل الحسابية خطوة بخطوة، وشرح القوانين والتجارب المعملية.
ما هو السؤال أو المسألة التي تود أن نبدأ بها الآن؟`
          : `Hello! I am your AI Science Assistant powered by Gemini 3.8 Flash.
I'm ready to answer any questions in **Chemistry** and **Physics**, solve problems step-by-step, and explain laws and experiments.
What question would you like to explore today?`;

        setMessages([
          {
            id: 'welcome-1',
            role: 'assistant',
            content: welcomeText,
            timestamp: new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }

      // If initialQuery provided, ask immediately
      if (initialQuery && initialQuery.trim()) {
        handleSendMessage(initialQuery.trim());
      }

      // Focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Preset role descriptions
  const roles = [
    {
      id: 'chemistry' as const,
      titleAr: 'معلم الكيمياء',
      titleEn: 'Chemistry Tutor',
      descAr: 'الذرات، الروابط، كيمياء 3، جهود الاختزال، والأكسدة',
      descEn: 'Atoms, Bonds, Redox, EMF, and Reactions',
      icon: <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
    },
    {
      id: 'physics' as const,
      titleAr: 'معلم الفيزياء',
      titleEn: 'Physics Tutor',
      descAr: 'قوانين الغازات، الطفو، قانون كولوم، والظاهرة الكهروضوئية',
      descEn: 'Gas laws, Buoyancy, Coulomb, and Optics',
      icon: <Orbit className="w-3.5 h-3.5 text-purple-400" />
    },
    {
      id: 'problem_solver' as const,
      titleAr: 'حل المسائل خطوة بخطوة',
      titleEn: 'Step-by-Step Solver',
      descAr: 'المعطيات، القانون، التعويض الرياضي، والناتج بالوحدات',
      descEn: 'Given, Formulas, Substitution, and Final Units',
      icon: <Calculator className="w-3.5 h-3.5 text-amber-400" />
    },
    {
      id: 'quiz_master' as const,
      titleAr: 'اختبر معلوماتي (أسئلة)',
      titleEn: 'Quiz & Challenge',
      descAr: 'أسئلة اختيار من متعدد وتحديات علمية مع التقييم الفوري',
      descEn: 'MCQs, challenging problems, and instant feedback',
      icon: <Target className="w-3.5 h-3.5 text-rose-400" />
    }
  ];

  // Quick suggestion prompts
  const quickPrompts = [
    {
      textAr: 'كيف أوازن معادلة أكسدة واختزال بطريقة نصف التفاعل؟',
      textEn: 'How do I balance a redox equation using the half-reaction method?',
      role: 'chemistry' as const
    },
    {
      textAr: 'اشرح قانون بويل: لماذا يتناسب الحجم عكسياً مع الضغط؟',
      textEn: 'Explain Boyle\'s Law: why does volume inversely relate to pressure?',
      role: 'physics' as const
    },
    {
      textAr: 'احسب ضغط 2.5 مول من الغاز في حجم 10 لتر عند درجة حرارة 300K',
      textEn: 'Calculate pressure of 2.5 mol of gas in 10L volume at 300K',
      role: 'problem_solver' as const
    },
    {
      textAr: 'ما هي الظاهرة الكهروضوئية وكيف فسر أينشتاين دالة الشغل وجهد الإيقاف؟',
      textEn: 'What is the photoelectric effect and how did Einstein explain work function?',
      role: 'physics' as const
    },
    {
      textAr: 'اطرح علي 3 أسئلة اختيار من متعدد في منهج كيمياء 3 لاختبار فهمي',
      textEn: 'Give me 3 multiple choice questions in Chemistry 3 to test my understanding',
      role: 'quiz_master' as const
    }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    playLabSound('click');

    try {
      // Send conversation history to server-side Gemini API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          systemRole: selectedRole,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || t('تمت معالجة السؤال بنجاح.', 'Response processed successfully.'),
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        isFallback: data.isFallback
      };

      setMessages((prev) => [...prev, assistantMessage]);
      playLabSound('drop');
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        content: isAr
          ? `عذراً، حدث خطأ مؤقت أثناء معالجة السؤال. يمكنك إعادة المحاولة أو الاستعانة بحاسبة القوانين ومرجع كتاب كيمياء 3 المتاحين في التطبيق.`
          : `Sorry, an error occurred while processing your question. Please try again or consult the built-in formulas calculator.`,
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        isFallback: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    playLabSound('click');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    const welcomeText = isAr
      ? `تم بدء محادثة علمية جديدة. اطرح سؤالك أو اختر أحد التحديات أدناه!`
      : `Started a fresh conversation. Ask any question or pick a prompt below!`;
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    playLabSound('click');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-4xl h-[92vh] sm:h-[86vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDark
            ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.8)]'
            : 'bg-white/95 border-slate-200 text-slate-900 shadow-[0_25px_70px_rgba(0,0,0,0.15)]'
        }`}
      >
        {/* Top Header Bar */}
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-slate-800/90 bg-slate-900/80' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">
                  {t('المساعد العلمي الذكي للأسئلة والاستفسارات', 'AI Scientific Q&A Assistant')}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-bold">
                  Gemini Multi-Turn
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t('إجابات معتمدة، حل مسائل خطوة بخطوة، موازنة تفاعلات، وتوضيح قوانين الكيمياء والفيزياء',
                   'Step-by-step problem solver, equation balancer, and interactive science explanations')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector Pill */}
            <div className={`p-1 rounded-xl border flex items-center text-xs font-mono ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.8-flash')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  selectedModel === 'gemini-3.8-flash'
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Google Gemini 3.8 Flash (Comprehensive reasoning)"
              >
                3.8 Flash
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.1-flash-lite')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  selectedModel === 'gemini-3.1-flash-lite'
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Google Gemini 3.1 Flash Lite (Ultra fast responses)"
              >
                3.1 Lite
              </button>
            </div>

            {/* Clear Chat Button */}
            <button
              type="button"
              onClick={handleClearChat}
              className={`p-2 rounded-xl border transition-all ${
                isDark
                  ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={t('مسح المحادثة وبدء سؤال جديد', 'Clear chat and start fresh')}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-all ${
                isDark
                  ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={t('إغلاق النافذة (Esc)', 'Close modal (Esc)')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Persona / Role Selector Strip */}
        <div
          className={`px-4 py-2.5 border-b flex items-center gap-2 overflow-x-auto scrollbar-none ${
            isDark ? 'bg-slate-950/70 border-slate-800/80' : 'bg-slate-100/70 border-slate-200'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-400 shrink-0 hidden md:inline">
            {t('تخصيص نمط المساعد:', 'Tutor Persona:')}
          </span>
          <div className="flex items-center gap-2">
            {roles.map((r) => {
              const isSelected = selectedRole === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(r.id);
                    playLabSound('click');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/40'
                      : isDark
                      ? 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title={isAr ? r.descAr : r.descEn}
                >
                  <span>{r.icon}</span>
                  <span>{isAr ? r.titleAr : r.titleEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Chat Thread */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    isUser
                      ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white'
                      : 'bg-gradient-to-tr from-purple-600 to-amber-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-sm border transition-all ${
                    isUser
                      ? isDark
                        ? 'bg-gradient-to-r from-cyan-700/80 to-blue-700/80 border-cyan-500/40 text-white rounded-tr-none'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 rounded-tr-none'
                      : isDark
                      ? 'bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none'
                      : 'bg-slate-50 border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/10">
                    <span className="text-[11px] font-bold opacity-80 flex items-center gap-1.5">
                      {isUser ? (
                        <span>{t('سؤالك', 'Your Question')}</span>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>{t('إجابة المساعد العلمي (Gemini)', 'Science Assistant (Gemini)')}</span>
                        </>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono opacity-60">{msg.timestamp}</span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="opacity-70 hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
                          title={t('نسخ الإجابة', 'Copy answer')}
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Body with Text Formatting */}
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans select-text">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 items-start animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin-slow" />
              </div>
              <div
                className={`p-4 rounded-2xl rounded-tl-none border flex items-center gap-3 ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-100" />
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce delay-200" />
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {t('جاري التفكير وتحليل السؤال بواسطة Gemini...', 'Gemini is thinking and preparing the answer...')}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div
          className={`p-2.5 border-t flex items-center gap-2 overflow-x-auto scrollbar-none ${
            isDark ? 'border-slate-800/80 bg-slate-950/60' : 'border-slate-200/80 bg-slate-100/60'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">{t('أسئلة مقترحة سريعة:', 'Quick Prompts:')}</span>
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedRole(qp.role);
                  handleSendMessage(isAr ? qp.textAr : qp.textEn);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all whitespace-nowrap shrink-0 border ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 hover:border-cyan-500/60 text-slate-300 hover:text-white hover:bg-slate-850'
                    : 'bg-white border-slate-200 hover:border-cyan-500 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                {isAr ? qp.textAr : qp.textEn}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className={`p-3 sm:p-4 border-t flex items-center gap-2 sm:gap-3 ${
            isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب سؤالك العلمي هنا (مثال: احسب ضغط الغاز، وازن معادلة، أو اشرح ظاهرة كولوم)...'
                  : 'Ask any science question (e.g. calculate gas pressure, balance reaction, or explain Coulomb)...'
              }
              disabled={loading}
              className={`w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm font-sans transition-all focus:outline-hidden ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50'
              }`}
            />
            {input.trim() && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="absolute top-1/2 -translate-y-1/2 rtl:left-3 ltr:right-3 p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`px-4 sm:px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md shrink-0 ${
              input.trim() && !loading
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white ring-1 ring-cyan-400/40 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span>{t('إرسال السؤال', 'Send')}</span>
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
