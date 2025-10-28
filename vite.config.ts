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
  },
}));
