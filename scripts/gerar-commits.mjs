#!/usr/bin/env node
/**
 * Extrai o histórico recente de commits do Git e gera data/commits-historico.json.
 *
 * Utilizado localmente e pelo workflow de deploy do GitHub Actions para manter
 * o visualizador de trunk sempre atualizado com os commits reais da main.
 *
 * Uso: node scripts/gerar-commits.mjs
 */
import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SAIDA = 'data/commits-historico.json';
const MAX_COMMITS = 30;

function extrairTipo(msg) {
  if (!msg) return 'outro';
  const normalizada = msg.trim().toLowerCase();
  if (normalizada.startsWith('merge')) return 'merge';
  const match = normalizada.match(/^([a-z]+)(\(.*\))?:/);
  return (match && match[1]) ? match[1] : 'outro';
}

function detalharPrincipio(tipo, ehMerge, diretoNoTrunk) {
  if (ehMerge) {
    return 'Integração rápida (Merge PR) de branch curta na main, acionando validação de CI e deploy contínuo.';
  }
  if (diretoNoTrunk) {
    return 'Commit pequeno e atômico realizado diretamente na main (Regra 3 do Trunk-Based).';
  }
  return 'Commit realizado em branch curta (short-lived branch) antes de integrar à main.';
}

async function carregarMapaParticipantes() {
  const mapa = new Map();
  const dir = 'data/participantes';
  if (!existsSync(dir)) return mapa;

  try {
    const arquivos = (await readdir(dir)).filter((n) => n.endsWith('.json') && !n.startsWith('_'));
    for (const arq of arquivos) {
      try {
        const conteudo = JSON.parse(await readFile(`${dir}/${arq}`, 'utf8'));
        if (conteudo.nome) {
          const nomeNormalizado = conteudo.nome.trim().toLowerCase();
          mapa.set(nomeNormalizado, conteudo.github || null);
        }
      } catch {
        // Ignora erro em arquivo de participante individual
      }
    }
  } catch {
    // Diretório inexistente ou inacessível
  }
  return mapa;
}

function obterCommitsGit(mapaParticipantes) {
  if (!existsSync('.git')) {
    console.warn('⚠️ Diretório .git não encontrado. Mantendo dados existentes ou fallback.');
    return null;
  }

  try {
    // Formato com delimitador \x1e iniciando cada commit e \x1f separando metadados
    const formato = '%x1e%H%x1f%h%x1f%s%x1f%an%x1f%ad%x1f%P';
    const saidaRaw = execFileSync(
      'git',
      ['log', `-n`, String(MAX_COMMITS), `--pretty=format:${formato}`, '--date=format:%d/%m/%Y %H:%M', '--name-only'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    );

    if (!saidaRaw.trim()) return null;

    const blocos = saidaRaw.split('\x1e').filter((b) => b.trim());
    const commits = [];

    for (const bloco of blocos) {
      const linhas = bloco.trim().split('\n');
      const cabecalho = linhas[0];
      const arquivos = linhas.slice(1).map((l) => l.trim()).filter(Boolean);

      const partes = cabecalho.split('\x1f');
      const sha = partes[0] || '';
      const shortSha = partes[1] || sha.slice(0, 7);
      const mensagem = partes[2] || 'Sem mensagem';
      const autor = partes[3] || 'Autor Git';
      const data = partes[4] || '';
      const parentsStr = partes[5] || '';

      if (!sha) continue;

      const parents = parentsStr.trim().split(/\s+/).filter(Boolean);
      const ehMerge = parents.length > 1 || mensagem.startsWith('Merge');
      const tipo = extrairTipo(mensagem);
      const diretoNoTrunk = !ehMerge && !mensagem.toLowerCase().includes('branch');

      const autorNormalizado = autor.trim().toLowerCase();
      const githubUser = mapaParticipantes.get(autorNormalizado) || null;

      commits.push({
        sha,
        shortSha,
        mensagem,
        tipo,
        autor,
        github: githubUser,
        data,
        branch: ehMerge ? 'main' : (diretoNoTrunk ? 'main' : 'branch curta'),
        diretoNoTrunk,
        ci: 'passou',
        deploy: diretoNoTrunk || ehMerge,
        detalhes: detalharPrincipio(tipo, ehMerge, diretoNoTrunk),
        arquivos: arquivos.slice(0, 10)
      });
    }

    return commits;
  } catch (erro) {
    console.warn(`⚠️ Não foi possível rodar git log: ${erro.message}`);
    return null;
  }
}

async function main() {
  const mapaParticipantes = await carregarMapaParticipantes();
  const commits = obterCommitsGit(mapaParticipantes);

  if (commits && commits.length > 0) {
    await writeFile(SAIDA, JSON.stringify(commits, null, 2) + '\n');
    console.log(`✅ ${SAIDA} atualizado com ${commits.length} commit(s) reais do Git.`);
  } else {
    if (existsSync(SAIDA)) {
      console.log(`ℹ️ Mantido ${SAIDA} existente.`);
    } else {
      console.warn(`⚠️ Não foi possível gerar ${SAIDA} e arquivo não existe.`);
    }
  }
}

await main();
