(function () {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');

  const params = new URLSearchParams(window.location.search);
  const ALLOWED_REDIRECT_PAGES = {
    'dashboard.html': true,
    'jobs.html': true,
    'interviews.html': true,
    'offers.html': true,
    'rejected.html': true,
    'settings.html': true,
    'application.html': true,
  };

  function sanitizeRedirect(value) {
    if (!value) {
      return 'dashboard.html';
    }

    var decoded;
    try {
      decoded = decodeURIComponent(value);
    } catch (err) {
      return 'dashboard.html';
    }

    // Relative app page only — blocks javascript:, data:, //, absolute URLs, path traversal.
    if (!/^[A-Za-z0-9._-]+\.html(?:\?[A-Za-z0-9._~%=&-]+)?$/.test(decoded)) {
      return 'dashboard.html';
    }

    var page = decoded.split('?')[0];
    if (!ALLOWED_REDIRECT_PAGES[page]) {
      return 'dashboard.html';
    }

    if (page === 'application.html') {
      var id = new URLSearchParams(decoded.split('?')[1] || '').get('id');
      if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
        return 'jobs.html';
      }
      return 'application.html?id=' + encodeURIComponent(id);
    }

    return page;
  }

  const redirectTo = sanitizeRedirect(params.get('redirect'));
  const sessionExpired = params.get('expired') === '1';

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Logging in…' : 'Log in';
  }

  async function init() {
    if (sessionExpired) {
      await JobTrackAuth.clearLocalSession();
    }

    const redirected = await JobTrackAuth.redirectIfAuthenticated(redirectTo);
    if (redirected) {
      return;
    }

    if (sessionExpired) {
      params.delete('expired');
      const qs = params.toString();
      history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
      showError('Your session expired. Please log in again.');
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      showError('');

      const email = form.email.value.trim();
      const password = form.password.value;

      if (!email || !password) {
        showError('Email and password are required.');
        return;
      }

      setLoading(true);
      try {
        await JobTrackAuth.signIn(email, password);
        if (window.JobTrackInterviewBriefing) {
          JobTrackInterviewBriefing.markPending();
        }
        window.location.replace(redirectTo);
      } catch (err) {
        showError(err.message);
      } finally {
        setLoading(false);
      }
    });
  }

  init();
})();
