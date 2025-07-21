
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
import { QRCodeSVG } from 'qrcode.react';

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
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutos em segundos
  const [paymentId, setPaymentId] = useState("");
  const [checkingPayment, setCheckingPayment] = useState(false);
  const { toast } = useToast();
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Cronômetro para o PIX e verificação automática de pagamento
  useEffect(() => {
    if (showPixModal && timeLeft > 0 && paymentId) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setShowPixModal(false);
            toast({
              title: "PIX expirado",
              description: "O tempo para pagamento PIX expirou. Gere um novo código.",
              variant: "destructive",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Verificar status do pagamento a cada 5 segundos
      const checkPayment = setInterval(async () => {
        if (!checkingPayment) {
          await checkPaymentStatus();
        }
      }, 5000);

      return () => {
        clearInterval(timer);
        clearInterval(checkPayment);
      };
    }
  }, [showPixModal, timeLeft, paymentId, checkingPayment, toast]);

  // Formatar tempo para exibição
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Função para verificar status do pagamento
  async function checkPaymentStatus() {
    if (!paymentId) return;
    
    setCheckingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { payment_id: paymentId }
      });

      if (error) throw error;

      if (data.status === 'approved') {
        setShowPixModal(false);
        setPaymentSuccess(true);
        toast({
          title: "Pagamento aprovado!",
          description: "Seu pagamento foi confirmado. Iniciando download...",
        });
        setTimeout(() => {
          handleConfirmPayment();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Erro ao verificar pagamento:", error);
    } finally {
      setCheckingPayment(false);
    }
  }

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
        setPaymentId(data.payment_id);
        setTimeLeft(1800); // Reset timer para 30 minutos
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
                <p className="text-center text-muted-foreground mb-4">
                  Seu pagamento foi aprovado com sucesso!
                </p>
                <Button 
                  onClick={handleConfirmPayment}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  Clique aqui para começar o Download
                </Button>
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
                       <QRCodeSVG 
                         value={pixData.qr_code}
                         size={192}
                         bgColor="#ffffff"
                         fgColor="#000000"
                         level="M"
                         includeMargin
                       />
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
                    
                      {/* Tempo restante e status */}
                     <div className="space-y-2">
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                         <Clock className="h-4 w-4" />
                         Expira em: {formatTime(timeLeft)}
                       </div>
                       {checkingPayment && (
                         <div className="flex items-center gap-2 text-sm text-blue-600">
                           <Loader2 className="h-4 w-4 animate-spin" />
                           Verificando pagamento...
                         </div>
                       )}
                     </div>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      Após realizar o pagamento, o download será liberado automaticamente.
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
