
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-20 px-4 text-center bg-gradient-to-br from-art-bg to-white">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Palette className="h-12 w-12 text-art-primary" />
            <h1 className="text-5xl md:text-6xl font-bold font-heading">
              Art
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Designs únicos em SVG para suas criações
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Descubra nossa coleção exclusiva de artes vetoriais para estampas, 
            canecas, camisetas e muito mais. Qualidade profissional, 
            uso comercial liberado.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            size="lg" 
            onClick={() => navigate("/catalog")}
            className="text-lg px-8 py-6"
          >
            Ver Catálogo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8 py-6"
          >
            <Download className="mr-2 h-5 w-5" />
            Criar Conta Grátis
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="w-16 h-16 bg-art-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette className="h-8 w-8 text-art-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Designs Únicos</h3>
            <p className="text-muted-foreground">
              Artes exclusivas criadas por designers profissionais
            </p>
          </div>
          
          <div className="p-6">
            <div className="w-16 h-16 bg-art-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="h-8 w-8 text-art-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Download Imediato</h3>
            <p className="text-muted-foreground">
              Baixe seus arquivos SVG logo após a compra
            </p>
          </div>
          
          <div className="p-6">
            <div className="w-16 h-16 bg-art-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="h-8 w-8 text-art-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Uso Comercial</h3>
            <p className="text-muted-foreground">
              Licença para uso em produtos físicos e digitais
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
