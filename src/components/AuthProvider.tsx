import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useUser, useClerk } from '@clerk/react';
import { supabase } from '@/integrations/supabase/client';
import { identifyUser, resetAnalytics } from '@/lib/analytics';

type Profile = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
  user_type: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getSupabasePassword = (clerkId: string) => {
  return `ClerkSupabase_${clerkId}_SecretSecurePassword!2026`;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [syncLoading, setSyncLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !clerkUser) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setSyncLoading(false);
      supabase.auth.signOut();
      resetAnalytics();
      return;
    }

    const syncWithSupabase = async () => {
      const email = clerkUser.primaryEmailAddress?.emailAddress;
      const isInitialSync = !user || (email && user.email !== email);
      if (isInitialSync) {
        setSyncLoading(true);
      }
      if (!email) {
        setSyncLoading(false);
        return;
      }

      const password = getSupabasePassword(clerkUser.id);

      // Attempt to sign in to Supabase using the deterministic credentials
      const signInRes = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      let data = signInRes.data;
      const signInError = signInRes.error;

      if (signInError) {
        // If the user does not exist in Supabase auth, sign them up
        if (signInError.message.toLowerCase().includes("invalid login credentials") || 
            signInError.message.toLowerCase().includes("user not found")) {
          const signUpRes = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                first_name: clerkUser.firstName || '',
                last_name: clerkUser.lastName || '',
              }
            }
          });

          if (signUpRes.error) {
            console.error("Supabase bridge sign up error:", signUpRes.error);
          } else {
            data = signUpRes.data;
          }
        } else {
          console.error("Supabase bridge sign in error:", signInError);
        }
      }

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);
        identifyUser(data.user.id, { email: data.user.email });

        // Load or create profile in profiles table
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profileError) {
            throw profileError;
          }

          if (!profileData) {
            const fullName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || data.user.email?.split('@')[0] || 'User';
            const { data: newProfile } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                email: data.user.email,
                full_name: fullName,
                user_type: 'consumer',
                updated_at: new Date().toISOString(),
              } as never)
              .select('*')
              .maybeSingle();
            
            setProfile((newProfile as unknown as Profile) || null);
          } else {
            setProfile(profileData || null);
          }
        } catch (err) {
          console.error("Error loading/creating Supabase profile:", err);
        }
      }

      setSyncLoading(false);
    };

    syncWithSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, clerkUser]);

  // Keep compatibility with any direct calls
  const signUp = async (email: string, password: string) => {
    return { error: new Error("Direct sign up is disabled. Use Clerk components.") };
  };

  const signIn = async (email: string, password: string) => {
    return { error: new Error("Direct sign in is disabled. Use Clerk components.") };
  };

  const signOut = async () => {
    await clerkSignOut();
    await supabase.auth.signOut();
    resetAnalytics();
  };

  const loading = !isLoaded || syncLoading;

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      signUp,
      signIn,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
