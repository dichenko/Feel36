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

// Инициализация Supabase клиента
// Эти значения заданы на Vercel
const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Создаем клиент Supabase только если есть необходимые переменные окружения
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
    return userData?.id?.toString() || '';
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
  // Если Supabase не инициализирован, просто игнорируем сохранение
  if (!supabase) {
    return;
  }

  // Запускаем сохранение в фоновом режиме
  setTimeout(async () => {
    try {
      // Получаем ID пользователя Telegram
      const tgId = getTelegramUserId();
      
      // Если ID не найден, не сохраняем данные
      if (!tgId) {
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
      
      // Вставляем данные в таблицу user_visits
      await supabase
        .from('user_visits')
        .insert([visitData]);
    } catch {
      // Игнорируем все ошибки при сохранении
    }
  }, 0); // Запускаем в следующем тике event loop
}; 