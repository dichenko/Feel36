# Инструкция по настройке UTM-трекинга в Telegram mini-app

## Обзор функциональности

Данная функциональность позволяет отслеживать:
1. UTM-метки, с которыми пользователи переходят в приложение
2. Данные пользователя Telegram
3. Количество посещений приложения каждым пользователем
4. Метки времени для каждого посещения

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

## Как передавать UTM-метки

Для отслеживания источников трафика, добавьте UTM-параметры к URL вашего mini-app:

```
https://t.me/ваш_бот?startapp=&utm_source=instagram&utm_medium=post&utm_campaign=spring_promo
```

Поддерживаемые UTM-параметры:
- utm_source - источник трафика (Instagram, Facebook, VK и т.д.)
- utm_medium - тип маркетингового канала (post, story, email, cpc и т.д.)
- utm_campaign - название кампании
- utm_content - детали содержимого (для A/B тестирования разных версий)
- utm_term - ключевые слова (для поисковых кампаний)

## Структура таблицы в Supabase

Таблица `user_visits` содержит следующие поля:
- id - уникальный UUID записи
- tg_id - ID пользователя Telegram
- timestamp - время посещения
- utm_source - источник трафика
- utm_medium - тип маркетингового канала
- utm_campaign - название кампании
- utm_content - детали содержимого
- utm_term - ключевые слова
- visit_count - порядковый номер посещения
- user_data - полные данные о пользователе в JSON формате
- created_at - время создания записи

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