import { createBrowserClient } from "@supabase/ssr";

const fallbackSupabaseUrl = "https://ktuxenbvfstziypycxap.supabase.co";
const fallbackSupabaseAnonKey = "sb_publishable_VnVUFySma4lg-N4vH_gYsQ_FzgnkNPc";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
