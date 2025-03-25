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
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};
    
    ['source', 'medium', 'campaign', 'content', 'term'].forEach(param => {
      const value = urlParams.get(`utm_${param}`);
      if (value) {
        utmParams[`utm_${param}`] = value;
      }
    });
    
    return utmParams;
  } catch {
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
    console.log('Attempting to save visit info...');
    console.log('Supabase client initialized:', !!supabase);
  }
  
  // Если Supabase не инициализирован, просто игнорируем сохранение
  if (!supabase) {
    if (isDevMode) {
      console.warn('Supabase client not initialized. Unable to save visit info.');
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
          console.warn('Telegram user ID not found. Visit data not saved.');
        }
        return;
      }
      
      // Получаем UTM-метки
      const utmParams = getUtmParams();
      
      // Получаем данные пользователя
      const userData = getTelegramUserData();
      
      // Увеличиваем счетчик визитов
      const visitCount = incrementVisitCount();
      
      // Создаем объект для вставки в БД
      const visitData: UserVisit = {
        tg_id: tgId,
        timestamp: new Date().toISOString(),
        visit_count: visitCount,
        user_data: userData,
        ...utmParams
      };
      
      if (isDevMode) {
        console.log('Visit data to be saved:', visitData);
      }
      
      // Вставляем данные в таблицу user_visits
      const { error } = await supabase
        .from('user_visits')
        .insert([visitData]);
        
      if (error && isDevMode) {
        console.error('Error saving visit info:', error);
      } else if (isDevMode) {
        console.log('Visit info saved successfully!');
      }
    } catch (error) {
      // Игнорируем все ошибки при сохранении
      if (isDevMode) {
        console.error('Failed to save visit info:', error);
      }
    }
  }, 0); // Запускаем в следующем тике event loop
}; 