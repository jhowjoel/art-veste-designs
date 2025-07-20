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

    const { productId, amount, paymentMethod }: PaymentRequest = await req.json();

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

    // Add product to order items
    await supabaseService
      .from("order_items")
      .insert({
        order_id: order.id,
        product_id: productId,
        price: amount
      });

    // Simulate Mercado Pago payment creation
    const paymentData = {
      id: `MP_${Date.now()}`,
      status: "pending",
      amount: amount,
      currency: "BRL",
      payment_method: paymentMethod,
      created_at: new Date().toISOString()
    };

    if (paymentMethod === 'pix') {
      // Generate PIX payment data
      const pixData = {
        ...paymentData,
        pix: {
          qr_code: "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426614174000520400005303986540510.005802BR5925LOJA EXEMPLO6008BRASILIA62070503***6304",
          qr_code_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
          expires_in: 3600
        }
      };
      
      return new Response(JSON.stringify(pixData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      // Credit card payment
      const creditCardData = {
        ...paymentData,
        credit_card: {
          payment_url: `https://mercadopago.com.br/checkout/v1/redirect?preference-id=MP_${order.id}`,
          installments: [
            { installments: 1, total_amount: amount },
            { installments: 2, total_amount: amount * 1.05 },
            { installments: 3, total_amount: amount * 1.10 }
          ]
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