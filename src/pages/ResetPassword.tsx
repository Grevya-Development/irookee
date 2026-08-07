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

/**
 * Landing page for the Supabase password-reset email.
 *
 * The link puts a short-lived recovery session in place before this renders, so
 * `updateUser({ password })` is authorised. If someone opens the page directly
 * there is no recovery session and we say so rather than showing a form that
 * cannot work.
 */
const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    // Supabase parses the recovery token from the URL fragment asynchronously and
    // emits PASSWORD_RECOVERY, so check both the event and the current session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setCanReset(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) setCanReset(true);
      setChecking(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);

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
    toast.success('Password updated.');
    // The recovery session is already a signed-in session.
    setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
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
              Choose a password you have not used on irookee before.
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
                  <p className="font-medium text-foreground">This reset link is invalid or has expired</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reset links can only be used once and expire after one hour.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/auth?mode=forgot">Request a new link</Link>
                </Button>
              </div>
            )}

            {!checking && canReset && done && (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
                <p className="font-medium text-foreground">Password updated</p>
                <p className="text-sm text-muted-foreground">Taking you to your dashboard…</p>
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
                  <Input
                    id="confirm-password"
                    type={visible ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    className="mt-1"
                    required
                  />
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
