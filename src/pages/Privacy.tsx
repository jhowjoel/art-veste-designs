import { ArrowLeft, Lock, Eye, Database, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Privacy = () => {
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
            <h1 className="text-3xl font-bold">Política de Privacidade</h1>
          </div>

          <div className="space-y-8">
            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Nosso Compromisso com sua Privacidade</h2>
                  <p className="text-muted-foreground">
                    A Art valoriza e respeita a privacidade de todos os usuários. Esta política explica como 
                    coletamos, usamos, armazenamos e protegemos suas informações pessoais de acordo com as 
                    melhores práticas de segurança e conformidade com a LGPD (Lei Geral de Proteção de Dados).
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Database className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Informações que Coletamos</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Dados de Cadastro</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Nome completo</li>
                        <li>Endereço de e-mail</li>
                        <li>Informações de perfil (avatar, preferências)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Dados de Uso</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Histórico de compras e downloads</li>
                        <li>Interações com a plataforma</li>
                        <li>Preferências de navegação</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Dados de Pagamento</h3>
                      <p>Informações de pagamento são processadas de forma segura por nossos parceiros certificados. Não armazenamos dados de cartão de crédito em nossos servidores.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Eye className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Como Utilizamos suas Informações</h2>
                  <div className="space-y-3 text-muted-foreground">
                    <p><strong>Prestação de Serviços:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Processar compras e fornecer downloads</li>
                      <li>Gerenciar sua conta e perfil</li>
                      <li>Fornecer suporte ao cliente</li>
                      <li>Personalizar sua experiência na plataforma</li>
                    </ul>
                    
                    <p className="mt-4"><strong>Comunicação:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Enviar confirmações de compra</li>
                      <li>Notificar sobre atualizações importantes</li>
                      <li>Responder solicitações de suporte</li>
                    </ul>
                    
                    <p className="mt-4"><strong>Melhorias:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Analisar uso da plataforma para melhorias</li>
                      <li>Desenvolver novos recursos e serviços</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <div className="flex items-start gap-4">
                <Lock className="h-8 w-8 text-primary mt-1" />
                <div>
                  <h2 className="text-xl font-semibold mb-3">Proteção e Segurança</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Medidas de Segurança</h3>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Criptografia de dados em trânsito e em repouso</li>
                        <li>Autenticação segura e controle de acesso</li>
                        <li>Monitoramento contínuo de segurança</li>
                        <li>Backups regulares e seguros</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Armazenamento</h3>
                      <p>Seus dados são armazenados em servidores seguros com certificações internacionais de segurança, localizados em datacenters confiáveis.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-3">Seus Direitos</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>De acordo com a LGPD, você tem os seguintes direitos:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Acesso:</strong> Solicitar informações sobre seus dados</li>
                  <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
                  <li><strong>Exclusão:</strong> Solicitar a remoção de seus dados</li>
                  <li><strong>Portabilidade:</strong> Transferir seus dados para outro serviço</li>
                  <li><strong>Oposição:</strong> Opor-se ao processamento de seus dados</li>
                </ul>
              </div>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-3">Compartilhamento de Dados</h2>
              <p className="text-muted-foreground mb-3">
                Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. 
                Compartilhamos dados apenas quando:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Necessário para processar pagamentos (com parceiros certificados)</li>
                <li>Exigido por lei ou autoridades competentes</li>
                <li>Com seu consentimento explícito</li>
              </ul>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-3">Contato e Solicitações</h2>
              <p className="text-muted-foreground">
                Para exercer seus direitos, fazer solicitações sobre seus dados ou esclarecer dúvidas sobre 
                esta política de privacidade, entre em contato conosco através do e-mail: 
                <strong> jota100clock@gmail.com</strong>
              </p>
              <p className="text-muted-foreground mt-3">
                Responderemos sua solicitação em até 15 dias úteis.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-3">Atualizações desta Política</h2>
              <p className="text-muted-foreground">
                Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas 
                através do e-mail cadastrado. A versão mais recente estará sempre disponível em nossa plataforma.
              </p>
              <p className="text-muted-foreground mt-3">
                <strong>Última atualização:</strong> Janeiro de 2024
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};