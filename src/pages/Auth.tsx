import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthForms from "@/components/auth/AuthForms";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import { safeRedirect } from "@/lib/redirects";
import { getAuthenticatedUserDestination } from "@/lib/auth";
import { Video, Users, Award, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";
import { ROUTE_SEO } from "@/lib/seoMeta";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

const Auth = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const rawRedirect = searchParams.get("redirect");
  const redirectTo = safeRedirect(rawRedirect);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    if (!loading && user) {
      if (rawRedirect && redirectTo && redirectTo !== "/dashboard") {
        navigate(redirectTo, { replace: true });
        return;
      }
      getAuthenticatedUserDestination(user.id).then((dest) => {
        if (!active) return;
        navigate(dest.defaultPath, { replace: true });
      });
    }
    return () => {
      active = false;
    };
  }, [loading, user, rawRedirect, redirectTo, navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center overflow-x-hidden relative select-none font-sans p-4 sm:p-6 lg:p-8">
      <Seo
        title={ROUTE_SEO.auth.title}
        description={ROUTE_SEO.auth.description}
        path={ROUTE_SEO.auth.path}
        noindex
      />

      {/* Ambient Radial Lighting */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-50 dark:opacity-20"
        style={{
          background: "radial-gradient(ellipse at top, rgba(99, 102, 241, 0.08) 0%, transparent 70%)"
        }}
      />

      {/* Announcement Bar */}
      <div className="w-full max-w-5xl bg-[#1E1B4B] text-indigo-100 text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 z-30 relative rounded-t-[2.5rem]">
        <span>✨ Verified Industry Experts & Peer Companionship • 100% Secure & Trusted</span>
      </div>

      {/* Main Container — Floating Split Card */}
      <main className="w-full max-w-5xl z-10 flex items-center justify-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full bg-white dark:bg-slate-900 rounded-b-[2.5rem] shadow-xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 min-h-[580px]"
        >
          {/* Left Showcase Panel — Light Indigo Palette */}
          <div className="lg:col-span-5 bg-indigo-50/70 dark:bg-slate-900/90 text-slate-900 dark:text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-r border-indigo-100/80 dark:border-slate-800">
            {/* Ambient Inner Glow */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              {/* Brand Logo & Pill Badge */}
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2 group">
                  <img src="/irookee-mark.svg" alt="irookee" className="h-7 w-7 object-contain group-hover:scale-105 transition-transform" />
                  <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">irookee</span>
                </Link>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                  AUTH PORTAL
                </div>
              </div>

              {/* Main Heading */}
              <div className="space-y-3 pt-2">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Verified Experts,<br />
                  <span className="text-indigo-600 dark:text-indigo-400">Direct 1-on-1.</span>
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Access your partner account or expert profile. Verified credentials cataloging and 1-on-1 session guarantees.
                </p>
              </div>

              {/* Feature Cards Stack */}
              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex items-start gap-3 shadow-sm">
                  <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">100% Verified Mentors</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Vetted credentials, background checks, & expertise audits.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex items-start gap-3 shadow-sm">
                  <Video className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Instant HD Video Calls</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">One-click Jitsi & WebRTC video room creation.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex items-start gap-3 shadow-sm">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Global Peer Network</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Connect directly with founders, engineers, & advisors.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Panel Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-6 border-t border-slate-200/80 dark:border-slate-800 mt-8 relative z-10">
              <span>© 2026 irookee Inc.</span>
              <span>100% Verified Network</span>
            </div>
          </div>

          {/* Right Auth Panel — Form */}
          <div className="lg:col-span-7 p-6 sm:p-10 bg-white dark:bg-slate-900 flex flex-col justify-center">
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

            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="underline font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Terms</Link> and{" "}
              <Link to="/privacy" className="underline font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400">Privacy Policy</Link>.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;




