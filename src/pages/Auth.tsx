import { useState } from "react";
import Footer from "@/components/sections/Footer";
import { Link, useSearchParams } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  
  // Set isSignUp default based on query params or fallback
  const [isSignUp, setIsSignUp] = useState(mode === "signup");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md flex flex-col items-center">
          <Link to="/" className="flex items-center space-x-2 mb-8">
            <img src="/irookee-mark.svg" alt="irookee" className="h-12 w-12 object-contain" />
            <span className="text-2xl font-bold text-gray-900">irookee</span>
          </Link>
          
          <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
            {isSignUp ? (
              <SignUp 
                routing="path" 
                path="/auth"
                signInUrl="/auth"
                fallbackRedirectUrl="/profile-setup"
              />
            ) : (
              <SignIn 
                routing="path" 
                path="/auth"
                signUpUrl="/auth"
                fallbackRedirectUrl="/dashboard"
              />
            )}
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button 
                    onClick={() => setIsSignUp(false)}
                    className="text-primary font-medium hover:underline focus:outline-none"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button 
                    onClick={() => setIsSignUp(true)}
                    className="text-primary font-medium hover:underline focus:outline-none"
                  >
                    Create one
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-primary">Terms</Link> and{" "}
            <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
