import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  ShoppingBasket, 
  Package, 
  User, 
  UserCheck, 
  Heart, 
  Zap,
  ArrowLeft
} from "lucide-react";

const iconMap: { [key: string]: any } = {
  'ShoppingBasket': ShoppingBasket,
  'Package': Package,
  'User': User,
  'UserCheck': UserCheck,
  'Heart': Heart,
  'Zap': Zap,
};

export default function VectorSubcategories() {
  const navigate = useNavigate();

  const { data: subcategories, isLoading } = useQuery({
    queryKey: ["vector-subcategories"],
    queryFn: async () => {
      // Buscar o ID da categoria Vetor
      const { data: vectorCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("name", "Vetor")
        .single();

      if (!vectorCategory) return [];

      // Buscar subcategorias
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("parent_id", vectorCategory.id)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold">Categorias Vetor</h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4" />
                  <div className="h-4 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Categorias Vetor</h1>
          <p className="text-muted-foreground mt-2">
            Escolha uma subcategoria para ver os arquivos SVG disponíveis
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subcategories?.map((category) => {
            const IconComponent = iconMap[category.icon || 'Package'] || Package;
            return (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/catalog?category=${category.id}`)}
              >
                <CardContent className="p-6 text-center">
                  <IconComponent className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {category.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}