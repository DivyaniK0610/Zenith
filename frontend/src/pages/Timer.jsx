import React from 'react';
import { motion } from 'framer-motion';

export default function Timer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 className="text-display">Focus Timer</h1>
      <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px' }}>
        Pomodoro sessions that log directly to your habits
      </p>
    </motion.div>
  );
}