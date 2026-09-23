import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LocaleProvider } from './i18n';
import { saveDailyRecord, saveVisitInfo, supabase } from './services/supabaseService';

// Оболочка приложения с аналитикой
export const AppWithAnalytics = () => {
  // State для отслеживания готовности Telegram WebApp
  const [telegramReady, setTelegramReady] = useState(false);
  
  // Инициализируем Telegram WebApp
  useEffect(() => {
    const initTelegram = () => {
      try {
        // Проверяем доступность Telegram WebApp
        if (!window.Telegram?.WebApp) {
          // Если мы не в среде Telegram WebApp, просто отображаем приложение без аналитики
          setTelegramReady(true);
          return;
        }
        
        // Инициализируем Telegram WebApp
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        // WebApp успешно инициализирован
        setTelegramReady(true);
      } catch (error) {
        // В случае ошибки все равно показываем приложение
        console.error('Error initializing Telegram WebApp:', error);
        setTelegramReady(true);
      }
    };
    
    // Запускаем инициализацию с небольшой задержкой
    const timeoutId = setTimeout(initTelegram, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Сохраняем данные о посещении после инициализации Telegram WebApp
  useEffect(() => {
    if (!telegramReady) return;
    
    // Сохраняем информацию о визите в фоновом режиме
    const saveVisitInfoAsync = async () => {
      try {
        await Promise.all([saveVisitInfo(), saveDailyRecord()]);
      } catch (error) {
        console.error('Failed to save analytics:', error);
      }
    };
    
    saveVisitInfoAsync();
    
    // По желанию можно добавить периодическое сохранение данных о пользователе
    // при длительном использовании приложения
    const intervalId = setInterval(saveVisitInfoAsync, 30 * 60 * 1000); // каждые 30 минут
    
    return () => clearInterval(intervalId);
  }, [telegramReady]);
  
  // Если WebApp не готов, можно показать лоадер или сразу приложение
  return (
    <LocaleProvider>
      <App />
    </LocaleProvider>
  );
};

// The anon role cannot read user_visits by design, so development startup only
// reports whether the client was configured. Use npm run test:supabase for a
// read-only connectivity check.
if (import.meta.env.DEV) {
  console.log('Supabase client initialized:', !!supabase);
}

// Рендерим приложение
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithAnalytics />
  </StrictMode>
);
