
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Target, Users, Award, Globe } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Mission",
      description: "To revolutionize how organizations connect with impactful experts, making knowledge sharing more accessible and engaging."
    },
    {
      icon: Users,
      title: "Community",
      description: "Building a vibrant community of experts and organizations who believe in the power of shared knowledge."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Committed to maintaining the highest standards in expert selection and event matching."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Connecting experts and audiences across borders, cultures, and industries."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32">
        <div className="flex items-center gap-3 mb-8">
          <Info className="w-8 h-8 text-primary-600" />
          <h1 className="text-4xl font-bold text-gray-900">About Us</h1>
        </div>

        <div className="max-w-4xl mx-auto">
          <p className="text-xl text-gray-600 mb-12">
            irookee is more than just an expert booking platform - we're a community dedicated to 
            making knowledge sharing accessible, engaging, and impactful.
          </p>

          <h2 className="text-2xl font-bold mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <value.icon className="w-8 h-8 text-primary-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
