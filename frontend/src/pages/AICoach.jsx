import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Send, Sparkles, RefreshCw, ChevronRight,
  Zap, Flame, BarChart2, MessageSquare, X, Loader2,
  TrendingUp, AlertTriangle, Target, ArrowRight, Trash2,
} from 'lucide-react';
import apiClient from '../api/client';
import { useHabitStore } from '../store/habitStore';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "I'm Zenith — your AI coach with full access to your habit data. I give **direct, data-driven advice**. No fluff.\n\n**Your move:** Ask me anything about your habits, streaks, or what to focus on next.",
};

// ── Markdown renderer ────────────────────────────────────────────────────────
function MdText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { elements.push(<br key={key++} />); continue; }

    if (line.startsWith('## ')) {
      elements.push(
        <div key={key++} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-primary)', marginTop: '14px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ display: 'inline-block', width: '3px', height: '10px', borderRadius: '2px', background: 'var(--color-primary)', flexShrink: 0 }} />
          {line.replace('## ', '')}
        </div>
      );
      continue;
    }

    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((p, pi) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={pi} style={{ color: 'var(--color-warm-white)', fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
      }
      return p;
    });

    elements.push(
      <p key={key++} style={{ margin: '0 0 4px', lineHeight: 1.65, color: 'var(--color-text-2)', fontSize: '13px' }}>
        {rendered}
      </p>
    );
  }
  return <div>{elements}</div>;
}

// ── Chat bubble ──────────────────────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '10px' }}
    >
      {!isUser && (
        <div style={{
          width: '28px', height: '28px', borderRadius: '9px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))',
          boxShadow: '0 2px 8px rgba(184,115,51,0.25)', alignSelf: 'flex-end',
        }}>
          <BrainCircuit size={13} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '82%',
        padding: isUser ? '10px 14px' : '12px 16px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser
          ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))'
          : 'var(--color-surface-2)',
        border: isUser ? '1px solid rgba(184,115,51,0.3)' : '1px solid var(--color-border)',
        boxShadow: isUser ? '0 2px 12px rgba(184,115,51,0.2)' : '0 2px 8px rgba(0,0,0,0.15)',
        position: 'relative', overflow: 'hidden',
      }}>
        {!isUser && (
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.2), transparent)' }} />
        )}
        {isUser ? (
          <p style={{ fontSize: '13px', color: '#fff', margin: 0, lineHeight: 1.55 }}>{msg.content}</p>
        ) : (
          <MdText text={msg.content} />
        )}
      </div>
    </motion.div>
  );
}

