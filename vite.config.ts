import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(
        process.env.VITE_GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        '92444997475-pplpa69ma4mv6l6ubs1r65apboehdn9n.apps.googleusercontent.com'
      ),
    },
    build: {
      manifest: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const modulePath = id.replace(/\\/g, '/');
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(modulePath)) return 'react-vendor';
            if (/\/node_modules\/(motion|framer-motion|motion-dom|motion-utils)\//.test(modulePath)) return 'motion-vendor';
          },
        },
      },
    },
    resolve: {
      alias: {
        '@/components/ui': path.resolve(__dirname, 'src/components/ui'),
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/lib': path.resolve(__dirname, 'src/lib'),
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3005',
          changeOrigin: true
        }
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
