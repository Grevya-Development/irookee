import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, User, LogOut, LayoutDashboard, Menu, X, Shield, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              irookee
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/search" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Find Experts
            </Link>
            <Link to="/about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              How it Works
            </Link>
            <Link to="/companion-apply" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Become an Expert
            </Link>
          </div>

          {/* User Auth / CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-slate-700/50 hover:ring-blue-500/50 transition-all p-0 overflow-hidden">
                    <img
                      src={user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                      alt={user.email || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-slate-200">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-sm font-semibold text-white truncate">{user.user_metadata?.full_name || 'Account'}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>

                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer focus:bg-slate-800 focus:text-white">
                    <LayoutDashboard className="w-4 h-4 mr-2 text-blue-400" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer focus:bg-slate-800 focus:text-white">
                    <Settings className="w-4 h-4 mr-2 text-indigo-400" />
                    Settings
                  </DropdownMenuItem>
                  
                  {user.user_metadata?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer focus:bg-slate-800 focus:text-white">
                      <Shield className="w-4 h-4 mr-2 text-purple-400" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-rose-400 focus:bg-rose-500/10 focus:text-rose-300">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/auth">
                  <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="gradient" size="sm" className="shadow-lg shadow-blue-500/20">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Find Experts
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            How it Works
          </Link>
          <Link
            to="/companion-apply"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Become an Expert
          </Link>

          {user ? (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} variant="outline" className="w-full justify-start border-slate-700 text-slate-200">
                <LayoutDashboard className="w-4 h-4 mr-2 text-blue-400" />
                Dashboard
              </Button>
              <Button onClick={() => { signOut(); setMobileMenuOpen(false); }} variant="ghost" className="w-full justify-start text-rose-400 hover:bg-rose-500/10">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full border-slate-700 text-slate-200">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="gradient" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
