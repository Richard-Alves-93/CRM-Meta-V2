import React, { useEffect, useState, useCallback } from 'react';
import { transporteService } from '@/services/transporteService';
import { Transporte, TransporteStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { APP_VERSION } from '@/config/version';
import { hexToHslStr } from '@/lib/colors';
import {
  LogOut, MapPin, MessageCircle, Clock, Truck,
  CheckCircle, RefreshCcw, AlertCircle, Navigation,
  Sun, Moon, Menu, X, Package
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusVariant: Record<TransporteStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AGUARDANDO:  'secondary',
  A_CAMINHO:   'default',
  CONCLUIDO:   'outline',
  CANCELADO:   'destructive',
  REAGENDADO:  'secondary',
};

const statusLabels: Record<TransporteStatus, string> = {
  AGUARDANDO:  'Aguardando',
  A_CAMINHO:   'A Caminho',
  CONCLUIDO:   'Concluído',
  CANCELADO:   'Cancelado',
  REAGENDADO:  'Reagendado',
};

const getSaudacao = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const isHoje = (dataHora: string) => {
  const d = new Date(dataHora);
  const hoje = new Date();
  return d.toDateString() === hoje.toDateString();
};

const isUrgente = (dataHora: string) => {
  const diff = new Date(dataHora).getTime() - Date.now();
  return diff > 0 && diff < 60 * 60 * 1000;
};

const formatHora = (dataHora: string) =>
  new Date(dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const formatDataHora = (dataHora: string) => {
  if (isHoje(dataHora)) return `Hoje às ${formatHora(dataHora)}`;
  const d = new Date(dataHora);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' às ' + formatHora(dataHora);
};

// ─── Componente Principal ───────────────────────────────────────────────────

export default function DriverDashboard() {
  const [transportes, setTransportes] = useState<Transporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const primeiroNome = (user?.user_metadata?.full_name || user?.email || 'Motorista').split(' ')[0];

  // ── Logo e cor personalizada (fonte: tabela tenants) ──────────────────
  const [customLogo, setCustomLogo] = useState<string | null>(
    () => localStorage.getItem('crm_custom_logo')
  );

  // Aplica a cor primária nas CSS vars
  const applyPrimaryColor = useCallback((hex: string) => {
    document.documentElement.style.setProperty('--primary', hexToHslStr(hex));
    document.documentElement.style.setProperty('--ring', hexToHslStr(hex));
    document.documentElement.style.setProperty('--sidebar-primary', hexToHslStr(hex));
    localStorage.setItem('crm_custom_primary_color', hex);
  }, []);

  useEffect(() => {
    // 1. Aplica do cache local imediatamente (evita flash de cor)
    const saved = localStorage.getItem('crm_custom_primary_color');
    if (saved) applyPrimaryColor(saved);

    // 2. Ouve mudanças em outras abas (mesma máquina)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'crm_custom_primary_color' && e.newValue) applyPrimaryColor(e.newValue);
      if (e.key === 'crm_custom_logo' && e.newValue) setCustomLogo(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyPrimaryColor]);

  useEffect(() => {
    // 3. Busca logo do user_metadata (fallback cross-device)
    const userLogo = user?.user_metadata?.logo_url;
    if (userLogo && userLogo !== customLogo) {
      setCustomLogo(userLogo);
      localStorage.setItem('crm_custom_logo', userLogo);
    }
  }, [user, customLogo]);

  useEffect(() => {
    // 4. Busca cor DIRETAMENTE DA TABELA TENANTS (fonte canônica cross-device)
    const carregarCorDoTenant = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) return;

      // Busca o tenant_id do profile do motorista
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', session.session.user.id)
        .single();

      console.log('[DriverDashboard] profile:', profile, profileErr);
      if (!profile?.tenant_id) return;

      // Busca apenas primary_color do tenant (logo_url não existe na tabela tenants)
      const { data: tenant, error: tenantErr } = await (supabase
        .from('tenants')
        .select('primary_color') as any)
        .eq('id', profile.tenant_id)
        .single();

      console.log('[DriverDashboard] tenant:', tenant, tenantErr);

      if (tenant?.primary_color) {
        console.log('[DriverDashboard] Aplicando cor do tenant:', tenant.primary_color);
        applyPrimaryColor(tenant.primary_color);
      }
    };

    carregarCorDoTenant();
  }, [applyPrimaryColor]);

  // ── Dados ───────────────────────────────────────────────────────────────

  const carregarTransportes = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const data = await transporteService.fetchMeusTransportes();
      setTransportes(data);
    } catch (err: any) {
      toast.error('Erro ao buscar Teles: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTransportes();

    const channel = supabase
      .channel('driver-transportes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transportes' }, () => {
        carregarTransportes(true);
      })
      .subscribe();

    const onFocus = () => carregarTransportes(true);
    window.addEventListener('focus', onFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', onFocus);
    };
  }, [carregarTransportes]);

  // ── Ações ──────────────────────────────────────────────────────────────

  const handleStatusChange = async (id: string, novoStatus: TransporteStatus) => {
    setAtualizando(id);
    try {
      await transporteService.updateStatus(id, novoStatus);
      toast.success('Status atualizado!');
      await carregarTransportes(true);
    } catch (err: any) {
      toast.error('Erro ao atualizar Tele: ' + err.message);
    } finally {
      setAtualizando(null);
    }
  };

  const openWaze = (endereco: string | null) => {
    if (!endereco) return toast.error('Endereço não informado.');
    window.open(`https://waze.com/ul?q=${encodeURIComponent(endereco)}`, '_blank');
  };

  const openWhatsApp = (numero: string | null, petNome: string) => {
    if (!numero) return toast.error('Telefone não informado.');
    const limpo = numero.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá! O motorista do CRM Dominus está a caminho para buscar ${petNome}. 🐾`);
    window.open(`https://wa.me/55${limpo}?text=${msg}`, '_blank');
  };

  // ── Derivados ──────────────────────────────────────────────────────────

  const ativas    = transportes.filter(t => ['AGUARDANDO', 'A_CAMINHO'].includes(t.status));
  const conclHoje = transportes.filter(t => t.status === 'CONCLUIDO' && isHoje(t.data_hora));
  const futuras   = transportes.filter(t => !['AGUARDANDO', 'A_CAMINHO'].includes(t.status) && !isHoje(t.data_hora));

  // ── Sidebar simplificada do motorista ────────────────────────────────

  const Sidebar = () => (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`
        fixed left-0 top-0 h-screen w-[220px] bg-card border-r border-border flex flex-col justify-between z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo — mesmo padrão do CrmSidebar */}
        <div className="flex items-center justify-between px-5 py-5 h-[80px] border-b border-border">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSidebarOpen(false)}>
            {customLogo ? (
              <img src={customLogo} alt="Logo CRM" className="max-h-10 w-auto max-w-[160px] object-contain" />
            ) : (
              <img
                src="/logo-full.png"
                alt="CRM Pets Logo"
                className="max-h-9 w-auto max-w-full object-contain brightness-0 dark:brightness-100 invert-1 dark:invert-0"
              />
            )}
          </div>
          <button className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 flex-1 pt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-primary/10 text-primary">
            <Truck size={18} />
            Minhas Teles
          </div>

          {/* Contadores rápidos */}
          <div className="mt-3 px-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Pendentes</span>
              <Badge variant="secondary" className="text-xs">{ativas.length}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Concluídas hoje</span>
              <Badge variant="outline" className="text-xs">{conclHoje.length}</Badge>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 pb-5 pt-3 border-t border-border space-y-2">
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground mb-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
              {primeiroNome[0]?.toUpperCase()}
            </div>
            <span className="truncate">{primeiroNome}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleTheme} title="Alternar tema">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => carregarTransportes()} title="Recarregar">
              <RefreshCcw size={15} />
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 gap-2 text-muted-foreground hover:text-destructive justify-start px-2 h-8" onClick={signOut}>
              <LogOut size={14} />
              <span className="text-xs">Sair</span>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center pt-1">V {APP_VERSION}</p>
        </div>
      </aside>
    </>
  );

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Truck className="w-10 h-10 animate-bounce text-primary" />
          <p className="text-sm">Carregando suas Teles...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      {/* Conteúdo principal */}
      <div className="flex-1 md:ml-[220px] flex flex-col">

        {/* Header mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Truck className="w-4 h-4 text-primary" />
            Minhas Teles
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => carregarTransportes()}>
            <RefreshCcw size={16} />
          </Button>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-4 md:p-6 space-y-6 max-w-3xl">

          {/* Saudação */}
          <div>
            <h1 className="text-xl font-semibold text-foreground">{getSaudacao()}, {primeiroNome}! 👋</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {ativas.length > 0
                ? `Você tem ${ativas.length} Tele${ativas.length > 1 ? 's' : ''} pendente${ativas.length > 1 ? 's' : ''} hoje`
                : 'Nenhuma Tele pendente. Você está em dia!'}
            </p>
          </div>

          {/* ── Teles Ativas (todas com ações completas) ─────────── */}
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Teles Ativas {ativas.length > 0 && <span className="ml-1 text-primary">({ativas.length})</span>}
            </h2>

            {ativas.length > 0 ? (
              <div className="space-y-4">
                {ativas.map((v, idx) => (
                  <Card
                    key={v.id}
                    className={`border-2 shadow-md ${
                      idx === 0 && isUrgente(v.data_hora)
                        ? 'border-amber-400 animate-pulse'
                        : idx === 0
                        ? 'border-primary/30'
                        : 'border-border'
                    }`}
                  >
                    {/* Barra de tipo */}
                    <div className={`h-1 w-full rounded-t-xl ${v.tipo === 'BUSCA' ? 'bg-blue-500' : 'bg-orange-500'}`} />

                    <CardHeader className="pb-2 pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${v.tipo === 'BUSCA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'}`}>
                              {v.tipo === 'BUSCA' ? '🐾 Busca' : '📦 Entrega'}
                            </span>
                            {isUrgente(v.data_hora) && (
                              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Urgente
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-lg">{v.pet_nome}</CardTitle>
                          <p className="text-sm text-muted-foreground">{v.cliente_nome}</p>
                        </div>
                        <Badge variant={statusVariant[v.status]}>{statusLabels[v.status]}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{formatDataHora(v.data_hora)}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="leading-snug">{v.endereco_transporte || 'Endereço não cadastrado'}</span>
                        </div>
                        {v.observacoes && (
                          <div className="text-xs text-muted-foreground bg-secondary rounded-lg p-2">
                            📝 {v.observacoes}
                          </div>
                        )}
                      </div>

                      {/* Ações de comunicação */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="gap-2" onClick={() => openWaze(v.endereco_transporte)}>
                          <Navigation className="w-4 h-4" /> Navegar
                        </Button>
                        <Button variant="outline" className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={() => openWhatsApp(v.cliente_whatsapp || null, v.pet_nome)}>
                          <MessageCircle className="w-4 h-4" /> Avisar
                        </Button>
                      </div>

                      {/* Ação de status */}
                      <div className="border-t border-border pt-3">
                        {v.status === 'AGUARDANDO' && (
                          <Button className="w-full gap-2" size="lg" disabled={atualizando === v.id}
                            onClick={() => handleStatusChange(v.id, 'A_CAMINHO')}>
                            <Truck className="w-4 h-4" />
                            {atualizando === v.id ? 'Atualizando...' : 'Sair para o destino'}
                          </Button>
                        )}
                        {v.status === 'A_CAMINHO' && (
                          <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white" size="lg"
                            disabled={atualizando === v.id}
                            onClick={() => handleStatusChange(v.id, 'CONCLUIDO')}>
                            <CheckCircle className="w-4 h-4" />
                            {atualizando === v.id ? 'Finalizando...' : 'Marcar como Concluída'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                  <p className="text-foreground font-medium">Nenhuma Tele pendente 🎉</p>
                  <p className="text-muted-foreground text-sm mt-1">Você está em dia!</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* ── Teles Concluídas Hoje ──────── */}
          {conclHoje.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Teles Concluídas Hoje</h2>
              <div className="space-y-2">
                {conclHoje.map(v => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card opacity-60">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{v.pet_nome}</p>
                      <p className="text-xs text-muted-foreground">{formatHora(v.data_hora)} • {v.tipo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Teles dos Próximos Dias ────── */}
          {futuras.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Teles dos Próximos Dias</h2>
              <div className="space-y-2">
                {futuras.map(v => (
                  <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                    <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{v.pet_nome}</p>
                      <p className="text-xs text-muted-foreground">{formatDataHora(v.data_hora)} • {v.tipo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="h-6" />
        </main>
      </div>
    </div>
  );
}
