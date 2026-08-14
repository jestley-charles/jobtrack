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

  function paintCachedUser(initialsEl, userEmailEl) {
    if (!initialsEl || !userEmailEl || !window.JobTrackAuth) {
      return;
    }
    const cached = JobTrackAuth.readCachedUserDisplay();
    if (!cached || !cached.email) {
      return;
    }
    initialsEl.textContent = getInitials(cached.email);
    userEmailEl.textContent = cached.email;
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

  function scrollActiveNavIntoView(pageId) {
    if (!pageId) {
      return;
    }
    const sidebar = document.querySelector('.app-sidebar');
    const activeLink = document.querySelector('.app-nav-link[data-nav="' + pageId + '"]');
    if (!sidebar || !activeLink) {
      return;
    }
    requestAnimationFrame(function () {
      activeLink.scrollIntoView({
        block: 'nearest',
        inline: 'center',
      });
    });
  }

  /**
   * Clear overlays and drag state so bfcache / fast nav doesn't leave the page frozen.
   */
  function resetTransientUiState() {
    document.body.classList.remove('modal-open');

    document.querySelectorAll('.modal:not([hidden])').forEach(function (modal) {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    });

    document.querySelectorAll('.kanban-drag-ghost').forEach(function (ghost) {
      ghost.remove();
    });

    var dragOverview = document.getElementById('kanban-drag-overview');
    if (dragOverview) {
      dragOverview.hidden = true;
      dragOverview.setAttribute('aria-hidden', 'true');
      dragOverview.replaceChildren();
    }

    document.querySelectorAll('.kanban-board').forEach(function (board) {
      board.classList.remove('kanban-board--drag-active', 'kanban-board--drag-overview-source');
    });

    document.querySelectorAll('.kanban-card').forEach(function (card) {
      card.classList.remove(
        'kanban-card--dragging',
        'kanban-card--lifted',
        'kanban-card--pending-drag'
      );
    });

    document.querySelectorAll('[id$="-refresh-btn"]').forEach(function (btn) {
      btn.disabled = false;
    });

    if (window.JobTrackInterviewBriefing && typeof JobTrackInterviewBriefing.close === 'function') {
      JobTrackInterviewBriefing.close();
    }
  }

  function wirePageLifecycle() {
    window.addEventListener('pagehide', resetTransientUiState);
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) {
        resetTransientUiState();
      }
    });
  }

  wirePageLifecycle();

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

    paintCachedUser(initialsEl, userEmailEl);

    const session = await JobTrackAuth.requireAuth(JobTrackAuth.getReturnPath());
    if (!session) {
      return null;
    }

    if (pageId) {
      setActiveNav(pageId);
      scrollActiveNavIntoView(pageId);
    }

    wireUserMenu(userEmailEl, logoutBtn, menuBtn, menuPanel, initialsEl, session.user.email);

    if (window.JobTrackInterviewBriefing) {
      requestAnimationFrame(function () {
        JobTrackInterviewBriefing.maybeShow();
      });
    }

    return session;
  }

  window.JobTrackAppShell = {
    init,
    getInitials,
    resetTransientUiState,
  };
})();
