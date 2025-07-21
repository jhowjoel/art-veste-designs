
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, subtotal, discount, total } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-art-bg">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h1>
            <p className="text-muted-foreground mb-6">
              Adicione alguns designs incríveis ao seu carrinho
            </p>
            <Button onClick={() => navigate("/catalog")}>
              Continuar Comprando
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
        <h1 className="text-3xl font-bold font-heading mb-8">Carrinho de Compras</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Itens do carrinho */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden border">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <Badge className="mt-1">
                        {item.category}
                      </Badge>
                      <p className="text-lg font-bold text-art-primary mt-2">
                        R$ {item.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity === 1}
                        variant="outline"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={() => removeFromCart(item.id)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumo do pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto (20%)</span>
                      <span>-R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-art-primary">R$ {total.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full mt-8"
                  onClick={handleCheckout}
                >
                  Finalizar Compra
                </Button>

                <Button
                  onClick={() => navigate("/catalog")}
                  className="w-full"
                >
                  Continuar Comprando
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Cart;
