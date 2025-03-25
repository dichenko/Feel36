import { createClient } from '@supabase/supabase-js';

// Типы данных
export interface UserVisit {
  tg_id: string;
  timestamp: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  visit_count: number;
  user_data: Record<string, any>;
}

// Инициализация Supabase клиента через переменные окружения Vercel
// Note: нам нужно использовать корректные переменные окружения, заданные в Vercel
const getSupabaseConfig = () => {
  // Включаем логирование если находимся в режиме разработки
  const isDevMode = !import.meta.env.PROD;
  
  if (isDevMode) {
    console.log('Running in development mode');
  }

  // В Vite можно получить доступ к переменным окружения из Vercel через import.meta.env
  // Проверяем все возможные имена переменных окружения
  const supabaseUrlOptions = [
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_URL
  ];
  
  const supabaseKeyOptions = [
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    import.meta.env.SUPABASE_ANON_KEY
  ];

  // Используем первую найденную переменную
  const supabaseUrl = supabaseUrlOptions.find(url => url) as string;
  const supabaseKey = supabaseKeyOptions.find(key => key) as string;

  if (isDevMode) {
    console.log('Supabase URL available:', !!supabaseUrl);
    console.log('Supabase Key available:', !!supabaseKey);
  }

  return { supabaseUrl, supabaseKey };
};

// Получаем конфигурацию Supabase
const { supabaseUrl, supabaseKey } = getSupabaseConfig();

// Создаем клиент Supabase только если доступны необходимые переменные окружения
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false // Отключаем сохранение сессии, т.к. это не нужно для аналитики
      }
    })
  : null;

// Получение UTM-меток из URL
export const getUtmParams = (): Record<string, string> => {
  try {
    const isDevMode = !import.meta.env.PROD;
    const utmParams: Record<string, string> = {};

    // Получаем startapp параметр из Telegram WebApp
    let startParam = '';
    
    // Метод 1: Официальный способ - получение через initDataUnsafe.start_param
    if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
      startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
      if (isDevMode) {
        console.log('Найден start_param в initDataUnsafe:', startParam);
      }
    }
    
    // Если не найден в initDataUnsafe, проверяем URL (метод для отладки и тестирования)
    if (!startParam) {
      const urlSearchParams = new URLSearchParams(window.location.search);
      startParam = urlSearchParams.get('startapp') || '';
      if (startParam && isDevMode) {
        console.log('Найден startapp в URL query:', startParam);
      }
    }

    // Если startapp параметр найден, разбираем его на UTM-метки
    if (startParam) {
      // Проверяем, содержит ли параметр startapp уже готовые UTM-метки в формате utm_source=value&utm_medium=value
      if (startParam.includes('utm_')) {
        // Разбираем строку параметров
        const utmPairs = startParam.split('&');
        
        utmPairs.forEach(pair => {
          const parts = pair.split('=');
          if (parts.length === 2) {
            const key = parts[0].trim();
            const value = parts[1].trim();
            
            // Сохраняем только валидные UTM-метки
            if (key.startsWith('utm_')) {
              utmParams[key] = decodeURIComponent(value);
              if (isDevMode) {
                console.log(`Получена UTM-метка: ${key}=${utmParams[key]}`);
              }
            }
          }
        });
      } 
      // Если startapp - простое значение без utm_ префикса, используем его как utm_source
      else {
        // Если startapp содержит только значение, используем его как utm_source
        utmParams['utm_source'] = startParam;
        
        if (isDevMode) {
          console.log('Используем значение startapp как utm_source:', startParam);
        }
      }
    }

    // Показываем результат в режиме разработки
    if (isDevMode) {
      if (Object.keys(utmParams).length > 0) {
        console.log('Итоговые UTM-метки:', utmParams);
      } else {
        console.warn('UTM-метки не найдены');
      }
    }
    
    return utmParams;
  } catch (error) {
    if (!import.meta.env.PROD) {
      console.error('Ошибка при получении UTM-меток:', error);
    }
    return {};
  }
};

// Безопасное получение данных о пользователе из Telegram WebApp
export const getTelegramUserData = (): Record<string, any> => {
  try {
    if (!window.Telegram?.WebApp) {
      return {};
    }
    
    const tg = window.Telegram.WebApp;
    let userData: Record<string, any> = {};
    
    // Безопасное получение initData
    const initDataStr = tg.initData || '';
    
    if (initDataStr) {
      try {
        // Parse initData если оно в формате URLSearchParams
        const data = new URLSearchParams(initDataStr);
        
        // Получаем данные пользователя из параметра user если он существует
        const userStr = data.get('user');
        if (userStr) {
          try {
            userData = JSON.parse(userStr);
          } catch {
            // Игнорируем ошибки парсинга
          }
        }
        
        // Также сохраняем все параметры initData
        data.forEach((value, key) => {
          if (key !== 'user') { // Избегаем дублирования пользовательских данных
            userData[key] = value;
          }
        });
      } catch {
        // Игнорируем ошибки парсинга
      }
    }

    // Добавляем параметры темы
    if (tg.themeParams) {
      userData.themeParams = tg.themeParams;
    }
    
    return userData;
  } catch {
    return {};
  }
};

