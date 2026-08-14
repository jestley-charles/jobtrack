(function () {
  const STATUS_BADGE_CLASS = {
    Wishlist: 'status-badge--wishlist',
    Applied: 'status-badge--applied',
    Interview: 'status-badge--interview',
    Offer: 'status-badge--offer',
    Rejected: 'status-badge--rejected',
  };

  const KANBAN_STATUSES = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];
  const VIEW_STORAGE_KEY = 'jobtrack.jobsView';
  const LIST_PAGE_SIZE = 10;
  const STATUS_SAVE_DELAY_MS = 4000;
  const POINTER_DRAG_THRESHOLD_PX = 8;
  const TOUCH_LONG_PRESS_MS = 400;
  const TOUCH_SCROLL_CANCEL_PX = 10;

  let cachedApplications = [];
  let currentView = 'list';
  const pendingStatusSaves = {};

  const listPager = JobTrackPagination.create({
    pageSize: LIST_PAGE_SIZE,
    container: document.getElementById('jobs-list-pager'),
    onChange: function () {
      paintListPage();
    },
  });

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

  function readStoredView() {
    try {
      const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === 'board' || stored === 'list') {
        return stored;
      }
    } catch (err) {
      // ignore storage errors
    }
    return 'list';
  }

  function persistView(view) {
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch (err) {
      // ignore storage errors
    }
  }

  function updateViewToggleUi() {
    document.querySelectorAll('.jobs-view-btn').forEach(function (btn) {
      const isActive = btn.dataset.view === currentView;
      btn.classList.toggle('jobs-view-btn--active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function showActiveView() {
    const listEl = document.getElementById('jobs-content');
    const boardEl = document.getElementById('kanban-board');
    const hasData = cachedApplications.length > 0;

    listEl.hidden = !(hasData && currentView === 'list');
    boardEl.hidden = !(hasData && currentView === 'board');
  }

  function setView(view) {
    if (view !== 'list' && view !== 'board') {
      return;
    }
    currentView = view;
    persistView(view);
    updateViewToggleUi();
    showActiveView();
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

  function renderList(applications) {
    const tbody = document.getElementById('applications-tbody');
    tbody.replaceChildren();
    applications.forEach(function (application) {
      tbody.appendChild(renderApplicationRow(application));
    });
  }

  function paintListPage() {
    const state = listPager.paint(cachedApplications);
    renderList(state.items);
  }

  function isFinePointer() {
    return window.matchMedia('(pointer: fine)').matches;
  }

  function createKanbanDragHandle() {
    const handle = document.createElement('button');
    handle.type = 'button';
    handle.className = 'kanban-card-drag-handle';
    handle.setAttribute('aria-label', 'Drag to move card');
    handle.draggable = isFinePointer();

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 16 16');
    icon.setAttribute('aria-hidden', 'true');
    icon.classList.add('kanban-card-drag-handle-icon');

    const dots = [
      [5, 4],
      [11, 4],
      [5, 8],
      [11, 8],
      [5, 12],
      [11, 12],
    ];
    dots.forEach(function (coords) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(coords[0]));
      circle.setAttribute('cy', String(coords[1]));
      circle.setAttribute('r', '1.25');
      icon.appendChild(circle);
    });

    handle.appendChild(icon);
    return handle;
  }

  function getKanbanDragHandle(card) {
    return card ? card.querySelector('.kanban-card-drag-handle') : null;
  }

  function createKanbanCard(application) {
    const card = document.createElement('article');
    card.className = 'kanban-card';
    card.dataset.applicationId = application.id;
    card.draggable = false;

    const handle = createKanbanDragHandle();
    card.appendChild(handle);

    const link = document.createElement('a');
    link.className = 'kanban-card-link';
    link.href = 'application.html?id=' + encodeURIComponent(application.id);
    link.draggable = false;

    const company = document.createElement('h3');
    company.className = 'kanban-card-company';
    company.textContent = application.company;

    const position = document.createElement('p');
    position.className = 'kanban-card-position';
    position.textContent = application.position;

    link.appendChild(company);
    link.appendChild(position);

    if (application.location) {
      const location = document.createElement('p');
      location.className = 'kanban-card-meta';
      location.textContent = application.location;
      link.appendChild(location);
    }

    card.appendChild(link);
    return card;
  }

  function clearColumnDragOver() {
    document.querySelectorAll('.kanban-column--drag-over').forEach(function (column) {
      column.classList.remove('kanban-column--drag-over');
    });
  }

  function findApplication(applicationId) {
    return cachedApplications.find(function (application) {
      return application.id === applicationId;
    }) || null;
  }

  function applyStatusChangeLocally(applicationId, newStatus) {
    if (KANBAN_STATUSES.indexOf(newStatus) === -1) {
      return false;
    }

    const application = findApplication(applicationId);
    if (!application || application.status === newStatus) {
      return false;
    }

    application.status = newStatus;
    if (application.updatedAt != null) {
      application.updatedAt = new Date().toISOString();
    }
    JobTrackDataCache.replaceApplication(application);
    paintListPage();
    renderKanban(cachedApplications);
    hideJobsError();
    return true;
  }

  async function persistStatusChange(applicationId, status) {
    try {
      await JobTrackApi.fetchJson(
        '/api/applications/' + encodeURIComponent(applicationId) + '/status',
        {
          method: 'PATCH',
          body: JSON.stringify({ status: status }),
        }
      );
    } catch (err) {
      showJobsError(err.message || 'Could not save application status.');
    }
  }

  function scheduleStatusSave(applicationId, newStatus) {
    const pending = pendingStatusSaves[applicationId];
    if (pending && pending.timer) {
      window.clearTimeout(pending.timer);
    }

    pendingStatusSaves[applicationId] = {
      status: newStatus,
      timer: window.setTimeout(function () {
        delete pendingStatusSaves[applicationId];
        persistStatusChange(applicationId, newStatus);
      }, STATUS_SAVE_DELAY_MS),
    };
  }

  /**
   * Update UI immediately; PATCH status after the user stops moving cards.
   */
  function moveApplicationStatus(applicationId, newStatus) {
    if (!applyStatusChangeLocally(applicationId, newStatus)) {
      return;
    }
    scheduleStatusSave(applicationId, newStatus);
  }

  function flushPendingStatusSaves() {
    Object.keys(pendingStatusSaves).forEach(function (applicationId) {
      const pending = pendingStatusSaves[applicationId];
      if (!pending) {
        return;
      }
      window.clearTimeout(pending.timer);
      persistStatusChange(applicationId, pending.status);
      delete pendingStatusSaves[applicationId];
    });
  }

  function hideJobsError() {
    const errorEl = document.getElementById('jobs-error');
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function showJobsError(message) {
    const errorEl = document.getElementById('jobs-error');
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function columnAtPoint(clientX, clientY) {
    const target = document.elementFromPoint(clientX, clientY);
    if (!target) {
      return null;
    }
    const column = target.closest('.kanban-column');
    return column && document.getElementById('kanban-board').contains(column) ? column : null;
  }

  function highlightDropColumn(column) {
    if (!column) {
      clearColumnDragOver();
      return;
    }
    if (!column.classList.contains('kanban-column--drag-over')) {
      clearColumnDragOver();
      column.classList.add('kanban-column--drag-over');
    }
  }

  function createDragGhost(card) {
    const ghost = card.cloneNode(true);
    ghost.classList.add('kanban-drag-ghost');
    ghost.classList.remove(
      'kanban-card--dragging',
      'kanban-card--lifted',
      'kanban-card--pending-drag'
    );
    ghost.style.width = card.getBoundingClientRect().width + 'px';
    document.body.appendChild(ghost);
    return ghost;
  }

  function positionDragGhost(ghost, clientX, clientY) {
    ghost.style.left = clientX + 'px';
    ghost.style.top = clientY + 'px';
  }

  function removeDragGhost(ghost) {
    if (ghost && ghost.parentNode) {
      ghost.parentNode.removeChild(ghost);
    }
  }

  function resetCardDragState(card) {
    if (!card) {
      return;
    }
    card.classList.remove(
      'kanban-card--dragging',
      'kanban-card--lifted',
      'kanban-card--pending-drag'
    );
    const handle = getKanbanDragHandle(card);
    if (handle) {
      handle.draggable = isFinePointer();
    }
  }

  function wireKanbanDragAndDrop() {
    const board = document.getElementById('kanban-board');
    let draggedId = null;
    let dragDidMove = false;
    let suppressClick = false;
    let pointerDrag = null;

    function clearPointerDrag(options) {
      if (!pointerDrag) {
        return;
      }

      const drag = pointerDrag;
      pointerDrag = null;

      if (drag.longPressTimer) {
        window.clearTimeout(drag.longPressTimer);
      }

      resetCardDragState(drag.card);
      removeDragGhost(drag.ghost);
      board.classList.remove('kanban-board--drag-active');
      clearColumnDragOver();

      if (options && options.suppressClick) {
        suppressClick = true;
      }
    }

    function activateTouchDrag(event) {
      if (!pointerDrag || pointerDrag.mode !== 'armed') {
        return;
      }

      pointerDrag.mode = 'dragging';
      pointerDrag.card.classList.add('kanban-card--dragging');
      board.classList.add('kanban-board--drag-active');
      pointerDrag.ghost = createDragGhost(pointerDrag.card);
      positionDragGhost(pointerDrag.ghost, event.clientX, event.clientY);

      try {
        pointerDrag.card.setPointerCapture(event.pointerId);
      } catch (err) {
        // ignore capture errors
      }
    }

    board.addEventListener('dragstart', function (event) {
      if (pointerDrag) {
        event.preventDefault();
        return;
      }

      const handle = event.target.closest('.kanban-card-drag-handle');
      if (!handle || !board.contains(handle)) {
        event.preventDefault();
        return;
      }

      const card = handle.closest('.kanban-card');
      if (!card) {
        event.preventDefault();
        return;
      }

      draggedId = card.dataset.applicationId;
      dragDidMove = false;

      const cardRect = card.getBoundingClientRect();
      event.dataTransfer.setDragImage(
        card,
        event.clientX - cardRect.left,
        event.clientY - cardRect.top
      );
      card.classList.add('kanban-card--dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', draggedId);
    });

    board.addEventListener('drag', function () {
      if (draggedId) {
        dragDidMove = true;
      }
    });

    board.addEventListener('dragend', function (event) {
      const card = event.target.closest('.kanban-card');
      if (card) {
        card.classList.remove('kanban-card--dragging');
      }
      clearColumnDragOver();
      if (dragDidMove) {
        suppressClick = true;
      }
      draggedId = null;
      dragDidMove = false;
    });

    board.addEventListener('dragover', function (event) {
      const column = event.target.closest('.kanban-column');
      if (!column || !board.contains(column) || !draggedId) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      highlightDropColumn(column);
    });

    board.addEventListener('dragleave', function (event) {
      const column = event.target.closest('.kanban-column');
      if (!column || !board.contains(column)) {
        return;
      }

      const related = event.relatedTarget;
      if (related && column.contains(related)) {
        return;
      }
      column.classList.remove('kanban-column--drag-over');
    });

    board.addEventListener('drop', function (event) {
      const column = event.target.closest('.kanban-column');
      if (!column || !board.contains(column)) {
        return;
      }

      event.preventDefault();
      clearColumnDragOver();

      const applicationId =
        event.dataTransfer.getData('text/plain') || draggedId;
      const newStatus = column.dataset.status;
      if (!applicationId || !newStatus) {
        return;
      }

      moveApplicationStatus(applicationId, newStatus);
    });

    board.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || pointerDrag) {
        return;
      }

      const handle = event.target.closest('.kanban-card-drag-handle');
      if (!handle || !board.contains(handle)) {
        return;
      }

      const card = handle.closest('.kanban-card');
      if (!card) {
        return;
      }

      const isTouch = event.pointerType === 'touch';
      pointerDrag = {
        card: card,
        applicationId: card.dataset.applicationId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        isTouch: isTouch,
        mode: isTouch ? 'pending' : 'mouse-pending',
        ghost: null,
        longPressTimer: null,
      };

      if (isTouch) {
        card.classList.add('kanban-card--pending-drag');
        pointerDrag.longPressTimer = window.setTimeout(function () {
          if (!pointerDrag || pointerDrag.mode !== 'pending') {
            return;
          }
          pointerDrag.mode = 'armed';
          pointerDrag.card.classList.add('kanban-card--lifted');
          if (navigator.vibrate) {
            navigator.vibrate(12);
          }
        }, TOUCH_LONG_PRESS_MS);
      }
    });

    board.addEventListener('pointermove', function (event) {
      if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) {
        return;
      }

      const deltaX = event.clientX - pointerDrag.startX;
      const deltaY = event.clientY - pointerDrag.startY;
      const distance = Math.hypot(deltaX, deltaY);

      if (pointerDrag.mode === 'pending') {
        if (distance > TOUCH_SCROLL_CANCEL_PX) {
          clearPointerDrag();
        }
        return;
      }

      if (pointerDrag.mode === 'armed') {
        activateTouchDrag(event);
      }

      if (pointerDrag.mode === 'mouse-pending') {
        if (distance < POINTER_DRAG_THRESHOLD_PX) {
          return;
        }
        pointerDrag.mode = 'dragging';
        pointerDrag.card.classList.add('kanban-card--dragging');
        board.classList.add('kanban-board--drag-active');
        pointerDrag.ghost = createDragGhost(pointerDrag.card);
        positionDragGhost(pointerDrag.ghost, event.clientX, event.clientY);
        try {
          pointerDrag.card.setPointerCapture(event.pointerId);
        } catch (err) {
          // ignore capture errors
        }
      }

      if (pointerDrag.mode === 'dragging') {
        event.preventDefault();
        if (pointerDrag.ghost) {
          positionDragGhost(pointerDrag.ghost, event.clientX, event.clientY);
        }
        highlightDropColumn(columnAtPoint(event.clientX, event.clientY));
      }
    });

    function finishPointerDrag(event) {
      if (!pointerDrag || event.pointerId !== pointerDrag.pointerId) {
        return;
      }

      const activeDrag = pointerDrag;
      const didDrag = activeDrag.mode === 'dragging';

      if (didDrag) {
        const column = columnAtPoint(event.clientX, event.clientY);
        const newStatus = column ? column.dataset.status : null;
        if (newStatus) {
          moveApplicationStatus(activeDrag.applicationId, newStatus);
        }
      }

      clearPointerDrag({ suppressClick: didDrag });

      try {
        activeDrag.card.releasePointerCapture(event.pointerId);
      } catch (err) {
        // ignore release errors
      }
    }

    board.addEventListener('pointerup', finishPointerDrag);
    board.addEventListener('pointercancel', finishPointerDrag);

    board.addEventListener(
      'click',
      function (event) {
        if (!suppressClick) {
          return;
        }
        suppressClick = false;
        if (
          event.target.closest('.kanban-card-link') ||
          event.target.closest('.kanban-card-drag-handle')
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    window.addEventListener('pagehide', flushPendingStatusSaves);
  }

  function renderKanban(applications) {
    const byStatus = {};
    KANBAN_STATUSES.forEach(function (status) {
      byStatus[status] = [];
    });

    applications.forEach(function (application) {
      const status = application.status;
      if (byStatus[status]) {
        byStatus[status].push(application);
      }
    });

    KANBAN_STATUSES.forEach(function (status) {
      const cardsEl = document.querySelector('[data-kanban-cards="' + status + '"]');
      const countEl = document.querySelector('[data-kanban-count="' + status + '"]');
      const items = byStatus[status];

      cardsEl.replaceChildren();
      items.forEach(function (application) {
        cardsEl.appendChild(createKanbanCard(application));
      });

      countEl.textContent = String(items.length);
    });
  }

  function updateCountLabel(count) {
    const countEl = document.getElementById('jobs-count');
    const label = count === 1 ? 'application' : 'applications';
    countEl.textContent = count + ' ' + label;
    countEl.hidden = false;
  }

  function renderApplications(applications) {
    const sorted = sortApplications(applications);
    cachedApplications = sorted;
    updateCountLabel(sorted.length);
    paintListPage();
    renderKanban(sorted);
    showActiveView();
  }

  function showApplicationsResult(applications, options) {
    const loadingEl = document.getElementById('jobs-loading');
    const emptyEl = document.getElementById('jobs-empty');
    const listEl = document.getElementById('jobs-content');
    const boardEl = document.getElementById('kanban-board');
    const countEl = document.getElementById('jobs-count');
    const resetPage = Boolean(options && options.resetPage);

    loadingEl.hidden = true;

    if (!applications.length) {
      emptyEl.hidden = false;
      listEl.hidden = true;
      boardEl.hidden = true;
      countEl.hidden = true;
      cachedApplications = [];
      listPager.reset();
      listPager.paint([]);
      return;
    }

    if (resetPage) {
      listPager.reset();
    }
    emptyEl.hidden = true;
    renderApplications(applications);
  }

  function paintFromCache() {
    const data = JobTrackDataCache.peek();
    if (!data) {
      return false;
    }
    document.getElementById('jobs-error').hidden = true;
    showApplicationsResult(data.applications);
    return true;
  }

  async function loadApplications(options) {
    const force = Boolean(options && options.force);
    const loadingEl = document.getElementById('jobs-loading');
    const errorEl = document.getElementById('jobs-error');
    const emptyEl = document.getElementById('jobs-empty');
    const listEl = document.getElementById('jobs-content');
    const boardEl = document.getElementById('kanban-board');
    const countEl = document.getElementById('jobs-count');
    const refreshBtn = document.getElementById('jobs-refresh-btn');
    const paintedFromCache = !force && JobTrackDataCache.hasData();

    if (!paintedFromCache) {
      loadingEl.hidden = false;
      emptyEl.hidden = true;
      listEl.hidden = true;
      boardEl.hidden = true;
      countEl.hidden = true;
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
      showApplicationsResult(data.applications, { resetPage: force });
    } catch (err) {
      loadingEl.hidden = true;
      if (JobTrackDataCache.hasData()) {
        const data = JobTrackDataCache.peek();
        showApplicationsResult(data.applications);
      } else {
        emptyEl.hidden = true;
        listEl.hidden = true;
        boardEl.hidden = true;
        countEl.hidden = true;
      }
      errorEl.textContent = err.message || 'Something went wrong loading applications.';
      errorEl.hidden = false;
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false;
      }
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

  function wireViewToggle() {
    document.querySelectorAll('.jobs-view-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setView(btn.dataset.view);
      });
    });
  }

  currentView = readStoredView();
  updateViewToggleUi();
  if (!paintFromCache()) {
    document.getElementById('jobs-loading').hidden = false;
  }

  JobTrackAppShell.init({ page: 'jobs' }).then(function (session) {
    if (!session) {
      return;
    }

    JobTrackApplicationForm.init({
      onSaved: function () {
        loadApplications({ force: true });
      },
    });
    document.getElementById('jobs-refresh-btn').addEventListener('click', function () {
      loadApplications({ force: true });
    });
    wireAddButtons();
    wireViewToggle();
    wireKanbanDragAndDrop();
    if (JobTrackDataCache.hasData()) {
      return;
    }
    loadApplications();
  });
})();
