import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.success("Pagamento realizado com sucesso! Sua assinatura foi ativada.");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Pagamento Aprovado!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Sua assinatura premium foi ativada com sucesso. Agora você tem acesso a:
          </p>
          <ul className="text-sm space-y-2 text-left">
            <li>• Downloads ilimitados</li>
            <li>• Ferramentas avançadas de vetorização</li>
            <li>• Acesso a produtos exclusivos</li>
            <li>• Suporte prioritário</li>
          </ul>
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Voltar ao Início
            </Button>
            <Button 
              onClick={() => navigate('/catalog')}
              className="flex-1"
            >
              Explorar Catálogo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;