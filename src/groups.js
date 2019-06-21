const {makeAPIRequest} = require('./request')

module.exports = {
  createExperimentGroup,
  getExperimentGroupByUuid,
  getExperimentGroups,
  updateExperimentGroup,
}

function getExperimentGroups() {
  return makeAPIRequest('/groups/', 'GET')
}

function getExperimentGroupByUuid(uuid) {
  return makeAPIRequest(`/group/${uuid}`, 'GET')
}

function createExperimentGroup({experiments, name}) {
  return makeAPIRequest('/group/', 'POST', {
    experiments,
    name,
  })
}

function updateExperimentGroup(uuid, {experiments, name}) {
  return makeAPIRequest(`/group/${uuid}`, 'PUT', {
    experiments,
    name,
  })
}
