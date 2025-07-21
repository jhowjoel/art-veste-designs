
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Search, ShoppingCart, Eye } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shirt, Coffee, Bed, Square, Circle, ShoppingBag, Image as ImageIcon } from "lucide-react";
import { useCart } from "@/hooks/useCart";

type Product = Tables<"products"> & {
  categories: Tables<"categories"> | null;
};

const Catalog = () => {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const navigate = useNavigate();

  // Read category from URL parameters
  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);
  const [showTryOn, setShowTryOn] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<any>(null);
  const [selectedTryOnCategory, setSelectedTryOnCategory] = useState<string>("");
  const { addToCart } = useCart();

  const tryOnCategories = [
    { key: "camiseta", label: "Camiseta", icon: <Shirt className="h-5 w-5 mr-2" /> },
    { key: "bone", label: "Boné", icon: <Square className="h-5 w-5 mr-2" /> },
    { key: "calca", label: "Calça", icon: <ShoppingBag className="h-5 w-5 mr-2" /> },
    { key: "travesseiro", label: "Travesseiro", icon: <Square className="h-5 w-5 mr-2" /> },
    { key: "coberta", label: "Coberta", icon: <Bed className="h-5 w-5 mr-2" /> },
    { key: "acessorio_plano", label: "Acessório Plano", icon: <Square className="h-5 w-5 mr-2" /> },
    { key: "acessorio_curvo", label: "Acessório Curvo", icon: <Circle className="h-5 w-5 mr-2" /> },
    { key: "caneca", label: "Caneca", icon: <Coffee className="h-5 w-5 mr-2" /> },
    { key: "garrafa", label: "Garrafa", icon: <Square className="h-5 w-5 mr-2" /> },
    { key: "mochila", label: "Mochila", icon: <ShoppingBag className="h-5 w-5 mr-2" /> },
    { key: "ecobag", label: "Ecobag", icon: <ShoppingBag className="h-5 w-5 mr-2" /> },
    { key: "quadro", label: "Quadro", icon: <ImageIcon className="h-5 w-5 mr-2" /> },
    { key: "almofada", label: "Almofada", icon: <Square className="h-5 w-5 mr-2" /> },
    { key: "mousepad", label: "Mousepad", icon: <Square className="h-5 w-5 mr-2" /> },
  ];

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", searchTerm, selectedCategory, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          categories (*)
        `)
        .eq("is_active", true);

      if (searchTerm) {
        query = query.ilike("name", `%${searchTerm}%`);
      }

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      switch (sortBy) {
        case "price_low":
          query = query.order("price", { ascending: true });
          break;
        case "price_high":
          query = query.order("price", { ascending: false });
          break;
        case "popular":
          query = query.order("downloads_count", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: categories } = useQuery({
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

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-art-bg">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-center mb-2">
            Catálogo de Designs
          </h1>
          <p className="text-muted-foreground text-center">
            Encontre o design perfeito para seus projetos
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar designs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="popular">Mais populares</SelectItem>
              <SelectItem value="price_low">Menor preço</SelectItem>
              <SelectItem value="price_high">Maior preço</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid de produtos */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="animate-pulse">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300">
                <CardHeader className="p-0 relative">
                  <div className="aspect-square overflow-hidden rounded-t-lg bg-white">
                    <img
                      src={product.png_preview_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  {product.is_featured && (
                    <Badge className="absolute top-2 left-2">Destaque</Badge>
                  )}
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
                  <p className="text-sm text-muted-foreground">
                    {product.downloads_count} downloads
                  </p>
                </CardContent>

                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleProductClick(product.id)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image: product.png_preview_url || '',
                      category: product.categories?.name || '',
                      quantity: 1
                    })}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {products?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Nenhum produto encontrado
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Catalog;
