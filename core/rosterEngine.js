/**
 * rosterEngine.js
 * Coleta roster via Cloudflare Worker -> Railway Comlink -> API do jogo
 *
 * relic_tier no Comlink: relic.currentTier
 * R5=7, R6=8, R7=9, R8=10, R9=11
 * Naves identificadas pela lista SHIP_IDS
 *
 * Cada unidade armazenada tem os campos:
 *   base_id, relic_tier, rarity, combat_type, level, gp, mods
 *
 * mods: array de { tier, level, set, shape, primaryStatId, speedBonus }
 *   tier  : 1-6 (E/D/C/B/A/S)
 *   level : 1-15
 *   set   : 1-8 (decodificado do definitionId)
 *   shape : 1-6 (decodificado do definitionId)
 *   primaryStatId: unitStatId do primario
 *   speedBonus   : speed total nos secundarios deste mod (int, divisor 10000)
 *
 * modScore e modLabel sao calculados pelo modEngine e salvos na unidade
 * para acesso rapido sem re-processar.
 */

var COMLINK_URL = 'https://worker-lively-heart-f0a0.leopreichelt.workers.dev'

// IDs de naves conhecidas no ROTE (extraidas do platoonRequirements)
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
  "ARC170CLONESERGEANT":1,"ARC170REX":1,"BLADEOFDORIN":1,
  "MARKVIINTERCEPTOR":1,"AHSOKATANO2SHIP":1,"PUNISHINGONE":1
}

