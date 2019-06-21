const {API_URL: BASE_API_URL} = require('./src/constants/api')
const {makeAPIRequest, makeRawAPIRequest} = require('./src/request')

const requestCache = new Map()

// NOTE: Intentionally left with an ambiguous global parent.
bostonExperiments = {}

module.exports = createExperimentClient
module.exports.createExperimentClient = createExperimentClient
module.exports.getGlobalExperiment = getGlobalExperiment
module.exports.setGlobalExperiment = setGlobalExperiment

function createExperimentClient(options = {}) {
  const EXPERIMENTS = {}
  let API_KEY = null
  let API_URL = BASE_API_URL
  let AUTH_TOKEN = null
  let EXPERIMENT_STATE = null

  if (Object.prototype.toString.call(options) === '[object Object]') {
    API_KEY = options.apiKey
    API_URL = options.apiUrl || BASE_API_URL
  } else if (typeof options === 'string') {
    API_KEY = options
  }

  /* --- API Methods --- */
  function getExperiments() {
    return makeAPIRequest('/experiments/', {
      apiKey: getAPIKey(),
      apiUrl: API_URL,
      authToken: getAuthToken(),
      experimentState: getExperimentState(),
      method: 'GET',
    })
      .then((experiments) => {
        for (const experiment of experiments) {
          setGlobalExperiment(experiment.uuid, experiment)
        }

        return experiments
      })
  }

  function getExperimentById(uuid) {
    return makeAPIRequest(`/experiment/${uuid}/`, {
      apiKey: getAPIKey(),
      apiUrl: API_URL,
      authToken: getAuthToken(),
      experimentState: getExperimentState(),
      method: 'GET',
    })
      .then((experiment) => {
        setGlobalExperiment(experiment.uuid, experiment)

        return experiment
      })
  }

  function createExperiment({name}) {
    return makeAPIRequest('/experiment/', {
      apiKey: getAPIKey(),
      apiUrl: API_URL,
      authToken: getAuthToken(),
      body: {name},
      experimentState: getExperimentState(),
      method: 'POST',
    })
  }

  function deleteExperiment(uuid) {
    return makeAPIRequest(`/experiment/${uuid}`, {
      apiKey: getAPIKey(),
      apiUrl: API_URL,
      authToken: getAuthToken(),
      body: {name},
      experimentState: getExperimentState(),
      method: 'DELETE',
    })
  }

  function updateExperiment(uuid, {description, enabled, name, percent}) {
    return makeAPIRequest(`/experiment/${uuid}`, {
      apiKey: getAPIKey(),
      apiUrl: API_URL,
      authToken: getAuthToken(),
      body: {
        description,
        enabled,
        name,
        percent,
      },
      experimentState: getExperimentState(),
      method: 'PUT',
    })
  }

  /* --- Experiment Client Methods --- */
  function isExperimentActive(uuid, context) {
    if (requestCache.has(uuid)) {
      return requestCache.get(uuid)
        .then((response) => response.json())
        .then(({result: active}) => active)
    }

    // NOTE: Short circuit our short circuits if context is provided.
    if (!(context && context.uniqueId)) {
      // NOTE: we can use our backed out global experiment state or localStorage to short circuit.
      const localStorageExperimentState = getForeverExperiment(uuid)

      if (localStorageExperimentState !== null) {
        return Promise.resolve(experimentStateToBool(localStorageExperimentState))
      }

      // NOTE: We can check if there is already a global experiment to pass.
      const globalExperiment = getGlobalExperiment(uuid)

      if (globalExperiment && globalExperiment.hasOwnProperty('active')) { // eslint-disable-line no-prototype-builtins
        return Promise.resolve(globalExperiment.active)
      }
    }

    // NOTE: If there's a cookie, it will be passed along, but if the cookie
    // was deleted, or we're in node.js, we need need to make sure we pick it up.
    // NOTE: This makes it's own API request because of the special need for the raw response
    const request = makeRawAPIRequest(`/experiment/${uuid}/active/`, {
      apiKey: getAPIKey(),
      apiUrl: API_URL,
      authToken: getAuthToken(),
      body: Object.prototype.toString.call(context) === '[object Object]' ? context : {
        uniqueId: context,
      },
      experimentState: getExperimentState(),
      method: 'GET',
    })
    requestCache.set(uuid, request)

    return Promise.resolve(request)
      .then((response) => {
        // NOTE: On the response side, we make sure to set our mem, "local storage", and cookie, if we can.
        const {headers} = response
        const {'x-experiment-state': state} = headers

        // NOTE: Sets our header, read by the header generator
        setExperimentState(state)

        return response.json()
      })
      .then(({result: active}) => {
        // NOTE: Sets our experiment in the global experiment state
        setGlobalExperiment(uuid, {active})

        // NOTE: Sets our experiment in localStorage (response takes care of the cookie).
        setForeverExperiment(uuid, active)

        return active
      })
      .catch(() => false)
  }

  /* ---  API Auth Methods --- */
  function getAPIKey() {
    return AUTH_TOKEN
  }

  function getAPIUrl() {
    return API_URL
  }

  function getAuthToken() {
    return AUTH_TOKEN
  }

  function setAPIKey(token = API_KEY) {
    API_KEY = token
  }

  function setAPIUrl(url) {
    API_URL = url
  }

  function setAuthToken(token = AUTH_TOKEN) {
    AUTH_TOKEN = token
  }

  /* --- Experiment State Methods --- */
  // NOTE: These methods are not public-facing.
  function getExperimentState() {
    return EXPERIMENT_STATE
  }

  function getLocalExperimentByUuid(uuid) {
    return EXPERIMENTS[uuid]
  }

  function setExperimentState(state) {
    EXPERIMENT_STATE = state
  }

  return {
    createExperiment,
    deleteExperiment,
    getAPIKey,
    getAPIUrl,
    getAuthToken,
    getExperiment: getExperimentById,
    getExperimentById,
    getExperiments,
    getLocalExperiment: getLocalExperimentByUuid,
    getLocalExperimentByUuid,
    isExperimentActive,
    setAPIKey,
    setAPIUrl,
    setAuthToken,
    updateExperiment,
  }
}

/* --- Global Experiment Methods --- */
function getGlobalExperiment(uuid) {
  return bostonExperiments[uuid]
}

function setGlobalExperiment(uuid, experiment) {
  if (Object.keys(experiment).length) {
    if (!bostonExperiments[uuid]) {
      bostonExperiments[uuid] = {}
    }

    Object.assign(bostonExperiments[uuid], experiment)
  }

  return bostonExperiments[uuid]
}

/* --- Forever Experiment Utilities --- */
function getForeverExperiment(uuid) {
  if (sessionStorage !== undefined) {
    return sessionStorage.getItem(`_bexp_${uuid}`)
  }

  return null
}

function setForeverExperiment(uuid, active) {
  if (sessionStorage !== undefined) {
    sessionStorage.setItem(`_bexp_${uuid}`, boolToExperimentState(active))
  }
}

function experimentStateToBool(state) {
  return state === 'active'
}

function boolToExperimentState(bool) {
  return bool || bool === 'active' ? 'active' : 'inactive'
}
