(function () {
  let editingId = null;
  let lockedApplicationId = null;
  let onSavedCallback = null;
  let applicationsCache = [];

  const modal = document.getElementById('interview-modal');
  const form = document.getElementById('interview-form');
  const titleEl = document.getElementById('interview-modal-title');
  const errorEl = document.getElementById('interview-form-error');
  const submitBtn = document.getElementById('interview-form-submit');
  const applicationField = document.getElementById('interview-application-field');
  const applicationSelect = document.getElementById('interviewApplicationId');

  function toDatetimeLocalValue(isoDateTime) {
    if (!isoDateTime) {
      return '';
    }
    const date = new Date(isoDateTime);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
  }

  function fromDatetimeLocalValue(value) {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  }

  function populateApplicationOptions(selectedId) {
    applicationSelect.replaceChildren();

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select an application';
    applicationSelect.appendChild(placeholder);

    applicationsCache
      .slice()
      .sort(function (a, b) {
        return (a.company || '').localeCompare(b.company || '');
      })
      .forEach(function (app) {
        const option = document.createElement('option');
        option.value = app.id;
        option.textContent =
          (app.company || 'Unknown') + (app.position ? ' — ' + app.position : '');
        applicationSelect.appendChild(option);
      });

    if (selectedId) {
      applicationSelect.value = selectedId;
    }
  }

  function buildPayload(formData, includeApplicationId) {
    const interviewDate = fromDatetimeLocalValue(formData.get('interviewDate'));
    const payload = {
      interviewDate: interviewDate,
    };

    if (includeApplicationId) {
      payload.applicationId = formData.get('applicationId');
    }

    const interviewType = formData.get('interviewType').trim();
    if (interviewType) {
      payload.interviewType = interviewType;
    }

    const interviewer = formData.get('interviewer').trim();
    if (interviewer) {
      payload.interviewer = interviewer;
    }

    const notes = formData.get('notes').trim();
    if (notes) {
      payload.notes = notes;
    }

    const result = formData.get('result').trim();
    if (result) {
      payload.result = result;
    }

    return payload;
  }

  async function parseErrorResponse(response) {
    try {
      const body = await response.json();
      if (body.errors && body.errors.length) {
        return body.errors
          .map(function (entry) {
            return entry.message;
          })
          .join(' ');
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

    if (!applicationField.hidden) {
      applicationSelect.focus();
    } else {
      document.getElementById('interviewDate').focus();
    }
  }

  function closeModal() {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    editingId = null;
    lockedApplicationId = null;
    form.reset();
    clearFormErrors();
  }

  function fillForm(interview) {
    document.getElementById('interviewDate').value = toDatetimeLocalValue(
      interview.interviewDate
    );
    document.getElementById('interviewType').value = interview.interviewType || '';
    document.getElementById('interviewer').value = interview.interviewer || '';
    document.getElementById('interviewNotes').value = interview.notes || '';
    document.getElementById('interviewResult').value = interview.result || '';
  }

  function openForCreate(options) {
    editingId = null;
    lockedApplicationId = options && options.applicationId ? options.applicationId : null;
    titleEl.textContent = 'Add interview';
    submitBtn.textContent = 'Add interview';
    form.reset();
    clearFormErrors();

    if (lockedApplicationId) {
      applicationField.hidden = true;
      applicationSelect.required = false;
      applicationSelect.value = lockedApplicationId;
    } else {
      applicationField.hidden = false;
      applicationSelect.required = true;
      populateApplicationOptions(
        options && options.preselectedApplicationId
          ? options.preselectedApplicationId
          : ''
      );
    }

    if (options && options.defaultDate) {
      document.getElementById('interviewDate').value = toDatetimeLocalValue(
        options.defaultDate
      );
    }

    openModal();
  }

  function openForEdit(interview) {
    editingId = interview.id;
    lockedApplicationId = interview.applicationId;
    titleEl.textContent = 'Edit interview';
    submitBtn.textContent = 'Save changes';
    applicationField.hidden = true;
    applicationSelect.required = false;
    applicationSelect.value = interview.applicationId || '';
    fillForm(interview);
    clearFormErrors();
    openModal();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearFormErrors();

    const formData = new FormData(form);
    const isCreate = !editingId;
    const applicationId = isCreate
      ? lockedApplicationId || formData.get('applicationId')
      : null;

    if (isCreate && !applicationId) {
      errorEl.textContent = 'Select an application for this interview.';
      errorEl.hidden = false;
      return;
    }

    const interviewDate = fromDatetimeLocalValue(formData.get('interviewDate'));
    if (!interviewDate) {
      errorEl.textContent = 'Enter a valid interview date and time.';
      errorEl.hidden = false;
      return;
    }

    submitBtn.disabled = true;

    try {
      const payload = buildPayload(formData, isCreate);
      if (isCreate) {
        payload.applicationId = applicationId;
      }

      const path = editingId ? '/api/interviews/' + editingId : '/api/interviews';
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

      closeModal();
      if (onSavedCallback) {
        onSavedCallback();
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Something went wrong.';
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  }

  function setApplications(applications) {
    applicationsCache = Array.isArray(applications) ? applications : [];
  }

  function init(options) {
    onSavedCallback = options && options.onSaved;
    if (options && options.applications) {
      setApplications(options.applications);
    }

    form.addEventListener('submit', handleSubmit);

    modal.querySelectorAll('[data-interview-modal-close]').forEach(function (element) {
      element.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });
  }

  window.JobTrackInterviewForm = {
    init: init,
    setApplications: setApplications,
    openForCreate: openForCreate,
    openForEdit: openForEdit,
  };
})();
