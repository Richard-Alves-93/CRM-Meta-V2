# Checklist de Confirmação — Dominus CRM

**Prazo Total Acordado:** 15 a 20 dias (Entrega Final e Validação)

Use este arquivo para validar cada entrega. Marque com um [x] apenas quando você testar e confirmar que o comportamento está conforme o esperado.

---

### ✅ FASE 0: Migração & Infraestrutura
- [ ] **0.1 Setup Supabase**: O arquivo `.env` contém as chaves e a conexão com o Supabase está ativa.
- [ ] **0.2 SQL Inicial**: As tabelas foram criadas no Supabase com UUIDs (verificar no Dashboard do Supabase).
- [ ] **0.3 Migração de Dados**: Os contatos e mensagens aparecem no Supabase? (Validar se os nomes e números estão corretos).

---

### ✅ FASE 1: Arquitetura de Pipelines
- [ ] **1.1 Tabelas Criadas**: As tabelas `pipelines`, `columns` e `cards` estão visíveis no Supabase.
- [ ] **1.2 Migração de Status**: Os contatos que tinham fila (queue) agora possuem um card no pipeline de "Atendimento"?

---

### ✅ FASE 2: Segurança (Crítico)
- [ ] **2.1 Bloqueio de Resposta**: Teste com um usuário comum. Ele consegue responder um contato que não é dele? (O esperado é dar erro de "Acesso Negado").
- [ ] **2.2 Isolamento RLS**: Ao logar com uma Empresa A, você consegue ver dados da Empresa B? (O esperado é isolamento total).

---

### ✅ FASE 3: Backend Switch
- [ ] **3.1 Funcionamento Geral**: O sistema continua enviando e recebendo mensagens normalmente após a troca para o Supabase SDK?
- [ ] **3.2 Realtime**: Ao mover um card no banco de dados (ou via script), a tela do sistema atualiza sozinha sem F5?

---

### ✅ FASE 4: Front-end Premium
- [ ] **4.1 Drawer de Contato**: O painel lateral abre corretamente? As abas (Geral, Pipelines, Histórico) funcionam?
- [ ] **4.2 Kanban por Setor**: Você consegue trocar de pipeline e ver cards diferentes para cada setor? O Drag & Drop está fluido?

---

### ✅ FASE 5: Automações
- [ ] **5.1 Palavras-Chave**: Ao enviar uma palavra-chave configurada (ex: "financeiro"), o contato é movido para o pipeline correto automaticamente?

---

## 🚩 Assinatura de Aprovação Final
- [ ] **Sistema Validado e Pronto para Produção.**
