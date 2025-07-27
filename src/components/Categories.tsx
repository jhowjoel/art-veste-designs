
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Palette, 
  Quote, 
  Music, 
  Heart, 
  Shirt, 
  Baby, 
  Sparkles, 
  Crown,
  Triangle
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
  'Triangle': Triangle,
};

export const Categories = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .is("parent_id", null) // Só mostrar categorias principais
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
            {t('categories.loading')}
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
          {t('categories.title')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {categories?.map((category) => {
            const IconComponent = iconMap[category.icon || 'Palette'] || Palette;
            // Primeiro tenta buscar tradução para categoria dinâmica, se não encontrar usa o nome original
            const categoryKey = `category.${category.name.toLowerCase().replace(/\s+/g, '_')}`;
            const translatedName = t(categoryKey) !== categoryKey ? t(categoryKey) : category.name;
            
            return (
              <Card 
                key={category.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  if (category.name === 'Vetor') {
                    navigate('/vector-subcategories');
                  } else {
                    navigate(`/catalog?category=${category.id}`);
                  }
                }}
              >
                <CardContent className="p-6 text-center">
                  <IconComponent className="w-12 h-12 text-art-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold">{translatedName}</h3>
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
            {t('categories.viewAll')}
          </Button>
        </div>
      </div>
    </section>
  );
};
