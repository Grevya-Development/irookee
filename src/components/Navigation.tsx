import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogIn, LogOut, Settings, Shield, Briefcase, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isCurrentUserAdmin } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAdminState = async () => {
      if (user) {
        const adminStatus = await isCurrentUserAdmin();
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminState();
  }, [user]);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Experts", href: "/experts" },
    { name: "Companionship", href: "/companionship" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "About", href: "/about" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const accountInitial = (profile?.full_name || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-3 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 ${
          scrolled
            ? "glass-nav shadow-xl border-slate-200/80 dark:border-white/10 py-2"
            : "bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border border-slate-200/50 dark:border-white/10 py-3 shadow-md"
        }`}
      >
        <div className="px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="relative flex items-center justify-center">
              <img
                src="/irookee-mark.svg"
                alt="irookee"
                className="h-9 w-9 object-contain group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute -inset-1 rounded-full bg-indigo-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              irookee
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-100/60 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/60 backdrop-blur-sm">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (

                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-3.5 py-1.5 text-sm font-semibold transition-colors duration-200 rounded-lg ${
                    isActive
                      ? "text-indigo-600 dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm -z-10 border border-slate-200/60 dark:border-slate-700/60"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link to="/expert/onboarding">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-600">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Become an Expert
              </Button>
            </Link>

            {isAdmin && (
              <Link to="/admin">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold shadow-sm">
                  <Shield className="h-3.5 w-3.5" /> Admin
                </span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <NotificationCenter />

                {profile?.user_type === "expert" && (
                  <Link to="/expert/dashboard">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium">
                      <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="hidden xl:inline">Expert Desk</span>
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Account menu"
                      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-sm font-bold text-white shadow-md hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {accountInitial}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass-panel p-1.5 rounded-xl">
                    <DropdownMenuLabel className="font-normal px-2 py-1.5">
                      <span className="block text-sm font-bold text-foreground">
                        {profile?.full_name || "Your account"}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-500" />
                        My Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                      <Link to="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-purple-500" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={handleSignOut}
                      className="rounded-lg text-red-600 dark:text-red-400 focus:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="default" size="sm" className="gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden flex items-center space-x-2">
            {isAdmin && (
              <Link to="/admin">
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold">
                  Admin
                </span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              className="text-slate-700 dark:text-slate-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden px-4 pt-3 pb-5 space-y-2 border-t border-slate-200/50 dark:border-slate-800/80 mt-3"
            >
              <div className="grid grid-cols-1 gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="px-3.5 py-2.5 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  to="/expert/onboarding"
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl text-base font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" /> Become an Expert
                </Link>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center justify-between px-3.5 py-2">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Notifications</span>
                      <NotificationCenter />
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <User className="h-4 w-4 text-indigo-500" /> Dashboard
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsOpen(false)}
                      className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Settings className="h-4 w-4 text-purple-500" /> Settings
                    </Link>
                    <Button
                      variant="destructive"
                      onClick={handleSignOut}
                      className="w-full justify-start gap-2 text-sm mt-2"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="default" className="w-full justify-center gap-2">
                      <LogIn className="h-4 w-4" /> Sign In / Register
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navigation;
