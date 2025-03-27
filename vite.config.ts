import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем env файлы в зависимости от режима (development/production)
  const env = loadEnv(mode, process.cwd(), '');

  // Собираем все переменные Supabase из окружения
  const vercelEnvVars = Object.keys(env)
    .filter(key => 
      key.includes('SUPABASE') || 
      key.includes('NEXT_PUBLIC_SUPABASE')
    )
    .reduce<Record<string, string>>((obj, key) => {
      obj[key] = env[key];
      return obj;
    }, {});

  return {
    plugins: [react()],
    optimizeDeps: {
      include: ['react-transition-group'],
      exclude: ['lucide-react'],
    },
    define: {
      // Делаем переменные окружения Vercel доступными через import.meta.env
      ...vercelEnvVars && Object.keys(vercelEnvVars).length > 0
        ? Object.fromEntries(
            Object.entries(vercelEnvVars).map(([key, value]) => [
              `import.meta.env.${key}`,
              JSON.stringify(value)
            ])
          )
        : {},
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
