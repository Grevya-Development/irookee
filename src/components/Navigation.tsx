import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User, LogIn, LogOut, Settings, Shield, Briefcase } from "lucide-react";
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

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

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
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/irookee-mark.svg" alt="irookee" className="h-9 w-9 object-contain" />
              <span className="text-xl font-bold text-gray-900">irookee</span>
            </Link>
          </div>

          {/*
            Desktop Navigation.

            Adding "Companionship" made this row wider than the `md` breakpoint it
            used to switch on at, and with nothing forbidding wrapping, flex broke
            "Become an Expert" and "Expert Desk" onto two lines inside a 64px row
            (UI-3). So: switch at `lg`, never wrap a label, and let the tighter
            spacing come from each item's own padding.
          */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="whitespace-nowrap text-gray-700 hover:text-blue-600 px-2 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/expert/onboarding"
              className="whitespace-nowrap text-gray-700 hover:text-blue-600 px-2 py-2 text-sm font-medium transition-colors"
            >
              Become an Expert
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="whitespace-nowrap bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                Admin<span className="hidden xl:inline">&nbsp;Console</span>
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-1">
                <NotificationCenter />
                {/*
                  The account links show icon-only between lg and xl, where the
                  full row would not fit. `aria-label` carries the name at every
                  width, so the label is never lost. (`not-sr-only` would have
                  been the obvious choice, but it also resets
                  `white-space: normal`, re-introducing the wrap this fixes.)
                */}
                {profile?.user_type === 'expert' && (
                  <Link
                    to="/expert/dashboard"
                    aria-label="Expert Desk"
                    className="whitespace-nowrap text-gray-700 hover:text-blue-600 px-2 py-2 text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <Briefcase className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden xl:inline">Expert Desk</span>
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  aria-label="Dashboard"
                  className="whitespace-nowrap text-gray-700 hover:text-blue-600 px-2 py-2 text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden xl:inline">Dashboard</span>
                </Link>
                <Link
                  to="/settings"
                  aria-label="Settings"
                  className="whitespace-nowrap text-gray-700 hover:text-blue-600 px-2 py-2 text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden xl:inline">Settings</span>
                </Link>
                <div className="pl-2 border-l border-gray-200">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Account menu"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                      >
                        {accountInitial}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <span className="block text-sm font-medium text-foreground">
                          {profile?.full_name || 'Your account'}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {user?.email}
                        </span>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard">
                          <User className="mr-2 h-4 w-4" aria-hidden="true" />
                          My dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/settings">
                          <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="whitespace-nowrap bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <LogIn className="h-3 w-3" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              // -mr-2 keeps the icon optically aligned while the tap area meets
              // the 44x44 minimum.
              className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded text-gray-700 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden" id="mobile-navigation">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                to="/expert/onboarding"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Become an Expert
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-purple-700 font-semibold block px-3 py-2 text-base transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Admin Console
                </Link>
              )}
              {user ? (
                <>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-base font-medium text-gray-700">Notifications</span>
                    <NotificationCenter />
                  </div>
                  {profile?.user_type === 'expert' && (
                    <Link
                      to="/expert/dashboard"
                      className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Expert Dashboard
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Client Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium transition-colors w-full text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="bg-blue-600 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

