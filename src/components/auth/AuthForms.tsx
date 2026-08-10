import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';

interface AuthFormsProps {
  initialMode?: 'signin' | 'signup';
}

export const AuthForms: React.FC<AuthFormsProps> = ({ initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        toast({ title: "Welcome back!", description: "Successfully signed in." });
        navigate('/dashboard');
      } else {
        await signUp(email, password, { full_name: fullName });
        toast({ title: "Account created!", description: "Please check your email to verify your account." });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-slate-900/80 border border-slate-800/80 shadow-2xl backdrop-blur-2xl">
      {/* Mode Switcher */}
      <div className="flex rounded-xl bg-slate-950 p-1.5 mb-8 border border-slate-800">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            mode === 'signin'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            mode === 'signup'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'signup' && (
          <div className="space-y-2">
            <Label className="text-slate-300">Full Name</Label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="pl-10 bg-slate-950/60 border-slate-800 text-white focus:border-blue-500"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-slate-300">Email Address</Label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              className="pl-10 bg-slate-950/60 border-slate-800 text-white focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Password</Label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-10 bg-slate-950/60 border-slate-800 text-white focus:border-blue-500"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="gradient"
          className="w-full py-6 text-base font-semibold shadow-lg shadow-blue-500/25 mt-2"
        >
          {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </form>
    </div>
  );
};
