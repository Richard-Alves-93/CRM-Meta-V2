import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/modules/auth/hooks/useAuth";
import Index from "./pages/Index";
import Login from "@/modules/auth/pages/Login";
import DriverDashboard from "./pages/DriverDashboard";

const queryClient = new QueryClient();

// Rota protegida genérica (qualquer usuário logado)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  // Redireciona motoristas para seu painel específico
  if (role === 'driver') return <Navigate to="/motorista" replace />;
  return <>{children}</>;
};

// Rota exclusiva para motoristas
const DriverRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== 'driver') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminMasterRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;
  if (!user || role !== 'master_admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="text-muted-foreground">Carregando...</span></div>;
  if (user && role === 'driver') return <Navigate to="/motorista" replace />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/motorista" element={<DriverRoute><DriverDashboard /></DriverRoute>} />
            <Route path="/admin/*" element={<AdminMasterRoute><Index /></AdminMasterRoute>} />
            <Route path="/*" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster />
      <Sonner />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
