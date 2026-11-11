(function () {
  const url = window.ALOKIT_SUPABASE_URL;
  const key = window.ALOKIT_SUPABASE_PUBLISHABLE_KEY;
  if (!window.supabase || !url || !key ||
      url.includes("PASTE_") || key.includes("PASTE_")) {
    window.alokitSupabaseReady = false;
    return;
  }
  window.alokitSupabase = window.supabase.createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.alokitSupabaseReady = true;
})();