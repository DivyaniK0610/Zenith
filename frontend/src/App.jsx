import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import AICoach from './pages/AICoach';
import Timer from './pages/Timer';
import { checkBackendHealth } from './api/client';
import { Activity } from 'lucide-react';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'connected', 'error'

  useEffect(() => {
    const verifyConnection = async () => {
      try {
        await checkBackendHealth();
        setBackendStatus('connected');
      } catch (error) {
        setBackendStatus('error');
      }
    };
    
    verifyConnection();
  }, []);

  return (
    <Router>
      <div className="flex h-screen bg-background text-white overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-y-auto">
          
          {/* Top API Status Banner */}
          <div className={`w-full p-2 text-xs font-semibold flex items-center justify-center gap-2 transition-colors duration-300 ${
            backendStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
            backendStatus === 'error' ? 'bg-rose-500/10 text-rose-400' :
            'bg-amber-500/10 text-amber-400'
          }`}>
            <Activity size={14} className={backendStatus === 'checking' ? 'animate-pulse' : ''} />
            {backendStatus === 'connected' && "Backend Connected"}
            {backendStatus === 'error' && "Backend Disconnected - Ensure FastAPI is running on port 8000"}
            {backendStatus === 'checking' && "Connecting to Backend..."}
          </div>

          {/* Page Routing */}
          <div className="p-8 max-w-6xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/coach" element={<AICoach />} />
              <Route path="/timer" element={<Timer />} />
            </Routes>
          </div>
          
        </main>
      </div>
    </Router>
  );
}