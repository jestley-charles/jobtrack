/**
 * Client-side list paging helpers (full datasets already in JobTrackDataCache).
 */
window.JobTrackPagination = (function () {
  function clampPage(page, totalPages) {
    if (totalPages < 1) {
      return 1;
    }
    return Math.min(Math.max(1, page), totalPages);
  }

  function paginate(items, page, pageSize) {
    const list = items || [];
    const totalItems = list.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    const safePage = totalPages === 0 ? 1 : clampPage(page, totalPages);
    const start = (safePage - 1) * pageSize;

    return {
      items: list.slice(start, start + pageSize),
      page: safePage,
      pageSize: pageSize,
      totalItems: totalItems,
      totalPages: totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
      startIndex: totalItems === 0 ? 0 : start + 1,
      endIndex: Math.min(start + pageSize, totalItems),
    };
  }

  function renderControls(container, state, onPageChange) {
    if (!container) {
      return;
    }

    if (state.totalPages <= 1) {
      container.hidden = true;
      container.replaceChildren();
      return;
    }

    container.hidden = false;
    container.replaceChildren();
    container.classList.add('list-pager');

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn btn-secondary btn-sm';
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = !state.hasPrev;
    prevBtn.addEventListener('click', function () {
      if (state.hasPrev) {
        onPageChange(state.page - 1);
      }
    });

    const info = document.createElement('span');
    info.className = 'list-pager-info';
    info.textContent =
      state.startIndex +
      '–' +
      state.endIndex +
      ' of ' +
      state.totalItems;

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn btn-secondary btn-sm';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = !state.hasNext;
    nextBtn.addEventListener('click', function () {
      if (state.hasNext) {
        onPageChange(state.page + 1);
      }
    });

    container.appendChild(prevBtn);
    container.appendChild(info);
    container.appendChild(nextBtn);
  }

  /**
   * @param {{ pageSize: number, container: HTMLElement|null, onChange: function(): void }} options
   */
  function create(options) {
    const pageSize = options.pageSize;
    const container = options.container;
    const onChange = options.onChange;
    let page = 1;

    function paint(items) {
      const state = paginate(items, page, pageSize);
      page = state.page;
      renderControls(container, state, function (nextPage) {
        page = nextPage;
        if (typeof onChange === 'function') {
          onChange();
        }
      });
      return state;
    }

    function reset() {
      page = 1;
    }

    return {
      paint: paint,
      reset: reset,
      getPage: function () {
        return page;
      },
    };
  }

  return {
    paginate: paginate,
    renderControls: renderControls,
    create: create,
  };
})();
