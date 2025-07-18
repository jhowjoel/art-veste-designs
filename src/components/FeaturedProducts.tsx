
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Eye, ShoppingCart, Star } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products"> & {
  categories: Tables<"categories"> | null;
};

export const FeaturedProducts = () => {
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (*)
        `)
        .eq("is_featured", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return data as Product[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-art-bg">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 font-heading">
            Produtos em Destaque
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="p-0">
                  <div className="aspect-square bg-muted rounded-t-lg" />
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products?.length) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-art-bg">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 font-heading">
          Produtos em Destaque
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="p-0 relative">
                <div className="aspect-square overflow-hidden rounded-t-lg bg-white">
                  <img
                    src={product.png_preview_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <Badge className="absolute top-2 left-2">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Destaque
                </Badge>
              </CardHeader>
              
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                {product.categories && (
                  <Badge variant="secondary" className="mb-2">
                    {product.categories.name}
                  </Badge>
                )}
                <p className="text-2xl font-bold text-art-primary">
                  R$ {product.price.toFixed(2)}
                </p>
              </CardContent>

              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver
                </Button>
                <Button size="sm" className="flex-1">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Comprar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button 
            onClick={() => navigate("/catalog")}
            size="lg"
          >
            Ver Todo o Catálogo
          </Button>
        </div>
      </div>
    </section>
  );
};
