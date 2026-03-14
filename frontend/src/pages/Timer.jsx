import React from 'react';

export default function Timer() {
  return (
    <div className="space-y-5 page-enter">
      <div>
        <h1 className="text-display">Focus Timer</h1>
        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '3px' }}>
          Pomodoro timer and focus sessions
        </p>
      </div>
    </div>
  );
}