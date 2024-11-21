import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd());

  return {
    base: './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name][extname]',
          chunkFileNames: 'assets/[name].js',
          entryFileNames: 'assets/[name].js',
        },
      },
    },
    server: {
      port: 5000,
      host: true, // Needed for proper network access
    },
    define: {
      'process.env': env, // Pass all loaded .env variables to the app
    },
  };
});
