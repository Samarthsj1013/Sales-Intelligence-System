import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token) throw new Error("Token required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Look up the share
    const { data: share, error: shareErr } = await supabase
      .from("shared_dashboards")
      .select("*")
      .eq("share_token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (shareErr || !share) {
      return new Response(JSON.stringify({ error: "Invalid or inactive share link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Share link has expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch data using service role (bypasses RLS)
    const { data: records, error: recErr } = await supabase
      .from("sales_data")
      .select("*")
      .eq("user_id", share.user_id)
      .eq("dataset_name", share.dataset_name)
      .order("date_of_sale", { ascending: true });

    if (recErr) throw recErr;

    return new Response(JSON.stringify({
      dataset_name: share.dataset_name,
      records: records || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
