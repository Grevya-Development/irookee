import Footer from "@/components/sections/Footer";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthForms from "@/components/auth/AuthForms";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { safeRedirect } from "@/lib/redirects";
import { Sparkles, ShieldCheck, Video, Users, Star, ArrowLeft, CheckCircle2, Award } from "lucide-react";
import Seo from "@/components/Seo";
import { ROUTE_SEO } from "@/lib/seoMeta";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import CountUp from "@/components/ui/CountUp";

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo || "/dashboard", { replace: true });
    }
  }, [loading, user, redirectTo, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-x-hidden aurora-bg relative select-none">
      <Seo
        title={ROUTE_SEO.auth.title}
        description={ROUTE_SEO.auth.description}
        path={ROUTE_SEO.auth.path}
        noindex
      />

      {/* Ambient Animated Glowing Orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Top Mobile Header */}
      <div className="lg:hidden px-6 pt-6 pb-2 flex items-center justify-between z-20">
        <Link to="/" className="flex items-center space-x-2.5">
          <img src="/irookee-mark.svg" alt="irookee" className="h-9 w-9 object-contain drop-shadow-md" />
          <span className="text-xl font-black tracking-tight text-white">irookee</span>
        </Link>
        <Link to="/" className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 glass-level-1 px-3.5 py-1.5 rounded-full font-semibold">
          <ArrowLeft className="h-3.5 w-3.5" /> Back Home
        </Link>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 gap-12 items-center z-10">
        {/* Left Storytelling Showcase */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="lg:col-span-6 flex flex-col justify-center space-y-8 pr-0 lg:pr-8"
        >
          <motion.div variants={fadeUp} className="hidden lg:flex items-center space-x-3 mb-2">
            <Link to="/" className="flex items-center space-x-3 group">
              <img src="/irookee-mark.svg" alt="irookee" className="h-11 w-11 object-contain group-hover:scale-105 transition-transform" />
              <span className="text-3xl font-black tracking-tight text-white">irookee</span>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-level-1 border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
              Direct Peer-To-Peer Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              Prompt the People <br />
              <span className="text-gradient">You Want 1-on-1.</span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed font-normal">
              Connect directly with verified industry leaders, startup founders, and mentors for instant 1-on-1 video guidance.
            </p>
          </motion.div>

          {/* Feature Showcase Grid */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl glass-level-2 specular-border hover:border-indigo-500/30 transition-all group">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 font-bold group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-white">100% Verified</h4>
              <p className="text-xs text-slate-400 mt-1">Vetted mentors & leaders</p>
            </div>

            <div className="p-4 rounded-2xl glass-level-2 specular-border hover:border-purple-500/30 transition-all group">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-3 font-bold group-hover:scale-110 transition-transform">
                <Video className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-white">Instant HD Video</h4>
              <p className="text-xs text-slate-400 mt-1">Jitsi & web video links</p>
            </div>

            <div className="p-4 rounded-2xl glass-level-2 specular-border hover:border-pink-500/30 transition-all group">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-3 font-bold group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-white">
                <CountUp to={5000} suffix="+" /> Sessions
              </h4>
              <p className="text-xs text-slate-400 mt-1">Global peer network</p>
            </div>
          </motion.div>

          {/* Social Proof Testimonial Card */}
          <motion.div variants={fadeUp} className="p-4 rounded-2xl glass-level-2 border-indigo-500/30 flex items-center gap-4">
            <div className="flex -space-x-2 overflow-hidden shrink-0">
              <div className="inline-block h-9 w-9 rounded-full ring-2 ring-indigo-500 bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">PS</div>
              <div className="inline-block h-9 w-9 rounded-full ring-2 ring-purple-500 bg-purple-600 text-white font-bold flex items-center justify-center text-xs">AM</div>
              <div className="inline-block h-9 w-9 rounded-full ring-2 ring-pink-500 bg-pink-600 text-white font-bold flex items-center justify-center text-xs">LK</div>
            </div>
            <div className="text-xs space-y-0.5">
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <span className="text-white font-bold ml-1">4.9/5 Rating</span>
              </div>
              <p className="text-slate-300 italic">"Booking an expert session on irookee was completely seamless!"</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Auth Form Column */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="lg:col-span-6 flex flex-col items-center justify-center"
        >
          <motion.div 
            whileHover={{ y: -3 }}
            className="w-full max-w-md bg-white/95 dark:bg-slate-950/90 p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 backdrop-blur-2xl text-slate-900 dark:text-white transition-all specular-border"
          >
            <AuthForms
              mode={mode === "signup" ? "signup" : mode === "forgot" ? "forgot" : "signin"}
              onModeChange={(next) => {
                const params = new URLSearchParams(searchParams);
                if (next === "signin") params.delete("mode");
                else params.set("mode", next);
                setSearchParams(params, { replace: true });
              }}
              redirectTo={redirectTo || "/dashboard"}
            />

            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="underline font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Terms</Link> and{" "}
              <Link to="/privacy" className="underline font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Privacy Policy</Link>.
            </p>
          </motion.div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
