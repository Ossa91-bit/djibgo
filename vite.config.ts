import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh
      fastRefresh: true,
    }),
  ],
  base: '/',
  define: {
    __BASE_PATH__: JSON.stringify('/'),
  },
  build: {
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['react-i18next', 'i18next'],
          'booking': [
            './src/components/booking/BookingModal.tsx',
            './src/components/booking/PaymentMethodModal.tsx',
          ],
          'dashboard': [
            './src/pages/dashboard/page.tsx',
            './src/pages/dashboard/components/ClientDashboard.tsx',
            './src/pages/dashboard/components/ProfessionalDashboard.tsx',
          ],
          'admin': [
            './src/pages/admin-dashboard/page.tsx',
          ],
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          const ext = info?.[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|ttf|eot/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        passes: 3,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_proto: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    cssCodeSplit: true,
    cssMinify: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 800,
    assetsInlineLimit: 8192,
    copyPublicDir: true,
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'react-i18next', 'i18next'],
    exclude: [],
  },
  server: {
    port: 3000,
    strictPort: false,
    hmr: {
      overlay: true,
    },
  },
  publicDir: 'public',
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    target: 'es2015',
  },
});
