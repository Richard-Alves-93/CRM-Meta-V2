import { useEffect, useState } from "react";
import { CrmDatabase, exportarDadosJSON, deleteMeta, deleteLancamento, addMeta, addLancamento } from "@/lib/crm-data";
import { hexToHslStr } from "@/lib/colors";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { supabase, STORAGE_BUCKET } from "@/integrations/supabase/client";
import { WorkSettingsSection } from "./WorkSettingsSection";
import { CompanyProfileSection } from "./CompanyProfileSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Clock, Database, Info, Image, Upload, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/modules/auth/hooks/useAuth";
import { SystemSettingsService } from "@/services/SystemSettingsService";

interface ConfiguracoesPageProps {
  db: CrmDatabase;
  onRefresh: () => Promise<void>;
}

const ConfiguracoesPage = ({ db, onRefresh }: ConfiguracoesPageProps) => {
  const [primaryColor, setPrimaryColor] = useState(
    localStorage.getItem('crm_custom_primary_color') || "#3b82f6"
  );
  const { user, tenantId, role, refreshProfile } = useAuth();
  const branding = useBranding();
  
  const [brandingFiles, setBrandingFiles] = useState<Record<string, File | null>>({
    logo_light: null,
    logo_dark: null,
    logo_login: null,
    favicon: null,
  });

  const [brandingPreviews, setBrandingPreviews] = useState<Record<string, string | null>>({
    logo_light: null,
    logo_dark: null,
    logo_login: null,
    favicon: null,
  });

  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({
    logo_light: false,
    logo_dark: false,
    logo_login: false,
    favicon: false,
  });

  const handleBrandingUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (brandingPreviews[type]) {
        URL.revokeObjectURL(brandingPreviews[type]!);
      }
      setBrandingFiles(prev => ({ ...prev, [type]: file }));
      setBrandingPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const handleRemoveBranding = async (type: string) => {
    try {
      if (confirm(`Deseja remover este item da identidade visual?`)) {
        const fieldName = `${type}_url`;
        
        if (role === 'master_admin') {
          await SystemSettingsService.updateSettings({ [fieldName]: null });
        } else if (tenantId) {
          await supabase.from('tenants').update({ [fieldName]: null }).eq('id', tenantId);
        }

        setBrandingFiles(prev => ({ ...prev, [type]: null }));
        if (brandingPreviews[type]) {
          URL.revokeObjectURL(brandingPreviews[type]!);
          setBrandingPreviews(prev => ({ ...prev, [type]: null }));
        }

        toast.success("Item removido com sucesso!");
        await refreshProfile();
        onRefresh();
      }
    } catch (err) {
      toast.error("Erro ao remover item.");
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPrimaryColor(val);
    localStorage.setItem('crm_custom_primary_color', val);
    document.documentElement.style.setProperty('--primary', hexToHslStr(val));
    document.documentElement.style.setProperty('--ring', hexToHslStr(val));
    document.documentElement.style.setProperty('--sidebar-primary', hexToHslStr(val));
    document.documentElement.style.setProperty('--sidebar-ring', hexToHslStr(val));

    if (tenantId) {
      supabase
        .from('tenants')
        .update({ primary_color: val } as any)
        .eq('id', tenantId)
        .then(({ error }) => {
          if (error) console.warn('[Config] Erro ao salvar cor no tenant:', error.message);
          refreshProfile();
        });
    }

    supabase.auth.updateUser({ data: { primary_color: val } }).catch(err => {
      console.warn('[Config] Erro ao salvar cor no user_metadata:', err);
    });
  };

  const handleSaveBranding = async (type: string) => {
    const file = brandingFiles[type];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, [type]: true }));
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const bucketName = STORAGE_BUCKET;

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
      const logoUrl = publicUrlData.publicUrl;
      const fieldName = type === 'logo_login' ? 'login_logo_url' : `${type}_url`;

      if (role === 'master_admin') {
        const success = await SystemSettingsService.updateSettings({ [fieldName]: logoUrl });
        if (!success) throw new Error("Erro ao atualizar configurações globais.");
      } else if (tenantId) {
        const { error: tenantErr } = await supabase.from('tenants').update({ [fieldName]: logoUrl }).eq('id', tenantId);
        if (tenantErr) throw tenantErr;
      }

      setBrandingFiles(prev => ({ ...prev, [type]: null }));
      toast.success(`${type.replace('_', ' ')} salvo com sucesso!`);
      await refreshProfile();
      onRefresh();
    } catch (err: any) {
      console.error('Erro ao salvar branding:', err);
      toast.error(`Erro ao salvar: ${err.message || 'Tente novamente'}`);
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleApplyAllBranding = async () => {
    const pendingTypes = Object.keys(brandingFiles).filter(type => brandingFiles[type] !== null);
    if (pendingTypes.length === 0) return;

    const tId = toast.loading("Aplicando nova identidade visual...");
    try {
      for (const type of pendingTypes) {
        await handleSaveBranding(type);
      }
      toast.dismiss(tId);
      toast.success("Toda a identidade visual foi aplicada com sucesso!");
      await refreshProfile();
    } catch (err) {
      toast.dismiss(tId);
      toast.error("Erro ao aplicar algumas alterações.");
    }
  };

  const hasPendingBranding = Object.values(brandingFiles).some(f => f !== null);

  useEffect(() => {
    return () => {
      Object.values(brandingPreviews).forEach(p => {
        if (p) URL.revokeObjectURL(p);
      });
    };
  }, []);

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Deseja restaurar este backup? Suas vendas e metas serão substituídas.")) {
      if (e.target) e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content);

        let metasToRestore = [];
        let lancamentosToRestore = [];

        if (backup.db) {
          metasToRestore = backup.db.metas || [];
          lancamentosToRestore = backup.db.lancamentos || [];
        } else {
          metasToRestore = backup.metas || [];
          lancamentosToRestore = backup.lancamentos || [];
        }

        for (const m of db.metas) { await deleteMeta(m.id); }
        for (const l of db.lancamentos) { await deleteLancamento(l.id); }

        for (const m of metasToRestore) { await addMeta(m.nome, m.valor, m.descricao || ''); }
        for (const l of lancamentosToRestore) { await addLancamento(l.data, l.valorBruto || l.valor_bruto || 0, l.desconto || 0); }

        toast.success("Backup restaurado!");
        await onRefresh();
      } catch (err: any) {
        console.error("Erro backup:", err);
        toast.error("Erro ao importar backup.");
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie dados e preferências do sistema.</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full space-y-6">
        <TabsList className="bg-card border border-border p-1 h-auto w-full sm:w-auto flex flex-wrap sm:flex-nowrap gap-1">
          <TabsTrigger value="perfil" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all rounded-lg">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Meu Perfil & Marca</span>
            <span className="sm:hidden">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="jornada" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Jornada de Trabalho</span>
            <span className="sm:hidden">Jornada</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all rounded-lg">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar & Importar</span>
            <span className="sm:hidden">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2 px-4 transition-all rounded-lg">
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Informações do Sistema</span>
            <span className="sm:hidden">Sistema</span>
          </TabsTrigger>
        </TabsList>

        <div className="rounded-xl border border-border bg-card shadow-sm min-h-[500px] overflow-hidden">
          <TabsContent value="perfil" className="p-6 m-0 outline-none animate-in fade-in-50 duration-300">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground">Meu Perfil Corporativo</h2>
              <p className="text-sm text-muted-foreground">Personalize a identidade da sua empresa e do sistema.</p>
            </div>
            
            <div className="space-y-8">
              <section className="rounded-xl border border-border bg-secondary/10 p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Informações Cadastrais
                </h3>
                <CompanyProfileSection />
              </section>

              <section className="rounded-xl border border-border bg-secondary/10 p-6 border-t-4 border-t-primary/20">
                <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <div className="p-1 rounded bg-primary/20">🎨</div>
                  Logo e Identidade Visual
                </h3>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { id: 'logo_login', label: 'Logo Área de Login', current: branding.logoLogin },
                      { id: 'logo_light', label: 'Logo Modo Claro (Alt)', current: branding.logoLight },
                      { id: 'logo_dark', label: 'Logo Modo Escuro', current: branding.logoDark },
                      { id: 'favicon', label: 'Ícone da Aba (Favicon)', current: branding.favicon },
                    ].map((item) => (
                      <div key={item.id} className="space-y-4 p-4 rounded-xl border border-border bg-background/50">
                        <label className="block text-sm font-semibold text-foreground/80">{item.label}</label>
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-card overflow-hidden relative group shrink-0">
                            {brandingPreviews[item.id] || item.current ? (
                              <img 
                                src={brandingPreviews[item.id] || item.current!} 
                                alt="Preview" 
                                className="max-h-full max-w-full object-contain p-1" 
                              />
                            ) : (
                              <Image className="w-6 h-6 text-muted-foreground/30" />
                            )}
                            {(brandingPreviews[item.id] || item.current) && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleRemoveBranding(item.id)} 
                                  className="p-1.5 bg-red-500 rounded-md text-white hover:bg-red-600 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <input 
                              type="file" 
                              id={`file-${item.id}`} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => handleBrandingUpload(e, item.id)} 
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-8 text-xs gap-2"
                              onClick={() => document.getElementById(`file-${item.id}`)?.click()}
                            >
                              <Upload size={14} /> {brandingPreviews[item.id] ? "Trocar Seleção" : "Escolher Arquivo"}
                            </Button>
                            {item.current && !brandingPreviews[item.id] && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                Já existe um logo salvo.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {hasPendingBranding && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-primary">Alterações Pendentes</p>
                          <p className="text-xs text-muted-foreground">Você selecionou novos arquivos. Clique em aplicar para salvar no servidor.</p>
                        </div>
                        <Button 
                          onClick={handleApplyAllBranding}
                          className="gap-2 shadow-lg shadow-primary/20"
                        >
                          <Save size={16} /> Aplicar Identidade Visual
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-border">
                    <label className="block text-sm font-medium text-muted-foreground mb-3">Cor Principal</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={primaryColor} 
                        onChange={handleColorChange} 
                        className="w-14 h-14 p-1 rounded-xl cursor-pointer border border-border bg-background shadow-sm" 
                      />
                      <div>
                        <p className="text-sm font-medium">Personalizar Destaque</p>
                        <p className="text-xs text-muted-foreground">Esta cor será aplicada em botões, ícones e destaques.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="jornada" className="p-6 m-0 outline-none animate-in fade-in-50 duration-300">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground">Jornada de Trabalho</h2>
              <p className="text-sm text-muted-foreground">Configure os horários de funcionamento e escalas da sua equipe.</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/10 p-6">
              <WorkSettingsSection />
            </div>
          </TabsContent>

          <TabsContent value="backup" className="p-6 m-0 outline-none animate-in fade-in-50 duration-300">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground text-primary flex items-center gap-2">
                <Database className="w-6 h-6" />
                Gerenciamento de Dados
              </h2>
              <p className="text-sm text-muted-foreground">Exporte ou importe backups do sistema para garantir a segurança dos seus dados.</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/10 p-8 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full mb-6">
                <Database className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Exportar & Importar Backup</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-8">
                Recomendamos exportar seus dados semanalmente. O arquivo gerado contém todas as suas configurações, metas e lançamentos históricos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button onClick={exportarDadosJSON} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:translate-y-[-2px] transition-all">
                  📥 Baixar Backup (.JSON)
                </button>
                <button onClick={() => document.getElementById('import-input')?.click()} className="px-6 py-3 rounded-xl border-2 border-primary/20 bg-background text-primary font-bold hover:bg-primary/5 transition-all">
                  📤 Restaurar Sistema
                </button>
                <input id="import-input" type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sistema" className="p-6 m-0 outline-none animate-in fade-in-50 duration-300">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground">Informações Técnicas</h2>
              <p className="text-sm text-muted-foreground">Dados operacionais e status do banco de dados.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-border bg-secondary/10 shadow-sm transition-all hover:shadow-md">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Armazenamento</p>
                <p className="text-2xl font-bold text-primary">Cloud (V4)</p>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">Banco de dados Supabase Ativo</p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-secondary/10 shadow-sm transition-all hover:shadow-md">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total de Metas</p>
                <p className="text-3xl font-bold">{db.metas.length}</p>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">Objetivos financeiros ativos</p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-secondary/10 shadow-sm transition-all hover:shadow-md">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Vendas Totais</p>
                <p className="text-3xl font-bold">{db.lancamentos.length}</p>
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">Registros totais na conta</p>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesPage;
