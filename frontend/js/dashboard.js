(function () {
  const STATUS_CHART_ORDER = ['Applied', 'Interview', 'Offer', 'Rejected'];
  const ACTIVITY_LIMIT = 15;

  const STATUS_BAR_CLASS = {
    Applied: 'status-bar-fill--applied',
    Interview: 'status-bar-fill--interview',
    Offer: 'status-bar-fill--offer',
    Rejected: 'status-bar-fill--rejected',
  };

  function toSortableTimestamp(value) {
    if (!value) {
      return '';
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value + 'T12:00:00.000Z';
    }
    return value;
  }

  function formatActivityDate(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  }

  function buildActivityEvents(applications, interviews) {
    const appById = {};
    applications.forEach(function (app) {
      appById[app.id] = app;
    });

    const events = [];

    applications.forEach(function (app) {
      events.push({
        timestamp: app.createdAt,
        applicationId: app.id,
        company: app.company,
        messagePrefix: 'Added ',
      });

      if (app.dateApplied) {
        events.push({
          timestamp: toSortableTimestamp(app.dateApplied),
          applicationId: app.id,
          company: app.company,
          messagePrefix: 'Applied to ',
        });
      }

      if (app.status === 'Offer' && app.updatedAt && app.updatedAt !== app.createdAt) {
        events.push({
          timestamp: app.updatedAt,
          applicationId: app.id,
          company: app.company,
          messagePrefix: 'Received offer from ',
        });
      } else if (app.status === 'Rejected' && app.updatedAt && app.updatedAt !== app.createdAt) {
        events.push({
          timestamp: app.updatedAt,
          applicationId: app.id,
          company: app.company,
          messagePrefix: 'Received rejection from ',
        });
      } else if (
        app.status === 'Applied' &&
        !app.dateApplied &&
        app.updatedAt &&
        app.updatedAt !== app.createdAt
      ) {
        events.push({
          timestamp: app.updatedAt,
          applicationId: app.id,
          company: app.company,
          messagePrefix: 'Applied to ',
        });
      }
    });

    interviews.forEach(function (interview) {
      const app = appById[interview.applicationId];
      const company = app ? app.company : 'Unknown company';
      events.push({
        timestamp: interview.interviewDate || interview.createdAt,
        applicationId: interview.applicationId,
        company: company,
        messagePrefix: 'Interview with ',
      });
    });

    events.sort(function (a, b) {
      return b.timestamp.localeCompare(a.timestamp);
    });

    return events.slice(0, ACTIVITY_LIMIT);
  }

  function renderActivityFeed(events) {
    const listEl = document.getElementById('activity-list');
    const emptyEl = document.getElementById('activity-empty');

    if (!events.length) {
      listEl.hidden = true;
      emptyEl.hidden = false;
      listEl.replaceChildren();
      return;
    }

    emptyEl.hidden = true;
    listEl.hidden = false;
    listEl.replaceChildren();

    events.forEach(function (event) {
      const item = document.createElement('li');
      item.className = 'activity-feed-item';

      const dateEl = document.createElement('time');
      dateEl.className = 'activity-feed-date';
      dateEl.dateTime = event.timestamp;
      dateEl.textContent = formatActivityDate(event.timestamp);

      const textEl = document.createElement('span');
      textEl.className = 'activity-feed-text';
      textEl.appendChild(document.createTextNode(event.messagePrefix));

      const link = document.createElement('a');
      link.href = 'application.html?id=' + encodeURIComponent(event.applicationId);
      link.textContent = event.company;
      textEl.appendChild(link);

      item.appendChild(dateEl);
      item.appendChild(textEl);
      listEl.appendChild(item);
    });
  }

  function countByStatus(applications) {
    const counts = {};
    STATUS_CHART_ORDER.forEach(function (status) {
      counts[status] = 0;
    });
    applications.forEach(function (app) {
      if (Object.prototype.hasOwnProperty.call(counts, app.status)) {
        counts[app.status] += 1;
      }
    });
    return counts;
  }

  function renderStatCards(applications, interviews) {
    const offerCount = applications.filter(function (app) {
      return app.status === 'Offer';
    }).length;

    document.getElementById('stat-applications').textContent = String(applications.length);
    document.getElementById('stat-interviews').textContent = String(interviews.length);
    document.getElementById('stat-offers').textContent = String(offerCount);
  }

  function renderStatusChart(counts) {
    const container = document.getElementById('status-chart');
    const values = STATUS_CHART_ORDER.map(function (status) {
      return counts[status];
    });
    const max = Math.max.apply(null, values.concat([1]));

    container.replaceChildren();

    STATUS_CHART_ORDER.forEach(function (status) {
      const count = counts[status];
      const width = Math.round((count / max) * 100);

      const row = document.createElement('div');
      row.className = 'status-bar-row';

      const label = document.createElement('span');
      label.className = 'status-bar-label';
      label.textContent = status;

      const track = document.createElement('div');
      track.className = 'status-bar-track';
      track.setAttribute('role', 'presentation');

      const fill = document.createElement('div');
      fill.className = 'status-bar-fill ' + (STATUS_BAR_CLASS[status] || '');
      fill.style.width = width + '%';
      fill.setAttribute('aria-hidden', 'true');

      track.appendChild(fill);

      const countEl = document.createElement('span');
      countEl.className = 'status-bar-count';
      countEl.textContent = String(count);

      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(countEl);
      container.appendChild(row);
    });

    const summary = STATUS_CHART_ORDER.map(function (status) {
      return status + ': ' + counts[status];
    }).join(', ');
    container.setAttribute('aria-label', 'Application counts by status. ' + summary);
  }

  async function loadDashboardStats() {
    const loadingEl = document.getElementById('dashboard-loading');
    const errorEl = document.getElementById('dashboard-error');
    const contentEl = document.getElementById('dashboard-content');

    loadingEl.hidden = false;
    errorEl.hidden = true;
    contentEl.hidden = true;
    errorEl.textContent = '';

    try {
      const [applicationsResponse, interviewsResponse] = await Promise.all([
        JobTrackApi.fetch('/api/applications'),
        JobTrackApi.fetch('/api/interviews'),
      ]);

      if (!applicationsResponse.ok || !interviewsResponse.ok) {
        throw new Error('Could not load dashboard data. Please try again.');
      }

      const applications = await applicationsResponse.json();
      const interviews = await interviewsResponse.json();

      renderStatCards(applications, interviews);
      renderStatusChart(countByStatus(applications));
      renderActivityFeed(buildActivityEvents(applications, interviews));

      loadingEl.hidden = true;
      contentEl.hidden = false;
    } catch (err) {
      loadingEl.hidden = true;
      errorEl.textContent = err.message || 'Something went wrong loading your stats.';
      errorEl.hidden = false;
    }
  }

  JobTrackAppShell.init({ page: 'dashboard' }).then(function (session) {
    if (session) {
      loadDashboardStats();
    }
  });
})();
