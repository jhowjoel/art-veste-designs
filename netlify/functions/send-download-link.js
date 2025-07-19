const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://birvtlrxhsyjhyorgwzu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }
  const { email, orderId, productId } = body;
  if (!email || !orderId || !productId) {
    return { statusCode: 400, body: 'Missing parameters' };
  }

  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  if (!authHeader) {
    return { statusCode: 401, body: 'Missing Authorization header' };
  }
  const jwt = authHeader.replace('Bearer ', '');

  // Verifica usuário autenticado
  const { data: user, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !user?.user) {
    return { statusCode: 401, body: 'Usuário não autenticado' };
  }
  const userId = user.user.id;

  // Verifica se o pedido é do usuário e está pago
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .eq('payment_status', 'paid')
    .single();
  if (orderError || !order) {
    return { statusCode: 403, body: 'Pedido não encontrado ou não pago' };
  }

  // Verifica se o produto faz parte do pedido
  const { data: item, error: itemError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .eq('product_id', productId)
    .single();
  if (itemError || !item) {
    return { statusCode: 403, body: 'Produto não faz parte do pedido' };
  }

  // Gera link seguro de download
  const downloadUrl = `${process.env.URL || 'https://estampart.shop'}/api/download-svg?orderId=${orderId}&productId=${productId}`;

  // Envia e-mail via Resend
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'EstampArt <no-reply@estampart.shop>',
      to: email,
      subject: 'Seu download está pronto! 🎨',
      html: `<h2>Obrigado pela sua compra!</h2><p>Seu arquivo está pronto para download:</p><p><a href="${downloadUrl}" style="color:#00F0FF;font-weight:bold;">Clique aqui para baixar</a></p><p>Se não conseguir clicar, copie e cole este link no navegador:<br>${downloadUrl}</p><br><p>Equipe EstampArt</p>`
    })
  });

  if (!emailRes.ok) {
    return { statusCode: 500, body: 'Erro ao enviar e-mail' };
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
}; 