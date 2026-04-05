/**
 * rosterEngine.js
 * Coleta roster via Cloudflare Worker → Railway Comlink → API do jogo
 *
 * relic_tier no Comlink: relic.currentTier
 * R5=7, R6=8, R7=9, R8=10, R9=11
 * Naves identificadas pela lista SHIP_IDS
 */

var COMLINK_URL = 'https://worker-lively-heart-f0a0.leopreichelt.workers.dev'

// IDs de naves conhecidas no ROTE (extraídas do platoonRequirements)
var SHIP_IDS = {
  "CAPITALCHIMAERA":1,"CAPITALEXECUTOR":1,"CAPITALFINALIZER":1,
  "CAPITALJEDICRUISER":1,"CAPITALLEVIATHAN":1,"CAPITALMALEVOLENCE":1,
  "CAPITALMONCALAMARICRUISER":1,"CAPITALNEGOTIATOR":1,"CAPITALPROFUNDITY":1,
  "CAPITALRADDUS":1,"CAPITALSTARDESTROYER":1,"COMMANDSHUTTLE":1,
  "EBONHAWK":1,"EMPERORSSHUTTLE":1,"FURYCLASSINTERCEPTOR":1,
  "GAUNTLETSTARFIGHTER":1,"GEONOSIANSTARFIGHTER2":1,"GEONOSIANSTARFIGHTER3":1,
  "GHOST":1,"HOUNDSTOOTH":1,"HYENABOMBER":1,"IDENVERSIOEMPIRE":1,
  "IG2000":1,"JEDISTARFIGHTERANAKIN":1,"JEDISTARFIGHTERCONSULAR":1,
  "MG100STARFORTRESSSF17":1,"MILLENNIUMFALCON":1,"MILLENNIUMFALCONPRISTINE":1,
  "OUTRIDER":1,"PHANTOM2":1,"RAVENSCLAW":1,"RAZORCREST":1,
  "SCYTHE":1,"SITHBOMBER":1,"SITHFIGHTER":1,"SITHINFILTRATOR":1,
  "SITHPALPATINE":1,"SITHSUPREMACYCLASS":1,"SLAVE1":1,"SMUGGLERCHEWBACCA":1,
  "STAP":1,"TIEADVANCED":1,"TIEBOMBERIMPERIAL":1,"TIEDAGGER":1,
  "TIEFIGHTERFIRSTORDER":1,"TIEFIGHTERFOSF":1,"TIEFIGHTERIMPERIAL":1,
  "TIEFIGHTERPILOT":1,"TIEINTERCEPTOR":1,"TIEREAPER":1,"TIESILENCER":1,
  "TRIPLEZERO":1,"UMBARANSTARFIGHTER":1,"UWINGROGUEONE":1,"UWINGSCARIF":1,
  "VULTUREDROID":1,"XANADUBLOOD":1,"XWINGBLACKONE":1,"XWINGRED2":1,
  "XWINGRED3":1,"XWINGRESISTANCE":1,"YWINGCLONEWARS":1,"YWINGREBEL":1,
  "FIRSTORDERTIEECHELON":1,"BT1":1,"COMEUPPANCE":1,
  "ARC170CLONESERGEANT":1,"ARC170REX":1,"BLADEOFDORIN":1
}

