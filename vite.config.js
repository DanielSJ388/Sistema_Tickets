import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './Frontend',
  
  server: {
    port: 3000,
    open: false, // Deshabilitado para evitar errores con el navegador
    proxy: {
      // Redirigir todas las llamadas API al backend
      '/tickets': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/register': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'Frontend/index.html'),
        main: resolve(__dirname, 'Frontend/dashboard.html'),
        auth: resolve(__dirname, 'Frontend/auth.html'),
        listTicket: resolve(__dirname, 'Frontend/list-ticket.html'),
        sendTicket: resolve(__dirname, 'Frontend/send_ticket.html'),
        testLogin: resolve(__dirname, 'Frontend/test_login.html'),
        debugStorage: resolve(__dirname, 'Frontend/debug_storage.html'),
      }
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './Frontend'),
      '@assets': resolve(__dirname, './Frontend/assets'),
      '@js': resolve(__dirname, './Frontend/assets/js'),
      '@css': resolve(__dirname, './Frontend/assets/css'),
    }
  }
});
