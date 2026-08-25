# Minicurso: Gitflow &amp; Trunk-Based Development

Site do minicurso, publicado em **https://minicurso-gitflow-trunkbased.github.io**.

Este repositório é, ao mesmo tempo, o material e o laboratório: todas as pessoas
participantes têm acesso de escrita e integram na `main` durante a aula. Cada commit
na `main` dispara um deploy automático.

- **Stack:** HTML, CSS e JavaScript puros. Sem framework, sem bundler, sem dependências.
- **Deploy:** GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`).
- **Validação:** `.github/workflows/ci.yml` roda em todo push/PR fora da `main`.

## Rodando localmente

Você precisa de Node 18+ (só para o script de manifesto) e de qualquer servidor HTTP.

```bash
git clone https://github.com/minicurso-gitflow-trunkbased/minicurso-gitflow-trunkbased.github.io.git
cd minicurso-gitflow-trunkbased.github.io

node scripts/gerar-manifesto.mjs   # gera data/participantes.json
python3 -m http.server 8000        # ou: npx serve .
```

Abra <http://localhost:8000>. Abrir o `index.html` direto pelo `file://` **não funciona**:
o navegador bloqueia o `fetch` dos arquivos de dados.

Antes de dar push, rode a mesma checagem que a CI roda:

```bash
node scripts/validar.mjs
```

## Estrutura

```
index.html                  página inicial
404.html                    página de erro do GitHub Pages
assets/css/style.css        estilos (adicione os seus no fim do arquivo)
assets/js/main.js           script principal, sem dependências
data/participantes/*.json   um arquivo por pessoa  ← é aqui que você começa
docs/trunk-based.html       guia rápido da estratégia
scripts/gerar-manifesto.mjs junta os JSONs em data/participantes.json
scripts/validar.mjs         checagens da CI (HTML, JSON, links locais)
.github/workflows/          CI e deploy
```

`data/participantes.json` e `data/build.json` são **gerados** — estão no `.gitignore`
e não devem ser commitados.

## Documentação

- [CONTRIBUTING.md](CONTRIBUTING.md) — fluxo de trabalho, convenção de commits, conflitos.
- [docs/trunk-based.html](docs/trunk-based.html) — as cinco regras da estratégia.
- [docs/configuracao-do-repositorio.md](docs/configuracao-do-repositorio.md) — o que quem administra precisa configurar no GitHub.

## O tema do site ainda está aberto

O conteúdo atual (comparativo, roteiro, participantes) é um ponto de partida funcional.
Se a turma decidir mudar o assunto do site, a estrutura continua valendo: troque as
seções do `index.html` e mantenha o padrão de "um arquivo por pessoa" para o conteúdo
colaborativo.
