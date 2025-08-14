
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Package, FileText, Scissors } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

export const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  function handleCreateAccount() {
    if (user) {
      toast({
        title: t('hero.accountExists'),
        description: t('hero.accountExistsDesc'),
        variant: "custom-black"
      });
      return;
    }
    navigate("/auth?tab=signup");
  }

  return (
    <section className="relative py-20 px-4 text-center bg-gradient-to-br from-art-bg to-white">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Package className="h-12 w-12 text-art-primary" />
            <h1 className="text-5xl md:text-6xl font-bold font-heading">
              Presynter
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            {t('hero.title')}
          </p>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            size="lg" 
            onClick={() => navigate("/catalog")}
            className="text-lg px-8 py-6"
          >
            {t('hero.cta')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleCreateAccount}
            className="text-lg px-8 py-6"
          >
            <Download className="mr-2 h-5 w-5" />
            {t('hero.createAccount')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="w-16 h-16 bg-art-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-art-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('hero.feature1.title')}</h3>
            <p className="text-muted-foreground">
              {t('hero.feature1.description')}
            </p>
          </div>
          
          <div className="p-6">
            <div className="w-16 h-16 bg-art-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="h-8 w-8 text-art-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('hero.feature2.title')}</h3>
            <p className="text-muted-foreground">
              {t('hero.feature2.description')}
            </p>
          </div>
          
          <div className="p-6">
            <div className="w-16 h-16 bg-art-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-art-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('hero.feature3.title')}</h3>
            <p className="text-muted-foreground">
              {t('hero.feature3.description')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
