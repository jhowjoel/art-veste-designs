const fetch = require("node-fetch");

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  const { payment_id } = body;
  if (!payment_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "payment_id não informado" }) };
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return { statusCode: 500, body: JSON.stringify({ error: "Access token do Mercado Pago não configurado" }) };
  }

  try {
    const url = `https://api.mercadopago.com/v1/payments/${payment_id}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ status: data.status, status_detail: data.status_detail, data })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao consultar pagamento", details: error.message })
    };
  }
}; 