import React from 'react';
import { motion } from 'framer-motion';

export default function Analytics() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 className="text-display">Analytics</h1>
      <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px' }}>
        Track your <i>performance</i> over time
      </p>
    </motion.div>
  );
}