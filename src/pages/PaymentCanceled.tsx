import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-600">
            Pagamento Cancelado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            O pagamento foi cancelado ou houve algum problema durante o processamento.
          </p>
          <p className="text-sm text-muted-foreground">
            Não se preocupe, nenhum valor foi cobrado. Você pode tentar novamente quando quiser.
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
              onClick={() => navigate('/')}
              className="flex-1"
            >
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCanceled;