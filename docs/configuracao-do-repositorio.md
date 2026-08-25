# Configuração do repositório (para quem administra)

Passos que **precisam ser feitos na interface do GitHub** — não dá para versionar em arquivo.

## 1. Criar a organização e o repositório

O site é um *organization site*, então o nome importa:

- Organização: `minicurso-gitflow-trunkbased`
- Repositório: `minicurso-gitflow-trunkbased.github.io` (público)

Assim a URL fica `https://minicurso-gitflow-trunkbased.github.io` sem subpasta.

```bash
git remote add origin git@github.com:minicurso-gitflow-trunkbased/minicurso-gitflow-trunkbased.github.io.git
git push -u origin main
```

## 2. Ativar o GitHub Pages via Actions

**Settings → Pages → Build and deployment → Source: `GitHub Actions`.**

Este é o ponto mais fácil de errar: se ficar em "Deploy from a branch", o workflow
`deploy.yml` falha na etapa `configure-pages`. O primeiro deploy também cria o
*environment* `github-pages` automaticamente.

## 3. Dar acesso de escrita à turma

**Settings → Collaborators and teams.**

- Crie um time `alunos` na organização e dê a ele a permissão **Write** no repositório.
- Convide cada pessoa para o time (aceitar o convite por e-mail é obrigatório).

Permissão `Write` deixa commitar direto na `main` e abrir PRs, mas não deixa
apagar o repositório nem mexer em configurações.

## 4. Proteção da `main` — quanto proteger?

Trunk-based **não** significa "sem rede de segurança", mas proteção demais mata a
frequência de integração. Recomendação para o minicurso:

| Regra | Recomendação | Por quê |
|---|---|---|
| Exigir Pull Request | ❌ desligado | O ponto da aula é commitar direto na `main` |
| Bloquear `force push` | ✅ ligado | Impede que alguém apague o histórico da turma |
| Bloquear deleção da branch | ✅ ligado | Idem |
| Exigir status check `Validar` | ⚠️ opcional | Só faz sentido se a turma trabalhar via PR |

Configure em **Settings → Rules → Rulesets → New branch ruleset**, alvo `main`,
com *Restrict deletions* e *Block force pushes* marcados.

Se em algum momento da aula você quiser demonstrar o fluxo com revisão, ligue
"Require a pull request before merging" temporariamente — e desligue depois, para
que a turma volte a sentir o trunk-based de verdade.

## 5. Permissões de Actions

**Settings → Actions → General:**

- *Actions permissions*: Allow all actions (ou pelo menos as `actions/*`).
- *Workflow permissions*: Read repository contents — o `deploy.yml` já declara as
  permissões extras (`pages: write`, `id-token: write`) que precisa.

## 6. Checagem final

Depois do primeiro push na `main`:

1. **Actions** → o workflow `Deploy` deve terminar verde (~1 min).
2. Acesse `https://minicurso-gitflow-trunkbased.github.io` — a página deve carregar.
3. A seção "Participantes" deve listar o cartão de exemplo. Se aparecer a mensagem de
   erro, `data/participantes.json` não foi gerado: confira a etapa
   "Gerar manifesto de participantes" no log da Action.
