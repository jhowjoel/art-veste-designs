
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { Categories } from "@/components/Categories";
import { ImageConverter } from "@/components/ImageConverter";

const Index = () => {
  return (
    <div className="min-h-screen bg-art-bg">
      <Header />
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
      <Footer />
    </div>
  );
};

export default Index;
