(function () {
  const STATUS_BADGE_CLASS = {
    Wishlist: 'status-badge--wishlist',
    Applied: 'status-badge--applied',
    Interview: 'status-badge--interview',
    Offer: 'status-badge--offer',
    Rejected: 'status-badge--rejected',
  };

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  let currentApplication = null;

  function getApplicationId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id || !UUID_PATTERN.test(id)) {
      return null;
    }
    return id;
  }

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

  function formatDateTime(isoDateTime) {
    if (!isoDateTime) {
      return '—';
    }
    const date = new Date(isoDateTime);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatSalary(salaryMin, salaryMax) {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });

    if (salaryMin != null && salaryMax != null) {
      return formatter.format(salaryMin) + ' – ' + formatter.format(salaryMax);
    }
    if (salaryMin != null) {
      return formatter.format(salaryMin) + '+';
    }
    if (salaryMax != null) {
      return 'Up to ' + formatter.format(salaryMax);
    }
    return '—';
  }

  function createStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'status-badge ' + (STATUS_BADGE_CLASS[status] || '');
    badge.textContent = status || 'Unknown';
    return badge;
  }

  function createDetailItem(label, valueNode) {
    const item = document.createElement('div');
    item.className = 'detail-list-item';

    const dt = document.createElement('dt');
    dt.textContent = label;

    const dd = document.createElement('dd');
    if (typeof valueNode === 'string') {
      dd.textContent = valueNode;
    } else {
      dd.appendChild(valueNode);
    }

    item.appendChild(dt);
    item.appendChild(dd);
    return item;
  }

  function renderApplicationDetails(application) {
    const detailsEl = document.getElementById('application-details');
    const titleEl = document.getElementById('application-title');
    const subtitleEl = document.getElementById('application-subtitle');

    titleEl.textContent = application.company;
    subtitleEl.replaceChildren();
    subtitleEl.appendChild(document.createTextNode(application.position + ' · '));
    subtitleEl.appendChild(createStatusBadge(application.status));

    detailsEl.replaceChildren();

    detailsEl.appendChild(
      createDetailItem('Location', application.location || '—')
    );
    detailsEl.appendChild(
      createDetailItem(
        'Salary',
        formatSalary(application.salaryMin, application.salaryMax)
      )
    );
    detailsEl.appendChild(
      createDetailItem('Date applied', formatDate(application.dateApplied))
    );

    if (application.jobUrl && /^https?:\/\//i.test(application.jobUrl)) {
      const link = document.createElement('a');
      link.href = application.jobUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'View posting';
      detailsEl.appendChild(createDetailItem('Job posting', link));
    } else {
      detailsEl.appendChild(createDetailItem('Job posting', '—'));
    }

    detailsEl.appendChild(
      createDetailItem('Added', formatDateTime(application.createdAt))
    );
    detailsEl.appendChild(
      createDetailItem('Last updated', formatDateTime(application.updatedAt))
    );

    document.title = application.company + ' — JobTrack';
  }

  function sortInterviews(interviews) {
    return interviews.slice().sort(function (a, b) {
      const aTime = a.interviewDate || '';
      const bTime = b.interviewDate || '';
      return bTime.localeCompare(aTime);
    });
  }

  function renderInterviewItem(interview) {
    const item = document.createElement('li');
    item.className = 'interview-list-item';

    const header = document.createElement('div');
    header.className = 'interview-list-header';

    const typeEl = document.createElement('span');
    typeEl.className = 'interview-list-type';
    typeEl.textContent = interview.interviewType || 'Interview';

    const dateEl = document.createElement('time');
    dateEl.className = 'interview-list-date';
    dateEl.dateTime = interview.interviewDate || '';
    dateEl.textContent = formatDateTime(interview.interviewDate);

    header.appendChild(typeEl);
    header.appendChild(dateEl);
    item.appendChild(header);

    if (interview.interviewer) {
      const interviewerEl = document.createElement('p');
      interviewerEl.className = 'interview-list-meta';
      interviewerEl.textContent = 'With ' + interview.interviewer;
      item.appendChild(interviewerEl);
    }

    if (interview.result) {
      const resultEl = document.createElement('p');
      resultEl.className = 'interview-list-result';
      resultEl.textContent = 'Result: ' + interview.result;
      item.appendChild(resultEl);
    }

    if (interview.notes) {
      const notesEl = document.createElement('p');
      notesEl.className = 'interview-list-notes';
      notesEl.textContent = interview.notes;
      item.appendChild(notesEl);
    }

    const actions = document.createElement('div');
    actions.className = 'interview-list-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', function () {
      JobTrackInterviewForm.openForEdit(interview);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-danger btn-sm';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', function () {
      handleDeleteInterview(interview);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    item.appendChild(actions);

    return item;
  }

  function renderInterviews(interviews) {
    const loadingEl = document.getElementById('interviews-loading');
    const emptyEl = document.getElementById('interviews-empty');
    const listEl = document.getElementById('interview-list');
    const errorEl = document.getElementById('interviews-section-error');

    loadingEl.hidden = true;
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    if (!interviews.length) {
      emptyEl.hidden = false;
      listEl.hidden = true;
      listEl.replaceChildren();
      return;
    }

    emptyEl.hidden = true;
    listEl.hidden = false;
    listEl.replaceChildren();

    sortInterviews(interviews).forEach(function (interview) {
      listEl.appendChild(renderInterviewItem(interview));
    });
  }

  function showInterviewsSectionError(message) {
    const loadingEl = document.getElementById('interviews-loading');
    const emptyEl = document.getElementById('interviews-empty');
    const listEl = document.getElementById('interview-list');
    const errorEl = document.getElementById('interviews-section-error');

    loadingEl.hidden = true;
    emptyEl.hidden = true;
    listEl.hidden = true;
    listEl.replaceChildren();
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function showInlineActionError(message) {
    const errorEl = document.getElementById('application-action-error');
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function hideInlineActionError() {
    const errorEl = document.getElementById('application-action-error');
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function interviewsForApplication(applicationId) {
    const allInterviews = JobTrackDataCache.getInterviews() || [];
    return allInterviews.filter(function (interview) {
      return interview.applicationId === applicationId;
    });
  }

  async function loadInterviews(applicationId, options) {
    const force = Boolean(options && options.force);
    const loadingEl = document.getElementById('interviews-loading');
    const errorEl = document.getElementById('interviews-section-error');
    const hadCache = JobTrackDataCache.hasData();

    if (!hadCache || force) {
      loadingEl.hidden = false;
    }
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    try {
      if (force) {
        await JobTrackDataCache.refreshInterviews();
      } else {
        await JobTrackDataCache.ensureLoaded();
      }
      renderInterviews(interviewsForApplication(applicationId));
    } catch (err) {
      loadingEl.hidden = true;
      if (hadCache || JobTrackDataCache.hasData()) {
        renderInterviews(interviewsForApplication(applicationId));
        showInlineActionError(
          err.message || 'Could not refresh interviews. Showing cached data.'
        );
      } else {
        showInterviewsSectionError(
          err.message || 'Something went wrong loading interviews.'
        );
      }
    }
  }

  async function handleDeleteInterview(interview) {
    const label = interview.interviewType || 'Interview';
    const confirmed = window.confirm(
      'Delete this ' + label.toLowerCase() + '? This cannot be undone.'
    );
    if (!confirmed) {
      return;
    }

    hideInlineActionError();

    try {
      const response = await JobTrackApi.fetch('/api/interviews/' + interview.id, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        throw new Error('Could not delete interview. Please try again.');
      }

      JobTrackDataCache.removeInterview(interview.id);
      if (currentApplication) {
        renderInterviews(interviewsForApplication(currentApplication.id));
      }
    } catch (err) {
      showInlineActionError(err.message || 'Something went wrong.');
    }
  }

  function showError(message) {
    document.getElementById('application-loading').hidden = true;
    document.getElementById('application-content').hidden = true;

    const errorEl = document.getElementById('application-error');
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function paintApplication(applicationId) {
    const data = JobTrackDataCache.peek();
    if (!data) {
      return false;
    }
    const application = data.applications.find(function (app) {
      return app.id === applicationId;
    });
    if (!application) {
      return false;
    }
    currentApplication = application;
    renderApplicationDetails(currentApplication);
    renderInterviews(interviewsForApplication(applicationId));
    document.getElementById('application-loading').hidden = true;
    document.getElementById('application-error').hidden = true;
    document.getElementById('application-content').hidden = false;
    return true;
  }

  async function loadApplication(applicationId, options) {
    const force = Boolean(options && options.force);
    const loadingEl = document.getElementById('application-loading');
    const errorEl = document.getElementById('application-error');
    const contentEl = document.getElementById('application-content');
    const refreshBtn = document.getElementById('application-refresh-btn');
    const paintedFromCache = !force && !contentEl.hidden && JobTrackDataCache.hasData();

    if (!paintedFromCache) {
      loadingEl.hidden = false;
      contentEl.hidden = true;
    }
    errorEl.hidden = true;
    hideInlineActionError();

    if (refreshBtn) {
      refreshBtn.disabled = true;
    }

    try {
      const data = force
        ? await JobTrackDataCache.refresh()
        : await JobTrackDataCache.ensureLoaded();

      const application = data.applications.find(function (app) {
        return app.id === applicationId;
      });

      if (!application) {
        showError('Application not found. It may have been deleted.');
        return;
      }

      currentApplication = application;
      renderApplicationDetails(currentApplication);
      renderInterviews(interviewsForApplication(applicationId));

      loadingEl.hidden = true;
      contentEl.hidden = false;
    } catch (err) {
      loadingEl.hidden = true;
      if (JobTrackDataCache.hasData() && paintApplication(applicationId)) {
        errorEl.textContent =
          err.message || 'Could not refresh. Showing cached data.';
        errorEl.hidden = false;
      } else {
        showError(err.message || 'Something went wrong loading this application.');
      }
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
      }
    }
  }

  async function handleDelete() {
    if (!currentApplication) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this application? This cannot be undone.'
    );
    if (!confirmed) {
      return;
    }

    hideInlineActionError();
    const deleteBtn = document.getElementById('delete-application-btn');
    deleteBtn.disabled = true;

    try {
      const response = await JobTrackApi.fetch(
        '/api/applications/' + currentApplication.id,
        { method: 'DELETE' }
      );

      if (!response.ok && response.status !== 204) {
        throw new Error('Could not delete application. Please try again.');
      }

      JobTrackDataCache.removeApplication(currentApplication.id);
      window.location.href = 'jobs.html';
    } catch (err) {
      deleteBtn.disabled = false;
      showInlineActionError(err.message || 'Something went wrong.');
    }
  }

  function wireActions() {
    document.getElementById('edit-application-btn').addEventListener('click', function () {
      if (currentApplication) {
        JobTrackApplicationForm.openForEdit(currentApplication);
      }
    });

    document.getElementById('delete-application-btn').addEventListener('click', handleDelete);

    document.getElementById('add-interview-btn').addEventListener('click', function () {
      if (currentApplication) {
        JobTrackInterviewForm.openForCreate({
          applicationId: currentApplication.id,
        });
      }
    });

    const refreshBtn = document.getElementById('application-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        const applicationId = getApplicationId();
        if (applicationId) {
          loadApplication(applicationId, { force: true });
        }
      });
    }
  }

  const earlyApplicationId = getApplicationId();
  if (earlyApplicationId) {
    if (!paintApplication(earlyApplicationId)) {
      document.getElementById('application-loading').hidden = false;
    }
  } else {
    showError('Invalid application link. Return to the jobs list and try again.');
  }

  JobTrackAppShell.init({ page: 'jobs' }).then(function (session) {
    if (!session) {
      return;
    }

    const applicationId = getApplicationId();
    if (!applicationId) {
      showError('Invalid application link. Return to the jobs list and try again.');
      return;
    }

    JobTrackApplicationForm.init({
      onSaved: function () {
        loadApplication(applicationId, { force: true });
      },
    });

    JobTrackInterviewForm.init({
      onSaved: function () {
        loadInterviews(applicationId, { force: true });
      },
    });

    wireActions();
    loadApplication(applicationId);
  });
})();
