#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL
  || process.env.NEXT_PUBLIC_SUPABASE_URL
  || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing public Supabase URL or anonymous key.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

try {
  console.log(`Checking Supabase at ${new URL(supabaseUrl).hostname}...`);

  // daily_records is intentionally readable by anon and is therefore a safe,
  // non-mutating connectivity check.
  const dailyResult = await supabase
    .from('daily_records')
    .select('id', { count: 'exact', head: true });

  if (dailyResult.error) {
    throw new Error(`daily_records check failed: ${dailyResult.error.message}`);
  }

  console.log(`Supabase is reachable; daily_records contains ${dailyResult.count ?? 0} row(s).`);
  console.log('user_visits is intentionally not read by the anonymous role.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
