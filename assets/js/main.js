/* =========================================================
   Minicurso Gitflow x Trunk-Based — script principal.
   Sem dependências externas, sem build de bundler.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- tema claro/escuro ---------- */
  var CHAVE_TEMA = 'minicurso:tema';

  function aplicarTema(tema) {
    document.documentElement.setAttribute('data-tema', tema);
    try { localStorage.setItem(CHAVE_TEMA, tema); } catch (e) { /* modo privado */ }
  }

  function temaInicial() {
    try {
      var salvo = localStorage.getItem(CHAVE_TEMA);
      if (salvo) return salvo;
    } catch (e) { /* ignora */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  }

  aplicarTema(temaInicial());

  var botaoTema = document.getElementById('alternar-tema');
  if (botaoTema) {
    botaoTema.addEventListener('click', function () {
      var atual = document.documentElement.getAttribute('data-tema');
      aplicarTema(atual === 'escuro' ? 'claro' : 'escuro');
    });
  }

  /* ---------- participantes ---------- */
  var grade = document.getElementById('grade-participantes');

  function iniciais(nome) {
    return nome.trim().split(/\s+/).slice(0, 2).map(function (p) {
      return p.charAt(0).toUpperCase();
    }).join('');
  }

  function criarCartao(p) {
    var artigo = document.createElement('article');
    artigo.className = 'participante';

    var avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = iniciais(p.nome || '?');
    artigo.appendChild(avatar);

    var titulo = document.createElement('h3');
    titulo.textContent = p.nome || 'Sem nome';
    artigo.appendChild(titulo);

    if (p.github) {
      var link = document.createElement('a');
      link.className = 'usuario';
      link.href = 'https://github.com/' + encodeURIComponent(p.github);
      link.rel = 'noopener';
      link.textContent = '@' + p.github;
      artigo.appendChild(link);
    }

    if (p.curiosidade) {
      var texto = document.createElement('p');
      texto.className = 'curiosidade';
      texto.textContent = p.curiosidade;
      artigo.appendChild(texto);
    }

    return artigo;
  }

  function renderizar(lista) {
    grade.innerHTML = '';
    if (!lista.length) {
      var vazio = document.createElement('p');
      vazio.className = 'vazio';
      vazio.textContent = 'Ninguém por aqui ainda — seja a primeira pessoa a adicionar um arquivo em data/participantes/.';
      grade.appendChild(vazio);
      return;
    }
    var fragmento = document.createDocumentFragment();
    lista.forEach(function (p) { fragmento.appendChild(criarCartao(p)); });
    grade.appendChild(fragmento);

    var metrica = document.querySelector('[data-metrica="participantes"]');
    if (metrica) metrica.textContent = String(lista.length);
  }

  function erro(mensagem) {
    grade.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'vazio';
    p.textContent = mensagem;
    grade.appendChild(p);
  }

  if (grade) {
    fetch('data/participantes.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (dados) {
        renderizar(Array.isArray(dados) ? dados : (dados.participantes || []));
      })
      .catch(function () {
        erro('Não foi possível carregar a lista. Rode "node scripts/gerar-manifesto.mjs" e sirva a pasta com um servidor HTTP local.');
      });
  }

  /* ---------- informação de build ---------- */
  var infoBuild = document.getElementById('build-info');
  if (infoBuild) {
    fetch('data/build.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (b) {
        if (b && b.commit) {
          infoBuild.textContent = 'commit ' + b.commit.slice(0, 7) + ' · ' + b.data;
        }
      })
      .catch(function () { /* build local, mantém o texto padrão */ });
  }
})();
