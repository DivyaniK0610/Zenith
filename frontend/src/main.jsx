import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <PWAInstallPrompt />
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1a1610',
          border: '1px solid rgba(255,255,255,0.05)',
          color: '#e8dece',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '13px',
          borderRadius: '12px',
        },
      }}
    />
  </StrictMode>,
)