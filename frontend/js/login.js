(function () {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');

  const params = new URLSearchParams(window.location.search);
  function sanitizeRedirect(value) {
    if (!value || value.includes('://') || value.startsWith('//') || value.includes('..')) {
      return 'dashboard.html';
    }
    return value;
  }

  const redirectTo = sanitizeRedirect(params.get('redirect'));

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Logging in…' : 'Log in';
  }

  JobTrackAuth.redirectIfAuthenticated(redirectTo).then(function (redirected) {
    if (redirected) {
      return;
    }

    if (params.get('expired') === '1') {
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
        window.location.href = redirectTo;
      } catch (err) {
        showError(err.message);
      } finally {
        setLoading(false);
      }
    });
  });
})();
