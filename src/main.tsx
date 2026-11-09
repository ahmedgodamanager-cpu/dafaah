import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ExperienceErrorBoundary } from './components/AppExperience';
import { installErrorLog } from './utils/errorLog';

// Keeps the last errors in this browser, so a problem can be reported afterwards
// (Tools → "نسخ سجل الأخطاء").
installErrorLog();

// Filter benign quota exhausted events from crashing UI or bubbling
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event?.reason?.message || String(event?.reason || '');
    if (msg.includes('resource-exhausted') || msg.includes('Quota limit exceeded') || msg.includes('backoff delay')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* A rendering error now shows a recovery card instead of a blank white page. */}
    <ExperienceErrorBoundary catchGlobalErrors={false}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ExperienceErrorBoundary>
  </StrictMode>,
);