// ── Message skeleton — shown while history loads ─────────────────────────────
function MessageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px 2px' }}>
      {/* Fake assistant bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'var(--color-stone)', flexShrink: 0 }} />
        <div style={{ width: '72%', height: '72px', borderRadius: '18px 18px 18px 4px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
      {/* Fake user bubble */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '52%', height: '44px', borderRadius: '18px 18px 4px 18px', background: 'var(--color-stone)', border: '1px solid var(--color-border)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
      </div>
      {/* Fake assistant bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '9px', background: 'var(--color-stone)', flexShrink: 0 }} />
        <div style={{ width: '80%', height: '56px', borderRadius: '18px 18px 18px 4px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.1s' }} />
      </div>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingDot({ delay }) {
  return (
    <motion.span
      style={{ width: '5px', height: '5px', borderRadius: '99px', background: 'var(--color-primary)', display: 'inline-block' }}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 0.7, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

// ── Analysis section — lazy loaded ───────────────────────────────────────────
function AnalysisSection({ analysis, loading, onRefresh }) {
  const icons   = [TrendingUp, AlertTriangle, Target];
  const accents = ['#52a873', '#e07830', '#b07030'];
  const bgs     = ['rgba(82,168,115,0.08)', 'rgba(224,120,48,0.08)', 'rgba(176,112,48,0.08)'];
  const borders = ['rgba(82,168,115,0.2)', 'rgba(224,120,48,0.2)', 'rgba(176,112,48,0.2)'];

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <BarChart2 size={13} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-3)' }}>
            Habit Analysis
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }} onClick={onRefresh} disabled={loading}
          style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: loading ? 'default' : 'pointer', color: 'var(--color-text-3)' }}
        >
          <motion.div animate={{ rotate: loading ? 360 : 0 }} transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}>
            <RefreshCw size={11} />
          </motion.div>
        </motion.button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ height: '72px', borderRadius: '14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      ) : !analysis ? (
        /* Idle state — not yet triggered */
        <div style={{ padding: '24px', borderRadius: '14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <BarChart2 size={24} style={{ color: 'var(--color-text-3)', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '12px', color: 'var(--color-text-3)', margin: '0 0 10px' }}>Click refresh to analyze your habits</p>
          <motion.button whileTap={{ scale: 0.96 }} onClick={onRefresh}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '9px', fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)', background: 'var(--color-primary-glow)', border: '1px solid var(--color-primary-border)', cursor: 'pointer' }}>
            <Sparkles size={11} /> Analyze now
          </motion.button>
        </div>
      ) : analysis?.raw_response ? (
        <div style={{ display: 'grid', gap: '8px' }}>
          {analysis.insights.length > 0
            ? analysis.insights.map((insight, i) => {
                const Icon = icons[i] || Target;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    style={{ padding: '12px 14px', borderRadius: '14px', background: bgs[i] || bgs[2], border: `1px solid ${borders[i] || borders[2]}`, display: 'flex', alignItems: 'flex-start', gap: '10px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: '8px', bottom: '8px', width: '3px', borderRadius: '0 3px 3px 0', background: accents[i] || accents[2] }} />
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${accents[i] || accents[2]}22`, border: `1px solid ${accents[i] || accents[2]}44` }}>
                      <Icon size={13} style={{ color: accents[i] || accents[2] }} />
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-2)', margin: 0, lineHeight: 1.6, flex: 1 }}>{insight}</p>
                  </motion.div>
                );
              })
            : (
              <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <MdText text={analysis.raw_response} />
              </div>
            )
          }
        </div>
      ) : (
        <div style={{ padding: '24px', borderRadius: '14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
          <BarChart2 size={24} style={{ color: 'var(--color-text-3)', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '12px', color: 'var(--color-text-3)', margin: 0 }}>Click refresh to analyze your habits</p>
        </div>
      )}
    </div>
  );
}

// ── Quick prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: '🎯', text: 'What should I focus on today?' },
  { icon: '🔥', text: 'Which habit is most at risk?' },
  { icon: '📈', text: 'How is my consistency trending?' },
  { icon: '💡', text: 'Give me one actionable tip' },
];

// ── Main AI Coach Page ───────────────────────────────────────────────────────
export default function AICoach() {
  const { userStats } = useHabitStore();

  const [messages, setMessages]               = useState([WELCOME_MESSAGE]);
  const [input, setInput]                     = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  // Three distinct loading states so they don't block each other
  const [historyLoading, setHistoryLoading]   = useState(true);
  const [analysis, setAnalysis]               = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [embedLoading, setEmbedLoading]       = useState(false);
  const [contextRefreshed, setContextRefreshed] = useState(false);
  const [clearConfirm, setClearConfirm]       = useState(false);

  const bottomRef       = useRef(null);
  const inputRef        = useRef(null);
  const shouldScrollRef = useRef(false);
  // Track whether embed has been refreshed this session (avoid redundant calls)
  const embedDoneRef    = useRef(false);

  // Scroll only when user sends — never on load
  useEffect(() => {
    if (!shouldScrollRef.current) return;
    shouldScrollRef.current = false;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── OPTIMIZED LOADING ────────────────────────────────────────────────────
  // Priority 1: Fetch chat history immediately — this is the critical path.
  // Priority 2: Fire-and-forget embed refresh (no await, no spinner).
  // Priority 3: Analysis is NOT loaded on mount — only on user demand.
  useEffect(() => {
    // --- Critical path: history only ---
    const loadHistory = async () => {
      try {
        const res = await apiClient.get(`/api/v1/chat/history/${USER_ID}`);
        const rows = res.data?.data || [];
        if (rows.length > 0) {
          setMessages([
            WELCOME_MESSAGE,
            ...rows.map(r => ({ role: r.role, content: r.content, id: r.id })),
          ]);
        }
      } catch (_) {
        // silently fall back to welcome message
      } finally {
        setHistoryLoading(false);
        // Focus input once history is ready
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    loadHistory();

    // --- Non-critical: embed refresh in background, no await ---
    // Runs independently — doesn't delay the UI
    if (!embedDoneRef.current) {
      embedDoneRef.current = true;
      apiClient.post('/api/v1/chat/embed', { user_id: USER_ID }).catch(() => {});
    }

    // Analysis is intentionally NOT fetched here — see loadAnalysis()
  }, []);

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput('');
    shouldScrollRef.current = true;
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsLoading(true);
    try {
      const res = await apiClient.post('/api/v1/chat/message', { user_id: USER_ID, message: msg });
      const reply = res.data?.data?.reply || 'Something went wrong on my end.';
      shouldScrollRef.current = true;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      shouldScrollRef.current = true;
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lost connection — check your network and retry.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  // ── Refresh context (manual) ─────────────────────────────────────────────
  const refreshContext = useCallback(async () => {
    setEmbedLoading(true);
    try {
      await apiClient.post('/api/v1/chat/embed', { user_id: USER_ID });
      setContextRefreshed(true);
      setTimeout(() => setContextRefreshed(false), 3000);
    } catch (_) {}
    finally { setEmbedLoading(false); }
  }, []);

  // ── Load analysis — only on demand ──────────────────────────────────────
  const loadAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/chat/analyze/${USER_ID}`);
      setAnalysis(res.data?.data || null);
    } catch {
      setAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  // ── Clear history ────────────────────────────────────────────────────────
  const clearHistory = useCallback(async () => {
    try {
      await apiClient.delete(`/api/v1/chat/history/${USER_ID}`);
      setMessages([WELCOME_MESSAGE]);
      setClearConfirm(false);
    } catch (_) {}
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Header row ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: '8px', marginBottom: '12px', flexWrap: 'wrap',
      }}>
        <div style={{ minWidth: 0 }}>
          <motion.h1 className="text-display" style={{ marginBottom: '2px' }}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            AI Coach
          </motion.h1>
          <p style={{ fontSize: '12px', color: 'var(--color-text-3)', margin: 0 }}>
            Powered by Groq · conversation saved automatically
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center', paddingTop: '4px', flexWrap: 'wrap' }}>
          <AnimatePresence mode="wait">
            {clearConfirm ? (
              <motion.div key="confirm"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>Clear history?</span>
                <button onClick={clearHistory}
                  style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }}>
                  Yes
                </button>
                <button onClick={() => setClearConfirm(false)}
                  style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', background: 'var(--color-stone)', color: 'var(--color-text-3)', border: '1px solid var(--color-border)' }}>
                  No
                </button>
              </motion.div>
            ) : (
              <motion.button key="trash" whileTap={{ scale: 0.95 }} onClick={() => setClearConfirm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: 'var(--color-stone)', color: 'var(--color-text-3)', border: '1px solid var(--color-border)' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-3)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}>
                <Trash2 size={11} />
                Clear
              </motion.button>
            )}
          </AnimatePresence>

          <motion.button whileTap={{ scale: 0.95 }} onClick={refreshContext} disabled={embedLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, cursor: embedLoading ? 'default' : 'pointer', background: contextRefreshed ? 'rgba(82,168,115,0.12)' : 'var(--color-stone)', color: contextRefreshed ? '#6fcf8a' : 'var(--color-text-3)', border: `1px solid ${contextRefreshed ? 'rgba(82,168,115,0.3)' : 'var(--color-border)'}`, transition: 'all 0.2s' }}>
            <motion.div animate={{ rotate: embedLoading ? 360 : 0 }} transition={{ duration: 1, repeat: embedLoading ? Infinity : 0, ease: 'linear' }}>
              <RefreshCw size={11} />
            </motion.div>
            {contextRefreshed ? 'Updated!' : 'Re-sync'}
          </motion.button>
        </div>
      </div>

      {/* ── Context strip ── */}
      {userStats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {[
            { icon: Zap,       val: `Lv ${userStats.level}`,               color: '#b87333' },
            { icon: Flame,     val: `${userStats.current_streak}d streak`,  color: '#e07830' },
            { icon: BarChart2, val: `${userStats.xp} XP`,                  color: 'var(--color-primary)' },
          ].map(({ icon: Icon, val, color }) => (
            <div key={val} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '8px', background: 'var(--color-stone)', border: '1px solid var(--color-border)' }}>
              <Icon size={10} style={{ color }} />
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-2)' }}>{val}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Main layout: chat left, analysis right (desktop) ── */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

        {/* Chat column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Message list */}
          <div style={{ marginBottom: '10px' }}>
            {historyLoading ? (
              /* Fast skeleton — shows immediately, no delay */
              <MessageSkeleton />
            ) : (
              <div style={{ padding: '4px 2px 0' }}>
                {messages.map((msg, i) => <Bubble key={msg.id || i} msg={msg} />)}
              </div>
            )}

            <AnimatePresence>
              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '9px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' }}>
                    <BrainCircuit size={13} color="#fff" />
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <TypingDot delay={0} /><TypingDot delay={0.15} /><TypingDot delay={0.3} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map(({ icon, text }) => (
              <motion.button key={text} whileTap={{ scale: 0.95 }}
                onClick={() => sendMessage(text)}
                disabled={historyLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 500, cursor: historyLoading ? 'default' : 'pointer', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)', whiteSpace: 'nowrap', opacity: historyLoading ? 0.5 : 1 }}
                onMouseEnter={e => { if (!historyLoading) { e.currentTarget.style.borderColor = 'var(--color-primary-border)'; e.currentTarget.style.color = 'var(--color-primary)'; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
              >
                <span>{icon}</span>{text}
              </motion.button>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask me anything about your habits…"
                disabled={historyLoading}
                style={{
                  width: '100%', background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)', borderRadius: '12px',
                  padding: '12px 46px 12px 16px', color: 'var(--color-text-1)',
                  fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none',
                  transition: 'border-color 0.15s', boxSizing: 'border-box',
                  opacity: historyLoading ? 0.5 : 1,
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-primary-border)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading || historyLoading}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  width: '30px', height: '30px', borderRadius: '9px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: input.trim() ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dim))' : 'var(--color-stone)',
                  border: input.trim() ? '1px solid rgba(184,115,51,0.3)' : '1px solid var(--color-border)',
                  cursor: input.trim() && !historyLoading ? 'pointer' : 'default',
                  color: input.trim() ? '#fff' : 'var(--color-text-3)',
                  transition: 'all 0.15s',
                }}
              >
                {isLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={12} />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Analysis panel — desktop only, lazy loaded */}
        <div className="hidden md:block" style={{ width: '280px', flexShrink: 0 }}>
          <AnalysisSection
            analysis={analysis}
            loading={analysisLoading}
            onRefresh={loadAnalysis}
          />

          <div style={{ borderRadius: '14px', padding: '14px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: '8px', bottom: '8px', width: '3px', borderRadius: '0 3px 3px 0', background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-dim))' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={11} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)' }}>How it works</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {[
                { step: '01', text: 'Your habit logs are embedded into vectors' },
                { step: '02', text: 'Relevant context is retrieved via pgvector' },
                { step: '03', text: 'Groq generates hyper-specific advice' },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--color-primary)', opacity: 0.7, flexShrink: 0, paddingTop: '2px' }}>{step}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-3)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}