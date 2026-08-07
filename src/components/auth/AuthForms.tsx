import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, ArrowLeft, CheckCircle2, User, Lock, Sparkles, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';
import { validateEmailInput } from '@/lib/emailValidation';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type Mode = 'signin' | 'signup' | 'forgot';

interface AuthFormsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  /** Where to land after a successful sign in. */
  redirectTo: string;
}

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

const PasswordField = ({
  id,
  value,
  onChange,
  label,
  autoComplete,
  describedBy,
  showStrength = false,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoComplete: string;
  describedBy?: string;
  showStrength?: boolean;
}) => {
  const [visible, setVisible] = useState(false);
  const strength = getPasswordStrength(value);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          className="pr-10 h-11 rounded-xl text-sm transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      {showStrength && value && (
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
  const [signupStep, setSignupStep] = useState<1 | 2>(1);

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
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
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
      setSentTo(email.trim());
      return;
    }

    if (mode === 'signup' && signupStep === 1) {
      if (!fullName.trim()) {
        setError("Please provide your full name to continue.");
        return;
      }
      setSignupStep(2);
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

  if (sentTo) {
    return (
      <div className="text-center space-y-5 py-6">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/20">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {mode === 'forgot'
            ? 'If an account exists for '
            : 'We sent a confirmation link to '}
          <strong className="text-foreground font-semibold">{sentTo}</strong>
          {mode === 'forgot'
            ? ', we have sent a password reset link. It expires in one hour.'
            : '. Click it to activate your account, then sign in.'}
        </p>
        <Button
          variant="outline"
          className="rounded-xl font-semibold mt-2"
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
    mode === 'signup' ? 'Join thousands connecting directly with top industry leaders.'
    : mode === 'forgot' ? 'We will email you a secure password recovery link.'
    : 'Sign in to manage your sessions, bookings, and direct calls.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-foreground">{heading}</h2>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">{subheading}</p>
      </div>

      {/* Visual Multi-Step Stepper Header for Signup */}
      {mode === 'signup' && (
        <div className="flex items-center justify-center gap-2 py-1">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${signupStep === 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <User className="h-3 w-3" /> Step 1: Profile
          </div>
          <div className="h-0.5 w-6 bg-slate-200 dark:bg-slate-800" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${signupStep === 2 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <Lock className="h-3 w-3" /> Step 2: Password
          </div>
        </div>
      )}

      {/* OAuth Google Button */}
      {mode !== 'forgot' && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700"
            onClick={handleOAuth}
            disabled={oauthBusy}
          >
            {oauthBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-indigo-500" aria-hidden="true" />
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
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="bg-white dark:bg-slate-950 px-3 text-slate-400">or continue with email</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AnimatePresence mode="wait">
          {mode === 'signup' && signupStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="auth-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full name</Label>
                <Input
                  id="auth-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  placeholder="e.g. Sarah Jenkins"
                  className="h-11 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email address</Label>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="h-11 rounded-xl text-sm"
                  required
                />
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full font-bold h-11 rounded-xl shadow-md">
                Next: Set Password
              </Button>
            </motion.div>
          )}

          {(mode !== 'signup' || signupStep === 2) && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="space-y-4"
            >
              {mode !== 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="auth-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email address</Label>
                  <Input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="name@company.com"
                    className="h-11 rounded-xl text-sm"
                    required
                  />
                </div>
              )}

              {mode !== 'forgot' && (
                <PasswordField
                  id="auth-password"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  describedBy={mode === 'signup' ? 'password-hint' : undefined}
                  showStrength={mode === 'signup'}
                />
              )}

              {mode === 'signup' && (
                <div className="flex items-center justify-end text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    ← Back to Step 1
                  </button>
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full font-bold h-11 rounded-xl shadow-md" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                    Send Reset Link
                  </>
                ) : 'Sign In'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Navigation Footer Links */}
      <div className="space-y-2 text-center text-xs pt-1">
        {mode === 'signin' && (
          <>
            <button
              type="button"
              onClick={() => { reset(); onModeChange('forgot'); }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium block mx-auto"
            >
              Forgot your password?
            </button>
            <p className="text-slate-500 dark:text-slate-400">
              New to irookee?{' '}
              <button
                type="button"
                onClick={() => { reset(); setSignupStep(1); onModeChange('signup'); }}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Create an account
              </button>
            </p>
          </>
        )}
        {mode === 'signup' && (
          <p className="text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => { reset(); onModeChange('signin'); }}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Sign in
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => { reset(); onModeChange('signin'); }}
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthForms;
