import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

const PaymentPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl text-yellow-600">
            Pagamento Pendente
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Seu pagamento está sendo processado. Você receberá uma confirmação em breve.
          </p>
          <p className="text-sm text-muted-foreground">
            Assim que o pagamento for aprovado, sua assinatura premium será ativada automaticamente.
          </p>
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Voltar ao Início
            </Button>
            <Button 
              onClick={() => navigate('/profile')}
              className="flex-1"
            >
              Ver Perfil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPending;