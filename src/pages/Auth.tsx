import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, UserPlus, ArrowLeft, MessageCircle, Mail } from "lucide-react";

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
      setLoading(true);
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin },
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
        redirectTo: `${window.location.origin}/auth`,
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
              <MessageCircle className="h-10 w-10 text-primary" />
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
                      <Input
                        id="password" type="password" placeholder="Min. 6 characters"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        required minLength={6} className="mt-1"
                      />
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

                  <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                    Continue as Guest
                  </Button>

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
