/**
 * Supabase Auth helpers — sign up, log in, log out, session guards.
 */
(function () {
  function getClient() {
    return window.JobTrackSupabase.getClient();
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
    if (error) {
      throw new Error(formatAuthError(error));
    }
  }

  /**
   * Redirect to login if there is no active session.
   * @param {string} [redirectTo] — page to return to after login
   */
  async function requireAuth(redirectTo) {
    const session = await getSession();
    if (!session) {
      const next = redirectTo || window.location.pathname.split('/').pop() || 'dashboard.html';
      window.location.href = `login.html?redirect=${encodeURIComponent(next)}`;
      return null;
    }
    return session;
  }

  /**
   * Redirect authenticated users away from public auth pages.
   */
  async function redirectIfAuthenticated(destination) {
    const session = await getSession();
    if (session) {
      window.location.href = destination || 'dashboard.html';
      return true;
    }
    return false;
  }

  /**
   * Clear stale local auth state and redirect to login (e.g. after API 401).
   * Uses local sign-out so an expired token does not leave a cached session
   * that would bounce the user back to a protected page.
   */
  async function handleSessionExpired(redirectTo) {
    try {
      await getClient().auth.signOut({ scope: 'local' });
    } catch (err) {
      // Session may already be invalid; still redirect.
    }
    const next = redirectTo || window.location.pathname.split('/').pop() || 'dashboard.html';
    window.location.href =
      'login.html?redirect=' + encodeURIComponent(next) + '&expired=1';
  }

  window.JobTrackAuth = {
    signUp,
    signIn,
    signOut,
    getSession,
    getAccessToken,
    requireAuth,
    redirectIfAuthenticated,
    handleSessionExpired,
    formatAuthError,
  };
})();
