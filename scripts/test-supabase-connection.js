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