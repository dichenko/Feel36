# Инструкция по настройке UTM-трекинга в Telegram mini-app

## Обзор функциональности

Данная функциональность позволяет отслеживать:
1. UTM-метки, с которыми пользователи переходят в приложение
2. Данные пользователя Telegram
3. Количество посещений приложения каждым пользователем
4. Метки времени для каждого посещения

## Как правильно формировать UTM-метки для Telegram Mini App

### Формат ссылки:
```
https://t.me/FeelMe36_bot/feelme36?startapp=utm_source=instagram&utm_medium=post&utm_campaign=spring_promo
```

### Объяснение:
- `https://t.me/FeelMe36_bot/feelme36` - базовый URL Mini App
- `?startapp=` - параметр Telegram для передачи данных в Mini App
- `utm_source=instagram&utm_medium=post&utm_campaign=spring_promo` - UTM-метки, разделенные символом `&`

⚠️ **ВАЖНО**: Не используйте URL-кодирование (вроде `%3D` вместо `=` и `%26` вместо `&`) в параметрах, так как Telegram не воспринимает такие ссылки корректно. Приложение обрабатывает символы `&` и `=` в исходном виде.

### Поддерживаемые UTM-параметры:
- `utm_source` - источник трафика (Instagram, Facebook, VK и т.д.)
- `utm_medium` - тип маркетингового канала (post, story, email, cpc и т.д.)
- `utm_campaign` - название кампании
- `utm_content` - детали содержимого (для A/B тестирования разных версий)
- `utm_term` - ключевые слова (для поисковых кампаний)

### Альтернативный вариант (простая ссылка):
Если вам нужно передать только источник трафика, можно использовать упрощенный формат:
```
https://t.me/FeelMe36_bot/feelme36?startapp=instagram
```
В этом случае, значение параметра `startapp` будет автоматически записано как `utm_source`.

### Важно:
- Телеграм обрабатывает символы `&` и `=` в нативном формате, не заменяйте их на URL-кодированные аналоги (`%26` и `%3D`)
- Согласно документации Telegram, значение параметра `startapp` может содержать только символы: `A-Z`, `a-z`, `0-9`, `_` (подчеркивание), `-` (дефис) и специальные символы `&` и `=` для UTM-меток
- Максимальная длина параметра - 512 символов

## Настройка базы данных Supabase

1. Войдите в консоль Supabase
2. Перейдите в раздел "SQL Editor"
3. Создайте новый запрос и вставьте SQL из файла `supabase/migrations/create_user_visits_table.sql`
4. Выполните запрос для создания таблицы и настройки политик безопасности

## Настройка переменных окружения

Добавьте следующие переменные окружения в настройках Vercel:

```
VITE_SUPABASE_URL=https://ваш-проект.supabase.co
VITE_SUPABASE_ANON_KEY=ваш-публичный-ключ-supabase
```

## Структура таблицы в Supabase

Таблица `user_visits` содержит следующие поля:
- `id` - уникальный UUID записи
- `tg_id` - ID пользователя Telegram
- `timestamp` - время посещения
- `utm_source` - источник трафика
- `utm_medium` - тип маркетингового канала
- `utm_campaign` - название кампании
- `utm_content` - детали содержимого
- `utm_term` - ключевые слова
- `visit_count` - порядковый номер посещения
- `user_data` - полные данные о пользователе в JSON формате
- `created_at` - время создания записи

## Примеры рабочих ссылок с UTM-метками

1. Полная ссылка с несколькими UTM-параметрами:
```
https://t.me/FeelMe36_bot/feelme36?startapp=utm_source=instagram&utm_medium=post&utm_campaign=spring_promo
```

2. Ссылка только с источником и типом:
```
https://t.me/FeelMe36_bot/feelme36?startapp=utm_source=facebook&utm_medium=story
```

3. Простая ссылка с источником:
```
https://t.me/FeelMe36_bot/feelme36?startapp=vkontakte
```

## Анализ данных

Для анализа данных вы можете:
1. Использовать SQL-запросы в консоли Supabase
2. Экспортировать данные в CSV для анализа в Excel или других инструментах
3. Подключить внешние инструменты аналитики через Supabase API

## Примеры запросов для анализа

### Количество переходов по разным источникам
```sql
SELECT utm_source, COUNT(*) 
FROM user_visits 
GROUP BY utm_source 
ORDER BY COUNT(*) DESC;
```

### Активность пользователей по дням
```sql
SELECT DATE_TRUNC('day', timestamp) as day, COUNT(*) 
FROM user_visits 
GROUP BY day 
ORDER BY day;
```

### Новые пользователи по источникам
```sql
SELECT utm_source, COUNT(*) 
FROM user_visits 
WHERE visit_count = 1 
GROUP BY utm_source 
ORDER BY COUNT(*) DESC;
```

### Эффективность кампаний
```sql
SELECT 
  utm_campaign,
  COUNT(*) as visits,
  COUNT(DISTINCT tg_id) as unique_users
FROM user_visits 
WHERE utm_campaign IS NOT NULL
GROUP BY utm_campaign
ORDER BY visits DESC;
``` 