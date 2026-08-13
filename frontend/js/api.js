/**
 * Authenticated fetch helper for the JobTrack Spring Boot API.
 */
(function () {
  function isLocalHost(hostname) {
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }

  function isLocalApiUrl(apiUrl) {
    try {
      const parsed = new URL(apiUrl);
      return isLocalHost(parsed.hostname);
    } catch (err) {
      return false;
    }
  }

  function getApiUrl() {
    let apiUrl = 'http://localhost:8080';
    if (window.JOBTRACK_CONFIG && window.JOBTRACK_CONFIG.apiUrl) {
      apiUrl = window.JOBTRACK_CONFIG.apiUrl.replace(/\/$/, '');
    }

    if (!isLocalHost(window.location.hostname) && isLocalApiUrl(apiUrl)) {
      throw new Error(
        'API is set to ' +
          apiUrl +
          ' but this site is not running locally. Set API_URL in frontend/.env to your Render backend URL, run npm run config, then redeploy.'
      );
    }

    return apiUrl;
  }

  function apiConnectionHint(apiUrl) {
    if (isLocalApiUrl(apiUrl)) {
      return ' Start the Spring Boot backend on port 8080, or set API_URL in frontend/.env to your Render backend URL and run npm run config.';
    }
    return ' Check that the backend is deployed and API_URL in frontend/.env is correct.';
  }

  async function apiFetch(path, options) {
    const token = await window.JobTrackAuth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const apiUrl = getApiUrl();
    const headers = Object.assign(
      { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      options && options.headers ? options.headers : {}
    );

    let response;
    try {
      response = await fetch(apiUrl + path, Object.assign({}, options, { headers }));
    } catch (err) {
      throw new Error('Could not reach the API at API_URL.' + apiConnectionHint(apiUrl));
    }

    if (response.status === 401) {
      if (await window.JobTrackAuth.hasValidUser()) {
        throw new Error(
          'The server rejected your login token. If this keeps happening, verify SUPABASE_JWT_SECRET on the backend matches your Supabase project JWT secret.'
        );
      }
      await window.JobTrackAuth.handleSessionExpired(
        window.location.pathname.split('/').pop()
      );
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  }

  window.JobTrackApi = {
    getApiUrl,
    fetch: apiFetch,
  };
})();
