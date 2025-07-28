import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("Usuário não autenticado");
    }

    const { payment_id } = await req.json();

    if (!payment_id) {
      throw new Error("Payment ID é obrigatório");
    }

    // Check payment status with Mercado Pago
    const mercadoPagoToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mercadoPagoToken) {
      throw new Error("Token do Mercado Pago não configurado");
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${mercadoPagoToken}`,
        "Content-Type": "application/json"
      }
    });

    if (!mpResponse.ok) {
      const error = await mpResponse.json();
      throw new Error(`Erro ao verificar pagamento: ${JSON.stringify(error)}`);
    }

    const mpData = await mpResponse.json();

    // Update order status if payment is approved
    if (mpData.status === "approved") {
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      await supabaseService
        .from("orders")
        .update({ 
          payment_status: "paid",
          paid_at: new Date().toISOString()
        })
        .eq("payment_id", payment_id);
        
      // Check if this is a subscription payment and activate it
      const { data: order } = await supabaseService
        .from("orders")
        .select("*")
        .eq("payment_id", payment_id)
        .single();
        
      if (order) {
        const { data: subscription } = await supabaseService
          .from("subscriptions")
          .select("*")
          .eq("user_id", order.user_id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
          
        if (subscription) {
          console.log("8. Ativando assinatura");
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1); // 1 mês de assinatura
          
          await supabaseService
            .from("subscriptions")
            .update({
              status: "active",
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              payment_id: payment_id,
              updated_at: new Date().toISOString()
            })
            .eq("id", subscription.id);
        } else {
          // Se não for assinatura, adicionar produtos comprados aos downloads
          console.log("9. Adicionando produtos aos downloads");
          const { data: orderItems } = await supabaseService
            .from("order_items")
            .select("product_id")
            .eq("order_id", order.id);
            
          if (orderItems && orderItems.length > 0) {
            // Adicionar cada produto aos downloads do usuário
            const downloadInserts = orderItems.map(item => ({
              user_id: order.user_id,
              product_id: item.product_id,
              order_id: order.id,
              downloaded_at: null,
              created_at: new Date().toISOString()
            }));
            
            await supabaseService
              .from("user_downloads")
              .insert(downloadInserts);
              
            console.log(`10. ${downloadInserts.length} produtos adicionados aos downloads do usuário`);
          }
        }
      }
    }

    return new Response(JSON.stringify({
      payment_id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
      external_reference: mpData.external_reference
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});