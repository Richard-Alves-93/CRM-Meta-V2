import { useEffect, useState } from "react";
import { CrmDatabase, exportarDadosJSON, deleteMeta, deleteLancamento, addMeta, addLancamento } from "@/lib/crm-data";
import { hexToHslStr } from "@/lib/colors";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { supabase, STORAGE_BUCKET } from "@/integrations/supabase/client";
import { WorkSettingsSection } from "./WorkSettingsSection";
import { CompanyProfileSection } from "./CompanyProfileSection";

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
  const { user } = useAuth();
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

    // Persiste no user_metadata para sincronizar com motoristas em outros dispositivos
    supabase.auth.updateUser({ data: { primary_color: val } }).catch(err => {
      console.warn('[Cores] Erro ao salvar cor no user_metadata:', err);
    });
  };

  const checkStorageBucket = async () => {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      console.log('Buckets disponíveis:', data);
      if (error) {
        console.error('Erro buckets:', error.message || error);
      }
      const hasBucket = data?.some((bucket) => bucket.name === STORAGE_BUCKET);
      if (!hasBucket) {
        console.error(`Bucket '${STORAGE_BUCKET}' não encontrado. Verifique o projeto Supabase e a chave usada.`);
      }
    } catch (err) {
      console.error('Erro ao listar buckets do Supabase:', err);
    }
  };

  const testUpload = async () => {
    const file = new File(['teste'], 'teste.txt', { type: 'text/plain' });
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload('teste-upload.txt', file, { cacheControl: '3600', upsert: true });

      console.log('Upload teste:', data, error);
      if (error) {
        console.error('Erro detalhe upload teste:', error.message, error);
      }
    } catch (err) {
      console.error('Erro ao executar upload de teste:', err);
    }
  };

  useEffect(() => {
    checkStorageBucket();
  }, []);

  const handleUploadLogo = async () => {
    if (!logoFile) {
      console.error('Nenhum arquivo de logo selecionado para upload.');
      toast.error('Selecione um arquivo antes de salvar a logo.');
      return;
    }

    if (!logoFile.size) {
      console.error('Arquivo de logo inválido ou vazio.');
      toast.error('O arquivo selecionado é inválido.');
      return;
    }

    const fileExt = logoFile.name.split('.').pop() || 'png';
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const bucketName = STORAGE_BUCKET;

    console.log('Upload de logo para bucket:', bucketName, 'arquivo:', fileName);
    setIsUploadingLogo(true);
    setUploadError(null);

    try {
      // Remove a logo antiga do banco de dados antes de subir a nova para evitar lixo acumulado
      if (customLogo) {
        try {
          const oldFileName = customLogo.split('/').pop();
          if (oldFileName) {
            console.log('Solicitando remoção da logo antiga do Storage:', oldFileName);
            await supabase.storage.from(bucketName).remove([decodeURIComponent(oldFileName)]);
          }
        } catch (removeErr) {
          console.warn('Aviso: Falha ao tentar deletar a logo antiga (pode já não existir)', removeErr);
        }
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: logoFile.type,
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        setUploadError(uploadError.message || 'Upload de logo falhou.');
        toast.error(`Erro no upload: ${uploadError.message || 'Verifique o bucket.'}`);
        return;
      }

      if (!uploadData) {
        console.error('Upload concluído sem dados de retorno.');
        setUploadError('Retorno de upload inválido.');
        toast.error('Upload concluído sem retorno válido do Supabase.');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        console.error('Erro ao gerar URL pública da logo:', publicUrlData);
        setUploadError('Falha ao obter URL pública.');
        toast.error('Não foi possível gerar a URL pública da logo.');
        return;
      }

      const logoUrl = publicUrlData.publicUrl;
      localStorage.setItem('crm_custom_logo', logoUrl);
      onLogoChange(logoUrl);

      if (user) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { logo_url: logoUrl },
        });

        if (metadataError) {
          console.warn('Erro ao salvar logo no Supabase auth:', metadataError);
        }
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
      toast.error('Erro ao enviar logo. Veja o console para detalhes.');
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

    if (!confirm("Atenção: Restaurar um backup antigo (V3) substituirá APENAS suas Metas e Vendas. Todos os seus novos Tutores, Pets e Recompras (V4) continuarão seguros. Deseja continuar?")) {
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

        // Relax format checking
        if (backup.versao || backup.db || backup.metas || backup.lancamentos) {
          // Restore configs
          if (backup.config) {
            if (backup.config.logo) {
              localStorage.setItem('crm_custom_logo', backup.config.logo);
              onLogoChange(backup.config.logo);
            }
            if (backup.config.primaryColor) {
              const color = backup.config.primaryColor;
              setPrimaryColor(color);
              localStorage.setItem('crm_custom_primary_color', color);
              document.documentElement.style.setProperty('--primary', hexToHslStr(color));
              document.documentElement.style.setProperty('--ring', hexToHslStr(color));
              document.documentElement.style.setProperty('--sidebar-primary', hexToHslStr(color));
              document.documentElement.style.setProperty('--sidebar-ring', hexToHslStr(color));
            }
          }

          if (backup.db) {
            metasToRestore = backup.db.metas || [];
            lancamentosToRestore = backup.db.lancamentos || [];
          } else {
            metasToRestore = backup.metas || [];
            lancamentosToRestore = backup.lancamentos || [];
          }
        } else if (Array.isArray(backup) && backup.length > 0 && backup[0].hasOwnProperty('valorBruto')) {
          // Very old pure array format just in case
          lancamentosToRestore = backup;
        } else {
          throw new Error("Formato de arquivo irreconhecível.");
        }

        // Delete existing data line by line
        for (const m of db.metas) {
          await deleteMeta(m.id);
        }
        for (const l of db.lancamentos) {
          await deleteLancamento(l.id);
        }

        // Insert new data sequentially to avoid rate-limits and sorting issues
        for (const m of metasToRestore) {
          await addMeta(m.nome, m.valor, m.descricao || '');
        }
        for (const l of lancamentosToRestore) {
          await addLancamento(l.data, l.valorBruto || l.valor_bruto || 0, l.desconto || 0);
        }

        toast.success("Backup restaurado com sucesso!");
        await onRefresh();
      } catch (err: any) {
        console.error("Erro ao importar backup:", err);
        toast.error(`Erro ao importar: ${err?.message || "O arquivo não pôde ser processado."}`);
      }

      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const [activeTab, setActiveTab] = useState<'perfil' | 'jornada' | 'backup' | 'sistema'>('perfil');

  const sections = [
    { key: 'perfil', label: '🏢 Meu Perfil & Marca' },
    { key: 'jornada', label: '⏱ Jornada de Trabalho' },
    { key: 'backup', label: '📥 Exportar & 📤 Importar Backup' },
    { key: 'sistema', label: 'ℹ️ Informações do Sistema' },
  ] as const;

  const sectionTitles: Record<typeof activeTab, string> = {
    perfil: 'Meu Perfil Corporativo',
    jornada: 'Jornada de Trabalho',
    backup: 'Exportar & Importar Backup',
    sistema: 'Informações do Sistema',
  };

  const activeSectionTitle = sectionTitles[activeTab];

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground mb-1">Configurações</h1>
        <p className="text-muted-foreground text-sm">Gerencie dados e preferências do sistema.</p>
      </div>

      <div className="settings-container flex flex-col md:flex-row gap-6">
        <aside className="settings-menu w-full md:w-72 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveTab(section.key)}
                className={`rounded-xl px-4 py-3 text-left text-sm transition-colors cursor-pointer ${activeTab === section.key
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'bg-transparent text-foreground hover:bg-secondary font-medium'
                  }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="settings-content flex-1 rounded-lg border border-border bg-card p-6 shadow-sm overflow-y-auto min-h-[520px]">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">{activeSectionTitle}</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Personalize e mantenha o sistema sob controle com seções claras e foco no que importa.
            </p>
          </div>

          <div className="space-y-6">
            {activeTab === 'perfil' && (
              <div className="space-y-6">
                
                {/* 1. SEÇÃO DE INFORMAÇÕES DA EMPRESA */}
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-semibold text-card-foreground mb-4">🏢 Informações Cadastrais</h3>
                  <CompanyProfileSection />
                </div>

                {/* 2. SEÇÃO DE PERSONALIZAÇÃO E CORES (ANTIGA) */}
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm border-t-4 border-t-primary/20">
                  <h3 className="font-semibold text-card-foreground mb-4">🎨 Logo e Identidade Visual</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Logotipo da Barra Lateral</label>
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                        <div className="w-40 h-20 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-secondary/50 overflow-hidden relative group">
                          {logoPreview ? (
                            <>
                              <img src={logoPreview} alt="Logo Preview" className="max-h-full max-w-full object-contain p-2" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={handleRemoveLogo}
                                  className="text-white text-xs font-semibold bg-red-500/80 px-2 py-1 rounded hover:bg-red-500"
                                >
                                  Remover
                                </button>
                              </div>
                            </>
                          ) : customLogo ? (
                            <>
                              <img src={customLogo} alt="Logo Preview" className="max-h-full max-w-full object-contain p-2" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={handleRemoveLogo}
                                  className="text-white text-xs font-semibold bg-red-500/80 px-2 py-1 rounded hover:bg-red-500"
                                >
                                  Remover
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sem imagem</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                          />
                          <p className="mt-2 text-xs text-muted-foreground">Recomendado: Imagens com fundo transparente (PNG).</p>
                          {logoFile && (
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                onClick={handleUploadLogo}
                                disabled={isUploadingLogo}
                                className="px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isUploadingLogo ? 'Enviando...' : 'Salvar Logo'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setLogoFile(null);
                                  setUploadError(null);
                                  if (logoPreview) {
                                    URL.revokeObjectURL(logoPreview);
                                    setLogoPreview(null);
                                  }
                                }}
                                className="text-sm text-muted-foreground hover:text-foreground"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                          {uploadError && (
                            <p className="mt-2 text-sm text-destructive">{uploadError}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border mt-4">
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Cor Principal (Botões e Links)</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={handleColorChange}
                          className="w-12 h-12 p-1 rounded cursor-pointer border border-border"
                        />
                        <span className="text-sm text-muted-foreground">Escolha a cor de destaque do sistema</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'jornada' && (
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <WorkSettingsSection />
              </div>
            )}

            {activeTab === 'backup' && (
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h3 className="font-semibold text-card-foreground mb-2">📥 Exportar & 📤 Importar Backup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Exporte um backup completo do seu sistema (incluindo cores, logotipo, metas e lançamentos) e importe quando precisar.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={exportarDadosJSON}
                    className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    📥 Exportar Backup Completo
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById('import-backup-input')?.click()}
                    className="px-4 py-2.5 rounded-lg bg-card border border-border text-muted-foreground text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    📤 Restaurar Backup
                  </button>
                  <input
                    id="import-backup-input"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </div>
              </div>
            )}

            {activeTab === 'sistema' && (
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <h3 className="font-semibold text-card-foreground mb-4">ℹ️ Informações do Sistema</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Armazenamento</div>
                    <div className="font-semibold text-card-foreground">Cloud</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total de Metas</div>
                    <div className="font-semibold text-card-foreground">{db.metas.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Total de Lançamentos</div>
                    <div className="font-semibold text-card-foreground">{db.lancamentos.length}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
