import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Send, FileImage } from "lucide-react";

interface Message {
  id: string;
  message: string | null;
  file_urls: string[] | null;
  is_admin: boolean;
  created_at: string;
  sender_id: string | null;
}

interface ArtRequest {
  id: string;
  message: string;
  full_name: string;
  country: string;
  email: string;
  created_at: string;
  conversation_status: string;
}

export const CustomArtChat = () => {
  const [newMessage, setNewMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<ArtRequest | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && hasActiveSubscription) {
      loadExistingRequest();
    }
  }, [user, hasActiveSubscription]);

  const loadExistingRequest = async () => {
    if (!user) return;

    try {
      const { data: request, error } = await supabase
        .from("custom_art_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (request && !error) {
        setExistingRequest(request);
        loadMessages(request.id);
      }
    } catch (error) {
      console.log("No existing request found");
    }
  };

  const loadMessages = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from("custom_art_messages")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `custom-art/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('art-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('art-files')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Erro no upload",
          description: `Erro ao fazer upload do arquivo ${file.name}`,
          variant: "destructive",
        });
      }
    }

    return uploadedUrls;
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
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

    if (!initialMessage.trim() || !fullName.trim() || !country.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files if any
      let fileUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        fileUrls = await uploadFiles(selectedFiles);
        setUploading(false);
      }

      const { data: request, error } = await supabase
        .from("custom_art_requests")
        .insert({
          user_id: user.id,
          email: user.email || "",
          full_name: fullName,
          country: country,
          message: initialMessage,
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial message
      await supabase
        .from("custom_art_messages")
        .insert({
          request_id: request.id,
          sender_id: user.id,
          message: initialMessage,
          file_urls: fileUrls.length > 0 ? fileUrls : null,
          is_admin: false,
        });

      setExistingRequest(request);
      loadMessages(request.id);
      
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de arte personalizada foi enviada com sucesso",
      });

      setInitialMessage("");
      setFullName("");
      setCountry("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!existingRequest || (!newMessage.trim() && selectedFiles.length === 0)) return;

    setIsSubmitting(true);

    try {
      // Upload files if any
      let fileUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        fileUrls = await uploadFiles(selectedFiles);
        setUploading(false);
      }

      const { error } = await supabase
        .from("custom_art_messages")
        .insert({
          request_id: existingRequest.id,
          sender_id: user?.id,
          message: newMessage.trim() || null,
          file_urls: fileUrls.length > 0 ? fileUrls : null,
          is_admin: false,
        });

      if (error) throw error;

      setNewMessage("");
      setSelectedFiles([]);
      loadMessages(existingRequest.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  if (!user || !hasActiveSubscription) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ✨ Solicitação de Arte Personalizada
        </CardTitle>
        <CardDescription>
          {existingRequest 
            ? "Continue sua conversa sobre o projeto de arte personalizada" 
            : "Descreva a arte que você gostaria que nossa equipe criasse especialmente para você"
          }
        </CardDescription>
        
        {/* Aviso sobre cobrança separada */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <div className="text-sm text-yellow-800">
            <strong>⚠️ Importante:</strong> Este serviço de arte personalizada não está incluído no seu plano mensal. 
            Cada projeto será analisado individualmente e um orçamento será fornecido através desta conversa. 
            O pagamento será feito separadamente após a aprovação do orçamento.
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!existingRequest ? (
          // Formulário inicial
          <form onSubmit={handleInitialSubmit} className="space-y-4">
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
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="files">Arquivos de Referência (opcional)</Label>
              <Input
                id="files"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
              />
              {selectedFiles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || uploading}
            >
              {uploading ? "Enviando arquivos..." : isSubmitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </form>
        ) : (
          // Interface de chat
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Status: {existingRequest.conversation_status === 'open' ? 'Aguardando resposta' : 'Finalizado'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Criado em: {new Date(existingRequest.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <Separator />

            {/* Histórico de mensagens */}
            <ScrollArea className="h-96 border rounded-lg p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.is_admin
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {msg.is_admin ? 'Equipe' : 'Você'}
                        </span>
                        <span className="text-xs opacity-70">
                          {new Date(msg.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      {msg.message && (
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      )}
                      
                      {msg.file_urls && msg.file_urls.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.file_urls.map((url, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <FileImage className="h-4 w-4" />
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs underline hover:no-underline"
                              >
                                Visualizar arquivo {index + 1}
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Campo para nova mensagem */}
            <div className="space-y-3">
              <Textarea
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
              />
              
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSubmitting || uploading || (!newMessage.trim() && selectedFiles.length === 0)}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {uploading ? "Enviando..." : "Enviar"}
                </Button>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};