import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isCurrentUserAdmin } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * Dedicated admin login screen rendered at /admin when there is no
 * authenticated admin session. Authentication is delegated to Supabase Auth
 * (no credentials are stored in the client); after a successful password sign
 * in we verify the account actually holds the admin role and sign out
 * otherwise. The parent <Admin> page re-renders into the dashboard once the
 * auth state updates.
 */
const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const admin = await isCurrentUserAdmin();
      if (!admin) {
        await supabase.auth.signOut();
        throw new Error("This account does not have administrator access.");
      }

      track("admin_login_success");
      toast({ title: "Welcome back", description: "Signed in to the admin console." });
      // AuthProvider's onAuthStateChange updates the session; <Admin> re-renders
      // into the dashboard once the admin status is confirmed.
    } catch (err) {
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Unable to sign in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 ring-1 ring-primary/30 flex items-center justify-center mb-4">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Console</h1>
          <p className="text-slate-400 mt-1">Authorized personnel only</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Use your administrator credentials</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
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
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                ) : (
                  <><Shield className="mr-2 h-4 w-4" /> Sign in to Admin</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
