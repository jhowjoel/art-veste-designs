import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Star, Download, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaidPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PixPaymentData {
  order_id: string;
  payment_id: string;
  status: string;
  pix: {
    qr_code: string;
    qr_code_base64: string;
    expires_in: number;
    payment_id: string;
  };
}

const PaidPlanModal = ({ isOpen, onClose }: PaidPlanModalProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutos
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'credit_card'>('pix');

  const handlePayment = async () => {
    if (!user) {
      toast.error(t('premium.loginRequired') || "Você precisa estar logado para assinar o plano");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-pix-payment", {
        body: {
          productId: "subscription-monthly",
          amount: 1790, // R$ 17,90 em centavos
          paymentMethod: selectedPaymentMethod
        }
      });

      if (error) throw error;

      if (selectedPaymentMethod === 'pix') {
        setPixData(data);
        setShowPayment(true);
        
        // Iniciar countdown
        const interval = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setShowPayment(false);
              setPixData(null);
              toast.error("Tempo para pagamento expirado");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Redirecionar para pagamento com cartão
        window.open(data.credit_card.payment_url, '_blank');
        onClose();
      }

    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Erro ao gerar pagamento: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const benefits = [
    {
      icon: <Download className="h-5 w-5 text-primary" />,
      title: "Downloads Ilimitados",
      description: "Baixe quantas imagens quiser durante todo o mês"
    },
    {
      icon: <Palette className="h-5 w-5 text-primary" />,
      title: "Ferramentas Avançadas",
      description: "Acesso completo às ferramentas de vetorização e edição"
    },
    {
      icon: <Star className="h-5 w-5 text-primary" />,
      title: "Qualidade Premium",
      description: "Acesso a produtos exclusivos e de alta qualidade"
    },
    {
      icon: <Check className="h-5 w-5 text-primary" />,
      title: "Suporte Prioritário",
      description: "Atendimento especial para assinantes premium"
    }
  ];

  if (showPayment && pixData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Pagamento PIX</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg font-semibold text-primary">R$ 17,90</p>
              <p className="text-sm text-muted-foreground">Plano Mensal Premium</p>
            </div>

            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG 
                  value={pixData.pix.qr_code} 
                  size={200}
                  level="M"
                />
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Tempo restante para pagamento:</p>
              <p className="text-2xl font-bold text-primary">{formatTime(timeLeft)}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Escaneie o QR Code com o app do seu banco ou copie o código PIX
              </p>
              <div className="bg-muted p-3 rounded text-xs break-all">
                {pixData.pix.qr_code}
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setShowPayment(false);
                setPixData(null);
              }}
              className="w-full"
            >
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Plano Premium - EstampArt
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">Apenas R$ 17,90/mês</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">
              O que você ganha com o Plano Premium:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  {benefit.icon}
                  <div>
                    <h4 className="font-medium">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg">
            <h4 className="font-semibold mb-3">Com o Plano Premium você pode:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Baixar imagens ilimitadas por 30 dias
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Usar todas as ferramentas de vetorização avançadas
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Converter qualquer imagem em vetor com qualidade profissional
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Acesso a funcionalidades exclusivas de edição
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Suporte prioritário para dúvidas e problemas
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium mb-3">Escolha a forma de pagamento:</h4>
              <div className="flex gap-2 justify-center">
                <Button
                  variant={selectedPaymentMethod === 'pix' ? 'default' : 'outline'}
                  onClick={() => setSelectedPaymentMethod('pix')}
                  className="flex-1 max-w-40"
                >
                  PIX
                </Button>
                <Button
                  variant={selectedPaymentMethod === 'credit_card' ? 'default' : 'outline'}
                  onClick={() => setSelectedPaymentMethod('credit_card')}
                  className="flex-1 max-w-40"
                >
                  Cartão
                </Button>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {selectedPaymentMethod === 'pix' 
                  ? "Pagamento instantâneo via PIX • Ativação automática"
                  : "Cartão de crédito ou débito • Parcele em até 3x"
                } • Cancele quando quiser
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Talvez depois
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Processando..." : `Pagar R$ 17,90 via ${selectedPaymentMethod === 'pix' ? 'PIX' : 'Cartão'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaidPlanModal;