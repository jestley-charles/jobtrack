/**
 * Supabase browser client — requires config.js and the Supabase CDN script.
 */
(function () {
  let client = null;

  function getConfig() {
    if (!window.JOBTRACK_CONFIG) {
      throw new Error(
        'Missing JOBTRACK_CONFIG. Copy js/config.example.js to js/config.js or run: npm run config'
      );
    }
    const { supabaseUrl, supabaseAnonKey } = window.JOBTRACK_CONFIG;
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('JOBTRACK_CONFIG must include supabaseUrl and supabaseAnonKey.');
    }
    if (supabaseUrl.includes('YOUR-PROJECT-REF') || supabaseAnonKey.includes('your-anon')) {
      throw new Error('Replace placeholder Supabase credentials in js/config.js.');
    }
    return window.JOBTRACK_CONFIG;
  }

  window.JobTrackSupabase = {
    getClient() {
      if (client) {
        return client;
      }
      if (!window.supabase) {
        throw new Error('Supabase JS library not loaded. Include the CDN script before supabase-client.js.');
      }
      const { supabaseUrl, supabaseAnonKey } = getConfig();
      client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
      return client;
    },
  };
})();