// Получить ID пользователя Telegram
export const getTelegramUserId = (): string => {
  try {
    const userData = getTelegramUserData();
    
    // Если ID пользователя не найден, попробуем использовать user.id, id или user_id (разные версии API могут возвращать разные форматы)
    const userId = userData?.id?.toString() || 
                  userData?.user?.id?.toString() || 
                  userData?.user_id?.toString() || 
                  '';
                  
    // Если ID не найден, создадим временный ID на основе хеша initData
    if (!userId && window.Telegram?.WebApp?.initData) {
      // Создаем хеш из initData - это не будет настоящим ID пользователя, но будет уникальным для каждого пользователя
      return `temp_${Math.abs(
        window.Telegram.WebApp.initData.split('').reduce(
          (acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0
        )
      )}`;
    }
    
    return userId;
  } catch {
    return '';
  }
};

// Получить счетчик посещений из localStorage
export const getVisitCount = (): number => {
  try {
    const count = localStorage.getItem('visit_count');
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
};

// Увеличить счетчик посещений
export const incrementVisitCount = (): number => {
  try {
    const currentCount = getVisitCount();
    const newCount = currentCount + 1;
    localStorage.setItem('visit_count', newCount.toString());
    return newCount;
  } catch {
    return 1;
  }
};

// Сохранить информацию о визите в Supabase
export const saveVisitInfo = async (): Promise<void> => {
  // Выводим отладочную информацию в режиме разработки
  const isDevMode = !import.meta.env.PROD;
  
  if (isDevMode) {
    console.group('📊 Attempting to save visit info...');
    console.log('Supabase client initialized:', !!supabase);

    // Отладочная информация о текущем URL
    console.log('Current URL:', window.location.href);
    console.log('URL search params:', window.location.search);
    console.log('URL hash:', window.location.hash);
    
    // Проверяем наличие Telegram WebApp
    const tgAvailable = typeof window.Telegram !== 'undefined' && typeof window.Telegram.WebApp !== 'undefined';
    console.log('Telegram WebApp available:', tgAvailable);
    
    if (tgAvailable) {
      // Проверяем доступные параметры
      console.log('initData available:', !!window.Telegram.WebApp.initData);
      console.log('initDataUnsafe available:', !!window.Telegram.WebApp.initDataUnsafe);
      console.log('startParams available:', !!(window.Telegram.WebApp as any).startParams);
      
      // Логируем содержимое initDataUnsafe если доступно
      if (window.Telegram.WebApp.initDataUnsafe) {
        console.log('initDataUnsafe:', JSON.stringify(window.Telegram.WebApp.initDataUnsafe, null, 2));
      }
      
      // Логируем startParams если доступно
      const startParams = (window.Telegram.WebApp as any).startParams;
      if (startParams) {
        console.log('startParams value:', startParams);
      }
      
      // Проверяем start_param в initDataUnsafe
      const startParam = window.Telegram.WebApp.initDataUnsafe?.start_param;
      if (startParam) {
        console.log('start_param value:', startParam);
      }
    }
  }
  
  // Если Supabase не инициализирован, просто игнорируем сохранение
  if (!supabase) {
    if (isDevMode) {
      console.warn('❌ Supabase client not initialized. Unable to save visit info.');
      console.groupEnd();
    }
    return;
  }

  // Запускаем сохранение в фоновом режиме
  setTimeout(async () => {
    try {
      // Получаем ID пользователя Telegram
      const tgId = getTelegramUserId();
      
      // Если ID не найден, не сохраняем данные
      if (!tgId) {
        if (isDevMode) {
          console.warn('❌ Telegram user ID not found. Visit data not saved.');
          console.groupEnd();
        }
        return;
      }
      
      // Получаем UTM-метки
      const utmParams = getUtmParams();
      
      // Проверяем, есть ли UTM-метки и логируем их в режиме разработки
      if (isDevMode) {
        if (Object.keys(utmParams).length > 0) {
          console.log('✅ Found UTM parameters:', utmParams);
        } else {
          console.warn('⚠️ No UTM parameters found in URL');
        }
      }
      
      // Получаем данные пользователя
      const userData = getTelegramUserData();
      if (isDevMode && Object.keys(userData).length > 0) {
        console.log('✅ User data:', userData);
      }
      
      // Увеличиваем счетчик визитов
      const visitCount = incrementVisitCount();
      if (isDevMode) {
        console.log('📈 Visit count:', visitCount);
      }
      
      // Создаем объект для вставки в БД
      const visitData: UserVisit = {
        tg_id: tgId,
        timestamp: new Date().toISOString(),
        visit_count: visitCount,
        user_data: userData,
        ...utmParams
      };
      
      if (isDevMode) {
        console.log('📦 Visit data to be saved:', visitData);
      }
      
      // Вставляем данные в таблицу user_visits
      const { error } = await supabase
        .from('user_visits')
        .insert([visitData]);
        
      if (error) {
        if (isDevMode) {
          console.error('❌ Error saving visit info:', error);
          console.groupEnd();
        }
      } else if (isDevMode) {
        console.log('✅ Visit info saved successfully!');
        console.groupEnd();
      }
    } catch (error) {
      // Игнорируем все ошибки при сохранении
      if (isDevMode) {
        console.error('❌ Failed to save visit info:', error);
        console.groupEnd();
      }
    }
  }, 0); // Запускаем в следующем тике event loop
};

// Функция для тестирования UTM-меток в режиме разработки
export const testUtmTracking = (utmParams: Record<string, string> = {
  utm_source: 'test',
  utm_medium: 'manual',
  utm_campaign: 'dev-test'
}): void => {
  const isDevMode = !import.meta.env.PROD;
  if (!isDevMode) {
    console.warn('testUtmTracking должна использоваться только в режиме разработки');
    return;
  }
  
  console.log('Тестирование отслеживания UTM-меток с параметрами:', utmParams);
  
  // Подготавливаем строку UTM-параметров для startapp
  const startappValue = Object.entries(utmParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  // Вызываем тестирование startapp
  testStartapp(startappValue);
};

// Функция для тестирования startapp параметра напрямую 
// Только для режима разработки
export const testStartapp = (startappValue: string): void => {
  const isDevMode = !import.meta.env.PROD;
  if (!isDevMode) {
    console.warn('testStartapp должна использоваться только в режиме разработки');
    return;
  }
  
  console.group('🔬 Тестирование параметра startapp');
  console.log('Тестируем startapp со значением:', startappValue);
  
  // Сохраняем текущие параметры URL и Telegram WebApp
  const originalSearch = window.location.search;
  const originalHref = window.location.href;
  let originalInitDataUnsafe: Record<string, any> | null = null;
  
  try {
    // Мокаем параметры в URL
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        search: `?startapp=${encodeURIComponent(startappValue)}`,
        href: `${window.location.origin}${window.location.pathname}?startapp=${encodeURIComponent(startappValue)}`
      }
    });
    
    // Мокаем параметры Telegram WebApp, если они доступны
    if (window.Telegram?.WebApp) {
      originalInitDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      
      // Подменяем start_param в initDataUnsafe
      Object.defineProperty(window.Telegram.WebApp, 'initDataUnsafe', {
        value: {
          ...originalInitDataUnsafe,
          start_param: startappValue
        },
        writable: true
      });
      
      // Тестируем извлечение UTM-параметров
      console.log('Получаем UTM-параметры из startapp...');
      const utmParams = getUtmParams();
      console.log('Извлеченные UTM-параметры:', utmParams);
      
      // Тестируем сохранение визита с этими параметрами
      console.log('Тестируем сохранение визита с этими UTM-параметрами...');
      saveVisitInfo().then(() => {
        // Восстанавливаем оригинальные значения
        if (originalInitDataUnsafe) {
          Object.defineProperty(window.Telegram.WebApp, 'initDataUnsafe', {
            value: originalInitDataUnsafe,
            writable: true
          });
        }
        
        // Восстанавливаем оригинальный URL
        Object.defineProperty(window, 'location', {
          writable: true,
          value: {
            ...window.location,
            search: originalSearch,
            href: originalHref
          }
        });
        
        console.log('✅ Тестирование завершено, оригинальные значения восстановлены');
        console.groupEnd();
      });
    } else {
      // Если Telegram WebApp недоступен, тестируем только через URL параметр startapp
      console.log('Telegram WebApp недоступен, тестируем только через URL параметр startapp');
      const utmParams = getUtmParams();
      console.log('Извлеченные UTM-параметры:', utmParams);
      
      // Восстанавливаем оригинальный URL
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          ...window.location,
          search: originalSearch,
          href: originalHref
        }
      });
      
      console.log('✅ Тестирование завершено, оригинальные значения восстановлены');
      console.groupEnd();
    }
  } catch (error) {
    console.error('❌ Ошибка при тестировании startapp:', error);
    
    // Восстанавливаем оригинальный URL и Telegram WebApp в случае ошибки
    if (originalInitDataUnsafe && window.Telegram?.WebApp) {
      Object.defineProperty(window.Telegram.WebApp, 'initDataUnsafe', {
        value: originalInitDataUnsafe,
        writable: true
      });
    }
    
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        search: originalSearch,
        href: originalHref
      }
    });
    
    console.groupEnd();
  }
}; 