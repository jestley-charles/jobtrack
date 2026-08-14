(function () {
  let cachedRejected = [];

  function formatDate(isoDate) {
    if (!isoDate) {
      return '—';
    }
    const date = new Date(isoDate + 'T00:00:00');
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function collectRejected(applications) {
    return applications
      .filter(function (app) {
        return app.status === 'Rejected';
      })
      .slice()
      .sort(function (a, b) {
        const aTime = a.updatedAt || a.createdAt || '';
        const bTime = b.updatedAt || b.createdAt || '';
        return bTime.localeCompare(aTime);
      });
  }

  function updateCountLabel(count) {
    const countEl = document.getElementById('rejected-count');
    const label = count === 1 ? 'rejected application' : 'rejected applications';
    countEl.textContent = count + ' ' + label;
    countEl.hidden = false;
  }

  function createRejectedCard(application) {
    const card = document.createElement('article');
    card.className = 'rejected-card';
    card.setAttribute('role', 'listitem');
    card.dataset.applicationId = application.id;

    const header = document.createElement('div');
    header.className = 'rejected-card-header';

    const titles = document.createElement('div');
    titles.className = 'rejected-card-titles';

    const company = document.createElement('h2');
    company.className = 'rejected-card-company';
    company.textContent = application.company;

    const position = document.createElement('p');
    position.className = 'rejected-card-position';
    position.textContent = application.position;

    titles.appendChild(company);
    titles.appendChild(position);

    const meta = document.createElement('p');
    meta.className = 'rejected-card-meta';
    const location = application.location || 'No location';
    meta.textContent = location + ' · Applied ' + formatDate(application.dateApplied);

    header.appendChild(titles);
    header.appendChild(meta);

    const form = document.createElement('form');
    form.className = 'rejected-reason-form';
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      saveRejectionReason(application, form);
    });

    const field = document.createElement('div');
    field.className = 'form-field';

    const label = document.createElement('label');
    const fieldId = 'rejection-reason-' + application.id;
    label.setAttribute('for', fieldId);
    label.textContent = 'Possible reason';

    const textarea = document.createElement('textarea');
    textarea.id = fieldId;
    textarea.name = 'rejectionReason';
    textarea.rows = 3;
    textarea.placeholder = 'e.g. Weak system design, better internal candidate, salary mismatch…';
    textarea.value = application.rejectionReason || '';

    field.appendChild(label);
    field.appendChild(textarea);

    const status = document.createElement('p');
    status.className = 'rejected-reason-status';
    status.hidden = true;

    const actions = document.createElement('div');
    actions.className = 'rejected-card-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'btn btn-primary btn-sm';
    saveBtn.textContent = 'Save reason';

    const viewBtn = document.createElement('a');
    viewBtn.className = 'btn btn-secondary btn-sm';
    viewBtn.href = 'application.html?id=' + encodeURIComponent(application.id);
    viewBtn.textContent = 'View details';

    actions.appendChild(saveBtn);
    actions.appendChild(viewBtn);

    form.appendChild(field);
    form.appendChild(status);
    form.appendChild(actions);

    card.appendChild(header);
    card.appendChild(form);
    return card;
  }

  function setFormStatus(form, message, isError) {
    const status = form.querySelector('.rejected-reason-status');
    if (!status) {
      return;
    }
    status.hidden = !message;
    status.textContent = message || '';
    status.classList.toggle('rejected-reason-status--error', Boolean(isError));
  }

  async function saveRejectionReason(application, form) {
    const textarea = form.querySelector('textarea[name="rejectionReason"]');
    const saveBtn = form.querySelector('button[type="submit"]');
    const reason = textarea ? textarea.value : '';

    setFormStatus(form, '');
    if (saveBtn) {
      saveBtn.disabled = true;
    }

    try {
      const updated = await JobTrackApi.fetchJson(
        '/api/applications/' + encodeURIComponent(application.id) + '/rejection-reason',
        {
          method: 'PATCH',
          body: JSON.stringify({ rejectionReason: reason }),
        }
      );
      JobTrackDataCache.replaceApplication(updated);
      const data = JobTrackDataCache.peek();
      showRejectedResult(data.applications);
      setFormStatus(
        document
          .querySelector('.rejected-card[data-application-id="' + application.id + '"] form') ||
          form,
        'Saved',
        false
      );
    } catch (err) {
      setFormStatus(form, err.message || 'Could not save rejection reason.', true);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
      }
    }
  }

  function renderRejected(applications) {
    const listEl = document.getElementById('rejected-list');
    listEl.replaceChildren();
    applications.forEach(function (application) {
      listEl.appendChild(createRejectedCard(application));
    });
  }

  function showRejectedResult(applications) {
    const loadingEl = document.getElementById('rejected-loading');
    const emptyEl = document.getElementById('rejected-empty');
    const contentEl = document.getElementById('rejected-content');
    const countEl = document.getElementById('rejected-count');

    loadingEl.hidden = true;
    cachedRejected = collectRejected(applications);

    if (!cachedRejected.length) {
      emptyEl.hidden = false;
      contentEl.hidden = true;
      countEl.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    contentEl.hidden = false;
    updateCountLabel(cachedRejected.length);
    renderRejected(cachedRejected);
  }

  function hideRejectedError() {
    const errorEl = document.getElementById('rejected-error');
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function showRejectedError(message) {
    const errorEl = document.getElementById('rejected-error');
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function paintFromCache() {
    const data = JobTrackDataCache.peek();
    if (!data) {
      return false;
    }
    hideRejectedError();
    showRejectedResult(data.applications);
    return true;
  }

  async function loadRejected(options) {
    const force = Boolean(options && options.force);
    const loadingEl = document.getElementById('rejected-loading');
    const emptyEl = document.getElementById('rejected-empty');
    const contentEl = document.getElementById('rejected-content');
    const countEl = document.getElementById('rejected-count');
    const refreshBtn = document.getElementById('rejected-refresh-btn');
    const paintedFromCache = !force && JobTrackDataCache.hasData();

    if (!paintedFromCache) {
      loadingEl.hidden = false;
      emptyEl.hidden = true;
      contentEl.hidden = true;
      countEl.hidden = true;
    }
    hideRejectedError();
    if (refreshBtn) {
      refreshBtn.disabled = true;
    }

    try {
      const data = force
        ? await JobTrackDataCache.refresh()
        : await JobTrackDataCache.ensureLoaded();
      showRejectedResult(data.applications);
    } catch (err) {
      loadingEl.hidden = true;
      if (JobTrackDataCache.hasData()) {
        const data = JobTrackDataCache.peek();
        showRejectedResult(data.applications);
      } else {
        emptyEl.hidden = true;
        contentEl.hidden = true;
        countEl.hidden = true;
      }
      showRejectedError(err.message || 'Something went wrong loading rejected applications.');
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
      }
    }
  }

  if (!paintFromCache()) {
    document.getElementById('rejected-loading').hidden = false;
  }

  JobTrackAppShell.init({ page: 'rejected' }).then(function (session) {
    if (!session) {
      return;
    }

    document.getElementById('rejected-refresh-btn').addEventListener('click', function () {
      loadRejected({ force: true });
    });
    if (!JobTrackDataCache.hasData()) {
      loadRejected();
    }
  });
})();
