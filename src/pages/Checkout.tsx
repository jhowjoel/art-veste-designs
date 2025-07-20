
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
import { Loader2, Smartphone, CreditCard, Barcode, QrCode, CheckCircle, Copy, Clock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const { toast } = useToast();
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Função para criar pagamento
  async function handlePayment() {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: {
          productId: cartItems[0]?.id,
          amount: total * 100,
          paymentMethod: paymentMethod === 'card' ? 'credit_card' : paymentMethod
        }
      });

      if (error) throw error;

      if (paymentMethod === 'pix') {
        setPixData(data.pix);
        setShowPixModal(true);
      } else {
        window.open(data.credit_card?.payment_url || data.payment_url, '_blank');
      }
      
    } catch (error: any) {
      toast({
        title: "Erro no pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Simular confirmação de pagamento
  async function handleConfirmPayment() {
    setPaymentSuccess(true);
    // Buscar o pedido mais recente do usuário com status 'paid'
    if (!user?.id) {
      clearCart();
      return;
    }
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !orders || orders.length === 0) {
      clearCart();
      return;
    }
    const orderId = orders[0].id;
    // Buscar o primeiro produto do pedido
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id')
      .eq('order_id', orderId)
      .limit(1);
    if (!items || items.length === 0) {
        clearCart();
      return;
    }
    const productId = items[0].product_id;
    clearCart();
    // Redireciona para página de obrigado
    navigate(`/thank-you?orderId=${orderId}&productId=${productId}`);
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

            {/* Modal PIX */}
            <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Pagamento PIX
                  </DialogTitle>
                  <DialogDescription>
                    Escaneie o QR Code ou copie o código PIX abaixo
                  </DialogDescription>
                </DialogHeader>
                
                {pixData && (
                  <div className="space-y-4">
                    {/* QR Code */}
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                        <QrCode className="h-20 w-20 text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Código PIX */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Código PIX:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={pixData.qr_code}
                          readOnly
                          className="flex-1 p-2 border rounded text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(pixData.qr_code);
                            toast({ title: "Código copiado!" });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Tempo restante */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Expira em: 60 minutos
                    </div>
                    
                    <div className="text-center">
                      <Button onClick={handleConfirmPayment} className="w-full">
                        Já realizei o pagamento
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
