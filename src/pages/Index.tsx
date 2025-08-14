
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Categories } from "@/components/Categories";

import { CustomArtChat } from "@/components/CustomArtChat";
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

      <div className="container mx-auto px-4">
        <Hero />
        <Categories />
        <FeaturedProducts />
      </div>
      
      {/* Custom Art Request Section */}
      <div className="container mx-auto px-4 py-8">
        <CustomArtChat />
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
