
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Categories } from "@/components/Categories";
import { ImageConverter } from "@/components/ImageConverter";
import { CustomArtRequest } from "@/components/CustomArtRequest";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import PaidPlanModal from "@/components/PaidPlanModal";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";

const Index = () => {
  const [showPaidPlanModal, setShowPaidPlanModal] = useState(false);
  const { hasActiveSubscription } = useSubscription();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-art-bg">
      <Header />
      
      {/* Botão Plano Pago */}
      {!hasActiveSubscription && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-center">
            <Button 
              onClick={() => setShowPaidPlanModal(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold px-6 py-3 rounded-full shadow-lg"
            >
              <Star className="mr-2 h-5 w-5" />
              {t('premium.title')}
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto flex flex-col md:flex-row gap-8 px-4">
        <div className="md:w-[320px] w-full flex justify-center md:justify-start mb-8 md:mb-0 items-start shrink-0">
          <ImageConverter />
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-4xl ml-[-48px] md:ml-[-64px] lg:ml-[-80px]">
            <Hero />
            <Categories />
            <FeaturedProducts />
          </div>
        </div>
      </div>
      
      {/* Custom Art Request Section */}
      <div className="container mx-auto px-4 py-8">
        <CustomArtRequest />
      </div>
      
      <Footer />
      
      <PaidPlanModal 
        isOpen={showPaidPlanModal} 
        onClose={() => setShowPaidPlanModal(false)} 
      />
    </div>
  );
};

export default Index;
