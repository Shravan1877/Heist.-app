import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      // Logic for GitHub Codespaces / AI Studio connectivity
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : {
            port: 443,
            host: process.env.CODESPACE_NAME
              ? `${process.env.CODESPACE_NAME}-3000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
              : 'localhost',
          },
      allowedHosts: true, // Prevents 'Invalid Host Header' errors on proxy
    },
  };
});