var rosterEngine = {
  STORAGE_KEY:      'rote_roster_v3',
  STORAGE_DATE_KEY: 'rote_roster_date_v3',
  ACTIVITY_KEY:     'rote_activity_v1',
  GUILD_GP_KEY:     'rote_guild_gp_v1',
  ACCOUNTS_KEY:     'rote_accounts',

  // Retorna a chave de storage com sufixo do allycode atual (multi-conta)
  _key: function(base) {
    var ac = localStorage.getItem('rote_allycode') || ''
    return ac ? (base + '_' + ac) : base
  },

  toRelicLevel: function (relicTier) {
    if (!relicTier || relicTier < 3) return 0
    return relicTier - 2
  },

  isShip: function (baseId) {
    return !!SHIP_IDS[baseId]
  },

  meetsRequirement: function (unit, relicMin) {
    if (unit.combat_type === 2) return unit.rarity >= 7
    return rosterEngine.toRelicLevel(unit.relic_tier) >= relicMin
  },

  // Converte o array equippedStatMod[] da API em formato compacto
  // Requer modEngine.js carregado para calcular score/label
  _parseMods: function (equippedStatMod, baseId) {
    if (!equippedStatMod || equippedStatMod.length === 0) return []
    return equippedStatMod.map(function (m) {
      var defId = parseInt(m.definitionId)
      var shape = defId % 10
      var set   = Math.floor(defId / 10) % 10
      var speedBonus = 0
      ;(m.secondaryStat || []).forEach(function (s) {
        if (s.stat.unitStatId === 5) speedBonus += parseInt(s.stat.statValueDecimal) / 10000
      })
      return {
        tier:          m.tier || 1,
        level:         m.level || 1,
        set:           set,
        shape:         shape,
        primaryStatId: m.primaryStat ? m.primaryStat.stat.unitStatId : 0,
        speedBonus:    Math.round(speedBonus)
      }
    })
  },

  fetchPlayer: function (playerId, fallbackName, callback) {
    fetch(COMLINK_URL + '/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { playerId: playerId } })
    })
    .then(function (r) { return r.json() })
    .then(function (d) {
      var playerName = d.name || fallbackName || playerId

      var units = (d.rosterUnit || []).map(function (u) {
        var defId   = u.definitionId || ''
        var baseId  = defId.split(':')[0]
        var rarityMap = {
          'ONE_STAR':1,'TWO_STAR':2,'THREE_STAR':3,
          'FOUR_STAR':4,'FIVE_STAR':5,'SIX_STAR':6,'SEVEN_STAR':7
        }
        var rarityStr = defId.split(':')[1] || ''
        var rarity    = rarityMap[rarityStr] || u.currentRarity || 0

        // Mods: parseia para formato compacto
        var mods = rosterEngine._parseMods(u.equippedStatMod || [], baseId)

        // Score de mods: calcula via modEngine se disponivel
        var modScore = 0
        var modLabel = 'Sem mods'
        if (mods.length > 0 && typeof modEngine !== 'undefined') {
          var result = modEngine.scoreMods(u.equippedStatMod, baseId)
          modScore = result.score
          modLabel = result.label
        }

        return {
          base_id:     baseId,
          relic_tier:  u.relic ? (u.relic.currentTier || 0) : 0,
          rarity:      rarity,
          combat_type: rosterEngine.isShip(baseId) ? 2 : 1,
          level:       u.currentLevel || 0,
          gp:          u.currentGalacticPower || 0,
          mods:        mods,
          modScore:    modScore,
          modLabel:    modLabel
        }
      })

      // GAC / PSR
      var pr  = d.playerRating || {}
      var psr = pr.playerSkillRating || {}
      var prs = pr.playerRankStatus  || {}
      var gac = {
        skillRating: psr.skillRating || 0,
        leagueId:    prs.leagueId    || 'CARBONITE',
        divisionId:  prs.divisionId  || 5
      }

      callback(null, { playerId: playerId, name: playerName, units: units, gac: gac })
    })
    .catch(function (e) {
      callback('Erro ' + (fallbackName || playerId) + ': ' + e.message)
    })
  },

  fetchAll: function (members, onProgress, onDone) {
    var rosterMap = {}
    var total     = members.length
    var current   = 0

    function next () {
      if (current >= total) {
        try {
          localStorage.setItem(rosterEngine._key(rosterEngine.STORAGE_KEY), JSON.stringify(rosterMap))
          localStorage.setItem(rosterEngine._key(rosterEngine.STORAGE_DATE_KEY), new Date().toISOString())
        } catch (e) {}
        return onDone(null, rosterMap)
      }
      var member = members[current]
      current++
      onProgress(current, total, member.name || ('Jogador ' + current))
      setTimeout(function () {
        rosterEngine.fetchPlayer(member.playerId, member.name, function (err, data) {
          if (!err) rosterMap[member.playerId] = data
          next()
        })
      }, current === 1 ? 0 : 200)
    }
    next()
  },

  // Migra automaticamente dados do rote_roster_v2 para v3 (adiciona campos de mods)
  // Chamada automaticamente por load() quando v3 esta vazio.
  migrateFromV2: function () {
    var OLD_KEY = 'rote_roster_v2'
    var v2raw = null
    try { v2raw = localStorage.getItem(OLD_KEY) } catch (e) {}
    if (!v2raw) return null
    try {
      var v2data = JSON.parse(v2raw)
      Object.values(v2data).forEach(function (player) {
        ;(player.units || []).forEach(function (unit) {
          if (!unit.mods)     unit.mods     = []
          if (!unit.modScore) unit.modScore = 0
          if (!unit.modLabel) unit.modLabel = 'Sem mods'
        })
      })
      localStorage.setItem(rosterEngine._key(rosterEngine.STORAGE_KEY), JSON.stringify(v2data))
      return v2data
    } catch (e) { return null }
  },

  load: function () {
    try {
      var d = localStorage.getItem(rosterEngine._key(rosterEngine.STORAGE_KEY))
      if (d) return JSON.parse(d)
      // v3 vazio: tentar migrar do v2
      return rosterEngine.migrateFromV2()
    } catch (e) { return null }
  },

  saveActivity: function (activityMap) {
    try { localStorage.setItem(rosterEngine._key(rosterEngine.ACTIVITY_KEY), JSON.stringify(activityMap)) } catch (e) {}
  },

  loadActivity: function () {
    try {
      var d = localStorage.getItem(rosterEngine._key(rosterEngine.ACTIVITY_KEY))
      return d ? JSON.parse(d) : {}
    } catch (e) { return {} }
  },

  saveGuildGP: function (gpMap) {
    try { localStorage.setItem(rosterEngine._key(rosterEngine.GUILD_GP_KEY), JSON.stringify(gpMap)) } catch (e) {}
  },

  loadGuildGP: function () {
    try {
      var d = localStorage.getItem(rosterEngine._key(rosterEngine.GUILD_GP_KEY))
      return d ? JSON.parse(d) : {}
    } catch (e) { return {} }
  },

  loadActive: function () {
    var rosterMap = rosterEngine.load()
    if (!rosterMap) return null
    var activity = rosterEngine.loadActivity()
    var result   = {}
    Object.keys(rosterMap).forEach(function (pid) {
      var status = activity[pid]
      if (status !== 'inativo' && status !== 'margem') result[pid] = rosterMap[pid]
    })
    return result
  },

  lastSyncDate: function () {
    try {
      var d = localStorage.getItem(rosterEngine._key(rosterEngine.STORAGE_DATE_KEY))
      return d ? new Date(d) : null
    } catch (e) { return null }
  },

  checkAvailability: function (rosterMap, platoonSlots, relicMin) {
    var availability = {}
    platoonSlots.forEach(function (slot) {
      var unitId = slot.unitId || slot
      if (!availability[unitId]) availability[unitId] = []
      Object.values(rosterMap).forEach(function (player) {
        var unit = player.units.find(function (u) { return u.base_id === unitId })
        if (unit && rosterEngine.meetsRequirement(unit, relicMin)) {
          availability[unitId].push(player.name)
        }
      })
    })
    return availability
  },

  // Retorna o mod score de uma unidade de um jogador.
  // Recalcula a partir dos mods brutos se modEngine estiver disponivel.
  // Se os mods estao em formato compacto (sem secondaryStat), usa modScore salvo.
  getModScore: function (player, baseId) {
    var unit = player.units.find(function (u) { return u.base_id === baseId })
    if (!unit) return null
    return { score: unit.modScore || 0, label: unit.modLabel || 'Sem mods' }
  },

  // ── Gerenciamento de contas (multi-conta) ──────────────────────────────────

  loadAccounts: function () {
    try { return JSON.parse(localStorage.getItem(rosterEngine.ACCOUNTS_KEY) || '{}') } catch (e) { return {} }
  },

  // Registra/atualiza metadados de uma conta após sync bem-sucedido
  saveAccount: function (allycode, guildName) {
    if (!allycode) return
    var accounts = rosterEngine.loadAccounts()
    accounts[allycode] = {
      guildName: guildName || (accounts[allycode] && accounts[allycode].guildName) || 'Conta ' + allycode,
      lastAccess: new Date().toISOString(),
      syncDate:   new Date().toISOString()
    }
    try { localStorage.setItem(rosterEngine.ACCOUNTS_KEY, JSON.stringify(accounts)) } catch (e) {}
  },

  // Atualiza lastAccess de uma conta já existente (sem alterar outros campos)
  touchAccount: function (allycode) {
    if (!allycode) return
    var accounts = rosterEngine.loadAccounts()
    if (!accounts[allycode]) return
    accounts[allycode].lastAccess = new Date().toISOString()
    try { localStorage.setItem(rosterEngine.ACCOUNTS_KEY, JSON.stringify(accounts)) } catch (e) {}
  },

  // Remove dados de contas não acessadas há mais de 15 dias
  pruneOldAccounts: function () {
    var accounts = rosterEngine.loadAccounts()
    var cutoff = Date.now() - 15 * 24 * 60 * 60 * 1000
    var allBaseKeys = [
      rosterEngine.STORAGE_KEY, rosterEngine.STORAGE_DATE_KEY,
      rosterEngine.ACTIVITY_KEY, rosterEngine.GUILD_GP_KEY,
      'rote_combat_battles_v1', 'rote_platoon_alloc_v1',
      'rote_farm_assignments_v1', 'rote_farm_planet_history_v1', 'roteHistory'
    ]
    var changed = false
    Object.keys(accounts).forEach(function (ac) {
      var lastAccess = accounts[ac].lastAccess ? new Date(accounts[ac].lastAccess).getTime() : 0
      if (lastAccess < cutoff) {
        allBaseKeys.forEach(function (k) { try { localStorage.removeItem(k + '_' + ac) } catch (e) {} })
        delete accounts[ac]
        changed = true
      }
    })
    if (changed) try { localStorage.setItem(rosterEngine.ACCOUNTS_KEY, JSON.stringify(accounts)) } catch (e) {}
  }
}
