import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Flame, Zap, Star, Target, CheckCircle2,
  Share2, X, Lock, Sparkles, Award, Shield,
  TrendingUp, Calendar, BarChart2, Copy, Check,
  RefreshCw,
} from 'lucide-react';
import { useHabitStore } from '../store/habitStore';
import { useZenithSounds } from '../hooks/useSound';
import apiClient from '../api/client';

const USER_ID = '741601ad-1b7c-477e-8be0-c76363f6ebda';

// ─────────────────────────────────────────────────────────────────────────────
// Achievement Definitions
// ─────────────────────────────────────────────────────────────────────────────
export const ACHIEVEMENT_DEFS = [
  // ── Streaks ────────────────────────────────────────────────────────────────
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
  // ── Levels ─────────────────────────────────────────────────────────────────
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
  // ── Habits ─────────────────────────────────────────────────────────────────
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
  // ── XP ─────────────────────────────────────────────────────────────────────
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
  // ── Special ────────────────────────────────────────────────────────────────
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
    check: () => true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────
async function fetchEarnedFromDB(userId) {
  const res = await apiClient.get(`/api/v1/achievements/${userId}`);
  return res.data?.data || [];
}

async function unlockInDB(userId, achievementId) {
  await apiClient.post('/api/v1/achievements/unlock', {
    user_id: userId,
    achievement_id: achievementId,
  });
}

async function syncAllToDB(userId, achievementIds) {
  if (!achievementIds.length) return;
  await apiClient.post('/api/v1/achievements/sync', {
    user_id: userId,
    achievement_ids: achievementIds,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas share-card generator
// ─────────────────────────────────────────────────────────────────────────────
function roundRectPath(ctx, x, y, w, h, r) {
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

export function generateShareCard(achievement, userStats) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // Instagram Story: 1080 x 1920 (9:16)
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // ── Background ──────────────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0,   '#0a0804');
    bgGrad.addColorStop(0.4, '#130f09');
    bgGrad.addColorStop(1,   '#0c0a08');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // ── Subtle grid texture ──────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 1080; i += 54) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1920); ctx.stroke();
    }
    for (let i = 0; i <= 1920; i += 54) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1080, i); ctx.stroke();
    }

    // ── Diagonal grain lines (like brushed metal) ────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.015;
    ctx.strokeStyle = '#d4954a';
    ctx.lineWidth = 1;
    for (let i = -1920; i < 1920; i += 18) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 1920, 1920);
      ctx.stroke();
    }
    ctx.restore();

    // ── Big radial glow centered on icon area ────────────────────────────
    const cx = 540, cy = 820;
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 680);
    const glowColor = achievement.glow || 'rgba(184,115,51,0.4)';
    glowGrad.addColorStop(0,   glowColor.replace(/[\d.]+\)$/, '0.22)'));
    glowGrad.addColorStop(0.5, glowColor.replace(/[\d.]+\)$/, '0.08)'));
    glowGrad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // ── Top accent line ──────────────────────────────────────────────────
    const topLine = ctx.createLinearGradient(0, 0, 1080, 0);
    topLine.addColorStop(0,   'rgba(0,0,0,0)');
    topLine.addColorStop(0.3, achievement.color || '#b07030');
    topLine.addColorStop(0.7, achievement.color || '#b07030');
    topLine.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = topLine;
    ctx.fillRect(0, 0, 1080, 4);

    // ── Bottom accent line ───────────────────────────────────────────────
    ctx.fillStyle = topLine;
    ctx.fillRect(0, 1916, 1080, 4);

    // ── Decorative corner brackets (top-left, top-right) ────────────────
    const bracketColor = (achievement.color || '#b07030') + '60';
    const bSize = 60, bStroke = 2, bPad = 40;
    ctx.strokeStyle = bracketColor;
    ctx.lineWidth = bStroke;
    // Top-left
    ctx.beginPath(); ctx.moveTo(bPad + bSize, bPad); ctx.lineTo(bPad, bPad); ctx.lineTo(bPad, bPad + bSize); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(1080 - bPad - bSize, bPad); ctx.lineTo(1080 - bPad, bPad); ctx.lineTo(1080 - bPad, bPad + bSize); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(bPad + bSize, 1920 - bPad); ctx.lineTo(bPad, 1920 - bPad); ctx.lineTo(bPad, 1920 - bPad - bSize); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(1080 - bPad - bSize, 1920 - bPad); ctx.lineTo(1080 - bPad, 1920 - bPad); ctx.lineTo(1080 - bPad, 1920 - bPad - bSize); ctx.stroke();

    // ── "ACHIEVEMENT UNLOCKED" header label ──────────────────────────────
    ctx.textAlign = 'center';
    // Decorative lines flanking label
    ctx.strokeStyle = (achievement.color || '#b07030') + '55';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(120, 200); ctx.lineTo(390, 200); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(690, 200); ctx.lineTo(960, 200); ctx.stroke();

    ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillStyle = achievement.color || '#b07030';
    ctx.letterSpacing = '6px';
    ctx.fillText('ACHIEVEMENT UNLOCKED', 540, 208);

    // ── Category pill ────────────────────────────────────────────────────
    const catText = (achievement.category || 'Special').toUpperCase();
    ctx.font = '600 20px -apple-system, BlinkMacSystemFont, sans-serif';
    const catWidth = ctx.measureText(catText).width + 40;
    roundRectPath(ctx, 540 - catWidth/2, 240, catWidth, 44, 22);
    ctx.fillStyle = (achievement.bg || 'rgba(184,115,51,0.12)').replace(/[\d.]+\)$/, '0.18)');
    ctx.fill();
    ctx.strokeStyle = (achievement.border || 'rgba(184,115,51,0.3)');
    ctx.lineWidth = 1.5;
    roundRectPath(ctx, 540 - catWidth/2, 240, catWidth, 44, 22);
    ctx.stroke();
    ctx.fillStyle = achievement.color || '#b07030';
    ctx.fillText(catText, 540, 270);

    // ── Large icon badge ─────────────────────────────────────────────────
    const iconR = 200;
    // Outer glow ring (multiple passes for soft effect)
    for (let gPass = 3; gPass > 0; gPass--) {
      ctx.beginPath();
      ctx.arc(cx, cy, iconR + gPass * 18, 0, Math.PI * 2);
      ctx.strokeStyle = (achievement.glow || 'rgba(184,115,51,0.4)').replace(/[\d.]+\)$/, `${0.06 * gPass})`);
      ctx.lineWidth = 12;
      ctx.stroke();
    }

    // Badge background (radial gradient inside circle)
    const badgeBg = ctx.createRadialGradient(cx - 50, cy - 50, 0, cx, cy, iconR);
    const bg = achievement.bg || 'rgba(184,115,51,0.12)';
    badgeBg.addColorStop(0, bg.replace(/[\d.]+\)$/, '0.55)'));
    badgeBg.addColorStop(1, bg.replace(/[\d.]+\)$/, '0.18)'));
    ctx.beginPath();
    ctx.arc(cx, cy, iconR, 0, Math.PI * 2);
    ctx.fillStyle = badgeBg;
    ctx.fill();

    // Badge border
    ctx.beginPath();
    ctx.arc(cx, cy, iconR, 0, Math.PI * 2);
    ctx.strokeStyle = (achievement.border || 'rgba(184,115,51,0.3)').replace(/[\d.]+\)$/, '0.85)');
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner ring (decorative)
    ctx.beginPath();
    ctx.arc(cx, cy, iconR - 16, 0, Math.PI * 2);
    ctx.strokeStyle = (achievement.border || 'rgba(184,115,51,0.3)').replace(/[\d.]+\)$/, '0.3)');
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Category emoji (large, centered) ─────────────────────────────────
    const emojiMap = {
      Streaks: '🔥', Levels: '⚡', Habits: '✅', XP: '🏆', Special: '✨'
    };
    ctx.font = '160px serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojiMap[achievement.category] || '🏆', cx, cy);
    ctx.textBaseline = 'alphabetic';

    // ── Achievement Title ─────────────────────────────────────────────────
    ctx.font = '800 88px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0e8d8';
    ctx.fillText(achievement.title || 'Achievement', 540, 1115);

    // ── Description ───────────────────────────────────────────────────────
    ctx.font = '400 40px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = achievement.color || '#b07030';
    ctx.fillText(achievement.description || '', 540, 1180);

    // ── Thin separator ────────────────────────────────────────────────────
    const sepGrad = ctx.createLinearGradient(100, 0, 980, 0);
    sepGrad.addColorStop(0,   'rgba(255,255,255,0)');
    sepGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    sepGrad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = sepGrad;
    ctx.fillRect(100, 1230, 880, 1);

    // ── Stats row (3 cards) ───────────────────────────────────────────────
    const statsData = [
      { val: `Level ${userStats?.level || 1}`, label: 'LEVEL', icon: '⚡' },
      { val: `${userStats?.xp || 0}`,          label: 'TOTAL XP', icon: '✦' },
      { val: `${userStats?.longest_streak || 0}d`, label: 'BEST STREAK', icon: '🔥' },
    ];
    const cardW = 280, cardH = 130, cardGap = 20;
    const totalCardsW = statsData.length * cardW + (statsData.length - 1) * cardGap;
    const cardsStartX = (1080 - totalCardsW) / 2;
    const cardsY = 1270;

    statsData.forEach((stat, i) => {
      const x = cardsStartX + i * (cardW + cardGap);

      // Card background
      roundRectPath(ctx, x, cardsY, cardW, cardH, 18);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      roundRectPath(ctx, x, cardsY, cardW, cardH, 18);
      ctx.stroke();

      // Icon
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.fillText(stat.icon, x + cardW/2, cardsY + 42);

      // Value
      ctx.font = '700 36px "DM Mono", "Fira Code", monospace';
      ctx.fillStyle = '#f0e8d8';
      ctx.fillText(stat.val, x + cardW/2, cardsY + 84);

      // Label
      ctx.font = '600 18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.letterSpacing = '2px';
      ctx.fillText(stat.label, x + cardW/2, cardsY + 114);
      ctx.letterSpacing = '0px';
    });

    // ── XP bonus badge (if applicable) ───────────────────────────────────
    if (achievement.xpReward && achievement.xpReward > 0) {
      const bonusY = 1440;
      const bonusText = `+${achievement.xpReward} BONUS XP`;
      ctx.font = '700 28px -apple-system, BlinkMacSystemFont, sans-serif';
      const bonusW = ctx.measureText(bonusText).width + 60;
      roundRectPath(ctx, 540 - bonusW/2, bonusY, bonusW, 56, 28);
      ctx.fillStyle = 'rgba(201,164,58,0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(201,164,58,0.4)';
      ctx.lineWidth = 1.5;
      roundRectPath(ctx, 540 - bonusW/2, bonusY, bonusW, 56, 28);
      ctx.stroke();
      ctx.fillStyle = '#c9a43a';
      ctx.textAlign = 'center';
      ctx.fillText(`★ ${bonusText}`, 540, bonusY + 36);
    }

    // ── Motivational quote ────────────────────────────────────────────────
    const quoteY = achievement.xpReward > 0 ? 1540 : 1480;
    ctx.font = 'italic 32px Georgia, "Times New Roman", serif';
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.textAlign = 'center';
    const quotes = {
      Streaks: '"Consistency is the only cheat code."',
      Levels:  '"The grind is paying off."',
      Habits:  '"Small wins compound into big results."',
      XP:      '"Every rep counts."',
      Special: '"Built different."',
    };
    ctx.fillText(quotes[achievement.category] || '"Keep building."', 540, quoteY);

    // ── Branding section ──────────────────────────────────────────────────
    // Separator
    ctx.fillStyle = sepGrad;
    ctx.fillRect(100, quoteY + 50, 880, 1);

    // Slate logo slabs (centered)
    const slabX = 540 - 85, slabY = quoteY + 80;
    const slabs = [
      { x: slabX,      y: slabY,      w: 68, h: 16, r: 5, c0: '#d4954a', c1: '#a06828' },
      { x: slabX + 7,  y: slabY + 20, w: 54, h: 13, r: 4, c0: '#be7430', c1: '#885018' },
      { x: slabX + 14, y: slabY + 37, w: 40, h: 11, r: 3, c0: '#9a5c20', c1: '#683c10' },
    ];
    slabs.forEach(({ x, y, w, h, r, c0, c1 }) => {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g;
      roundRectPath(ctx, x, y, w, h, r);
      ctx.fill();
    });

    // "Slate" wordmark
    ctx.font = '700 44px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillStyle = '#e8dece';
    ctx.textAlign = 'left';
    ctx.fillText('Slate', slabX + 82, slabY + 40);

    // URL
    ctx.font = '400 28px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.textAlign = 'center';
    ctx.fillText('slate-app.io  ·  Build habits. Earn XP.', 540, quoteY + 160);

    resolve(canvas.toDataURL('image/png', 1.0));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Share Modal
