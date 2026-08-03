import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/components/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { trackPageview } from "@/lib/analytics";
import { trackGaPageview } from "@/lib/googleAnalytics";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Lazy load pages for better performance
const PromptPeople = lazy(() => import("./pages/PromptPeople"));
// Home redirects to PromptPeople (main landing)
const Search = lazy(() => import("./pages/Search"));
const ExpertProfile = lazy(() => import("./pages/ExpertProfile"));
const Booking = lazy(() => import("./pages/Booking"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Admin = lazy(() => import("./pages/Admin"));
const ProfileSetup = lazy(() => import("./components/ProfileSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ExpertOnboarding = lazy(() => import("./components/expert/ExpertOnboarding").then(m => ({ default: m.ExpertOnboarding })));
const ExpertDashboard = lazy(() => import("./components/expert/ExpertDashboard").then(m => ({ default: m.ExpertDashboard })));
const GuestProfile = lazy(() => import("./pages/GuestProfile"));
const Companionship = lazy(() => import("./pages/Companionship"));
const CompanionService = lazy(() => import("./pages/CompanionService"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Settings = lazy(() => import("./pages/Settings"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
    const path = `${pathname}${search}`;
    trackPageview(path);
    trackGaPageview(path);
  }, [pathname, search, hash]);

  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
      >
        <Routes location={location}>
          <Route path="/" element={<PromptPeople />} />
          <Route path="/home" element={<PromptPeople />} />
          <Route path="/experts" element={<Search />} />
          <Route path="/search" element={<Search />} />
          <Route path="/companionship" element={<Companionship />} />
          <Route path="/companionship/:slug" element={<CompanionService />} />
          <Route path="/expert/:id" element={<ExpertProfile />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expert/onboarding" element={<ExpertOnboarding />} />
          <Route path="/expert/dashboard" element={<ExpertDashboard />} />
          <Route path="/speakers" element={<Search />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/*" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/user-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/guest-profile" element={<GuestProfile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
    },
  },
});

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </BrowserRouter>
        <Analytics />
        <SpeedInsights />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
