import { ArrowLeft, Mail, MessageCircle, Clock, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Contact = () => {
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
            <h1 className="text-3xl font-bold">Contato</h1>
          </div>

          <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Heart className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Nossa Equipe está Aqui para Você</h2>
                  <p className="text-muted-foreground">
                    Estamos comprometidos em oferecer o melhor atendimento e suporte para todos os nossos clientes. 
                    Nossa equipe está sempre pronta para esclarecer dúvidas, resolver problemas e ajudar você a 
                    ter a melhor experiência possível em nossa plataforma.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Mail className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">E-mail de Contato</h2>
                  <div className="space-y-3">
                    <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                      <p className="text-lg font-semibold text-primary">jota100clock@gmail.com</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Canal oficial para todas as comunicações
                      </p>
                    </div>
                    <p className="text-muted-foreground">
                      Este é nosso canal principal de atendimento. Utilizamos este e-mail para:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                      <li>Suporte técnico e resolução de problemas</li>
                      <li>Dúvidas sobre produtos e serviços</li>
                      <li>Solicitações de reembolso ou cancelamento</li>
                      <li>Feedback e sugestões</li>
                      <li>Parcerias e colaborações</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <MessageCircle className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Outros Canais de Atendimento</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Sistema de Mensagens (Plano Pago)</h3>
                      <p>Usuários do plano pago podem utilizar o sistema de mensagens integrado na plataforma para solicitar imagens personalizadas e tirar dúvidas diretamente conosco.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Área do Cliente</h3>
                      <p>Acesse sua conta para visualizar histórico de compras, downloads disponíveis e informações sobre seus pedidos.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Clock className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Tempo de Resposta</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong>E-mail:</strong> Respondemos em até 24 horas durante dias úteis</p>
                    <p><strong>Sistema de mensagens:</strong> Respostas em tempo real durante horário comercial</p>
                    <p><strong>Emergências:</strong> Para problemas urgentes, mencione "URGENTE" no assunto do e-mail</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-3">Tipos de Solicitação</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Suporte Técnico</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Problemas com download</li>
                    <li>• Dificuldades de acesso</li>
                    <li>• Erros na plataforma</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Comercial</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Dúvidas sobre produtos</li>
                    <li>• Orçamentos personalizados</li>
                    <li>• Parcerias</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Financeiro</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Problemas com pagamento</li>
                    <li>• Solicitação de reembolso</li>
                    <li>• Questões sobre cobrança</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Geral</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Feedback sobre o serviço</li>
                    <li>• Sugestões de melhoria</li>
                    <li>• Outras dúvidas</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
              <h2 className="text-xl font-semibold mb-3 text-primary">Compromisso com o Atendimento</h2>
              <p className="text-muted-foreground">
                Nossa missão é garantir que você tenha a melhor experiência possível. Cada contato é tratado 
                com atenção e cuidado especial. Estamos aqui para ajudar você a alcançar seus objetivos 
                criativos e resolver qualquer questão que possa surgir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};