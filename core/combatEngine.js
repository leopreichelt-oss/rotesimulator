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
    // M3 Jabba
    { n:3, keyUnit: ['JABBATHEHUTT'] },
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
    // M4 Jabba
    { n:4, keyUnit: ['JABBATHEHUTT'] },
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
    // M5 especial: Cal Kestis R8 + Cere R7  OU  Cal Kestis (Cavaleiro Jedi) R7 + Cere R7
    // Duas combinações válidas — checadas em computeSpecialMissionEligible
    { n:5, keyUnit: null, isSpecialUnlock: true, unlocks: 'Zeffo', winsRequired: 30 }
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
    // M2 Jabba
    { n:2, keyUnit: ['JABBATHEHUTT'] },
    // M3 Executor: nave
    { n:3, keyUnit: ['CAPITALEXECUTOR'], isShip: true },
    // M4 Fennec
    { n:4, keyUnit: ['FENNECSHAND'] },
    // M5 especial GI (Grande Inquisidor + Inquisitorius)
    { n:5, keyUnit: ['GRANDINQUISITOR'] },
    // M6 especial Bo-Katan Mand'alor + Beskar + (IG-12 R7 OU Paz Vizsla R7)
    // Combinações checadas em computeSpecialMissionEligible
    { n:6, keyUnit: null, isSpecialUnlock: true, unlocks: 'Mandalore', winsRequired: 30 }
  ],

  "Kashyyyk": [
    // M1 Wookiees: Tarfful ou Chewbacca
    { n:1, keyUnit: ['TARFFUL', 'CHEWBACCALEGENDARY'] },
    // M2-3 Any LS: qualquer
    { n:2, keyUnit: null },
    { n:3, keyUnit: null },
    // M4 Profundity: nave
    { n:4, keyUnit: ['CAPITALPROFUNDITY'], isShip: true },
    // M5 especial Saw Gerrera
    { n:5, keyUnit: ['SAWGERRERA'] }
  ],

  "Haven Medical Station": [
    // M1-3 Any DS: qualquer
    { n:1, keyUnit: null },
    { n:2, keyUnit: null },
    { n:3, keyUnit: null },
    // M4 especial Reva (Third Sister)
    { n:4, keyUnit: ['THIRDSISTER'] },
    // M5 Any DS: qualquer
    { n:5, keyUnit: null }
  ],

  "Kessel": [
    // M1-2 Any: qualquer
    { n:1, keyUnit: null },
    { n:2, keyUnit: null },
    // M3 especial Qi'ra + L3-37
    { n:3, keyUnit: ['QIRA', 'L3_37'], requireAll: true },
    // M4 Jabba
    { n:4, keyUnit: ['JABBATHEHUTT'] },
    // M5 Ghost: nave
    { n:5, keyUnit: ['GHOST'], isShip: true }
  ],

  "Lothal": [
    // M1 nave LS
    { n:1, keyUnit: null, isShip: true },
    // M2 Any LS: qualquer
    { n:2, keyUnit: null },
    // M3 especial Phoenix (Hera Syndulla)
    { n:3, keyUnit: ['HERASYNDULLAS3'] },
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
    // M4 Jabba
    { n:4, keyUnit: ['JABBATHEHUTT'] },
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
    // M1 Jabba
    { n:1, keyUnit: ['JABBATHEHUTT'] },
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
    // M3 Cal Kestis + Cere Junda
    { n:3, keyUnit: ['CALKESTIS', 'CEREJUNDA'], requireAll: true },
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

  // GP de referência por relic para detecção de mods bons (proxy de qualidade)
  // Valores baseados em média observada: personagem R5 nivel 85 sem mods ~20K, com mods médios ~27K
  GP_BASELINE: { 5: 25000, 6: 31000, 7: 38000, 8: 46000, 9: 56000, 10: 68000 },

  // Verifica se um jogador tem a unidade no nível mínimo exigido
  _playerHasUnit: function(player, unitId, minRelic, isShip) {
    var unit = player.units.find(function(u) { return u.base_id === unitId })
    if (!unit) return false
    if (isShip) return unit.rarity >= 7
    return (typeof rosterEngine !== 'undefined')
      ? rosterEngine.toRelicLevel(unit.relic_tier) >= minRelic
      : (unit.relic_tier - 2) >= minRelic
  },

  // Relic real de uma unidade de um jogador (-1 se não tem)
  _unitRelic: function(player, unitId) {
    var unit = player.units ? player.units.find(function(u) { return u.base_id === unitId }) : null
    if (!unit) return -1
    return (typeof rosterEngine !== 'undefined')
      ? rosterEngine.toRelicLevel(unit.relic_tier)
      : Math.max(0, (unit.relic_tier || 0) - 2)
  },

  // Bônus de mods via GP proxy.
  // Unidade com GP acima do baseline para seu relic → mods bons → +0.08 ou +0.15
  _gpModBonus: function(player, unitId, relicLevel) {
    var unit = player.units ? player.units.find(function(u) { return u.base_id === unitId }) : null
    if (!unit || !unit.gp) return 0
    var baseline = combatEngine.GP_BASELINE[relicLevel] || 30000
    var ratio = unit.gp / baseline
    if (ratio >= 1.4) return 0.15
    if (ratio >= 1.2) return 0.08
    return 0
  },

  // Multiplicador de GP para batalha de esquadrão.
  // Baseado no relic do membro mais fraco do squad vs minRelic do planeta:
  //   diff=0 → 0.6 (1.2 ondas), diff=1 → 0.8 (1.6 ondas), diff≥2 → 1.0 (2 ondas)
  // + bônus de mods via GP do membro mais fraco (até +0.15)
  _squadMultiplier: function(player, squadRequire, minRelic) {
    var ce = combatEngine
    var minRelicInSquad = squadRequire.reduce(function(acc, uid) {
      var r = ce._unitRelic(player, uid)
      return r >= 0 && r < acc ? r : acc
    }, Infinity)
    if (minRelicInSquad === Infinity) return 0.6

    var diff = minRelicInSquad - minRelic
    var base = diff <= 0 ? 0.6 : diff === 1 ? 0.8 : 1.0

    // Bônus de mods: usa o membro mais fraco (bottleneck)
    var weakestUid = squadRequire.reduce(function(worst, uid) {
      var r = ce._unitRelic(player, uid)
      var wr = worst ? ce._unitRelic(player, worst) : Infinity
      return (r >= 0 && r < wr) ? uid : worst
    }, null)
    var modBonus = weakestUid ? ce._gpModBonus(player, weakestUid, minRelicInSquad) : 0

    return Math.min(1.0, base + modBonus)
  },

  // Multiplicador de GP para batalha de frota.
  // Checa o piloto principal da nave: garante 100% com piloto em minRelic+1,
  // 60% com piloto em minRelic, e aplica bônus de mods do piloto.
  _shipMultiplier: function(player, shipId, minRelic) {
    var ce = combatEngine
    var pilotId = (typeof SHIP_PILOT !== 'undefined') ? SHIP_PILOT[shipId] : null
    if (!pilotId) return 0.6  // sem dados de piloto: conservador

    var pilotRelic = ce._unitRelic(player, pilotId)
    if (pilotRelic < 0) return 0.3     // tem a nave mas não tem o piloto
    if (pilotRelic < minRelic) return 0.3  // piloto abaixo do tier

    var base = pilotRelic >= minRelic + 1 ? 1.0 : 0.6
    var modBonus = ce._gpModBonus(player, pilotId, pilotRelic)
    return Math.min(1.0, base + modBonus)
  },

  // Retorna o multiplicador de GP (0.3–1.0) para um jogador elegível em uma missão.
  // Encontra o melhor squad elegível do jogador e calcula o multiplicador.
  _playerGPMultiplier: function(player, missionReq, minRelic, planetName, missionType) {
    var ce = combatEngine
    if (missionType === 'special') return 0

    var planetSquads = (typeof MISSION_SQUADS !== 'undefined' && planetName)
      ? (MISSION_SQUADS[planetName] || {}) : {}
    var squads = planetSquads[missionReq.n]

    if (squads !== undefined) {
      if (!squads || squads.length === 0) return 0
      // Encontra o melhor squad (maior multiplicador)
      var bestMult = 0
      squads.forEach(function(squad) {
        var squadIsShip = !!squad.isShip
        var allMet = squad.require.every(function(uid) {
          return ce._playerHasUnit(player, uid, minRelic, squadIsShip)
        })
        if (!allMet) return
        var mult
        if (squadIsShip) {
          // Para squads de frota: usa o piloto da nave capital (primeiro elemento)
          mult = ce._shipMultiplier(player, squad.require[0], minRelic)
        } else {
          mult = ce._squadMultiplier(player, squad.require, minRelic)
        }
        if (mult > bestMult) bestMult = mult
      })
      return bestMult
    }

    // Fallback keyUnit: sem dados de squad específico
    if (missionType === 'ship') {
      var shipId = missionReq.keyUnit ? missionReq.keyUnit[0] : null
      return shipId ? ce._shipMultiplier(player, shipId, minRelic) : 0.6
    }
    return 0.6  // conservador para keyUnit genérico
  },

  // Verifica se um jogador é elegível para uma missão.
  // Prioriza MISSION_SQUADS (composições reais de squads) antes do keyUnit genérico.
  _playerEligible: function(player, missionReq, minRelic, planetName) {
    var ce = combatEngine

    // ── MISSION_SQUADS: dados reais de elegibilidade por composição ──────
    if (typeof MISSION_SQUADS !== 'undefined' && planetName) {
      var planetSquads = MISSION_SQUADS[planetName]
      if (planetSquads) {
        var squads = planetSquads[missionReq.n]
        if (squads !== undefined) {
          // [] ou null = confirmado sem composições elegíveis
          if (!squads || squads.length === 0) return false
          return squads.some(function(squad) {
            var squadIsShip = !!squad.isShip
            return squad.require.every(function(uid) {
              return ce._playerHasUnit(player, uid, minRelic, squadIsShip)
            })
          })
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    // Fallback: lógica keyUnit original
    if (!missionReq || !missionReq.keyUnit) return true  // null = qualquer

    var units = missionReq.keyUnit
    var isShip = !!missionReq.isShip

    if (missionReq.requireAll) {
      return units.every(function(uid) {
        return ce._playerHasUnit(player, uid, minRelic, isShip)
      })
    } else {
      return units.some(function(uid) {
        return ce._playerHasUnit(player, uid, minRelic, isShip)
      })
    }
  },

  // Retorna quantos jogadores ativos são elegíveis para a missão especial de desbloqueio
  // de um dado planeta (Bracca → Zeffo, Tatooine → Mandalore).
  // Também retorna o nome do planeta desbloqueado e o limiar de vitórias.
  computeSpecialMissionEligible: function(planetName, rosterMap) {
    if (!rosterMap) return null
    var ce = combatEngine

    var players = Object.values(rosterMap)
    var eligible = 0
    var unlocks = null
    var winsRequired = 30

    if (planetName === 'Bracca') {
      unlocks = 'Zeffo'
      // Opção A: Cal Kestis R8 + Cere Junda R7
      // Opção B: Cal Kestis (Cavaleiro Jedi) R7 + Cere Junda R7
      eligible = players.filter(function(p) {
        var cere = ce._playerHasUnit(p, 'CEREJUNDA', 7, false)
        if (!cere) return false
        var calR8  = ce._playerHasUnit(p, 'CALKESTIS',    8, false)
        var jkckR7 = ce._playerHasUnit(p, 'JEDIKNIGHTCAL', 7, false)
        return calR8 || jkckR7
      }).length
    }

    if (planetName === 'Tatooine') {
      unlocks = 'Mandalore'
      // Requer: Bo-Katan Mand'alor R7 + Mandaloriano Beskar R7 + (IG-12 R7 OU Paz Vizsla R7)
      eligible = players.filter(function(p) {
        var bkm    = ce._playerHasUnit(p, 'BOKATANMANDALORE',   7, false)
        var beskar = ce._playerHasUnit(p, 'MANDALORIANBESKAR',  7, false)
        if (!bkm || !beskar) return false
        var ig12   = ce._playerHasUnit(p, 'IG12',               7, false)
        var paz    = ce._playerHasUnit(p, 'PAZVIZSLA',          7, false)
        return ig12 || paz
      }).length
    }

    if (unlocks === null) return null

    return {
      eligible:      eligible,
      unlocks:       unlocks,
      winsRequired:  winsRequired
    }
  },

  // Calcula a pontuação de GP de uma missão (por jogador elegível)
  _missionGP: function(mission, tier) {
    if (mission.type === 'ship') {
      return (typeof BATTLE_SCORE !== 'undefined' && BATTLE_SCORE[tier])
        ? BATTLE_SCORE[tier].ship : 0
    }
    if (mission.type === 'squad') {
      var waves = mission.waves || 2
      var key = waves === 1 ? 'squad1' : 'squad2'
      return (typeof BATTLE_SCORE !== 'undefined' && BATTLE_SCORE[tier])
        ? BATTLE_SCORE[tier][key] : 0
    }
    return 0  // special não pontua
  },

  // Computa batalhas elegíveis por planeta para todos os jogadores ativos
  computeForPlanet: function(planetName, rosterMap, minRelic) {
    var combatData = (typeof PLANET_COMBAT_DATA !== 'undefined') ? PLANET_COMBAT_DATA[planetName] : null
    var missionReqs = COMBAT_MISSION_REQS[planetName]
    if (!combatData || !missionReqs || !rosterMap) return null

    var tier = (typeof getPlanetTier === 'function') ? getPlanetTier(planetName) : 1

    var players = Object.values(rosterMap)
    var squadBattles   = 0
    var shipBattles    = 0
    var specialBattles = 0
    var totalGP        = 0

    combatData.missions.forEach(function(mission) {
      var req = missionReqs.find(function(r) { return r.n === mission.n })
      if (!req) return

      // Missões especiais de desbloqueio são tratadas por computeSpecialMissionEligible
      if (req.isSpecialUnlock) return

      var missionGP = combatEngine._missionGP(mission, tier)

      players.forEach(function(player) {
        if (!combatEngine._playerEligible(player, req, minRelic, planetName)) return

        // Contagem binária de batalhas
        if (mission.type === 'squad')   squadBattles++
        if (mission.type === 'ship')    shipBattles++
        if (mission.type === 'special') specialBattles++

        // GP com multiplicador por relic/mods/piloto (0.3–1.0)
        var mult = combatEngine._playerGPMultiplier(player, req, minRelic, planetName, mission.type)
        totalGP += missionGP * mult
      })
    })

    var totalScoreBattles = squadBattles + shipBattles
    var safeBattles = Math.floor(totalScoreBattles * 0.8)
    var safeGP      = Math.floor(totalGP * 0.8)

    return {
      squadBattles:      squadBattles,
      shipBattles:       shipBattles,
      specialBattles:    specialBattles,
      totalScoreBattles: totalScoreBattles,
      safeBattles:       safeBattles,
      totalGP:           totalGP,
      safeGP:            safeGP,
      tier:              tier
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
  },

  // Retorna, por jogador ativo, quais missões ele consegue fazer no planeta
  // e quais squads (até 3) ele pode usar em cada missão.
  // Retorna: [{ playerId, playerName, missions:[{n, type, squads:[[uid,...],...]}, ...] }]
  // Ordenado por: mais missões primeiro.
  computePlayerMissionsForPlanet: function(planetName, rosterMap) {
    if (!rosterMap) return []
    var ce = combatEngine
    var combatData = (typeof PLANET_COMBAT_DATA !== 'undefined') ? PLANET_COMBAT_DATA[planetName] : null
    var missionReqs = COMBAT_MISSION_REQS[planetName]
    if (!combatData || !missionReqs) return []

    var tier = (typeof getPlanetTier === 'function') ? getPlanetTier(planetName) : 1
    var minRelic = (typeof TIER_RELIC !== 'undefined') ? (TIER_RELIC[tier] || 5) : 5

    var planetSquads = (typeof MISSION_SQUADS !== 'undefined') ? (MISSION_SQUADS[planetName] || {}) : {}

    var results = []

    Object.values(rosterMap).forEach(function(player) {
      var playerMissions = []

      combatData.missions.forEach(function(mission) {
        var req = missionReqs.find(function(r) { return r.n === mission.n })
        if (!req || req.isSpecialUnlock) return

        var eligibleSquads = []

        var squadsForMission = planetSquads[mission.n]
        if (squadsForMission !== undefined) {
          // Usar MISSION_SQUADS
          if (squadsForMission && squadsForMission.length > 0) {
            squadsForMission.forEach(function(squad) {
              var squadIsShip = !!squad.isShip
              var hasAll = squad.require.every(function(uid) {
                return ce._playerHasUnit(player, uid, minRelic, squadIsShip)
              })
              if (hasAll) eligibleSquads.push(squad.require)
            })
          }
        } else {
          // Fallback keyUnit
          if (!req.keyUnit) {
            // Any: "jogador elegível" mas sem squads específicos
            eligibleSquads.push(['any'])
          } else {
            var isShip = !!req.isShip
            var eligible = false
            if (req.requireAll) {
              eligible = req.keyUnit.every(function(uid) { return ce._playerHasUnit(player, uid, minRelic, isShip) })
              if (eligible) eligibleSquads.push(req.keyUnit)
            } else {
              req.keyUnit.forEach(function(uid) {
                if (ce._playerHasUnit(player, uid, minRelic, isShip)) eligibleSquads.push([uid])
              })
            }
          }
        }

        if (eligibleSquads.length > 0) {
          playerMissions.push({
            n:      mission.n,
            type:   mission.type,
            req:    mission.req,
            squads: eligibleSquads.slice(0, 3) // max 3 opções
          })
        }
      })

      if (playerMissions.length > 0) {
        results.push({
          playerId:    player.playerId || player.id || '',
          playerName:  player.name || player.playerName || player.playerId || '?',
          missions:    playerMissions
        })
      }
    })

    // Ordenar por número de missões elegíveis (mais → menos)
    results.sort(function(a, b) { return b.missions.length - a.missions.length })
    return results
  }

}
