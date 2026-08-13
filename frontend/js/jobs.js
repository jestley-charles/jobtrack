(function () {
  const STATUS_BADGE_CLASS = {
    Wishlist: 'status-badge--wishlist',
    Applied: 'status-badge--applied',
    Interview: 'status-badge--interview',
    Offer: 'status-badge--offer',
    Rejected: 'status-badge--rejected',
  };

  let cachedApplications = [];

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

  function sortApplications(applications) {
    return applications.slice().sort(function (a, b) {
      const aTime = a.updatedAt || a.createdAt || '';
      const bTime = b.updatedAt || b.createdAt || '';
      return bTime.localeCompare(aTime);
    });
  }

  function createStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'status-badge ' + (STATUS_BADGE_CLASS[status] || '');
    badge.textContent = status || 'Unknown';
    return badge;
  }

  function renderApplicationRow(application) {
    const row = document.createElement('tr');

    const companyCell = document.createElement('td');
    companyCell.className = 'application-company';
    companyCell.setAttribute('data-label', 'Company');

    const companyLink = document.createElement('a');
    companyLink.className = 'application-company-link';
    companyLink.href = 'application.html?id=' + encodeURIComponent(application.id);
    companyLink.textContent = application.company;
    companyCell.appendChild(companyLink);

    const positionCell = document.createElement('td');
    positionCell.className = 'application-position';
    positionCell.textContent = application.position;
    positionCell.setAttribute('data-label', 'Position');

    const statusCell = document.createElement('td');
    statusCell.setAttribute('data-label', 'Status');
    statusCell.appendChild(createStatusBadge(application.status));

    const locationCell = document.createElement('td');
    locationCell.className = 'application-muted';
    locationCell.textContent = application.location || '—';
    locationCell.setAttribute('data-label', 'Location');

    const dateCell = document.createElement('td');
    dateCell.className = 'application-muted';
    dateCell.textContent = formatDate(application.dateApplied);
    dateCell.setAttribute('data-label', 'Date applied');

    const salaryCell = document.createElement('td');
    salaryCell.className = 'application-muted';
    salaryCell.textContent = formatSalary(application.salaryMin, application.salaryMax);
    salaryCell.setAttribute('data-label', 'Salary');

    const actionsCell = document.createElement('td');
    actionsCell.className = 'application-actions';
    actionsCell.setAttribute('data-label', 'Actions');

    const viewBtn = document.createElement('a');
    viewBtn.className = 'btn btn-secondary btn-sm';
    viewBtn.href = 'application.html?id=' + encodeURIComponent(application.id);
    viewBtn.textContent = 'View';
    actionsCell.appendChild(viewBtn);

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', function () {
      JobTrackApplicationForm.openForEdit(application);
    });
    actionsCell.appendChild(editBtn);

    row.appendChild(companyCell);
    row.appendChild(positionCell);
    row.appendChild(statusCell);
    row.appendChild(locationCell);
    row.appendChild(dateCell);
    row.appendChild(salaryCell);
    row.appendChild(actionsCell);

    return row;
  }

  function renderApplications(applications) {
    const tbody = document.getElementById('applications-tbody');
    const countEl = document.getElementById('jobs-count');
    const sorted = sortApplications(applications);

    cachedApplications = sorted;
    tbody.replaceChildren();
    sorted.forEach(function (application) {
      tbody.appendChild(renderApplicationRow(application));
    });

    const label = sorted.length === 1 ? 'application' : 'applications';
    countEl.textContent = sorted.length + ' ' + label;
    countEl.hidden = false;
  }

  async function loadApplications() {
    const loadingEl = document.getElementById('jobs-loading');
    const errorEl = document.getElementById('jobs-error');
    const emptyEl = document.getElementById('jobs-empty');
    const contentEl = document.getElementById('jobs-content');
    const countEl = document.getElementById('jobs-count');

    loadingEl.hidden = false;
    errorEl.hidden = true;
    emptyEl.hidden = true;
    contentEl.hidden = true;
    countEl.hidden = true;
    errorEl.textContent = '';

    try {
      const applications = await JobTrackApi.fetchJsonList('/api/applications');

      loadingEl.hidden = true;

      if (!applications.length) {
        emptyEl.hidden = false;
        cachedApplications = [];
        return;
      }

      renderApplications(applications);
      contentEl.hidden = false;
    } catch (err) {
      loadingEl.hidden = true;
      errorEl.textContent = err.message || 'Something went wrong loading applications.';
      errorEl.hidden = false;
    }
  }

  function wireAddButtons() {
    document.getElementById('add-application-btn').addEventListener('click', function () {
      JobTrackApplicationForm.openForCreate();
    });

    document.getElementById('add-application-empty-btn').addEventListener('click', function () {
      JobTrackApplicationForm.openForCreate();
    });
  }

  JobTrackAppShell.init({ page: 'jobs' }).then(function (session) {
    if (!session) {
      return;
    }

    JobTrackApplicationForm.init({ onSaved: loadApplications });
    wireAddButtons();
    loadApplications();
  });
})();
