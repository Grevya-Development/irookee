import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import Footer from '@/components/sections/Footer';
import Seo from '@/components/Seo';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-800' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  switch (score) {
    case 1: return { score: 25, label: 'Weak', color: 'bg-red-500' };
    case 2: return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    case 3: return { score: 75, label: 'Good', color: 'bg-indigo-500' };
    case 4: return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
    default: return { score: 15, label: 'Weak', color: 'bg-red-500' };
  }
};

/**
 * Landing page for the Supabase password-reset email.
 *
 * Handles native Supabase recovery tokens (hash/query/session).
 * Allows users to securely update their password, terminates the recovery session,
 * and navigates them to login.
 */
const ResetPassword = () => {
  const { updatePassword, signOut } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    // Check for error parameters in URL hash or query string
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('error=') || search.includes('error=')) {
      if (active) {
        setCanReset(false);
        setChecking(false);
      }
      return;
    }

    // Supabase parses the recovery token from the URL fragment asynchronously and
    // emits PASSWORD_RECOVERY, so check both the event and the current session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || (session && hash.includes('type=recovery'))) {
        setCanReset(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) {
        setCanReset(true);
      }
      setChecking(false);
    });

    // Timeout safety fallback: if after 2.5s no session or recovery event is detected
    const timeout = setTimeout(() => {
      if (active) {
        setChecking(false);
      }
    }, 2500);

    return () => {
      active = false;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);

    const trimmedPassword = password.trim();
    const trimmedConfirm = confirm.trim();

    if (!trimmedPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (trimmedPassword.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }
    if (!trimmedConfirm) {
      setError('Please confirm your new password.');
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      setError('Those passwords do not match.');
      return;
    }

    setBusy(true);
    const { error: updateError } = await updatePassword(trimmedPassword);
    setBusy(false);

    if (updateError) {
      setError(updateError.message || 'Could not update your password. Please try again.');
      return;
    }

    setDone(true);
    toast.success('Password updated successfully. Please log in with your new password.');

    // End recovery authentication session safely
    try {
      await signOut();
    } catch (e) {
      console.error('Error signing out recovery session:', e);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo title="Reset your password" description="Set a new password for your irookee account." noindex />
      <Navigation />

      <main id="main" className="flex-1 container mx-auto px-4 pt-28 pb-16 max-w-md flex flex-col justify-center">
        <Card className="glass-card shadow-xl border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {done ? 'Password Reset Complete' : 'Set a new password'}
            </CardTitle>
            <CardDescription className="text-xs">
              {done
                ? 'Your password has been successfully updated.'
                : 'Choose a strong password with at least 8 characters.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {checking && (
              <div className="py-12 text-center space-y-3">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                <p className="text-sm font-medium text-muted-foreground">Verifying your reset link…</p>
              </div>
            )}

            {!checking && !canReset && !done && (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold text-foreground text-base">This password reset link is invalid or has expired</p>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Password reset links can only be used once and expire after a short period. Please request a fresh reset link.
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <Button asChild className="rounded-xl font-bold h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                    <Link to="/auth?mode=forgot">Request New Reset Link</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl font-semibold h-11 border-slate-200 dark:border-slate-800">
                    <Link to="/auth">
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {done && (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/20">
                  <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-bold text-foreground text-lg">Password updated successfully</p>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Your password has been changed. Please log in with your new password to continue.
                  </p>
                </div>
                <div className="pt-2">
                  <Button asChild className="w-full font-bold h-12 rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link to="/auth">Go to Login</Link>
                  </Button>
                </div>
              </div>
            )}

            {!checking && canReset && !done && (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Enter at least 8 characters"
                      aria-describedby="new-password-hint"
                      className="pr-10 h-11 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>

                  {password && (
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>Password strength: <strong className="text-foreground">{strength.label}</strong></span>
                        <span>At least 8 chars</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      className="pr-10 h-11 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full font-bold h-12 rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-indigo-500/20"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      Resetting password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;
