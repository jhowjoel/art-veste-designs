exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Parse o corpo da requisição
  const body = JSON.parse(event.body);

  // Aqui você pode processar o pagamento, liberar download, etc
  console.log("Webhook Mercado Pago recebido:", body);

  // Sempre retorne 200 para o Mercado Pago saber que recebeu
  return { statusCode: 200, body: "OK" };
}; 