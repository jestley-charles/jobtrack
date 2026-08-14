/**
 * Settings — account, security, local preferences, export, session.
 */
(function () {
  const JOBS_VIEW_KEY = 'jobtrack.jobsView';

  function formatMemberSince(iso) {
    if (!iso) {
      return '—';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function readJobsView() {
    try {
      const stored = window.localStorage.getItem(JOBS_VIEW_KEY);
      return stored === 'board' ? 'board' : 'list';
    } catch (err) {
      return 'list';
    }
  }

  function writeJobsView(view) {
    try {
      window.localStorage.setItem(JOBS_VIEW_KEY, view === 'board' ? 'board' : 'list');
    } catch (err) {
      // ignore
    }
  }

  function showMessage(el, message) {
    if (!el) {
      return;
    }
    el.textContent = message || '';
    el.hidden = !message;
  }

  function flashPrefsSaved() {
    const el = document.getElementById('settings-prefs-saved');
    showMessage(el, 'Preferences saved.');
    window.clearTimeout(flashPrefsSaved._timer);
    flashPrefsSaved._timer = window.setTimeout(function () {
      showMessage(el, '');
    }, 2000);
  }

  function fillAccount(user) {
    const emailEl = document.getElementById('settings-email');
    const sinceEl = document.getElementById('settings-member-since');
    if (emailEl) {
      emailEl.textContent = (user && user.email) || '—';
    }
    if (sinceEl) {
      sinceEl.textContent = formatMemberSince(user && user.created_at);
    }
  }

  function configureDemoPasswordLock(email) {
    const form = document.getElementById('settings-password-form');
    const submitBtn = document.getElementById('settings-password-submit');
    const noticeEl = document.getElementById('settings-password-demo-notice');
    const isDemo = JobTrackAuth.isDemoAccount(email);

    if (!form) {
      return;
    }

    form.querySelectorAll('input').forEach(function (input) {
      input.disabled = isDemo;
    });

    if (submitBtn) {
      submitBtn.disabled = isDemo;
    }

    if (noticeEl) {
      noticeEl.hidden = !isDemo;
    }
  }

  function configureDemoDeleteLock(email) {
    const deleteBtn = document.getElementById('settings-delete-btn');
    const noticeEl = document.getElementById('settings-delete-demo-notice');
    const isDemo = JobTrackAuth.isDemoAccount(email);

    if (deleteBtn) {
      deleteBtn.disabled = isDemo;
    }
    if (noticeEl) {
      noticeEl.hidden = !isDemo;
    }
  }

  function bindPasswordForm() {
    const form = document.getElementById('settings-password-form');
    const submitBtn = document.getElementById('settings-password-submit');
    const errorEl = document.getElementById('settings-password-error');
    const successEl = document.getElementById('settings-password-success');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      showMessage(errorEl, '');
      showMessage(successEl, '');

      const emailEl = document.getElementById('settings-email');
      const email = emailEl ? emailEl.textContent : '';
      if (JobTrackAuth.isDemoAccount(email)) {
        showMessage(errorEl, 'Password changes are disabled for the demo account.');
        return;
      }

      const password = form.password.value;
      const confirm = form.passwordConfirm.value;

      if (!password || password.length < 6) {
        showMessage(errorEl, 'Password must be at least 6 characters.');
        return;
      }
      if (password !== confirm) {
        showMessage(errorEl, 'Passwords do not match.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Updating…';
      try {
        await JobTrackAuth.updatePassword(password);
        form.reset();
        showMessage(successEl, 'Password updated.');
      } catch (err) {
        showMessage(errorEl, err.message || 'Could not update password.');
      } finally {
        submitBtn.textContent = 'Update password';
        configureDemoPasswordLock(
          document.getElementById('settings-email')
            ? document.getElementById('settings-email').textContent
            : ''
        );
      }
    });
  }

  function bindPreferences() {
    const viewSelect = document.getElementById('settings-jobs-view');
    const briefingToggle = document.getElementById('settings-briefing-enabled');

    if (viewSelect) {
      viewSelect.value = readJobsView();
      viewSelect.addEventListener('change', function () {
        writeJobsView(viewSelect.value);
        flashPrefsSaved();
      });
    }

    if (briefingToggle && window.JobTrackInterviewBriefing) {
      briefingToggle.checked = JobTrackInterviewBriefing.isEnabled();
      briefingToggle.addEventListener('change', function () {
        JobTrackInterviewBriefing.setEnabled(briefingToggle.checked);
        flashPrefsSaved();
      });
    }
  }

  function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function bindDataActions() {
    const exportBtn = document.getElementById('settings-export-btn');
    const clearBtn = document.getElementById('settings-clear-cache-btn');
    const messageEl = document.getElementById('settings-data-message');
    const errorEl = document.getElementById('settings-data-error');

    if (exportBtn) {
      exportBtn.addEventListener('click', async function () {
        showMessage(messageEl, '');
        showMessage(errorEl, '');
        exportBtn.disabled = true;
        exportBtn.textContent = 'Exporting…';
        try {
          const data = await JobTrackDataCache.refresh();
          const stamp = new Date().toISOString().slice(0, 10);
          downloadJson('jobtrack-export-' + stamp + '.json', {
            exportedAt: new Date().toISOString(),
            applications: data.applications || [],
            interviews: data.interviews || [],
          });
          showMessage(
            messageEl,
            'Exported ' +
              (data.applications || []).length +
              ' applications and ' +
              (data.interviews || []).length +
              ' interviews.'
          );
        } catch (err) {
          showMessage(errorEl, err.message || 'Export failed.');
        } finally {
          exportBtn.disabled = false;
          exportBtn.textContent = 'Export JSON';
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', async function () {
        showMessage(messageEl, '');
        showMessage(errorEl, '');
        const ok = await JobTrackConfirm.confirm({
          title: 'Clear local cache?',
          message:
            'Remove cached applications and interviews from this browser? Your account data on the server is not deleted.',
          confirmLabel: 'Clear cache',
        });
        if (!ok) {
          return;
        }
        if (window.JobTrackAuth && typeof JobTrackAuth.clearDataCache === 'function') {
          JobTrackAuth.clearDataCache();
        } else if (window.JobTrackDataCache) {
          JobTrackDataCache.invalidate();
        }
        showMessage(messageEl, 'Local cache cleared.');
      });
    }
  }

  function bindSessionActions() {
    const logoutBtn = document.getElementById('settings-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        logoutBtn.disabled = true;
        try {
          await JobTrackAuth.signOut();
        } catch (err) {
          // Still leave the app even if remote sign-out fails.
        }
        window.location.replace('login.html');
      });
    }

    const deleteBtn = document.getElementById('settings-delete-btn');
    const deleteErrorEl = document.getElementById('settings-delete-error');
    if (!deleteBtn) {
      return;
    }

    deleteBtn.addEventListener('click', async function () {
      showMessage(deleteErrorEl, '');

      const emailEl = document.getElementById('settings-email');
      const email = emailEl ? emailEl.textContent : '';
      if (JobTrackAuth.isDemoAccount(email)) {
        showMessage(deleteErrorEl, 'Account deletion is disabled for the demo account.');
        return;
      }

      const ok = await JobTrackConfirm.confirm({
        title: 'Delete your account?',
        message:
          'This permanently removes your workspace, applications, interviews, and contacts. This cannot be undone.',
        confirmLabel: 'Delete account',
      });
      if (!ok) {
        return;
      }

      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting…';
      try {
        const response = await JobTrackApi.fetch('/api/me', { method: 'DELETE' });
        if (!response.ok && response.status !== 204) {
          throw new Error('Could not delete your account. Please try again.');
        }
        await JobTrackAuth.clearLocalSession();
        window.location.replace('login.html');
      } catch (err) {
        showMessage(deleteErrorEl, err.message || 'Could not delete your account.');
        deleteBtn.disabled = false;
        deleteBtn.textContent = 'Delete account';
        configureDemoDeleteLock(email);
      }
    });
  }

  async function init() {
    const session = await JobTrackAppShell.init({ page: 'settings' });
    if (!session) {
      return;
    }

    const user = session.user || null;
    fillAccount(user);
    configureDemoPasswordLock(user && user.email);
    configureDemoDeleteLock(user && user.email);

    bindPasswordForm();
    bindPreferences();
    bindDataActions();
    bindSessionActions();
  }

  init();
})();
