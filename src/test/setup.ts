import "@testing-library/jest-dom/vitest";

// The Supabase client module throws at import time when these are absent, and
// jsdom tests import it transitively through most components.
if (!import.meta.env.VITE_SUPABASE_URL) {
  import.meta.env.VITE_SUPABASE_URL = "https://test.supabase.co";
}
if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  import.meta.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";
}
