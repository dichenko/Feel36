import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LocaleProvider } from './i18n';
import { saveDailyRecord, saveVisitInfo, supabase, testUtmTracking, testStartapp } from './services/supabaseService';

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
        await Promise.all([saveVisitInfo(), saveDailyRecord()]);
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
  return (
    <LocaleProvider>
      <App />
    </LocaleProvider>
  );
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
          console.log('🔍 Тестирование обнаружения UTM-параметров...');
          
          // Проверяем текущий URL на наличие UTM или startapp параметров
          const hasUtmParams = window.location.search.includes('utm_');
          const hasStartapp = window.location.search.includes('startapp=');
          
          // Если URL уже содержит параметры - используем их
          if (hasUtmParams || hasStartapp) {
            console.log('✅ URL уже содержит UTM-параметры или startapp. Используем их для тестирования.');
            
            // Сохраняем информацию о визите с реальными параметрами
            setTimeout(() => {
              saveVisitInfo();
            }, 1000);
          } 
          // Если нет параметров, тестируем стандартный сценарий с UTM-метками
          else {
            console.log('ℹ️ UTM-параметры не найдены в URL, тестируем с примером UTM-параметров...');
            
            // Тестовый пример 1: UTM-метки как в реальной ссылке Telegram
            setTimeout(() => {
              console.log('\n🧪 Тест: Реальная ссылка - utm_source=instagram&utm_medium=post&utm_campaign=spring_promo');
              testStartapp('utm_source=instagram&utm_medium=post&utm_campaign=spring_promo');
            }, 2000);
            
            // Тестовый пример 2: Простое значение source в startapp
            setTimeout(() => {
              console.log('\n🧪 Тест: Простой источник - instagram');
              testStartapp('instagram');
            }, 6000);
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
