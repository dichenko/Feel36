#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

dotenv.config({ path: join(rootDir, '.env.local') });
dotenv.config({ path: join(rootDir, '.env') });

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('Missing POSTGRES_URL_NON_POOLING or POSTGRES_URL in environment');
  process.exit(1);
}

const migrationPath = join(rootDir, 'supabase', 'migrations', 'create_daily_records_table.sql');
const sql = readFileSync(migrationPath, 'utf8');

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// pg may still verify certs when sslmode=require is in the connection string
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

try {
  await client.connect();
  await client.query(sql);
  console.log('Migration applied: daily_records table is ready');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  await client.end();
}
