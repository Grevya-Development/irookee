import { Link } from "react-router-dom";
import { Facebook, Instagram, MessageCircle, Heart, ShieldCheck, Mail, Send } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import { toast } from "sonner";

const socialLinks = [
  { label: "X", href: "https://x.com/irookee", icon: "x" },
  { label: "Instagram", href: "https://www.instagram.com/irookee_official", icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com/irookee.official", icon: Facebook },
  { label: "Reddit", href: "https://www.reddit.com/user/irookee_official/", icon: MessageCircle },
];

const Footer = () => {
  const { user } = useAuth();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const protectedHref = (path: string) =>
    user ? path : `/auth?redirect=${encodeURIComponent(path)}`;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubscribing(true);
    setTimeout(() => {
      setSubscribing(false);
      toast.success("Thank you for subscribing to irookee updates!");
      setNewsletterEmail("");
    }, 600);
  };

  return (
    <footer className="bg-slate-950 text-slate-200 border-t border-slate-800/80 pt-16 pb-12 relative overflow-hidden select-none">
      {/* Background Mesh Glow */}
      <div className="absolute inset-0 pointer-events-none aurora-bg opacity-30" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 space-y-12">
        {/* Newsletter Subscription Banner */}
        <div className="glass-level-2 p-6 sm:p-8 rounded-3xl border-white/10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center lg:text-left">
            <h3 className="text-xl font-bold text-white flex items-center justify-center lg:justify-start gap-2">
              Stay ahead with curated expert insights
            </h3>
            <p className="text-xs text-slate-400">
              Get weekly updates on emerging tech, mentorship tips, and top platform practitioners.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full max-w-md">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="Enter your email..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={subscribing}
              className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition-all shadow-md shrink-0 flex items-center gap-1.5"
            >
              {subscribing ? "Joining..." : "Subscribe"}
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Socials */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-3 inline-block shadow-md">
              <img src="/irookee.svg" alt="irookee - Find people, get connected." className="h-14 w-auto object-contain" />
            </div>
            <p className="text-base font-bold text-gradient">People for People</p>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              Democratizing expert knowledge and human connection. Verified practitioners available for direct 1-on-1 sessions.
            </p>
            <div>
              <a href="mailto:kavin@irookee.com" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                kavin@irookee.com
              </a>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all flex items-center justify-center shadow-sm"
                  >
                    {Icon === "x" ? (
                      <span className="text-xs font-black">X</span>
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/" className="hover:text-indigo-400 transition-colors">Home</Link></li>
              <li><Link to="/experts" className="hover:text-indigo-400 transition-colors">Browse Experts</Link></li>
              <li><Link to="/companionship" className="hover:text-indigo-400 transition-colors">Companionship</Link></li>
              <li><Link to="/search" className="hover:text-indigo-400 transition-colors">AI Search</Link></li>
              <li><Link to="/leaderboard" className="hover:text-indigo-400 transition-colors">Leaderboard</Link></li>
              <li><Link to="/about" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* For Experts */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">For Experts</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/expert/onboarding" className="hover:text-indigo-400 transition-colors">Become an Expert</Link></li>
              <li><Link to={protectedHref("/expert/dashboard")} className="hover:text-indigo-400 transition-colors">Expert Dashboard</Link></li>
              <li><Link to={protectedHref("/dashboard")} className="hover:text-indigo-400 transition-colors">My Dashboard</Link></li>
              <li><Link to={protectedHref("/settings")} className="hover:text-indigo-400 transition-colors">Account Settings</Link></li>
            </ul>
          </div>

          {/* Legal & Status */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-white uppercase tracking-wider">Legal & Trust</h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li><Link to="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/cookies" className="hover:text-indigo-400 transition-colors">Cookie Policy</Link></li>
              <li><a href="mailto:kavin@irookee.com" className="hover:text-indigo-400 transition-colors">Contact Support</a></li>
            </ul>

            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; 2026 irookee Inc. All rights reserved.</p>
          <div className="flex items-center gap-1">
            Built for direct human connection <Heart className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500 ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
