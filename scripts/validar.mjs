#!/usr/bin/env node
/**
 * Verificações rápidas rodadas pela CI em cada push e pull request.
 * Regra do trunk-based: se a checagem demora, ninguém integra com frequência.
 * Mantenha este script rápido (segundos, não minutos).
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const problemas = [];
const aviso = (m) => problemas.push(m);

// 1. Arquivos essenciais existem.
for (const obrigatorio of ['index.html', '404.html', 'assets/css/style.css', 'assets/js/main.js', '.nojekyll']) {
  if (!existsSync(obrigatorio)) aviso(`arquivo obrigatório ausente: ${obrigatorio}`);
}

// 2. Todo JSON do repositório precisa ser parseável.
async function jsons(dir) {
  const saida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    if (entrada.name.startsWith('.') || entrada.name === 'node_modules') continue;
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) saida.push(...(await jsons(caminho)));
    else if (entrada.name.endsWith('.json')) saida.push(caminho);
  }
  return saida;
}
for (const caminho of await jsons('.')) {
  try {
    JSON.parse(await readFile(caminho, 'utf8'));
  } catch (e) {
    aviso(`JSON inválido em ${caminho}: ${e.message}`);
  }
}

// 3. HTML: tags básicas e referências locais existentes.
async function htmls(dir) {
  const saida = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    if (entrada.name.startsWith('.') || entrada.name === 'node_modules') continue;
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) saida.push(...(await htmls(caminho)));
    else if (entrada.name.endsWith('.html')) saida.push(caminho);
  }
  return saida;
}
for (const caminho of await htmls('.')) {
  const html = await readFile(caminho, 'utf8');
  if (!/<!DOCTYPE html>/i.test(html)) aviso(`${caminho}: falta <!DOCTYPE html>`);
  if (!/<title>[^<]+<\/title>/i.test(html)) aviso(`${caminho}: falta <title> preenchido`);
  if (!/<html[^>]+lang=/i.test(html)) aviso(`${caminho}: <html> sem atributo lang`);

  const base = caminho.split('/').slice(1, -1).join('/'); // caminho relativo à raiz do arquivo
  const refs = [...html.matchAll(/(?:href|src)="([^"#:]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (ref.startsWith('data:') || ref.startsWith('//')) continue;
    const alvo = ref.startsWith('/') ? ref.slice(1) : (base ? `${base}/${ref}` : ref);
    const normalizado = alvo.split('/').reduce((pilha, parte) => {
      if (parte === '..') pilha.pop();
      else if (parte !== '.' && parte !== '') pilha.push(parte);
      return pilha;
    }, []).join('/');
    if (normalizado && !existsSync(normalizado)) {
      aviso(`${caminho}: referência quebrada para "${ref}"`);
    }
  }
}

if (problemas.length) {
  console.error('❌ Validação falhou:\n' + problemas.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log('✅ Validação passou.');
