#!/usr/bin/env node
/**
 * Lê todos os arquivos .json de data/participantes/ e gera data/participantes.json.
 *
 * Por que isso existe: se todo mundo editasse UM arquivo de lista, cada aula
 * viraria uma sessão de resolução de conflitos. Com um arquivo por pessoa,
 * dois commits simultâneos quase nunca se colidem — e a CI junta tudo.
 *
 * Uso: node scripts/gerar-manifesto.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = 'data/participantes';
const SAIDA = 'data/participantes.json';

const arquivos = (await readdir(DIR))
  .filter((n) => n.endsWith('.json') && !n.startsWith('_'))
  .sort();

const participantes = [];
const erros = [];

for (const arquivo of arquivos) {
  const caminho = join(DIR, arquivo);
  let dados;
  try {
    dados = JSON.parse(await readFile(caminho, 'utf8'));
  } catch (e) {
    erros.push(`${caminho}: JSON inválido — ${e.message}`);
    continue;
  }
  if (!dados.nome || typeof dados.nome !== 'string') {
    erros.push(`${caminho}: campo obrigatório "nome" ausente ou não é texto`);
    continue;
  }
  if (dados.github && !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(dados.github)) {
    erros.push(`${caminho}: "github" não parece um usuário válido`);
    continue;
  }
  participantes.push({
    nome: dados.nome.trim(),
    github: dados.github ?? null,
    curiosidade: typeof dados.curiosidade === 'string' ? dados.curiosidade.trim() : null,
  });
}

if (erros.length) {
  console.error('❌ Problemas encontrados:\n' + erros.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}

participantes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
await writeFile(SAIDA, JSON.stringify(participantes, null, 2) + '\n');
console.log(`✅ ${SAIDA} gerado com ${participantes.length} participante(s).`);
