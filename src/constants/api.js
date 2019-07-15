const {version} = require('../../package.json')

const API_ORIGIN = 'https://api.toggles.co'

const [majorVersion] = version.split('.')

let API_URL = `${API_ORIGIN}/v${majorVersion}`

module.exports = {
  API_ORIGIN,
  get API_URL() {
    return API_URL
  },
  set API_URL(url) {
    API_URL = url
  },
  getAPIUrl() {
    return this.API_URL
  },
  setAPIUrl(url) {
    this.API_URL = url
  },
}
