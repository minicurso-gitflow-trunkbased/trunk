/* =========================================================
   Minicurso Gitflow x Trunk-Based — Visualizador de Trunk
   JavaScript puro, sem dependências externas.
   ========================================================= */
(function () {
  'use strict';

  // Estado da aplicação
  var estado = {
    commits: [],
    commitsOriginais: [],
    selecionadoSha: null,
    branchPendente: null,
    contadorSimulados: 1
  };

  // Elementos do DOM
  var elMetricaTotal = document.getElementById('metrica-total-commits');
  var elMetricaDiretos = document.getElementById('metrica-diretos-trunk');
  var elMetricaBranches = document.getElementById('metrica-branches-integradas');
  var elAreaTimeline = document.getElementById('area-timeline-trunk');
  var elConteudoDetalhes = document.getElementById('conteudo-detalhes');
  var elContadorExibidos = document.getElementById('contador-exibidos');
  var elCampoBusca = document.getElementById('campo-busca');
  var elFiltroTipo = document.getElementById('filtro-tipo');
  var elFiltroTrilha = document.getElementById('filtro-trilha');
  var elBtnAtualizarGithub = document.getElementById('botao-atualizar-github');
  var elSimuladorFeedback = document.getElementById('simulador-feedback');

  var btnSimularMain = document.getElementById('btn-simular-commit-main');
  var btnSimularBranch = document.getElementById('btn-simular-branch-curta');
  var btnSimularMerge = document.getElementById('btn-simular-merge-pr');
  var btnSimularRevert = document.getElementById('btn-simular-revert');
  var btnResetar = document.getElementById('btn-resetar-simulacao');

  // Fallback caso fetch falhe
  var COMMITS_FALLBACK = [
    {
      sha: 'f8a4c10b91e74a81d428fa52f20387b9275cb6e1',
      shortSha: 'f8a4c10',
      mensagem: 'feat: adiciona visualizador interativo de trunk',
      tipo: 'feat',
      autor: 'Eduardo',
      github: 'eduardo',
      data: '2026-11-03 20:45',
      branch: 'feat/visualizador-trunk',
      diretoNoTrunk: false,
      ci: 'passou',
      deploy: true,
      detalhes: 'Criação da tela de visualização interativa do fluxo do Trunk-Based Development com histórico real, filtros e simulador didático.',
      arquivos: ['visualizador.html', 'assets/js/visualizador.js', 'assets/css/style.css']
    },
    {
      sha: '0260b807e78638be4cfcb6c9d7d6687f2225b0c7',
      shortSha: '0260b80',
      mensagem: 'Merge pull request #1 from minicurso-gitflow-trunkbased/feat/adicionar-participante-vitor',
      tipo: 'merge',
      autor: 'Vitor Garcia',
      github: 'vitorpsogarcia',
      data: '2026-11-03 20:25',
      branch: 'main',
      diretoNoTrunk: false,
      ci: 'passou',
      deploy: true,
      detalhes: 'Branch curta integrada no mesmo dia. Como o branch viveu poucos minutos, o merge ocorreu sem conflitos.',
      arquivos: ['data/participantes/vitor-garcia.json']
    },
    {
      sha: 'a6c39038bb6d99238108215f51c682f4c3367aae',
      shortSha: 'a6c3903',
      mensagem: 'feat: adiciona participante lucas ribeiro',
      tipo: 'feat',
      autor: 'Lucas Ribeiro',
      github: 'Luqui05',
      data: '2026-11-03 20:42',
      branch: 'main',
      diretoNoTrunk: true,
      ci: 'passou',
      deploy: true,
      detalhes: 'Commit pequeno com contexto, feito direto na main. Segue a regra do trunk-based de não abrir branch para mudanças pequenas e seguras.',
      arquivos: ['data/participantes/lucas_ribeiro.json']
    },
    {
      sha: '7cf5b914a262353b260dee59c5e593e089d65ef4',
      shortSha: '7cf5b91',
      mensagem: 'feat: Adicionar minhas informações aos participantes',
      tipo: 'feat',
      autor: 'Vitor Garcia',
      github: 'vitorpsogarcia',
      data: '2026-11-03 20:23',
      branch: 'feat/adicionar-participante-vitor',
      diretoNoTrunk: false,
      ci: 'passou',
      deploy: false,
      detalhes: 'Commit em branch curta para revisão antes de integrar à main via Pull Request.',
      arquivos: ['data/participantes/vitor-garcia.json']
    },
    {
      sha: '2532b9e37fe50418ae38a9dc57ff1fb883f44e73',
      shortSha: '2532b9e',
      mensagem: 'fix: readme com url errada do site',
      tipo: 'fix',
      autor: 'Rakoski',
      github: 'rakoski',
      data: '2026-08-25 15:30',
      branch: 'main',
      diretoNoTrunk: true,
      ci: 'passou',
      deploy: true,
      detalhes: 'Correção de documentação pontual aplicada diretamente no trunk para manter a documentação sempre acurada.',
      arquivos: ['README.md']
    },
    {
      sha: '1d3621328c767539b3537b39287b84350273ee55',
      shortSha: '1d36213',
      mensagem: 'chore: estrutura inicial do site do minicurso',
      tipo: 'chore',
      autor: 'Rakoski',
      github: 'rakoski',
      data: '2026-08-25 14:00',
      branch: 'main',
      diretoNoTrunk: true,
      ci: 'passou',
      deploy: true,
      detalhes: 'Configuração inicial da stack estática, CI de validação e pipeline de deploy automático no GitHub Pages.',
      arquivos: ['index.html', 'assets/css/style.css', 'assets/js/main.js', '.github/workflows/deploy.yml']
    }
  ];

  function obterIniciais(nome) {
    if (!nome) return '?';
    return nome.trim().split(/\s+/).slice(0, 2).map(function (p) {
      return p.charAt(0).toUpperCase();
    }).join('');
  }

  function extrairTipoCommit(msg) {
    if (!msg) return 'outro';
    var normalizada = msg.trim().toLowerCase();
    if (normalizada.indexOf('merge') === 0) return 'merge';
    var casamento = normalizada.match(/^([a-z]+)(\(.*\))?:/);
    if (casamento && casamento[1]) return casamento[1];
    return 'outro';
  }

  function atualizarMetricas() {
    var total = estado.commits.length;
    var diretos = estado.commits.filter(function (c) { return c.diretoNoTrunk; }).length;
    var merges = estado.commits.filter(function (c) { return c.tipo === 'merge' || !c.diretoNoTrunk; }).length;

    if (elMetricaTotal) elMetricaTotal.textContent = String(total);
    if (elMetricaDiretos) elMetricaDiretos.textContent = String(diretos);
    if (elMetricaBranches) elMetricaBranches.textContent = String(merges);
  }

  function darFeedbackSimulador(texto, tipo) {
    if (!elSimuladorFeedback) return;
    elSimuladorFeedback.textContent = texto;
    elSimuladorFeedback.className = 'simulador-feedback ' + (tipo || 'info');
  }

  function filtrarCommits() {
    var termo = (elCampoBusca ? elCampoBusca.value.trim().toLowerCase() : '');
    var tipo = (elFiltroTipo ? elFiltroTipo.value : 'todos');
    var trilha = (elFiltroTrilha ? elFiltroTrilha.value : 'todas');

    return estado.commits.filter(function (c) {
      if (termo) {
        var matchMsg = c.mensagem && c.mensagem.toLowerCase().indexOf(termo) !== -1;
        var matchSha = (c.sha && c.sha.toLowerCase().indexOf(termo) !== -1) || (c.shortSha && c.shortSha.toLowerCase().indexOf(termo) !== -1);
        var matchAutor = c.autor && c.autor.toLowerCase().indexOf(termo) !== -1;
        if (!matchMsg && !matchSha && !matchAutor) return false;
      }
      if (tipo !== 'todos' && c.tipo !== tipo) return false;
      if (trilha === 'trunk' && !c.diretoNoTrunk && c.tipo !== 'merge') return false;
      if (trilha === 'branch' && c.diretoNoTrunk && c.tipo !== 'merge') return false;
      return true;
    });
  }

  function exibirDetalhes(commit) {
    if (!elConteudoDetalhes) return;
    estado.selecionadoSha = commit ? commit.sha : null;

    if (!commit) {
      elConteudoDetalhes.innerHTML = [
        '<div class="detalhe-placeholder">',
        '  <span class="icone-destaque">👆</span>',
        '  <h3>Selecione um commit</h3>',
        '  <p>Clique em qualquer nó na linha do tempo para inspecionar os detalhes, autor, impacto no trunk e status da CI.</p>',
        '</div>'
      ].join('');
      return;
    }

    var explicacaoPrincipio = '';
    if (commit.tipo === 'merge') {
      explicacaoPrincipio = '<strong>🔀 Integração Rápida (Merge PR):</strong> Branch efêmera integrada no tronco. No Trunk-Based, merges ocorrem com frequência e em branches com poucas horas de vida.';
    } else if (commit.diretoNoTrunk) {
      explicacaoPrincipio = '<strong>⚡ Mudança Direta no Trunk:</strong> Mudança atômica e segura realizada direto na main (Regra 3). Evita a sobrecarga de branches desnecessárias quando o escopo é pequeno.';
    } else {
      explicacaoPrincipio = '<strong>🌿 Branch Curta (Short-Lived):</strong> Trabalho em andamento ou isolado para revisão antes do merge. Deve ser concluído e integrado no mesmo dia (Regra 2).';
    }

    var arquivosHtml = '';
    if (commit.arquivos && commit.arquivos.length) {
      arquivosHtml = '<div class="detalhe-secao">' +
        '<span class="detalhe-rotulo">Arquivos modificados (' + commit.arquivos.length + '):</span>' +
        '<ul class="lista-arquivos">' +
        commit.arquivos.map(function (arq) {
          return '<li><code>' + escapeHtml(arq) + '</code></li>';
        }).join('') +
        '</ul></div>';
    }

    var autorLink = commit.github
      ? '<a href="https://github.com/' + encodeURIComponent(commit.github) + '" target="_blank" rel="noopener" class="usuario">@' + escapeHtml(commit.github) + '</a>'
      : '<span class="usuario-sem-link">' + escapeHtml(commit.autor || 'Desconhecido') + '</span>';

    elConteudoDetalhes.innerHTML = [
      '<div class="detalhe-ativo">',
      '  <div class="detalhe-cabecalho">',
      '    <span class="badge-tipo badge-' + escapeHtml(commit.tipo || 'outro') + '">' + escapeHtml(commit.tipo || 'commit') + '</span>',
      '    <span class="detalhe-sha" title="' + escapeHtml(commit.sha || '') + '">#' + escapeHtml(commit.shortSha || (commit.sha ? commit.sha.slice(0, 7) : '')) + '</span>',
      '    <button type="button" class="botao-copiar" id="btn-copiar-sha" title="Copiar hash do commit" aria-label="Copiar hash">Copiar</button>',
      '  </div>',
      '  <h3 class="detalhe-titulo">' + escapeHtml(commit.mensagem) + '</h3>',
      '  <div class="detalhe-autor">',
      '    <div class="avatar avatar-pequeno">' + escapeHtml(obterIniciais(commit.autor)) + '</div>',
      '    <div class="detalhe-autor-info">',
      '      <strong>' + escapeHtml(commit.autor || 'Autor') + '</strong>',
      '      ' + autorLink,
      '      <span class="detalhe-data">' + escapeHtml(commit.data || '') + '</span>',
      '    </div>',
      '  </div>',
      '  <div class="detalhe-meta">',
      '    <div><span class="detalhe-rotulo">Branch de origem:</span> <code>' + escapeHtml(commit.branch || 'main') + '</code></div>',
      '    <div><span class="detalhe-rotulo">Status CI:</span> <span class="tag-status tag-sucesso">✔ Validado</span></div>',
      '    <div><span class="detalhe-rotulo">Deploy:</span> ' + (commit.deploy ? '<span class="tag-status tag-deploy">🚀 Em produção</span>' : '<span class="tag-status">Em branch</span>') + '</div>',
      '  </div>',
      '  <div class="detalhe-caixa-principio">' + explicacaoPrincipio + '</div>',
      arquivosHtml,
      '</div>'
    ].join('');

    var btnCopiar = document.getElementById('btn-copiar-sha');
    if (btnCopiar) {
      btnCopiar.addEventListener('click', function () {
        if (navigator.clipboard && commit.sha) {
          navigator.clipboard.writeText(commit.sha).then(function () {
            btnCopiar.textContent = 'Copiado!';
            setTimeout(function () { btnCopiar.textContent = 'Copiar'; }, 2000);
          }).catch(function () {
            btnCopiar.textContent = 'Erro ao copiar';
          });
        }
      });
    }
  }

  function escapeHtml(texto) {
    if (!texto) return '';
    return String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderizarTimeline() {
    if (!elAreaTimeline) return;
    var filtrados = filtrarCommits();

    if (elContadorExibidos) {
      elContadorExibidos.textContent = filtrados.length + ' de ' + estado.commits.length + ' commit(s)';
    }

    elAreaTimeline.innerHTML = '';

    if (!filtrados.length) {
      var vazio = document.createElement('div');
      vazio.className = 'vazio-timeline';
      vazio.textContent = 'Nenhum commit encontrado para os filtros selecionados.';
      elAreaTimeline.appendChild(vazio);
      exibirDetalhes(null);
      return;
    }

    var containerTimeline = document.createElement('div');
    containerTimeline.className = 'timeline-grafo';

    filtrados.forEach(function (commit, index) {
      var item = document.createElement('div');
      item.className = 'timeline-item' + (estado.selecionadoSha === commit.sha ? ' selecionado' : '');
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', 'Commit ' + commit.shortSha + ': ' + commit.mensagem);

      var ehMerge = commit.tipo === 'merge';
      var ehTrunk = commit.diretoNoTrunk || ehMerge;

      // Coluna visual com os trilhos e o ponto de nó
      var colunaGrafica = document.createElement('div');
      colunaGrafica.className = 'trilha-visual';

      // Linha contínua do trunk
      var linhaTrunk = document.createElement('div');
      linhaTrunk.className = 'linha-rail linha-trunk';
      colunaGrafica.appendChild(linhaTrunk);

      // Linha secundária de branch
      var linhaBranch = document.createElement('div');
      linhaBranch.className = 'linha-rail linha-branch';
      colunaGrafica.appendChild(linhaBranch);

      // Nó do commit
      var ponto = document.createElement('div');
      var classePonto = 'ponto-commit ' + (ehMerge ? 'ponto-merge' : (ehTrunk ? 'ponto-trunk' : 'ponto-branch'));
      ponto.className = classePonto;

      var iconePonto = ehMerge ? '🔀' : (ehTrunk ? '●' : '🌿');
      ponto.textContent = iconePonto;
      colunaGrafica.appendChild(ponto);

      // Conector SVG suave para merge ou branch
      if (ehMerge) {
        var svgConector = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgConector.setAttribute('class', 'conector-svg');
        svgConector.setAttribute('viewBox', '0 0 40 40');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M 30,0 C 30,20 10,20 10,40');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', 'currentColor');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-dasharray', '3 3');
        svgConector.appendChild(path);
        colunaGrafica.appendChild(svgConector);
      } else if (!ehTrunk) {
        var svgBranch = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgBranch.setAttribute('class', 'conector-svg conector-saida');
        svgBranch.setAttribute('viewBox', '0 0 40 40');
        var pathBranch = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathBranch.setAttribute('d', 'M 10,0 C 10,20 30,20 30,40');
        pathBranch.setAttribute('fill', 'none');
        pathBranch.setAttribute('stroke', 'currentColor');
        pathBranch.setAttribute('stroke-width', '2');
        svgBranch.appendChild(pathBranch);
        colunaGrafica.appendChild(svgBranch);
      }

      item.appendChild(colunaGrafica);

      // Conteúdo informativo do cartão de commit
      var corpo = document.createElement('div');
      corpo.className = 'timeline-corpo';

      var topoCard = document.createElement('div');
      topoCard.className = 'timeline-topo-card';

      var badge = document.createElement('span');
      badge.className = 'badge-tipo badge-' + (commit.tipo || 'outro');
      badge.textContent = commit.tipo || 'commit';
      topoCard.appendChild(badge);

      var hash = document.createElement('span');
      hash.className = 'hash-commit';
      hash.textContent = '#' + (commit.shortSha || (commit.sha ? commit.sha.slice(0, 7) : ''));
      topoCard.appendChild(hash);

      if (index === 0) {
        var headBadge = document.createElement('span');
        headBadge.className = 'badge-head';
        headBadge.textContent = 'HEAD (Último Deploy)';
        topoCard.appendChild(headBadge);
      }

      corpo.appendChild(topoCard);

      var msg = document.createElement('div');
      msg.className = 'timeline-mensagem';
      msg.textContent = commit.mensagem;
      corpo.appendChild(msg);

      var rodapeCard = document.createElement('div');
      rodapeCard.className = 'timeline-rodape-card';

      var autor = document.createElement('span');
      autor.className = 'timeline-autor';
      autor.textContent = '👤 ' + (commit.autor || 'Anônimo');
      rodapeCard.appendChild(autor);

      var data = document.createElement('span');
      data.className = 'timeline-data';
      data.textContent = '🕒 ' + (commit.data || '');
      rodapeCard.appendChild(data);

      var trilhaTag = document.createElement('span');
      trilhaTag.className = 'timeline-trilha-tag ' + (ehTrunk ? 'tag-trunk' : 'tag-branch');
      trilhaTag.textContent = ehTrunk ? 'main' : (commit.branch || 'branch curta');
      rodapeCard.appendChild(trilhaTag);

      corpo.appendChild(rodapeCard);
      item.appendChild(corpo);

      // Eventos de clique e acessibilidade (Enter / Space)
      function selecionar() {
        var anteriores = containerTimeline.querySelectorAll('.timeline-item.selecionado');
        for (var i = 0; i < anteriores.length; i++) {
          anteriores[i].classList.remove('selecionado');
        }
        item.classList.add('selecionado');
        exibirDetalhes(commit);
      }

      item.addEventListener('click', selecionar);
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selecionar();
        }
      });

      containerTimeline.appendChild(item);
    });

    elAreaTimeline.appendChild(containerTimeline);

    // Seleciona automaticamente o primeiro se nenhum selecionado
    if (!estado.selecionadoSha && filtrados.length > 0) {
      exibirDetalhes(filtrados[0]);
      var primeiro = containerTimeline.querySelector('.timeline-item');
      if (primeiro) primeiro.classList.add('selecionado');
    }
  }

  function carregarHistoricoLocal() {
    fetch('data/commits-historico.json', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (dados) {
        estado.commits = dados;
        estado.commitsOriginais = JSON.parse(JSON.stringify(dados));
        atualizarMetricas();
        renderizarTimeline();
      })
      .catch(function () {
        // Fallback seguro caso não consiga ler o arquivo
        estado.commits = COMMITS_FALLBACK;
        estado.commitsOriginais = JSON.parse(JSON.stringify(COMMITS_FALLBACK));
        atualizarMetricas();
        renderizarTimeline();
      });
  }

  function consultarGitHubApi() {
    if (!elBtnAtualizarGithub) return;
    var textoOriginal = elBtnAtualizarGithub.innerHTML;
    elBtnAtualizarGithub.disabled = true;
    elBtnAtualizarGithub.innerHTML = '<span>⏳</span> Consultando…';

    fetch('https://api.github.com/repos/minicurso-gitflow-trunkbased/minicurso-gitflow-trunkbased.github.io/commits?per_page=30')
      .then(function (res) {
        if (!res.ok) throw new Error('Status ' + res.status);
        return res.json();
      })
      .then(function (dados) {
        if (!Array.isArray(dados)) throw new Error('Resposta inesperada');

        var processados = dados.map(function (c) {
          var msg = (c.commit && c.commit.message) ? c.commit.message.split('\n')[0] : 'Commit';
          var autorNome = (c.commit && c.commit.author && c.commit.author.name) ? c.commit.author.name : 'GitHub User';
          var login = (c.author && c.author.login) ? c.author.login : null;
          var dataIso = (c.commit && c.commit.author && c.commit.author.date) ? c.commit.author.date : '';
          var dataFormatada = dataIso ? dataIso.replace('T', ' ').slice(0, 16) : '';
          var tipo = extrairTipoCommit(msg);
          var ehMerge = tipo === 'merge' || (c.parents && c.parents.length > 1);

          return {
            sha: c.sha,
            shortSha: c.sha ? c.sha.slice(0, 7) : '',
            mensagem: msg,
            tipo: tipo,
            autor: autorNome,
            github: login,
            data: dataFormatada,
            branch: 'main',
            diretoNoTrunk: !ehMerge,
            ci: 'passou',
            deploy: true,
            detalhes: 'Commit obtido em tempo real da API pública do GitHub Pages do repositório.',
            arquivos: []
          };
        });

        estado.commits = processados;
        atualizarMetricas();
        renderizarTimeline();
        darFeedbackSimulador('✅ ' + processados.length + ' commits carregados diretamente do GitHub!', 'sucesso');
      })
      .catch(function (err) {
        darFeedbackSimulador('Aviso: Limite de requisições do GitHub ou offline. Exibindo histórico local seguro.', 'alerta');
        carregarHistoricoLocal();
      })
      .finally(function () {
        elBtnAtualizarGithub.disabled = false;
        elBtnAtualizarGithub.innerHTML = textoOriginal;
      });
  }

  // Ações do Simulador Didático
  function simularCommitMain() {
    var numero = estado.contadorSimulados++;
    var nomes = ['Carlos Dev', 'Ana Front', 'Marina QA', 'João Backend'];
    var autorEscolhido = nomes[numero % nomes.length];
    var novo = {
      sha: 'sim' + Math.random().toString(16).slice(2, 9) + '00000',
      shortSha: 'sim' + Math.random().toString(16).slice(2, 6),
      mensagem: 'feat: adiciona componente de alerta #' + numero,
      tipo: 'feat',
      autor: autorEscolhido,
      github: null,
      data: 'Agora',
      branch: 'main',
      diretoNoTrunk: true,
      ci: 'passou',
      deploy: true,
      detalhes: 'Commit pequeno simulado direto na main. Segue a regra do Trunk-Based: commits atômicos integram sem cerimônia.',
      arquivos: ['assets/css/style.css', 'index.html']
    };

    estado.commits.unshift(novo);
    atualizarMetricas();
    renderizarTimeline();
    darFeedbackSimulador('🚀 Commit #' + novo.shortSha + ' integrado direto na main! A CI validou e o deploy entrou no ar.', 'sucesso');
  }

  function simularBranchCurta() {
    var numero = estado.contadorSimulados++;
    var branchNome = 'feat/filtro-avancado-' + numero;
    var novo = {
      sha: 'br' + Math.random().toString(16).slice(2, 9) + '00000',
      shortSha: 'br' + Math.random().toString(16).slice(2, 6),
      mensagem: 'feat: rascunho do filtro avançado em branch efêmera',
      tipo: 'feat',
      autor: 'Você (Aluno)',
      github: null,
      data: 'Agora',
      branch: branchNome,
      diretoNoTrunk: false,
      ci: 'passou',
      deploy: false,
      detalhes: 'Branch curta criada para desenvolvimento em equipe. No Trunk-Based, esta branch deve ser integrada ainda hoje!',
      arquivos: ['assets/js/visualizador.js']
    };

    estado.branchPendente = {
      nome: branchNome,
      commitSha: novo.sha
    };

    if (btnSimularMerge) btnSimularMerge.disabled = false;

    estado.commits.unshift(novo);
    atualizarMetricas();
    renderizarTimeline();
    darFeedbackSimulador('🌿 Branch curta "' + branchNome + '" criada! Clique em "Integrar PR na main" para concluir o ciclo.', 'info');
  }

  function simularMergePR() {
    if (!estado.branchPendente) return;
    var branchNome = estado.branchPendente.nome;
    var numero = estado.contadorSimulados++;

    var mergeCommit = {
      sha: 'mg' + Math.random().toString(16).slice(2, 9) + '00000',
      shortSha: 'mg' + Math.random().toString(16).slice(2, 6),
      mensagem: 'Merge pull request #' + numero + ' from ' + branchNome,
      tipo: 'merge',
      autor: 'Revisor / Lead',
      github: null,
      data: 'Agora',
      branch: 'main',
      diretoNoTrunk: false,
      ci: 'passou',
      deploy: true,
      detalhes: 'Merge realizado via Pull Request no mesmo dia. Branch efêmera fechada e código integrado no tronco principal.',
      arquivos: ['assets/js/visualizador.js']
    };

    estado.branchPendente = null;
    if (btnSimularMerge) btnSimularMerge.disabled = true;

    estado.commits.unshift(mergeCommit);
    atualizarMetricas();
    renderizarTimeline();
    darFeedbackSimulador('🔀 Merge concluído com sucesso! A branch foi integrada à main sem conflitos.', 'sucesso');
  }

  function simularRevert() {
    var commitFalho = {
      sha: 'err' + Math.random().toString(16).slice(2, 9) + '00000',
      shortSha: 'err' + Math.random().toString(16).slice(2, 6),
      mensagem: 'fix: tentativa que quebrou validação da CI',
      tipo: 'fix',
      autor: 'Dev Apressado',
      github: null,
      data: 'Agora',
      branch: 'main',
      diretoNoTrunk: true,
      ci: 'falhou',
      deploy: false,
      detalhes: 'Commit que quebrou os testes automáticos da pipeline de validação.',
      arquivos: ['scripts/validar.mjs']
    };

    var revertCommit = {
      sha: 'rev' + Math.random().toString(16).slice(2, 9) + '00000',
      shortSha: 'rev' + Math.random().toString(16).slice(2, 6),
      mensagem: 'revert: desfaz "' + commitFalho.mensagem + '"',
      tipo: 'fix',
      autor: 'Plantão CI',
      github: null,
      data: 'Agora',
      branch: 'main',
      diretoNoTrunk: true,
      ci: 'passou',
      deploy: true,
      detalhes: 'Regra 5 do Trunk-Based: "Quebrou a main? Conserta primeiro". O git revert desfaz o problema em segundos mantendo o histórico intacto.',
      arquivos: ['scripts/validar.mjs']
    };

    estado.commits.unshift(commitFalho);
    estado.commits.unshift(revertCommit);
    atualizarMetricas();
    renderizarTimeline();
    darFeedbackSimulador('🛡️ Regra 5 na prática: Commit com falha foi rapidamente revertido (git revert). A main voltou ao verde!', 'alerta');
  }

  function resetarSimulacao() {
    estado.commits = JSON.parse(JSON.stringify(estado.commitsOriginais));
    estado.branchPendente = null;
    if (btnSimularMerge) btnSimularMerge.disabled = true;
    atualizarMetricas();
    renderizarTimeline();
    darFeedbackSimulador('Estado restaurado para o histórico original.', 'info');
  }

  // Listeners de eventos
  if (elCampoBusca) elCampoBusca.addEventListener('input', renderizarTimeline);
  if (elFiltroTipo) elFiltroTipo.addEventListener('change', renderizarTimeline);
  if (elFiltroTrilha) elFiltroTrilha.addEventListener('change', renderizarTimeline);
  if (elBtnAtualizarGithub) elBtnAtualizarGithub.addEventListener('click', consultarGitHubApi);

  if (btnSimularMain) btnSimularMain.addEventListener('click', simularCommitMain);
  if (btnSimularBranch) btnSimularBranch.addEventListener('click', simularBranchCurta);
  if (btnSimularMerge) btnSimularMerge.addEventListener('click', simularMergePR);
  if (btnSimularRevert) btnSimularRevert.addEventListener('click', simularRevert);
  if (btnResetar) btnResetar.addEventListener('click', resetarSimulacao);

  // Inicialização
  carregarHistoricoLocal();
})();
