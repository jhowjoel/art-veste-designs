const fetch = require("node-fetch");

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error("Access token do Mercado Pago não configurado");
    return { statusCode: 500, body: JSON.stringify({ error: "Access token do Mercado Pago não configurado" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.error("Erro ao fazer parse do JSON:", error);
    return { statusCode: 400, body: JSON.stringify({ error: "JSON inválido" }) };
  }

  const { amount, description = "Pagamento Pix" } = body;
  if (!amount) {
    console.error("Valor não informado");
    return { statusCode: 400, body: JSON.stringify({ error: "Valor não informado" }) };
  }

  console.log("Criando pagamento Pix:", { amount, description });

  try {
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
    console.log("Resposta do Mercado Pago:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("Erro na API do Mercado Pago:", data);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: "Erro na API do Mercado Pago", 
          details: data 
        }) 
      };
    }

    // Verifica se o pagamento foi criado com sucesso
    if (!data.point_of_interaction || !data.point_of_interaction.transaction_data) {
      console.error("Resposta inválida do Mercado Pago:", data);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: "Resposta inválida do Mercado Pago", 
          details: data 
        }) 
      };
    }

    const pixCode = data.point_of_interaction.transaction_data.qr_code;
    if (!pixCode) {
      console.error("Código Pix não encontrado na resposta:", data);
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          error: "Código Pix não encontrado", 
          details: data 
        }) 
      };
    }

    console.log("Código Pix gerado com sucesso:", pixCode);

    return {
      statusCode: 200,
      body: JSON.stringify({
        pix_code: pixCode,
        payment_id: data.id,
        status: data.status
      })
    };

  } catch (error) {
    console.error("Erro ao criar pagamento:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: "Erro interno do servidor", 
        details: error.message 
      }) 
    };
  }
}; 