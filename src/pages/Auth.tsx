import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSiteUrl } from "@/lib/siteUrl";
import { LogIn, UserPlus, ArrowLeft, Mail, Eye, EyeOff } from "lucide-react";

function getPasswordStrength(pw: string): { score: number; label: string; color: string; tips: string[] } {
  let score = 0
  const tips: string[] = []
  if (pw.length >= 6) score++; else tips.push('At least 6 characters')
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++; else tips.push('Add an uppercase letter')
  if (/[0-9]/.test(pw)) score++; else tips.push('Add a number')
  if (/[^A-Za-z0-9]/.test(pw)) score++; else tips.push('Add a special character (!@#$)')

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500', tips }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500', tips }
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500', tips }
  if (score <= 4) return { score, label: 'Strong', color: 'bg-green-500', tips }
  return { score, label: 'Very Strong', color: 'bg-green-600', tips }
}

function PasswordStrength({ password }: { password: string }) {
  const { score, label, color, tips } = getPasswordStrength(password)
  const labelColor = score <= 1 ? 'text-red-600' : score <= 2 ? 'text-orange-600' : score <= 3 ? 'text-yellow-600' : 'text-green-600'

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? color : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${labelColor}`}>{label}</span>
        {tips.length > 0 && (
          <span className="text-xs text-muted-foreground">{tips[0]}</span>
        )}
      </div>
    </div>
  )
}

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        // Enforce a minimum password strength on account creation.
        const { score } = getPasswordStrength(password);
        if (password.length < 8 || score < 3) {
          toast({
            title: "Choose a stronger password",
            description: "Use at least 8 characters with a mix of uppercase, numbers, and a symbol.",
            variant: "destructive",
          });
          return;
        }
      }
      setLoading(true);
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: getSiteUrl() },
        });
        if (error) throw error;
        toast({ title: "Account Created!", description: "Check your email to verify, then log in." });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You're now signed in." });
        navigate(redirect);
      }
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : 'Something went wrong', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Enter your email", description: "Please enter your email address first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getSiteUrl()}/auth`,
      });
      if (error) throw error;
      setResetSent(true);
      toast({ title: "Reset link sent!", description: "Check your email for a password reset link." });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : 'Failed to send reset email', variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${getSiteUrl()}${redirect}` },
      });
      if (error) throw error;
      // On success the browser redirects to the provider; nothing else to do here.
    } catch (error) {
      toast({
        title: "Sign-in failed",
        description: error instanceof Error ? error.message : `Could not sign in with ${provider}.`,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Minimal top bar */}
      <div className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to irookee
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src="/irookee-mark.svg" alt="irookee" className="h-11 w-11 object-contain" />
              <span className="text-3xl font-bold">irookee</span>
            </Link>
            <p className="text-muted-foreground mt-2">People for People</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">
                {isForgotPassword ? "Reset your password" : isSignUp ? "Create your account" : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isForgotPassword
                  ? "Enter your email and we'll send a reset link"
                  : isSignUp
                  ? "Join the community and connect with experts"
                  : "Sign in to access your dashboard"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {isForgotPassword ? (
                resetSent ? (
                  <div className="text-center py-4 space-y-4">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We've sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link to reset your password.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => { setIsForgotPassword(false); setResetSent(false); }}>
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email" type="email" placeholder="you@example.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        required className="mt-1"
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => setIsForgotPassword(false)}>
                      Back to Sign In
                    </Button>
                  </form>
                )
              ) : (
                <>
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email" type="email" placeholder="you@example.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        required className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="password" type={showPassword ? "text" : "password"}
                          placeholder={isSignUp ? "Min. 8 characters" : "Your password"}
                          value={password} onChange={(e) => setPassword(e.target.value)}
                          required minLength={isSignUp ? 8 : 6} className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {isSignUp && password.length > 0 && <PasswordStrength password={password} />}
                    </div>
                    {!isSignUp && (
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? "Processing..." : isSignUp ? (
                        <><UserPlus className="mr-2 h-4 w-4" /> Create Account</>
                      ) : (
                        <><LogIn className="mr-2 h-4 w-4" /> Sign In</>
                      )}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">or</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={() => handleOAuth('google')}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
                      </svg>
                      Continue with Google
                    </Button>
                    <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={() => handleOAuth('apple')}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M16.37 1.43c.06.86-.27 1.7-.83 2.32-.58.65-1.53 1.15-2.46 1.08-.08-.83.3-1.7.84-2.27.6-.65 1.62-1.12 2.45-1.13zM19.6 17.2c-.5 1.16-.74 1.67-1.39 2.7-.9 1.42-2.18 3.19-3.76 3.2-1.4.02-1.76-.91-3.67-.9-1.9.01-2.3.92-3.7.9-1.58-.01-2.79-1.6-3.7-3.02C.97 16.16.71 11.5 2.3 9.02c1.13-1.78 2.92-2.82 4.6-2.82 1.7 0 2.78.93 4.18.93 1.36 0 2.19-.94 4.16-.94 1.5 0 3.08.81 4.21 2.22-3.7 2.02-3.1 7.3.05 8.79z"/>
                      </svg>
                      Continue with Apple
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/')}>
                      Continue as Guest
                    </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    {isSignUp ? (
                      <>Already have an account?{' '}
                        <button onClick={() => { setIsSignUp(false); setEmail(''); setPassword(''); }}
                          className="text-primary font-medium hover:underline">Sign in</button>
                      </>
                    ) : (
                      <>Don't have an account?{' '}
                        <button onClick={() => { setIsSignUp(true); setEmail(''); setPassword(''); }}
                          className="text-primary font-medium hover:underline">Create one</button>
                      </>
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="underline">Terms</Link> and{' '}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
