import { createRoot } from 'react-dom/client'
import { PostHogProvider } from 'posthog-js/react'
import App from './App.tsx'
import './index.css'
import { initAnalytics, posthog } from './lib/analytics'

initAnalytics();

createRoot(document.getElementById("root")!).render(
  <PostHogProvider client={posthog}>
    <App />
  </PostHogProvider>
);
