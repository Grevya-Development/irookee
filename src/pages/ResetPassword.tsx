import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
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
import { validateEmailInput } from '@/lib/emailValidation';

import { getAuthenticatedUserDestination } from '@/lib/auth';

/**
 * Landing page for the Supabase password-reset email.
 *
 * This requires an active PASSWORD_RECOVERY session or URL recovery token.
 * Normal login sessions are not permitted to use this form without an authentic recovery event.
 */
const ResetPassword = () => {
  const { updatePassword, requestPasswordReset, isPasswordRecovery, recoveryError, clearPasswordRecovery, user } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    // Direct inspection of hash and search params
    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    const search = window.location.search ? window.location.search.substring(1) : '';
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(search);

    const linkError = hashParams.get('error') || searchParams.get('error') || recoveryError;
    const linkErrorDesc = hashParams.get('error_description') || searchParams.get('error_description');

    if (linkError || linkErrorDesc) {
      if (active) {
        setCanReset(false);
        setErrorMessage(
          linkErrorDesc
            ? decodeURIComponent(linkErrorDesc.replace(/\+/g, ' '))
            : recoveryError || 'This reset link is invalid or has expired.'
        );
        setChecking(false);
      }
      return;
    }

    const type = hashParams.get('type') || searchParams.get('type');
    if (type === 'recovery' || isPasswordRecovery) {
      if (active) {
        setCanReset(true);
        setChecking(false);
      }
      return;
    }

    // Subscribe to supabase PASSWORD_RECOVERY auth event
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') {
        setCanReset(true);
        setChecking(false);
      }
    });

    // Guard: regular sessions do NOT qualify for recovery reset
    const timer = setTimeout(() => {
      if (!active) return;
      if (!isPasswordRecovery) {
        setCanReset(false);
        setChecking(false);
      }
    }, 1000);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [isPasswordRecovery, recoveryError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);

    if (!password) {
      setError('Please enter a new password.');
      return;
    }

    if (password.length < 8) {
      setError('Use at least 8 characters for your new password.');
      return;
    }

    if (password !== confirm) {
      setError('Those passwords do not match.');
      return;
    }

    setBusy(true);
    const { error: updateError } = await updatePassword(password);
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    clearPasswordRecovery();
    toast.success('Password updated successfully.');

    // Clear password from local state immediately
    setPassword('');
    setConfirm('');

    try {
      const dest = await getAuthenticatedUserDestination(user?.id);
      setTimeout(() => navigate(dest.defaultPath, { replace: true }), 1500);
    } catch {
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resending) return;
    setResendError(null);
    setResendSuccess(false);

    const emailCheck = validateEmailInput(resendEmail);
    if (emailCheck.error) {
      setResendError(emailCheck.error);
      return;
    }

    setResending(true);
    try {
      const { error: reqError } = await requestPasswordReset(emailCheck.email);
      if (reqError) {
        console.error('Resend reset link failed:', reqError);
        setResendError(reqError.message || 'Could not send the reset email.');
        return;
      }
      setResendSuccess(true);
      toast.success('If an account exists for this email, a password reset link has been sent.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send the reset email.';
      console.error('Exception during resend:', err);
      setResendError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo title="Reset your password" description="Set a new password for your irookee account." noindex />
      <Navigation />

      <main id="main" className="flex-1 container mx-auto px-4 pt-28 pb-16 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
              Set a new password
            </CardTitle>
            <CardDescription>
              Choose a secure password with at least 8 characters.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {checking && (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted-foreground">Verifying your reset link…</p>
              </div>
            )}

            {!checking && !canReset && (
              <div className="py-6 text-center space-y-4">
                <AlertCircle className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
                <div>
                  <p className="font-medium text-foreground">
                    {errorMessage || 'This reset link is invalid or has expired'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reset links can only be used once and expire after one hour.
                  </p>
                </div>

                <form onSubmit={handleResend} className="space-y-3 pt-2 text-left max-w-sm mx-auto" noValidate>
                  <div>
                    <Label htmlFor="resend-email" className="text-xs font-semibold">Email address</Label>
                    <Input
                      id="resend-email"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="name@company.com"
                      autoComplete="email"
                      className="mt-1"
                      required
                    />
                  </div>

                  {resendError && (
                    <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {resendError}
                    </p>
                  )}

                  {resendSuccess && (
                    <p role="status" className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 px-3 py-2 text-xs font-medium">
                      If an account exists for this email, a password reset link has been sent.
                    </p>
                  )}

                  <Button type="submit" className="w-full" disabled={resending}>
                    {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                    Resend Reset Link
                  </Button>
                </form>

                <div className="pt-2 flex items-center justify-center gap-4 text-xs">
                  <Button variant="link" asChild className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground">
                    <Link to="/auth?mode=forgot">Request a new link</Link>
                  </Button>
                  <span className="text-muted-foreground">•</span>
                  <Button variant="link" asChild className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground">
                    <Link to="/auth">Back to sign in</Link>
                  </Button>
                </div>
              </div>
            )}

            {!checking && canReset && done && (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
                <p className="font-medium text-foreground">Password updated</p>
                <p className="text-sm text-muted-foreground">Redirecting to your account…</p>
              </div>
            )}

            {!checking && canReset && !done && (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="new-password"
                      type={visible ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      aria-describedby="new-password-hint"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVisible((v) => !v)}
                      aria-label={visible ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                  <p id="new-password-hint" className="mt-1 text-xs text-muted-foreground">
                    At least 8 characters.
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirm-password"
                      type={confirmVisible ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setConfirmVisible((v) => !v)}
                      aria-label={confirmVisible ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {confirmVisible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Update password
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
