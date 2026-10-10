import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, KeyRound, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
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
import {
  getSafeSessionItem,
  setSafeSessionItem,
  removeSafeSessionItem,
  hasExchangedCode,
  markCodeExchanged,
} from '@/lib/safeStorage';

type RecoveryState = 'checking' | 'ready' | 'error' | 'success';

/**
 * Landing page for the Supabase password-reset flow.
 *
 * Enforces a rigorous state model:
 * 1. checking: validates URL recovery parameters (hash, code, token_hash) and coordinates
 *    with Supabase client initialization before rendering the reset form.
 * 2. ready: recovery session is confirmed and updateUser() can safely execute.
 * 3. error: invalid/expired link, or missing recovery session, with self-service resend option.
 * 4. success: password updated, session transitioned, and clean redirection.
 */
const ResetPassword = () => {
  const {
    updatePassword,
    requestPasswordReset,
    isPasswordRecovery,
    recoveryError,
    clearPasswordRecovery,
    user,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [recoveryState, setRecoveryState] = useState<RecoveryState>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isNormalSession, setIsNormalSession] = useState(false);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const establishRecoverySession = async () => {
      // 1. Direct inspection of hash and search params
      const rawHash = location.hash || (typeof window !== 'undefined' ? window.location.hash : '');
      const rawSearch = location.search || (typeof window !== 'undefined' ? window.location.search : '');

      const hash = rawHash.startsWith('#') ? rawHash.substring(1) : rawHash;
      const search = rawSearch.startsWith('?') ? rawSearch.substring(1) : rawSearch;

      const hashParams = new URLSearchParams(hash);
      const searchParams = new URLSearchParams(search);

      // Check for redirect errors from Supabase
      const urlError = hashParams.get('error') || searchParams.get('error') || recoveryError;
      const urlErrorDesc = hashParams.get('error_description') || searchParams.get('error_description');

      if (urlError || urlErrorDesc) {
        if (!active) return;
        setErrorMessage(
          urlErrorDesc
            ? decodeURIComponent(urlErrorDesc.replace(/\+/g, ' '))
            : recoveryError || 'This reset link is invalid or has expired.'
        );
        setRecoveryState('error');
        return;
      }

      const type = hashParams.get('type') || searchParams.get('type');
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const code = searchParams.get('code') || hashParams.get('code');
      const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');

      const hasRecoveryParams = Boolean(
        (tokenHash && type === 'recovery') ||
        code ||
        (accessToken && refreshToken) ||
        type === 'recovery'
      );

      const storedRecoveryActive = getSafeSessionItem('irookee_recovery_active') === 'true';

      // 2. CRITICAL: Check if Supabase client has ALREADY established the session
      // (e.g. via background SDK initialization or PASSWORD_RECOVERY event)
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (!active) return;

      if (existingSession?.user && (storedRecoveryActive || isPasswordRecovery || hasRecoveryParams)) {
        setSafeSessionItem('irookee_recovery_active', 'true');
        if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
          window.history.replaceState(window.history.state, '', window.location.pathname);
        }
        setRecoveryState('ready');
        return;
      }

      // 3. Case: token_hash in URL (Recommended Supabase recovery email OTP flow)
      if (tokenHash && type === 'recovery') {
        try {
          const { data, error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (!active) return;

          if (verifyErr || !data.session) {
            // Double-check if background initialization established the session
            const { data: { session: checkSession } } = await supabase.auth.getSession();
            if (checkSession?.user) {
              setSafeSessionItem('irookee_recovery_active', 'true');
              window.history.replaceState(window.history.state, '', window.location.pathname);
              setRecoveryState('ready');
              return;
            }

            console.error('verifyOtp failed:', verifyErr);
            setErrorMessage('This reset link is invalid or has expired.');
            setRecoveryState('error');
            return;
          }

          setSafeSessionItem('irookee_recovery_active', 'true');
          window.history.replaceState(window.history.state, '', window.location.pathname);
          setRecoveryState('ready');
          return;
        } catch (err) {
          if (!active) return;
          console.error('Exception during verifyOtp recovery:', err);
          setErrorMessage('This reset link is invalid or has expired.');
          setRecoveryState('error');
          return;
        }
      }

      // 4. Case: PKCE code in URL
      if (code) {
        if (hasExchangedCode(code)) {
          // Already attempted or currently exchanging this code in another mount/cycle
          const { data: { session: pendingSession } } = await supabase.auth.getSession();
          if (pendingSession?.user) {
            setSafeSessionItem('irookee_recovery_active', 'true');
            setRecoveryState('ready');
          }
          return;
        }
        markCodeExchanged(code);

        try {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (!active) return;

          if (exchangeErr || !data.session) {
            // If exchange failed, check if GoTrue's internal initializer won the race and exchanged it
            const { data: { session: bgSession } } = await supabase.auth.getSession();
            if (bgSession?.user) {
              setSafeSessionItem('irookee_recovery_active', 'true');
              window.history.replaceState(window.history.state, '', window.location.pathname);
              setRecoveryState('ready');
              return;
            }

            console.error('exchangeCodeForSession failed:', exchangeErr);
            setErrorMessage('This reset link could not be verified or has expired. Please request a new link.');
            setRecoveryState('error');
            return;
          }

          setSafeSessionItem('irookee_recovery_active', 'true');
          window.history.replaceState(window.history.state, '', window.location.pathname);
          setRecoveryState('ready');
          return;
        } catch (err) {
          if (!active) return;
          const { data: { session: bgSession } } = await supabase.auth.getSession();
          if (bgSession?.user) {
            setSafeSessionItem('irookee_recovery_active', 'true');
            window.history.replaceState(window.history.state, '', window.location.pathname);
            setRecoveryState('ready');
            return;
          }
          console.error('Exception during code exchange:', err);
          setErrorMessage('This reset link could not be verified or has expired. Please request a new link.');
          setRecoveryState('error');
          return;
        }
      }

      // 5. Case: access_token and refresh_token in URL (Implicit grant fallback)
      if (accessToken && refreshToken) {
        try {
          const { data, error: setSessionErr } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!active) return;

          if (setSessionErr || !data.session) {
            console.error('setSession failed during recovery:', setSessionErr);
            setErrorMessage('This reset link is invalid or has expired.');
            setRecoveryState('error');
            return;
          }

          setSafeSessionItem('irookee_recovery_active', 'true');
          window.history.replaceState(window.history.state, '', window.location.pathname);
          setRecoveryState('ready');
          return;
        } catch (err) {
          if (!active) return;
          console.error('Exception during setSession recovery:', err);
          setErrorMessage('This reset link is invalid or has expired.');
          setRecoveryState('error');
          return;
        }
      }

      // 6. Case: Normal authenticated user visits /reset-password directly
      if (existingSession?.user && !storedRecoveryActive && !isPasswordRecovery && !hasRecoveryParams) {
        setIsNormalSession(true);
        setErrorMessage('You are currently signed in. To change your password, please use the Security settings.');
        setRecoveryState('error');
        return;
      }

      // 7. Case: Direct unauthenticated visit without recovery token
      if (getSafeSessionItem('irookee_recovery_active') === 'true') {
        setRecoveryState('ready');
        return;
      }
      setErrorMessage('This reset link is invalid or has expired.');
      setRecoveryState('error');
    };

    void establishRecoverySession();

    // Listen for PASSWORD_RECOVERY event if Supabase client is processing in background
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') {
        if (nextSession?.user) {
          setSafeSessionItem('irookee_recovery_active', 'true');
          setRecoveryState('ready');
        }
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [isPasswordRecovery, recoveryError, location.hash, location.search]);

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

    // Explicitly verify recovery session exists before attempting updateUser
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      setBusy(false);
      setError('Auth session missing! Please request a new password reset link.');
      return;
    }

    const { error: updateError } = await updatePassword(password);
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setRecoveryState('success');
    clearPasswordRecovery();
    removeSafeSessionItem('irookee_recovery_active');
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
            {recoveryState === 'checking' && (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted-foreground">Verifying your reset link…</p>
              </div>
            )}

            {recoveryState === 'error' && (
              <div className="py-6 text-center space-y-4">
                {isNormalSession ? (
                  <>
                    <ShieldCheck className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
                    <div>
                      <p className="font-medium text-foreground">
                        {errorMessage || 'You are already signed in.'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        To change your password, please use the Security settings in your account.
                      </p>
                    </div>
                    <Button asChild className="w-full">
                      <Link to="/settings?tab=security">Go to Security Settings</Link>
                    </Button>
                    <div className="pt-2 text-xs text-muted-foreground">
                      <Button variant="link" asChild className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground">
                        <Link to="/dashboard">Back to dashboard</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}

            {recoveryState === 'success' && (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
                <p className="font-medium text-foreground">Password updated</p>
                <p className="text-sm text-muted-foreground">Redirecting to your account…</p>
              </div>
            )}

            {recoveryState === 'ready' && (
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
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
