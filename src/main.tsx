import { ClerkProvider } from '@clerk/react';
import { shadcn } from '@clerk/ui/themes';
import { createRoot } from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import App from './App.tsx'
import './index.css'
import { initAnalytics, posthog } from './lib/analytics'
import { initGoogleAnalytics } from './lib/googleAnalytics'

initAnalytics();
initGoogleAnalytics();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
}

createRoot(document.getElementById("root")!).render(
  <PostHogProvider client={posthog}>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      // This app serves both flows from /auth. Without these, Clerk falls back to
      // its defaults (/sign-in, /sign-up), which are not routes here and render 404.
      signInUrl="/auth"
      signUpUrl="/auth?mode=signup"
      appearance={{ theme: shadcn }}
    >
      <App />
    </ClerkProvider>
  </PostHogProvider>
);