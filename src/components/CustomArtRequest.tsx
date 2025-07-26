import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export const CustomArtRequest = () => {
  const [message, setMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para enviar uma solicitação",
        variant: "destructive",
      });
      return;
    }

    if (!hasActiveSubscription) {
      toast({
        title: "Plano pago necessário",
        description: "Esta função está disponível apenas para usuários com plano pago",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim() || !fullName.trim() || !country.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("custom_art_requests")
        .insert({
          user_id: user.id,
          email: user.email || "",
          full_name: fullName,
          country: country,
          message: message,
        });

      if (error) throw error;

      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de arte personalizada foi enviada com sucesso",
      });

      setMessage("");
      setFullName("");
      setCountry("");
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || !hasActiveSubscription) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ✨ Solicitação de Arte Personalizada
        </CardTitle>
        <CardDescription>
          Descreva a arte que você gostaria que nossa equipe criasse especialmente para você
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                placeholder="Brasil"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Descrição da Arte</Label>
            <Textarea
              id="message"
              placeholder="Descreva detalhadamente a arte que você deseja... (ex: logotipo vetorizado, ilustração personalizada, mascote, etc.)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};