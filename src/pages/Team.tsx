import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Linkedin } from "lucide-react";

const Team = () => {
  const team = [
    {
      name: "Kavin",
      role: "Co-founder & CEO",
      bio: "With a background in technology and public speaking, Kavin leads our vision of transforming how organizations connect with speakers.",
      linkedin: "https://www.linkedin.com/in/kavinnr/",
      imageUrl: "/placeholder.svg"
    },
    {
      name: "Subramani",
      role: "Co-founder & CTO",
      bio: "A tech innovator with expertise in AI and machine learning, Subramani drives our platform's technological advancement.",
      linkedin: "#",
      imageUrl: "/placeholder.svg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-32">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-gray-900">Our Team</h1>
        </div>

        <p className="text-xl text-gray-600 mb-12 max-w-4xl">
          Meet the passionate individuals behind irookee who are working to revolutionize 
          the way organizations connect with speakers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {team.map((member) => (
            <Card key={member.name} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <img 
                    src={member.imageUrl} 
                    alt={member.name}
                    className="w-32 h-32 rounded-full mb-4 bg-gray-200"
                  />
                  <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                  <p className="text-primary mb-4">{member.role}</p>
                  <p className="text-gray-600 mb-4">{member.bio}</p>
                  <a 
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 inline-flex items-center gap-2"
                  >
                    <Linkedin className="w-5 h-5" />
                    Connect on LinkedIn
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;