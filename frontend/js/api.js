/**
 * Authenticated fetch helper for the JobTrack Spring Boot API.
 */
(function () {
  function getApiUrl() {
    if (!window.JOBTRACK_CONFIG || !window.JOBTRACK_CONFIG.apiUrl) {
      return 'http://localhost:8080';
    }
    return window.JOBTRACK_CONFIG.apiUrl.replace(/\/$/, '');
  }

  async function apiFetch(path, options) {
    const token = await window.JobTrackAuth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const headers = Object.assign(
      { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      options && options.headers ? options.headers : {}
    );

    const response = await fetch(`${getApiUrl()}${path}`, Object.assign({}, options, { headers }));

    if (response.status === 401) {
      window.location.href = 'login.html';
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  }

  window.JobTrackApi = {
    getApiUrl,
    fetch: apiFetch,
  };
})();
