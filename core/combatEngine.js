/**
 * combatEngine.js
 * Contagem de batalhas elegíveis por planeta para todos os jogadores ativos da guilda.
 *
 * Lógica:
 *   - Por missão, conta quantos jogadores têm ao menos 1 squad elegível
 *   - Cada jogador pode fazer 1 batalha por missão por fase (squad/ship)
 *   - Missões especiais: apenas 1x por jogador no total, não entram no score
 *   - safeBattles = floor((squadBattles + shipBattles) * 0.8)
 *
 * keyUnit: null → qualquer jogador ativo qualifica (missões "Any DS/LS/Any")
 * keyUnit: [id, ...] → jogador precisa ter pelo menos 1 destes personagens no relic mínimo do planeta
 * isShip: true → checa 7 estrelas em vez de relic
 *
 * IDs marcados TODO: personagens que não constam nos platoons (Jabba, Fennec, Saw, Reva, Cal Kestis)
 * Usar null até confirmar os IDs reais no jogo.
 */

var COMBAT_MISSION_REQS = {

  "Mustafar": [
    // M1 Lord Vader: precisa de Lord Vader (personagem específico)
    { n:1, keyUnit: ['LORDVADER'] },
    // M2-4 Any DS: qualquer jogador
    { n:2, keyUnit: null },
    { n:3, keyUnit: null },
    { n:4, keyUnit: null },
    // M5 Scythe: nave específica
    { n:5, keyUnit: ['SCYTHE'], isShip: true }
  ],

  "Corellia": [
    // M1 Doctor Aphra: personagem específico
    { n:1, keyUnit: ['DOCTORAPHRA'] },
    // M2 Any: qualquer
    { n:2, keyUnit: null },
    // M3 Jabba: TODO confirmar ID
    { n:3, keyUnit: null },  // TODO: ['JABBATHEHUTT'] quando confirmar ID
    // M4 Qi'ra + Young Han (especial): ambos necessários
    { n:4, keyUnit: ['QIRA', 'YOUNGHAN'], requireAll: true },
    // M5 Lando's MF: nave
    { n:5, keyUnit: ['MILLENNIUMFALCON'], isShip: true }
  ],

  "Coruscant": [
    // M1 Outrider: nave
    { n:1, keyUnit: ['OUTRIDER'], isShip: true },
    // M2-3 Any LS: qualquer
    { n:2, keyUnit: null },
    { n:3, keyUnit: null },
    // M4-5 Jedi: precisa de ao menos 1 Jedi no relic mínimo (simplificado: qualquer)
    { n:4, keyUnit: null },
    { n:5, keyUnit: null }
  ],

  "Geonosis": [
    // M1-4 Any DS / req open: qualquer
    { n:1, keyUnit: null },
    { n:2, keyUnit: null },
    // M3 Geonosianos R7 (relicBonus - 1 tier acima): TODO tratar relicBonus
    { n:3, keyUnit: ['GEONOSIANBROODALPHA'] },
    { n:4, keyUnit: null },
    // M5 nave DS
    { n:5, keyUnit: null, isShip: true }
  ],

  "Felucia": [
    // M1 Young Lando: personagem específico
    { n:1, keyUnit: ['YOUNGLANDO'] },
    // M2 Hondo: personagem específico
    { n:2, keyUnit: ['HONDO'] },
    // M3 Any: qualquer
    { n:3, keyUnit: null },
    // M4 Jabba: TODO confirmar ID
    { n:4, keyUnit: null },  // TODO: ['JABBATHEHUTT']
    // M5 Any nave: qualquer
    { n:5, keyUnit: null, isShip: true }
  ],

  "Bracca": [
    // M1-3 Any LS: qualquer
    { n:1, keyUnit: null },
    { n:2, keyUnit: null },
    { n:3, keyUnit: null },
    // M4 nave LS
    { n:4, keyUnit: null, isShip: true },
    // M5 especial Cal Kestis + Cere: ambos necessários. TODO confirmar IDs
    { n:5, keyUnit: ['CEREJUNDA'] }  // TODO: adicionar ID de Cal Kestis
  ],

  "Dathomir": [
    // M1 Empire: qualquer com Empire → simplificado qualquer
    { n:1, keyUnit: null },
    // M2-4 Any DS: qualquer
    { n:2, keyUnit: null },
    { n:3, keyUnit: ['DOCTORAPHRA'] },
    { n:4, keyUnit: null },
    // M5 especial Merrin + Nightsisters
    { n:5, keyUnit: ['MERRIN'] }
  ],

  "Tatooine": [
    // M1 Any: qualquer
    { n:1, keyUnit: null },
    // M2 Jabba: TODO
    { n:2, keyUnit: null },  // TODO: ['JABBATHEHUTT']
    // M3 Executor: nave
    { n:3, keyUnit: ['CAPITALEXECUTOR'], isShip: true },
    // M4 Fennec: TODO confirmar ID
    { n:4, keyUnit: null },  // TODO: ['FENNECSHAND']
    // M5 especial GI (Grande Inquisidor + Inquisitorius)
    { n:5, keyUnit: ['GRANDINQUISITOR'] },
    // M6 especial Bo'katan (desbloqueia Mandalore)
    { n:6, keyUnit: ['BOKATAN'] }
  ],

  "Kashyyyk": [
    // M1 Wookiees: Tarfful ou Chewbacca
    { n:1, keyUnit: ['TARFFUL', 'CHEWBACCALEGENDARY'] },
    // M2-3 Any LS: qualquer
    { n:2, keyUnit: null },
    { n:3, keyUnit: null },
    // M4 Profundity: nave
    { n:4, keyUnit: ['CAPITALPROFUNDITY'], isShip: true },
    // M5 especial Saw Gerrera: TODO confirmar ID
    { n:5, keyUnit: null }  // TODO: ['SAWGERRERA']
  ],

  "Haven Medical Station": [
    // M1-3 Any DS: qualquer
    { n:1, keyUnit: null },
    { n:2, keyUnit: null },
    { n:3, keyUnit: null },
    // M4 especial Reva (Third Sister): TODO confirmar ID
    { n:4, keyUnit: null },  // TODO: ['THIRDSISTER'] ou ['REVA']
    // M5 Any DS: qualquer
    { n:5, keyUnit: null }
  ],

  "Kessel": [
    // M1-2 Any: qualquer
    { n:1, keyUnit: null },
    { n:2, keyUnit: null },
    // M3 especial Qi'ra + L3-37
    { n:3, keyUnit: ['QIRA', 'L3_37'], requireAll: true },
    // M4 Jabba: TODO
    { n:4, keyUnit: null },  // TODO: ['JABBATHEHUTT']
    // M5 Ghost: nave
    { n:5, keyUnit: ['GHOST'], isShip: true }
  ],

  "Lothal": [
    // M1 nave LS
    { n:1, keyUnit: null, isShip: true },
    // M2 Any LS: qualquer
    { n:2, keyUnit: null },
    // M3 especial Phoenix (Hera Syndulla)
    { n:3, keyUnit: null },  // TODO: ['HERASYNDULLA']
    // M4 Jedi: qualquer
    { n:4, keyUnit: null }
  ],

  "Malachor": [
    // M1-4 Any DS: qualquer
    { n:1, keyUnit: null },
    { n:2, keyUnit: null },
    // M3 8th, 5th, 7th Brothers
    { n:3, keyUnit: ['EIGHTHBROTHER', 'FIFTHBROTHER', 'SEVENTHSISTER'], requireAll: true },
    { n:4, keyUnit: null }
  ],

  "Vandor": [
    // M1 especial Young Han + Vandor Chewbacca
    { n:1, keyUnit: ['YOUNGHAN', 'YOUNGCHEWBACCA'], requireAll: true },
    // M2-3 Any: qualquer
    { n:2, keyUnit: null },
    { n:3, keyUnit: null },
    // M4 Jabba: TODO
    { n:4, keyUnit: null },  // TODO: ['JABBATHEHUTT']
    // M5 nave Any
    { n:5, keyUnit: null, isShip: true }
  ],

  "Kafrene": [
    // M1-2 Any LS: qualquer
    { n:1, keyUnit: null },
    { n:2, keyUnit: null },
    // M3 Cassian + K-2SO
    { n:3, keyUnit: ['K2SO'] },
    // M4 nave LS
    { n:4, keyUnit: null, isShip: true },
    // M5 Any LS: qualquer
    { n:5, keyUnit: null }
  ],

  "Death Star": [
    // M1-3 Any DS / Iden: qualquer
    { n:1, keyUnit: null },
    { n:2, keyUnit: null },
    { n:3, keyUnit: null },
    // M4 especial Darth Vader
    { n:4, keyUnit: ['VADER'] },
    // M5 nave TIE Imperial
    { n:5, keyUnit: ['TIEFIGHTERIMPERIAL'], isShip: true }
  ],

  "Hoth": [
    // M1 Jabba: TODO
    { n:1, keyUnit: null },  // TODO: ['JABBATHEHUTT']
    // M2-4 Any: qualquer
    { n:2, keyUnit: null },
    { n:3, keyUnit: null },
    { n:4, keyUnit: null },
    // M5 Doctor Aphra + BT-1
    { n:5, keyUnit: ['DOCTORAPHRA', 'BT1'], requireAll: true }
  ],

  "Scarif": [
    // M1 Baze + Chirrut + SRP
    { n:1, keyUnit: ['BAZEMALBUS', 'CHIRRUTIMWE'], requireAll: true },
    // M2 Cassian + K2 + Pao
    { n:2, keyUnit: ['K2SO', 'PAO'], requireAll: true },
    // M3 Profundity: nave
    { n:3, keyUnit: ['CAPITALPROFUNDITY'], isShip: true },
    // M4-5 Any LS: qualquer
    { n:4, keyUnit: null },
    { n:5, keyUnit: null }
  ],

  "Zeffo": [
    // M1-2 Any LS: qualquer
    { n:1, keyUnit: null },
    { n:2, keyUnit: null },
    // M3 JKCK (Cal Kestis): TODO confirmar ID
    { n:3, keyUnit: ['CEREJUNDA'] },  // TODO: adicionar ID Cal Kestis
    // M4 especial Clone Troopers
    { n:4, keyUnit: ['CT7567', 'GENERALSKYWALKER'] },  // Rex ou GAS como representativo
    // M5 Negotiator: nave
    { n:5, keyUnit: ['CAPITALNEGOTIATOR'], isShip: true }
  ],

  "Mandalore": [
    // M1 DTMG: Grand Admiral Thrawn
    { n:1, keyUnit: ['GRANDADMIRALTHRAWN'] },
    // M2 Any: qualquer
    { n:2, keyUnit: null },
    // M3 Bo'katan R9
    { n:3, keyUnit: ['BOKATAN'] },
    // M4 Gauntlet: nave
    { n:4, keyUnit: ['GAUNTLETSTARFIGHTER'], isShip: true }
  ]

}

