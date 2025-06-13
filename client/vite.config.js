import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // ✅ добавляем path

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // ✅ алиас @ на src
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000/api/v1',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
