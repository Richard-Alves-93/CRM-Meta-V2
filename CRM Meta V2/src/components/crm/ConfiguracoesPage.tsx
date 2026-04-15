import { useEffect, useState } from "react";
import { CrmDatabase, exportarDadosJSON, deleteMeta, deleteLancamento, addMeta, addLancamento } from "@/lib/crm-data";
import { hexToHslStr } from "@/lib/colors";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { supabase, STORAGE_BUCKET } from "@/integrations/supabase/client";
import { WorkSettingsSection } from "./WorkSettingsSection";
import { CompanyProfileSection } from "./CompanyProfileSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Clock, Database, Info } from "lucide-react";

interface ConfiguracoesPageProps {
  db: CrmDatabase;
  onRefresh: () => Promise<void>;
  customLogo: string | null;
  onLogoChange: (logo: string | null) => void;
}

const ConfiguracoesPage = ({ db, onRefresh, customLogo, onLogoChange }: ConfiguracoesPageProps) => {
  const [primaryColor, setPrimaryColor] = useState(
    localStorage.getItem('crm_custom_primary_color') || "#3b82f6"
  );
  const { user, tenantId } = useAuth();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = async () => {
    localStorage.removeItem('crm_custom_logo');
    onLogoChange(null);
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { logo_url: null },
    });

    if (metadataError) {
      console.warn("Erro ao remover logo do Supabase:", metadataError);
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
        });
    }

    supabase.auth.updateUser({ data: { primary_color: val } }).catch(err => {
      console.warn('[Config] Erro ao salvar cor no user_metadata:', err);
    });
  };

  const checkStorageBucket = async () => {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) console.error('Erro buckets:', error.message || error);
      const hasBucket = data?.some((bucket) => bucket.name === STORAGE_BUCKET);
      if (!hasBucket) {
        console.error(`Bucket '${STORAGE_BUCKET}' não encontrado. Verifique o projeto Supabase.`);
      }
    } catch (err) {
      console.error('Erro ao listar buckets do Supabase:', err);
    }
  };

  useEffect(() => {
    checkStorageBucket();
  }, []);

  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast.error('Selecione um arquivo antes de salvar a logo.');
      return;
    }

    const fileExt = logoFile.name.split('.').pop() || 'png';
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const bucketName = STORAGE_BUCKET;

    setIsUploadingLogo(true);
    setUploadError(null);

    try {
      if (customLogo) {
        try {
          const oldFileName = customLogo.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from(bucketName).remove([decodeURIComponent(oldFileName)]);
          }
        } catch (removeErr) {
          console.warn('Falha ao deletar logo antiga', removeErr);
        }
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: logoFile.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const logoUrl = publicUrlData.publicUrl;
      localStorage.setItem('crm_custom_logo', logoUrl);
      onLogoChange(logoUrl);

      if (user) {
        await supabase.auth.updateUser({
          data: { logo_url: logoUrl },
        });
      }

      setLogoFile(null);
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
      }

      toast.success('Logo salva com sucesso!');
    } catch (err: any) {
      console.error('Erro ao enviar logo:', err);
      setUploadError(err?.message || String(err));
      toast.error('Erro ao enviar logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

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
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie dados e preferências do sistema.</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full space-y-6">
        <TabsList className="bg-card border border-border p-1 h-auto w-full sm:w-auto flex flex-wrap sm:flex-nowrap gap-1">
          <TabsTrigger value="perfil" className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Meu Perfil & Marca</span>
            <span className="sm:hidden">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="jornada" className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Jornada de Trabalho</span>
            <span className="sm:hidden">Jornada</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar & Importar</span>
            <span className="sm:hidden">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
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
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-3">Logotipo da Barra Lateral</label>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                      <div className="w-48 h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-background overflow-hidden relative group shadow-inner">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Preview" className="max-h-full max-w-full object-contain p-2" />
                        ) : customLogo ? (
                          <img src={customLogo} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem imagem</span>
                        )}
                        {(logoPreview || customLogo) && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={handleRemoveLogo} className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors">
                              Remover
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-4 w-full">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer" />
                        {logoFile && (
                          <div className="flex items-center gap-3">
                            <button onClick={handleUploadLogo} disabled={isUploadingLogo} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50">
                              {isUploadingLogo ? 'Enviando...' : 'Salvar Logo'}
                            </button>
                            <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="text-sm font-medium hover:underline">Cancelar</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <label className="block text-sm font-medium text-muted-foreground mb-3">Cor Principal</label>
                    <div className="flex items-center gap-4">
                      <input type="color" value={primaryColor} onChange={handleColorChange} className="w-14 h-14 p-1 rounded-xl cursor-pointer border border-border bg-background shadow-sm" />
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
