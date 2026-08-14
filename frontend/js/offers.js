(function () {
  let cachedOffers = [];
  let interviewCountByApp = {};

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
    return 'Not listed';
  }

  function salarySortKey(application) {
    if (application.salaryMax != null) {
      return application.salaryMax;
    }
    if (application.salaryMin != null) {
      return application.salaryMin;
    }
    return -1;
  }

  function collectOffers(applications) {
    return applications
      .filter(function (app) {
        return app.status === 'Offer';
      })
      .slice()
      .sort(function (a, b) {
        const salaryDiff = salarySortKey(b) - salarySortKey(a);
        if (salaryDiff !== 0) {
          return salaryDiff;
        }
        return String(a.company || '').localeCompare(String(b.company || ''));
      });
  }

  function buildInterviewCounts(interviews) {
    const counts = {};
    (interviews || []).forEach(function (interview) {
      const id = interview.applicationId;
      if (!id) {
        return;
      }
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }

  function updateCountLabel(count) {
    const countEl = document.getElementById('offers-count');
    const label = count === 1 ? 'active offer' : 'active offers';
    countEl.textContent = count + ' ' + label;
    countEl.hidden = false;
  }

  function renderSummary(offers) {
    const summaryEl = document.getElementById('offers-summary');
    const highestEl = document.getElementById('offers-highest');
    const companyEl = document.getElementById('offers-highest-company');

    if (!offers.length || salarySortKey(offers[0]) < 0) {
      summaryEl.hidden = true;
      return;
    }

    const top = offers[0];
    highestEl.textContent = formatSalary(top.salaryMin, top.salaryMax);
    companyEl.textContent = top.company;
    summaryEl.hidden = false;
  }

  function createOfferCard(application, isTop) {
    const card = document.createElement('article');
    card.className = 'offer-card' + (isTop ? ' offer-card--top' : '');
    card.setAttribute('role', 'listitem');
    card.dataset.applicationId = application.id;

    if (isTop && salarySortKey(application) >= 0) {
      const ribbon = document.createElement('p');
      ribbon.className = 'offer-card-ribbon';
      ribbon.textContent = 'Highest listed';
      card.appendChild(ribbon);
    }

    const company = document.createElement('h2');
    company.className = 'offer-card-company';
    company.textContent = application.company;

    const position = document.createElement('p');
    position.className = 'offer-card-position';
    position.textContent = application.position;

    const salary = document.createElement('p');
    salary.className = 'offer-card-salary';
    salary.textContent = formatSalary(application.salaryMin, application.salaryMax);

    const meta = document.createElement('dl');
    meta.className = 'offer-card-meta';

    function addMeta(label, value) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      meta.appendChild(dt);
      meta.appendChild(dd);
    }

    addMeta('Location', application.location || '—');
    addMeta('Applied', formatDate(application.dateApplied));
    const interviewCount = interviewCountByApp[application.id] || 0;
    addMeta(
      'Interviews',
      interviewCount === 1 ? '1 interview' : interviewCount + ' interviews'
    );

    const actions = document.createElement('div');
    actions.className = 'offer-card-actions';

    const viewBtn = document.createElement('a');
    viewBtn.className = 'btn btn-primary btn-sm';
    viewBtn.href = 'application.html?id=' + encodeURIComponent(application.id);
    viewBtn.textContent = 'View details';
    actions.appendChild(viewBtn);

    if (application.jobUrl && /^https?:\/\//i.test(application.jobUrl)) {
      const postingBtn = document.createElement('a');
      postingBtn.className = 'btn btn-secondary btn-sm';
      postingBtn.href = application.jobUrl;
      postingBtn.target = '_blank';
      postingBtn.rel = 'noopener noreferrer';
      postingBtn.textContent = 'Job posting';
      actions.appendChild(postingBtn);
    }

    const declineBtn = document.createElement('button');
    declineBtn.type = 'button';
    declineBtn.className = 'btn btn-secondary btn-sm';
    declineBtn.textContent = 'Decline';
    declineBtn.addEventListener('click', function () {
      declineOffer(application);
    });
    actions.appendChild(declineBtn);

    card.appendChild(company);
    card.appendChild(position);
    card.appendChild(salary);
    card.appendChild(meta);
    card.appendChild(actions);
    return card;
  }

  function renderOffers(offers) {
    const compareEl = document.getElementById('offers-compare');
    compareEl.replaceChildren();
    offers.forEach(function (application, index) {
      compareEl.appendChild(createOfferCard(application, index === 0));
    });
  }

  function showOffersResult(applications, interviews) {
    const loadingEl = document.getElementById('offers-loading');
    const emptyEl = document.getElementById('offers-empty');
    const contentEl = document.getElementById('offers-content');
    const countEl = document.getElementById('offers-count');

    loadingEl.hidden = true;
    interviewCountByApp = buildInterviewCounts(interviews);
    cachedOffers = collectOffers(applications);

    if (!cachedOffers.length) {
      emptyEl.hidden = false;
      contentEl.hidden = true;
      countEl.hidden = true;
      return;
    }

    emptyEl.hidden = true;
    contentEl.hidden = false;
    updateCountLabel(cachedOffers.length);
    renderSummary(cachedOffers);
    renderOffers(cachedOffers);
  }

  function hideOffersError() {
    const errorEl = document.getElementById('offers-error');
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function showOffersError(message) {
    const errorEl = document.getElementById('offers-error');
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  async function declineOffer(application) {
    const confirmed = window.confirm(
      'Decline the offer from ' +
        application.company +
        '? This will mark the application as Rejected.'
    );
    if (!confirmed) {
      return;
    }

    hideOffersError();
    try {
      const updated = await JobTrackApi.fetchJson(
        '/api/applications/' + encodeURIComponent(application.id) + '/status',
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'Rejected' }),
        }
      );
      JobTrackDataCache.replaceApplication(updated);
      const data = JobTrackDataCache.peek();
      showOffersResult(data.applications, data.interviews);
    } catch (err) {
      showOffersError(err.message || 'Could not decline this offer.');
    }
  }

  function paintFromCache() {
    const data = JobTrackDataCache.peek();
    if (!data) {
      return false;
    }
    hideOffersError();
    showOffersResult(data.applications, data.interviews);
    return true;
  }

  async function loadOffers(options) {
    const force = Boolean(options && options.force);
    const loadingEl = document.getElementById('offers-loading');
    const emptyEl = document.getElementById('offers-empty');
    const contentEl = document.getElementById('offers-content');
    const countEl = document.getElementById('offers-count');
    const refreshBtn = document.getElementById('offers-refresh-btn');
    const paintedFromCache = !force && JobTrackDataCache.hasData();

    if (!paintedFromCache) {
      loadingEl.hidden = false;
      emptyEl.hidden = true;
      contentEl.hidden = true;
      countEl.hidden = true;
    }
    hideOffersError();
    if (refreshBtn) {
      refreshBtn.disabled = true;
    }

    try {
      const data = force
        ? await JobTrackDataCache.refresh()
        : await JobTrackDataCache.ensureLoaded();
      showOffersResult(data.applications, data.interviews);
    } catch (err) {
      loadingEl.hidden = true;
      if (JobTrackDataCache.hasData()) {
        const data = JobTrackDataCache.peek();
        showOffersResult(data.applications, data.interviews);
      } else {
        emptyEl.hidden = true;
        contentEl.hidden = true;
        countEl.hidden = true;
      }
      showOffersError(err.message || 'Something went wrong loading offers.');
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
      }
    }
  }

  if (!paintFromCache()) {
    document.getElementById('offers-loading').hidden = false;
  }

  JobTrackAppShell.init({ page: 'offers' }).then(function (session) {
    if (!session) {
      return;
    }

    document.getElementById('offers-refresh-btn').addEventListener('click', function () {
      loadOffers({ force: true });
    });
    if (!JobTrackDataCache.hasData()) {
      loadOffers();
    }
  });
})();
