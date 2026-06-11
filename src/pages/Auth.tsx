import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, LogIn, UserPlus, Users } from "lucide-react";
import { getAuthErrorMessage, isRateLimitError } from "@/lib/authMessages";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupBlockedUntil, setSignupBlockedUntil] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (isSignUp) {
        if (signupBlockedUntil && Date.now() < signupBlockedUntil) {
          toast({
            title: "Please wait",
            description: "Please wait a few minutes before requesting another signup email.",
            variant: "destructive",
          });
          return;
        }

        // Handle Sign Up
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) throw signUpError;

        toast({
          title: "Success!",
          description: "Please check your email to verify your account.",
        });
      } else {
        // Handle Login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;

        toast({
          title: "Success!",
          description: "You have successfully logged in.",
        });
        navigate("/");
      }
    } catch (error) {
      if (isSignUp && isRateLimitError(error)) {
        setSignupBlockedUntil(Date.now() + 3 * 60 * 1000);
      }

      toast({
        title: "Error",
        description: getAuthErrorMessage(error, isSignUp ? "signup" : "login"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    toast({
      title: "Welcome Guest!",
      description: "You are now browsing as a guest.",
    });
    navigate("/");
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    // Clear form when switching modes
    setEmail("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-700 to-indigo-800">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          Welcome to irookee
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full text-gray-600"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {isSignUp ? (
              <UserPlus className="mr-2 h-4 w-4" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {loading
              ? "Processing..."
              : isSignUp
              ? "Sign Up"
              : "Login"}
          </Button>
        </form>
        
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full mb-4"
            onClick={handleGuestLogin}
          >
            <Users className="mr-2 h-4 w-4" />
            Continue as Guest
          </Button>
          
          <Button
            variant="ghost"
            className="w-full"
            onClick={toggleAuthMode}
          >
            {isSignUp
              ? "Already have an account? Login"
              : "Don't have an account? Sign Up"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
