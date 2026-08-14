(function () {
  let editingId = null;
  let onSavedCallback = null;

  const modal = document.getElementById('application-modal');
  const form = document.getElementById('application-form');
  const titleEl = document.getElementById('application-modal-title');
  const errorEl = document.getElementById('application-form-error');
  const submitBtn = document.getElementById('application-form-submit');

  function parseOptionalInt(value) {
    if (value === '' || value == null) {
      return null;
    }
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  function isHttpOrHttpsUrl(value) {
    if (!value) {
      return true;
    }
    return /^https?:\/\//i.test(value);
  }

  function buildPayload(formData) {
    const payload = {
      company: formData.get('company').trim(),
      position: formData.get('position').trim(),
      status: formData.get('status'),
    };

    const location = formData.get('location').trim();
    if (location) {
      payload.location = location;
    }

    const jobUrl = formData.get('jobUrl').trim();
    if (jobUrl) {
      if (!isHttpOrHttpsUrl(jobUrl)) {
        throw new Error('Job URL must start with http:// or https://');
      }
      payload.jobUrl = jobUrl;
    }

    const dateApplied = formData.get('dateApplied');
    if (dateApplied) {
      payload.dateApplied = dateApplied;
    }

    const salaryMin = parseOptionalInt(formData.get('salaryMin'));
    const salaryMax = parseOptionalInt(formData.get('salaryMax'));
    if (salaryMin != null) {
      payload.salaryMin = salaryMin;
    }
    if (salaryMax != null) {
      payload.salaryMax = salaryMax;
    }

    return payload;
  }

  async function parseErrorResponse(response) {
    try {
      const body = await response.json();
      if (body.errors && body.errors.length) {
        return body.errors.map(function (entry) {
          return entry.message;
        }).join(' ');
      }
      return body.message || 'Request failed.';
    } catch (err) {
      return 'Request failed.';
    }
  }

  function clearFormErrors() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function openModal() {
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.getElementById('company').focus();
  }

  function closeModal() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    editingId = null;
    form.reset();
    clearFormErrors();
  }

  function fillForm(application) {
    document.getElementById('company').value = application.company || '';
    document.getElementById('position').value = application.position || '';
    document.getElementById('location').value = application.location || '';
    document.getElementById('salaryMin').value =
      application.salaryMin != null ? application.salaryMin : '';
    document.getElementById('salaryMax').value =
      application.salaryMax != null ? application.salaryMax : '';
    document.getElementById('status').value = application.status || 'Wishlist';
    document.getElementById('dateApplied').value = application.dateApplied || '';
    document.getElementById('jobUrl').value = application.jobUrl || '';
  }

  function openForCreate() {
    editingId = null;
    titleEl.textContent = 'Add application';
    submitBtn.textContent = 'Add application';
    form.reset();
    document.getElementById('status').value = 'Wishlist';
    clearFormErrors();
    openModal();
  }

  function openForEdit(application) {
    editingId = application.id;
    titleEl.textContent = 'Edit application';
    submitBtn.textContent = 'Save changes';
    fillForm(application);
    clearFormErrors();
    openModal();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearFormErrors();
    const idleLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = editingId ? 'Saving…' : 'Adding…';

    try {
      const payload = buildPayload(new FormData(form));
      const path = editingId
        ? '/api/applications/' + encodeURIComponent(editingId)
        : '/api/applications';
      const method = editingId ? 'PUT' : 'POST';

      const response = await JobTrackApi.fetch(path, {
        method: method,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        errorEl.textContent = await parseErrorResponse(response);
        errorEl.hidden = false;
        return;
      }

      let saved = null;
      try {
        saved = await response.json();
      } catch (parseErr) {
        saved = null;
      }
      if (saved && window.JobTrackDataCache) {
        JobTrackDataCache.replaceApplication(saved);
      }

      closeModal();
      if (onSavedCallback) {
        onSavedCallback(saved);
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Something went wrong.';
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = idleLabel;
    }
  }

  function init(options) {
    onSavedCallback = options && options.onSaved;

    form.addEventListener('submit', handleSubmit);

    modal.querySelectorAll('[data-modal-close]').forEach(function (element) {
      element.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });
  }

  window.JobTrackApplicationForm = {
    init: init,
    openForCreate: openForCreate,
    openForEdit: openForEdit,
  };
})();
