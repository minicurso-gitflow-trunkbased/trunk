// ===== Armazenamento (localStorage) =====
const CHAVE = "bolsas";

function carregarBolsas() {
  return JSON.parse(localStorage.getItem(CHAVE)) || [];
}

function salvarBolsas(bolsas) {
  localStorage.setItem(CHAVE, JSON.stringify(bolsas));
}

let bolsas = carregarBolsas();

// ===== Elementos =====
const form = document.getElementById("form-bolsa");
const campoId = document.getElementById("bolsa-id");
const campoTamanho = document.getElementById("tamanho");
const campoCor = document.getElementById("cor");
const campoPreco = document.getElementById("preco");
const erro = document.getElementById("erro");
const formTitulo = document.getElementById("form-titulo");
const btnSalvar = document.getElementById("btn-salvar");
const btnCancelar = document.getElementById("btn-cancelar");
const lista = document.getElementById("lista-bolsas");
const vazio = document.getElementById("vazio");

const nomesTamanho = { P: "Pequena", M: "Média", G: "Grande" };

const formatarPreco = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ===== READ: listar =====
function renderizar() {
  lista.innerHTML = "";
  vazio.hidden = bolsas.length > 0;

  bolsas.forEach((bolsa, indice) => {
    const tr = document.createElement("tr");
    if (String(bolsa.id) === campoId.value) tr.classList.add("editando");

    // textContent evita injeção de HTML vinda do campo "cor"
    [
      indice + 1,
      `${bolsa.tamanho} - ${nomesTamanho[bolsa.tamanho]}`,
      bolsa.cor,
      formatarPreco(bolsa.preco),
    ].forEach((valor) => {
      const td = document.createElement("td");
      td.textContent = valor;
      tr.appendChild(td);
    });

    const tdAcoes = document.createElement("td");

    const btnEditar = document.createElement("button");
    btnEditar.className = "btn btn-editar";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => iniciarEdicao(bolsa.id));

    const btnExcluir = document.createElement("button");
    btnExcluir.className = "btn btn-excluir";
    btnExcluir.textContent = "Excluir";
    btnExcluir.addEventListener("click", () => excluir(bolsa.id));

    tdAcoes.append(btnEditar, btnExcluir);
    tr.appendChild(tdAcoes);
    lista.appendChild(tr);
  });
}

// ===== Validação =====
function validar(tamanho, cor, preco) {
  if (!tamanho) return "Selecione o tamanho.";
  if (!cor) return "Informe a cor.";
  if (isNaN(preco) || preco <= 0) return "Informe um preço maior que zero.";
  return "";
}

// ===== CREATE / UPDATE: salvar =====
form.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const tamanho = campoTamanho.value;
  const cor = campoCor.value.trim();
  const preco = parseFloat(campoPreco.value);

  const mensagem = validar(tamanho, cor, preco);
  erro.textContent = mensagem;
  if (mensagem) return;

  if (campoId.value) {
    // UPDATE
    const id = Number(campoId.value);
    bolsas = bolsas.map((b) => (b.id === id ? { ...b, tamanho, cor, preco } : b));
  } else {
    // CREATE
    bolsas.push({ id: Date.now(), tamanho, cor, preco });
  }

  salvarBolsas(bolsas);
  limparFormulario();
  renderizar();
});

// ===== Edição =====
function iniciarEdicao(id) {
  const bolsa = bolsas.find((b) => b.id === id);
  if (!bolsa) return;

  campoId.value = bolsa.id;
  campoTamanho.value = bolsa.tamanho;
  campoCor.value = bolsa.cor;
  campoPreco.value = bolsa.preco;

  formTitulo.textContent = "Editar bolsa";
  btnSalvar.textContent = "Salvar alterações";
  btnCancelar.hidden = false;
  erro.textContent = "";

  renderizar();
  campoTamanho.focus();
}

function limparFormulario() {
  form.reset();
  campoId.value = "";
  erro.textContent = "";
  formTitulo.textContent = "Nova bolsa";
  btnSalvar.textContent = "Cadastrar";
  btnCancelar.hidden = true;
}

btnCancelar.addEventListener("click", () => {
  limparFormulario();
  renderizar();
});

// ===== DELETE =====
function excluir(id) {
  if (!confirm("Deseja realmente excluir esta bolsa?")) return;

  bolsas = bolsas.filter((b) => b.id !== id);
  salvarBolsas(bolsas);

  // Se a bolsa excluída estava em edição, limpa o formulário
  if (campoId.value === String(id)) limparFormulario();

  renderizar();
}

// ===== Inicialização =====
renderizar();
