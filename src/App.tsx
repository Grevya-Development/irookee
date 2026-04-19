import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";

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
const Admin = lazy(() => import("./pages/Admin"));
const UserDashboard = lazy(() => import("./components/UserDashboard"));
const ProfileSetup = lazy(() => import("./components/ProfileSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ExpertOnboarding = lazy(() => import("./components/expert/ExpertOnboarding").then(m => ({ default: m.ExpertOnboarding })));
const ExpertDashboard = lazy(() => import("./components/expert/ExpertDashboard").then(m => ({ default: m.ExpertDashboard })));
const Speakers = lazy(() => import("./pages/Speakers"));
const GuestProfile = lazy(() => import("./pages/GuestProfile"));
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

// Optimized QueryClient with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<PromptPeople />} />
              <Route path="/home" element={<PromptPeople />} />
              <Route path="/search" element={<Search />} />
              <Route path="/expert/:id" element={<ExpertProfile />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/expert/onboarding" element={<ExpertOnboarding />} />
              <Route path="/expert/dashboard" element={<ExpertDashboard />} />
              <Route path="/speakers" element={<Speakers />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/user-dashboard" element={<UserDashboard />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/guest-profile" element={<GuestProfile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
