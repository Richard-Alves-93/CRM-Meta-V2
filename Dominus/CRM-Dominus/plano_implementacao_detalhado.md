# Plano Mestre de Implementação Técnica — Evolução Dominus CRM

Este plano define a arquitetura completa de refatoração do Dominus CRM para transformar o sistema em um SaaS profissional, escalável e preparado para múltiplos setores operando simultaneamente sem conflito.

**Filosofia Central:**
- **Contato ≠ Card do Kanban**
- **Contato** = Entidade principal única (Fonte de Verdade).
- **Card** = Instância/Participação desse contato dentro de um pipeline específico.

---

## 🚀 FASE 0: Infraestrutura Supabase & Migração (PRIORIDADE MÁXIMA)

### 0.1 Setup do Projeto
- **Modificação**: Adicionar `SUPABASE_URL` e `SUPABASE_KEY` no arquivo `whaticket/backend/.env`.
- **Instrução**: Criar as tabelas iniciais no Supabase usando UUID como chave primária (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`).
- **Prompt de Execução**: 
    > Configure a infraestrutura inicial do Supabase. Adicione as chaves no .env e crie a estrutura no SQL Editor usando UUID PRIMARY KEY. Garanta compatibilidade SaaS, foreign keys corretas e índices. Não quebre a estrutura atual; apenas prepare a nova base.

### 0.2 Migração de Dados (ETL)
- **Modificação**: Criar `backend/src/scripts/migrateToSupabase.ts`.
- **Prompt de Execução**: 
    > Crie o script `migrateToSupabase.ts`. Objetivo: migrar contatos e mensagens sem perda de dados. Use Sequelize para leitura e Supabase-js para escrita em lotes. Controle logs, falhas, evite duplicatas e garanta rollback seguro.

---

## 🏗️ FASE 1: Nova Arquitetura de Pipelines (Desacoplamento)

### 1.1 Tabelas de Pipelines
- **Modificação**: Criar `pipelines`, `pipeline_columns`, `pipeline_cards`, `pipeline_history`.
- **Instrução**: Relacionamento 1 Contato -> N Pipeline Cards.
- **Prompt de Execução**: 
    > Crie a arquitetura de pipelines. Contato deve continuar sendo entidade principal; `pipeline_cards` será a intermediária. Crie as FKs, índices e histórico obrigatório de movimentações. Nunca usar `queueId` como base novamente.

### 1.2 Migração de Status
- **Modificação**: Converter `queueId` em cards no pipeline padrão “Atendimento”.
- **Prompt de Execução**: 
    > Migre o sistema antigo baseado em `queueId` para `pipeline_cards`. Todo contato com `queueId` ganha um card no pipeline "Atendimento". Não perca contatos nem duplique cards.

---

## 🛡️ FASE 2: Segurança e Permissões

### 2.1 Bloqueio de Resposta Indevida
- **Modificação**: Alterar `backend/src/services/MessageServices/CreateMessageService.ts`.
- **Prompt de Execução**: 
    > Corrija a falha de segurança: se o usuário não for admin e o contato não pertencer a ele (`contact.userId !== user.id`), bloqueie a ação com `AppError('Acesso Negado')`.

### 2.2 Filtro Global por Empresa (RLS)
- **Modificação**: Habilitar RLS em todas as tabelas no Supabase Dashboard.
- **Prompt de Execução**: 
    > Implemente isolamento total por empresa usando RLS: `company_id = auth.jwt() ->> 'companyId'`. Aplique em `contacts`, `messages`, `pipelines`, `pipeline_cards`, `pipeline_history`.

---

## 🔄 FASE 3: Backend Switch (Conexão Supabase)

### 3.1 Troca de Driver
- **Modificação**: Alterar `backend/src/database/index.ts`.
- **Prompt de Execução**: 
    > Substitua Sequelize pelo Supabase SDK. Exporte `supabaseClient` como fonte principal. Garanta transição gradual e compatibilidade com rotas atuais.

### 3.2 Realtime Sync
- **Modificação**: Alterar `backend/src/libs/socket.ts`.
- **Prompt de Execução**: 
    > Implemente sincronização realtime via `supabase.channel('public:pipeline_cards')`. Atualização instantânea no Kanban sem refresh manual.

---

## 🎨 FASE 4: Front-end React (Premium UI)

### 4.1 Estrutura Geral da UI
- **Prompt de Execução**: Refatore o Kanban e gestão de contatos: Contato ≠ Card. O contato pode participar de vários pipelines simultaneamente.

### 4.2 Sidebar (Navegação Principal)
- **Estrutura**: Contatos, Ligação, Financeiro, Vendas, Configurações.
- **Prompt de Execução**: Criar Sidebar com navegação separada por setor. Cada item abre um Kanban exclusivo do setor.

### 4.3 Tela de Contatos (Fonte de Verdade)
- **Prompt de Execução**: Criar Tela de Contatos em formato lista. Exibir Status Geral + Indicadores por Pipeline (ex: Ligação -> Ligar novamente). Nunca duplicar contatos.

### 4.4 Painel do Contato (Drawer)
- **Prompt de Execução**: Criar Drawer lateral premium (estilo HubSpot). Abas: Geral, Pipelines, Histórico. Exibir dados completos, tags, responsável e Visão 360°.

### 4.5 Tela de Kanban por Setor
- **Prompt de Execução**: Cada setor visualiza apenas seu fluxo. Mover apenas `pipeline_cards`, nunca o contato principal.

---

## 🤖 FASE 5: Automação & Chatbot

### 5.1 Gatilhos de Palavras-Chave
- **Modificação**: Alterar `backend/src/services/WbotServices/wbotMessageListener.ts`.
- **Prompt de Execução**: Implementar automação por palavras-chave (ex: "quero pagar" -> Financeiro). Integrar com `upsertPipelineCard()` no Supabase.

---

## 📊 FASE 6: Dashboard & Indicadores

### 6.1 Dashboards Operacionais
- **Prompt de Execução**: Preparar dashboards por setor: quantidade por etapa, produtividade, tempo médio (SLA), taxa de conversão e pagamentos em aberto.

---

## ⚠️ VALIDAÇÃO FINAL
- **Prompt de Execução**: Executar `npm test`. Validar manualmente: Criar contato, Adicionar ao pipeline, Mover no Kanban, Abrir drawer, Realtime, Permissões Admin/User e Isolamento entre empresas.
