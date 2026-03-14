import React from 'react';

export default function Dashboard() {
  return (
    <div className="w-full h-full">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="p-6 bg-surface rounded-2xl border border-slate-700">
        <p className="text-slate-400">Welcome to Zenith. Your daily habits will appear here.</p>
      </div>
    </div>
  );
}