import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { saveVisitInfo } from './services/supabaseService';

// Оборачиваем приложение для вызова saveVisitInfo при монтировании
const AppWithAnalytics = () => {
  useEffect(() => {
    // Сохраняем информацию о визите при загрузке приложения
    saveVisitInfo().catch(error => {
      console.error('Failed to save visit info:', error);
    });
  }, []);

  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithAnalytics />
  </StrictMode>
);
