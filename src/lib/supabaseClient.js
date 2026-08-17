import { createClient } from "@supabase/supabase-js";

// These come from the bitsy-bridge-control Supabase project:
// Project Settings -> API -> Project URL / anon public key.
// Never put the service_role key here — this file ships to the browser.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — admin login will not work until these are set (see .env.example)."
  );
}

// createClient throws immediately on an empty/invalid URL, which would crash
// the whole app before React ever renders. Guard it so a missing config shows
// a real message in the UI instead of a blank white screen.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
