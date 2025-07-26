import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, FileImage, User, Headphones } from "lucide-react";

interface Message {
  id: string;
  message: string | null;
  file_urls: string[] | null;
  is_admin: boolean;
  created_at: string;
  sender_id: string | null;
}

interface CustomArtRequest {
  id: string;
  email: string;
  full_name: string;
  country: string;
  message: string;
  status: string;
  conversation_status: string;
  created_at: string;
  user_id: string;
}

interface ConversationProps {
  request: CustomArtRequest;
  onUpdate: () => void;
}

export const CustomArtConversation = ({ request, onUpdate }: ConversationProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadMessages();
  }, [request.id]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("custom_art_messages")
        .select("*")
        .eq("request_id", request.id)
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

  const handleSendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

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
          request_id: request.id,
          sender_id: user?.id,
          message: newMessage.trim() || null,
          file_urls: fileUrls.length > 0 ? fileUrls : null,
          is_admin: true,
        });

      if (error) throw error;

      setNewMessage("");
      setSelectedFiles([]);
      loadMessages();
      onUpdate();

      toast({
        title: "Mensagem enviada!",
        description: "Sua resposta foi enviada ao cliente.",
      });
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {request.full_name}
        </CardTitle>
        <CardDescription>
          {request.email} • {request.country} • {new Date(request.created_at).toLocaleDateString('pt-BR')}
        </CardDescription>
        <div className="flex gap-2">
          <Badge variant={request.status === 'pending' ? 'default' : 'secondary'}>
            {request.status}
          </Badge>
          <Badge variant={request.conversation_status === 'open' ? 'default' : 'outline'}>
            {request.conversation_status === 'open' ? 'Aberta' : 'Fechada'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Mensagem inicial */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">Solicitação Inicial</Badge>
          </div>
          <p className="text-sm">{request.message}</p>
        </div>

        <Separator className="mb-4" />

        {/* Histórico de mensagens */}
        {messages.length > 0 && (
          <>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              Conversa
            </h4>
            <ScrollArea className="h-64 border rounded-lg p-4 mb-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.is_admin
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {msg.is_admin ? 'Você (Equipe)' : request.full_name}
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
          </>
        )}

        {/* Campo para nova mensagem do admin */}
        <div className="space-y-3">
          <h4 className="font-medium">Responder ao Cliente</h4>
          <Textarea
            placeholder="Digite sua resposta para o cliente..."
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
              {uploading ? "Enviando..." : "Responder"}
            </Button>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedFiles.length} arquivo(s) selecionado(s)
            </div>
          )}
        </div>

        {/* Aviso sobre cobrança */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
          <div className="text-sm text-yellow-800">
            <strong>💰 Lembrete:</strong> Este serviço não está incluído no plano mensal. 
            Analise a solicitação e forneça um orçamento personalizado através desta conversa.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};