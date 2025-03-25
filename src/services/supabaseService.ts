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

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are not set in environment variables');
  console.error('Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel settings');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

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
    
    console.log('UTM params:', utmParams);
    return utmParams;
  } catch (error) {
    console.error('Error getting UTM params:', error);
    return {};
  }
};

// Безопасное получение данных о пользователе из Telegram WebApp
export const getTelegramUserData = (): Record<string, any> => {
  try {
    if (!window.Telegram?.WebApp) {
      console.warn('Telegram WebApp is not available');
      return {};
    }
    
    const tg = window.Telegram.WebApp;
    let userData: Record<string, any> = {};
    
    // Безопасное получение initData
    const initDataStr = tg.initData || '';
    console.log('Telegram initData:', initDataStr);
    
    if (initDataStr) {
      try {
        // Parse initData если оно в формате URLSearchParams
        const data = new URLSearchParams(initDataStr);
        
        // Получаем данные пользователя из параметра user если он существует
        const userStr = data.get('user');
        if (userStr) {
          try {
            userData = JSON.parse(userStr);
            console.log('Parsed user data:', userData);
          } catch (e) {
            console.error('Failed to parse user data:', e);
          }
        }
        
        // Также сохраняем все параметры initData
        data.forEach((value, key) => {
          if (key !== 'user') { // Избегаем дублирования пользовательских данных
            userData[key] = value;
          }
        });
      } catch (e) {
        console.error('Failed to parse initData:', e);
      }
    }

    // Добавляем параметры темы
    if (tg.themeParams) {
      userData.themeParams = tg.themeParams;
      console.log('Theme params:', tg.themeParams);
    }
    
    return userData;
  } catch (error) {
    console.error('Error getting Telegram user data:', error);
    return {};
  }
};

// Получить ID пользователя Telegram
export const getTelegramUserId = (): string => {
  try {
    const userData = getTelegramUserData();
    const userId = userData?.id?.toString() || '';
    console.log('Telegram user ID:', userId);
    return userId;
  } catch (e) {
    console.error('Failed to get Telegram user ID:', e);
    return '';
  }
};

// Получить счетчик посещений из localStorage
export const getVisitCount = (): number => {
  try {
    const count = localStorage.getItem('visit_count');
    const parsedCount = count ? parseInt(count, 10) : 0;
    console.log('Current visit count:', parsedCount);
    return parsedCount;
  } catch (error) {
    console.error('Error getting visit count:', error);
    return 0;
  }
};

// Увеличить счетчик посещений
export const incrementVisitCount = (): number => {
  try {
    const currentCount = getVisitCount();
    const newCount = currentCount + 1;
    localStorage.setItem('visit_count', newCount.toString());
    console.log('Incremented visit count:', newCount);
    return newCount;
  } catch (error) {
    console.error('Error incrementing visit count:', error);
    return 1;
  }
};

// Сохранить информацию о визите в Supabase
export const saveVisitInfo = async (): Promise<void> => {
  try {
    console.log('Starting to save visit info...');
    
    // Получаем ID пользователя Telegram
    const tgId = getTelegramUserId();
    
    // Если ID не найден, не сохраняем данные
    if (!tgId) {
      console.warn('Telegram user ID not found. Visit data not saved.');
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
    
    console.log('Prepared visit data:', visitData);
    
    // Вставляем данные в таблицу user_visits
    const { error } = await supabase
      .from('user_visits')
      .insert([visitData]);
    
    if (error) {
      console.error('Error saving visit info:', error);
    } else {
      console.log('Visit info saved successfully');
    }
  } catch (error) {
    console.error('Failed to save visit info:', error);
  }
}; 