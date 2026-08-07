import "@testing-library/jest-dom/vitest";

// The Supabase client module throws at import time when these are absent, and
// jsdom tests import it transitively through most components. ImportMetaEnv
// declares its keys readonly, so write through a mutable view.
const env = import.meta.env as unknown as Record<string, string>;
if (!env.VITE_SUPABASE_URL) {
  env.VITE_SUPABASE_URL = "https://test.supabase.co";
}
if (!env.VITE_SUPABASE_ANON_KEY) {
  env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
}
