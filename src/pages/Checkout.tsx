
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cpf, setCpf] = useState("");
  const [fullName, setFullName] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  const handlePayment = async () => {
    if (!fullName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome completo.",
        variant: "destructive",
      });
      return;
    }

    if (!cpf.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o CPF.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulação de processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (paymentMethod === "pix") {
        // Simular geração de QR Code PIX
        toast({
          title: "PIX Gerado!",
          description: "Use o código PIX para finalizar o pagamento.",
        });
        
        // Redirecionar para página de pagamento PIX (mock)
        const pixPaymentUrl = `https://www.mercadopago.com.br/checkout/v1/payment/pix-mock?amount=${total}&email=${user?.email}`;
        window.open(pixPaymentUrl, '_blank');
      } else {
        // Simular pagamento com cartão
        const cardPaymentUrl = `https://www.mercadopago.com.br/checkout/v1/payment/card-mock?amount=${total}&email=${user?.email}`;
        window.open(cardPaymentUrl, '_blank');
      }

      // Simular sucesso após 3 segundos
      setTimeout(() => {
        toast({
          title: "Pagamento Aprovado!",
          description: "Seus arquivos estão disponíveis para download.",
        });
        clearCart();
        navigate("/profile?tab=downloads");
      }, 3000);

    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-art-bg">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate("/cart")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Carrinho
        </Button>

        <h1 className="text-3xl font-bold font-heading mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de pagamento */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>
                  Informações necessárias para o pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Método de Pagamento</CardTitle>
                <CardDescription>
                  Escolha como você quer pagar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Smartphone className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">PIX</div>
                        <div className="text-sm text-muted-foreground">
                          Pagamento instantâneo
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Recomendado
                      </Badge>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Cartão de Crédito</div>
                        <div className="text-sm text-muted-foreground">
                          Parcelamento disponível
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do pedido */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded border overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Taxa de processamento</span>
                    <span>R$ 0,00</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-art-primary">R$ {total.toFixed(2)}</span>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Finalizar Pagamento
                    </>
                  )}
                </Button>

                <div className="text-xs text-center text-muted-foreground">
                  Ao finalizar a compra, você concorda com nossos{" "}
                  <a href="#" className="text-art-primary hover:underline">
                    Termos de Uso
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
