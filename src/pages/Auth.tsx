import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/sections/Footer';
import { AuthForms } from '@/components/auth/AuthForms';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none"></div>

      <Navigation />

      <main className="flex-1 flex items-center justify-center px-4 py-16 relative z-10">
        <AuthForms initialMode={mode} />
      </main>

      <Footer />
    </div>
  );
};

export default AuthPage;
