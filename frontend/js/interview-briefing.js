/**
 * Post-login interview briefing modal — last / today / next schedule.
 * Trigger via JobTrackInterviewBriefing.markPending() on sign-in.
 */
(function () {
  const FLAG_KEY = 'jobtrack.interviewBriefing.pending';
  let modalEl = null;
  let previouslyFocused = null;

  function markPending() {
    try {
      window.sessionStorage.setItem(FLAG_KEY, '1');
    } catch (err) {
      // ignore storage errors
    }
  }

  function consumePending() {
    try {
      if (window.sessionStorage.getItem(FLAG_KEY) !== '1') {
        return false;
      }
      window.sessionStorage.removeItem(FLAG_KEY);
      return true;
    } catch (err) {
      return false;
    }
  }

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatDayLabel(dateKey, todayKey) {
    if (dateKey === todayKey) {
      return 'Today';
    }
    const date = new Date(dateKey + 'T12:00:00');
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function enrichInterviews(applications, interviews) {
    const appById = {};
    (applications || []).forEach(function (app) {
      appById[app.id] = app;
    });

    return (interviews || [])
      .filter(function (interview) {
        return Boolean(interview.interviewDate);
      })
      .map(function (interview) {
        const app = appById[interview.applicationId];
        const when = new Date(interview.interviewDate);
        return {
          id: interview.id,
          applicationId: interview.applicationId,
          interviewDate: interview.interviewDate,
          interviewType: interview.interviewType || 'Interview',
          company: app ? app.company : 'Unknown company',
          dateKey: Number.isNaN(when.getTime()) ? null : localDateKey(when),
          timeMs: when.getTime(),
        };
      })
      .filter(function (item) {
        return item.dateKey && !Number.isNaN(item.timeMs);
      })
      .sort(function (a, b) {
        return a.interviewDate.localeCompare(b.interviewDate);
      });
  }

  function buildSchedule(applications, interviews) {
    const todayKey = localDateKey(new Date());
    const items = enrichInterviews(applications, interviews);

    const past = items.filter(function (item) {
      return item.dateKey < todayKey;
    });
    const today = items.filter(function (item) {
      return item.dateKey === todayKey;
    });
    const future = items.filter(function (item) {
      return item.dateKey > todayKey;
    });

    const last = past.length ? past[past.length - 1] : null;
    let nextItems = [];
    if (future.length) {
      const nextDay = future[0].dateKey;
      nextItems = future.filter(function (item) {
        return item.dateKey === nextDay;
      });
    }

    return {
      todayKey: todayKey,
      last: last,
      today: today,
      next: nextItems,
    };
  }

  function createInterviewRow(item) {
    const row = document.createElement('div');
    row.className = 'briefing-interview';

    const timeEl = document.createElement('time');
    timeEl.className = 'briefing-interview-time';
    timeEl.dateTime = item.interviewDate;
    timeEl.textContent = formatTime(item.interviewDate);

    const body = document.createElement('div');
    body.className = 'briefing-interview-body';

    const company = document.createElement('a');
    company.className = 'briefing-interview-company';
    company.href = 'application.html?id=' + encodeURIComponent(item.applicationId);
    company.textContent = item.company;

    const typeEl = document.createElement('span');
    typeEl.className = 'briefing-interview-type';
    typeEl.textContent = item.interviewType;

    body.appendChild(company);
    body.appendChild(typeEl);
    row.appendChild(timeEl);
    row.appendChild(body);
    return row;
  }

  function fillColumn(columnEl, options) {
    columnEl.replaceChildren();

    const label = document.createElement('p');
    label.className = 'briefing-column-label';
    label.textContent = options.label;
    columnEl.appendChild(label);

    if (options.sublabel) {
      const sub = document.createElement('p');
      sub.className = 'briefing-column-sublabel';
      sub.textContent = options.sublabel;
      columnEl.appendChild(sub);
    }

    if (!options.items || !options.items.length) {
      const empty = document.createElement('p');
      empty.className = 'briefing-column-empty';
      empty.textContent = options.emptyText || 'Nothing here';
      columnEl.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'briefing-interview-list';
    options.items.forEach(function (item) {
      list.appendChild(createInterviewRow(item));
    });
    columnEl.appendChild(list);
  }

  function ensureModal() {
    if (modalEl) {
      return modalEl;
    }

    modalEl = document.createElement('div');
    modalEl.className = 'modal briefing-modal';
    modalEl.id = 'interview-briefing-modal';
    modalEl.hidden = true;
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML =
      '<div class="modal-backdrop" data-briefing-close tabindex="-1"></div>' +
      '<div class="modal-dialog briefing-dialog" role="dialog" aria-modal="true" aria-labelledby="briefing-title">' +
      '  <header class="modal-header briefing-header">' +
      '    <div class="briefing-header-text">' +
      '      <p class="briefing-kicker">JobTrack assistant</p>' +
      '      <h2 id="briefing-title">Interview briefing</h2>' +
      '    </div>' +
      '    <button type="button" class="modal-close" data-briefing-close aria-label="Close">&times;</button>' +
      '  </header>' +
      '  <div class="modal-body briefing-body">' +
      '    <p class="briefing-lead" id="briefing-lead"></p>' +
      '    <div class="briefing-columns" id="briefing-columns">' +
      '      <section class="briefing-column" id="briefing-last" aria-label="Last interview"></section>' +
      '      <section class="briefing-column briefing-column--today" id="briefing-today" aria-label="Today"></section>' +
      '      <section class="briefing-column" id="briefing-next" aria-label="Next interview"></section>' +
      '    </div>' +
      '  </div>' +
      '  <footer class="modal-footer briefing-footer">' +
      '    <a class="btn btn-secondary" href="interviews.html">Open calendar</a>' +
      '    <button type="button" class="btn btn-primary" data-briefing-close>Got it</button>' +
      '  </footer>' +
      '</div>';

    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', function (event) {
      if (event.target.closest('[data-briefing-close]')) {
        close();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modalEl && !modalEl.hidden) {
        close();
      }
    });

    return modalEl;
  }

  function open() {
    const modal = ensureModal();
    previouslyFocused = document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const closeBtn = modal.querySelector('[data-briefing-close].modal-close');
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function close() {
    if (!modalEl || modalEl.hidden) {
      return;
    }
    modalEl.hidden = true;
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
  }

  function render(schedule) {
    ensureModal();
    const lead = document.getElementById('briefing-lead');
    const hasToday = schedule.today.length > 0;
    const hasNext = schedule.next.length > 0;
    const hasLast = Boolean(schedule.last);

    if (hasToday) {
      lead.textContent =
        'Today is the focus — here is your last interview, today’s schedule, and what’s next.';
    } else if (hasNext) {
      lead.textContent =
        'Nothing on the calendar today. Here’s your last interview and what’s coming up next.';
    } else if (hasLast) {
      lead.textContent =
        'No interviews scheduled ahead. Here’s your most recent one for context.';
    } else {
      lead.textContent =
        'No interviews on the books yet. When you schedule one, it will show up here after you log in.';
    }

    fillColumn(document.getElementById('briefing-last'), {
      label: 'Last time',
      sublabel: schedule.last ? formatDayLabel(schedule.last.dateKey, schedule.todayKey) : null,
      items: schedule.last ? [schedule.last] : [],
      emptyText: 'No past interviews',
    });

    fillColumn(document.getElementById('briefing-today'), {
      label: 'Today',
      sublabel: formatDayLabel(schedule.todayKey, schedule.todayKey),
      items: schedule.today,
      emptyText: 'Clear day',
    });

    fillColumn(document.getElementById('briefing-next'), {
      label: 'Next up',
      sublabel: schedule.next.length
        ? formatDayLabel(schedule.next[0].dateKey, schedule.todayKey)
        : null,
      items: schedule.next,
      emptyText: 'Nothing scheduled',
    });
  }

  async function maybeShow() {
    if (!consumePending()) {
      return false;
    }
    if (!window.JobTrackDataCache) {
      return false;
    }

    try {
      const data = await JobTrackDataCache.ensureLoaded();
      const schedule = buildSchedule(data.applications, data.interviews);
      render(schedule);
      open();
      return true;
    } catch (err) {
      // Login briefing is best-effort — don't block the page on failure.
      return false;
    }
  }

  window.JobTrackInterviewBriefing = {
    markPending: markPending,
    maybeShow: maybeShow,
    close: close,
  };
})();
