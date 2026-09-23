import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Support legacy Vercel variable names while exposing only values that are
  // explicitly safe for the browser bundle.
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL
    || env.NEXT_PUBLIC_SUPABASE_URL
    || env.SUPABASE_URL
    || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY
    || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || env.SUPABASE_ANON_KEY
    || '';

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
          manualChunks: undefined,
        },
      },
    },
    server: {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/javascript; charset=utf-8',
      },
    },
    base: './',
  }
});
