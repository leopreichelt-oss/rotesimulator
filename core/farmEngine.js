/**
 * farmEngine.js
 * Gera lista de farm de personagens para platoons de ROTE.
 *
 * Prioridade de planetas:
 *   1. Ativos com déficit real (missing/impossible) — bloqueando agora
 *   2. Mesmo tier, ainda não jogados — próxima expansão iminente
 *   3. Próximo tier (maxTier+1) — planeta com menor déficit total (closest to complete)
 *   Tier+2 e acima: ignorados
 *
 * Distribuição de players:
 *   - Total de slots = players ativos
 *   - Preenche tier 1 primeiro, restantes vão para tier 2, depois tier 3
 *   - 1 personagem por player por vez
 *   - Candidatos ordenados: tem o char (menor diff de relic) → não tem (menor GP)
 *   - Limite histórico: 10 personagens por player por planeta
 *
 * Persistência:
 *   - Ao rodar novamente: mantém assignments em andamento
 *   - Detecta jogadores sem progresso desde a última atribuição
 *   - Libera players que completaram o farm
 */

var farmEngine = {

  STORAGE_KEY: 'rote_farm_assignments_v1',
  PLANET_HISTORY_KEY: 'rote_farm_planet_history_v1',
  PLANET_LIMIT: 10,

  _key: function(base) {
    var ac = localStorage.getItem('rote_allycode') || ''
    return ac ? (base + '_' + ac) : base
  },

  // --------------------------------------------------
  // PERSISTÊNCIA
  // --------------------------------------------------

  loadAssignments: function() {
    try { return JSON.parse(localStorage.getItem(farmEngine._key(farmEngine.STORAGE_KEY)) || '{}') } catch(e) { return {} }
  },

  saveAssignments: function(obj) {
    try { localStorage.setItem(farmEngine._key(farmEngine.STORAGE_KEY), JSON.stringify(obj)) } catch(e) {}
  },

  loadPlanetHistory: function() {
    try { return JSON.parse(localStorage.getItem(farmEngine._key(farmEngine.PLANET_HISTORY_KEY)) || '{}') } catch(e) { return {} }
  },

  savePlanetHistory: function(obj) {
    try { localStorage.setItem(farmEngine._key(farmEngine.PLANET_HISTORY_KEY), JSON.stringify(obj)) } catch(e) {}
  },

  // --------------------------------------------------
  // AUXILIARES
  // --------------------------------------------------

  // DS | MS | LS | BONUS
  getPlanetAlignment: function(planetName) {
    var key = typeof PLANET_PLATOON_KEY !== 'undefined' ? PLANET_PLATOON_KEY[planetName] : null
    if (!key) return 'unknown'
    if (key.indexOf('_DS') !== -1) return 'DS'
    if (key.indexOf('_MS') !== -1) return 'MS'
    if (key.indexOf('_LS') !== -1) return 'LS'
    return 'BONUS'
  },

  getMaxActiveTier: function() {
    var max = 0
    Object.keys(state.planets).forEach(function(name) {
      if (state.planets[name] && state.planets[name].phase) {
        var t = getPlanetTier(name)
        if (t > max) max = t
      }
    })
    return max
  },

  // Nível de relic atual de um jogador para uma unidade (-1 = não tem)
  _playerRelicFor: function(player, unitId) {
    var unit = player.units.find(function(u) { return u.base_id === unitId })
    if (!unit) return -1
    if (unit.combat_type === 2) return unit.rarity >= 7 ? 99 : unit.rarity  // naves: 7★ = ok
    return (typeof rosterEngine !== 'undefined')
      ? rosterEngine.toRelicLevel(unit.relic_tier)
      : (unit.relic_tier - 2)
  },

  // GP por player (carregado sob demanda, cacheado na chamada)
  _loadGPMap: function() {
    return (typeof rosterEngine !== 'undefined') ? rosterEngine.loadGuildGP() : {}
  },

  // --------------------------------------------------
  // DÉFICITS DE UM PLANETA
  // --------------------------------------------------

  // Retorna [{unitId, targetRelic, needed, have, deficit, candidates}]
  // Só inclui personagens com déficit real (have < needed).
  computePlanetDeficits: function(planetName, activeRosterMap, fullRosterMap, gpMap) {
    var tier = getPlanetTier(planetName)
    var relicMin = (typeof TIER_RELIC !== 'undefined' ? TIER_RELIC[tier] : null) || 5
    var platoonKey = (typeof PLANET_PLATOON_KEY !== 'undefined') ? PLANET_PLATOON_KEY[planetName] : null
    var requirements = (platoonKey && typeof platoonRequirements !== 'undefined') ? platoonRequirements[platoonKey] : null
    if (!requirements) return []

    // Contar slots por personagem
    var unitSlots = {}
    Object.keys(requirements).forEach(function(op) {
      requirements[op].forEach(function(slot) {
        var id = slot.unitId || slot
        unitSlots[id] = (unitSlots[id] || 0) + 1
      })
    })

    // Candidatos de farm = apenas jogadores ativos (nunca inativos/margem)
    var roster = activeRosterMap
    var results = []

    Object.keys(unitSlots).forEach(function(unitId) {
      var needed = unitSlots[unitId]
      var have = (typeof countPlayersWithUnit === 'function')
        ? countPlayersWithUnit(unitId, relicMin, activeRosterMap)
        : 0
      var deficit = Math.max(0, needed - have)
      if (deficit === 0) return

      // Montar lista de candidatos (quem ainda NÃO atende o requisito)
      var gp = gpMap || {}
      var candidates = []
      Object.values(roster).forEach(function(player) {
        var currentRelic = farmEngine._playerRelicFor(player, unitId)
        var meetsReq = currentRelic >= relicMin
        if (meetsReq) return
        var pid = player.playerId || player.name
        candidates.push({
          playerId: pid,
          name: player.name,
          gp: gp[pid] || player.gp || 0,
          currentRelic: currentRelic,
          relicDiff: relicMin - Math.max(0, currentRelic)
        })
      })

      // Ordenar: tem o char (currentRelic >= 0) antes de quem não tem
      // Dentro de cada grupo: menor relicDiff → menor GP
      candidates.sort(function(a, b) {
        var aHas = a.currentRelic >= 0 ? 1 : 0
        var bHas = b.currentRelic >= 0 ? 1 : 0
        if (bHas !== aHas) return bHas - aHas
        if (a.relicDiff !== b.relicDiff) return a.relicDiff - b.relicDiff
        return a.gp - b.gp
      })

      results.push({
        unitId: unitId,
        targetRelic: relicMin,
        needed: needed,
        have: have,
        deficit: deficit,
        candidates: candidates
      })
    })

    return results
  },

  // --------------------------------------------------
  // COLETA DÉFICITS POR PRIORIDADE
  // --------------------------------------------------

  collectAllDeficits: function(activeRosterMap, fullRosterMap) {
    var gpMap = farmEngine._loadGPMap()
    var activePlanets = Object.keys(state.planets)
      .filter(function(name) { return state.planets[name] && state.planets[name].phase })

    var maxTier = farmEngine.getMaxActiveTier()
    var allPlanetNames = Object.keys(typeof planetData !== 'undefined' ? planetData : {})

    // Verifica se um planeta bonus (unlock=specialMission) está desbloqueado
    function isBonusPlanetUnlocked(name) {
      var pd = typeof planetData !== 'undefined' ? planetData[name] : null
      if (!pd || pd.unlock !== 'specialMission') return true  // não é bonus, sem restrição
      var missionPlanet = pd.missionPlanet
      var sm = state.specialMission ? state.specialMission[missionPlanet] : null
      return sm === true || Number(sm) >= 30
    }

    var notPlayedSameTier = allPlanetNames.filter(function(name) {
      if (state.planets[name] && state.planets[name].phase) return false
      if (!isBonusPlanetUnlocked(name)) return false  // bonus bloqueado
      return getPlanetTier(name) === maxTier
    })

    var notPlayedNextTier = allPlanetNames.filter(function(name) {
      if (state.planets[name] && state.planets[name].phase) return false
      if (!isBonusPlanetUnlocked(name)) return false  // bonus bloqueado
      return getPlanetTier(name) === maxTier + 1
    })

    var deficits = []

    // Prioridade 1: planetas ativos com déficit real
    activePlanets.forEach(function(name) {
      farmEngine.computePlanetDeficits(name, activeRosterMap, fullRosterMap, gpMap).forEach(function(d) {
        deficits.push(Object.assign({}, d, { planet: name, tier: getPlanetTier(name), priority: 1 }))
      })
    })

    // Prioridade 2: mesmo tier, não jogados ainda
    notPlayedSameTier.forEach(function(name) {
      farmEngine.computePlanetDeficits(name, activeRosterMap, fullRosterMap, gpMap).forEach(function(d) {
        deficits.push(Object.assign({}, d, { planet: name, tier: getPlanetTier(name), priority: 2 }))
      })
    })

    // Prioridade 3: próximo tier — planeta com menor déficit total (closest to complete)
    if (notPlayedNextTier.length > 0) {
      var ranked = notPlayedNextTier.map(function(name) {
        var pd = farmEngine.computePlanetDeficits(name, activeRosterMap, fullRosterMap, gpMap)
        var total = pd.reduce(function(s, d) { return s + d.deficit }, 0)
        return { name: name, deficits: pd, total: total }
      })
      ranked.sort(function(a, b) { return a.total - b.total })

      var best = ranked[0]
      if (best && best.deficits.length > 0) {
        // Dentro do planeta: menor déficit primeiro (closest to complete this op)
        best.deficits.sort(function(a, b) { return a.deficit - b.deficit })
        best.deficits.forEach(function(d) {
          deficits.push(Object.assign({}, d, {
            planet: best.name,
            tier: getPlanetTier(best.name),
            priority: 3,
            nextTierRanking: ranked  // carrega ranking completo para exibição
          }))
        })
      }
    }

    return deficits
  },

  // --------------------------------------------------
  // PROGRESSO DOS ASSIGNMENTS ANTERIORES
  // --------------------------------------------------

  checkProgress: function(rosterMap) {
    var stored = farmEngine.loadAssignments()
    var now = Date.now()
    var completed = [], noProgress = [], inProgress = []

    Object.keys(stored).forEach(function(playerId) {
      var assignment = stored[playerId]
      var player = rosterMap[playerId]
      if (!player) return  // saiu da guilda

      var currentRelic = farmEngine._playerRelicFor(player, assignment.unitId)
      var relicBefore = assignment.relicAtAssignment  // -1 se não tinha o char

      if (currentRelic >= assignment.targetRelic) {
        completed.push({ playerId: playerId, name: player.name, assignment: assignment })
        return
      }

      // Considera progresso: se antes não tinha (relicBefore=-1) e agora tem (currentRelic>=0), progrediu
      var progressed = relicBefore < 0 ? currentRelic >= 0 : currentRelic > relicBefore

      if (!progressed) {
        var daysSince = Math.floor((now - (assignment.assignedAt || now)) / 86400000)
        noProgress.push({
          playerId: playerId,
          name: player.name,
          assignment: assignment,
          currentRelic: currentRelic,
          daysSince: daysSince
        })
      }

      inProgress.push({ playerId: playerId, name: player.name, assignment: assignment, currentRelic: currentRelic })
    })

    return { completed: completed, noProgress: noProgress, inProgress: inProgress }
  },

  // --------------------------------------------------
  // GERAR FARM LIST
  // --------------------------------------------------

  buildFarmList: function(rosterMap) {
    var fullRosterMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.load() : rosterMap
    var now = Date.now()

    // 1. Verificar progresso dos assignments anteriores
    var progress = farmEngine.checkProgress(rosterMap)

    // Players com assignment ativo (inProgress + noProgress mantêm assignment)
    var busyPlayerIds = {}
    progress.inProgress.forEach(function(p) { busyPlayerIds[p.playerId] = true })

    // 2. Coletar déficits por prioridade
    var deficits = farmEngine.collectAllDeficits(rosterMap, fullRosterMap)

    // 3. Histórico por planeta (limite de 10 por jogador por planeta)
    var planetHistory = farmEngine.loadPlanetHistory()

    // 4. Players livres (sem assignment ativo), ordenados por GP asc
    var freePlayers = Object.values(rosterMap)
      .filter(function(p) { return !busyPlayerIds[p.playerId || p.name] })
      .sort(function(a, b) { return (a.gp || 0) - (b.gp || 0) })

    var freePlayerIds = {}
    freePlayers.forEach(function(p) { freePlayerIds[p.playerId || p.name] = true })

    // 5. Distribuir players livres pelos déficits
    var newAssignments = {}
    var usedFreeIds = {}

    deficits.forEach(function(deficit) {
      var slotsToFill = deficit.deficit
      var requestCount = slotsToFill + Math.ceil(slotsToFill / 3)

      var assigned = 0
      deficit.candidates.forEach(function(candidate) {
        if (assigned >= requestCount) return
        var pid = candidate.playerId
        if (!freePlayerIds[pid]) return
        if (usedFreeIds[pid]) return

        // Verificar limite histórico por planeta
        var history = (planetHistory[pid] || {})[deficit.planet] || 0
        if (history >= farmEngine.PLANET_LIMIT) return

        usedFreeIds[pid] = true
        assigned++

        // Atualizar histórico
        if (!planetHistory[pid]) planetHistory[pid] = {}
        planetHistory[pid][deficit.planet] = history + 1

        newAssignments[pid] = {
          unitId: deficit.unitId,
          targetRelic: deficit.targetRelic,
          planet: deficit.planet,
          priority: deficit.priority,
          assignedAt: now,
          relicAtAssignment: candidate.currentRelic,
          playerName: candidate.name
        }
      })
    })

    farmEngine.savePlanetHistory(planetHistory)

    // 6. Combinar assignments: existentes (em progresso) + novos
    var storedAll = farmEngine.loadAssignments()
    var finalAssignments = {}

    // Manter assignments em progresso
    progress.inProgress.forEach(function(p) {
      finalAssignments[p.playerId] = storedAll[p.playerId]
    })

    // Adicionar novos
    Object.keys(newAssignments).forEach(function(pid) {
      finalAssignments[pid] = newAssignments[pid]
    })

    farmEngine.saveAssignments(finalAssignments)

    return {
      assignments: finalAssignments,
      noProgress: progress.noProgress,
      completed: progress.completed,
      deficits: deficits,
      newCount: Object.keys(newAssignments).length
    }
  },

  // --------------------------------------------------
  // CRÍTICOS — para a seção sempre visível na UI
  // --------------------------------------------------

  // Retorna personagens que bloqueiam planetas ativos agora
  getCriticalBlockers: function(rosterMap) {
    var blockers = []
    var activePlanets = Object.keys(state.planets)
      .filter(function(name) { return state.planets[name] && state.planets[name].phase })

    activePlanets.forEach(function(name) {
      var tier = getPlanetTier(name)
      var relicMin = (typeof TIER_RELIC !== 'undefined' ? TIER_RELIC[tier] : null) || 5
      var platoonKey = (typeof PLANET_PLATOON_KEY !== 'undefined') ? PLANET_PLATOON_KEY[name] : null
      var requirements = (platoonKey && typeof platoonRequirements !== 'undefined') ? platoonRequirements[platoonKey] : null

      // Reusar analyzePlanetPlatoon se disponível
      if (typeof analyzePlanetPlatoon !== 'function' || !requirements) return

      var activePlanetList = Object.keys(state.planets)
        .filter(function(n) { return state.planets[n] && state.planets[n].phase })

      var analysis = analyzePlanetPlatoon(name, requirements, relicMin, rosterMap, activePlanetList)
      analysis.results.forEach(function(r) {
        if (r.status === 'missing' || r.status === 'impossible') {
          blockers.push({
            planet: name,
            tier: tier,
            unitId: r.id,
            have: r.have,
            needed: r.needed,
            faltam: r.faltam || r.needed,
            status: r.status
          })
        }
      })
    })

    return blockers
  }

}
