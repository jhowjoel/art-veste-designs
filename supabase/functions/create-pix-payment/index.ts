import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  productId: string;
  amount: number;
  paymentMethod: 'pix' | 'credit_card';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("1. Iniciando função create-pix-payment");
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    console.log("2. Cliente Supabase criado");

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    console.log("3. Auth header:", authHeader ? "presente" : "ausente");
    
    if (!authHeader) {
      throw new Error("Header de autorização não encontrado");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    console.log("4. Usuário autenticado:", user?.email || "não encontrado");

    if (!user?.email) {
      throw new Error("Usuário não autenticado");
    }

    const { productId, amount, paymentMethod }: PaymentRequest = await req.json();
    
    console.log("5. Dados recebidos:", { productId, amount, paymentMethod });

    // Create order in database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: amount,
        payment_method: paymentMethod,
        payment_status: "pending"
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Handle subscription products
    if (productId === "subscription-monthly") {
      console.log("6. Criando assinatura mensal");
      await supabaseService
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plan_type: "monthly",
          status: "pending",
          amount: amount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } else {
      // Add product to order items for regular products
      await supabaseService
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: productId,
          price: amount
        });
    }

    // Create PIX payment using real Mercado Pago API
    if (paymentMethod === 'pix') {
      const mercadoPagoToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!mercadoPagoToken) {
        throw new Error("Token do Mercado Pago não configurado");
      }

      const idempotencyKey = `${order.id}-${Date.now()}`;
      
      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mercadoPagoToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          transaction_amount: amount / 100,
          description: `Compra EstampArt - Pedido ${order.id}`,
          payment_method_id: "pix",
          external_reference: order.id,
          payer: {
            email: user.email,
            first_name: user.user_metadata?.full_name?.split(' ')[0] || "Cliente",
            last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "EstampArt"
          }
        })
      });

      if (!mpResponse.ok) {
        const error = await mpResponse.json();
        throw new Error(`Erro Mercado Pago: ${JSON.stringify(error)}`);
      }

      const mpData = await mpResponse.json();
      
      // Update order with payment ID
      await supabaseService
        .from("orders")
        .update({ 
          payment_id: mpData.id,
          payment_status: mpData.status 
        })
        .eq("id", order.id);

      const pixData = {
        order_id: order.id,
        payment_id: mpData.id,
        status: mpData.status,
        pix: {
          qr_code: mpData.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: mpData.point_of_interaction.transaction_data.qr_code_base64,
          expires_in: 1800, // 30 minutos
          payment_id: mpData.id
        }
      };
      
      return new Response(JSON.stringify(pixData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Credit card payment - create Mercado Pago preference
      const mercadoPagoToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!mercadoPagoToken) {
        throw new Error("Token do Mercado Pago não configurado");
      }

      const preferenceData = {
        items: [
          {
            title: `Assinatura EstampArt - Plano Premium`,
            description: `Plano mensal premium com downloads ilimitados`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: amount / 100
          }
        ],
        external_reference: order.id,
        payer: {
          email: user.email,
          name: user.user_metadata?.full_name || "Cliente EstampArt"
        },
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" },
            { id: "bank_transfer" }
          ],
          installments: 3
        },
        back_urls: {
          success: `${req.headers.get("origin")}/payment-success`,
          failure: `${req.headers.get("origin")}/payment-canceled`,
          pending: `${req.headers.get("origin")}/payment-pending`
        },
        auto_return: "approved"
      };

      const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mercadoPagoToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(preferenceData)
      });

      if (!mpResponse.ok) {
        const error = await mpResponse.json();
        throw new Error(`Erro Mercado Pago: ${JSON.stringify(error)}`);
      }

      const mpData = await mpResponse.json();
      
      // Update order with payment ID
      await supabaseService
        .from("orders")
        .update({ 
          payment_id: mpData.id,
          payment_status: "pending" 
        })
        .eq("id", order.id);

      const creditCardData = {
        order_id: order.id,
        payment_id: mpData.id,
        status: "pending",
        credit_card: {
          payment_url: mpData.init_point,
          sandbox_url: mpData.sandbox_init_point
        }
      };
      
      return new Response(JSON.stringify(creditCardData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});