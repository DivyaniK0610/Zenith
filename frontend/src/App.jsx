import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import AICoach from './pages/AICoach';
import Timer from './pages/Timer';
import { checkBackendHealth } from './api/client';
import { Activity } from 'lucide-react';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const verify = async () => {
      try {
        await checkBackendHealth();
        setBackendStatus('connected');
      } catch {
        setBackendStatus('error');
      }
    };
    verify();
  }, []);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-background)' }}>
        {/* Desktop sidebar — hidden on mobile */}
        <Sidebar />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Status banner */}
          <div className={`w-full px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 flex-shrink-0 ${
            backendStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
            backendStatus === 'error'     ? 'bg-rose-500/10 text-rose-400' :
                                            'bg-amber-500/10 text-amber-400'
          }`}>
            <Activity size={13} className={backendStatus === 'checking' ? 'animate-pulse' : ''} />
            {backendStatus === 'connected' && 'Backend Connected'}
            {backendStatus === 'error'     && 'Backend Disconnected — start FastAPI on port 8000'}
            {backendStatus === 'checking'  && 'Connecting…'}
          </div>

          {/* Scrollable page content */}
          <main className="flex-1 overflow-y-auto">
            {/* Extra bottom padding on mobile for nav bar */}
            <div className="px-4 pt-6 pb-28 md:px-8 md:pb-10 max-w-3xl mx-auto w-full">
              <Routes>
                <Route path="/"         element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/coach"     element={<AICoach />} />
                <Route path="/timer"     element={<Timer />} />
              </Routes>
            </div>
          </main>
        </div>

        {/* Mobile bottom nav — visible only on mobile */}
        <MobileNav />
      </div>
    </Router>
  );
}