var rosterEngine = {

  STORAGE_KEY: 'rote_roster_v2',
  STORAGE_DATE_KEY: 'rote_roster_date_v2',
  ACTIVITY_KEY: 'rote_activity_v1',
  GUILD_GP_KEY: 'rote_guild_gp_v1',

  toRelicLevel: function(relicTier) {
    if (!relicTier || relicTier < 3) return 0
    return relicTier - 2
  },

  isShip: function(baseId) {
    return !!SHIP_IDS[baseId]
  },

  meetsRequirement: function(unit, relicMin) {
    if (unit.combat_type === 2) return unit.rarity >= 7
    return rosterEngine.toRelicLevel(unit.relic_tier) >= relicMin
  },

  fetchPlayer: function(playerId, fallbackName, callback) {
    fetch(COMLINK_URL + '/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { playerId: playerId } })
    })
    .then(function(r) { return r.json() })
    .then(function(d) {
      var playerName = d.name || fallbackName || playerId

      var units = (d.rosterUnit || []).map(function(u) {
        var defId = u.definitionId || ''
        var baseId = defId.split(':')[0]
        // Rarity vem do definitionId: UNIT:THREE_STAR → 3
        var rarityMap = {
          'ONE_STAR':1,'TWO_STAR':2,'THREE_STAR':3,
          'FOUR_STAR':4,'FIVE_STAR':5,'SIX_STAR':6,'SEVEN_STAR':7
        }
        var rarityStr = defId.split(':')[1] || ''
        var rarity = rarityMap[rarityStr] || u.currentRarity || 0

        return {
          base_id:     baseId,
          relic_tier:  u.relic ? (u.relic.currentTier || 0) : 0,
          rarity:      rarity,
          combat_type: rosterEngine.isShip(baseId) ? 2 : 1,
          level:       u.currentLevel || 0
        }
      })

      callback(null, { playerId: playerId, name: playerName, units: units })
    })
    .catch(function(e) { callback('Erro ' + (fallbackName||playerId) + ': ' + e.message) })
  },

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
      onProgress(current, total, member.name || ('Jogador ' + current))

      setTimeout(function() {
        rosterEngine.fetchPlayer(member.playerId, member.name, function(err, data) {
          if (!err) rosterMap[member.playerId] = data
          next()
        })
      }, current === 1 ? 0 : 200)
    }

    next()
  },

  load: function() {
    try {
      var d = localStorage.getItem(rosterEngine.STORAGE_KEY)
      return d ? JSON.parse(d) : null
    } catch(e) { return null }
  },

  // Salva mapa de atividade { playerId: 'ativo'|'margem'|'inativo' }
  saveActivity: function(activityMap) {
    try { localStorage.setItem(rosterEngine.ACTIVITY_KEY, JSON.stringify(activityMap)) } catch(e) {}
  },

  loadActivity: function() {
    try {
      var d = localStorage.getItem(rosterEngine.ACTIVITY_KEY)
      return d ? JSON.parse(d) : {}
    } catch(e) { return {} }
  },

  // Salva GP real por jogador { playerId: gp }
  saveGuildGP: function(gpMap) {
    try { localStorage.setItem(rosterEngine.GUILD_GP_KEY, JSON.stringify(gpMap)) } catch(e) {}
  },

  loadGuildGP: function() {
    try {
      var d = localStorage.getItem(rosterEngine.GUILD_GP_KEY)
      return d ? JSON.parse(d) : {}
    } catch(e) { return {} }
  },

  // Retorna rosterMap excluindo inativos E margem identificada
  // (margem não contribui com platoons/batalhas — GP já foi descontado individualmente)
  loadActive: function() {
    var rosterMap = rosterEngine.load()
    if (!rosterMap) return null
    var activity = rosterEngine.loadActivity()
    var result = {}
    Object.keys(rosterMap).forEach(function(pid) {
      var status = activity[pid]
      if (status !== 'inativo' && status !== 'margem') {
        result[pid] = rosterMap[pid]
      }
    })
    return result
  },

  lastSyncDate: function() {
    try {
      var d = localStorage.getItem(rosterEngine.STORAGE_DATE_KEY)
      return d ? new Date(d) : null
    } catch(e) { return null }
  },

  // Para cada slot do platoon, retorna quais jogadores têm o personagem no nível mínimo
  checkAvailability: function(rosterMap, platoonSlots, relicMin) {
    var availability = {}
    platoonSlots.forEach(function(slot) {
      var unitId = slot.unitId || slot
      if (!availability[unitId]) availability[unitId] = []
      Object.values(rosterMap).forEach(function(player) {
        var unit = player.units.find(function(u) { return u.base_id === unitId })
        if (unit && rosterEngine.meetsRequirement(unit, relicMin)) {
          availability[unitId].push(player.name)
        }
      })
    })
    return availability
  }

}
