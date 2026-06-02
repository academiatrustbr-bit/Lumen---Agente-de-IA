// ╔══════════════════════════════════════════════════════════════╗
// ║   APPS SCRIPT — LUMEN · The Trust for the Americas          ║
// ║   Versão 1.0 · Registro automático de dados do curso        ║
// ╚══════════════════════════════════════════════════════════════╝
//
// ► ANTES DE IMPLANTAR:
//   1. Substitua o valor de SPREADSHEET_ID abaixo pelo ID
//      da sua planilha do Google Sheets.
//   2. O ID está na URL da planilha, entre /d/ e /edit:
//      https://docs.google.com/spreadsheets/d/ ► ID AQUI ◄ /edit
//
// ► COMO IMPLANTAR:
//   1. Clique em Implantar → Nova implantação
//   2. Tipo: App da Web
//   3. Executar como: Eu (seu e-mail)
//   4. Quem tem acesso: Qualquer pessoa
//   5. Clique em Implantar e copie a URL gerada
//
// ► A planilha criará 4 abas automaticamente na primeira execução:
//   • Sessões       → quem abriu o chat (1 linha por participante)
//   • Perfis        → dados coletados ao longo do curso (nome, email, país…)
//   • Conclusões    → quem passou na avaliação final
//   • Certificados  → quem baixou o PDF do certificado

// ── CONFIGURAÇÃO ──────────────────────────────────────────────
const SPREADSHEET_ID = "1c_8QSvsvZA0e1C83hZstfjHl0g2L3nAxT6qyR1g71xk";

// Cor do cabeçalho das abas (azul marinho da Trust)
const COR_CABECALHO  = "#0a206b";
const COR_TEXTO      = "#ffffff";

// ══════════════════════════════════════════════════════════════
// RECEBE REQUISIÇÕES POST (dados enviados pelo site)
// ══════════════════════════════════════════════════════════════
function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    const tipo  = (dados.tipo || "").toLowerCase();

    if      (tipo === "sessao_iniciada")  salvarSessao(dados);
    else if (tipo === "perfil")           salvarPerfil(dados);
    else if (tipo === "conclusao")        salvarConclusao(dados);
    else if (tipo === "certificado")      salvarCertificado(dados);
    else if (tipo === "atualizacao_perfil") { /* ignorado — dados parciais intermediários */ }
    else Logger.log("Tipo não reconhecido (ignorado): " + tipo);

    return resposta({ status: "ok" });

  } catch (err) {
    return resposta({ status: "erro", mensagem: err.message });
  }
}

// ══════════════════════════════════════════════════════════════
// RECEBE REQUISIÇÕES GET (teste de funcionamento)
// ══════════════════════════════════════════════════════════════
function doGet() {
  return resposta({
    status:  "ok",
    servico: "Lumen · The Trust for the Americas",
    versao:  "1.0"
  });
}

// ══════════════════════════════════════════════════════════════
// ABA 1 · SESSÕES
// Registrado assim que o participante abre o chat e escolhe idioma
// ══════════════════════════════════════════════════════════════
function salvarSessao(d) {
  const cabecalhos = [
    "Data e Hora",
    "Idioma",
    "ID de Sessão"
  ];

  const aba = garantirAba("Sessões", cabecalhos);

  aba.appendRow([
    agora(),
    d.idioma    || "",
    d.sessaoId  || ""
  ]);
}

// ══════════════════════════════════════════════════════════════
// ABA 2 · PERFIS
// Dados coletados pelo Lumen ao longo do curso (enviado no email)
// ══════════════════════════════════════════════════════════════
function salvarPerfil(d) {
  const cabecalhos = [
    "Data e Hora",
    "Nome Completo",
    "Ano de Nascimento",
    "País",
    "Estado (México)",
    "Perfil",
    "E-mail",
    "Idioma",
    "ID de Sessão"
  ];

  const aba = garantirAba("Perfis", cabecalhos);

  aba.appendRow([
    agora(),
    d.nome           || "",
    d.anoNascimento  || "",
    d.pais           || "",
    d.estadoMexico   || "",
    d.perfil         || "",
    d.email          || "",
    d.idioma         || "",
    d.sessaoId       || ""
  ]);
}

