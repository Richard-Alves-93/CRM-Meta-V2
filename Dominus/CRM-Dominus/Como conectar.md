---

# Ambientes e Comandos de Deploy

Este projeto possui dois ambientes distintos hospedados no mesmo servidor (`216.22.27.89`).

## 1. Laboratório (Ambiente de Testes)
- **URL:** `sistema.riveslaser.com.br`
- **Diretório no Servidor:** `/root/CRM-Dominus-Testes/`
- **Comando de Gatilho:** *"Atualiza os arquivos, manda para o laboratório"*
- **Uso:** Destinado a testar novas funcionalidades, redesigns e correções antes de irem para o ar.

## 2. Painel (Ambiente de Produção) - Também chamado de "Vitrine"
- **URL:** `painel.crmdominus.com.br`
- **Diretório no Servidor:** `/root/CRM-Dominus/`
- **Comando de Gatilho:** *"Manda isso para o painel"* ou *"Manda para a vitrine"*
- **Uso:** É o ambiente final utilizado pelos clientes. Só deve receber atualizações após serem validadas no laboratório.

## 3. Processo Técnico de Deploy (Resumo)

Para ambos os ambientes, o fluxo técnico segue estes passos:
1. **Compactação:** Criação de um `tar.gz` com as pastas `src` e arquivos de dependência.
2. **Transferência:** Envio via `SCP` usando a chave `C:\Users\richa\.ssh\dominus_key`.
3. **Build:** Execução remota de `npm run build` para otimizar o frontend.
4. **Reinicialização:** Uso do `PM2` para reiniciar o serviço correspondente (`dominus-frontend-test` para laboratório ou `dominus-frontend` para produção).

---
*Este guia ajuda a garantir que o desenvolvedor,  saiba exatamente para onde enviar o   código de acordo com a sua instrução.*

---
*Este arquivo foi gerado Por Richard Alves para documentar o fluxo de CI/CD manual estabelecido para o projeto CRM Dominus.*
---

Contato 51 99184-0532 E-mail: crmdominus.com.br
