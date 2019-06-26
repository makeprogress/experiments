let fetch = null

try {
  fetch = require('node-fetch/browser')
} catch (e) {
  fetch = require('node-fetch').default
}

module.exports = fetch