import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';

interface ExpertProtectedRouteProps {
  children: React.ReactNode;
}

export const ExpertProtectedRoute = ({ children }: ExpertProtectedRouteProps) => {
  const { user, loading: authLoading, profile } = useAuth();
  const [status, setStatus] = useState<'checking' | 'authorized' | 'not_expert' | 'unauthenticated'>('checking');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const checkExpertAccess = async () => {
      if (authLoading) return;

      if (!user) {
        if (active) setStatus('unauthenticated');
        navigate('/auth?redirect=/expert/dashboard', { replace: true });
        return;
      }

      try {
        // Authoritative database check: verify speaker profile or user_type
        const { data: speaker, error } = await supabase
          .from('speakers')
          .select('id, verification_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!active) return;

        if (error) {
          console.error('Error verifying expert status:', error);
        }

        const isUserTypeExpert = profile?.user_type === 'expert';
        const hasSpeakerProfile = Boolean(speaker);

        if (hasSpeakerProfile || isUserTypeExpert) {
          setStatus('authorized');
        } else {
          setStatus('not_expert');
        }
      } catch (err) {
        console.error('Expert route check failed:', err);
        if (active) setStatus('not_expert');
      }
    };

    checkExpertAccess();

    return () => {
      active = false;
    };
  }, [user, authLoading, profile?.user_type, navigate]);

  if (authLoading || status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (status === 'not_expert') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="text-center p-8 bg-card border rounded-2xl max-w-md shadow-sm space-y-4">
          <ShieldAlert className="h-14 w-14 text-primary mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Expert Portal Access</h2>
          <p className="text-sm text-muted-foreground">
            You are logged in with a consumer account. To access the Expert Dashboard and offer sessions, please complete expert onboarding.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <Button onClick={() => navigate('/expert/onboarding')} className="font-semibold">
              Become an Expert
            </Button>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              User Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ExpertProtectedRoute;
