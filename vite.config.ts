import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis do ficheiro .env
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Essencial para o GitHub Pages
    base: './', 
    
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    
    plugins: [react()],
    
    define: {
      // Se ainda usar a Gemini API, esta linha garante que ela funciona no build
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    
    resolve: {
      alias: {
        // Atalho para facilitar imports
        '@': path.resolve(__dirname, './src'),
      }
    },
    
    build: {
      outDir: 'dist',
      // Garante que o build limpe a pasta antes de criar uma nova
      emptyOutDir: true,
    }
  };
});