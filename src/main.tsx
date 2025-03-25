import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { saveVisitInfo, supabase, testUtmTracking } from './services/supabaseService';

// Оболочка приложения с аналитикой
const AppWithAnalytics = () => {
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
        await saveVisitInfo();
      } catch (error) {
        // Игнорируем ошибки
      }
    };
    
    saveVisitInfoAsync();
    
    // По желанию можно добавить периодическое сохранение данных о пользователе
    // при длительном использовании приложения
    const intervalId = setInterval(saveVisitInfoAsync, 30 * 60 * 1000); // каждые 30 минут
    
    return () => clearInterval(intervalId);
  }, [telegramReady]);
  
  // Если WebApp не готов, можно показать лоадер или сразу приложение
  return <App />;
};

// Логируем информацию о Supabase в режиме разработки
if (import.meta.env.DEV) {
  console.log('Supabase client initialized:', !!supabase);
  
  if (supabase) {
    console.log('Testing Supabase connection...');
    supabase.from('user_visits').select('id', { count: 'exact' }).limit(0)
      .then(({ error, count }) => {
        if (error) {
          console.error('Error connecting to Supabase:', error);
        } else {
          console.log('Successfully connected to Supabase. Records count:', count);
          
          // Тестируем UTM-метки в режиме разработки
          // Проверяем, есть ли в URL уже UTM-метки
          const hasUtmParams = window.location.search.includes('utm_');
          if (!hasUtmParams) {
            console.log('No UTM params found in URL, testing with sample UTM parameters...');
            
            // Через 2 секунды после загрузки приложения тестируем UTM-метки
            setTimeout(() => {
              testUtmTracking({
                utm_source: 'development',
                utm_medium: 'test',
                utm_campaign: 'local-dev',
                utm_content: 'auto-test'
              });
            }, 2000);
          } else {
            console.log('UTM params found in URL, skipping test tracking');
          }
        }
      });
  } else {
    console.warn('Supabase client not initialized. Check your environment variables.');
  }
}

// Рендерим приложение
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithAnalytics />
  </StrictMode>
);
