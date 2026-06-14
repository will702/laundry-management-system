import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* Honor the OS "reduce motion" setting across all Framer Motion animations */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <App />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>,
);
