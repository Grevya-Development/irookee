import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isCurrentUserAdmin } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminLogin from "@/components/admin/AdminLogin";

/**
 * Dedicated /admin entry point. Renders its own login screen (separate from the
 * public /auth flow) and only shows the dashboard once Supabase confirms the
 * signed-in account holds the admin role via the is_admin() RPC or ADMIN_EMAILS allowlist.
 */
const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  // null = still checking, false = not an admin, true = admin
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const checkAdminStatus = useCallback(async () => {
    try {
      const ok = await isCurrentUserAdmin();
      setIsAdmin(ok);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (authLoading) return;
      try {
        const ok = await isCurrentUserAdmin();
        if (active) setIsAdmin(ok);
      } catch {
        if (active) setIsAdmin(false);
      }
    };

    check();

    // Listen to Supabase auth state changes immediately
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        if (session) {
          check();
        } else if (!user) {
          setIsAdmin(false);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [user, authLoading, checkAdminStatus]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin onLoginSuccess={checkAdminStatus} />;
  }

  return <AdminDashboard />;
};

export default Admin;
