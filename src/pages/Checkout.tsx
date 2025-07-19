
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Smartphone, CreditCard, Barcode, QrCode, CheckCircle } from "lucide-react";

const MP_ACCESS_TOKEN = "APP_USR-747523229528627-071912-c8e1710f5dd34feaef164a0f5a074bbb-2459761075";

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Função para criar pagamento Pix real
  async function handlePayment() {
    setLoading(true);
    setPaymentUrl("");
    setQrCode("");
    setPixKey("");
    setPaymentSuccess(false);

    try {
      if (paymentMethod === "pix") {
        // Montar os itens do carrinho para a preferência
        const items = cartItems.map(item => ({
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: "BRL"
        }));
        // Criar preferência Pix via API Mercado Pago
        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${MP_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            items,
            payment_methods: { excluded_payment_types: [{ id: "credit_card" }, { id: "ticket" }] },
            // Você pode adicionar payer, notification_url, etc
          })
        });
        const data = await response.json();
        // Buscar QR Code Pix
        if (data && data.init_point) {
          setPaymentUrl(data.init_point);
          // Buscar QR Code Pix via API de pagamentos
          // (Para checkout transparente Pix, normalmente é via endpoint /v1/payments)
        }
      } else if (paymentMethod === "boleto") {
        setPaymentUrl("https://www.mercadopago.com.br/checkout/boleto-exemplo");
      } else {
        setPaymentUrl("https://www.mercadopago.com.br/checkout/cartao-exemplo");
      }
    } catch (err) {
      alert("Erro ao criar pagamento: " + err);
    }
    setLoading(false);
  }

  // Simular confirmação de pagamento
  function handleConfirmPayment() {
    setPaymentSuccess(true);
    clearCart();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-art-bg to-white">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold mb-2 text-art-primary">Pagamento</CardTitle>
            <p className="text-muted-foreground mb-2">Finalize sua compra de forma rápida e segura</p>
            <Separator className="my-4" />
            <div className="flex flex-col gap-2 items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-3xl font-bold text-art-primary">R$ {total.toFixed(2)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center">
              <Button
                variant={paymentMethod === "pix" ? "default" : "outline"}
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => setPaymentMethod("pix")}
              >
                <QrCode className="h-5 w-5" /> Pix
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="h-5 w-5" /> Cartão
              </Button>
              <Button
                variant={paymentMethod === "boleto" ? "default" : "outline"}
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => setPaymentMethod("boleto")}
              >
                <Barcode className="h-5 w-5" /> Boleto
              </Button>
            </div>

            {/* Área dinâmica de pagamento */}
            {paymentSuccess ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <span className="text-2xl font-bold text-green-600">Pagamento confirmado!</span>
                <Button onClick={() => navigate("/")}>Voltar para o início</Button>
              </div>
            ) : (
              <>
                {paymentMethod === "pix" && (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <span className="font-semibold">Pague com Pix</span>
                    {paymentUrl ? (
                      <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                        <a href={paymentUrl} target="_blank" rel="noopener noreferrer">Visualizar QR Code</a>
                      </Button>
                    ) : (
                      <Button onClick={handlePayment} className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="h-5 w-5 mr-2" />}
                        Gerar QR Code Pix
                      </Button>
                    )}
                  </div>
                )}
                {paymentMethod === "boleto" && (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <span className="font-semibold">Pague com Boleto</span>
                    {paymentUrl ? (
                      <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                        <a href={paymentUrl} target="_blank" rel="noopener noreferrer">Visualizar Boleto</a>
                      </Button>
                    ) : (
                      <Button onClick={handlePayment} className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Barcode className="h-5 w-5 mr-2" />}
                        Gerar Boleto
                      </Button>
                    )}
                  </div>
                )}
                {paymentMethod === "card" && (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <span className="font-semibold">Pague com Cartão</span>
                    {paymentUrl ? (
                      <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                        <a href={paymentUrl} target="_blank" rel="noopener noreferrer">Pagar com Cartão</a>
                      </Button>
                    ) : (
                      <Button onClick={handlePayment} className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="h-5 w-5 mr-2" />}
                        Gerar Pagamento Cartão
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
