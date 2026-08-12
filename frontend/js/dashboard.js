(function () {
  const userEmailEl = document.getElementById('user-email');
  const logoutBtn = document.getElementById('logout-btn');

  JobTrackAuth.requireAuth('dashboard.html').then(function (session) {
    if (!session) {
      return;
    }

    userEmailEl.textContent = session.user.email;

    logoutBtn.addEventListener('click', async function () {
      logoutBtn.disabled = true;
      try {
        await JobTrackAuth.signOut();
        window.location.href = 'login.html';
      } catch (err) {
        logoutBtn.disabled = false;
        alert(err.message);
      }
    });
  });
})();
