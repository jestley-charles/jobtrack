/**
 * Session-scoped cache for list API data so nav page switches don't re-fetch.
 * First ensureLoaded() hits the network; later calls reuse sessionStorage until
 * refresh() / invalidate() / logout.
 */
(function () {
  var STORAGE_KEY = 'jobtrack.dataCache.v1';
  var memory = null;
  var loadPromise = null;

  function cloneList(list) {
    return Array.isArray(list) ? list.slice() : [];
  }

  function emptyState(userId) {
    return {
      userId: userId || null,
      applications: null,
      interviews: null,
    };
  }

  function readStore() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function writeStore(state) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      // Quota / private mode — keep in-memory only.
    }
  }

  function clearStore() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      // ignore
    }
  }

  async function currentUserId() {
    var session = await window.JobTrackAuth.getSession();
    return session && session.user ? session.user.id : null;
  }

  function hydrateFromStore(userId) {
    var stored = readStore();
    if (!stored || stored.userId !== userId) {
      return null;
    }
    if (!Array.isArray(stored.applications) || !Array.isArray(stored.interviews)) {
      return null;
    }
    memory = {
      userId: userId,
      applications: cloneList(stored.applications),
      interviews: cloneList(stored.interviews),
    };
    return memory;
  }

  function persist() {
    if (!memory || !Array.isArray(memory.applications) || !Array.isArray(memory.interviews)) {
      return;
    }
    writeStore({
      userId: memory.userId,
      applications: memory.applications,
      interviews: memory.interviews,
    });
  }

  function hasMemoryData() {
    return Boolean(
      memory &&
        Array.isArray(memory.applications) &&
        Array.isArray(memory.interviews)
    );
  }

  function hasData() {
    if (hasMemoryData()) {
      return true;
    }
    var stored = readStore();
    return Boolean(
      stored &&
        Array.isArray(stored.applications) &&
        Array.isArray(stored.interviews)
    );
  }

  function getApplications() {
    return hasMemoryData() ? cloneList(memory.applications) : null;
  }

  function getInterviews() {
    return hasMemoryData() ? cloneList(memory.interviews) : null;
  }

  function getApplicationById(id) {
    if (!hasMemoryData() || !id) {
      return null;
    }
    var found = memory.applications.find(function (app) {
      return app.id === id;
    });
    return found ? Object.assign({}, found) : null;
  }

  function setApplications(list) {
    if (!memory) {
      memory = emptyState(null);
    }
    memory.applications = cloneList(list);
    if (Array.isArray(memory.interviews)) {
      persist();
    }
  }

  function setInterviews(list) {
    if (!memory) {
      memory = emptyState(null);
    }
    memory.interviews = cloneList(list);
    if (Array.isArray(memory.applications)) {
      persist();
    }
  }

  function replaceApplication(application) {
    if (!application || !application.id) {
      return;
    }
    if (!memory) {
      memory = emptyState(null);
    }
    if (!Array.isArray(memory.applications)) {
      memory.applications = [];
    }
    if (!Array.isArray(memory.interviews)) {
      memory.interviews = [];
    }
    var index = memory.applications.findIndex(function (app) {
      return app.id === application.id;
    });
    if (index === -1) {
      memory.applications.push(application);
    } else {
      memory.applications[index] = application;
    }
    persist();
  }

  function removeApplication(applicationId) {
    if (!hasMemoryData() || !applicationId) {
      return;
    }
    memory.applications = memory.applications.filter(function (app) {
      return app.id !== applicationId;
    });
    memory.interviews = memory.interviews.filter(function (interview) {
      return interview.applicationId !== applicationId;
    });
    persist();
  }

  function replaceInterview(interview) {
    if (!interview || !interview.id) {
      return;
    }
    if (!memory) {
      memory = emptyState(null);
    }
    if (!Array.isArray(memory.interviews)) {
      memory.interviews = [];
    }
    if (!Array.isArray(memory.applications)) {
      memory.applications = [];
    }
    var index = memory.interviews.findIndex(function (item) {
      return item.id === interview.id;
    });
    if (index === -1) {
      memory.interviews.push(interview);
    } else {
      memory.interviews[index] = interview;
    }
    persist();
  }

  function removeInterview(interviewId) {
    if (!hasMemoryData() || !interviewId) {
      return;
    }
    memory.interviews = memory.interviews.filter(function (interview) {
      return interview.id !== interviewId;
    });
    persist();
  }

  function invalidate() {
    memory = null;
    loadPromise = null;
    clearStore();
  }

  async function fetchAll(userId) {
    var results = await Promise.all([
      window.JobTrackApi.fetchJsonList('/api/applications'),
      window.JobTrackApi.fetchJsonList('/api/interviews'),
    ]);
    memory = {
      userId: userId,
      applications: cloneList(results[0]),
      interviews: cloneList(results[1]),
    };
    persist();
    return {
      applications: getApplications(),
      interviews: getInterviews(),
    };
  }

  /**
   * Sync read of sessionStorage into memory for instant paint on nav.
   * Does not hit the network. Call before auth finishes.
   * @returns {{applications: Array, interviews: Array}|null}
   */
  function peek() {
    if (hasMemoryData()) {
      return {
        applications: getApplications(),
        interviews: getInterviews(),
      };
    }
    var stored = readStore();
    if (
      !stored ||
      !Array.isArray(stored.applications) ||
      !Array.isArray(stored.interviews)
    ) {
      return null;
    }
    memory = {
      userId: stored.userId || null,
      applications: cloneList(stored.applications),
      interviews: cloneList(stored.interviews),
    };
    return {
      applications: getApplications(),
      interviews: getInterviews(),
    };
  }

  /**
   * Return cached lists, or fetch once per session (per user).
   * @returns {Promise<{applications: Array, interviews: Array}>}
   */
  async function ensureLoaded() {
    var userId = await currentUserId();
    if (!userId) {
      throw new Error('Not authenticated');
    }

    if (hasMemoryData() && memory.userId === userId) {
      return {
        applications: getApplications(),
        interviews: getInterviews(),
      };
    }

    if (hasMemoryData() && memory.userId && memory.userId !== userId) {
      invalidate();
    }

    var hydrated = hydrateFromStore(userId);
    if (hydrated) {
      return {
        applications: getApplications(),
        interviews: getInterviews(),
      };
    }

    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = fetchAll(userId).finally(function () {
      loadPromise = null;
    });
    return loadPromise;
  }

  /**
   * Force a network reload of applications + interviews.
   * @returns {Promise<{applications: Array, interviews: Array}>}
   */
  async function refresh() {
    var userId = await currentUserId();
    if (!userId) {
      throw new Error('Not authenticated');
    }
    loadPromise = null;
    memory = null;
    clearStore();
    loadPromise = fetchAll(userId).finally(function () {
      loadPromise = null;
    });
    return loadPromise;
  }

  async function refreshApplications() {
    var userId = await currentUserId();
    if (!userId) {
      throw new Error('Not authenticated');
    }
    var applications = await window.JobTrackApi.fetchJsonList('/api/applications');
    if (!memory || memory.userId !== userId) {
      memory = emptyState(userId);
    }
    memory.userId = userId;
    memory.applications = cloneList(applications);
    if (!Array.isArray(memory.interviews)) {
      memory.interviews = [];
    }
    persist();
    return getApplications();
  }

  async function refreshInterviews() {
    var userId = await currentUserId();
    if (!userId) {
      throw new Error('Not authenticated');
    }
    var interviews = await window.JobTrackApi.fetchJsonList('/api/interviews');
    if (!memory || memory.userId !== userId) {
      memory = emptyState(userId);
    }
    memory.userId = userId;
    memory.interviews = cloneList(interviews);
    if (!Array.isArray(memory.applications)) {
      memory.applications = [];
    }
    persist();
    return getInterviews();
  }

  window.JobTrackDataCache = {
    hasData: hasData,
    peek: peek,
    ensureLoaded: ensureLoaded,
    refresh: refresh,
    refreshApplications: refreshApplications,
    refreshInterviews: refreshInterviews,
    invalidate: invalidate,
    getApplications: getApplications,
    getInterviews: getInterviews,
    getApplicationById: getApplicationById,
    setApplications: setApplications,
    setInterviews: setInterviews,
    replaceApplication: replaceApplication,
    removeApplication: removeApplication,
    replaceInterview: replaceInterview,
    removeInterview: removeInterview,
  };
})();
