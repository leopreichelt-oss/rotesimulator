/**
 * rosterEngine.js
 * Coleta roster completo (personagens + naves) de cada membro da guilda
 * via Cloudflare Worker → Railway Comlink → API oficial do jogo
 *
 * relic_tier no Comlink: currentTier dentro de relic
 * Naves: combat_type === 2, qualificadas por rarity (estrelas)
 * R5 = relic.currentTier 7, R6 = 8, R7 = 9, R8 = 10, R9 = 11
 */

var COMLINK_URL = 'https://worker-lively-heart-f0a0.leopreichelt.workers.dev'

var rosterEngine = {

  STORAGE_KEY: 'rote_roster_v2',
  STORAGE_DATE_KEY: 'rote_roster_date_v2',

  // Converte relic.currentTier do Comlink para nível real de relic
  toRelicLevel: function(relicTier) {
    if (!relicTier || relicTier < 3) return 0
    return relicTier - 2
  },

  // Verifica se unidade atende ao requisito mínimo
  meetsRequirement: function(unit, relicMin) {
    if (unit.combat_type === 2) return unit.rarity >= 7
    return rosterEngine.toRelicLevel(unit.relic_tier) >= relicMin
  },

  // Coleta roster de um jogador via playerId
  fetchPlayer: function(playerId, playerName, callback) {
    fetch(COMLINK_URL + '/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { playerId: playerId } })
    })
    .then(function(r) { return r.json() })
    .then(function(d) {
      var units = (d.rosterUnit || []).map(function(u) {
        return {
          base_id:     u.definitionId ? u.definitionId.split(':')[0] : '',
          relic_tier:  u.relic ? u.relic.currentTier : 0,
          rarity:      u.currentRarity || 0,
          combat_type: u.definitionId && u.definitionId.includes(':SHIP') ? 2 : 1,
          gear_level:  u.currentLevel || 0
        }
      })
      callback(null, { playerId: playerId, name: playerName, units: units })
    })
    .catch(function(e) { callback('Erro ao buscar ' + playerName + ': ' + e.message) })
  },

  // Coleta roster de todos os membros sequencialmente
  fetchAll: function(members, onProgress, onDone) {
    var rosterMap = {}
    var total = members.length
    var current = 0

    function next() {
      if (current >= total) {
        try {
          localStorage.setItem(rosterEngine.STORAGE_KEY, JSON.stringify(rosterMap))
          localStorage.setItem(rosterEngine.STORAGE_DATE_KEY, new Date().toISOString())
        } catch(e) {}
        return onDone(null, rosterMap)
      }

      var member = members[current]
      current++
      onProgress(current, total, member.name)

      setTimeout(function() {
        rosterEngine.fetchPlayer(member.playerId, member.name, function(err, data) {
          if (!err) rosterMap[member.playerId] = data
          next()
        })
      }, current === 1 ? 0 : 200)
    }

    next()
  },

  // Carrega roster do localStorage
  load: function() {
    try {
      var data = localStorage.getItem(rosterEngine.STORAGE_KEY)
      return data ? JSON.parse(data) : null
    } catch(e) { return null }
  },

  // Data da última sincronização
  lastSyncDate: function() {
    try {
      var d = localStorage.getItem(rosterEngine.STORAGE_DATE_KEY)
      return d ? new Date(d) : null
    } catch(e) { return null }
  },

  // Verifica disponibilidade de personagens nos platoons
  checkAvailability: function(rosterMap, platoonSlots, relicMin) {
    var availability = {}
    platoonSlots.forEach(function(slot) {
      var unitId = slot.unitId || slot
      if (!availability[unitId]) availability[unitId] = []
      Object.values(rosterMap).forEach(function(player) {
        var unit = player.units.find(function(u) { return u.base_id === unitId })
        if (unit && rosterEngine.meetsRequirement(unit, relicMin)) {
          availability[unitId].push({ name: player.name, playerId: player.playerId })
        }
      })
    })
    return availability
  }

}
