#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: join(rootDir, '.env.local') });
dotenv.config({ path: join(rootDir, '.env') });

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
const migrationFiles = [
  'create_user_visits_table.sql',
  'create_daily_records_table.sql',
];

if (!connectionString) {
  console.error('Missing POSTGRES_URL_NON_POOLING or POSTGRES_URL.');
  process.exit(1);
}

// Supabase's direct connection may include a provider-managed certificate
// chain that Node cannot validate locally. Keep the exception scoped to this
// database client instead of disabling TLS verification process-wide.
const databaseUrl = new URL(connectionString);
databaseUrl.searchParams.delete('sslmode');

const client = new pg.Client({
  connectionString: databaseUrl.toString(),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('feelme36:migrations'))");

  for (const migrationFile of migrationFiles) {
    const migrationPath = join(rootDir, 'supabase', 'migrations', migrationFile);
    const sql = await readFile(migrationPath, 'utf8');
    await client.query(sql);
    console.log(`Applied ${migrationFile}`);
  }

  await client.query('COMMIT');
  console.log('Supabase migrations completed.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('Migration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
