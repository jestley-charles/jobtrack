(function () {
  const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MAX_CHIPS_PER_DAY = 2;

  let viewYear = 0;
  let viewMonth = 0;
  let selectedDateKey = '';
  /** @type {Record<string, Array>} */
  let interviewsByDate = {};
  let applicationsCache = [];

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function parseDateKey(dateKey) {
    const parts = dateKey.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function formatMonthLabel(year, month) {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }

  function formatAgendaHeading(dateKey) {
    const todayKey = localDateKey(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = localDateKey(tomorrow);

    if (dateKey === todayKey) {
      return 'Today';
    }
    if (dateKey === tomorrowKey) {
      return 'Tomorrow';
    }

    return parseDateKey(dateKey).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatInterviewTime(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function buildInterviewsByDate(applications, interviews) {
    const appById = {};
    applications.forEach(function (app) {
      appById[app.id] = app;
    });

    const byDate = {};

    interviews.forEach(function (interview) {
      if (!interview.interviewDate) {
        return;
      }
      const date = new Date(interview.interviewDate);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const app = appById[interview.applicationId];
      const item = {
        id: interview.id,
        applicationId: interview.applicationId,
        interviewDate: interview.interviewDate,
        interviewType: interview.interviewType || 'Interview',
        interviewer: interview.interviewer || '',
        notes: interview.notes || '',
        result: interview.result || '',
        company: app ? app.company : 'Unknown company',
        position: app ? app.position : '',
      };

      const key = localDateKey(date);
      if (!byDate[key]) {
        byDate[key] = [];
      }
      byDate[key].push(item);
    });

    Object.keys(byDate).forEach(function (key) {
      byDate[key].sort(function (a, b) {
        return a.interviewDate.localeCompare(b.interviewDate);
      });
    });

    return byDate;
  }

  function renderWeekdayHeaders() {
    const container = document.getElementById('calendar-weekdays');
    container.replaceChildren();
    WEEKDAY_LABELS.forEach(function (label) {
      const cell = document.createElement('div');
      cell.className = 'interview-calendar-weekday';
      cell.textContent = label;
      container.appendChild(cell);
    });
  }

  function setSelectedDate(dateKey) {
    selectedDateKey = dateKey;
    renderCalendarGrid();
    renderAgenda();
  }

  function renderCalendarGrid() {
    const grid = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('calendar-month-label');
    monthLabel.textContent = formatMonthLabel(viewYear, viewMonth);

    const todayKey = localDateKey(new Date());
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startOffset = firstOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    grid.replaceChildren();

    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalCells; i += 1) {
      let cellYear = viewYear;
      let cellMonth = viewMonth;
      let cellDay;
      let inMonth = true;

      if (i < startOffset) {
        inMonth = false;
        cellDay = prevMonthDays - startOffset + i + 1;
        cellMonth = viewMonth - 1;
        if (cellMonth < 0) {
          cellMonth = 11;
          cellYear -= 1;
        }
      } else if (i >= startOffset + daysInMonth) {
        inMonth = false;
        cellDay = i - (startOffset + daysInMonth) + 1;
        cellMonth = viewMonth + 1;
        if (cellMonth > 11) {
          cellMonth = 0;
          cellYear += 1;
        }
      } else {
        cellDay = i - startOffset + 1;
      }

      const dateKey = localDateKey(new Date(cellYear, cellMonth, cellDay));
      const dayInterviews = interviewsByDate[dateKey] || [];

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'interview-calendar-day';
      cell.setAttribute('role', 'gridcell');
      cell.dataset.date = dateKey;

      if (!inMonth) {
        cell.classList.add('interview-calendar-day--outside');
      }
      if (dateKey === todayKey) {
        cell.classList.add('interview-calendar-day--today');
      }
      if (dateKey === selectedDateKey) {
        cell.classList.add('interview-calendar-day--selected');
      }
      if (dayInterviews.length) {
        cell.classList.add('interview-calendar-day--has-events');
      }

      const dayNum = document.createElement('span');
      dayNum.className = 'interview-calendar-day-num';
      dayNum.textContent = String(cellDay);
      cell.appendChild(dayNum);

      if (dayInterviews.length) {
        const chips = document.createElement('div');
        chips.className = 'interview-calendar-chips';

        dayInterviews.slice(0, MAX_CHIPS_PER_DAY).forEach(function (item) {
          const chip = document.createElement('span');
          chip.className = 'interview-calendar-chip';
          chip.textContent = formatInterviewTime(item.interviewDate) + ' ' + item.company;
          chips.appendChild(chip);
        });

        if (dayInterviews.length > MAX_CHIPS_PER_DAY) {
          const more = document.createElement('span');
          more.className = 'interview-calendar-more';
          more.textContent = '+' + (dayInterviews.length - MAX_CHIPS_PER_DAY) + ' more';
          chips.appendChild(more);
        }

        cell.appendChild(chips);

        const mobileDot = document.createElement('span');
        mobileDot.className = 'interview-calendar-dot';
        mobileDot.setAttribute('aria-hidden', 'true');
        cell.appendChild(mobileDot);
      }

      const ariaLabel =
        parseDateKey(dateKey).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }) +
        (dayInterviews.length
          ? ', ' + dayInterviews.length + ' interview' + (dayInterviews.length === 1 ? '' : 's')
          : '');
      cell.setAttribute('aria-label', ariaLabel);
      if (dateKey === selectedDateKey) {
        cell.setAttribute('aria-current', 'date');
      }

      cell.addEventListener('click', function () {
        setSelectedDate(dateKey);
      });

      grid.appendChild(cell);
    }
  }

  function renderAgenda() {
    const headingEl = document.getElementById('agenda-date-label');
    const listEl = document.getElementById('agenda-list');
    const emptyEl = document.getElementById('agenda-empty');
    const items = interviewsByDate[selectedDateKey] || [];

    headingEl.textContent = formatAgendaHeading(selectedDateKey);

    if (!items.length) {
      listEl.hidden = true;
      emptyEl.hidden = false;
      listEl.replaceChildren();
      return;
    }

    emptyEl.hidden = true;
    listEl.hidden = false;
    listEl.replaceChildren();

    items.forEach(function (item) {
      const li = document.createElement('li');
      li.className = 'interview-agenda-item';

      const timeEl = document.createElement('time');
      timeEl.className = 'interview-agenda-time';
      timeEl.dateTime = item.interviewDate;
      timeEl.textContent = formatInterviewTime(item.interviewDate);

      const body = document.createElement('div');
      body.className = 'interview-agenda-body';

      const companyLink = document.createElement('a');
      companyLink.className = 'interview-agenda-company';
      companyLink.href = 'application.html?id=' + encodeURIComponent(item.applicationId);
      companyLink.textContent = item.company;

      const meta = document.createElement('p');
      meta.className = 'interview-agenda-meta';
      const metaParts = [item.interviewType];
      if (item.position) {
        metaParts.push(item.position);
      }
      if (item.interviewer) {
        metaParts.push(item.interviewer);
      }
      meta.textContent = metaParts.join(' · ');

      body.appendChild(companyLink);
      body.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'interview-agenda-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-secondary btn-sm';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', function () {
        JobTrackInterviewForm.openForEdit(item);
      });

      actions.appendChild(editBtn);

      li.appendChild(timeEl);
      li.appendChild(body);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
  }

  function shiftMonth(delta) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    viewYear = next.getFullYear();
    viewMonth = next.getMonth();

    const selected = parseDateKey(selectedDateKey);
    if (selected.getFullYear() !== viewYear || selected.getMonth() !== viewMonth) {
      selectedDateKey = localDateKey(new Date(viewYear, viewMonth, 1));
    }

    renderCalendarGrid();
    renderAgenda();
  }

  function goToToday() {
    const today = new Date();
    viewYear = today.getFullYear();
    viewMonth = today.getMonth();
    setSelectedDate(localDateKey(today));
  }

  function bindToolbar() {
    document.getElementById('calendar-prev').addEventListener('click', function () {
      shiftMonth(-1);
    });
    document.getElementById('calendar-next').addEventListener('click', function () {
      shiftMonth(1);
    });
    document.getElementById('calendar-today').addEventListener('click', goToToday);
  }

  function defaultDateForSelectedDay() {
    if (!selectedDateKey) {
      return new Date().toISOString();
    }
    const date = parseDateKey(selectedDateKey);
    date.setHours(10, 0, 0, 0);
    return date.toISOString();
  }

  function openAddInterview() {
    if (!applicationsCache.length) {
      alert('Add an application first, then schedule an interview for it.');
      return;
    }
    JobTrackInterviewForm.openForCreate({
      defaultDate: defaultDateForSelectedDay(),
    });
  }

  function applyLoadedData(applications, interviews, preserveSelection) {
    applicationsCache = applications;
    JobTrackInterviewForm.setApplications(applications);
    interviewsByDate = buildInterviewsByDate(applications, interviews);

    if (!preserveSelection || !selectedDateKey) {
      const today = new Date();
      viewYear = today.getFullYear();
      viewMonth = today.getMonth();
      selectedDateKey = localDateKey(today);
    } else {
      const selected = parseDateKey(selectedDateKey);
      viewYear = selected.getFullYear();
      viewMonth = selected.getMonth();
    }

    renderWeekdayHeaders();
    renderCalendarGrid();
    renderAgenda();
  }

  async function loadInterviews(options) {
    const preserveSelection = options && options.preserveSelection;
    const force = Boolean(options && options.force);
    const loadingEl = document.getElementById('interviews-loading');
    const errorEl = document.getElementById('interviews-error');
    const contentEl = document.getElementById('interviews-content');
    const refreshBtn = document.getElementById('interviews-refresh-btn');
    const wasLoaded = !contentEl.hidden;
    const hadCache = JobTrackDataCache.hasData();

    if ((!wasLoaded && !hadCache) || force) {
      loadingEl.hidden = false;
      if (!wasLoaded) {
        contentEl.hidden = true;
      }
    }
    errorEl.hidden = true;
    errorEl.textContent = '';
    if (refreshBtn) {
      refreshBtn.disabled = true;
    }

    try {
      const data = force
        ? await JobTrackDataCache.refresh()
        : await JobTrackDataCache.ensureLoaded();

      applyLoadedData(data.applications, data.interviews, preserveSelection);

      loadingEl.hidden = true;
      contentEl.hidden = false;
    } catch (err) {
      loadingEl.hidden = true;
      if (!wasLoaded && !JobTrackDataCache.hasData()) {
        contentEl.hidden = true;
      }
      errorEl.textContent = err.message || 'Something went wrong loading interviews.';
      errorEl.hidden = false;
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
      }
    }
  }

  JobTrackAppShell.init({ page: 'interviews' }).then(function (session) {
    if (!session) {
      return;
    }

    JobTrackInterviewForm.init({
      onSaved: function () {
        loadInterviews({ preserveSelection: true, force: true });
      },
    });

    bindToolbar();
    document.getElementById('add-interview-btn').addEventListener('click', openAddInterview);
    document.getElementById('interviews-refresh-btn').addEventListener('click', function () {
      loadInterviews({ preserveSelection: true, force: true });
    });
    loadInterviews();
  });
})();