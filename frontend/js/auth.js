/**
 * Supabase Auth helpers — sign up, log in, log out, session guards.
 */
(function () {
  var handlingSessionExpired = false;

  function getClient() {
    return window.JobTrackSupabase.getClient();
  }

  function getCurrentPageName() {
    var path = window.location.pathname.split('/').pop() || '';
    return path || 'index.html';
  }

  function isLoginPage() {
    var page = getCurrentPageName();
    return page === 'login' || page === 'login.html';
  }

  function formatAuthError(error) {
    if (!error) {
      return 'Something went wrong. Please try again.';
    }
    if (error.message === 'Invalid login credentials') {
      return 'Invalid email or password.';
    }
    return error.message;
  }

  function clearDataCache() {
    try {
      sessionStorage.removeItem('jobtrack.dataCache.v1');
      sessionStorage.removeItem('jobtrack.interviewBriefing.pending');
    } catch (err) {
      // ignore
    }
    if (window.JobTrackDataCache && typeof window.JobTrackDataCache.invalidate === 'function') {
      window.JobTrackDataCache.invalidate();
    }
  }

  async function clearLocalSession() {
    try {
      await getClient().auth.signOut({ scope: 'local' });
    } catch (err) {
      // Session may already be invalid; still clear storage below.
    }
    Object.keys(localStorage).forEach(function (key) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    });
    clearDataCache();
  }

  async function getSession() {
    const { data, error } = await getClient().auth.getSession();
    if (error) {
      throw error;
    }
    return data.session;
  }

  async function getAccessToken() {
    const session = await getSession();
    return session ? session.access_token : null;
  }

  async function hasValidUser() {
    const { data, error } = await getClient().auth.getUser();
    return Boolean(data.user) && !error;
  }

  async function signUp(email, password) {
    const { data, error } = await getClient().auth.signUp({ email, password });
    if (error) {
      throw new Error(formatAuthError(error));
    }
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(formatAuthError(error));
    }
    return data;
  }

  async function signOut() {
    const { error } = await getClient().auth.signOut();
    clearDataCache();
    if (error) {
      throw new Error(formatAuthError(error));
    }
  }

  /**
   * Redirect to login if there is no active session.
   * Uses getUser() so stale cached sessions are not treated as logged in.
   * @param {string} [redirectTo] — page to return to after login
   */
  async function requireAuth(redirectTo) {
    const valid = await hasValidUser();
    if (!valid) {
      await clearLocalSession();
      const next = redirectTo || getCurrentPageName() || 'dashboard.html';
      window.location.replace('login.html?redirect=' + encodeURIComponent(next));
      return null;
    }
    return getSession();
  }

  /**
   * Redirect authenticated users away from public auth pages.
   * Never auto-redirect when ?expired=1 — that flag means we were sent here
   * after clearing a stale session and must let the user log in again.
   */
  async function redirectIfAuthenticated(destination) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === '1') {
      await clearLocalSession();
      return false;
    }

    const valid = await hasValidUser();
    if (valid) {
      window.location.replace(destination || 'dashboard.html');
      return true;
    }

    await clearLocalSession();
    return false;
  }

  /**
   * Clear stale local auth state and redirect to login (e.g. after API 401).
   */
  async function handleSessionExpired(redirectTo) {
    if (handlingSessionExpired || isLoginPage()) {
      return;
    }
    handlingSessionExpired = true;
    await clearLocalSession();
    const next = redirectTo || getCurrentPageName() || 'dashboard.html';
    window.location.replace(
      'login.html?redirect=' + encodeURIComponent(next) + '&expired=1'
    );
  }

  window.JobTrackAuth = {
    signUp,
    signIn,
    signOut,
    getSession,
    getAccessToken,
    hasValidUser,
    clearLocalSession,
    requireAuth,
    redirectIfAuthenticated,
    handleSessionExpired,
    formatAuthError,
  };
})();
