import { useRef, useCallback } from 'react';

// Generates a Web Audio API chime tone — no external files needed
function createSuccessChime(audioCtx) {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.08);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.08);
    gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + i * 0.08 + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.08 + 0.4);

    oscillator.start(audioCtx.currentTime + i * 0.08);
    oscillator.stop(audioCtx.currentTime + i * 0.08 + 0.4);
  });
}

function createLevelUpFanfare(audioCtx) {
  const sequence = [
    { freq: 523.25, time: 0 },
    { freq: 659.25, time: 0.1 },
    { freq: 783.99, time: 0.2 },
    { freq: 1046.5, time: 0.3 },
    { freq: 1318.5, time: 0.45 },
  ];
  sequence.forEach(({ freq, time }) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + time);
    gain.gain.setValueAtTime(0, audioCtx.currentTime + time);
    gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + time + 0.5);
    osc.start(audioCtx.currentTime + time);
    osc.stop(audioCtx.currentTime + time + 0.5);
  });
}

function createStreakSound(audioCtx) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + 0.3);
}

export function useZenithSounds() {
  const audioCtxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playSuccess = useCallback(() => {
    try { createSuccessChime(getCtx()); } catch (e) { /* audio blocked */ }
  }, [getCtx]);

  const playLevelUp = useCallback(() => {
    try { createLevelUpFanfare(getCtx()); } catch (e) { /* audio blocked */ }
  }, [getCtx]);

  const playStreak = useCallback(() => {
    try { createStreakSound(getCtx()); } catch (e) { /* audio blocked */ }
  }, [getCtx]);

  return { playSuccess, playLevelUp, playStreak };
}