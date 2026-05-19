import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase
    .from("branches")
    .select("*")
    .eq("email", "downtown@billing.app")
    .eq("password", "branch123")
    .maybeSingle();

  console.log(data, error);
}

check();
