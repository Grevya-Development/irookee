import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { isCurrentUserAdmin } from "@/lib/auth";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminLogin from "@/components/admin/AdminLogin";

/**
 * Dedicated /admin entry point. Renders its own login screen (separate from the
 * public /auth flow) and only shows the dashboard once Supabase confirms the
 * signed-in account holds the admin role via the is_admin() RPC.
 */
const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  // null = still checking, false = not an admin, true = admin
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const checkAdmin = async () => {
      if (authLoading) return;
      if (!user) {
        if (active) setIsAdmin(false);
        return;
      }
      setIsAdmin(null);
      try {
        const ok = await isCurrentUserAdmin();
        if (active) setIsAdmin(ok);
      } catch {
        if (active) setIsAdmin(false);
      }
    };
    checkAdmin();
    return () => {
      active = false;
    };
  }, [user, authLoading]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
};

export default Admin;
