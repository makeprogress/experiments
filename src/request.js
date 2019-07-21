const {API_URL} = require('./constants/api')

const fetch = require('isomorphic-fetch')

class APIError extends Error {
  constructor(message = 'The API returned an error that could not be handled.') {
    super(message)
  }
}

module.exports = {
  APIError,
  makeAPIRequest,
  makeRawAPIRequest,
}

function makeAPIRequest(...args) {
  return makeRawAPIRequest(...args)
    .then((response) => response.json())
    .then(({errors, result}) => {
      if (errors) {
        return handleAPIErrors(errors)
      }

      return result
    })
}

function makeRawAPIRequest(path, options, data) {
  const url = Object.prototype.toString.call(options) === '[object Object]' &&
    options.apiUrl ? options.apiUrl : API_URL

  return fetch(`${url}${path}`, getAPIOptions(options, data))
    .then(handleAPIUnauthorized)
    .catch((e) => handleAPIErrors([e]))
}

function getAPIOptions(options = 'GET', data = {}) {
  const headers = getAPIHeaders(options)
  const APIOptions = {
    credentials: 'same-origin',
    headers,
    method: 'GET',
  }

  if (Object.prototype.toString.call(options) === '[object Object]') {
    Object.assign(APIOptions, {
      headers: Object.assign(headers, options.headers || {}),
      method: options.method || 'GET',
    })
  } else if (typeof options === 'string') {
    APIOptions.headers = headers
    APIOptions.method = options
  }

  if (APIOptions.method.toLowerCase() !== 'get') {
    if (options.body) {
      APIOptions.body = JSON.stringify(options.body)
    } else if (data) {
      APIOptions.body = JSON.stringify(data)
    }
  }

  return APIOptions
}

function handleAPIErrors(errors) {
  if (Array.isArray(errors)) {
    if (errors.length === 0) {
      return Promise.reject(new Error('The error returned more errors than could be handled.'))
    }

    return Promise.reject(errors[0])
  }

  return Promise.reject(new APIError())
}

function handleAPIUnauthorized(response) {
  if ([401, 403].includes(response.status)) {
    return Promise.reject(new Error('Unauthorized'))
  }

  if (response.status > 399 && response.status < 505) {
    return Promise.reject(new APIError())
  }

  return response
}

function getAPIHeaders(options) {
  const headers = {'Content-Type': 'application/json'}

  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`
  }

  if (options.apiKey) {
    headers['X-API-Key'] = options.apiKey
  }

  if (options.experimentState) {
    headers['X-Experiment-State'] = options.experimentState
  }

  return headers
}
