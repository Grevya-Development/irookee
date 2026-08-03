import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';
import { validateEmailInput } from '@/lib/emailValidation';
import { toast } from 'sonner';

type Mode = 'signin' | 'signup' | 'forgot';

interface AuthFormsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  /** Where to land after a successful sign in. */
  redirectTo: string;
}

const PasswordField = ({
  id,
  value,
  onChange,
  label,
  autoComplete,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoComplete: string;
  describedBy?: string;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
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
    </div>
  );
};

export const AuthForms = ({ mode, onModeChange, redirectTo }: AuthFormsProps) => {
  const { signIn, signUp, signInWithOAuth, requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);

  const reset = () => {
    setError(null);
    setSentTo(null);
  };

  const handleOAuth = async () => {
    reset();
    setOauthBusy(true);
    const { error: oauthError } = await signInWithOAuth('google');
    if (oauthError) {
      setError(oauthError.message);
      setOauthBusy(false);
    }
    // On success the browser navigates to Google; no need to clear busy.
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return; // guards against double submit
    reset();

    const emailCheck = validateEmailInput(email);
    if (emailCheck.error) {
      setError(emailCheck.error);
      return;
    }

    if (mode === 'forgot') {
      setBusy(true);
      const { error: resetError } = await requestPasswordReset(email);
      setBusy(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      // Always report success: revealing whether an address exists would leak
      // which emails are registered.
      setSentTo(email.trim());
      return;
    }

    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }

    setBusy(true);

    if (mode === 'signup') {
      const { error: signUpError, needsEmailConfirmation } = await signUp(email, password, fullName);
      setBusy(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (needsEmailConfirmation) {
        setSentTo(email.trim());
        return;
      }
      toast.success('Account created. Welcome to irookee!');
      navigate(redirectTo, { replace: true });
      return;
    }

    const { error: signInError } = await signIn(email, password);
    setBusy(false);
    if (signInError) {
      setError(
        /invalid login credentials/i.test(signInError.message)
          ? 'That email and password combination is incorrect. If you just signed up, confirm your email first.'
          : signInError.message
      );
      return;
    }
    toast.success('Welcome back!');
    navigate(redirectTo, { replace: true });
  };

  // ---- confirmation / reset-sent state --------------------------------------
  if (sentTo) {
    return (
      <div className="text-center space-y-4 py-6">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {mode === 'forgot'
            ? 'If an account exists for '
            : 'We sent a confirmation link to '}
          <span className="font-medium text-foreground">{sentTo}</span>
          {mode === 'forgot'
            ? ', we have sent a password reset link. It expires in one hour.'
            : '. Click it to activate your account, then sign in.'}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            reset();
            onModeChange('signin');
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back to sign in
        </Button>
      </div>
    );
  }

  const heading =
    mode === 'signup' ? 'Create your account'
    : mode === 'forgot' ? 'Reset your password'
    : 'Welcome back';
  const subheading =
    mode === 'signup' ? 'Book verified experts and companions in minutes.'
    : mode === 'forgot' ? 'We will email you a link to set a new password.'
    : 'Sign in to manage your bookings and sessions.';

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">{heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subheading}</p>
      </div>

      {mode !== 'forgot' && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleOAuth}
            disabled={oauthBusy}
          >
            {oauthBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-950 px-2 text-muted-foreground">or</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === 'signup' && (
          <div>
            <Label htmlFor="auth-name">Full name</Label>
            <Input
              id="auth-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="mt-1"
              required
            />
          </div>
        )}

        <div>
          <Label htmlFor="auth-email">Email address</Label>
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1"
            required
          />
        </div>

        {mode !== 'forgot' && (
          <PasswordField
            id="auth-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            describedBy={mode === 'signup' ? 'password-hint' : undefined}
          />
        )}

        {mode === 'signup' && (
          <p id="password-hint" className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          {mode === 'signup' ? 'Create account' : mode === 'forgot' ? (
            <>
              <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
              Send reset link
            </>
          ) : 'Sign in'}
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm">
        {mode === 'signin' && (
          <>
            <button
              type="button"
              onClick={() => { reset(); onModeChange('forgot'); }}
              className="text-primary hover:underline"
            >
              Forgot your password?
            </button>
            <p className="text-muted-foreground">
              New to irookee?{' '}
              <button
                type="button"
                onClick={() => { reset(); onModeChange('signup'); }}
                className="font-medium text-primary hover:underline"
              >
                Create an account
              </button>
            </p>
          </>
        )}
        {mode === 'signup' && (
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { reset(); onModeChange('signin'); }}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => { reset(); onModeChange('signin'); }}
            className="text-primary hover:underline"
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthForms;
