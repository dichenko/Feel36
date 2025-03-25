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

    // Основная проблема в том, что в Telegram Mini App параметры передаются специальным образом:
    // 1. startapp параметр в URL: https://t.me/FeelMe36_bot/feelme36?startapp=ABC
    // 2. Параметр доступен в window.Telegram.WebApp.initDataUnsafe.start_param
    // Сначала проверяем startapp параметр из URL и WebApp.initDataUnsafe

    // Получаем startapp параметр из WebApp.initDataUnsafe
    let startParam = '';
    if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
      startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
      if (isDevMode) {
        console.log('Found start_param in initDataUnsafe:', startParam);
      }
    }

    // Если параметра нет в initDataUnsafe, ищем его в window.Telegram.WebApp.startParams
    if (!startParam && window.Telegram?.WebApp?.startParams) {
      startParam = window.Telegram.WebApp.startParams;
      if (isDevMode) {
        console.log('Found startParams:', startParam);
      }
    }

    // Если параметра нет в объекте WebApp, пробуем найти его в URL
    if (!startParam) {
      // Проверяем ?startapp= параметр в URL
      const urlSearchParams = new URLSearchParams(window.location.search);
      startParam = urlSearchParams.get('startapp') || '';
      if (startParam && isDevMode) {
        console.log('Found startapp in URL query:', startParam);
      }
    }

    // Если нашли startapp параметр, обрабатываем его
    if (startParam) {
      // Обработка ситуации, когда startapp содержит несколько UTM-параметров, но не в формате запроса
      // Пример: startapp=utm_source=instagram&utm_medium=post (без знака вопроса в начале)
      if (startParam.includes('utm_')) {
        if (isDevMode) {
          console.log('startapp contains UTM parameters, trying to parse');
        }

        // Обработка нескольких UTM-параметров в startapp 
        const utmPairs = startParam.split('&');
        
        if (isDevMode) {
          console.log('Parsed UTM pairs:', utmPairs);
        }
        
        utmPairs.forEach(pair => {
          const parts = pair.split('=');
          if (parts.length === 2) {
            const key = parts[0].trim();
            const value = parts[1].trim();
            
            // Проверяем, является ли это UTM-параметром
            if (key.startsWith('utm_')) {
              utmParams[key] = decodeURIComponent(value);
              if (isDevMode) {
                console.log(`Parsed UTM parameter: ${key}=${utmParams[key]}`);
              }
            }
          }
        });
        
        // Если мы не смогли распарсить ни один UTM-параметр, попробуем другие методы
        if (Object.keys(utmParams).length === 0) {
          try {
            // Проверим, может быть startapp содержит строку запроса без ?
            const startParamsDecoded = decodeURIComponent(startParam);
            
            // Добавляем ? в начало, если его нет, чтобы URLSearchParams мог корректно распарсить
            const queryString = startParamsDecoded.startsWith('?') ? 
              startParamsDecoded : `?${startParamsDecoded}`;
            
            const startParamsObj = new URLSearchParams(queryString);
            
            ['source', 'medium', 'campaign', 'content', 'term'].forEach(param => {
              const value = startParamsObj.get(`utm_${param}`);
              if (value) {
                utmParams[`utm_${param}`] = value;
              }
            });
            
            if (isDevMode && Object.keys(utmParams).length > 0) {
              console.log('Parsed UTM params from startapp using URLSearchParams:', utmParams);
            }
          } catch (e) {
            if (isDevMode) {
              console.error('Error parsing startapp with URLSearchParams:', e);
            }
          }
        }
      } 
      // Если startapp не содержит явные UTM-метки, но может иметь формат query-строки
      else if (startParam.includes('&') || startParam.includes('=')) {
        try {
          // Пробуем распарсить как обычные параметры
          const startParamsDecoded = decodeURIComponent(startParam);
          const startParamsObj = new URLSearchParams(startParamsDecoded);
          
          // Проверяем наличие UTM-меток
          ['source', 'medium', 'campaign', 'content', 'term'].forEach(param => {
            const value = startParamsObj.get(`utm_${param}`);
            if (value) {
              utmParams[`utm_${param}`] = value;
            }
          });
          
          if (isDevMode && Object.keys(utmParams).length > 0) {
            console.log('Parsed UTM params from startapp:', utmParams);
          }
        } catch (e) {
          if (isDevMode) {
            console.error('Error parsing startapp parameter:', e);
          }
          // Если не удалось распарсить, используем значение startapp как есть
          utmParams['utm_source'] = startParam;
        }
      }
      // Если startapp - простое значение, используем его как utm_source
      else if (startParam) {
        // Используем значение как utm_source
        utmParams['utm_source'] = startParam;
        
        if (isDevMode) {
          console.log('Using startapp as utm_source:', startParam);
        }
      }
      
      // Если мы что-то нашли, логируем результат
      if (Object.keys(utmParams).length > 0 && isDevMode) {
        console.log('Final UTM params from startapp:', utmParams);
      }
    }

    // Метод 2: проверяем URL на наличие UTM-меток
    // Это запасной вариант, если метки переданы обычным способом
    if (Object.keys(utmParams).length === 0) {
      // Ищем UTM-метки в URL
      const urlParams = new URLSearchParams(window.location.search);
      
      ['source', 'medium', 'campaign', 'content', 'term'].forEach(param => {
        const value = urlParams.get(`utm_${param}`);
        if (value) {
          utmParams[`utm_${param}`] = value;
        }
      });

      if (Object.keys(utmParams).length > 0 && isDevMode) {
        console.log('Found UTM params in URL search:', utmParams);
      }
    }

    // Метод 3: обработка initData
    // В некоторых версиях Telegram initData может содержать UTM-метки
    if (Object.keys(utmParams).length === 0 && window.Telegram?.WebApp?.initData) {
      try {
        const initData = new URLSearchParams(window.Telegram.WebApp.initData);
        
        ['source', 'medium', 'campaign', 'content', 'term'].forEach(param => {
          const value = initData.get(`utm_${param}`);
          if (value) {
            utmParams[`utm_${param}`] = value;
          }
        });

        if (Object.keys(utmParams).length > 0 && isDevMode) {
          console.log('Found UTM params in initData:', utmParams);
        }
      } catch (e) {
        if (isDevMode) {
          console.error('Failed to parse initData for UTM params:', e);
        }
      }
    }

    // Метод 4: последний шанс - проверка полного URL с помощью регулярных выражений
    if (Object.keys(utmParams).length === 0) {
      // Получаем полный URL, включая hash-часть
      const fullUrl = window.location.href + window.location.hash;
      
      if (isDevMode) {
        console.log('Last try: Checking full URL for UTM params:', fullUrl);
      }
      
      // Используем регулярные выражения для поиска UTM-меток в любой части URL
      const utmRegexps = {
        utm_source: /[?&#]utm_source=([^&#]*)/i,
        utm_medium: /[?&#]utm_medium=([^&#]*)/i,
        utm_campaign: /[?&#]utm_campaign=([^&#]*)/i,
        utm_content: /[?&#]utm_content=([^&#]*)/i,
        utm_term: /[?&#]utm_term=([^&#]*)/i
      };

      Object.entries(utmRegexps).forEach(([key, regex]) => {
        const match = fullUrl.match(regex);
        if (match && match[1]) {
          utmParams[key] = decodeURIComponent(match[1]);
        }
      });

      if (Object.keys(utmParams).length > 0 && isDevMode) {
        console.log('Found UTM params using regex:', utmParams);
      }
    }

    // Если всё равно не нашли UTM-метки, можно попробовать использовать referer
    if (Object.keys(utmParams).length === 0 && document.referrer) {
      const referrer = document.referrer;
      if (isDevMode) {
        console.log('No UTM params found, checking referrer:', referrer);
      }
      
      // Извлекаем домен из референта и используем его как utm_source
      try {
        const referrerUrl = new URL(referrer);
        const domain = referrerUrl.hostname.replace('www.', '');
        
        if (domain && domain !== window.location.hostname) {
          utmParams['utm_source'] = domain;
          if (isDevMode) {
            console.log('Using referrer domain as utm_source:', domain);
          }
        }
      } catch (e) {
        // Игнорируем ошибки парсинга URL
      }
    }

    // Показываем результат в dev-режиме
    if (isDevMode) {
      if (Object.keys(utmParams).length > 0) {
        console.log('Final UTM params:', utmParams);
      } else {
        console.warn('No UTM parameters found after all attempts');
      }
    }
    
    return utmParams;
  } catch (error) {
    if (!import.meta.env.PROD) {
      console.error('Error getting UTM params:', error);
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
    console.warn('testUtmTracking should only be used in development mode');
    return;
  }
  
  console.log('Testing UTM tracking with params:', utmParams);
  
  // Сохраняем текущий URL
  const originalUrl = window.location.href;
  const originalSearch = window.location.search;
  
  // Создаем временный объект URL для добавления UTM-параметров
  try {
    // Создаем фейковый объект history.pushState
    const mockPushState = () => {
      // Mock pushState не меняет URL, но в консоли будет видно, что мы бы хотели изменить
      console.log('Would navigate to URL with UTM params:', 
        `${window.location.origin}${window.location.pathname}?${Object.entries(utmParams)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&')}`
      );
    };
    
    // Добавляем UTM-параметры в объект window.location для тестирования
    // Это не меняет реальный URL, но позволяет нашему коду getUtmParams найти параметры
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        search: `?${Object.entries(utmParams)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&')}`,
        href: `${window.location.origin}${window.location.pathname}?${Object.entries(utmParams)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&')}`,
      }
    });
    
    // Вызываем saveVisitInfo с мокнутыми UTM-параметрами
    saveVisitInfo().then(() => {
      console.log('Test UTM tracking event sent');
      
      // Восстанавливаем оригинальный URL
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          ...window.location,
          search: originalSearch,
          href: originalUrl
        }
      });
    });
  } catch (error) {
    console.error('Error testing UTM tracking:', error);
    
    // Убеждаемся, что мы восстановили оригинальный URL в случае ошибки
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        search: originalSearch,
        href: originalUrl
      }
    });
  }
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
  
  // Сохраняем текущие параметры URL
  const originalSearch = window.location.search;
  const originalHref = window.location.href;
  
  try {
    // Добавляем startapp параметр в URL
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...window.location,
        search: `?startapp=${encodeURIComponent(startappValue)}`,
        href: `${window.location.origin}${window.location.pathname}?startapp=${encodeURIComponent(startappValue)}`
      }
    });
    
    // Мокаем параметры Telegram WebApp если возможно
    if (window.Telegram?.WebApp) {
      const originalInitDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
      
      // Подменяем start_param в initDataUnsafe
      Object.defineProperty(window.Telegram.WebApp, 'initDataUnsafe', {
        value: {
          ...originalInitDataUnsafe,
          start_param: startappValue
        },
        writable: true
      });
      
      // Проверяем наличие startParams и подменяем его
      const hasStartParams = 'startParams' in window.Telegram.WebApp;
      const originalStartParams = hasStartParams ? (window.Telegram.WebApp as any).startParams : null;
      
      // Подменяем startParams если он существует
      if (hasStartParams) {
        Object.defineProperty(window.Telegram.WebApp, 'startParams', {
          value: startappValue,
          writable: true
        });
      }
      
      // Тестируем извлечение UTM-параметров
      console.log('Получаем UTM-параметры из startapp...');
      const utmParams = getUtmParams();
      console.log('Извлеченные UTM-параметры:', utmParams);
      
      // Тестируем сохранение визита с этими параметрами
      console.log('Тестируем сохранение визита с этими UTM-параметрами...');
      saveVisitInfo().then(() => {
        // Восстанавливаем оригинальные значения
        Object.defineProperty(window.Telegram.WebApp, 'initDataUnsafe', {
          value: originalInitDataUnsafe,
          writable: true
        });
        
        if (hasStartParams) {
          Object.defineProperty(window.Telegram.WebApp, 'startParams', {
            value: originalStartParams,
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
      // Если Telegram WebApp недоступен, тестируем только через URL
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
    
    // Восстанавливаем оригинальный URL в случае ошибки
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