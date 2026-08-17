import { createClient } from "@supabase/supabase-js";

// These come from the bitsy-bridge-control Supabase project:
// Project Settings -> API -> Project URL / anon public key.
// Never put the service_role key here — this file ships to the browser.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — admin login will not work until these are set (see .env.example)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
