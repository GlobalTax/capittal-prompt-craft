import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: process.env.LOVABLE ? false : undefined,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Eliminar console.log, console.error, etc. en producción
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    // Minificar mejor en producción
    minify: mode === 'production' ? 'esbuild' : false,
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        // Hash todos los chunks para cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        // Manual chunks para optimizar bundle splitting
        manualChunks: {
          // Vendor chunks - React ecosystem
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
          ],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // Feature chunks - lazy loaded
          'charts': ['recharts'],
          'pdf': ['@react-pdf/renderer'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'dates': ['date-fns'],
        },
      },
    },
  },
}));
