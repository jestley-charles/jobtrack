(function () {
  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');

  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get('redirect') || 'dashboard.html';

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
