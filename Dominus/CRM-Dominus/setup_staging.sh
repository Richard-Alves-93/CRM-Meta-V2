#!/bin/bash
export PGPASSWORD="dominus"
# Drop Se Existir
sudo -u postgres psql -d postgres -c "DROP DATABASE IF EXISTS dominus_testes;"
# Cria o Banco
sudo -u postgres psql -d postgres -c "CREATE DATABASE dominus_testes OWNER dominus;"
# Copia os dados do dominus para o dominus_testes
sudo -u postgres pg_dump dominus | sudo -u postgres psql dominus_testes


# Copia e duplica a pasta do projeto (Isso vai levar um tempo se a pasta for grande)
cp -r /root/CRM-Dominus /root/CRM-Dominus-Testes

# Ajustando backend
cd /root/CRM-Dominus-Testes/whaticket/backend
sed -i 's/PORT=8080/PORT=8081/g' .env
sed -i 's/DB_NAME=dominus/DB_NAME=dominus_testes/g' .env

# Ajustando frontend
cd /root/CRM-Dominus-Testes/whaticket/frontend
sed -i 's/REACT_APP_BACKEND_URL=https:\/\/api.crmdominus.com.br/REACT_APP_BACKEND_URL=https:\/\/api.riveslaser.com.br/g' .env
sed -i 's/PORT=3333/PORT=3334/g' .env
sed -i 's/PORT=3000/PORT=3334/g' .env
sed -i 's/PORT=3001/PORT=3002/g' server.js

echo "Configuração Script Finalizada."
