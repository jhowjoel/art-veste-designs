const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return { statusCode: 500, body: "Access token do Mercado Pago não configurado" };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "JSON inválido" };
  }

  const { amount, description = "Pagamento Pix" } = body;
  if (!amount) {
    return { statusCode: 400, body: "Valor não informado" };
  }

  // Cria o pagamento Pix via Mercado Pago
  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      transaction_amount: Number(amount),
      description,
      payment_method_id: "pix"
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return { statusCode: 500, body: JSON.stringify({ error: data }) };
  }

  // O código Pix fica em data.point_of_interaction.transaction_data.qr_code
  // O link da imagem do QR code fica em data.point_of_interaction.transaction_data.qr_code_base64

  return {
    statusCode: 200,
    body: JSON.stringify({
      pix_code: data.point_of_interaction.transaction_data.qr_code,
      // qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64, // se quiser exibir a imagem pronta
    })
  };
}; 