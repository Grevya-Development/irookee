
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import Footer from "@/components/sections/Footer";
import SpeakerGrid from "@/components/SpeakerGrid";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <StatsSection />
      
      {/* Featured People Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured People
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our diverse community of experts, professionals, and specialists ready to help with your needs
            </p>
          </div>
          <SpeakerGrid />
          <div className="text-center mt-12">
            <Link 
              to="/speakers" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All People
            </Link>
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <Footer />
    </div>
  );
};

export default Index;
