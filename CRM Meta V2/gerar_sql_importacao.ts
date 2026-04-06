import * as fs from 'fs';
import * as path from 'path';

// Usage: npx tsx supabase_import_tool.ts path/to/backup.json <user_id>
// Will generate a .sql file with the required INSERT statements

function generateSql() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Uso: npx ts-node run_import.ts <caminho_do_backup.json> <seu_user_id_do_supabase>");
    process.exit(1);
  }

  const [backupPath, userId] = args;
  
  if (!fs.existsSync(backupPath)) {
    console.error(`Arquivo não encontrado: ${backupPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(backupPath, 'utf8');
  let backup;
  try {
    backup = JSON.parse(content);
  } catch(e) {
    console.error("Arquivo JSON inválido.");
    process.exit(1);
  }

  let metas = [];
  let lancamentos = [];

  if (backup.db) {
    metas = backup.db.metas || [];
    lancamentos = backup.db.lancamentos || [];
  } else if (backup.metas || backup.lancamentos) {
    metas = backup.metas || [];
    lancamentos = backup.lancamentos || [];
  } else if (Array.isArray(backup)) {
    lancamentos = backup;
  }

  if (metas.length === 0 && lancamentos.length === 0) {
    console.error("Nenhuma meta ou lançamento encontrado no JSON.");
    process.exit(1);
  }

  let sql = `-- Gerado a partir do backup V3\n`;
  sql += `-- Apagando dados antigos do usuário para evitar duplicidade\n`;
  sql += `DELETE FROM public.metas WHERE user_id = '${userId}';\n`;
  sql += `DELETE FROM public.lancamentos WHERE user_id = '${userId}';\n\n`;

  if (metas.length > 0) {
    sql += `-- Inserindo Metas\n`;
    sql += `INSERT INTO public.metas (id, user_id, nome, valor, descricao) VALUES \n`;
    const metasValues = metas.map((m: any) => {
      const nome = m.nome.replace(/'/g, "''");
      const desc = (m.descricao || '').replace(/'/g, "''");
      return `('${m.id}', '${userId}', '${nome}', ${m.valor}, '${desc}')`;
    });
    sql += metasValues.join(',\n') + ';\n\n';
  }

  if (lancamentos.length > 0) {
    sql += `-- Inserindo Lançamentos\n`;
    sql += `INSERT INTO public.lancamentos (id, user_id, data, valor_bruto, desconto, valor_liquido) VALUES \n`;
    const lancValues = lancamentos.map((l: any) => {
      const data = l.data;
      const bruto = l.valorBruto || l.valor_bruto || 0;
      const desc = l.desconto || 0;
      const liq = l.valorLiquido || l.valor_liquido || (bruto - desc);
      return `('${l.id || crypto.randomUUID()}', '${userId}', '${data}', ${bruto}, ${desc}, ${liq})`;
    });
    sql += lancValues.join(',\n') + ';\n\n';
  }

  const outputPath = path.join(process.cwd(), 'importacao_backup_v3.sql');
  fs.writeFileSync(outputPath, sql);
  
  console.log(`\n✅ Sucesso! Arquivo SQL gerado em: ${outputPath}`);
  console.log(`\nAgora vá no Supabase > SQL Editor > New Query e cole o conteúdo deste arquivo para importar seus dados instantaneamente.`);
}

generateSql();
