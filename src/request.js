const {API_URL} = require('./constants/api')

const axios = require('axios')

const isPOJsO = (obj) => Object.prototype.toString.call(obj) === '[object Object]'

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
    .then(({data}) => data)
    .then(({errors, result}) => {
      if (errors) {
        return handleAPIErrors(errors)
      }

      return result
    })
}

function makeRawAPIRequest(path, options, data) {
  const url = isPOJsO(options) && options.apiUrl ? options.apiUrl : API_URL

  return axios(`${url}${path}`, getAPIOptions(options, data))
    .then(handleAPIUnauthorized)
    .catch((e) => handleAPIErrors([e]))
}

function getAPIOptions(options, data = {}) {
  const headers = getAPIHeaders(options)

  return {
    data: JSON.stringify(options.body || data),
    headers: Object.assign(headers, options.headers || {}),
    method: options.method ? options.method.toLowerCase() : 'get',
    withCredentials: true,
  }
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

  if (options.apiUrl.indexOf('.rapidapi.com') > -1) {
    headers['x-rapidapi-host'] = options.apiUrl
  }

  if (options.rapidAPIKey) {
    headers['x-rapidapi-key'] = options.rapidAPIKey
  } else {
    if (options.authToken) {
      headers.Authorization = `Bearer ${options.authToken}`
    }

    if (options.apiKey) {
      headers['X-API-Key'] = options.apiKey
    }
  }

  if (options.experimentState) {
    headers['X-Experiment-State'] = options.experimentState
  }

  return headers
}
