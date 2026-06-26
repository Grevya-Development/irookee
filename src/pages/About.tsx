import Navigation from "@/components/Navigation";
import Footer from "@/components/sections/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, Sparkles, Globe, Heart, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About irookee</h1>
          <p className="text-xl text-muted-foreground mb-6">
            A world where every person — regardless of geography, income, language, or background —
            can access the right human expertise for any situation in their life, instantly.
          </p>
          <p className="text-lg text-muted-foreground italic">
            "The right person, for any situation, available to everyone — not just the privileged few."
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <Target className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
                <p className="text-muted-foreground">
                  To build the world's most trusted, accessible, and comprehensive human expertise
                  marketplace that connects people to verified professionals across every domain of human life.
                  From a cardiologist at midnight to a startup mentor before your investor pitch — irookee
                  makes it possible.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <Globe className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-3">Our Vision</h2>
                <p className="text-muted-foreground">
                  A first-generation entrepreneur in Tier 2 India deserves the same quality of startup
                  mentorship as someone in Silicon Valley. A mother in rural Tamil Nadu deserves the same
                  access to a child psychologist as someone in South Mumbai. irookee is building that future.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Core Values */}
          <h2 className="text-3xl font-bold text-center mb-8">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: "Democratisation", desc: "Breaking down barriers to quality expertise. 207+ categories, from healthcare to dating coaching." },
              { icon: Shield, title: "Trust & Safety", desc: "Every expert goes through rigorous KYC and document verification. No shortcuts on trust." },
              { icon: Users, title: "Inclusivity", desc: "Built for Bharat and beyond. Multilingual support, accessible design, and fair platform for all." },
              { icon: Sparkles, title: "AI-Powered", desc: "Our Prompt Engine matches you with the perfect expert using natural language — describe your problem, we find the person." },
              { icon: Target, title: "Impact", desc: "Every successful connection improves someone's life. We measure success in lives changed, not just sessions booked." },
              { icon: Globe, title: "Global Reach", desc: "Connecting experts and users across borders, cultures, and industries — starting from India, expanding worldwide." },
            ].map(v => (
              <Card key={v.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <v.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div><div className="text-4xl font-bold">207+</div><div className="text-sm opacity-80">Expert Categories</div></div>
            <div><div className="text-4xl font-bold">17</div><div className="text-sm opacity-80">Life Domains</div></div>
            <div><div className="text-4xl font-bold">100%</div><div className="text-sm opacity-80">Free Platform</div></div>
            <div><div className="text-4xl font-bold">24/7</div><div className="text-sm opacity-80">Available</div></div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Whether you need expert guidance or want to share your expertise with the world —
            irookee is the place for you.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" onClick={() => navigate('/speakers')}>Find an Expert</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/expert/onboarding')}>Become an Expert</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
