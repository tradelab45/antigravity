import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  HelpCircle, 
  ShieldCheck, 
  Layers,
  RotateCcw,
  Clock,
  Globe,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  Copy,
  Check,
  Cpu,
  BarChart2,
  PieChart
} from 'lucide-react';
import { useSimulator } from '../context/SimulatorContext';
import { Holding } from '../types';
import { formatINR } from '../utils/formatters';

interface Message {
  id: string;
  sender: 'user' | 'chanakya';
  text: string;
  timestamp: string;
  model?: string;
  responseMode?: string;
  sources?: Array<{ title: string; url?: string }>;
  generatedAt?: string;
}

const CATEGORIZED_PROMPTS = [
  { label: '⚡ Instant Portfolio Audit', query: 'Conduct a complete audit of my current portfolio holdings and cash balance. Give me an overall diversification health score and your top recommendations.' },
  { label: '📈 20 EMA & RSI Breakouts', query: 'How do I use Relative Strength Index (RSI) and 20 Exponential Moving Average (EMA) to confirm a high-probability breakout on Nifty 50 stocks?' },
  { label: '🍕 P/E Ratio (Pizza Analogy)', query: 'Explain what Price to Earnings (P/E) ratio and ROCE mean using simple teen analogies like a pizza slice or gaming XP.' },
  { label: '🛡️ 2% Risk Management Rule', query: 'Explain the 2% position sizing rule and why Dalal Street veterans cut losses early instead of averaging down on losing trades.' },
  { label: '🏛️ STCG 20% vs LTCG 12.5% Tax', query: 'Explain the latest Indian stock market capital gains tax rules (STCG vs LTCG) under the Union Budget in simple terms.' },
  { label: '🇮🇳 हिंदी में सलाह (Hindi)', query: 'नमस्ते चाणक्य जी! एक नए निवेशक के लिए निफ्टी 50 में नियमित निवेश करना क्यों फायदेमंद माना जाता है?' },
];

interface AIStatus {
  configured: boolean;
  model?: string;
  modelName?: string;
  searchGrounding: boolean;
  checked: boolean;
  checkedAt?: string;
}

const welcomeMessage = (status?: AIStatus) => {
  const modelLabel = status?.modelName || 'Gemini 3.8 Flash';
  const capabilityNote = status?.checked
    ? status.configured
      ? `Powered by **${modelLabel}** with real-time Google Search grounding enabled for live NSE Dalal Street market queries.`
      : `Operating on the Chanakya Dalal Street Intelligence Engine (offline educational mode). All stock valuation principles, DuPont metrics, and risk management rules are fully interactive!`
    : 'Initializing Gemini 3.8 Flash high-speed reasoning connection…';
  return `Namaste, Rookie Investor! 🙏 I am **Chanakya Jr.**, your Dalal Street AI Mentor powered by **${modelLabel}**.\n\nYou have **₹10,00,000** in virtual capital to build your financial future. Ask me about technical breakouts, P/E valuations, portfolio risk audits, or options mechanics.\n\n*${capabilityNote}*`;
};

