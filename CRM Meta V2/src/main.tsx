import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const STORAGE_RESET_KEY = 'crm_supabase_session_reset_v3';
const isOAuthCallback = window.location.search.includes('access_token=') || 
                        window.location.search.includes('code=') || 
                        window.location.search.includes('provider=') ||
                        window.location.hash.includes('access_token=') || 
                        window.location.hash.includes('provider=');

if (!localStorage.getItem(STORAGE_RESET_KEY) && !isOAuthCallback) {
  console.warn('[Auth] Limpando localStorage e sessionStorage para restaurar conexão Supabase.');
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem(STORAGE_RESET_KEY, '1');
}

createRoot(document.getElementById("root")!).render(<App />);
