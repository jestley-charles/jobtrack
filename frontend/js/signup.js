(function () {
  const form = document.getElementById('signup-form');
  const errorEl = document.getElementById('form-error');
  const successEl = document.getElementById('form-success');
  const submitBtn = document.getElementById('submit-btn');

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
    if (message) {
      successEl.hidden = true;
    }
  }

  function showSuccess(message) {
    successEl.textContent = message;
    successEl.hidden = !message;
    if (message) {
      errorEl.hidden = true;
    }
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Creating account…' : 'Sign up';
  }

  JobTrackAuth.redirectIfAuthenticated('dashboard.html').then(function (redirected) {
    if (redirected) {
      return;
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      showError('');
      showSuccess('');

      const email = form.email.value.trim();
      const password = form.password.value;

      if (!email || !password) {
        showError('Email and password are required.');
        return;
      }

      if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
      }

      setLoading(true);
      try {
        const data = await JobTrackAuth.signUp(email, password);

        if (data.session) {
          if (window.JobTrackInterviewBriefing) {
            JobTrackInterviewBriefing.markPending();
          }
          window.location.href = 'dashboard.html';
          return;
        }

        showSuccess(
          'Account created. Check your email to confirm your address, then log in.'
        );
        form.reset();
      } catch (err) {
        showError(err.message);
      } finally {
        setLoading(false);
      }
    });
  });
})();
