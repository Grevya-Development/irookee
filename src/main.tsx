import { ClerkProvider } from '@clerk/react';
import { shadcn } from '@clerk/ui/themes';
import { createRoot } from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import App from './App.tsx'
import './index.css'
import { initAnalytics, posthog } from './lib/analytics'

initAnalytics();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables");
}

createRoot(document.getElementById("root")!).render(
  <PostHogProvider client={posthog}>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/" appearance={{ theme: shadcn }}>
      <App />
    </ClerkProvider>
  </PostHogProvider>
);