var combatEngine = {

  STORAGE_KEY: 'rote_combat_battles_v1',

  // Verifica se um jogador tem a unidade no nível mínimo exigido
  _playerHasUnit: function(player, unitId, minRelic, isShip) {
    var unit = player.units.find(function(u) { return u.base_id === unitId })
    if (!unit) return false
    if (isShip) return unit.rarity >= 7
    return (typeof rosterEngine !== 'undefined')
      ? rosterEngine.toRelicLevel(unit.relic_tier) >= minRelic
      : (unit.relic_tier - 2) >= minRelic
  },

  // Verifica se um jogador é elegível para uma missão
  _playerEligible: function(player, missionReq, minRelic) {
    if (!missionReq || !missionReq.keyUnit) return true  // null = qualquer

    var ce = combatEngine
    var units = missionReq.keyUnit
    var isShip = !!missionReq.isShip

    if (missionReq.requireAll) {
      // Jogador precisa de TODOS os personagens listados
      return units.every(function(uid) {
        return ce._playerHasUnit(player, uid, minRelic, isShip)
      })
    } else {
      // Jogador precisa de PELO MENOS 1
      return units.some(function(uid) {
        return ce._playerHasUnit(player, uid, minRelic, isShip)
      })
    }
  },

  // Computa batalhas elegíveis por planeta para todos os jogadores ativos
  computeForPlanet: function(planetName, rosterMap, minRelic) {
    var combatData = (typeof PLANET_COMBAT_DATA !== 'undefined') ? PLANET_COMBAT_DATA[planetName] : null
    var missionReqs = COMBAT_MISSION_REQS[planetName]
    if (!combatData || !missionReqs || !rosterMap) return null

    var players = Object.values(rosterMap)
    var squadBattles   = 0
    var shipBattles    = 0
    var specialBattles = 0

    combatData.missions.forEach(function(mission) {
      var req = missionReqs.find(function(r) { return r.n === mission.n })
      if (!req) return

      // Conta quantos jogadores são elegíveis para essa missão
      var eligiblePlayers = players.filter(function(player) {
        return combatEngine._playerEligible(player, req, minRelic)
      }).length

      if (eligiblePlayers === 0) return

      if (mission.type === 'squad')   squadBattles   += eligiblePlayers
      if (mission.type === 'ship')    shipBattles    += eligiblePlayers
      if (mission.type === 'special') specialBattles += eligiblePlayers
    })

    var totalScoreBattles = squadBattles + shipBattles
    var safeBattles = Math.floor(totalScoreBattles * 0.8)

    return {
      squadBattles:      squadBattles,
      shipBattles:       shipBattles,
      specialBattles:    specialBattles,
      totalScoreBattles: totalScoreBattles,
      safeBattles:       safeBattles
    }
  },

  // Computa e salva batalhas para todos os planetas ativos
  computeAndStore: function(rosterMap) {
    if (!rosterMap) return
    var result = {}

    Object.keys(COMBAT_MISSION_REQS).forEach(function(planetName) {
      var tier = (typeof getPlanetTier === 'function') ? getPlanetTier(planetName) : 1
      var minRelic = (typeof TIER_RELIC !== 'undefined') ? (TIER_RELIC[tier] || 5) : 5
      var battles = combatEngine.computeForPlanet(planetName, rosterMap, minRelic)
      if (battles) result[planetName] = battles
    })

    try { localStorage.setItem(combatEngine.STORAGE_KEY, JSON.stringify(result)) } catch(e) {}
    return result
  },

  load: function() {
    try {
      var d = localStorage.getItem(combatEngine.STORAGE_KEY)
      return d ? JSON.parse(d) : {}
    } catch(e) { return {} }
  }

}
