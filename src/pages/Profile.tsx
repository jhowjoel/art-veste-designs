
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download, User, ShoppingBag, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Tables } from "@/integrations/supabase/types";

const Profile = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [fullName, setFullName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
    };

    getUser();
  }, [navigate]);

  const { data: userProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: userDownloads } = useQuery({
    queryKey: ["user-downloads", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_downloads")
        .select(`
          *,
          products (
            *,
            categories (*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: userOrders } = useQuery({
    queryKey: ["user-orders", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
      setFullName(userProfile.full_name || "");
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-art-bg">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-heading">Minha Conta</h1>
            <p className="text-muted-foreground">
              Gerencie seu perfil e visualize seus downloads
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="downloads">
              <Download className="h-4 w-4 mr-2" />
              Downloads
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ""}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="downloads">
            <Card>
              <CardHeader>
                <CardTitle>Meus Downloads</CardTitle>
                <CardDescription>
                  Arquivos que você já comprou e pode baixar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userDownloads?.length === 0 ? (
                  <div className="text-center py-8">
                    <Download className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Você ainda não possui downloads
                    </p>
                    <Button
                      onClick={() => navigate("/catalog")}
                      className="mt-4"
                    >
                      Explorar Catálogo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userDownloads?.map((download) => (
                      <div
                        key={download.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white rounded-lg overflow-hidden border">
                            <img
                              src={download.products?.png_preview_url}
                              alt={download.products?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {download.products?.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Comprado em{" "}
                              {new Date(download.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button>
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pedidos</CardTitle>
                <CardDescription>
                  Visualize todos os seus pedidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userOrders?.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Você ainda não fez nenhum pedido
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders?.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">
                              Pedido #{order.id.slice(0, 8)}
                            </span>
                            <Badge
                              variant={
                                order.payment_status === "paid"
                                  ? "default"
                                  : order.payment_status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {order.payment_status === "paid"
                                ? "Pago"
                                : order.payment_status === "pending"
                                ? "Pendente"
                                : "Falhou"}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">
                              R$ {order.total_amount.toFixed(2)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Conta</CardTitle>
                <CardDescription>
                  Gerencie suas preferências de conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Alterar Senha</h3>
                  <Button variant="outline">
                    Enviar Link de Redefinição
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-destructive">
                    Zona de Perigo
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ações irreversíveis relacionadas à sua conta
                  </p>
                  <Button variant="destructive" disabled>
                    Excluir Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
