const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://birvtlrxhsyjhyorgwzu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { orderId, productId } = event.queryStringParameters;
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

  // Busca a URL do SVG
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('svg_file_url, name')
    .eq('id', productId)
    .single();
  if (productError || !product) {
    return { statusCode: 404, body: 'Produto não encontrado' };
  }

  // Baixa o arquivo SVG
  const svgUrl = product.svg_file_url;
  const response = await fetch(svgUrl);
  if (!response.ok) {
    return { statusCode: 500, body: 'Erro ao baixar SVG' };
  }
  const svgContent = await response.text();

  // Registra o download
  await supabase.from('user_downloads').upsert({
    user_id: userId,
    product_id: productId,
    order_id: orderId,
    downloaded_at: new Date().toISOString(),
  });

  // Nome personalizado
  const fileName = `estampa-${product.name.replace(/[^a-zA-Z0-9-_]/g, '_')}-${orderId.slice(0,8)}.svg`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
    body: svgContent,
  };
}; 