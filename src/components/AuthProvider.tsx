import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { identifyUser, resetAnalytics } from '@/lib/analytics';
import { setGaUser } from '@/lib/googleAnalytics';
import { getSiteUrl } from '@/lib/siteUrl';

/**
 * Authentication on native Supabase Auth.
 *
 * This replaces the previous Clerk integration, which signed users into Supabase
 * behind the scenes using a password derived from their Clerk user id
 * (`ClerkSupabase_${clerkId}_...`). That derivation shipped in the client bundle,
 * so anyone who knew a user's email and Clerk id could mint a full Supabase
 * session for them. There is now a single identity provider and no shared
 * secret: Supabase owns the session and this component only observes it.
 */

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  user_type: string | null;
  created_at: string;
  updated_at: string;
};

export interface AuthResult {
  error: Error | null;
  /** True when the email needs confirming before the session becomes usable. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /** Emails a reset link that lands on /auth/reset-password. */
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  /** Sets a new password for the session created by the reset link. */
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toError = (value: unknown, fallback: string): Error =>
  value instanceof Error ? value : new Error(fallback);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  /** Avoids re-fetching the profile for a user we already loaded. */
  const loadedProfileFor = useRef<string | null>(null);

  const loadProfile = useCallback(async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as unknown as Profile);
        return;
      }

      // The handle_new_user() trigger normally creates this row. Fall back to an
      // upsert so a missing profile never blocks the app.
      const fallbackName =
        (currentUser.user_metadata?.full_name as string | undefined) ||
        currentUser.email?.split('@')[0] ||
        'User';

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .upsert({
          id: currentUser.id,
          email: currentUser.email,
          full_name: fallbackName,
          user_type: 'consumer',
          updated_at: new Date().toISOString(),
        } as never)
        .select('*')
        .maybeSingle();

      if (createError) throw createError;
      setProfile((created as unknown as Profile) ?? null);
    } catch (err) {
      // A profile failure must not lock the user out of the app.
      console.error('Could not load profile:', err);
      setProfile(null);
    }
  }, []);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setProfile(null);
      loadedProfileFor.current = null;
      resetAnalytics();
      setGaUser(null);
      return;
    }

    const nextUser = nextSession.user;
    identifyUser(nextUser.id, { email: nextUser.email });
    setGaUser(nextUser.id);

    if (loadedProfileFor.current !== nextUser.id) {
      loadedProfileFor.current = nextUser.id;
      // Deferred: calling back into supabase-js from inside onAuthStateChange
      // can deadlock its internal lock, so never await it in that callback.
      void loadProfile(nextUser);
    }
  }, [loadProfile]);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: existing } }) => {
        if (!active) return;
        applySession(existing);
      })
      .catch((err) => {
        console.error('Could not read the existing session:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      applySession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [applySession]);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string): Promise<AuthResult> => {
      try {
        const response = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${getSiteUrl()}/auth`,
            data: fullName ? { full_name: fullName.trim() } : undefined,
          },
        });

        if (response.error) throw response.error;

        // Supabase returns a user with an empty `identities` array when the email
        // already exists, rather than an error. Without this check the UI would
        // report a successful signup for an address that is already taken.
        const identities = response.data.user?.identities;
        if (Array.isArray(identities) && identities.length === 0) {
          return {
            error: new Error('An account already exists for this email. Please sign in instead.'),
          };
        }

        return {
          error: null,
          needsEmailConfirmation: !response.data.session,
        };
      } catch (err) {
        return { error: toError(err, 'Could not create your account.') };
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: toError(err, 'Could not sign you in.') };
    }
  }, []);

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'apple'): Promise<AuthResult> => {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: `${getSiteUrl()}/auth` },
        });
        if (error) throw error;
        return { error: null };
      } catch (err) {
        return { error: toError(err, `Could not sign in with ${provider}.`) };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out failed:', error);
    // onAuthStateChange clears state; do it here too so the UI updates even if
    // the network call fails.
    setSession(null);
    setUser(null);
    setProfile(null);
    loadedProfileFor.current = null;
    resetAnalytics();
    setGaUser(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${getSiteUrl()}/auth/reset-password`,
      });
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: toError(err, 'Could not send the reset email.') };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: toError(err, 'Could not update your password.') };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        requestPasswordReset,
        updatePassword,
        refreshProfile,
      }}
    >
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
