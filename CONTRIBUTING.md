# Como contribuir

Você tem acesso de escrita a este repositório. Isso é intencional: o objetivo do
minicurso é sentir na prática como é integrar código na `main` junto com dezenas de
pessoas ao mesmo tempo.

## A regra de ouro

**A `main` está sempre no ar.** Só empurre para ela código que deixa o site funcionando.
Se você quebrar, tudo bem — conserte ou reverta. Ninguém é punido por quebrar; a única
regra é não deixar quebrado.

## Seu primeiro commit

```bash
# 1. Clone (uma vez só)
git clone https://github.com/minicurso-gitflow-trunkbased/minicurso-gitflow-trunkbased.github.io.git
cd minicurso-gitflow-trunkbased.github.io

# 2. Sempre comece atualizado
git pull --rebase

# 3. Crie SEU arquivo (nome = seu usuário do GitHub)
cp data/participantes/_exemplo.json data/participantes/seu-usuario.json
# edite o arquivo com seus dados

# 4. Verifique antes de empurrar
node scripts/validar.mjs

# 5. Commit pequeno, com contexto
git add data/participantes/seu-usuario.json
git commit -m "feat: adiciona participante seu-usuario"

# 6. Puxe de novo (outras pessoas commitaram enquanto você trabalhava) e empurre
git pull --rebase
git push
```

Em 1–2 minutos a Action de deploy termina e sua alteração está no site.
Acompanhe em **Actions** no GitHub.

## Mudanças pequenas: direto na `main`

Corrigir um texto, ajustar uma cor, adicionar seu cartão: commite direto na `main`.
É isso que trunk-based significa. Não abra branch para isso.

## Mudanças maiores: branch curta

Se a mudança precisa de discussão ou passa por vários arquivos:

```bash
git switch -c feat/nome-curto
# ... trabalhe, commite ...
git push -u origin feat/nome-curto
```

Abra um Pull Request e integre **no mesmo dia**. Branch parada por três dias vira
conflito garantido. Depois do merge:

```bash
git switch main
git pull --rebase
git branch -d feat/nome-curto
```

## Convenção de commits

Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/) — prefixo, dois
pontos, uma frase no imperativo:

| Prefixo | Quando usar |
|---|---|
| `feat:` | nova seção, novo componente, novo conteúdo |
| `fix:` | correção de bug, link quebrado, erro de digitação em código |
| `docs:` | README, CONTRIBUTING, comentários |
| `style:` | CSS e ajustes visuais que não mudam comportamento |
| `refactor:` | reorganização sem mudança de comportamento |
| `chore:` | CI, scripts, configuração |

Exemplos: `feat: adiciona seção de quiz`, `fix: corrige link do guia no rodapé`.

## Evitando conflitos (o que combinamos)

Conflito não é erro — é o custo de trabalhar junto. Mas dá para reduzir bastante:

1. **Um arquivo por pessoa** em `data/participantes/`. Nunca edite o arquivo de outra pessoa.
2. **CSS novo vai no fim** do `assets/css/style.css`, depois do comentário que marca o
   ponto de inserção. Se todo mundo edita o topo, todo mundo colide.
3. **`git pull --rebase` antes de cada push.** Sempre.
4. **Commits pequenos e frequentes.** Trabalho acumulado por duas horas conflita muito
   mais do que quatro commits de trinta minutos.

### Deu conflito, e agora?

```bash
git pull --rebase
# Git aponta o arquivo em conflito. Abra, escolha o que fica
# (normalmente: mantenha as duas contribuições), e depois:
git add <arquivo>
git rebase --continue
git push
```

Se travar e você quiser voltar ao estado anterior sem perder nada:
`git rebase --abort`.

## Quebrei a `main`, e agora?

Sem drama. Avise no grupo e escolha o caminho mais rápido:

```bash
# Opção A: corrigir com um commit novo (se a correção é óbvia e rápida)
git commit -m "fix: corrige ..."

# Opção B: reverter (sempre segura, funciona mesmo sem entender o que quebrou)
git log --oneline -5          # descubra o SHA do commit problemático
git revert <sha>
git push
```

`git revert` cria um commit que desfaz o anterior, sem reescrever o histórico —
por isso é seguro em uma branch compartilhada. **Nunca** use `git push --force`
na `main`: isso apaga o trabalho de quem já tinha puxado.

## O que a CI verifica

`scripts/validar.mjs` confere que:

- os arquivos essenciais do site existem;
- todo `.json` do repositório é parseável;
- todo `.html` tem `<!DOCTYPE>`, `<title>` e `lang`;
- nenhum `href`/`src` local aponta para arquivo inexistente.

`scripts/gerar-manifesto.mjs` confere que cada participante tem `nome` e que o
`github` (se informado) é um usuário válido.

Se a CI reclamar, a mensagem diz qual arquivo e qual linha. Corrija e commite de novo.
