if (typeof location === 'undefined') {
  module.exports = require('node-fetch') // eslint-disable-line global-require
} else {
  module.exports = fetch
}