// ══════════════════════════════════════════════════════════════
// ABA 2 · CONCLUSÕES
// Registrado quando o usuário passa na avaliação final
// ══════════════════════════════════════════════════════════════
function salvarConclusao(d) {
  const cabecalhos = [
    "Data e Hora",
    "Nome Completo",
    "E-mail",
    "País",
    "Perfil",
    "Idioma",
    "Pontuação",
    "ID de Sessão"
  ];

  const aba = garantirAba("Conclusões", cabecalhos);

  aba.appendRow([
    agora(),
    d.nome       || "",
    d.email      || "",
    d.pais       || "",
    d.perfil     || "",
    d.idioma     || "",
    d.pontuacao  || "",
    d.sessaoId   || ""
  ]);
}

// ══════════════════════════════════════════════════════════════
// ABA 3 · CERTIFICADOS
// Registrado quando o usuário baixa o PDF do certificado
// ══════════════════════════════════════════════════════════════
function salvarCertificado(d) {
  const cabecalhos = [
    "Data e Hora",
    "Nome no Certificado",
    "Idioma",
    "Curso",
    "Ação",
    "Origem (URL)",
    "Navegador"
  ];

  const aba = garantirAba("Certificados", cabecalhos);

  aba.appendRow([
    agora(),
    d.nomeCertificado || "",
    d.idioma          || "",
    d.curso           || "",
    d.acao            || "download",
    d.origem          || "",
    d.userAgent       || ""
  ]);
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════

// Retorna a aba pelo nome; cria com cabeçalho formatado se não existir
function garantirAba(nome, cabecalhos) {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   aba = ss.getSheetByName(nome);

  if (!aba) {
    aba = ss.insertSheet(nome);

    // Insere cabeçalho
    aba.appendRow(cabecalhos);

    // Formata cabeçalho
    const range = aba.getRange(1, 1, 1, cabecalhos.length);
    range.setBackground(COR_CABECALHO);
    range.setFontColor(COR_TEXTO);
    range.setFontWeight("bold");
    range.setFontSize(11);
    range.setHorizontalAlignment("center");
    aba.setFrozenRows(1);

    // Ajusta largura das colunas
    for (let i = 1; i <= cabecalhos.length; i++) {
      aba.setColumnWidth(i, 180);
    }
  }

  return aba;
}

// Formata data/hora no padrão dd/mm/aaaa hh:mm:ss
function agora() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Retorna resposta JSON com headers CORS
function resposta(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════════════════
// FUNÇÃO DE TESTE — execute manualmente para verificar
// ══════════════════════════════════════════════════════════════
function testar() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log("✅ Planilha encontrada: " + ss.getName());

    // Simula início de sessão
    salvarSessao({
      idioma: "PT",
      sessaoId: "teste-123"
    });
    Logger.log("✅ Aba Sessões criada/atualizada");

    // Simula um registro de perfil
    salvarPerfil({
      nome: "Teste Silva",
      anoNascimento: "1990",
      pais: "Brasil",
      estadoMexico: "",
      perfil: "Estudante",
      email: "teste@email.com",
      idioma: "PT",
      sessaoId: "teste-123"
    });
    Logger.log("✅ Aba Perfis criada/atualizada");

    // Simula conclusão
    salvarConclusao({
      nome: "Teste Silva",
      email: "teste@email.com",
      pais: "Brasil",
      perfil: "Estudante",
      idioma: "PT",
      pontuacao: "3/3",
      sessaoId: "teste-123"
    });
    Logger.log("✅ Aba Conclusões criada/atualizada");

    // Simula certificado
    salvarCertificado({
      nomeCertificado: "Teste Silva",
      idioma: "PT",
      curso: "Crie o seu Agente de IA Pessoal com Microsoft Copilot Studio",
      acao: "download",
      origem: "https://lumen.netlify.app/certificado.html?lang=pt",
      userAgent: "Mozilla/5.0"
    });
    Logger.log("✅ Aba Certificados criada/atualizada");

    Logger.log("🎉 Teste concluído com sucesso! Verifique as 4 abas na planilha.");
  } catch (err) {
    Logger.log("❌ Erro: " + err.message);
    Logger.log("👉 Verifique se SPREADSHEET_ID está correto.");
  }
}
