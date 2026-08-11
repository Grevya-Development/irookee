import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Star, Search, X, CheckCircle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate("/search");
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-20 overflow-hidden aurora-bg">
      {/* Glow Orbs & Mesh Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="text-center space-y-8"
        >
          {/* Top Pill Badge */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-level-2 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide shadow-glow-sm">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Prompt the People You Want 1-on-1</span>
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span className="text-slate-500 dark:text-slate-400 font-normal">Over 500+ Verified Leaders</span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div variants={fadeUp} className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Direct Guidance from{" "}
              <span className="text-gradient">World-Class</span> Experts & Founders
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
              Book instant 1-on-1 video consultations, advisory sessions, and direct mentorship with top industry leaders.
            </p>
          </motion.div>

          {/* AI Floating Search Bar */}
          <motion.div variants={fadeUp} className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-25 group-hover:opacity-60 blur-md transition duration-300" />
              <div className="relative flex items-center glass-level-2 rounded-2xl p-1.5 border-slate-200/80 dark:border-white/10 shadow-2xl">
                <Search className="ml-3.5 text-slate-400 h-5 w-5 shrink-0" />
                <Input
                  type="text"
                  placeholder="Search for experts... (e.g. 'AI engineer', 'Startup Mentor', 'Growth Hacker')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-3 text-foreground placeholder:text-muted-foreground/60 shadow-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-slate-600 mr-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="rounded-xl px-6 font-bold shadow-md shrink-0"
                >
                  Search
                </Button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Popular:</span>
              <button onClick={() => { setSearchQuery("AI Consultant"); navigate("/search?q=AI%20Consultant"); }} className="hover:text-indigo-500 underline decoration-indigo-400/40">AI Consultant</button>
              <span>•</span>
              <button onClick={() => { setSearchQuery("Tech Founder"); navigate("/search?q=Tech%20Founder"); }} className="hover:text-indigo-500 underline decoration-indigo-400/40">Tech Founder</button>
              <span>•</span>
              <button onClick={() => { setSearchQuery("Career Coach"); navigate("/search?q=Career%20Coach"); }} className="hover:text-indigo-500 underline decoration-indigo-400/40">Career Coach</button>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <Button
              size="xl"
              onClick={() => navigate("/experts")}
              className="w-full sm:w-auto gap-2 shadow-glow"
            >
              Explore Expert Directory
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              onClick={() => navigate("/expert/onboarding")}
              className="w-full sm:w-auto gap-2"
            >
              Apply as an Expert
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </Button>
          </motion.div>

          {/* Key Value Props Bar with CountUp */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-8">
            <div className="glass-card p-4 rounded-2xl flex items-center gap-3 text-left">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Verified Mentors</h4>
                <p className="text-xs text-muted-foreground">Rigorous background vetting</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex items-center gap-3 text-left">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 font-bold">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Instant HD Calls</h4>
                <p className="text-xs text-muted-foreground">Seamless video conference</p>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl flex items-center gap-3 text-left">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">4.9/5 Rating</h4>
                <p className="text-xs text-muted-foreground">
                  Over <CountUp to={1800} suffix="+" /> booked sessions
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
