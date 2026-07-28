import { useState } from "react";
import Footer from "@/components/sections/Footer";
import { Link, useSearchParams } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";
import { Sparkles, ShieldCheck, Video, Users, Star, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  
  // Set isSignUp default based on query params or fallback
  const [isSignUp, setIsSignUp] = useState(mode === "signup");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col justify-between overflow-x-hidden">
      {/* Top Bar for Mobile */}
      <div className="lg:hidden px-6 pt-6 pb-2 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/irookee-mark.svg" alt="irookee" className="h-10 w-10 object-contain drop-shadow-md" />
          <span className="text-xl font-bold tracking-tight text-white">irookee</span>
        </Link>
        <Link to="/" className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 gap-8 items-center">
        {/* Left Visual Branding Showcase Column */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-8 pr-0 lg:pr-8">
          <div className="hidden lg:flex items-center space-x-3 mb-2">
            <Link to="/" className="flex items-center space-x-3 group">
              <img src="/irookee-mark.svg" alt="irookee" className="h-12 w-12 object-contain group-hover:scale-105 transition-transform" />
              <span className="text-3xl font-extrabold tracking-tight text-white">irookee</span>
            </Link>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" /> Direct Expert Knowledge
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              Prompt the People <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                You Want.
              </span>
            </h1>
            <p className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed">
              Connect 1-on-1 with verified industry leaders, startup founders, and career mentors for instant guidance.
            </p>
          </div>

          {/* Feature Showcase Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm text-white">100% Verified</h4>
              <p className="text-xs text-slate-400 mt-1">Vetted mentors & top founders</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                <Video className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm text-white">HD Video Calls</h4>
              <p className="text-xs text-slate-400 mt-1">Instant Jitsi video links</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 mb-3">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm text-white">5,000+ Users</h4>
              <p className="text-xs text-slate-400 mt-1">Global creator community</p>
            </div>
          </div>

          {/* Testimonial Quote Badge */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 backdrop-blur-lg flex items-center gap-4">
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
                <span className="text-white font-semibold ml-1">4.9/5 Rating</span>
              </div>
              <p className="text-slate-300 italic">"Irookee made booking an angel investor session effortless!"</p>
            </div>
          </div>
        </div>

        {/* Right Form Card Column */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-md bg-white/95 dark:bg-slate-950/90 p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-xl text-slate-900 dark:text-white transition-all">
            
            {/* Pill Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-6 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  !isSignUp
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  isSignUp
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form Container */}
            <div className="flex flex-col items-center justify-center w-full min-h-[380px]">
              {isSignUp ? (
                <SignUp 
                  routing="path" 
                  path="/auth"
                  signInUrl="/auth"
                  fallbackRedirectUrl="/profile-setup"
                  initialPhoneCountry="IN"
                  appearance={{
                    variables: {
                      colorPrimary: "#2563eb",
                    },
                    elements: {
                      formButtonPrimary: "!bg-blue-600 hover:!bg-blue-700 !text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 border-none transition-all py-2.5",
                      footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                    },
                  }}
                />
              ) : (
                <SignIn 
                  routing="path" 
                  path="/auth"
                  signUpUrl="/auth"
                  fallbackRedirectUrl="/dashboard"
                  initialPhoneCountry="IN"
                  appearance={{
                    variables: {
                      colorPrimary: "#2563eb",
                    },
                    elements: {
                      formButtonPrimary: "!bg-blue-600 hover:!bg-blue-700 !text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 border-none transition-all py-2.5",
                      footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                    },
                  }}
                />
              )}
            </div>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="underline font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Terms</Link> and{" "}
              <Link to="/privacy" className="underline font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
