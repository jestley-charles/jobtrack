/**
 * Shared authenticated app shell — auth guard, sidebar nav, user menu, logout.
 */
(function () {
  function getInitials(email) {
    if (!email) {
      return '?';
    }
    const local = email.split('@')[0] || '';
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase() || '?';
  }

  function setActiveNav(pageId) {
    document.querySelectorAll('.app-nav-link').forEach(function (link) {
      const isActive = link.dataset.nav === pageId;
      link.classList.toggle('app-nav-link--active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function wireUserMenu(userEmailEl, logoutBtn, menuBtn, menuPanel, initialsEl, email) {
    initialsEl.textContent = getInitials(email);
    userEmailEl.textContent = email;

    function closeMenu() {
      menuPanel.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
    }

    function toggleMenu() {
      const open = menuPanel.hidden;
      menuPanel.hidden = !open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    menuBtn.addEventListener('click', function (event) {
      event.stopPropagation();
      toggleMenu();
    });

    document.addEventListener('click', function () {
      if (!menuPanel.hidden) {
        closeMenu();
      }
    });

    menuPanel.addEventListener('click', function (event) {
      event.stopPropagation();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !menuPanel.hidden) {
        closeMenu();
        menuBtn.focus();
      }
    });

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
  }

  /**
   * @param {{ page: string }} options — `page` matches `data-nav` on sidebar links
   */
  async function init(options) {
    const pageId = options && options.page;
    const userEmailEl = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');
    const menuBtn = document.getElementById('user-menu-btn');
    const menuPanel = document.getElementById('user-menu');
    const initialsEl = document.getElementById('user-initials');

    const session = await JobTrackAuth.requireAuth(JobTrackAuth.getReturnPath());
    if (!session) {
      return null;
    }

    if (pageId) {
      setActiveNav(pageId);
    }

    wireUserMenu(userEmailEl, logoutBtn, menuBtn, menuPanel, initialsEl, session.user.email);

    if (window.JobTrackInterviewBriefing) {
      JobTrackInterviewBriefing.maybeShow();
    }

    return session;
  }

  window.JobTrackAppShell = {
    init,
  };
})();
