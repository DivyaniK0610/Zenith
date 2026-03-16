import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, RotateCcw, Coffee, BrainCircuit,
  Zap, Check, ChevronDown, Loader2, Clock,
  Settings, X, Plus, Minus,
  Maximize2, Minimize2, StickyNote, SkipForward, Bell,
  Music, VolumeX, Volume1, Volume2,
} from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import { logPomodoroSession } from '../api/habits';
import { useZenithSounds } from '../hooks/useSound';
import { toast } from 'sonner';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';
const STORAGE_KEY = 'slate_timer_state';
const DUR_KEY     = 'slate_timer_durations';

// ── Persistence helpers ───────────────────────────────────────────────────────
function saveState(s) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, savedAt: Date.now() })); } catch (_) {}
}
function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.running && s.savedAt) {
      const elapsed = Math.floor((Date.now() - s.savedAt) / 1000);
      s.timeLeft = Math.max(0, (s.timeLeft || 0) - elapsed);
      if (s.timeLeft === 0) s.running = false;
    }
    return s;
  } catch (_) { return null; }
}
function loadDurations() {
  try { return JSON.parse(localStorage.getItem(DUR_KEY)) || { focus: 25, short_break: 5, long_break: 15 }; }
  catch (_) { return { focus: 25, short_break: 5, long_break: 15 }; }
}

const MODES = {
  focus:       { label: 'Focus',       color: '#b87333', glow: 'rgba(184,115,51,0.4)'  },
  short_break: { label: 'Short Break', color: '#52a873', glow: 'rgba(82,168,115,0.4)'  },
  long_break:  { label: 'Long Break',  color: '#6b9fd4', glow: 'rgba(107,159,212,0.4)' },
};

const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

// ── Ambient sound engine using Web Audio API ──────────────────────────────────
// Replace AmbientSoundEngine class entirely with this:
const AMBIENT_SOUNDS = [
  { id: 'off',    label: 'Off',     icon: '○', file: null },
  { id: 'rain',   label: 'Rain',    icon: '🌧', file: '/sounds/rain.mp3' },
  { id: 'forest', label: 'Forest',  icon: '🌿', file: '/sounds/forest.mp3' },
  { id: 'cafe',   label: 'Café',    icon: '☕', file: '/sounds/cafe.mp3' },
  { id: 'white',  label: 'Brown',   icon: '〜', file: '/sounds/brown-noise.mp3' },
  { id: 'fire',   label: 'Fire',    icon: '🔥', file: '/sounds/fireplace.mp3' },
];

class AmbientSoundEngine {
  constructor() {
    this.audio = null;
    this.currentSound = 'off';
    this.volume = 0.5;
  }

  play(soundId) {
    // Stop current
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.currentSound = soundId;
    if (soundId === 'off') return;

    const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
    if (!sound?.file) return;

    this.audio = new Audio(sound.file);
    this.audio.loop = true;
    this.audio.volume = this.volume;

    // Fade in
    this.audio.volume = 0;
    this.audio.play().catch(() => {});
    let vol = 0;
    const fadeIn = setInterval(() => {
      vol = Math.min(vol + 0.05, this.volume);
      if (this.audio) this.audio.volume = vol;
      if (vol >= this.volume) clearInterval(fadeIn);
    }, 50);
  }

  setVolume(vol) {
    this.volume = vol;
    if (this.audio) this.audio.volume = vol;
  }

  stop() {
    if (this.audio) {
      // Fade out
      const fadeOut = setInterval(() => {
        if (!this.audio) { clearInterval(fadeOut); return; }
        this.audio.volume = Math.max(0, this.audio.volume - 0.05);
        if (this.audio.volume <= 0) {
          this.audio.pause();
          this.audio.src = '';
          this.audio = null;
          clearInterval(fadeOut);
        }
      }, 40);
    }
    this.currentSound = 'off';
  }
}


// Singleton — persists across re-renders
const ambientEngine = new AmbientSoundEngine();


// ── Ring ──────────────────────────────────────────────────────────────────────
function Ring({ progress, color, glow, size, stroke, running, isLight }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  // Track color adapts to theme
  const trackColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)';
  const tickColor  = isLight ? 'rgba(0,0,0,0.06)'  : 'rgba(255,255,255,0.06)';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ position:'absolute', top:0, left:0, transform:'rotate(-90deg)' }}>
      {[...Array(12)].map((_, i) => {
        const a = (i/12)*2*Math.PI;
        const ri = r-stroke/2-4, ro = r-stroke/2+2;
        return <line key={i}
          x1={size/2+ri*Math.cos(a)} y1={size/2+ri*Math.sin(a)}
          x2={size/2+ro*Math.cos(a)} y2={size/2+ro*Math.sin(a)}
          stroke={tickColor} strokeWidth="1.5" strokeLinecap="round"/>;
      })}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke}/>
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        animate={{ strokeDashoffset: circ*(1-progress) }}
        transition={{ duration: running ? 1 : 0.5, ease:'linear' }}
        style={{ filter:`drop-shadow(0 0 8px ${glow})` }}/>
    </svg>
  );
}

// ── Dots ──────────────────────────────────────────────────────────────────────
function Dots({ count, color }) {
  const inCycle = count % 4;
  return (
    <div style={{ display:'flex', gap:'8px', alignItems:'center', justifyContent:'center' }}>
      {[0,1,2,3].map(i => {
        const filled = (inCycle===0 && count>0) ? true : i < inCycle;
        return (
          <motion.div key={i}
            animate={{ scale: filled?1:0.5, opacity: filled?1:0.2 }}
            transition={{ duration:0.25, type:'spring', stiffness:400 }}
            style={{ width: i===3?'10px':'8px', height: i===3?'10px':'8px',
              borderRadius:'99px', background: filled?color:'var(--color-stone-light)',
              boxShadow: filled?`0 0 8px ${color}`:'none',
              border: i===3?`1px solid ${color}44`:'none' }}/>
        );
      })}
    </div>
  );
}

