import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/hooks/useAuth";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Building } from "lucide-react";

export const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length === 0) return "";
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

export const formatDocument = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    let v = numbers;
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    return v;
  } else {
    let v = numbers.substring(0, 14);
    if (v.length > 12) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5");
    else if (v.length > 8) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4");
    else if (v.length > 5) v = v.replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3");
    else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,3})/, "$1.$2");
    return v;
  }
};

export const CompanyProfileSection = () => {
  const { tenantId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telefone: "",
    whatsapp: "",
    documento: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    razao_social: "",
    nome_fantasia: "",
    inscricao_estadual: "",
    data_abertura_nascimento: ""
  });

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!tenantId) return;
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .single();

        if (error) throw error;
        
        if (data) {
          let parsedEnd: any = {};
          try {
            if (data.endereco && data.endereco.startsWith('{')) {
              parsedEnd = JSON.parse(data.endereco);
            } else {
              parsedEnd.rua = data.endereco || ""; 
            }
          } catch(e) {}

          setFormData({
            name: data.name || "",
            email: data.email || user?.email || "",
            telefone: formatPhone(data.telefone || ""),
            whatsapp: formatPhone(data.whatsapp || ""),
            documento: formatDocument(data.documento || ""),
            cep: parsedEnd.cep || "",
            rua: parsedEnd.rua || "",
            numero: parsedEnd.numero || "",
            complemento: parsedEnd.complemento || "",
            bairro: parsedEnd.bairro || "",
            cidade: parsedEnd.cidade || "",
            estado: parsedEnd.estado || "",
            razao_social: data.razao_social || "",
            nome_fantasia: data.nome_fantasia || "",
            inscricao_estadual: data.inscricao_estadual || "",
            data_abertura_nascimento: data.data_abertura_nascimento || ""
          });
        }
      } catch (err: any) {
        toast.error("Erro ao carregar dados da empresa: " + err.message);
      } finally {
        setFetching(false);
      }
    };

    fetchCompanyData();
  }, [tenantId]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    
    if (name === "telefone" || name === "whatsapp") {
      value = formatPhone(value);
    }
    
    if (name === "documento") {
      value = formatDocument(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));

    // Se ele apagou o documento ou ele é menor que um CPF válido, limpamos os auto-preenchimentos
    if (name === "documento" && value.replace(/\D/g, "").length < 14) {
       // Não chamamos a API. Se for CPF, a UI vai abrir pro usuário digitar puro.
    }

    // Ao bater 18 caracteres formatados (00.000.000/0000-00), dispara pra Receita Federal
    if (name === "documento" && value.length === 18 && value.includes('/')) {
      const rawCnpj = value.replace(/\D/g, "");
      
      const tId = toast.loading("Sincronizando com a Receita Federal...");
      
      try {
        let fetchResult = null;
        
        // TENTATIVA 1: BrasilAPI
        try {
          const resp1 = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawCnpj}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
          if (resp1.ok) {
            const data1 = await resp1.json();
            fetchResult = {
              situacao: data1.descricao_situacao_cadastral,
              razao_social: data1.razao_social,
              nome_fantasia: data1.nome_fantasia,
              data_abertura: data1.data_inicio_atividade
            };
          } else { throw new Error("Fallback BrasilAPI"); }
        } catch(e) {
          // TENTATIVA 2: ReceitaWS via CNPJ.ws (Redundância anti-falha)
          const resp2 = await fetch(`https://publica.cnpj.ws/cnpj/${rawCnpj}`, { method: 'GET', headers: { 'Accept': 'application/json' } });
          if (resp2.ok) {
            const data2 = await resp2.json();
            fetchResult = {
              situacao: data2.estabelecimento?.situacao_cadastral?.toUpperCase(),
              razao_social: data2.razao_social,
              nome_fantasia: data2.estabelecimento?.nome_fantasia,
              data_abertura: data2.estabelecimento?.data_inicio_atividade
            };
          } else { throw new Error("Fallback CNPJws"); }
        }

        if (!fetchResult) {
           toast.dismiss(tId);
           toast.error("CNPJ não encontrado nas bases oficias da Receita.");
           return;
        }
        
        if (fetchResult.situacao && fetchResult.situacao !== "ATIVA") {
          toast.dismiss(tId);
          toast.error("Opa! Este CNPJ consta como INATIVO ou BAIXADO. Seu uso na plataforma foi negado. Por favor, utilize seu CPF corporativo válido.", {
            duration: 8000
          });
          setFormData(prev => ({ ...prev, documento: "", razao_social: "", nome_fantasia: "", data_abertura_nascimento: "" }));
          return;
        }

        if (fetchResult.razao_social) {
          toast.dismiss(tId);
          toast.success("Empresa localizada. Seus dados foram sincronizados magicamente!");
          
          setFormData(prev => ({
            ...prev,
            razao_social: fetchResult.razao_social,
            nome_fantasia: fetchResult.nome_fantasia || fetchResult.razao_social,
            data_abertura_nascimento: fetchResult.data_abertura || ""
          }));
        } else {
          toast.dismiss(tId);
        }
      } catch (err: any) {
        toast.dismiss(tId);
        toast.error(`Acesso à Receita Federal indisponível no momento. Por favor preencha manualmente.`);
      }
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length > 8) rawValue = rawValue.slice(0, 8);
    
    let formatted = rawValue;
    if (rawValue.length > 5) {
      formatted = rawValue.substring(0, 5) + '-' + rawValue.substring(5, 8);
    }
    
    setFormData(prev => ({ ...prev, cep: formatted }));

    if (rawValue.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawValue}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({ 
            ...prev, 
            rua: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || ""
          }));
          toast.success("Endereço sincronizado! Digite apenas o número.");
          document.getElementById('numero')?.focus();
        } else {
          toast.error("Este CEP não foi encontrado.");
        }
      } catch(err) {
        toast.error("Serviço de CEP fora do ar.");
      }
    }
  };

  const handleSave = async () => {
    if (!tenantId) return;

    if (!formData.documento || formData.documento.trim() === "") {
      toast.error("O CNPJ ou CPF é obrigatório para seu cadastro corporativo na plataforma.", {
        style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #f87171' }
      });
      document.getElementById('documento')?.focus();
      return;
    }

    if (!formData.whatsapp || formData.whatsapp.trim() === "") {
      toast.error("O número de WhatsApp é obrigatório para manter seu acesso ativo.", {
        style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #f87171' }
      });
      return;
    }

    if (!formData.cep || formData.cep.trim() === "") {
      toast.error("O CEP é obrigatório.");
      return;
    }

    setLoading(true);
    
    const enderecoJSON = JSON.stringify({
      cep: formData.cep,
      rua: formData.rua,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado
    });

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          email: formData.email,
          telefone: formData.telefone,
          whatsapp: formData.whatsapp,
          documento: formData.documento,
          endereco: enderecoJSON,
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia,
          inscricao_estadual: formData.inscricao_estadual,
          data_abertura_nascimento: formData.data_abertura_nascimento
        })
        .eq('id', tenantId);

      if (error) throw error;
      toast.success("Dados da empresa atualizados com sucesso!");
    } catch (err: any) {
      toast.error("Falha ao salvar dados: " + (err.message || 'Erro Desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-4 text-sm text-muted-foreground animate-pulse">Carregando perfil corporativo...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Nome da Empresa */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Empresa</Label>
          <div className="relative">
            <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="pl-9" 
              placeholder="Sua Empresa" 
            />
          </div>
        </div>

        {/* CNPJ / CPF */}
        <div className="space-y-2">
          <Label htmlFor="documento" className="flex items-center">
            CNPJ / CPF
            <span className="text-red-500 ml-1 text-xs font-bold mr-1">*</span>
          </Label>
          <Input 
            id="documento" 
            name="documento" 
            value={formData.documento} 
            onChange={handleChange} 
            placeholder="00.000.000/0000-00" 
            className={!formData.documento ? "border-red-300 bg-red-50/10 focus-visible:ring-red-400" : ""}
          />
        </div>

        {/* E-mail Institucional */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">E-mail Institucional</Label>
          <Input 
            id="email" 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            placeholder="contato@suaempresa.com.br" 
          />
        </div>

        {/* Telefone Fixo */}
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone Fixo</Label>
          <Input 
            id="telefone" 
            name="telefone" 
            value={formData.telefone} 
            onChange={handleChange} 
            placeholder="(00) 0000-0000" 
          />
        </div>

        {/* WhatsApp (Obrigatório) */}
        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="flex items-center">
            WhatsApp 
            <span className="text-red-500 ml-1 text-xs font-bold uppercase">* Obrigatório</span>
          </Label>
          <Input 
            id="whatsapp" 
            name="whatsapp" 
            value={formData.whatsapp} 
            onChange={handleChange} 
            placeholder="(00) 90000-0000" 
            className={!formData.whatsapp ? "border-red-300 bg-red-50/10 focus-visible:ring-red-400" : ""}
          />
        </div>

        {/* Separador Invisível pro Grid */}
        <div className="hidden md:block"></div>

        {/* --- LÓGICA DE INTERFACE: CPF VS CNPJ --- */}
        <div className="md:col-span-2 pt-4 mt-2 border-t border-border/50">
          <h4 className="text-sm font-semibold mb-4 text-emerald-700 dark:text-emerald-400">
            {formData.documento.length > 14 || formData.documento.length === 0 ? "Informações Institucionais (CNPJ)" : "Informações Pessoais (CPF)"}
          </h4>
        </div>

        {formData.documento.length > 14 || formData.documento.length === 0 ? (
          <>
            {/* CNPJ LAYOUT */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="razao_social">Razão Social</Label>
              <Input 
                id="razao_social" name="razao_social" 
                value={formData.razao_social} onChange={handleChange} 
                placeholder="Razão Social LTDA" 
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
              <Input 
                id="nome_fantasia" name="nome_fantasia" 
                value={formData.nome_fantasia} onChange={handleChange} 
                placeholder="Nome fantasia..." 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_abertura_nascimento">Data de Abertura</Label>
              <Input 
                id="data_abertura_nascimento" type="date" name="data_abertura_nascimento" 
                value={formData.data_abertura_nascimento} onChange={handleChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inscricao_estadual">Inscrição Estadual (IE)</Label>
              <Input 
                id="inscricao_estadual" name="inscricao_estadual" 
                value={formData.inscricao_estadual} onChange={handleChange} 
                placeholder="000.000.000.000" 
              />
            </div>
          </>
        ) : (
          <>
            {/* CPF LAYOUT */}
            <div className="space-y-2">
              <Label htmlFor="razao_social">Seu Nome Completo</Label>
              <Input 
                id="razao_social" name="razao_social" 
                value={formData.razao_social} onChange={handleChange} 
                placeholder="Digite seu nome completo" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_abertura_nascimento">Sua Data de Nascimento</Label>
              <Input 
                id="data_abertura_nascimento" type="date" name="data_abertura_nascimento" 
                value={formData.data_abertura_nascimento} onChange={handleChange} 
              />
            </div>
          </>
        )}

        {/* Separador de Endereço Expandido */}
        <div className="md:col-span-2 pt-4 mt-2 border-t border-border/50">
          <h4 className="text-sm font-semibold mb-4 text-emerald-700 dark:text-emerald-400">Localização e Endereço</h4>
        </div>

        {/* CEP Mágico */}
        <div className="space-y-2">
          <Label htmlFor="cep" className="flex items-center">
            CEP <span className="text-red-500 ml-1 text-xs">*</span>
          </Label>
          <Input 
            id="cep" 
            value={formData.cep} 
            onChange={handleCepChange} 
            placeholder="00000-000" 
            maxLength={9}
            className="border-emerald-200 focus-visible:ring-emerald-400 bg-emerald-50/10 dark:bg-emerald-900/10 font-mono"
          />
        </div>
        
        {/* Rua (Maior que CEP) */}
        <div className="space-y-2">
          <Label htmlFor="rua">Rua / Logradouro</Label>
          <Input 
            id="rua" name="rua" 
            value={formData.rua} onChange={handleChange} 
            placeholder="Avenida Paulista" 
          />
        </div>

        {/* Número e Complemento (Mesma Linha) */}
        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="numero">Número</Label>
            <Input 
              id="numero" name="numero" 
              value={formData.numero} onChange={handleChange} 
              placeholder="123" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complemento">Complemento</Label>
            <Input 
              id="complemento" name="complemento" 
              value={formData.complemento} onChange={handleChange} 
              placeholder="Apto 45" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bairro">Bairro</Label>
          <Input 
            id="bairro" name="bairro" 
            value={formData.bairro} onChange={handleChange} 
            placeholder="Centro" 
          />
        </div>

        {/* Cidade e UF */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2 col-span-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input 
              id="cidade" name="cidade" 
              value={formData.cidade} onChange={handleChange} 
              placeholder="São Paulo" 
            />
          </div>
          <div className="space-y-2 text-center">
            <Label htmlFor="estado">UF</Label>
            <Input 
              id="estado" name="estado" maxLength={2}
              value={formData.estado} onChange={handleChange} 
              placeholder="SP" className="uppercase text-center" 
            />
          </div>
        </div>

      </div>

      <div className="pt-4 mt-6 flex justify-end border-t border-border">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {loading ? "Salvando..." : "Salvar Informações"}
        </Button>
      </div>
    </div>
  );
};
