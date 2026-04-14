/**
 * platoonAllocEngine.js
 * Gera a lista de alocação inteligente de jogadores para slots de platoon.
 *
 * Regras de prioridade para escolha do jogador em cada slot:
 *   1. Apenas jogadores com a unidade no relicMin do tier (mínimo exigido)
 *      são candidatos. Quem tem acima do mínimo pode ser mais útil em batalha.
 *   2. Entre os candidatos no mínimo exato, preferir o jogador com MENOR GP total
 *      (mais fraco = menos útil em batalha, então vai pro platoon).
 *   3. Se nenhum está no mínimo exato, abrir para todos que atendem relicMin,
 *      ordenado por relic ASC, depois GP ASC.
 *
 * Conflito de batalha:
 *   Se a unidade alocada ao platoon é também necessária em uma missão de batalha
 *   do mesmo planeta (via MISSION_SQUADS), sinalizar o conflito e listar squads
 *   alternativos que o jogador pode usar sem aquela unidade.
 *
 * Storage: rote_platoon_alloc_v1
 *   { planet: { op: { slot: { unitId, playerId, playerName, relic, conflict } } } }
 */

var platoonAllocEngine = {

  STORAGE_KEY: 'rote_platoon_alloc_v1',

  _key: function(base) {
    var ac = localStorage.getItem('rote_allycode') || ''
    return ac ? (base + '_' + ac) : base
  },

  // ─── Relic real de uma unidade para um jogador (-1 = não tem) ────────────
  _unitRelic: function(player, unitId) {
    var unit = player.units ? player.units.find(function(u) { return u.base_id === unitId }) : null
    if (!unit) return -1
    return (typeof rosterEngine !== 'undefined')
      ? rosterEngine.toRelicLevel(unit.relic_tier)
      : Math.max(0, (unit.relic_tier || 0) - 2)
  },

  // ─── GP de uma unidade específica de um jogador (0 se não tem) ──────────
  _unitGP: function(player, unitId) {
    var unit = player.units ? player.units.find(function(u) { return u.base_id === unitId }) : null
    return unit ? (unit.gp || 0) : 0
  },

  // ─── Verifica se uma unidade é nave ──────────────────────────────────────
  _isShip: function(unitId) {
    return (typeof SHIP_IDS !== 'undefined') && !!SHIP_IDS[unitId]
  },

  // ─── Candidatos para um slot, ordenados por prioridade ───────────────────
  // Retorna array de { playerId, playerName, relic, unitGP, atMin }
  //   atMin = true se relic === relicMin (candidato preferencial)
  //
  // Para naves: elegível se rarity >= 7 (7 estrelas); relic registrado como 7
  // Para personagens: elegível se relic >= relicMin
  // Ordenação: min exato primeiro → menor relic → menor GP do personagem específico
  // (personagem mais fraco vai pro platoon; o mais forte fica disponível pra batalha)
  _candidatesForSlot: function(unitId, relicMin, rosterMap) {
    var ce = platoonAllocEngine
    var isShip = ce._isShip(unitId)
    var candidates = []

    Object.values(rosterMap).forEach(function(player) {
      var unit = player.units ? player.units.find(function(u) { return u.base_id === unitId }) : null
      if (!unit) return

      if (isShip) {
        if ((unit.rarity || 0) < 7) return  // nave não tem 7 estrelas
        candidates.push({
          playerId:   player.playerId || player.name,
          playerName: player.name,
          relic:      7,  // representação simbólica para naves 7★
          unitGP:     ce._unitGP(player, unitId),
          atMin:      true  // todas naves 7★ estão no "mínimo"
        })
      } else {
        var relic = ce._unitRelic(player, unitId)
        if (relic < relicMin) return  // não tem no nível mínimo
        candidates.push({
          playerId:   player.playerId || player.name,
          playerName: player.name,
          relic:      relic,
          unitGP:     ce._unitGP(player, unitId),
          atMin:      relic === relicMin
        })
      }
    })

    // Ordenar: min exato primeiro, depois menor relic, depois menor GP do personagem
    candidates.sort(function(a, b) {
      if (a.atMin !== b.atMin) return a.atMin ? -1 : 1
      if (a.relic !== b.relic) return a.relic - b.relic
      return a.unitGP - b.unitGP
    })

    return candidates
  },

  // ─── Verifica se a unidade aparece como requisito em batalha do planeta ──
  // Retorna array de missões (número) onde a unidade é necessária, ou []
  _unitInBattleMissions: function(unitId, planetName) {
    if (typeof MISSION_SQUADS === 'undefined') return []
    var planetSquads = MISSION_SQUADS[planetName]
    if (!planetSquads) return []

    var conflictMissions = []
    Object.keys(planetSquads).forEach(function(missionN) {
      var squads = planetSquads[missionN]
      if (!squads || squads.length === 0) return
      var appearsInAll = squads.every(function(squad) {
        return squad.require.indexOf(unitId) >= 0
      })
      if (appearsInAll) conflictMissions.push(Number(missionN))
    })
    return conflictMissions
  },

  // ─── Squads alternativos para o jogador numa missão sem a unidade alocada ─
  // Retorna nomes dos squads que o jogador consegue fazer na missão
  // excluindo squads que requerem unitId
  _alternativeSquads: function(player, unitId, planetName, missionN, relicMin) {
    if (typeof MISSION_SQUADS === 'undefined') return []
    var planetSquads = MISSION_SQUADS[planetName]
    if (!planetSquads) return []
    var squads = planetSquads[missionN]
    if (!squads || squads.length === 0) return []

    var alts = []
    squads.forEach(function(squad) {
      if (squad.require.indexOf(unitId) >= 0) return  // usa a unidade alocada, skip
      var canDo = squad.require.every(function(uid) {
        var unit = player.units ? player.units.find(function(u) { return u.base_id === uid }) : null
        if (!unit) return false
        if (squad.isShip) return unit.rarity >= 7
        var relic = (typeof rosterEngine !== 'undefined')
          ? rosterEngine.toRelicLevel(unit.relic_tier)
          : Math.max(0, (unit.relic_tier || 0) - 2)
        return relic >= relicMin
      })
      if (canDo) {
        var names = squad.require.map(function(uid) {
          return (typeof getUnitName === 'function') ? getUnitName(uid) : uid
        })
        alts.push(names.join(' + '))
      }
    })
    return alts
  },

  // ─── Gera alocação completa para todos os planetas ativos ────────────────
  // Retorna objeto com estrutura:
  //   { planetName: { opN: [ { slot, unitId, player, relic, surplus, conflict } ] } }
  // onde conflict = null | { missions:[N], alternatives:['squad string',...] }
  //
  // Slots com surplus > SURPLUS_THRESHOLD são marcados como automáticos (sem exibição)
  // Slots com surplus <= SURPLUS_THRESHOLD são exibidos no mini-painel
  SURPLUS_THRESHOLD: 3,

  buildAllocation: function(rosterMap) {
    if (!rosterMap || typeof platoonRequirements === 'undefined') return {}

    var ce = platoonAllocEngine
    var activePlanets = Object.keys(state.planets)
      .filter(function(name) { return state.planets[name] && state.planets[name].phase })

    var result = {}
    // Rastrear quem já foi alocado por planeta (playerId → [unitId])
    // para detectar conflitos de múltiplos slots
    var allocatedByPlanet = {}

    activePlanets.forEach(function(planetName) {
      var platoonKey = (typeof PLANET_PLATOON_KEY !== 'undefined') ? PLANET_PLATOON_KEY[planetName] : null
      var requirements = platoonKey ? platoonRequirements[platoonKey] : null
      if (!requirements) return

      var tier    = (typeof getPlanetTier === 'function') ? getPlanetTier(planetName) : 1
      var relicMin = (typeof TIER_RELIC !== 'undefined') ? (TIER_RELIC[tier] || 5) : 5

      if (!allocatedByPlanet[planetName]) allocatedByPlanet[planetName] = {}
      result[planetName] = {}

      Object.keys(requirements).forEach(function(opStr) {
        var op    = Number(opStr)
        var slots = requirements[opStr]
        result[planetName][op] = []

        // Contar quantas vezes cada unitId aparece nesta op
        var unitCount = {}
        slots.forEach(function(slot) {
          var uid = slot.unitId || slot
          unitCount[uid] = (unitCount[uid] || 0) + 1
        })

        // Para cada unitId único na op, alocar os jogadores necessários
        var allocPerUnit = {}  // unitId → [playerId alocado]
        Object.keys(unitCount).forEach(function(unitId) {
          var needed     = unitCount[unitId]
          var candidates = ce._candidatesForSlot(unitId, relicMin, rosterMap)
          var surplus    = candidates.length - needed

          allocPerUnit[unitId] = []

          // Pegar os 'needed' primeiros candidatos não ainda alocados nesta op
          var picked = 0
          var slotStartIdx = result[planetName][op].length  // índice antes de inserir slots desta unitId
          for (var ci = 0; ci < candidates.length && picked < needed; ci++) {
            var cand = candidates[ci]
            // Evitar alocar o mesmo jogador 2x na mesma op
            if (allocPerUnit[unitId].indexOf(cand.playerId) >= 0) continue
            allocPerUnit[unitId].push(cand.playerId)

            // Verificar conflito de batalha
            var conflictMissions = ce._unitInBattleMissions(unitId, planetName)
            var conflict = null
            if (conflictMissions.length > 0) {
              // Buscar objeto do jogador
              var playerObj = Object.values(rosterMap).find(function(p) {
                return (p.playerId || p.name) === cand.playerId
              })
              var alts = []
              conflictMissions.forEach(function(mN) {
                var a = ce._alternativeSquads(playerObj, unitId, planetName, mN, relicMin)
                alts = alts.concat(a)
              })
              // Deduplicar alternativas
              alts = alts.filter(function(v, i, arr) { return arr.indexOf(v) === i })
              conflict = { missions: conflictMissions, alternatives: alts }
            }

            result[planetName][op].push({
              unitId:     unitId,
              playerId:   cand.playerId,
              playerName: cand.playerName,
              relic:      cand.relic,
              surplus:    surplus,
              isTight:    surplus <= ce.SURPLUS_THRESHOLD,
              conflict:   conflict
            })
            picked++
          }

          // Candidatos excedentes (não alocados) — para exibição no modal
          var surplusCandidates = candidates.filter(function(c) {
            return allocPerUnit[unitId].indexOf(c.playerId) < 0
          })

          // Retroativamente adicionar surplusCandidates aos slots desta unitId recém-inseridos
          for (var si = slotStartIdx; si < result[planetName][op].length; si++) {
            result[planetName][op][si].surplusCandidates = surplusCandidates
          }

          // Se não conseguiu alocar todos (faltam candidatos), inserir placeholders
          for (var fi = picked; fi < needed; fi++) {
            result[planetName][op].push({
              unitId:            unitId,
              playerId:          null,
              playerName:        null,
              relic:             -1,
              surplus:           candidates.length - needed,
              isTight:           true,
              conflict:          null,
              surplusCandidates: []
            })
          }
        })
      })
    })

    return result
  },

  // ─── Salvar alocação no localStorage ─────────────────────────────────────
  save: function(allocation) {
    try { localStorage.setItem(platoonAllocEngine._key(platoonAllocEngine.STORAGE_KEY), JSON.stringify(allocation)) } catch(e) {}
  },

  // ─── Carregar alocação salva ──────────────────────────────────────────────
  load: function() {
    try {
      var d = localStorage.getItem(platoonAllocEngine._key(platoonAllocEngine.STORAGE_KEY))
      return d ? JSON.parse(d) : {}
    } catch(e) { return {} }
  },

  // ─── Recalcula e salva (chamado após sync) ────────────────────────────────
  computeAndStore: function(rosterMap) {
    var alloc = platoonAllocEngine.buildAllocation(rosterMap)
    platoonAllocEngine.save(alloc)
    return alloc
  },

  // ─── Retorna apenas slots tight de um planeta/op (para UI) ───────────────
  getTightSlots: function(planetName, op) {
    var alloc = platoonAllocEngine.load()
    if (!alloc[planetName] || !alloc[planetName][op]) return []
    return alloc[planetName][op].filter(function(s) { return s.isTight })
  }

}
