import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Vite configuration - Last Updated: 2026-04-08 (Emergency Reset)
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appVersion = env.VITE_APP_VERSION || process.env.npm_package_version || "0.0.0";
  const effectiveAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
      __APP_VERSION__: JSON.stringify(appVersion),
      ...(effectiveAnonKey
        ? {
            "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(effectiveAnonKey),
          }
        : {}),
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