export const ChanakyaMentor: React.FC = () => {
  const { portfolioValue, cashBalance, holdings, userLevel, userXP, unlockBadge } = useSimulator();
  const [aiStatus, setAiStatus] = useState<AIStatus>({ 
    configured: false, 
    model: 'gemini-3.8-flash',
    modelName: 'Gemini 3.8 Flash',
    searchGrounding: false, 
    checked: false 
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'chanakya',
      text: welcomeMessage(),
      timestamp: 'Just now',
      model: 'Gemini 3.8 Flash',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    fetch('/api/gemini/status')
      .then((response) => response.json())
      .then((data) => {
        const nextStatus: AIStatus = {
          configured: Boolean(data.configured),
          model: data.model || 'gemini-3.8-flash',
          modelName: data.modelName || 'Gemini 3.8 Flash',
          searchGrounding: Boolean(data.searchGrounding),
          checked: true,
          checkedAt: data.checkedAt,
        };
        setAiStatus(nextStatus);
        setMessages((previous) => previous.map((message) => message.id === 'welcome' ? { ...message, text: welcomeMessage(nextStatus), model: nextStatus.modelName } : message));
      })
      .catch(() => {
        const nextStatus: AIStatus = { 
          configured: false, 
          model: 'gemini-3.8-flash',
          modelName: 'Gemini 3.8 Flash',
          searchGrounding: false, 
          checked: true 
        };
        setAiStatus(nextStatus);
        setMessages((previous) => previous.map((message) => message.id === 'welcome' ? { ...message, text: welcomeMessage(nextStatus), model: nextStatus.modelName } : message));
      });
  }, []);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Copy helper
  const handleCopyText = (text: string, msgId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      window.setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  // Text to Speech playback helper
  const speakText = (text: string, msgId: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find an Indian English or natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.name.includes('India')) ||
      voices.find(v => v.lang.startsWith('en')) || null;
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Voice Input using Web Speech Recognition
  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported on this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleClearChat = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setMessages([
      {
        id: 'welcome',
        sender: 'chanakya',
        text: welcomeMessage(aiStatus),
        timestamp: 'Just now',
        model: aiStatus.modelName || 'Gemini 3.8 Flash',
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Send to server-side Gemini 3.8 Flash API endpoint
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages,
          portfolioContext: {
            portfolioValue,
            cashBalance,
            holdingsCount: Object.keys(holdings).length,
            holdings: (Object.values(holdings) as Holding[]).map((h: Holding) => ({
              symbol: h.symbol,
              quantity: h.quantity,
              avgBuyPrice: h.avgBuyPrice,
            })),
            level: userLevel.level,
            xp: userXP,
          },
        }),
      });

      let botReply = 'Apologies rookie! The market floor was busy. Try asking me again!';
      let responseMeta: Pick<Message, 'responseMode' | 'sources' | 'generatedAt' | 'model'> = {
        model: 'Gemini 3.8 Flash'
      };
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          botReply = data.text || data.reply || data.message || botReply;
          responseMeta = { 
            responseMode: data.mode, 
            model: data.model ? (data.model.includes('3.8') ? 'Gemini 3.8 Flash' : data.model) : 'Gemini 3.8 Flash',
            sources: Array.isArray(data.sources) ? data.sources : [], 
            generatedAt: data.generatedAt 
          };
          if (data.mode === 'offline-educational') {
            setAiStatus(prev => ({ ...prev, configured: false, searchGrounding: false, checked: true }));
          }
        }
      }

      const botMsgId = (Date.now() + 1).toString();
      const botMsg: Message = {
        id: botMsgId,
        sender: 'chanakya',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...responseMeta,
      };

      setMessages((prev) => [...prev, botMsg]);
      unlockBadge('badge-mentor');

      // If auto audio is enabled, read aloud
      if (speechSynthesisActive) {
        speakText(botReply, botMsgId);
      }
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'chanakya',
        text: 'Chanakya is currently analyzing Dalal Street order flow. Please ask your question again in a moment!',
        timestamp: 'Just now',
        model: 'Gemini 3.8 Flash',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Instant 1-Click Portfolio Audit Action
  const handleInstantAudit = () => {
    handleSendMessage('Conduct a complete audit of my current portfolio holdings and cash balance. Give me an overall diversification health score and your top recommendations.');
  };

  return (
    <div className="bg-white dark:bg-[#071018] border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm flex flex-col h-[78vh] overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Header with Gemini 3.8 Flash Badging */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-900 via-slate-900 to-slate-950 p-0.5 shadow-md flex items-center justify-center text-white border border-indigo-500/30">
            <Zap className="w-5 h-5 text-emerald-700 dark:text-[#00f59b] fill-[#00f59b]/20" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight">
                Chanakya Jr. AI Mentor
              </h3>
              {/* Gemini 3.8 Flash Active Model Pill */}
              <span className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <Cpu className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>GEMINI 3.8 FLASH</span>
              </span>
              <span className={`${aiStatus.configured ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30'} text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border`}>
                <span className={`w-1.5 h-1.5 rounded-full ${aiStatus.configured ? 'bg-[#00f59b] animate-pulse' : 'bg-amber-500'}`} />
                {aiStatus.checked ? (aiStatus.configured ? 'ONLINE AI' : 'OFFLINE GUIDE') : 'CONNECTING'}
              </span>
              <span className={`${aiStatus.searchGrounding ? 'bg-[#00f59b]/15 text-emerald-800 dark:text-emerald-700 dark:text-[#00f59b] border-[#00f59b]/30' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'} text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border`}>
                <Globe className="w-3 h-3" />
                <span>{aiStatus.searchGrounding ? 'GOOGLE SEARCH GROUNDED' : 'EDUCATIONAL MODE'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Powered by Google Gemini 3.8 Flash • High-Speed Reasoning & Voice Output
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 1-Click Instant Portfolio Audit Button */}
          <button
            onClick={handleInstantAudit}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-[#00f59b]/15 hover:bg-[#00f59b]/25 border border-[#00f59b]/40 text-emerald-700 dark:text-[#00f59b] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Perform Instant Gemini 3.8 Flash Portfolio Audit"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instant Audit</span>
          </button>

          {/* Auto Read Speech Toggle */}
          <button
            onClick={() => setSpeechSynthesisActive(!speechSynthesisActive)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              speechSynthesisActive
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={speechSynthesisActive ? 'Auto Read Aloud Active' : 'Enable Auto Read Aloud Voice'}
          >
            {speechSynthesisActive ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px]">{speechSynthesisActive ? 'Voice ON' : 'Voice OFF'}</span>
          </button>

          {/* Reset Chat */}
          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl bg-white dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Telemetry & Educational Safe Harbor Notice */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-200 dark:border-white/10 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-[10px] font-bold text-amber-950 dark:text-amber-300 sm:px-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Educational Paper Trading Simulation • Virtual ₹10,00,000 Funds • Not SEBI Advisory</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Engine: <strong>Gemini 3.8 Flash</strong></span>
          <span>•</span>
          <span>Web Grounding: {aiStatus.searchGrounding ? 'Active' : 'Offline'}</span>
          {aiStatus.checkedAt && (
            <>
              <span>•</span>
              <time dateTime={aiStatus.checkedAt}>
                Synced {new Date(aiStatus.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-[#04090d]/60">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSpeaking = speakingMsgId === msg.id;
          const isCopied = copiedMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-extrabold ${
                  isUser
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-emerald-700 dark:text-[#00f59b]" />}
              </div>

              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-3xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white font-medium rounded-tr-none shadow-sm'
                    : 'bg-white dark:bg-[#0c161f] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line space-y-2">{msg.text}</div>
                
                {/* AI Grounding Sources & Model Badge */}
                {!isUser && (
                  <div className="mt-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-black/30 p-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-slate-900 dark:text-white">
                          {msg.model || 'Gemini 3.8 Flash'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-[10px] text-emerald-700 dark:text-[#00f59b] font-mono uppercase">
                          {msg.responseMode === 'gemini-3.8-flash-grounded' ? 'Search-Grounded' : msg.responseMode === 'offline-educational' ? 'Rule-Based Engine' : 'AI Reasoning'}
                        </span>
                      </div>
                      {msg.generatedAt && (
                        <time dateTime={msg.generatedAt} className="text-[10px] text-slate-400 font-mono">
                          {new Date(msg.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </time>
                      )}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-black text-slate-700 dark:text-slate-300">Grounding Sources:</span>
                        {msg.sources.map((source, index) => 
                          source.url ? (
                            <a
                              key={`${source.title}-${index}`}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 bg-indigo-500/10 px-2 py-0.5 rounded"
                            >
                              <span>{source.title}</span>
                            </a>
                          ) : (
                            <span key={`${source.title}-${index}`} className="bg-slate-200/60 dark:bg-white/10 px-2 py-0.5 rounded">
                              {source.title}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Action Bar (Listen, Copy, Timestamp) */}
                <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between gap-2">
                  {!isUser ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakText(msg.text, msg.id)}
                        className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          isSpeaking
                            ? 'bg-emerald-200 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 font-extrabold'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                        title="Read this explanation aloud"
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-emerald-600 animate-pulse' : ''}`} />
                        <span>{isSpeaking ? 'Speaking...' : 'Listen'}</span>
                      </button>

                      <button
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                        title="Copy answer to clipboard"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  ) : <div />}
                  
                  <div
                    className={`text-[10px] font-mono font-medium ${
                      isUser ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4 text-emerald-700 dark:text-[#00f59b]" />
            </div>
            <div className="bg-white dark:bg-[#0c161f] border border-slate-200 dark:border-white/10 rounded-3xl rounded-tl-none p-4 sm:p-5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3 shadow-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f59b] animate-bounce" />
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#00f59b] animate-bounce [animation-delay:0.4s]" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Gemini 3.8 Flash is analyzing Dalal Street fundamentals & market data…
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Categorized Quick Prompt Chips */}
      <div className="p-3 bg-white dark:bg-[#081219] border-t border-slate-200 dark:border-white/10 overflow-x-auto scrollbar-none flex gap-2">
        {CATEGORIZED_PROMPTS.map((prompt, pIdx) => (
          <button
            key={pIdx}
            onClick={() => handleSendMessage(prompt.query)}
            className="text-xs bg-slate-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
          >
            {prompt.label}
          </button>
        ))}
      </div>

      {/* Input Form with Voice Recognition */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-white dark:bg-[#071018] border-t border-slate-200 dark:border-white/10 flex items-center gap-2"
      >
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            placeholder={isListening ? 'Listening to your voice...' : 'Ask Chanakya Jr. about NSE stocks, P/E ratios, risk management, or your portfolio...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className={`w-full bg-slate-50 dark:bg-white/5 border rounded-2xl pl-4 pr-11 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#00f59b] dark:focus:border-[#00f59b] font-medium transition-all ${
              isListening ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200 dark:border-white/10'
            }`}
          />
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`absolute right-2.5 p-1.5 rounded-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
            }`}
            title={isListening ? 'Stop recording voice' : 'Speak with Microphone'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-4 sm:px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-[#00f59b] dark:hover:bg-[#00f59b]/90 dark:text-slate-950 disabled:opacity-40 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Ask Gemini</span>
        </button>
      </form>

    </div>
  );
};
