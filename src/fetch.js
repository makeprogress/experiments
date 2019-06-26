module.exports = typeof location === 'undefined' ? require('node-fetch') : fetch
