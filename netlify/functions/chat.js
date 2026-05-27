// ╔══════════════════════════════════════════════════════════════╗
// ║   NETLIFY FUNCTION — Proxy seguro para OpenAI               ║
// ║   Lumen · The Trust for the Americas                        ║
// ╚══════════════════════════════════════════════════════════════╝
//
// Esta função atua como intermediária entre o site e a OpenAI.
// A chave de API fica salva apenas nas variáveis de ambiente do
// Netlify — nunca exposta no código-fonte público do site.
//
// ► CONFIGURAÇÃO NECESSÁRIA NO NETLIFY:
//   Site settings → Environment variables → Add variable:
//   Nome:  OPENAI_API_KEY
//   Valor: sua chave (sk-proj-...)

exports.handler = async (event) => {
  // Só aceita POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Verifica se a chave está configurada no Netlify
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key não configurada no servidor." }),
    };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
