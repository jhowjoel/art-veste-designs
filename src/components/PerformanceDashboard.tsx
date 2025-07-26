import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Users, Download, CreditCard, TrendingUp, TrendingDown, DollarSign, Globe, MessageSquare } from "lucide-react";

interface CustomArtRequest {
  id: string;
  email: string;
  full_name: string;
  country: string;
  message: string;
  status: string;
  created_at: string;
}

interface PerformanceStats {
  totalUsers: number;
  totalSubscriptions: number;
  totalDownloads: number;
  totalRevenue: number;
  dailyStats: any;
  weeklyStats: any;
  monthlyStats: any;
  yearlyStats: any;
  downloadsByCategory: any[];
  usersByCountry: any[];
  customArtRequests: CustomArtRequest[];
}

export const PerformanceDashboard = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    totalUsers: 0,
    totalSubscriptions: 0,
    totalDownloads: 0,
    totalRevenue: 0,
    dailyStats: {},
    weeklyStats: {},
    monthlyStats: {},
    yearlyStats: {},
    downloadsByCategory: [],
    usersByCountry: [],
    customArtRequests: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Total de usuários cadastrados
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id, created_at");
      
      if (usersError) throw usersError;

      // Total de assinantes
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from("subscriptions")
        .select("id, status, amount, created_at")
        .eq("status", "active");
      
      if (subscriptionsError) throw subscriptionsError;

      // Total de downloads
      const { data: downloads, error: downloadsError } = await supabase
        .from("user_downloads")
        .select(`
          id, 
          created_at,
          products (
            id,
            name,
            categories (name)
          )
        `);
      
      if (downloadsError) throw downloadsError;

      // Downloads por categoria
      const downloadsByCategory = downloads?.reduce((acc: any, download: any) => {
        const categoryName = download.products?.categories?.name || "Sem categoria";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});

      // Calcular estatísticas por período
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);

      const dailyUsers = users?.filter(u => new Date(u.created_at) >= today).length || 0;
      const weeklyUsers = users?.filter(u => new Date(u.created_at) >= weekAgo).length || 0;
      const monthlyUsers = users?.filter(u => new Date(u.created_at) >= monthAgo).length || 0;
      const yearlyUsers = users?.filter(u => new Date(u.created_at) >= yearAgo).length || 0;

      const dailySubscriptions = subscriptions?.filter(s => new Date(s.created_at) >= today).length || 0;
      const weeklySubscriptions = subscriptions?.filter(s => new Date(s.created_at) >= weekAgo).length || 0;
      const monthlySubscriptions = subscriptions?.filter(s => new Date(s.created_at) >= monthAgo).length || 0;
      const yearlySubscriptions = subscriptions?.filter(s => new Date(s.created_at) >= yearAgo).length || 0;

      const dailyDownloads = downloads?.filter(d => new Date(d.created_at) >= today).length || 0;
      const weeklyDownloads = downloads?.filter(d => new Date(d.created_at) >= weekAgo).length || 0;
      const monthlyDownloads = downloads?.filter(d => new Date(d.created_at) >= monthAgo).length || 0;
      const yearlyDownloads = downloads?.filter(d => new Date(d.created_at) >= yearAgo).length || 0;

      // Calcular receita
      const dailyRevenue = subscriptions?.filter(s => new Date(s.created_at) >= today)
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0;
      const weeklyRevenue = subscriptions?.filter(s => new Date(s.created_at) >= weekAgo)
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0;
      const monthlyRevenue = subscriptions?.filter(s => new Date(s.created_at) >= monthAgo)
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0;
      const yearlyRevenue = subscriptions?.filter(s => new Date(s.created_at) >= yearAgo)
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0;

      // Buscar solicitações de arte personalizada
      const { data: customRequests, error: requestsError } = await supabase
        .from("custom_art_requests")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (requestsError) {
        console.error("Error fetching custom art requests:", requestsError);
      }

      setStats({
        totalUsers: users?.length || 0,
        totalSubscriptions: subscriptions?.length || 0,
        totalDownloads: downloads?.length || 0,
        totalRevenue: subscriptions?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0,
        dailyStats: {
          users: dailyUsers,
          subscriptions: dailySubscriptions,
          downloads: dailyDownloads,
          revenue: dailyRevenue,
        },
        weeklyStats: {
          users: weeklyUsers,
          subscriptions: weeklySubscriptions,
          downloads: weeklyDownloads,
          revenue: weeklyRevenue,
        },
        monthlyStats: {
          users: monthlyUsers,
          subscriptions: monthlySubscriptions,
          downloads: monthlyDownloads,
          revenue: monthlyRevenue,
        },
        yearlyStats: {
          users: yearlyUsers,
          subscriptions: yearlySubscriptions,
          downloads: yearlyDownloads,
          revenue: yearlyRevenue,
        },
        downloadsByCategory: Object.entries(downloadsByCategory || {}).map(([name, count]) => ({
          name,
          count,
        })),
        usersByCountry: [], // Implementar quando houver dados de país
        customArtRequests: customRequests || [],
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const StatCard = ({ title, value, icon: Icon, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            {Math.abs(trend)}% desde o período anterior
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard de Desempenho</h2>
        <p className="text-muted-foreground">
          Visão geral completa das métricas da plataforma
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Usuários"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
        />
        <StatCard
          title="Assinantes Ativos"
          value={stats.totalSubscriptions.toLocaleString()}
          icon={CreditCard}
        />
        <StatCard
          title="Total de Downloads"
          value={stats.totalDownloads.toLocaleString()}
          icon={Download}
        />
        <StatCard
          title="Receita Total"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
        />
      </div>

      {/* Estatísticas por Período */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Hoje</TabsTrigger>
          <TabsTrigger value="weekly">7 Dias</TabsTrigger>
          <TabsTrigger value="monthly">30 Dias</TabsTrigger>
          <TabsTrigger value="yearly">1 Ano</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Novos Usuários Hoje"
              value={stats.dailyStats.users}
              icon={Users}
            />
            <StatCard
              title="Novas Assinaturas Hoje"
              value={stats.dailyStats.subscriptions}
              icon={CreditCard}
            />
            <StatCard
              title="Downloads Hoje"
              value={stats.dailyStats.downloads}
              icon={Download}
            />
            <StatCard
              title="Receita Hoje"
              value={formatCurrency(stats.dailyStats.revenue)}
              icon={DollarSign}
            />
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Novos Usuários (7 dias)"
              value={stats.weeklyStats.users}
              icon={Users}
            />
            <StatCard
              title="Novas Assinaturas (7 dias)"
              value={stats.weeklyStats.subscriptions}
              icon={CreditCard}
            />
            <StatCard
              title="Downloads (7 dias)"
              value={stats.weeklyStats.downloads}
              icon={Download}
            />
            <StatCard
              title="Receita (7 dias)"
              value={formatCurrency(stats.weeklyStats.revenue)}
              icon={DollarSign}
            />
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Novos Usuários (30 dias)"
              value={stats.monthlyStats.users}
              icon={Users}
            />
            <StatCard
              title="Novas Assinaturas (30 dias)"
              value={stats.monthlyStats.subscriptions}
              icon={CreditCard}
            />
            <StatCard
              title="Downloads (30 dias)"
              value={stats.monthlyStats.downloads}
              icon={Download}
            />
            <StatCard
              title="Receita (30 dias)"
              value={formatCurrency(stats.monthlyStats.revenue)}
              icon={DollarSign}
            />
          </div>
        </TabsContent>

        <TabsContent value="yearly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Novos Usuários (1 ano)"
              value={stats.yearlyStats.users}
              icon={Users}
            />
            <StatCard
              title="Novas Assinaturas (1 ano)"
              value={stats.yearlyStats.subscriptions}
              icon={CreditCard}
            />
            <StatCard
              title="Downloads (1 ano)"
              value={stats.yearlyStats.downloads}
              icon={Download}
            />
            <StatCard
              title="Receita (1 ano)"
              value={formatCurrency(stats.yearlyStats.revenue)}
              icon={DollarSign}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Downloads por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Downloads por Categoria</CardTitle>
          <CardDescription>
            Distribuição de downloads por categoria de produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.downloadsByCategory.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{category.name}</span>
                <Badge variant="secondary">{category.count} downloads</Badge>
              </div>
            ))}
            {stats.downloadsByCategory.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Nenhum download registrado ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Solicitações de Arte Personalizada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Solicitações de Arte Personalizada
          </CardTitle>
          <CardDescription>
            Mensagens de usuários com plano pago solicitando artes personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.customArtRequests.length > 0 ? (
              stats.customArtRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{request.status}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      <Globe className="h-3 w-3 mr-1" />
                      {request.country}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{request.full_name}</p>
                    <p className="text-sm text-muted-foreground">{request.email}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-3">
                    <p className="text-sm">{request.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground">
                  Nenhuma solicitação de arte personalizada ainda
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};