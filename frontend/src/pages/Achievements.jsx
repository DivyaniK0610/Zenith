import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Flame, Zap, Star, Target, CheckCircle2, Clock,
  Share2, Download, X, Lock, Sparkles, Award, Shield,
  TrendingUp, Calendar, BarChart2, Instagram, Copy, Check,
  ChevronRight,
} from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import apiClient from '../api/client';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

// ─────────────────────────────────────────────────────────────────────────────
// Achievement Definitions
// ─────────────────────────────────────────────────────────────────────────────
export const ACHIEVEMENT_DEFS = [
  // Streaks
  {
    id: 'streak_3',
    title: 'First Streak',
    description: 'Maintain a 3-day streak',
    icon: Flame,
    color: '#e07830',
    bg: 'rgba(224,120,48,0.12)',
    border: 'rgba(224,120,48,0.3)',
    glow: 'rgba(224,120,48,0.4)',
    category: 'Streaks',
    xpReward: 25,
    check: (stats) => (stats?.current_streak || 0) >= 3 || (stats?.longest_streak || 0) >= 3,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: '7-day streak — one full week',
    icon: Flame,
    color: '#e07830',
    bg: 'rgba(224,120,48,0.12)',
    border: 'rgba(224,120,48,0.3)',
    glow: 'rgba(224,120,48,0.4)',
    category: 'Streaks',
    xpReward: 50,
    check: (stats) => (stats?.longest_streak || 0) >= 7,
  },
  {
    id: 'streak_30',
    title: 'Month of Mastery',
    description: '30-day streak — unstoppable',
    icon: Flame,
    color: '#ff6020',
    bg: 'rgba(255,96,32,0.12)',
    border: 'rgba(255,96,32,0.3)',
    glow: 'rgba(255,96,32,0.5)',
    category: 'Streaks',
    xpReward: 200,
    check: (stats) => (stats?.longest_streak || 0) >= 30,
  },
  {
    id: 'streak_100',
    title: 'Centurion',
    description: '100-day streak — legendary',
    icon: Shield,
    color: '#ffd700',
    bg: 'rgba(255,215,0,0.12)',
    border: 'rgba(255,215,0,0.3)',
    glow: 'rgba(255,215,0,0.5)',
    category: 'Streaks',
    xpReward: 1000,
    check: (stats) => (stats?.longest_streak || 0) >= 100,
  },
  // Levels
  {
    id: 'level_5',
    title: 'Rising',
    description: 'Reach Level 5',
    icon: Zap,
    color: '#b87333',
    bg: 'rgba(184,115,51,0.12)',
    border: 'rgba(184,115,51,0.3)',
    glow: 'rgba(184,115,51,0.4)',
    category: 'Levels',
    xpReward: 0,
    check: (stats) => (stats?.level || 1) >= 5,
  },
  {
    id: 'level_10',
    title: 'Dedicated',
    description: 'Reach Level 10',
    icon: Zap,
    color: '#c9a43a',
    bg: 'rgba(201,164,58,0.12)',
    border: 'rgba(201,164,58,0.3)',
    glow: 'rgba(201,164,58,0.4)',
    category: 'Levels',
    xpReward: 0,
    check: (stats) => (stats?.level || 1) >= 10,
  },
  {
    id: 'level_25',
    title: 'Veteran',
    description: 'Reach Level 25',
    icon: Star,
    color: '#e8c35a',
    bg: 'rgba(232,195,90,0.12)',
    border: 'rgba(232,195,90,0.3)',
    glow: 'rgba(232,195,90,0.5)',
    category: 'Levels',
    xpReward: 0,
    check: (stats) => (stats?.level || 1) >= 25,
  },
  // Habits
  {
    id: 'habits_1',
    title: 'First Step',
    description: 'Create your first habit',
    icon: Target,
    color: '#52a873',
    bg: 'rgba(82,168,115,0.12)',
    border: 'rgba(82,168,115,0.3)',
    glow: 'rgba(82,168,115,0.4)',
    category: 'Habits',
    xpReward: 10,
    check: (_stats, habits) => (habits?.length || 0) >= 1,
  },
  {
    id: 'habits_5',
    title: 'Habit Builder',
    description: 'Track 5 habits simultaneously',
    icon: CheckCircle2,
    color: '#52a873',
    bg: 'rgba(82,168,115,0.12)',
    border: 'rgba(82,168,115,0.3)',
    glow: 'rgba(82,168,115,0.4)',
    category: 'Habits',
    xpReward: 50,
    check: (_stats, habits) => (habits?.length || 0) >= 5,
  },
  {
    id: 'habits_10',
    title: 'System Builder',
    description: 'Build a system of 10 habits',
    icon: BarChart2,
    color: '#40a0c0',
    bg: 'rgba(64,160,192,0.12)',
    border: 'rgba(64,160,192,0.3)',
    glow: 'rgba(64,160,192,0.4)',
    category: 'Habits',
    xpReward: 100,
    check: (_stats, habits) => (habits?.length || 0) >= 10,
  },
  // XP
  {
    id: 'xp_100',
    title: 'Getting Started',
    description: 'Earn 100 XP total',
    icon: Award,
    color: '#b07030',
    bg: 'rgba(176,112,48,0.12)',
    border: 'rgba(176,112,48,0.3)',
    glow: 'rgba(176,112,48,0.4)',
    category: 'XP',
    xpReward: 0,
    check: (stats) => (stats?.xp || 0) >= 100,
  },
  {
    id: 'xp_500',
    title: 'On a Roll',
    description: 'Earn 500 XP total',
    icon: TrendingUp,
    color: '#b07030',
    bg: 'rgba(176,112,48,0.12)',
    border: 'rgba(176,112,48,0.3)',
    glow: 'rgba(176,112,48,0.4)',
    category: 'XP',
    xpReward: 0,
    check: (stats) => (stats?.xp || 0) >= 500,
  },
  {
    id: 'xp_1000',
    title: 'Power User',
    description: 'Earn 1,000 XP total',
    icon: Trophy,
    color: '#c9a43a',
    bg: 'rgba(201,164,58,0.12)',
    border: 'rgba(201,164,58,0.3)',
    glow: 'rgba(201,164,58,0.5)',
    category: 'XP',
    xpReward: 0,
    check: (stats) => (stats?.xp || 0) >= 1000,
  },
  // Special
  {
    id: 'perfect_week',
    title: 'Perfect Week',
    description: 'Complete all habits 7 days straight',
    icon: Calendar,
    color: '#7b6fd4',
    bg: 'rgba(123,111,212,0.12)',
    border: 'rgba(123,111,212,0.3)',
    glow: 'rgba(123,111,212,0.4)',
    category: 'Special',
    xpReward: 150,
    check: (stats) => (stats?.longest_streak || 0) >= 7,
  },
  {
    id: 'early_bird',
    title: 'Early Adopter',
    description: 'Be among the first to use Slate',
    icon: Sparkles,
    color: '#d4768a',
    bg: 'rgba(212,118,138,0.12)',
    border: 'rgba(212,118,138,0.3)',
    glow: 'rgba(212,118,138,0.4)',
    category: 'Special',
    xpReward: 50,
    check: () => true, // everyone who joins gets this
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SlateMark SVG
// ─────────────────────────────────────────────────────────────────────────────
function SlateMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <defs>
        <linearGradient id={`ach-bg-${size}`} x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1c1812" />
          <stop offset="100%" stopColor="#0c0a08" />
        </linearGradient>
        <linearGradient id={`ach-g1-${size}`} x1="5" y1="9" x2="25" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d4954a" />
          <stop offset="100%" stopColor="#a06828" />
        </linearGradient>
        <linearGradient id={`ach-g2-${size}`} x1="7" y1="15" x2="23" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#be7430" />
          <stop offset="100%" stopColor="#885018" />
        </linearGradient>
        <linearGradient id={`ach-g3-${size}`} x1="9" y1="21" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9a5c20" />
          <stop offset="100%" stopColor="#683c10" />
        </linearGradient>
      </defs>
      <rect width="30" height="30" rx="8" fill={`url(#ach-bg-${size})`} />
      <rect x="5" y="7" width="20" height="5" rx="2.5" fill={`url(#ach-g1-${size})`} />
      <rect x="5" y="7" width="20" height="1" rx="0.5" fill="white" opacity="0.14" />
      <rect x="7" y="14" width="16" height="4.5" rx="2.25" fill={`url(#ach-g2-${size})`} />
      <rect x="9" y="20.5" width="12" height="4" rx="2" fill={`url(#ach-g3-${size})`} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Share Card Generator (canvas-based for download/share)
// ─────────────────────────────────────────────────────────────────────────────
function generateShareCard(achievement, userStats) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // Instagram-friendly square
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, '#0c0a08');
    bgGrad.addColorStop(0.5, '#1a1510');
    bgGrad.addColorStop(1, '#0c0a08');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 1080; i += 60) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1080); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
    }

    // Glow orb center
    const glowGrad = ctx.createRadialGradient(540, 480, 0, 540, 480, 500);
    glowGrad.addColorStop(0, achievement.glow.replace('0.4', '0.18'));
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Top border accent line
    const topLineGrad = ctx.createLinearGradient(0, 0, 1080, 0);
    topLineGrad.addColorStop(0, 'transparent');
    topLineGrad.addColorStop(0.5, achievement.color);
    topLineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = topLineGrad;
    ctx.fillRect(0, 0, 1080, 3);

    // Badge circle
    const cx = 540, cy = 410;
    const r = 160;

    // Outer ring glow
    const ringGlow = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 40);
    ringGlow.addColorStop(0, achievement.glow.replace('0.4', '0.5'));
    ringGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = ringGlow;
    ctx.beginPath(); ctx.arc(cx, cy, r + 40, 0, Math.PI * 2); ctx.fill();

    // Badge background
    const badgeBg = ctx.createRadialGradient(cx - 30, cy - 30, 0, cx, cy, r);
    badgeBg.addColorStop(0, achievement.bg.replace('0.12', '0.5'));
    badgeBg.addColorStop(1, achievement.bg.replace('0.12', '0.15'));
    ctx.fillStyle = badgeBg;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

    // Badge border
    ctx.strokeStyle = achievement.border.replace('0.3', '0.7');
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

    // Draw emoji / icon placeholder — use text emoji
    ctx.font = '120px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Category emoji mapping
    const emojiMap = {
      Streaks: '🔥', Levels: '⚡', Habits: '✅', XP: '🏆', Special: '✨',
    };
    const emoji = emojiMap[achievement.category] || '🏆';
    ctx.fillText(emoji, cx, cy);

    // Achievement title
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0e8d8';
    ctx.fillText(achievement.title, 540, 640);

    // Description
    ctx.font = '36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = achievement.color;
    ctx.fillText(achievement.description, 540, 700);

    // Stats row
    const stats = [
      `Level ${userStats?.level || 1}`,
      `${userStats?.xp || 0} XP`,
      `${userStats?.longest_streak || 0}d streak`,
    ];
    const statY = 800;
    stats.forEach((stat, i) => {
      const x = 200 + i * 340;
      // Chip bg
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRect(ctx, x - 90, statY - 28, 180, 56, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      roundRect(ctx, x - 90, statY - 28, 180, 56, 12);
      ctx.stroke();
      // Stat text
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#e8dece';
      ctx.textAlign = 'center';
      ctx.fillText(stat, x, statY + 10);
    });

    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(100, 890, 880, 1);

    // Slate branding — bottom
    // Draw Slate slabs
    const slabX = 440, slabY = 930;
    const slabGrad1 = ctx.createLinearGradient(slabX, slabY, slabX + 60, slabY + 20);
    slabGrad1.addColorStop(0, '#d4954a');
    slabGrad1.addColorStop(1, '#a06828');

    // Slab 1
    ctx.fillStyle = slabGrad1;
    roundRect(ctx, slabX, slabY, 60, 14, 4);
    ctx.fill();
    // Slab 2
    const slabGrad2 = ctx.createLinearGradient(slabX + 6, slabY + 18, slabX + 54, slabY + 30);
    slabGrad2.addColorStop(0, '#be7430');
    slabGrad2.addColorStop(1, '#885018');
    ctx.fillStyle = slabGrad2;
    roundRect(ctx, slabX + 6, slabY + 18, 48, 12, 3);
    ctx.fill();
    // Slab 3
    const slabGrad3 = ctx.createLinearGradient(slabX + 12, slabY + 34, slabX + 48, slabY + 44);
    slabGrad3.addColorStop(0, '#9a5c20');
    slabGrad3.addColorStop(1, '#683c10');
    ctx.fillStyle = slabGrad3;
    roundRect(ctx, slabX + 12, slabY + 34, 36, 10, 3);
    ctx.fill();

    // Slate wordmark
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#e8dece';
    ctx.textAlign = 'left';
    ctx.fillText('Slate', slabX + 72, slabY + 36);

    ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.textAlign = 'center';
    ctx.fillText('slate-app.io', 540, 1040);

    resolve(canvas.toDataURL('image/png', 1.0));
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─────────────────────────────────────────────────────────────────────────────
// Share Modal
// ─────────────────────────────────────────────────────────────────────────────
function ShareModal({ achievement, userStats, onClose }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [generating, setGenerating] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    generateShareCard(achievement, userStats).then(url => {
      setImageUrl(url);
      setGenerating(false);
    });
  }, [achievement, userStats]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    setDownloading(true);
    const link = document.createElement('a');
    link.download = `slate-${achievement.id}-achievement.png`;
    link.href = imageUrl;
    link.click();
    setTimeout(() => setDownloading(false), 1000);
  };

  const handleNativeShare = async () => {
    if (!imageUrl) return;
    try {
      const blob = await fetch(imageUrl).then(r => r.blob());
      const file = new File([blob], `slate-${achievement.id}.png`, { type: 'image/png' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `I earned "${achievement.title}" on Slate!`,
          text: `${achievement.description} 🏆 Track habits, build streaks, level up.`,
          files: [file],
        });
      } else {
        handleDownload();
      }
    } catch (_) {
      handleDownload();
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(
      `Just earned "${achievement.title}" on Slate! ${achievement.description} 🏆 #SlateApp #HabitTracking`
    ).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
      />
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 10 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          style={{ width: '100%', maxWidth: '400px', margin: 'auto' }}
        >
          <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', boxShadow: '0 32px 80px rgba(0,0,0,0.7)', position: 'relative' }}>
            {/* Top shimmer */}
            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${achievement.color}80, transparent)` }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-warm-white)', letterSpacing: '-0.02em' }}>Share Achievement</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-3)', marginTop: '2px' }}>Download or share to Instagram</div>
              </div>
              <button onClick={onClose}
                style={{ width: '30px', height: '30px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-stone)', border: '1px solid var(--color-border)', color: 'var(--color-text-3)', cursor: 'pointer' }}>
                <X size={13} />
              </button>
            </div>

            {/* Preview */}
            <div style={{ padding: '0 20px 14px' }}>
              <div style={{ borderRadius: '14px', overflow: 'hidden', background: 'var(--color-stone)', border: '1px solid var(--color-border)', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {generating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Sparkles size={24} style={{ color: achievement.color }} />
                    </motion.div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-3)' }}>Generating card…</span>
                  </div>
                ) : (
                  <img src={imageUrl} alt="Achievement card" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Primary: Share (native) */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleNativeShare} disabled={generating}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: 'white', background: generating ? 'var(--color-stone)' : `linear-gradient(135deg, ${achievement.color}, ${achievement.color}cc)`, border: `1px solid ${achievement.border}`, cursor: generating ? 'default' : 'pointer', boxShadow: generating ? 'none' : `0 4px 20px ${achievement.glow}`, transition: 'all 0.2s' }}>
                <Instagram size={15} />
                Share to Instagram
              </motion.button>

              {/* Secondary row */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleDownload} disabled={generating}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '11px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-1)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: generating ? 'default' : 'pointer', opacity: downloading ? 0.7 : 1 }}>
                  <Download size={13} />
                  {downloading ? 'Saving…' : 'Save'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleCopyText}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '11px', fontSize: '12px', fontWeight: 600, color: copied ? '#6fcf8a' : 'var(--color-text-1)', background: copied ? 'rgba(82,168,115,0.1)' : 'var(--color-stone)', border: `1px solid ${copied ? 'rgba(82,168,115,0.3)' : 'var(--color-border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy text'}
                </motion.button>
              </div>

              <p style={{ fontSize: '10px', color: 'var(--color-text-3)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                1080×1080 PNG — optimized for Instagram, Stories & Twitter
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievement Unlock Overlay (shown when newly earned)
// ─────────────────────────────────────────────────────────────────────────────
export function AchievementUnlockOverlay({ achievement, onClose, onShare, userStats }) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  if (!achievement) return null;

  const Icon = achievement.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(20px)' }}
      />

      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', width: '100%', maxWidth: '340px' }}
      >
        <div style={{ borderRadius: '28px', overflow: 'hidden', background: 'var(--color-surface)', border: '1px solid rgba(58,52,46,0.8)', boxShadow: `0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px ${achievement.border}`, position: 'relative' }}>
          {/* Top accent */}
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${achievement.color}, transparent)` }} />

          {/* Glow bg */}
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 30%, ${achievement.glow.replace('0.4', '0.08')} 0%, transparent 65%)`, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', padding: '36px 28px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* UNLOCKED label */}
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px' }}
            >
              <div style={{ height: '1px', width: '28px', background: `linear-gradient(to right, transparent, ${achievement.color})` }} />
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: achievement.color }}>
                Achievement Unlocked
              </span>
              <div style={{ height: '1px', width: '28px', background: `linear-gradient(to left, transparent, ${achievement.color})` }} />
            </motion.div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
              style={{ position: 'relative', marginBottom: '20px' }}
            >
              <div style={{ width: '96px', height: '96px', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: achievement.bg, border: `2px solid ${achievement.border}`, boxShadow: `0 0 0 8px ${achievement.glow.replace('0.4', '0.08')}, 0 16px 48px ${achievement.glow}` }}>
                <Icon size={44} style={{ color: achievement.color }} />
              </div>
              {/* Ring pulse */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', inset: '-12px', borderRadius: '40px', border: `1.5px solid ${achievement.border}` }}
              />
            </motion.div>

            {/* Category chip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', background: achievement.bg, border: `1px solid ${achievement.border}`, marginBottom: '10px' }}
            >
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: achievement.color }}>{achievement.category}</span>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-warm-white)', letterSpacing: '-0.03em', margin: '0 0 6px' }}
            >
              {achievement.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ fontSize: '13px', color: 'var(--color-text-2)', margin: '0 0 20px', lineHeight: 1.55 }}
            >
              {achievement.description}
            </motion.p>

            {/* XP reward */}
            {achievement.xpReward > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55, type: 'spring' }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '99px', background: 'rgba(184,115,51,0.1)', border: '1px solid rgba(184,115,51,0.25)', marginBottom: '20px' }}
              >
                <Star size={12} style={{ color: '#c9a43a' }} fill="#c9a43a" />
                <span style={{ fontWeight: 700, color: '#c9a43a', fontSize: '12px' }}>+{achievement.xpReward} bonus XP</span>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
              style={{ display: 'flex', gap: '8px', width: '100%' }}
            >
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => { onShare(achievement); onClose(); }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '11px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, color: 'white', background: `linear-gradient(135deg, ${achievement.color}, ${achievement.color}bb)`, border: `1px solid ${achievement.border}`, cursor: 'pointer', boxShadow: `0 4px 20px ${achievement.glow}` }}
              >
                <Share2 size={13} />
                Share
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={onClose}
                style={{ flex: 1, padding: '11px 16px', borderRadius: '14px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-2)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
              >
                Continue →
              </motion.button>
            </motion.div>
          </div>

          {/* Progress bar auto-dismiss */}
          <motion.div
            initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
            transition={{ duration: 8, ease: 'linear' }}
            style={{ height: '2px', background: `linear-gradient(to right, transparent, ${achievement.color})`, transformOrigin: 'left' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievement Card
// ─────────────────────────────────────────────────────────────────────────────
function AchievementCard({ def, earned, earnedAt, onShare, delay = 0 }) {
  const Icon = def.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: earned ? 1 : 0.45, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: '18px', overflow: 'hidden',
        background: earned ? 'var(--color-surface-2)' : 'var(--color-stone)',
        border: `1px solid ${earned ? def.border : 'var(--color-border)'}`,
        boxShadow: earned && hovered ? `0 8px 32px ${def.glow.replace('0.4', '0.2')}` : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        cursor: earned ? 'default' : 'default',
        filter: earned ? 'none' : 'grayscale(0.5)',
      }}
    >
      {/* Earned shimmer */}
      {earned && (
        <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${def.color}60, transparent)` }} />
      )}

      {/* Left accent */}
      {earned && (
        <div style={{ position: 'absolute', left: 0, top: '12px', bottom: '12px', width: '3px', borderRadius: '0 3px 3px 0', background: `linear-gradient(to bottom, ${def.color}, ${def.color}50)`, boxShadow: `0 0 8px ${def.glow}` }} />
      )}

      <div style={{ padding: '16px 16px 16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Icon badge */}
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: earned ? def.bg : 'var(--color-stone-mid)', border: `1px solid ${earned ? def.border : 'var(--color-stone-light)'}`, boxShadow: earned ? `0 4px 16px ${def.glow.replace('0.4', '0.25')}` : 'none', position: 'relative' }}>
          <Icon size={24} style={{ color: earned ? def.color : 'var(--color-text-3)' }} />
          {!earned && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
              <Lock size={14} style={{ color: 'var(--color-text-3)' }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: earned ? 'var(--color-warm-white)' : 'var(--color-text-3)', letterSpacing: '-0.01em' }}>
              {def.title}
            </span>
            {earned && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '99px', background: def.bg, border: `1px solid ${def.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={9} style={{ color: def.color }} strokeWidth={3} />
                </div>
              </motion.div>
            )}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-3)', margin: '0 0 5px', lineHeight: 1.5 }}>
            {def.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {def.xpReward > 0 && (
              <span style={{ fontSize: '10px', fontWeight: 600, color: earned ? '#c9a43a' : 'var(--color-text-3)', background: earned ? 'rgba(201,164,58,0.1)' : 'transparent', border: earned ? '1px solid rgba(201,164,58,0.2)' : '1px solid transparent', padding: '1px 6px', borderRadius: '5px' }}>
                +{def.xpReward} XP
              </span>
            )}
            {earned && earnedAt && (
              <span style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>
                {new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {!earned && (
              <span style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>Locked</span>
            )}
          </div>
        </div>

        {/* Share button */}
        {earned && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: hovered ? 1 : 0.5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onShare(def)}
            style={{ width: '34px', height: '34px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: def.bg, border: `1px solid ${def.border}`, color: def.color, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <Share2 size={14} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Category filter pill
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Streaks', 'Levels', 'Habits', 'XP', 'Special'];

// ─────────────────────────────────────────────────────────────────────────────
// Main Achievements Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Achievements() {
  const { userStats, habits } = useHabitStore();
  const [earnedIds, setEarnedIds] = useState(new Set());
  const [earnedDates, setEarnedDates] = useState({});
  const [shareTarget, setShareTarget] = useState(null);
  const [filter, setFilter] = useState('All');
  const [showOnlyEarned, setShowOnlyEarned] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState(null);

  // Compute which achievements are earned
  useEffect(() => {
    if (!userStats) return;

    const newEarned = new Set();
    ACHIEVEMENT_DEFS.forEach(def => {
      if (def.check(userStats, habits)) {
        newEarned.add(def.id);
      }
    });

    // Check for newly unlocked (not in previous set)
    newEarned.forEach(id => {
      if (!earnedIds.has(id)) {
        const def = ACHIEVEMENT_DEFS.find(d => d.id === id);
        if (def && earnedIds.size > 0) { // don't show on first load
          setNewlyUnlocked(def);
        }
      }
    });

    setEarnedIds(newEarned);

    // Load earned dates from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('slate_achievement_dates') || '{}');
      const updated = { ...saved };
      newEarned.forEach(id => {
        if (!updated[id]) updated[id] = new Date().toISOString();
      });
      localStorage.setItem('slate_achievement_dates', JSON.stringify(updated));
      setEarnedDates(updated);
    } catch (_) {}
  }, [userStats, habits]);

  const filteredDefs = ACHIEVEMENT_DEFS.filter(def => {
    if (showOnlyEarned && !earnedIds.has(def.id)) return false;
    if (filter !== 'All' && def.category !== filter) return false;
    return true;
  });

  const earnedCount = earnedIds.size;
  const totalCount = ACHIEVEMENT_DEFS.length;
  const progress = Math.round((earnedCount / totalCount) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ paddingBottom: '48px' }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <motion.h1 className="text-display" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          Achievements
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}
          style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px' }}>
          {earnedCount} of {totalCount} unlocked · share your wins to Instagram
        </motion.p>
      </div>

      {/* Progress card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{ borderRadius: '20px', padding: '18px 20px', marginBottom: '20px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', overflow: 'hidden', position: 'relative' }}
      >
        <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.4), transparent)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '100%', background: 'radial-gradient(ellipse at 100% 50%, rgba(201,164,58,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
          {/* Ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="68" height="68" viewBox="0 0 68 68">
              <circle cx="34" cy="34" r="26" fill="none" stroke="var(--color-stone)" strokeWidth="5" />
              <motion.circle cx="34" cy="34" r="26" fill="none"
                stroke="var(--color-primary)" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 26}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - progress / 100) }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                transform="rotate(-90 34 34)"
                style={{ filter: 'drop-shadow(0 0 4px rgba(184,115,51,0.4))' }}
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--color-warm-white)', lineHeight: 1 }}>{progress}%</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-2)' }}>Overall Progress</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{earnedCount}/{totalCount}</span>
            </div>
            <div style={{ height: '5px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary), #d4954a)', boxShadow: '0 0 8px rgba(184,115,51,0.35)' }} />
            </div>
            {/* Category breakdown */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {CATEGORIES.filter(c => c !== 'All').map(cat => {
                const catDefs = ACHIEVEMENT_DEFS.filter(d => d.category === cat);
                const catEarned = catDefs.filter(d => earnedIds.has(d.id)).length;
                return (
                  <span key={cat} style={{ fontSize: '9px', fontWeight: 600, color: 'var(--color-text-3)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', padding: '2px 7px', borderRadius: '5px' }}>
                    {cat} {catEarned}/{catDefs.length}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Category pills */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: filter === cat ? 'rgba(184,115,51,0.15)' : 'var(--color-stone)', color: filter === cat ? 'var(--color-primary)' : 'var(--color-text-3)', border: `1px solid ${filter === cat ? 'rgba(184,115,51,0.35)' : 'var(--color-border)'}` }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Earned toggle */}
        <button onClick={() => setShowOnlyEarned(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: showOnlyEarned ? 'rgba(82,168,115,0.12)' : 'var(--color-stone)', color: showOnlyEarned ? '#6fcf8a' : 'var(--color-text-3)', border: `1px solid ${showOnlyEarned ? 'rgba(82,168,115,0.3)' : 'var(--color-border)'}`, whiteSpace: 'nowrap' }}>
          <Trophy size={10} />
          Earned only
        </button>
      </div>

      {/* Achievement grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AnimatePresence mode="popLayout">
          {filteredDefs.map((def, i) => (
            <AchievementCard
              key={def.id}
              def={def}
              earned={earnedIds.has(def.id)}
              earnedAt={earnedDates[def.id]}
              onShare={setShareTarget}
              delay={i * 0.04}
            />
          ))}
        </AnimatePresence>

        {filteredDefs.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Trophy size={32} style={{ color: 'var(--color-text-3)', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13px', color: 'var(--color-text-3)', margin: 0 }}>
              {showOnlyEarned ? 'No earned achievements in this category yet.' : 'No achievements found.'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {shareTarget && (
          <ShareModal
            achievement={shareTarget}
            userStats={userStats}
            onClose={() => setShareTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* New unlock overlay */}
      <AnimatePresence>
        {newlyUnlocked && (
          <AchievementUnlockOverlay
            achievement={newlyUnlocked}
            userStats={userStats}
            onClose={() => setNewlyUnlocked(null)}
            onShare={def => { setNewlyUnlocked(null); setShareTarget(def); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}