/**
 * deployTracker.js
 * Rastreia o progresso de deploy de platoons por planeta/op durante uma ROTE.
 *
 * Storage: rote_deploy_v1_ALLYCODE
 *   { planetName: { "1": true, "2": true, ... } }
 *
 * "Op marcada" = o oficial confirmou que todos os slots daquela op foram
 * preenchidos no jogo. Estado é por op (granularidade prática para o oficial).
 */

var deployTracker = {

  STORAGE_KEY: 'rote_deploy_v1',

  _key: function() {
    var ac = localStorage.getItem('rote_allycode') || ''
    return ac ? (deployTracker.STORAGE_KEY + '_' + ac) : deployTracker.STORAGE_KEY
  },

  load: function() {
    try {
      var d = localStorage.getItem(deployTracker._key())
      return d ? JSON.parse(d) : {}
    } catch(e) { return {} }
  },

  save: function(data) {
    try { localStorage.setItem(deployTracker._key(), JSON.stringify(data)) } catch(e) {}
  },

  mark: function(planet, op) {
    var s = deployTracker.load()
    if (!s[planet]) s[planet] = {}
    s[planet][String(op)] = true
    deployTracker.save(s)
  },

  unmark: function(planet, op) {
    var s = deployTracker.load()
    if (s[planet]) {
      delete s[planet][String(op)]
      if (Object.keys(s[planet]).length === 0) delete s[planet]
    }
    deployTracker.save(s)
  },

  toggle: function(planet, op) {
    if (deployTracker.isMarked(planet, op)) {
      deployTracker.unmark(planet, op)
    } else {
      deployTracker.mark(planet, op)
    }
  },

  isMarked: function(planet, op) {
    var s = deployTracker.load()
    return !!(s[planet] && s[planet][String(op)])
  },

  // Retorna { done, total } para uma lista de planetas
  getProgress: function(planets) {
    var s = deployTracker.load()
    var done = 0, total = 0

    planets.forEach(function(planetName) {
      var nOps = deployTracker._numOpsForPlanet(planetName)
      for (var op = 1; op <= nOps; op++) {
        total++
        if (s[planetName] && s[planetName][String(op)]) done++
      }
    })

    return { done: done, total: total }
  },

  // Número de ops configuradas para um planeta
  _numOpsForPlanet: function(planetName) {
    var platoonKey = (typeof PLANET_PLATOON_KEY !== 'undefined') ? PLANET_PLATOON_KEY[planetName] : null
    var requirements = platoonKey && (typeof platoonRequirements !== 'undefined') ? platoonRequirements[platoonKey] : null
    if (!requirements) return 0
    // Usar o número de ops configurado no state, senão o total disponível no requisito
    var configured = (typeof state !== 'undefined' && state.planets && state.planets[planetName])
      ? Number(state.planets[planetName].platoons) || 0
      : 0
    return configured > 0 ? configured : Object.keys(requirements).length
  },

  // Reseta o deploy state de uma lista de planetas (novo evento ROTE)
  resetPlanets: function(planets) {
    var s = deployTracker.load()
    planets.forEach(function(p) { delete s[p] })
    deployTracker.save(s)
  },

  // Reseta tudo
  resetAll: function() {
    deployTracker.save({})
  }

}
