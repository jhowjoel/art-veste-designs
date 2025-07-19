
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Heart, ShoppingCart, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { useCart } from "@/hooks/useCart";
// @ts-ignore
import { QRCodeSVG } from "qrcode.react";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  categories: Database["public"]["Tables"]["categories"]["Row"] | null;
};

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const [mostrarPix, setMostrarPix] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is required");
      
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (*)
        `)
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      if (!product) throw new Error("Produto não encontrado");
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.png_preview_url || "/placeholder.svg",
        category: product.categories?.name || "",
        quantity: 1,
      });
      toast({
        title: "Produto adicionado ao carrinho!",
        description: "Vá para o carrinho para finalizar a compra.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o produto ao carrinho.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.png_preview_url || "/placeholder.svg",
      category: product.categories?.name || "",
      quantity: 1,
    });
    navigate("/checkout");
  };

  const handlePixPayment = async () => {
    setLoadingPix(true);
    try {
      const res = await fetch("/.netlify/functions/create-pix-payment", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, amount: product.price }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setPixCode(data.pix_code);
      setMostrarPix(true);
    } catch (error) {
      // Trate o erro se necessário
    } finally {
      setLoadingPix(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-art-bg">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-art-bg">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
            <Button onClick={() => navigate("/catalog")}>
              Voltar ao catálogo
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-art-bg">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imagem do produto */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden border">
              <img
                src={product.png_preview_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Técnicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formato:</span>
                  <span>SVG Vetorial</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamanho:</span>
                  <span>{product.file_size ? `${(product.file_size / 1024).toFixed(1)} KB` : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Downloads:</span>
                  <span>{product.downloads_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Licença:</span>
                  <span>Uso Comercial</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes do produto */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold font-heading">{product.name}</h1>
                {product.is_featured && <Badge>Destaque</Badge>}
              </div>
              
              {product.categories && (
                <Badge className="mb-4">
                  {product.categories.name}
                </Badge>
              )}

              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-art-primary">
                  R$ {product.price.toFixed(2)}
                </span>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">(4.8)</span>
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                {product.description || "Design vetorial de alta qualidade, perfeito para estampas em camisetas, canecas, quadros e diversos produtos personalizados."}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="flex-1"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isAddingToCart ? "Adicionando..." : "Adicionar ao Carrinho"}
                </Button>
                
                <Button>
                  <Heart className="h-5 w-5 mr-2" />
                  Favoritar
                </Button>
              </div>

              <Button className="w-full" onClick={handleBuyNow}>
                <Download className="h-5 w-5 mr-2" />
                Comprar e Baixar Agora
              </Button>
              <Button className="w-full" onClick={handlePixPayment} disabled={loadingPix}>
                {loadingPix ? "Gerando QR code..." : "Visualizar QR code"}
              </Button>
              {mostrarPix && pixCode && (
                <div className="flex flex-col items-center my-8">
                  <h3 className="text-lg font-bold mb-2">Escaneie o QR code para pagar:</h3>
                  <QRCodeSVG value={pixCode} size={256} />
                  <p className="mt-4 font-semibold">Pix copia e cola:</p>
                  <pre className="bg-gray-100 p-2 rounded break-all">{pixCode}</pre>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>O que você receberá:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-art-primary rounded-full" />
                    Arquivo SVG vetorial em alta qualidade
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-art-primary rounded-full" />
                    Arquivo PNG para visualização
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-art-primary rounded-full" />
                    Licença para uso comercial
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-art-primary rounded-full" />
                    Download imediato após pagamento
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Termos de Uso</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Este arquivo pode ser usado para fins pessoais e comerciais. 
                  É permitido imprimir em produtos físicos para venda. 
                  É proibida a revenda ou redistribuição do arquivo digital.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Product;