// ── Ambient sound picker ──────────────────────────────────────────────────────
function AmbientPicker({ current, onSelect, volume, onVolumeChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const active = AMBIENT_SOUNDS.find(s => s.id === current) || AMBIENT_SOUNDS[0];
  const isPlaying = current !== 'off';

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <motion.button whileTap={{ scale:0.92 }} onClick={() => setOpen(o=>!o)}
        title="Ambient sounds"
        style={{
          width:'32px', height:'32px', borderRadius:'9px',
          display:'flex', alignItems:'center', justifyContent:'center',
          background: isPlaying ? 'rgba(184,115,51,0.15)' : 'var(--color-stone)',
          border: `1px solid ${isPlaying ? 'var(--color-primary-border)' : 'var(--color-border)'}`,
          color: isPlaying ? 'var(--color-primary)' : 'var(--color-text-3)',
          cursor:'pointer', transition:'all 0.15s',
          position:'relative',
        }}>
        <Music size={13}/>
        {isPlaying && (
          <motion.div
            animate={{ scale:[1,1.4,1], opacity:[0.8,0,0.8] }}
            transition={{ duration:2, repeat:Infinity }}
            style={{ position:'absolute', inset:'-3px', borderRadius:'12px', border:`1px solid ${MODES.focus.color}`, pointerEvents:'none' }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:-8, scale:0.96 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0, y:-6, scale:0.96 }}
            transition={{ duration:0.16 }}
            style={{
              position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:200,
              width:'220px', borderRadius:'14px',
              background:'var(--color-surface-2)',
              border:'1px solid var(--color-border)',
              boxShadow:'0 16px 48px rgba(0,0,0,0.3)',
              overflow:'hidden',
            }}>
            <div style={{ position:'absolute', inset:'0 0 auto 0', height:'1px', background:'linear-gradient(90deg,transparent,rgba(184,115,51,0.4),transparent)' }}/>
            
            <div style={{ padding:'10px 12px 6px' }}>
              <div style={{ fontSize:'9px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--color-text-3)', marginBottom:'8px' }}>
                Ambient Sounds
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px' }}>
                {AMBIENT_SOUNDS.map(sound => (
                  <motion.button key={sound.id} whileTap={{ scale:0.95 }}
                    onClick={() => { onSelect(sound.id); }}
                    style={{
                      padding:'8px 10px', borderRadius:'10px', cursor:'pointer',
                      display:'flex', alignItems:'center', gap:'7px',
                      background: current===sound.id ? 'rgba(184,115,51,0.12)' : 'var(--color-stone)',
                      border:`1px solid ${current===sound.id ? 'rgba(184,115,51,0.35)' : 'var(--color-border)'}`,
                      color: current===sound.id ? 'var(--color-primary)' : 'var(--color-text-2)',
                      fontSize:'12px', fontWeight: current===sound.id ? 600 : 400,
                      transition:'all 0.15s',
                    }}>
                    <span style={{ fontSize:'14px', lineHeight:1 }}>{sound.icon}</span>
                    {sound.label}
                    {current===sound.id && sound.id !== 'off' && (
                      <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1.5, repeat:Infinity }}
                        style={{ width:'5px', height:'5px', borderRadius:'99px', background:'var(--color-primary)', marginLeft:'auto', flexShrink:0 }}/>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Volume slider — only show when a sound is active */}
            {current !== 'off' && (
              <div style={{ padding:'8px 12px 12px', borderTop:'1px solid var(--color-border)', marginTop:'6px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <Volume1 size={11} style={{ color:'var(--color-text-3)', flexShrink:0 }}/>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={volume}
                    onChange={e => onVolumeChange(parseFloat(e.target.value))}
                    style={{ flex:1, accentColor:'var(--color-primary)', cursor:'pointer' }}
                  />
                  <Volume2 size={11} style={{ color:'var(--color-text-3)', flexShrink:0 }}/>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Settings panel ────────────────────────────────────────────────────────────
function SettingsPanel({ durations, onChange, onClose }) {
  const [local, setLocal] = useState({...durations});
  const Field = ({ k, label, min, max }) => (
    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
      <span style={{ fontSize:'11px', color:'var(--color-text-3)', flex:1 }}>{label}</span>
      <button onClick={() => setLocal(p=>({...p,[k]:Math.max(min,p[k]-1)}))}
        style={{ width:'26px',height:'26px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-stone)',border:'1px solid var(--color-border)',color:'var(--color-text-2)',cursor:'pointer' }}>
        <Minus size={11}/>
      </button>
      <span style={{ fontFamily:'var(--font-mono)',fontSize:'14px',fontWeight:700,color:'var(--color-warm-white)',minWidth:'32px',textAlign:'center' }}>
        {local[k]}m
      </span>
      <button onClick={() => setLocal(p=>({...p,[k]:Math.min(max,p[k]+1)}))}
        style={{ width:'26px',height:'26px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-stone)',border:'1px solid var(--color-border)',color:'var(--color-text-2)',cursor:'pointer' }}>
        <Plus size={11}/>
      </button>
    </div>
  );
  return (
    <motion.div initial={{ opacity:0,y:-8,scale:0.97 }} animate={{ opacity:1,y:0,scale:1 }}
      exit={{ opacity:0,y:-8,scale:0.97 }} transition={{ duration:0.18 }}
      style={{ position:'absolute',top:'100%',right:0,zIndex:50,marginTop:'6px',width:'240px',
        borderRadius:'14px',background:'var(--color-surface-2)',border:'1px solid var(--color-border)',
        boxShadow:'0 16px 48px rgba(0,0,0,0.3)',overflow:'hidden' }}>
      <div style={{ position:'absolute',inset:'0 0 auto 0',height:'1px',background:'linear-gradient(90deg,transparent,rgba(184,115,51,0.4),transparent)' }}/>
      <div style={{ padding:'14px 16px 10px',borderBottom:'1px solid var(--color-border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <span style={{ fontSize:'12px',fontWeight:600,color:'var(--color-warm-white)' }}>Durations</span>
        <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--color-text-3)',cursor:'pointer',display:'flex' }}><X size={13}/></button>
      </div>
      <div style={{ padding:'12px 16px',display:'flex',flexDirection:'column',gap:'12px' }}>
        <Field k="focus"       label="Focus"       min={5}  max={90} />
        <Field k="short_break" label="Short break" min={1}  max={30} />
        <Field k="long_break"  label="Long break"  min={5}  max={60} />
      </div>
      <div style={{ padding:'10px 16px 14px' }}>
        <button onClick={() => { onChange(local); onClose(); }}
          style={{ width:'100%',padding:'9px',borderRadius:'10px',fontSize:'12px',fontWeight:600,color:'white',background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dim))',border:'1px solid rgba(184,115,51,0.3)',cursor:'pointer' }}>
          Apply
        </button>
      </div>
    </motion.div>
  );
}

// ── Completion banner ─────────────────────────────────────────────────────────
function CompletionBanner({ mode, onStart, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 10000); return () => clearTimeout(t); }, []);
  const msgs = {
    focus: { emoji:'✦', text:'Focus complete!', sub:'Take a break?' },
    short_break: { emoji:'☕', text:'Break over.', sub:'Ready to focus?' },
    long_break:  { emoji:'🌿', text:'Long break done.', sub:'Back to work?' },
  };
  const m = msgs[mode] || msgs.focus;
  return (
    <motion.div initial={{ opacity:0,y:10,scale:0.96 }} animate={{ opacity:1,y:0,scale:1 }}
      exit={{ opacity:0,y:-6 }} transition={{ type:'spring',stiffness:380,damping:28 }}
      style={{ padding:'13px 15px',borderRadius:'14px',background:'var(--color-surface-2)',
        border:'1px solid var(--color-primary-border)',position:'relative',overflow:'hidden',marginBottom:'12px' }}>
      <div style={{ position:'absolute',inset:'0 0 auto 0',height:'1px',background:'linear-gradient(90deg,transparent,rgba(184,115,51,0.5),transparent)' }}/>
      <div style={{ display:'flex',alignItems:'center',gap:'10px' }}>
        <span style={{ fontSize:'18px',flexShrink:0 }}>{m.emoji}</span>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:'12px',fontWeight:600,color:'var(--color-warm-white)' }}>{m.text}</div>
          <div style={{ fontSize:'11px',color:'var(--color-text-3)' }}>{m.sub}</div>
        </div>
        <div style={{ display:'flex',gap:'6px',flexShrink:0 }}>
          <button onClick={onStart}
            style={{ display:'flex',alignItems:'center',gap:'4px',padding:'6px 11px',borderRadius:'8px',fontSize:'11px',fontWeight:600,color:'white',background:'linear-gradient(135deg,var(--color-primary),var(--color-primary-dim))',border:'1px solid rgba(184,115,51,0.3)',cursor:'pointer' }}>
            <Play size={10} fill="white"/> Start
          </button>
          <button onClick={onDismiss}
            style={{ width:'28px',height:'28px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-stone)',border:'1px solid var(--color-border)',color:'var(--color-text-3)',cursor:'pointer' }}>
            <X size={11}/>
          </button>
        </div>
      </div>
      <motion.div initial={{ scaleX:1 }} animate={{ scaleX:0 }} transition={{ duration:10, ease:'linear' }}
        style={{ position:'absolute',bottom:0,left:0,right:0,height:'2px',background:'var(--color-primary)',transformOrigin:'left' }}/>
    </motion.div>
  );
}

// ── Fullscreen — theme-aware ──────────────────────────────────────────────────
function Fullscreen({ mode, timeLeft, progress, running, color, glow, onToggle, onReset, onSkip, onClose, onAdjust, isLight }) {
  const size = Math.min(window.innerWidth*0.72, 340);
  const STROKE = 9;

  // Theme-aware fullscreen background
  const fsBg = isLight
    ? 'rgba(240,235,228,0.97)'
    : 'rgba(10,8,6,0.97)';
  const fsTimeColor = isLight ? '#1c1a17' : 'var(--color-warm-white)';

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{
        position:'fixed', inset:0, zIndex:9000,
        background: fsBg,
        backdropFilter:'blur(24px)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'32px',
      }}>
      <div style={{ position:'relative', width:`${size}px`, height:`${size}px`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ position:'absolute',inset:'12%',borderRadius:'50%',background:`radial-gradient(circle,${color}14 0%,transparent 70%)` }}/>
        <Ring progress={progress} color={color} glow={glow} size={size} stroke={STROKE} running={running} isLight={isLight}/>
        <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'6px' }}>
          <span style={{ fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.12em',color }}>{MODES[mode]?.label}</span>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:'68px',fontWeight:700,letterSpacing:'-0.05em',color: timeLeft===0 ? color : fsTimeColor,lineHeight:1 }}>{fmt(timeLeft)}</span>
          {running && <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1.8,repeat:Infinity }}
            style={{ width:'6px',height:'6px',borderRadius:'99px',background:color,boxShadow:`0 0 8px ${color}` }}/>}
        </div>
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:'16px' }}>
        {[
          { icon:<RotateCcw size={20}/>, action:onReset },
          null,
          { icon:<SkipForward size={20}/>, action:onSkip },
        ].map((btn, i) => btn ? (
          <motion.button key={i} whileTap={{ scale:0.93 }} onClick={btn.action}
            style={{ width:'52px',height:'52px',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
              color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.55)',cursor:'pointer' }}>
            {btn.icon}
          </motion.button>
        ) : (
          <motion.button key="play" whileTap={{ scale:0.94 }} onClick={onToggle}
            style={{ width:'80px',height:'80px',borderRadius:'24px',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${color},${color}cc)`,border:`1px solid ${color}55`,cursor:'pointer',boxShadow:running?`0 8px 28px ${glow}`:`0 4px 16px ${glow}`,position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,255,255,0.14) 0%,transparent 60%)',pointerEvents:'none' }}/>
            <AnimatePresence mode="wait">
              {running
                ? <motion.div key="p" initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.5,opacity:0 }}><Pause size={28} color="#fff" fill="#fff"/></motion.div>
                : <motion.div key="pl" initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.5,opacity:0 }}><Play size={28} color="#fff" fill="#fff" style={{ marginLeft:'3px' }}/></motion.div>
              }
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      {/* ── Time adjustment buttons ── */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{
          fontSize:'9px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em',
          color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)',
          marginRight:'2px',
        }}>Adjust</span>
        {[
          { label:'-10m', delta:-600 },
          { label:'-5m',  delta:-300 },
          { label:'+5m',  delta:+300 },
          { label:'+10m', delta:+600 },
        ].map(({ label, delta }) => {
          const isAdd = delta > 0;
          return (
            <motion.button key={label} whileTap={{ scale:0.85 }}
              onClick={() => onAdjust(delta)}
              style={{
                padding:'6px 13px', borderRadius:'10px', fontSize:'12px', fontWeight:700,
                cursor:'pointer', transition:'all 0.15s',
                background: isAdd
                  ? 'rgba(82,168,115,0.15)'
                  : 'rgba(248,113,113,0.12)',
                color: isAdd ? '#6fcf8a' : '#f87171',
                border: `1px solid ${isAdd ? 'rgba(82,168,115,0.3)' : 'rgba(248,113,113,0.25)'}`,
              }}>
              {label}
            </motion.button>
          );
        })}
      </div>

      <button onClick={onClose}
        style={{ position:'fixed',top:'20px',right:'20px',width:'40px',height:'40px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',
          background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
          border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)',
          color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)',
          cursor:'pointer' }}>
        <Minimize2 size={16}/>
      </button>
    </motion.div>
  );
}

// ── Habit picker ──────────────────────────────────────────────────────────────
function HabitPicker({ habits, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const avail = habits.filter(h => h.status !== 'archived' && h.status !== 'paused');
  const sel   = avail.find(h => h.id === selected);
  return (
    <div ref={ref} style={{ position:'relative',width:'100%' }}>
      <button onClick={() => setOpen(o=>!o)}
        style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',padding:'10px 13px',borderRadius:'11px',cursor:'pointer',background:open?'var(--color-surface-2)':'var(--color-stone)',border:`1px solid ${open?'var(--color-primary-border)':'var(--color-border)'}`,fontSize:'13px',fontFamily:'var(--font-sans)',transition:'all 0.15s',color:'var(--color-text-1)' }}>
        <span style={{ color:sel?'var(--color-text-1)':'var(--color-text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,textAlign:'left' }}>
          {sel ? sel.title : 'No habit — freestyle'}
        </span>
        <motion.div animate={{ rotate:open?180:0 }} transition={{ duration:0.18 }}>
          <ChevronDown size={12} style={{ color:'var(--color-text-3)',flexShrink:0 }}/>
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0,y:-6,scale:0.97 }} animate={{ opacity:1,y:0,scale:1 }}
            exit={{ opacity:0,y:-4,scale:0.97 }} transition={{ duration:0.14 }}
            style={{ position:'absolute',bottom:'calc(100% + 6px)',left:0,right:0,zIndex:40,borderRadius:'12px',background:'var(--color-surface-2)',border:'1px solid var(--color-border)',boxShadow:'0 -16px 40px rgba(0,0,0,0.15)',overflow:'hidden',maxHeight:'190px',overflowY:'auto' }}>
            <button onClick={() => { onSelect(null); setOpen(false); }}
              style={{ width:'100%',padding:'10px 14px',fontSize:'12px',textAlign:'left',cursor:'pointer',background:!selected?'rgba(184,115,51,0.06)':'transparent',color:!selected?'var(--color-primary)':'var(--color-text-3)',borderBottom:'1px solid var(--color-border)',border:'none',fontFamily:'var(--font-sans)' }}>
              No habit — freestyle
            </button>
            {avail.map((h,i) => (
              <button key={h.id} onClick={() => { onSelect(h.id); setOpen(false); }}
                style={{ width:'100%',padding:'10px 14px',fontSize:'12px',textAlign:'left',cursor:'pointer',background:selected===h.id?'rgba(184,115,51,0.08)':'transparent',color:'var(--color-text-2)',borderBottom:i<avail.length-1?'1px solid var(--color-border)':'none',border:'none',fontFamily:'var(--font-sans)',display:'flex',justifyContent:'space-between',alignItems:'center' }}
                onMouseEnter={e=>{ if(selected!==h.id) e.currentTarget.style.background='rgba(184,115,51,0.04)'; }}
                onMouseLeave={e=>{ if(selected!==h.id) e.currentTarget.style.background='transparent'; }}>
                <span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1 }}>{h.title}</span>
                {selected===h.id && <Check size={11} style={{ color:'var(--color-primary)',flexShrink:0 }}/>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Session item ──────────────────────────────────────────────────────────────
function SessionItem({ session, i }) {
  const c = { focus:'#b87333', short_break:'#52a873', long_break:'#6b9fd4' }[session.mode] || '#b87333';
  return (
    <motion.div initial={{ opacity:0,x:-8 }} animate={{ opacity:1,x:0 }} transition={{ delay:i*0.04 }}
      style={{ display:'flex',alignItems:'flex-start',gap:'10px',padding:'10px 13px',borderRadius:'12px',background:'var(--color-stone)',border:'1px solid var(--color-border)' }}>
      <div style={{ width:'28px',height:'28px',borderRadius:'8px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:`${c}18`,border:`1px solid ${c}30`,marginTop:'1px' }}>
        {session.mode==='focus' ? <BrainCircuit size={12} style={{ color:c }}/> : <Coffee size={12} style={{ color:c }}/>}
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:'12px',fontWeight:500,color:'var(--color-text-1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
          {session.habitTitle || (session.mode==='focus'?'Freestyle focus':session.mode==='short_break'?'Short break':'Long break')}
        </div>
        <div style={{ fontSize:'10px',color:'var(--color-text-3)',fontFamily:'var(--font-mono)',marginTop:'1px' }}>
          {session.duration}m · {session.time}
        </div>
        {session.note && (
          <div style={{ fontSize:'10px',color:'var(--color-text-3)',marginTop:'3px',fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
            "{session.note}"
          </div>
        )}
      </div>
      {session.mode==='focus' && <span style={{ fontSize:'10px',fontWeight:700,color:'var(--color-primary)',fontFamily:'var(--font-mono)',flexShrink:0 }}>+XP</span>}
    </motion.div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div style={{ background:'var(--color-stone)',borderRadius:'12px',padding:'12px 14px',border:'1px solid var(--color-border)',textAlign:'center' }}>
      <div style={{ fontFamily:'var(--font-mono)',fontSize:'20px',fontWeight:700,color:accent||'var(--color-warm-white)',letterSpacing:'-0.02em',lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:'9px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.07em',color:'var(--color-text-3)',marginTop:'4px' }}>{label}</div>
    </div>
  );
}

function Guide() {
  return (
    <>
      <div style={{ display:'flex',alignItems:'center',gap:'6px',marginBottom:'10px' }}>
        <BrainCircuit size={11} style={{ color:'var(--color-primary)' }}/>
        <span style={{ fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--color-text-3)' }}>Pomodoro</span>
      </div>
      {[['01','25 min deep work — no distractions'],['02','5 min short break — stand, breathe'],['03','After 4 sessions: 15 min long break']].map(([n,t]) => (
        <div key={n} style={{ display:'flex',gap:'10px',alignItems:'flex-start',marginBottom:'6px' }}>
          <span style={{ fontFamily:'var(--font-mono)',fontSize:'9px',color:'var(--color-primary)',opacity:0.7,flexShrink:0,paddingTop:'2px',width:'16px' }}>{n}</span>
          <span style={{ fontSize:'11px',color:'var(--color-text-3)',lineHeight:1.55 }}>{t}</span>
        </div>
      ))}
    </>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Timer() {
  const { habits, loadHabits } = useHabitStore();
  const { playTimerEnd } = useZenithSounds();

  const [durations, setDurations]       = useState(loadDurations);
  const persisted = loadState();
  const [mode,           setMode]        = useState(persisted?.mode           || 'focus');
  const [timeLeft,       setTimeLeft]    = useState(persisted?.timeLeft       ?? loadDurations().focus*60);
  const [running,        setRunning]     = useState(persisted?.running        || false);
  const [sessions,       setSessions]    = useState(persisted?.sessions       || []);
  const [selectedHabit,  setSelected]    = useState(persisted?.selectedHabit  || null);
  const [note,           setNote]        = useState('');
  const [logging,        setLogging]     = useState(false);
  const [showSettings,   setShowSettings]= useState(false);
  const [showFull,       setShowFull]    = useState(false);
  const [muted,          setMuted]       = useState(false);
  const [completion,     setCompletion]  = useState(null);

  // Ambient sound state
  const [ambientSound,   setAmbientSound]   = useState('off');
  const [ambientVolume,  setAmbientVolume]  = useState(0.4);

  // Detect light theme
  const [isLight, setIsLight] = useState(() =>
    document.documentElement.getAttribute('data-theme') === 'light'
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const timerRef   = useRef(null);
  const settRef    = useRef(null);
  const [ringSize, setRingSize] = useState(260);

  const m = MODES[mode];

  useEffect(() => { loadHabits(USER_ID); }, [loadHabits]);

  useEffect(() => {
    const u = () => setRingSize(window.innerWidth < 480 ? 210 : 260);
    u(); window.addEventListener('resize', u);
    return () => window.removeEventListener('resize', u);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(DUR_KEY, JSON.stringify(durations)); } catch (_) {}
  }, [durations]);

  useEffect(() => {
    saveState({ mode, timeLeft, running, sessions, selectedHabit });
  }, [mode, timeLeft, running, sessions, selectedHabit]);

  useEffect(() => {
    document.title = running ? `${fmt(timeLeft)} — ${m.label} · Slate` : 'Slate';
    return () => { document.title = 'Slate'; };
  }, [running, timeLeft, m.label]);

  useEffect(() => {
    if (!showSettings) return;
    const h = e => { if (settRef.current && !settRef.current.contains(e.target)) setShowSettings(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showSettings]);

  // Cleanup ambient on unmount
  useEffect(() => {
    return () => { ambientEngine.stop(); };
  }, []);

  const handleAmbientSelect = useCallback((soundId) => {
    setAmbientSound(soundId);
    ambientEngine.play(soundId);
  }, []);

  const handleAmbientVolume = useCallback((vol) => {
    setAmbientVolume(vol);
    ambientEngine.setVolume(vol);
  }, []);

  const focusSessions  = sessions.filter(s => s.mode==='focus');
  const totalFocusMin  = focusSessions.reduce((a,s)=>a+s.duration, 0);
  const uniqueHabits   = [...new Set(focusSessions.filter(s=>s.habitId).map(s=>s.habitId))].length;
  const progressVal    = 1 - timeLeft / (durations[mode]*60);

  const getNextMode = useCallback((cur) => {
    if (cur !== 'focus') return 'focus';
    return (focusSessions.length+1) % 4 === 0 ? 'long_break' : 'short_break';
  }, [focusSessions.length]);

  // Guard against React StrictMode double-invocation
  const completionGuard = useRef(false);

  const handleComplete = useCallback(async (completedMode) => {
    if (completionGuard.current) return;
    completionGuard.current = true;
    setTimeout(() => { completionGuard.current = false; }, 2000);

    const dur = durations[completedMode];
    if (!muted) playTimerEnd();
    if (Notification.permission === 'granted') {
      new Notification('Slate', {
        body: completedMode==='focus' ? `${dur}m focus complete!` : 'Break over.',
        icon: '/favicon.svg',
      });
    }
    const habitTitle = habits.find(h=>h.id===selectedHabit)?.title || null;
    const newSession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      mode: completedMode,
      duration: dur,
      habitId: completedMode==='focus' ? selectedHabit : null,
      habitTitle: completedMode==='focus' ? habitTitle : null,
      note: completedMode==='focus' ? note : '',
      time: new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
    };
    setSessions(prev => [newSession, ...prev]);
    if (completedMode==='focus') {
      setNote('');
      if (selectedHabit) {
        setLogging(true);
        try { await logPomodoroSession(selectedHabit, dur); toast(`✦ ${dur}m logged to "${habitTitle}"`, { duration:3000 }); }
        catch (_) { toast.error('Could not log session'); }
        finally { setLogging(false); }
      } else {
        toast(`✦ ${dur}m focus complete!`, { duration:2500 });
      }
    }
    setCompletion({ mode: completedMode, nextMode: getNextMode(completedMode) });
  }, [durations, muted, playTimerEnd, habits, selectedHabit, note, getNextMode]);

  useEffect(() => {
    if (!running) return;
    completionGuard.current = false; // reset for new session
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setRunning(false);
          handleComplete(mode);
          return 0;
        }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, mode, handleComplete]);

  const switchMode = m2 => {
    clearInterval(timerRef.current);
    setRunning(false); setMode(m2); setTimeLeft(durations[m2]*60); setCompletion(null);
  };
  const toggle = () => {
    if (timeLeft===0) { setTimeLeft(durations[mode]*60); return; }
    setRunning(r=>!r);
  };
  const reset = () => { clearInterval(timerRef.current); setRunning(false); setTimeLeft(durations[mode]*60); setCompletion(null); };
  const skip  = () => { const next=getNextMode(mode); switchMode(next); };
  const adjustTime = useCallback((deltaSecs) => {
    setTimeLeft(t => {
      const maxTime = durations[mode] * 60 * 2; // cap at 2× the set duration
      return Math.max(5, Math.min(maxTime, t + deltaSecs));
    });
  }, [durations, mode]);

  const STROKE = 8;

  // Theme-aware ring background gradient
  const ringBgGradient = isLight
    ? `radial-gradient(circle,${m.color}08 0%,transparent 70%)`
    : `radial-gradient(circle,${m.color}10 0%,transparent 70%)`;

  // Time display color
  const timeColor = isLight
    ? (timeLeft===0 ? m.color : '#1c1a17')
    : (timeLeft===0 ? m.color : 'var(--color-warm-white)');

  return (
    <>
      <AnimatePresence>
        {showFull && (
          <Fullscreen mode={mode} timeLeft={timeLeft} progress={progressVal}
            running={running} color={m.color} glow={m.glow}
            onToggle={toggle} onReset={reset} onSkip={skip}
            onClose={() => setShowFull(false)}
            onAdjust={adjustTime}
            isLight={isLight}/>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }}
        transition={{ duration:0.2, ease:[0.16,1,0.3,1] }} style={{ paddingBottom:'48px' }}>

        {/* Header */}
        <div style={{ marginBottom:'20px',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px' }}>
          <div>
            <motion.h1 className="text-display" initial={{ opacity:0,y:-6 }} animate={{ opacity:1,y:0 }}>Focus Timer</motion.h1>
            <p style={{ fontSize:'12px',color:'var(--color-text-3)',marginTop:'3px' }}>
              Persists through navigation · tab title shows countdown
            </p>
          </div>
          <div style={{ display:'flex',gap:'6px',flexShrink:0,marginTop:'4px',alignItems:'center' }}>

            {/* Notification bell */}
            <motion.button whileTap={{ scale:0.92 }} onClick={() => Notification.requestPermission()} title="Enable notifications"
              style={{ width:'32px',height:'32px',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',
                background:Notification.permission==='granted'?'rgba(82,168,115,0.12)':'var(--color-stone)',
                border:`1px solid ${Notification.permission==='granted'?'rgba(82,168,115,0.3)':'var(--color-border)'}`,
                color:Notification.permission==='granted'?'#52a873':'var(--color-text-3)',cursor:'pointer' }}>
              <Bell size={13}/>
            </motion.button>

            {/* Ambient sound picker — replaces old mute button */}
            <AmbientPicker
              current={ambientSound}
              onSelect={handleAmbientSelect}
              volume={ambientVolume}
              onVolumeChange={handleAmbientVolume}
            />

            {/* Mute completion chime */}
            <motion.button whileTap={{ scale:0.92 }} onClick={() => setMuted(m=>!m)}
              title={muted ? 'Unmute completion sound' : 'Mute completion sound'}
              style={{ width:'32px',height:'32px',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',
                background:'var(--color-stone)',border:'1px solid var(--color-border)',
                color:muted?'#f87171':'var(--color-text-3)',cursor:'pointer' }}>
              {muted ? <VolumeX size={13}/> : <Volume2 size={13}/>}
            </motion.button>

            {/* Settings */}
            <div ref={settRef} style={{ position:'relative' }}>
              <motion.button whileTap={{ scale:0.92 }} onClick={() => setShowSettings(o=>!o)}
                style={{ width:'32px',height:'32px',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',
                  background:showSettings?'rgba(184,115,51,0.12)':'var(--color-stone)',
                  border:`1px solid ${showSettings?'var(--color-primary-border)':'var(--color-border)'}`,
                  color:showSettings?'var(--color-primary)':'var(--color-text-3)',cursor:'pointer' }}>
                <Settings size={13}/>
              </motion.button>
              <AnimatePresence>
                {showSettings && (
                  <SettingsPanel durations={durations}
                    onChange={nd => { setDurations(nd); setTimeLeft(nd[mode]*60); setRunning(false); }}
                    onClose={() => setShowSettings(false)}/>
                )}
              </AnimatePresence>
            </div>

            {/* Fullscreen */}
            <motion.button whileTap={{ scale:0.92 }} onClick={() => setShowFull(true)}
              style={{ width:'32px',height:'32px',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',
                background:'var(--color-stone)',border:'1px solid var(--color-border)',
                color:'var(--color-text-3)',cursor:'pointer' }}>
              <Maximize2 size={13}/>
            </motion.button>
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display:'flex',gap:'5px',padding:'4px',background:'var(--color-stone)',borderRadius:'14px',border:'1px solid var(--color-border)',marginBottom:'24px' }}>
          {Object.entries(MODES).map(([key, mod]) => (
            <motion.button key={key} onClick={() => switchMode(key)} whileTap={{ scale:0.96 }}
              style={{
                flex:1, padding:'8px 8px', borderRadius:'10px', fontSize:'12px', fontWeight:600,
                cursor:'pointer', transition:'all 0.18s', textAlign:'center',
                whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                background: mode===key ? 'var(--color-surface-2)' : 'transparent',
                color: mode===key ? mod.color : 'var(--color-text-3)',
                border: mode===key ? `1px solid ${mod.color}44` : '1px solid transparent',
                boxShadow: mode===key
                  ? isLight
                    ? `0 2px 8px ${mod.color}20, 0 1px 0 rgba(255,255,255,0.8) inset`
                    : `0 2px 10px ${mod.color}20`
                  : 'none',
              }}>
              {mod.label}
            </motion.button>
          ))}
        </div>

        {/* Body */}
        <div style={{ display:'flex',gap:'24px',alignItems:'flex-start',flexWrap:'wrap' }}>

          {/* LEFT */}
          <div style={{ flex:'1 1 280px',display:'flex',flexDirection:'column',alignItems:'center',gap:'20px' }}>

            <AnimatePresence>
              {completion && (
                <div style={{ width:'100%' }}>
                  <CompletionBanner mode={completion.mode}
                    onStart={() => { setCompletion(null); switchMode(completion.nextMode); setTimeout(()=>setRunning(true),100); }}
                    onDismiss={() => setCompletion(null)}/>
                </div>
              )}
            </AnimatePresence>

            {/* Ring */}
            <div style={{ position:'relative',width:`${ringSize}px`,height:`${ringSize}px`,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <div style={{ position:'absolute',inset:'15%',borderRadius:'50%',background:ringBgGradient,transition:'background 0.5s',pointerEvents:'none' }}/>
              <Ring progress={progressVal} color={m.color} glow={m.glow} size={ringSize} stroke={STROKE} running={running} isLight={isLight}/>
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'5px',zIndex:1 }}>
                <div style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                  {mode==='focus' ? <BrainCircuit size={11} style={{ color:m.color }}/> : <Coffee size={11} style={{ color:m.color }}/>}
                  <span style={{ fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:m.color }}>{m.label}</span>
                </div>
                <motion.div
                  key={`${mode}-${Math.floor(timeLeft/60)}`}
                  initial={{ scale:1.04 }} animate={{ scale:1 }} transition={{ duration:0.14 }}
                  style={{
                    fontFamily:'var(--font-mono)',
                    fontSize:ringSize<230?'44px':'52px',
                    fontWeight:700,
                    letterSpacing:'-0.04em',
                    color: timeColor,
                    lineHeight:1,
                    textShadow:timeLeft===0?`0 0 30px ${m.color}70`:'none',
                    transition:'color 0.3s,text-shadow 0.3s',
                  }}>
                  {fmt(timeLeft)}
                </motion.div>
                <span style={{ fontSize:'10px',color:'var(--color-text-3)',fontFamily:'var(--font-mono)' }}>
                  {Math.round(progressVal*100)}%
                </span>
                {running && (
                  <motion.div animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:1.8,repeat:Infinity }}
                    style={{ width:'6px',height:'6px',borderRadius:'99px',background:m.color,boxShadow:`0 0 6px ${m.color}` }}/>
                )}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display:'flex',alignItems:'center',gap:'12px' }}>
              {[
                { icon:<RotateCcw size={16}/>, action:reset, title:'Reset' },
                null,
                { icon:<SkipForward size={16}/>, action:skip, title:'Skip' },
              ].map((btn, i) => btn ? (
                <motion.button key={i} whileTap={{ scale:0.9 }} onClick={btn.action} title={btn.title}
                  style={{ width:'46px',height:'46px',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',
                    background:'var(--color-stone)',border:'1px solid var(--color-border)',
                    color:'var(--color-text-3)',cursor:'pointer',transition:'all 0.15s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='var(--color-stone-light)'; e.currentTarget.style.color='var(--color-text-2)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='var(--color-stone)'; e.currentTarget.style.color='var(--color-text-3)'; }}>
                  {btn.icon}
                </motion.button>
              ) : (
                <motion.button key="play" whileTap={{ scale:0.94 }} onClick={toggle}
                  style={{ width:'76px',height:'76px',borderRadius:'24px',display:'flex',alignItems:'center',justifyContent:'center',
                    background:`linear-gradient(135deg,${m.color},${m.color}cc)`,
                    border:`1px solid ${m.color}55`,cursor:'pointer',
                    boxShadow:running?`0 8px 28px ${m.glow}`:`0 4px 16px ${m.glow}`,
                    position:'relative',overflow:'hidden',transition:'box-shadow 0.3s' }}>
                  <div style={{ position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(255,255,255,0.14) 0%,transparent 60%)',pointerEvents:'none' }}/>
                  <AnimatePresence mode="wait">
                    {running
                      ? <motion.div key="p" initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.5,opacity:0 }} transition={{ duration:0.12 }}><Pause size={28} color="#fff" fill="#fff"/></motion.div>
                      : <motion.div key="pl" initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.5,opacity:0 }} transition={{ duration:0.12 }}><Play size={28} color="#fff" fill="#fff" style={{ marginLeft:'3px' }}/></motion.div>
                    }
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>

            {/* Time adjustment buttons — normal screen */}
            <div style={{ display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',justifyContent:'center' }}>
              <span style={{ fontSize:'9px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--color-text-3)',marginRight:'2px' }}>Adjust</span>
              {[
                { label:'-10m', delta:-600 },
                { label:'-5m',  delta:-300 },
                { label:'+5m',  delta:+300 },
                { label:'+10m', delta:+600 },
              ].map(({ label, delta }) => {
                const isAdd = delta > 0;
                return (
                  <motion.button key={label} whileTap={{ scale:0.88 }}
                    onClick={() => adjustTime(delta)}
                    style={{
                      padding:'5px 11px', borderRadius:'9px', fontSize:'11px', fontWeight:700,
                      cursor:'pointer', transition:'all 0.15s',
                      background: isAdd ? 'rgba(82,168,115,0.12)' : 'rgba(248,113,113,0.10)',
                      color: isAdd ? '#6fcf8a' : '#f87171',
                      border: `1px solid ${isAdd ? 'rgba(82,168,115,0.28)' : 'rgba(248,113,113,0.22)'}`,
                    }}
                    onMouseEnter={e=>{ e.currentTarget.style.background = isAdd ? 'rgba(82,168,115,0.2)' : 'rgba(248,113,113,0.18)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background = isAdd ? 'rgba(82,168,115,0.12)' : 'rgba(248,113,113,0.10)'; }}>
                    {label}
                  </motion.button>
                );
              })}
            </div>

            {/* Dots */}
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',width:'100%' }}>
              <Dots count={focusSessions.length} color={m.color}/>
              <span style={{ fontSize:'10px',color:'var(--color-text-3)',textAlign:'center' }}>
                {focusSessions.length%4===0 && focusSessions.length>0 ? '🎉 Long break earned!' : `${4-(focusSessions.length%4)} until long break`}
              </span>
            </div>

            {/* Ambient sound indicator */}
            {ambientSound !== 'off' && (
              <motion.div initial={{ opacity:0,y:4 }} animate={{ opacity:1,y:0 }}
                style={{ display:'flex',alignItems:'center',gap:'8px',padding:'8px 14px',borderRadius:'10px',
                  background:'rgba(184,115,51,0.08)',border:'1px solid rgba(184,115,51,0.2)',width:'100%',
                  justifyContent:'space-between' }}>
                <div style={{ display:'flex',alignItems:'center',gap:'7px' }}>
                  <motion.div animate={{ opacity:[0.5,1,0.5] }} transition={{ duration:2,repeat:Infinity }}>
                    <Music size={11} style={{ color:'var(--color-primary)' }}/>
                  </motion.div>
                  <span style={{ fontSize:'11px',color:'var(--color-primary)',fontWeight:500 }}>
                    {AMBIENT_SOUNDS.find(s=>s.id===ambientSound)?.icon} {AMBIENT_SOUNDS.find(s=>s.id===ambientSound)?.label} playing
                  </span>
                </div>
                <button onClick={() => handleAmbientSelect('off')}
                  style={{ background:'none',border:'none',cursor:'pointer',color:'var(--color-text-3)',display:'flex',padding:'2px' }}>
                  <X size={11}/>
                </button>
              </motion.div>
            )}

            {/* Habit + note */}
            <div style={{ width:'100%',display:'flex',flexDirection:'column',gap:'8px' }}>
              <div style={{ fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--color-text-3)',display:'flex',alignItems:'center',gap:'5px' }}>
                <Zap size={10} style={{ color:'var(--color-primary)' }}/> Log to habit
              </div>
              <HabitPicker habits={habits} selected={selectedHabit} onSelect={setSelected}/>
              <div style={{ position:'relative' }}>
                <StickyNote size={12} style={{ position:'absolute',left:'12px',top:'50%',transform:'translateY(-50%)',color:'var(--color-text-3)',pointerEvents:'none' }}/>
                <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Session note…" maxLength={120}
                  style={{ width:'100%',background:'var(--color-stone)',border:'1px solid var(--color-border)',borderRadius:'10px',padding:'9px 12px 9px 32px',color:'var(--color-text-1)',fontSize:'12px',fontFamily:'var(--font-sans)',outline:'none',boxSizing:'border-box',transition:'border-color 0.15s' }}
                  onFocus={e=>e.target.style.borderColor='var(--color-primary-border)'}
                  onBlur={e=>e.target.style.borderColor='var(--color-border)'}/>
              </div>
              <AnimatePresence>
                {logging && (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                    style={{ display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',color:'var(--color-primary)' }}>
                    <Loader2 size={11} style={{ animation:'spin 1s linear infinite' }}/>Logging…
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Guide mobile */}
            <div className="md:hidden" style={{ width:'100%',padding:'14px',borderRadius:'14px',background:'var(--color-stone)',border:'1px solid var(--color-border)' }}>
              <Guide/>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex:'1 1 240px',minWidth:'220px',display:'flex',flexDirection:'column',gap:'14px' }}>
            <div>
              <div style={{ display:'flex',alignItems:'center',gap:'7px',marginBottom:'10px' }}>
                <Clock size={13} style={{ color:'var(--color-primary)' }}/>
                <span style={{ fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.09em',color:'var(--color-text-3)' }}>Sessions</span>
                {sessions.length>0 && (
                  <span style={{ fontFamily:'var(--font-mono)',fontSize:'10px',color:'var(--color-primary)',background:'rgba(184,115,51,0.1)',border:'1px solid rgba(184,115,51,0.2)',padding:'1px 7px',borderRadius:'99px' }}>
                    {sessions.length}
                  </span>
                )}
              </div>
              {sessions.length===0 ? (
                <div style={{ padding:'28px 20px',borderRadius:'14px',background:'var(--color-surface-2)',border:'1px solid var(--color-border)',textAlign:'center' }}>
                  <div style={{ width:'40px',height:'40px',borderRadius:'12px',background:'var(--color-stone)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px' }}>
                    <BrainCircuit size={18} style={{ color:'var(--color-text-3)' }}/>
                  </div>
                  <p style={{ fontSize:'12px',color:'var(--color-text-3)',margin:0,lineHeight:1.6 }}>Complete a session to see it here</p>
                </div>
              ) : (
                <div style={{ display:'flex',flexDirection:'column',gap:'6px' }}>
                  <AnimatePresence>
                    {sessions.slice(0,8).map((s,i)=><SessionItem key={`${s.id}-${i}`} session={s} i={i}/>)}
                  </AnimatePresence>
                  {sessions.length>8 && <p style={{ fontSize:'10px',color:'var(--color-text-3)',textAlign:'center',margin:0 }}>+{sessions.length-8} more</p>}
                </div>
              )}
            </div>

            {focusSessions.length>0 && (
              <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }}
                style={{ padding:'14px 16px',borderRadius:'14px',background:'var(--color-surface-2)',border:'1px solid var(--color-primary-border)',position:'relative',overflow:'hidden' }}>
                <div style={{ position:'absolute',inset:'0 0 auto 0',height:'1px',background:'linear-gradient(90deg,transparent,rgba(184,115,51,0.45),transparent)' }}/>
                <div style={{ fontSize:'10px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--color-text-3)',marginBottom:'12px' }}>Summary</div>
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px' }}>
                  <MiniStat label="Focus time"  value={`${totalFocusMin}m`} accent="var(--color-primary)"/>
                  <MiniStat label="Sessions"    value={focusSessions.length}/>
                  <MiniStat label="Habits hit"  value={uniqueHabits} accent="#52a873"/>
                  <MiniStat label="Cycles"      value={Math.floor(focusSessions.length/4)}/>
                </div>
              </motion.div>
            )}

            <div className="hidden md:block" style={{ padding:'14px',borderRadius:'14px',background:'var(--color-stone)',border:'1px solid var(--color-border)' }}>
              <Guide/>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}