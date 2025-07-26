import { ArrowLeft, MessageCircle, CreditCard, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const HowToBuy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Como Comprar</h1>
          </div>

          <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <CreditCard className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Comprando Imagens do Catálogo</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>1. <strong>Navegue pelo catálogo:</strong> Explore nossa coleção de imagens nas diferentes categorias disponíveis.</p>
                    <p>2. <strong>Adicione ao carrinho:</strong> Clique no botão "Adicionar ao Carrinho" nas imagens que desejar.</p>
                    <p>3. <strong>Desconto por quantidade:</strong> Comprando 3 ou mais imagens, você ganha 20% de desconto no total!</p>
                    <p>4. <strong>Finalize a compra:</strong> Acesse seu carrinho e clique em "Finalizar Compra".</p>
                    <p>5. <strong>Pagamento:</strong> Realize o pagamento via PIX de forma segura.</p>
                    <p>6. <strong>Download:</strong> Após a confirmação do pagamento, as imagens estarão disponíveis na sua conta para download.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <MessageCircle className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Imagens Personalizadas</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong>Para usuários do plano pago:</strong></p>
                    <p>1. <strong>Campo de mensagens:</strong> Na página inicial, você encontrará um campo especial para solicitar imagens personalizadas.</p>
                    <p>2. <strong>Descreva sua ideia:</strong> Explique detalhadamente o que você deseja: estilo, cores, elementos, dimensões, etc.</p>
                    <p>3. <strong>Envie arquivos:</strong> Você pode anexar imagens de referência para nos ajudar a entender melhor sua visão.</p>
                    <p>4. <strong>Análise personalizada:</strong> Nossa equipe analisará sua solicitação e fornecerá um orçamento personalizado.</p>
                    <p>5. <strong>Negociação:</strong> Através do sistema de mensagens, podemos discutir detalhes, ajustes e valores.</p>
                    <p>6. <strong>Criação exclusiva:</strong> Após aprovação, criaremos uma imagem única especialmente para você.</p>
                  </div>
                  
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                      <strong>Importante:</strong> O serviço de imagens personalizadas é cobrado separadamente do plano mensal. 
                      Cada projeto é analisado individualmente e o preço é definido de acordo com a complexidade da solicitação.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Download className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Formatos e Qualidade</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>• <strong>Alta resolução:</strong> Todas as imagens são fornecidas em alta qualidade para uso profissional.</p>
                    <p>• <strong>Múltiplos formatos:</strong> PNG, JPG e SVG (quando aplicável).</p>
                    <p>• <strong>Uso comercial:</strong> Licença para uso pessoal e comercial incluída.</p>
                    <p>• <strong>Downloads ilimitados:</strong> Baixe suas compras quantas vezes precisar através da sua conta.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};