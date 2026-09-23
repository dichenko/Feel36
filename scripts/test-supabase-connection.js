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

const expectedColumns = [
  'id',
  'tg_id',
  'timestamp',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'visit_count',
  'user_data',
  'created_at',
];

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

  // Inspect PostgREST's OpenAPI document instead of inserting and deleting a
  // synthetic user_visits record.
  const schemaResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!schemaResponse.ok) {
    throw new Error(`PostgREST schema check failed: ${schemaResponse.status} ${schemaResponse.statusText}`);
  }

  const schema = await schemaResponse.json();
  const visitDefinition = schema.definitions?.user_visits;
  if (!visitDefinition) {
    throw new Error('user_visits is not exposed to the anonymous PostgREST role');
  }

  const availableColumns = Object.keys(visitDefinition.properties ?? {});
  const missingColumns = expectedColumns.filter(column => !availableColumns.includes(column));
  if (missingColumns.length > 0) {
    throw new Error(`user_visits is missing columns: ${missingColumns.join(', ')}`);
  }

  console.log(`Supabase is reachable; daily_records contains ${dailyResult.count ?? 0} row(s).`);
  console.log('user_visits schema contains all required columns.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
