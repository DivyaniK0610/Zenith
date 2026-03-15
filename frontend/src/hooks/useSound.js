import { useRef, useCallback } from 'react';

// Cache audio instances so we don't reload files repeatedly
const audioCache = {};

function playSound(path, volume = 0.5) {
  try {
    if (!audioCache[path]) {
      audioCache[path] = new Audio(path);
    }
    const audio = audioCache[path];
    audio.currentTime = 0;
    audio.volume = volume;
    audio.play().catch(() => {}); // silently ignore autoplay blocks
  } catch (e) {
    // silently ignore
  }
}

// Keep the original synth sounds for level up / streak
// (they're more dramatic than the WAV files)
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

  // Habit completion — celebration sound
  const playSuccess = useCallback(() => {
    playSound('/src/assets/sounds/celebration.wav', 0.45);
  }, []);

  // Level up — keep the dramatic synth fanfare
  const playLevelUp = useCallback(() => {
    try { createLevelUpFanfare(getCtx()); } catch (e) {}
  }, [getCtx]);

  // Streak milestone — keep synth
  const playStreak = useCallback(() => {
    try { createStreakSound(getCtx()); } catch (e) {}
  }, [getCtx]);

  // Delete habit
  const playDelete = useCallback(() => {
    playSound('/src/assets/sounds/disabled.wav', 0.4);
  }, []);

  // Archive habit
  const playArchive = useCallback(() => {
    playSound('/src/assets/sounds/swipe_01.wav', 0.4);
  }, []);

  // Pause habit
  const playPause = useCallback(() => {
    playSound('/src/assets/sounds/toggle_off.wav', 0.4);
  }, []);

  // Resume habit
  const playResume = useCallback(() => {
    playSound('/src/assets/sounds/toggle_on.wav', 0.4);
  }, []);

  // Open menu
  const playMenuOpen = useCallback(() => {
    playSound('/src/assets/sounds/tap_01.wav', 0.25);
  }, []);

  // Modal open
  const playModalOpen = useCallback(() => {
    playSound('/src/assets/sounds/tap_05.wav', 0.3);
  }, []);

  // Modal close
  const playModalClose = useCallback(() => {
    playSound('/src/assets/sounds/tap_01.wav', 0.3);
  }, []);

  return {
    playSuccess,
    playLevelUp,
    playStreak,
    playDelete,
    playArchive,
    playPause,
    playResume,
    playMenuOpen,
    playModalOpen,
    playModalClose,
  };
}