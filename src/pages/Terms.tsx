import { ArrowLeft, Shield, Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Terms = () => {
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
            <h1 className="text-3xl font-bold">Termos de Uso</h1>
          </div>

          <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Heart className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Nosso Compromisso</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p>A Art está comprometida em fornecer um serviço de excelência, baseado nos pilares de <strong>respeito</strong>, <strong>qualidade</strong> e <strong>comprometimento com o cliente</strong>.</p>
                    <p>Acreditamos que cada cliente merece atenção personalizada e produtos que superem suas expectativas.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Users className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Direitos e Responsabilidades do Usuário</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong>Você tem o direito de:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Acessar e utilizar nossa plataforma de forma segura</li>
                      <li>Receber produtos conforme descritos</li>
                      <li>Suporte técnico e atendimento ao cliente</li>
                      <li>Privacidade e proteção dos seus dados pessoais</li>
                    </ul>
                    
                    <p className="mt-4"><strong>Você se compromete a:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Fornecer informações verdadeiras e atualizadas</li>
                      <li>Respeitar os direitos autorais dos conteúdos</li>
                      <li>Não utilizar a plataforma para fins ilegais</li>
                      <li>Manter a segurança da sua conta</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Políticas da Plataforma</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Uso das Imagens</h3>
                      <p>As imagens adquiridas podem ser utilizadas para fins pessoais e comerciais, respeitando os direitos autorais. Não é permitida a revenda ou redistribuição dos arquivos originais.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Pagamentos e Reembolsos</h3>
                      <p>Os pagamentos são processados de forma segura via PIX. Em caso de problemas técnicos que impeçam o download, oferecemos reembolso integral ou nova tentativa de entrega.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Qualidade e Entrega</h3>
                      <p>Garantimos a qualidade de todas as imagens fornecidas. Trabalhos personalizados passam por processo de aprovação antes da entrega final.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Respeito Mútuo</h3>
                      <p>Mantemos um ambiente de respeito mútuo. Não toleramos comportamentos abusivos, discriminatórios ou desrespeitosos em nossa plataforma.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-3">Alterações nos Termos</h2>
              <p className="text-muted-foreground">
                Estes termos podem ser atualizados periodicamente para melhor atender nossos usuários. 
                Sempre notificaremos sobre mudanças significativas através do e-mail cadastrado ou avisos na plataforma.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-3">Contato</h2>
              <p className="text-muted-foreground">
                Em caso de dúvidas sobre estes termos ou qualquer questão relacionada ao serviço, 
                entre em contato conosco através do e-mail: <strong>jota100clock@gmail.com</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};