// ─────────────────────────────────────────────────────────────────────────────
function ShareModal({ achievement, userStats, onClose }) {
  const [imageUrl, setImageUrl]       = useState(null);
  const [generating, setGenerating]   = useState(true);
  const [copied, setCopied]           = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    generateShareCard(achievement, userStats).then(url => {
      setImageUrl(url);
      setGenerating(false);
    });
  }, [achievement, userStats]);

  const handleDownload = () => {
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
    } catch (_) { handleDownload(); }
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
            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${achievement.color}80, transparent)` }} />

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

            <div style={{ padding: '0 20px 14px' }}>
              <div style={{ borderRadius: '14px', overflow: 'hidden', background: 'var(--color-stone)', border: '1px solid var(--color-border)', aspectRatio: '9/16', maxHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {generating ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
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

            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleNativeShare} disabled={generating}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '13px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, color: 'white', background: generating ? 'var(--color-stone)' : `linear-gradient(135deg, ${achievement.color}, ${achievement.color}cc)`, border: `1px solid ${achievement.border}`, cursor: generating ? 'default' : 'pointer', boxShadow: generating ? 'none' : `0 4px 20px ${achievement.glow}`, transition: 'all 0.2s' }}>
                <Share2 size={15} />
                Share to Instagram
              </motion.button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleDownload} disabled={generating}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '11px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-1)', background: 'var(--color-stone)', border: '1px solid var(--color-border)', cursor: generating ? 'default' : 'pointer', opacity: downloading ? 0.7 : 1 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  {downloading ? 'Saving…' : 'Save PNG'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleCopyText}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '11px', fontSize: '12px', fontWeight: 600, color: copied ? '#6fcf8a' : 'var(--color-text-1)', background: copied ? 'rgba(82,168,115,0.1)' : 'var(--color-stone)', border: `1px solid ${copied ? 'rgba(82,168,115,0.3)' : 'var(--color-border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied!' : 'Copy text'}
                </motion.button>
              </div>

              <p style={{ fontSize: '10px', color: 'var(--color-text-3)', textAlign: 'center', margin: 0 }}>
                1080×1080 PNG · optimized for Instagram &amp; Stories
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Achievement Unlock Overlay — with SOUNDS
// ─────────────────────────────────────────────────────────────────────────────
export function AchievementUnlockOverlay({ achievement, onClose, onShare, userStats }) {
  const { playLevelUp, playStreak, playSuccess } = useZenithSounds();

  useEffect(() => {
    if (!achievement) return;

    // Fire the appropriate sound 120 ms after mount so the overlay is
    // already visible when the audio starts.
    const soundTimer = setTimeout(() => {
      if (achievement.category === 'Levels') {
        playLevelUp();
      } else if (achievement.category === 'Streaks') {
        playStreak();
      } else {
        // Habits, XP, Special
        playSuccess();
      }
    }, 120);

    // Auto-dismiss after 8 s
    const dismissTimer = setTimeout(onClose, 8000);

    return () => {
      clearTimeout(soundTimer);
      clearTimeout(dismissTimer);
    };
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
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${achievement.color}, transparent)` }} />
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 30%, ${achievement.glow.replace('0.4', '0.08')} 0%, transparent 65%)`, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', padding: '36px 28px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Header label */}
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
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ position: 'absolute', inset: '-12px', borderRadius: '40px', border: `1.5px solid ${achievement.border}` }}
              />
            </motion.div>

            {/* Category pill */}
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

            {/* XP reward chip */}
            {achievement.xpReward > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.55, type: 'spring' }}
                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', borderRadius: '99px', background: 'rgba(184,115,51,0.1)', border: '1px solid rgba(184,115,51,0.25)', marginBottom: '20px' }}
              >
                <Star size={12} style={{ color: '#c9a43a' }} fill="#c9a43a" />
                <span style={{ fontWeight: 700, color: '#c9a43a', fontSize: '12px' }}>+{achievement.xpReward} bonus XP</span>
              </motion.div>
            )}

            {/* Buttons */}
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

          {/* Auto-dismiss progress bar */}
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
  const Icon    = def.icon;
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: earned ? 1 : 0.45, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      style={{
        position: 'relative', borderRadius: '18px', overflow: 'hidden',
        background: earned ? 'var(--color-surface-2)' : 'var(--color-stone)',
        border: `1px solid ${earned ? def.border : 'var(--color-border)'}`,
        boxShadow: earned && hov ? `0 8px 32px ${def.glow.replace('0.4', '0.2')}` : '0 2px 8px rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        filter: earned ? 'none' : 'grayscale(0.5)',
      }}
    >
      {earned && (
        <>
          <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: `linear-gradient(90deg, transparent, ${def.color}60, transparent)` }} />
          <div style={{ position: 'absolute', left: 0, top: '12px', bottom: '12px', width: '3px', borderRadius: '0 3px 3px 0', background: `linear-gradient(to bottom, ${def.color}, ${def.color}50)`, boxShadow: `0 0 8px ${def.glow}` }} />
        </>
      )}

      <div style={{ padding: '16px 16px 16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Icon */}
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: earned ? def.bg : 'var(--color-stone-mid)', border: `1px solid ${earned ? def.border : 'var(--color-stone-light)'}`, boxShadow: earned ? `0 4px 16px ${def.glow.replace('0.4', '0.25')}` : 'none', position: 'relative' }}>
          <Icon size={24} style={{ color: earned ? def.color : 'var(--color-text-3)' }} />
          {!earned && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
              <Lock size={14} style={{ color: 'var(--color-text-3)' }} />
            </div>
          )}
        </div>

        {/* Text */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {def.xpReward > 0 && (
              <span style={{ fontSize: '10px', fontWeight: 600, color: earned ? '#c9a43a' : 'var(--color-text-3)', background: earned ? 'rgba(201,164,58,0.1)' : 'transparent', border: earned ? '1px solid rgba(201,164,58,0.2)' : '1px solid transparent', padding: '1px 6px', borderRadius: '5px' }}>
                +{def.xpReward} XP
              </span>
            )}
            {earned && earnedAt ? (
              <span style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>
                {new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            ) : !earned ? (
              <span style={{ fontSize: '10px', color: 'var(--color-text-3)' }}>Locked</span>
            ) : null}
          </div>
        </div>

        {/* Share button */}
        {earned && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: hov ? 1 : 0.45 }}
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
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Streaks', 'Levels', 'Habits', 'XP', 'Special'];

export default function Achievements() {
  const { userStats, habits } = useHabitStore();

  const [earnedMap,     setEarnedMap]     = useState({});
  const [dbLoading,     setDbLoading]     = useState(true);
  const [syncing,       setSyncing]       = useState(false);
  const [shareTarget,   setShareTarget]   = useState(null);
  const [filter,        setFilter]        = useState('All');
  const [onlyEarned,    setOnlyEarned]    = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState(null);

  const dbIdsRef = useRef(new Set());

  // Step 1: Load from DB
  useEffect(() => {
    setDbLoading(true);
    fetchEarnedFromDB(USER_ID)
      .then(rows => {
        const map = {};
        rows.forEach(r => { map[r.achievement_id] = r.earned_at; });
        setEarnedMap(map);
        dbIdsRef.current = new Set(Object.keys(map));
      })
      .catch(() => {})
      .finally(() => setDbLoading(false));
  }, []);

  // Step 2: Evaluate new unlocks
  const prevStatsRef = useRef(null);

  useEffect(() => {
    if (dbLoading) return;
    if (!userStats) return;

    const nowEarned = new Set(
      ACHIEVEMENT_DEFS
        .filter(def => def.check(userStats, habits))
        .map(def => def.id)
    );

    const brandNew = [...nowEarned].filter(id => !dbIdsRef.current.has(id));
    if (brandNew.length === 0) return;

    const isFirstSync = dbIdsRef.current.size === 0 && !prevStatsRef.current;

    if (isFirstSync) {
      setSyncing(true);
      syncAllToDB(USER_ID, brandNew)
        .then(() => fetchEarnedFromDB(USER_ID))
        .then(rows => {
          const map = {};
          rows.forEach(r => { map[r.achievement_id] = r.earned_at; });
          setEarnedMap(map);
          dbIdsRef.current = new Set(Object.keys(map));
        })
        .catch(() => {})
        .finally(() => setSyncing(false));
    } else {
      const [firstNew] = brandNew;
      brandNew.forEach(id => {
        unlockInDB(USER_ID, id).then(() => {
          fetchEarnedFromDB(USER_ID).then(rows => {
            const map = {};
            rows.forEach(r => { map[r.achievement_id] = r.earned_at; });
            setEarnedMap(map);
            dbIdsRef.current = new Set(Object.keys(map));
          });
        }).catch(() => {});
      });
      const def = ACHIEVEMENT_DEFS.find(d => d.id === firstNew);
      if (def) setNewlyUnlocked(def);
    }

    prevStatsRef.current = userStats;
  }, [userStats, habits, dbLoading]);

  const earnedIds   = new Set(Object.keys(earnedMap));
  const earnedCount = earnedIds.size;
  const totalCount  = ACHIEVEMENT_DEFS.length;
  const progress    = Math.round((earnedCount / totalCount) * 100);

  const filteredDefs = ACHIEVEMENT_DEFS.filter(def => {
    if (onlyEarned && !earnedIds.has(def.id)) return false;
    if (filter !== 'All' && def.category !== filter) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ paddingBottom: '48px' }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <motion.h1 className="text-display" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              Achievements
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}
              style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px' }}>
              {dbLoading ? 'Loading…' : `${earnedCount} of ${totalCount} unlocked · saved to your account`}
            </motion.p>
          </div>
          {syncing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--color-text-3)', paddingTop: '6px' }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <RefreshCw size={11} />
              </motion.div>
              Syncing…
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Progress card ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        style={{ borderRadius: '20px', padding: '18px 20px', marginBottom: '20px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', overflow: 'hidden', position: 'relative' }}
      >
        <div style={{ position: 'absolute', inset: '0 0 auto 0', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(184,115,51,0.4), transparent)' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '100%', background: 'radial-gradient(ellipse at 100% 50%, rgba(201,164,58,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
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
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'var(--color-warm-white)', lineHeight: 1 }}>
                {dbLoading ? '…' : `${progress}%`}
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-2)' }}>Overall Progress</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>
                {dbLoading ? '…' : `${earnedCount}/${totalCount}`}
              </span>
            </div>
            <div style={{ height: '5px', background: 'var(--color-stone)', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', borderRadius: '99px', background: 'linear-gradient(90deg, var(--color-primary-dim), var(--color-primary), #d4954a)', boxShadow: '0 0 8px rgba(184,115,51,0.35)' }} />
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {CATEGORIES.filter(c => c !== 'All').map(cat => {
                const catDefs   = ACHIEVEMENT_DEFS.filter(d => d.category === cat);
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

      {/* ── Filters ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: filter === cat ? 'rgba(184,115,51,0.15)' : 'var(--color-stone)', color: filter === cat ? 'var(--color-primary)' : 'var(--color-text-3)', border: `1px solid ${filter === cat ? 'rgba(184,115,51,0.35)' : 'var(--color-border)'}` }}>
              {cat}
            </button>
          ))}
        </div>
        <button onClick={() => setOnlyEarned(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', background: onlyEarned ? 'rgba(82,168,115,0.12)' : 'var(--color-stone)', color: onlyEarned ? '#6fcf8a' : 'var(--color-text-3)', border: `1px solid ${onlyEarned ? 'rgba(82,168,115,0.3)' : 'var(--color-border)'}`, whiteSpace: 'nowrap' }}>
          <Trophy size={10} />
          Earned only
        </button>
      </div>

      {/* ── Achievement list ── */}
      {dbLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: '84px', borderRadius: '18px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AnimatePresence mode="popLayout">
            {filteredDefs.map((def, i) => (
              <AchievementCard
                key={def.id}
                def={def}
                earned={earnedIds.has(def.id)}
                earnedAt={earnedMap[def.id]}
                onShare={setShareTarget}
                delay={i * 0.035}
              />
            ))}
          </AnimatePresence>
          {filteredDefs.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: '48px 20px', textAlign: 'center' }}>
              <Trophy size={32} style={{ color: 'var(--color-text-3)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', color: 'var(--color-text-3)', margin: 0 }}>
                {onlyEarned ? 'No earned achievements in this category yet.' : 'No achievements found.'}
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Share modal */}
      <AnimatePresence>
        {shareTarget && (
          <ShareModal achievement={shareTarget} userStats={userStats} onClose={() => setShareTarget(null)} />
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