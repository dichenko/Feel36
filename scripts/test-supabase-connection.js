#!/usr/bin/env node

// Скрипт для тестирования соединения с Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Получаем URL и ключ из переменных окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Проверяем наличие необходимых переменных
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error('Required variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  console.error('\nPlease check your .env file or Vercel environment variables.');
  process.exit(1);
}

// Создаем клиент Supabase
console.log(`Connecting to Supabase at ${supabaseUrl}...`);
const supabase = createClient(supabaseUrl, supabaseKey);

// Функция для тестирования таблицы user_visits
async function testUserVisitsTable() {
  // Получаем информацию о структуре таблицы
  const { data: columns, error: columnsError } = await supabase
    .from('user_visits')
    .select('*')
    .limit(1);

  if (columnsError) {
    console.error('Error accessing user_visits table:', columnsError.message);
    if (columnsError.message.includes('does not exist')) {
      console.error('\nTable "user_visits" does not exist. Please create it using the SQL migration:');
      console.error('- Run the SQL from supabase/migrations/create_user_visits_table.sql in your Supabase SQL editor');
    }
    return false;
  }

  // Проверяем наличие полей для UTM-меток
  const requiredFields = [
    'tg_id',
    'timestamp',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'visit_count',
    'user_data'
  ];

  // Если нет данных, получаем информацию о структуре таблицы
  if (!columns || columns.length === 0) {
    const { data: tableInfo, error: tableInfoError } = await supabase.rpc('get_table_info', {
      table_name: 'user_visits'
    });

    if (tableInfoError) {
      console.error('Error getting table info:', tableInfoError.message);
      
      // Попробуем получить информацию о таблице другим способом
      console.log('Trying to get column information from metadata...');
      
      // Вставляем тестовую запись с всеми необходимыми полями
      const testRecord = {
        tg_id: 'test_script',
        timestamp: new Date().toISOString(),
        utm_source: 'test_script',
        utm_medium: 'test_script',
        utm_campaign: 'test_script',
        utm_content: 'test_script',
        utm_term: 'test_script',
        visit_count: 0,
        user_data: {}
      };
      
      try {
        const { error: insertError } = await supabase
          .from('user_visits')
          .insert([testRecord]);
        
        if (insertError) {
          console.error('Failed to insert test record:', insertError.message);
          // Проверяем сообщение об ошибке для определения отсутствующих полей
          if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
            const missingField = insertError.message.match(/column "(.*?)" does not exist/);
            if (missingField && missingField[1]) {
              console.error(`\nTable is missing column: ${missingField[1]}`);
              console.error('Please update your table structure using the SQL migration.');
            }
          }
          return false;
        }
        
        // Удаляем тестовую запись
        await supabase
          .from('user_visits')
          .delete()
          .eq('tg_id', 'test_script');
        
        console.log('Test record inserted and deleted successfully!');
        return true;
      } catch (err) {
        console.error('Unexpected error during test record insertion:', err);
        return false;
      }
    }
    
    // Проверяем наличие необходимых полей в метаданных таблицы
    if (tableInfo && tableInfo.length > 0) {
      const columnNames = tableInfo.map(col => col.column_name);
      const missingFields = requiredFields.filter(field => !columnNames.includes(field));
      
      if (missingFields.length > 0) {
        console.error(`\nTable is missing the following columns: ${missingFields.join(', ')}`);
        console.error('Please update your table structure using the SQL migration.');
        return false;
      }
      
      console.log('✅ Table structure verified - all required columns found');
      return true;
    }
  } else {
    // Если есть данные, проверяем наличие полей в первой записи
    const record = columns[0];
    const missingFields = requiredFields.filter(field => !(field in record));
    
    if (missingFields.length > 0) {
      console.error(`\nTable is missing the following columns: ${missingFields.join(', ')}`);
      console.error('Please update your table structure using the SQL migration.');
      return false;
    }
    
    console.log('✅ Table structure verified - all required columns found');
    return true;
  }
  
  return true;
}

// Тестируем соединение
async function testConnection() {
  try {
    // Пробуем выполнить простой запрос
    console.log('Testing connection to user_visits table...');
    const { data, error, count } = await supabase
      .from('user_visits')
      .select('id', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      if (error.message.includes('does not exist')) {
        console.error('\nTable "user_visits" does not exist. Please create it using the SQL migration:');
        console.error('- Run the SQL from supabase/migrations/create_user_visits_table.sql in your Supabase SQL editor');
      }
      process.exit(1);
    }

    console.log('✅ Successfully connected to Supabase');
    console.log(`✅ Table "user_visits" contains ${count} records`);
    
    // Тестируем структуру таблицы
    console.log('\nTesting table structure...');
    const tableStructureOk = await testUserVisitsTable();
    
    if (!tableStructureOk) {
      console.warn('⚠️ Table structure test failed or incomplete');
    }
    
    // Проверяем политики доступа
    console.log('\nChecking Row Level Security policies...');
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies').maybeSingle();
    
    if (policiesError) {
      console.warn('⚠️ Unable to check RLS policies:', policiesError.message);
      console.warn('⚠️ Make sure Row Level Security is properly configured for user_visits table');
    } else if (policies) {
      const userVisitsPolicies = policies.filter(p => p.table === 'user_visits');
      if (userVisitsPolicies.length === 0) {
        console.warn('⚠️ No policies found for user_visits table. Anonymous inserts may not be allowed.');
      } else {
        console.log(`✅ Found ${userVisitsPolicies.length} policies for user_visits table`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

testConnection(); 