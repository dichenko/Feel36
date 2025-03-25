import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { saveVisitInfo } from './services/supabaseService';

// Оборачиваем приложение для вызова saveVisitInfo при монтировании
const AppWithAnalytics = () => {
  useEffect(() => {
    // Проверяем, что Telegram WebApp доступен
    if (!window.Telegram?.WebApp) {
      console.error('Telegram WebApp is not available');
      return;
    }

    // Инициализируем Telegram WebApp
    try {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      console.log('Telegram WebApp initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Telegram WebApp:', error);
      return;
    }

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
