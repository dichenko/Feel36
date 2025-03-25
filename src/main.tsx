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
          console.log('🔍 Testing UTM parameter detection...');
          
          // Проверяем текущий URL на наличие UTM или startapp параметров
          const hasUtmParams = window.location.search.includes('utm_');
          const hasStartapp = window.location.search.includes('startapp=');
          
          // Если URL уже содержит параметры - используем их
          if (hasUtmParams) {
            console.log('✅ URL already contains UTM parameters. Using them for testing.');
            
            // Сохраняем информацию о визите с реальными UTM-метками
            setTimeout(() => {
              saveVisitInfo();
            }, 1000);
          } 
          // Если URL содержит startapp параметр
          else if (hasStartapp) {
            console.log('✅ URL contains startapp parameter. Testing with it.');
            
            // Получаем значение startapp
            const urlParams = new URLSearchParams(window.location.search);
            const startappValue = urlParams.get('startapp');
            
            console.log('Using startapp value:', startappValue);
            
            // Сохраняем информацию о визите
            setTimeout(() => {
              saveVisitInfo();
            }, 1000);
          }
          // Если нет параметров, генерируем тестовые UTM-метки
          else {
            console.log('ℹ️ No UTM params found in URL, testing with sample UTM parameters...');
            
            // Создаем тестовые параметры для разных сценариев
            const testCases = [
              {
                name: 'Стандартные UTM-метки',
                params: {
                  utm_source: 'development',
                  utm_medium: 'test',
                  utm_campaign: 'local-dev',
                  utm_content: 'auto-test'
                }
              },
              {
                name: 'Имитация startapp параметра с UTM-метками',
                startapp: 'utm_source=instagram&utm_medium=story&utm_campaign=promo_june'
              },
              {
                name: 'startapp как источник трафика',
                startapp: 'instagram'
              },
              {
                name: 'Проблемный случай - startapp с utm_source и utm_medium',
                startapp: 'utm_source=instagram&utm_medium=post'
              }
            ];
            
            // Поочередно тестируем разные сценарии
            // Через 2 секунды после загрузки приложения тестируем базовые UTM-метки
            setTimeout(() => {
              console.log(`\n🧪 Test Case 1: ${testCases[0].name}`);
              testUtmTracking(testCases[0].params);
            }, 2000);
            
            // Через 5 секунд тестируем startapp с UTM-метками
            setTimeout(() => {
              console.log(`\n🧪 Test Case 2: ${testCases[1].name}`);
              
              // Мокаем window.Telegram.WebApp.initDataUnsafe с start_param
              try {
                if (window.Telegram && window.Telegram.WebApp) {
                  const originalInitDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
                  
                  // Временно подменяем initDataUnsafe
                  Object.defineProperty(window.Telegram.WebApp, 'initDataUnsafe', {
                    value: {
                      ...originalInitDataUnsafe,
                      start_param: testCases[1].startapp
                    },
                    writable: true
                  });
                  
                  // Запускаем тест
                  testUtmTracking();
                  
                  // Восстанавливаем оригинальное значение
                  setTimeout(() => {
                    Object.defineProperty(window.Telegram.WebApp, 'initDataUnsafe', {
                      value: originalInitDataUnsafe,
                      writable: true
                    });
                  }, 1000);
                } else {
                  console.warn('Cannot test startapp - Telegram WebApp not initialized');
                }
              } catch (error) {
                console.error('Error testing startapp parameter:', error);
              }
            }, 5000);
            
            // Через 8 секунд тестируем простой startapp
            setTimeout(() => {
              console.log(`\n🧪 Test Case 3: ${testCases[2].name}`);
              
              // Мокаем window.Telegram.WebApp.startParams
              try {
                if (window.Telegram && window.Telegram.WebApp) {
                  const originalStartParams = (window.Telegram.WebApp as any).startParams;
                  
                  // Временно подменяем startParams
                  Object.defineProperty(window.Telegram.WebApp, 'startParams', {
                    value: testCases[2].startapp,
                    writable: true
                  });
                  
                  // Запускаем тест
                  testUtmTracking();
                  
                  // Восстанавливаем оригинальное значение
                  setTimeout(() => {
                    Object.defineProperty(window.Telegram.WebApp, 'startParams', {
                      value: originalStartParams,
                      writable: true
                    });
                  }, 1000);
                } else {
                  console.warn('Cannot test startParams - Telegram WebApp not initialized');
                }
              } catch (error) {
                console.error('Error testing startParams:', error);
              }
            }, 8000);
            
            // Через 11 секунд тестируем проблемный случай
            setTimeout(() => {
              console.log(`\n🧪 Test Case 4: ${testCases[3].name}`);
              console.log('Тестируем точную проблему из URL: https://t.me/FeelMe36_bot/feelme36?startapp=utm_source=instagram&utm_medium=post');
              
              // Используем специальную функцию для тестирования startapp параметра
              import('./services/supabaseService').then(({ testStartapp }) => {
                testStartapp('utm_source=instagram&utm_medium=post');
              });
            }, 11000);
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
