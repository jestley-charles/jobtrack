/**
 * Reusable delete confirmation modal — replaces window.confirm() for destructive actions.
 */
(function () {
  let modalEl = null;
  let resolvePending = null;

  function ensureModal() {
    if (modalEl) {
      return modalEl;
    }

    modalEl = document.createElement('div');
    modalEl.className = 'modal confirm-modal';
    modalEl.id = 'confirm-modal';
    modalEl.hidden = true;
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML =
      '<div class="modal-backdrop" data-confirm-close tabindex="-1"></div>' +
      '<div class="modal-dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-message">' +
      '  <header class="modal-header">' +
      '    <h2 id="confirm-modal-title">Confirm delete</h2>' +
      '    <button type="button" class="modal-close" data-confirm-close aria-label="Close">&times;</button>' +
      '  </header>' +
      '  <div class="modal-body">' +
      '    <p id="confirm-modal-message" class="confirm-message"></p>' +
      '  </div>' +
      '  <footer class="modal-footer">' +
      '    <button type="button" class="btn btn-secondary" data-confirm-close id="confirm-modal-cancel">Cancel</button>' +
      '    <button type="button" class="btn btn-danger" id="confirm-modal-confirm">Delete</button>' +
      '  </footer>' +
      '</div>';

    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', function (event) {
      if (event.target.closest('[data-confirm-close]')) {
        close(false);
      }
    });

    document.getElementById('confirm-modal-confirm').addEventListener('click', function () {
      close(true);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && modalEl && !modalEl.hidden) {
        close(false);
      }
    });

    return modalEl;
  }

  function close(confirmed) {
    if (!modalEl || modalEl.hidden) {
      return;
    }
    modalEl.hidden = true;
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    const resolver = resolvePending;
    resolvePending = null;
    if (resolver) {
      resolver(Boolean(confirmed));
    }
  }

  /**
   * @param {object} options
   * @param {string} options.title
   * @param {string} options.message
   * @param {string} [options.confirmLabel='Delete']
   * @param {string} [options.cancelLabel='Cancel']
   * @returns {Promise<boolean>}
   */
  function confirm(options) {
    const opts = options || {};
    const modal = ensureModal();
    const titleEl = document.getElementById('confirm-modal-title');
    const messageEl = document.getElementById('confirm-modal-message');
    const confirmBtn = document.getElementById('confirm-modal-confirm');
    const cancelBtn = document.getElementById('confirm-modal-cancel');

    titleEl.textContent = opts.title || 'Confirm delete';
    messageEl.textContent = opts.message || 'This cannot be undone.';
    confirmBtn.textContent = opts.confirmLabel || 'Delete';
    cancelBtn.textContent = opts.cancelLabel || 'Cancel';

    return new Promise(function (resolve) {
      resolvePending = resolve;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      cancelBtn.focus();
    });
  }

  function dismiss() {
    close(false);
  }

  window.JobTrackConfirm = {
    confirm: confirm,
    dismiss: dismiss,
  };
})();
