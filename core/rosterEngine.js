/**
 * rosterEngine.js
 * Dado uma lista de membros (com allycode), coleta o roster completo de cada um.
 * Armazena em localStorage para evitar re-coleta desnecessária.
 *
 * relic_tier no swgoh.gg = relic_nível + 2
 * Ex: R5 = relic_tier 7, R6 = 8, R7 = 9, R8 = 10, R9 = 11
 * Naves: combat_type === 2, não têm relic, usam rarity (estrelas)
 */

var rosterEngine = {

  STORAGE_KEY: 'rote_roster_v1',
  STORAGE_DATE_KEY: 'rote_roster_date_v1',

  // Converte relic_tier da API para nível real de relic
  // relic_tier 3 = R1, 4 = R2 ... 11 = R9. Abaixo de 3 = sem relic (G13 ou menos)
  toRelicLevel: function(relic_tier) {
    if (!relic_tier || relic_tier < 3) return 0
    return relic_tier - 2
  },

  // Verifica se uma unidade atende ao requisito mínimo de relic/estrelas para uma fase
  // Para personagens: relicMin é o nível mínimo (ex: 5 para F1)
  // Para naves: sempre precisa de 7 estrelas
  meetsRequirement: function(unit, relicMin) {
    if (unit.combat_type === 2) {
      return unit.rarity >= 7
    }
    return rosterEngine.toRelicLevel(unit.relic_tier) >= relicMin
  },

  // Coleta roster de um jogador
  // callback(err, { allycode, name, units: [{base_id, relic_tier, rarity, combat_type}] })
  fetchPlayer: function(allycode, callback) {
    fetch('https://swgoh.gg/api/player/' + allycode + '/')
      .then(function(r) { return r.json() })
      .then(function(d) {
        var units = d.units.map(function(u) {
          return {
            base_id:      u.data.base_id,
            relic_tier:   u.data.relic_tier,
            rarity:       u.data.rarity,
            combat_type:  u.data.combat_type,
            gear_level:   u.data.gear_level,
            level:        u.data.level
          }
        })
        callback(null, {
          allycode: allycode,
          name: d.data.name,
          units: units
        })
      })
      .catch(function(e) { callback('Erro ao buscar jogador ' + allycode + ': ' + e.message) })
  },

  // Coleta roster de todos os membros da guilda sequencialmente
  // onProgress(current, total, playerName) — atualiza UI durante coleta
  // onDone(err, rosterMap) — rosterMap[allycode] = { name, units }
  fetchAll: function(members, onProgress, onDone) {
    var rosterMap = {}
    var total = members.length
    var current = 0

    function next() {
      if (current >= total) {
        // Salvar no localStorage
        try {
          localStorage.setItem(rosterEngine.STORAGE_KEY, JSON.stringify(rosterMap))
          localStorage.setItem(rosterEngine.STORAGE_DATE_KEY, new Date().toISOString())
        } catch(e) {}
        return onDone(null, rosterMap)
      }

      var member = members[current]
      current++
      onProgress(current, total, member.name)

      // Delay de 300ms entre chamadas para não sobrecarregar a API
      setTimeout(function() {
        rosterEngine.fetchPlayer(member.allycode, function(err, data) {
          if (!err) rosterMap[member.allycode] = data
          next()
        })
      }, current === 1 ? 0 : 300)
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

  // Para cada unitId do platoon, conta quantos jogadores têm o personagem
  // no nível mínimo exigido
  // Retorna: { unitId: [{ name, allycode }] } — lista de jogadores que TÊM o personagem
  checkAvailability: function(rosterMap, platoonSlots, relicMin) {
    var availability = {}

    platoonSlots.forEach(function(slot) {
      var unitId = slot.unitId || slot
      if (!availability[unitId]) availability[unitId] = []

      Object.values(rosterMap).forEach(function(player) {
        var unit = player.units.find(function(u) { return u.base_id === unitId })
        if (unit && rosterEngine.meetsRequirement(unit, relicMin)) {
          availability[unitId].push({ name: player.name, allycode: player.allycode })
        }
      })
    })

    return availability
  }

}
