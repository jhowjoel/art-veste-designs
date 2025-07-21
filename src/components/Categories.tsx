
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Palette, 
  Quote, 
  Music, 
  Heart, 
  Shirt, 
  Baby, 
  Sparkles, 
  Crown 
} from "lucide-react";

const iconMap: { [key: string]: any } = {
  'Palette': Palette,
  'Quote': Quote,
  'Music': Music,
  'Heart': Heart,
  'Shirt': Shirt,
  'Baby': Baby,
  'Sparkles': Sparkles,
  'Crown': Crown,
};

export const Categories = () => {
  const navigate = useNavigate();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 font-heading">
            Categorias
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4" />
                  <div className="h-4 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="categorias" className="py-16 px-4 bg-white">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 font-heading">
          Explore por Categoria
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {categories?.map((category) => {
            const IconComponent = iconMap[category.icon || 'Palette'] || Palette;
            return (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/catalog?category=${category.id}`)}
              >
                <CardContent className="p-6 text-center">
                  <IconComponent className="w-12 h-12 text-art-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
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
        <div className="text-center">
          <Button
            onClick={() => navigate("/catalog")}
            variant="outline"
            size="lg"
          >
            Ver Todas as Categorias
          </Button>
        </div>
      </div>
    </section>
  );
};
