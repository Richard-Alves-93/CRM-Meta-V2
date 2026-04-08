import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/modules/auth/hooks/useAuth";
import { useEffect } from "react";
import Index from "./pages/Index";
import Login from "@/modules/auth/pages/Login";
import NotFound from "./pages/NotFound";
import { usePersistRoute } from "@/hooks/usePersistRoute";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminMasterRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;
  if (!user || role !== 'master_admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};



const DynamicPwaSetup = () => {
  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        // Força buscar nova versão
        registration.update();
      }).catch(error => {
        console.error('Service Worker registration failed:', error);
      });

      // Busca por qualquer registro pré-existente e manda atualizar também (fallback)
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.update());
      });
    }

    // 2. Generate dynamic manifest
    const initDynamicManifest = () => {
      const customLogo = localStorage.getItem('crm_custom_logo');
      const primaryColor = localStorage.getItem('crm_custom_primary_color') || '#3b82f6';
      
      const manifest = {
        name: "CRM Dashboard",
        short_name: "CRM",
        description: "Dashboard de Gerenciamento de Metas e Lançamentos",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: primaryColor,
        icons: [
          {
            src: customLogo || "/placeholder.svg",
            sizes: "192x192 512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      };

      const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link') as HTMLLinkElement;
        link.rel = 'manifest';
        document.head.appendChild(link);
      }
      link.href = manifestUrl;
    };

    initDynamicManifest();

    // Listen to changes in localStorage from other tabs or components
    window.addEventListener('storage', (e) => {
      if (e.key === 'crm_custom_logo' || e.key === 'crm_custom_primary_color') {
        initDynamicManifest();
      }
    });
  }, []);

  return null;
};

const PersistRouteManager = () => {
  const { user } = useAuth();
  usePersistRoute(Boolean(user));
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DynamicPwaSetup />
      <BrowserRouter>
        <AuthProvider>
          <PersistRouteManager />
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/admin/*" element={<AdminMasterRoute><Index /></AdminMasterRoute>} />
            <Route path="/*" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
