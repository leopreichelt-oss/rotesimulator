// =====================================================
// MAPEAMENTO PLANETA → CHAVE DO PLATOON
// =====================================================
var PLANET_PLATOON_KEY = {
  "Mustafar":              "F1_DS",
  "Corellia":              "F1_MS",
  "Coruscant":             "F1_LS",
  "Geonosis":              "F2_DS",
  "Felucia":               "F2_MS",
  "Bracca":                "F2_LS",
  "Dathomir":              "F3_DS",
  "Tatooine":              "F3_MS",
  "Zeffo":                 "F3_BONUS_BRACCA",
  "Kashyyyk":              "F3_LS",
  "Haven Medical Station": "F4_DS",
  "Mandalore":             "F4_BONUS_MANDALORE",
  "Kessel":                "F4_MS",
  "Lothal":                "F4_LS",
  "Malachor":              "F5_DS",
  "Vandor":                "F5_MS",
  "Kafrene":               "F5_LS",
  "Death Star":            "F6_DS",
  "Hoth":                  "F6_MS",
  "Scarif":                "F6_LS"
}

var TIER_RELIC = { 1:5, 2:6, 3:7, 4:8, 5:9, 6:9 }

function getPlanetTier(name) {
  if (typeof planetData !== "undefined" && planetData[name]) return planetData[name].tier || 1
  return 1
}

var _platoonExpandState = _platoonExpandState || {}
function togglePlatoonExpand(key) {
  _platoonExpandState[key] = !_platoonExpandState[key]
  drawPlatoonList()
}

// =====================================================
// COMPUTAR BATALHAS AUTOMÁTICAS NO STATE (modo real)
// =====================================================
function updateAutoBattlesInState() {
  if (state.simulationMode) return

  if (typeof combatEngine !== 'undefined') {
    var stored = combatEngine.load()
    Object.keys(state.planets).forEach(function(name) {
      if (!state.planets[name] || !state.planets[name].phase) return
      var b = stored[name]
      if (b) state.planets[name].autoBattles = b.safeBattles
    })
    return
  }

  if (typeof computePlanetBattles === 'undefined') return
  Object.keys(state.planets).forEach(function(name) {
    if (!state.planets[name] || !state.planets[name].phase) return
    var b = computePlanetBattles(name)
    if (b) state.planets[name].autoBattles = b.safeBattles
  })
}

// =====================================================
// COMPUTAR PLATOONS AUTOMÁTICOS NO STATE
// =====================================================
function updateAutoPlatoonsInState() {
  var rosterMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.loadActive() : null
  if (!rosterMap || Object.keys(rosterMap).length === 0) return

  var activePlanets = Object.keys(state.planets)
    .filter(function(name) { return state.planets[name] && state.planets[name].phase })

  activePlanets.forEach(function(name) {
    var tier = getPlanetTier(name)
    var relicMin = TIER_RELIC[tier] || 5
    var platoonKey = PLANET_PLATOON_KEY[name]
    var requirements = platoonKey ? platoonRequirements[platoonKey] : null
    if (!requirements) return

    var totalOps = Object.keys(requirements).length
    var completableOps = 0

    for (var op = 1; op <= totalOps; op++) {
      var slots = requirements[op] || []
      var opComplete = slots.every(function(slot) {
        var id = slot.unitId || slot
        return countPlayersWithUnit(id, relicMin, rosterMap) >= 1
      })
      if (opComplete) completableOps++
    }

    state.planets[name].autoPlatoons = completableOps
  })
}

// =====================================================
// CONTAR JOGADORES COM UM PERSONAGEM NO RELIC MÍNIMO
// =====================================================
function countPlayersWithUnit(unitId, relicMin, rosterMap) {
  return Object.values(rosterMap).filter(function(player) {
    var unit = player.units.find(function(u) { return u.base_id === unitId })
    if (!unit) return false
    if (unit.combat_type === 2) return unit.rarity >= 7
    return rosterEngine.toRelicLevel(unit.relic_tier) >= relicMin
  }).length
}

// =====================================================
// LISTAR JOGADORES MAIS PROXIMOS (usado apenas na farm list)
// =====================================================
function getClosestPlayers(unitId, relicMin, rosterMap, howMany) {
  var players = Object.values(rosterMap).map(function(player) {
    var unit = player.units.find(function(u) { return u.base_id === unitId })
    var isShip = unit && unit.combat_type === 2
    var currentLevel = unit ? (isShip ? unit.rarity : rosterEngine.toRelicLevel(unit.relic_tier)) : -1
    var meetsReq = unit ? (isShip ? unit.rarity >= 7 : currentLevel >= relicMin) : false
    if (meetsReq) return null
    return { name: player.name, currentLevel: currentLevel, isShip: isShip }
  }).filter(Boolean)
  players.sort(function(a, b) { return b.currentLevel - a.currentLevel })
  return players.slice(0, howMany)
}

// =====================================================
// CALCULAR DEMANDA TOTAL DE UMA FASE (todos planetas objetivo)
// =====================================================
function calcDemandaPorFase(fase, allActivePlanets) {
  var demanda = {}
  allActivePlanets.forEach(function(name) {
    if (Number(state.planets[name].phase) !== fase) return
    var key = PLANET_PLATOON_KEY[name]
    var req = key ? platoonRequirements[key] : null
    if (!req) return
    Object.keys(req).forEach(function(op) {
      req[op].forEach(function(slot) {
        var id = slot.unitId || slot
        demanda[id] = (demanda[id] || 0) + 1
      })
    })
  })
  return demanda
}

// =====================================================
// ANÁLISE COMBINADA DE UM GRUPO DE PLANETAS (mesma fase)
// Trata todos os planetas da fase como uma única unidade:
//   needed = soma de slots de todos os planetas do grupo
//   have   = jogadores que atendem o requisito (do tier mais alto do grupo)
//   Status usa acumulação por fase igual ao analyzer individual
// =====================================================
function analyzePhaseGroup(planetsInPhase, rosterMap, allActivePlanets) {
  // Merge de todos os slots por personagem, usando o relicMin do planeta que exige
  var unitNeeds = {}  // unitId → { needed, relicMin }

  planetsInPhase.forEach(function(name) {
    var tier = getPlanetTier(name)
    var relicMin = TIER_RELIC[tier] || 5
    var platoonKey = PLANET_PLATOON_KEY[name]
    var requirements = platoonKey ? platoonRequirements[platoonKey] : null
    if (!requirements) return
    Object.keys(requirements).forEach(function(op) {
      requirements[op].forEach(function(slot) {
        var id = slot.unitId || slot
        if (!unitNeeds[id]) unitNeeds[id] = { needed: 0, relicMin: relicMin }
        unitNeeds[id].needed++
        // Usar o maior relicMin (requisito mais exigente)
        unitNeeds[id].relicMin = Math.max(unitNeeds[id].relicMin, relicMin)
      })
    })
  })

  var phaseObjetivo = Number(state.planets[planetsInPhase[0]].phase)
  var minTier = Math.min.apply(null, planetsInPhase.map(getPlanetTier))

  var fasesAtivas = []
  for (var f = minTier; f <= phaseObjetivo; f++) fasesAtivas.push(f)
  var fasesDisponiveis = fasesAtivas.length

  var results = []

  Object.keys(unitNeeds).forEach(function(id) {
    var needed   = unitNeeds[id].needed
    var relicMin = unitNeeds[id].relicMin
    var totalHave = countPlayersWithUnit(id, relicMin, rosterMap)

    if (totalHave === 0) {
      results.push({ id: id, needed: needed, have: 0, relicMin: relicMin,
        status: 'missing', request: needed + Math.ceil(needed / 3) })
      return
    }

    var slotsAcumulados = 0
    var fasesNecessarias = fasesDisponiveis + 1

    for (var fi = 0; fi < fasesAtivas.length; fi++) {
      var fase = fasesAtivas[fi]
      var demandaFase = calcDemandaPorFase(fase, allActivePlanets)
      var demandaOutros = demandaFase[id] || 0
      // Na fase objetivo: subtrair a demanda do próprio grupo (evita dupla contagem)
      if (fase === phaseObjetivo) demandaOutros = Math.max(0, demandaOutros - needed)
      var dispNaFase = Math.max(0, totalHave - demandaOutros)
      slotsAcumulados += dispNaFase
      if (slotsAcumulados >= needed) {
        fasesNecessarias = fi + 1
        break
      }
    }

    if (fasesNecessarias <= fasesDisponiveis) {
      // Verificar se completa direto na fase objetivo
      var dFaseObj   = calcDemandaPorFase(phaseObjetivo, allActivePlanets)
      var dOutros    = Math.max(0, (dFaseObj[id] || 0) - needed)
      var dispFaseObj = Math.max(0, totalHave - dOutros)
      var completaNaFaseObj = dispFaseObj >= needed

      results.push({
        id: id, needed: needed, have: totalHave, relicMin: relicMin,
        fasesNecessarias: fasesNecessarias, fasesDisponiveis: fasesDisponiveis,
        status: completaNaFaseObj && fasesNecessarias === 1 ? 'ok'
               : completaNaFaseObj ? 'normal'
               : 'prealoca'
      })
    } else {
      var faltam = needed - slotsAcumulados
      results.push({
        id: id, needed: needed, have: totalHave, relicMin: relicMin,
        faltam: faltam, request: faltam + Math.ceil(faltam / 3),
        status: 'impossible'
      })
    }
  })

  return { results: results, fasesDisponiveis: fasesDisponiveis }
}

// Mantido para compatibilidade (farmEngine e drawFarmCritical usam)
function analyzePlanetPlatoon(planetName, requirements, relicMin, rosterMap, allActivePlanets) {
  return analyzePhaseGroup([planetName], rosterMap, allActivePlanets)
}

// =====================================================
// DESENHAR COLUNA DE PLATOONS — agrupado por fase
// =====================================================
function drawPlatoonList() {
  var container = document.getElementById("platoonList")
  if (!container) return

  if (typeof platoonRequirements === "undefined") {
    container.innerHTML = '<div style="color:#f87171;font-size:11px;">platoonRequirements.js não carregado.</div>'
    return
  }

  container.innerHTML = ""

  var activePlanets = Object.keys(state.planets)
    .filter(function(name) { return state.planets[name] && state.planets[name].phase })
    .sort(function(a, b) { return Number(state.planets[a].phase) - Number(state.planets[b].phase) })

  if (activePlanets.length === 0) {
    container.innerHTML = '<div style="color:#94a3b8;font-size:11px;">Nenhum planeta configurado.</div>'
    return
  }

  var rosterMapFull = (typeof rosterEngine !== "undefined") ? rosterEngine.load() : null
  var rosterMap = (typeof rosterEngine !== "undefined") ? rosterEngine.loadActive() : null
  var hasRoster = rosterMap && Object.keys(rosterMap).length > 0

  // Aviso de jogadores excluídos
  var fullCount   = rosterMapFull ? Object.keys(rosterMapFull).length : 0
  var activeCount = rosterMap ? Object.keys(rosterMap).length : 0
  var excludedCount = fullCount - activeCount
  if (excludedCount > 0) {
    var notice = document.createElement('div')
    notice.style.cssText = 'font-size:10px;color:#f59e0b;margin-bottom:8px;padding:4px 6px;background:#78350f22;border-radius:4px;border-left:2px solid #f59e0b;'
    notice.textContent = '⚠ ' + excludedCount + ' jogador(es) excluído(s) da análise (inativos/margem)'
    container.appendChild(notice)
  }

  // Agrupar planetas por fase
  var phaseGroups = {}
  activePlanets.forEach(function(name) {
    var phase = String(state.planets[name].phase)
    if (!phaseGroups[phase]) phaseGroups[phase] = []
    phaseGroups[phase].push(name)
  })

  var phases = Object.keys(phaseGroups).sort(function(a, b) { return Number(a) - Number(b) })

  phases.forEach(function(phase) {
    var planets = phaseGroups[phase]
    var div = document.createElement("div")
    div.style.cssText = "margin-bottom:10px;padding:8px;border-radius:6px;background:#1e3a5f;border-left:3px solid #334155;"

    if (hasRoster) {
      var analysis = analyzePhaseGroup(planets, rosterMap, activePlanets)
      _renderPhaseGroup(div, phase, planets, analysis)
    } else {
      _renderPhaseGroupManual(div, phase, planets)
    }

    container.appendChild(div)
  })

  // Botões de farm
  if (hasRoster) {
    var btnDiv = document.createElement('div')
    btnDiv.style.cssText = 'margin-top:12px;display:flex;flex-direction:column;gap:6px;'

    var btn1 = document.createElement('button')
    btn1.textContent = '📋 Farm de platoon'
    btn1.style.cssText = 'width:100%;padding:8px;background:#1e40af;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;'
    btn1.onmouseover = function() { btn1.style.background = '#1d4ed8' }
    btn1.onmouseout  = function() { btn1.style.background = '#1e40af' }
    btn1.onclick = _copyFarmListToClipboard

    var btn2 = document.createElement('button')
    btn2.textContent = '⚔️ Farm esquadrões/naves'
    btn2.style.cssText = 'width:100%;padding:8px;background:#065f46;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;'
    btn2.onmouseover = function() { btn2.style.background = '#047857' }
    btn2.onmouseout  = function() { btn2.style.background = '#065f46' }
    btn2.onclick = function() { _showSquadFarmModal() }

    btnDiv.appendChild(btn1)
    btnDiv.appendChild(btn2)
    container.appendChild(btnDiv)
  }
}

// =====================================================
// BANNER DE MISSÃO ESPECIAL (Bracca → Zeffo, Tatooine → Mandalore)
// =====================================================
function _specialMissionBanner(planets) {
  var banners = []
  planets.forEach(function(name) {
    var bonusPlanet = Object.keys(typeof planetData !== 'undefined' ? planetData : {}).find(function(p) {
      return planetData[p].unlock === 'specialMission' && planetData[p].missionPlanet === name
    })
    if (!bonusPlanet) return
    var sm = state.specialMission ? state.specialMission[name] : null
    var victories = sm === true ? 30 : (Number(sm) || 0)
    var unlocked = victories >= 30
    var color = unlocked ? '#4ade80' : '#f59e0b'
    var icon  = unlocked ? '🔓' : '🔒'
    var txt = unlocked
      ? icon + ' ' + bonusPlanet + ' desbloqueado (' + victories + ' vitórias)'
      : icon + ' Missão especial de ' + name + ': ' + victories + '/30 vitórias → libera ' + bonusPlanet
    banners.push('<div style="font-size:10px;color:' + color + ';margin-top:3px;">' + txt + '</div>')
  })
  return banners.join('')
}

// =====================================================
// RENDER GRUPO DE FASE COM ROSTER
// =====================================================
function _renderPhaseGroup(div, phase, planets, analysis) {
  var results = analysis.results
  var fasesDisponiveis = analysis.fasesDisponiveis

  // Header: F3: Felucia + Bracca (R7+) (2 fases disp.)
  var maxRelicMin = Math.max.apply(null, planets.map(function(name) {
    return TIER_RELIC[getPlanetTier(name)] || 5
  }))
  var fasesInfo = fasesDisponiveis > 1
    ? ' <span style="color:#60a5fa;font-size:10px;">(' + fasesDisponiveis + ' fases disp.)</span>' : ''

  var specialBanner = _specialMissionBanner(planets)

  var header = '<div style="font-weight:bold;color:#4da6ff;margin-bottom:4px;">'
    + 'F' + phase + ': ' + planets.join(' + ')
    + ' <span style="color:#94a3b8;font-weight:normal;">(R' + maxRelicMin + '+)</span>'
    + fasesInfo + '</div>'
    + specialBanner

  var missing    = results.filter(function(r) { return r.status === 'missing' })
  var impossible = results.filter(function(r) { return r.status === 'impossible' })
  var prealoca   = results.filter(function(r) { return r.status === 'prealoca' })

  // Tudo ok
  if (missing.length === 0 && impossible.length === 0 && prealoca.length === 0) {
    div.style.borderLeft = "3px solid #4ade80"
    div.innerHTML = header + '<div style="color:#4ade80;">✅ Platoons completos em 1 fase</div>'
    return
  }

  // Só prealoca (verde claro)
  if (missing.length === 0 && impossible.length === 0) {
    var maxFases = Math.max.apply(null, prealoca.map(function(r) { return r.fasesNecessarias }))
    div.style.borderLeft = "3px solid #86efac"
    var statusLine = '<div style="color:#86efac;font-size:11px;margin-bottom:4px;">'
      + '✅ Completável em ' + maxFases + ' fase(s) — alocar antecipadamente</div>'

    var lista = '<div>'
    prealoca.forEach(function(r) {
      lista += '<div style="color:#fbbf24;font-size:11px;margin-bottom:2px;">'
        + '⚠ ' + getUnitName(r.id)
        + ' <span style="color:#64748b;">' + r.have + '/' + r.needed + '</span>'
        + '</div>'
    })
    lista += '</div>'
    div.innerHTML = header + statusLine + lista
    return
  }

  // Tem problemas reais
  var borderColor = missing.length > 0 ? "#f87171" : "#f97316"
  div.style.borderLeft = "3px solid " + borderColor

  var partes = []
  if (missing.length > 0)    partes.push(missing.length + ' sem ninguém na guilda')
  if (impossible.length > 0) partes.push(impossible.length + ' impossíveis de completar')
  if (prealoca.length > 0)   partes.push(prealoca.length + ' precisam de pré-alocação')

  var resumo = '<div style="color:#94a3b8;font-size:11px;margin-bottom:6px;">'
    + partes.join(' — ') + '</div>'

  var groupKey = planets.join('|')
  var allProblems = missing.concat(impossible).concat(prealoca)
  var PREVIEW = 5
  var expanded = !!_platoonExpandState[groupKey]
  var visible = expanded ? allProblems : allProblems.slice(0, PREVIEW)

  var lista = '<div>'
  visible.forEach(function(r) {
    var uname = getUnitName(r.id)
    var color, icon, sub

    if (r.status === 'missing') {
      color = "#f87171"; icon = "❌"
      sub = "nenhum — precisa de " + r.request
    } else if (r.status === 'impossible') {
      color = "#f97316"; icon = "❌"
      sub = r.have + '/' + r.needed + ' — faltam ' + r.faltam
    } else {
      // prealoca
      color = "#fbbf24"; icon = "⚠"
      sub = r.have + '/' + r.needed + ' — pré-alocar em ' + r.fasesNecessarias + ' fase(s)'
    }

    lista += '<div style="color:' + color + ';font-size:11px;margin-bottom:3px;">'
      + icon + ' ' + uname
      + ' <span style="color:#64748b;">' + sub + '</span></div>'
  })
  lista += '</div>'

  var btnHtml = ''
  if (allProblems.length > PREVIEW) {
    var resto = allProblems.length - PREVIEW
    var btnLabel = expanded ? '▲ ver menos' : '▼ +' + resto + ' outros'
    var escapedKey = groupKey.replace(/'/g, "\\'")
    btnHtml = '<div style="margin-top:4px;">'
      + '<button onclick="togglePlatoonExpand(\'' + escapedKey + '\')"'
      + ' style="background:none;border:none;color:#60a5fa;font-size:11px;cursor:pointer;padding:0;">'
      + btnLabel + '</button></div>'
  }

  div.innerHTML = header + resumo + lista + btnHtml
}

// =====================================================
// RENDER MANUAL (fallback sem roster) — agrupado por fase
// =====================================================
function _renderPhaseGroupManual(div, phase, planets) {
  var maxRelicMin = Math.max.apply(null, planets.map(function(name) {
    return TIER_RELIC[getPlanetTier(name)] || 5
  }))
  var header = '<div style="font-weight:bold;color:#4da6ff;margin-bottom:4px;">'
    + 'F' + phase + ': ' + planets.join(' + ')
    + ' <span style="color:#94a3b8;font-weight:normal;">(R' + maxRelicMin + '+)</span></div>'

  // Merge de operações de todos os planetas
  var allOpsCount = 0
  var completedOps = 0
  var missingUnits = {}

  planets.forEach(function(name) {
    var platoonKey = PLANET_PLATOON_KEY[name]
    var requirements = platoonKey ? platoonRequirements[platoonKey] : null
    if (!requirements) return
    var totalOps = Object.keys(requirements).length
    var platoons = Number((state.planets[name] || {}).platoons) || 0
    allOpsCount += totalOps
    completedOps += Math.min(platoons, totalOps)
    for (var op = platoons + 1; op <= totalOps; op++) {
      var slots = requirements[op] || []
      slots.forEach(function(slot) {
        var id = slot.unitId || slot
        missingUnits[id] = (missingUnits[id] || 0) + 1
      })
    }
  })

  if (completedOps >= allOpsCount) {
    div.style.borderLeft = "3px solid #4ade80"
    div.innerHTML = header + '<div style="color:#4ade80;">✅ Todos os platoons completos</div>'
    return
  }

  var borderColor = completedOps === 0 ? "#f87171"
    : completedOps < Math.ceil(allOpsCount / 2) ? "#f97316" : "#facc15"
  div.style.borderLeft = "3px solid " + borderColor

  var missingEntries = Object.keys(missingUnits).map(function(k) { return [k, missingUnits[k]] })
  var total = missingEntries.length
  var PREVIEW = 5
  var groupKey = planets.join('|')
  var expanded = !!_platoonExpandState[groupKey]
  var visible = expanded ? missingEntries : missingEntries.slice(0, PREVIEW)

  var resumo = '<div style="color:#94a3b8;font-size:11px;margin-bottom:6px;">'
    + completedOps + '/' + allOpsCount + ' ops — '
    + '<strong style="color:#fcd34d;">' + total + ' personagens</strong>'
    + ' <span style="color:#475569;">(sem roster)</span></div>'

  var lista = '<div>'
  visible.forEach(function(entry) {
    var id = entry[0], needed = entry[1]
    var request = needed + Math.ceil(needed / 3)
    lista += '<div style="color:#fcd34d;font-size:11px;margin-bottom:2px;">'
      + '⚠ ' + getUnitName(id) + ' ×' + needed
      + ' <span style="color:#94a3b8;">(pedir ' + request + ')</span></div>'
  })
  lista += '</div>'

  var btnHtml = ''
  if (total > PREVIEW) {
    var resto = total - PREVIEW
    var btnLabel = expanded ? '▲ ver menos' : '▼ +' + resto + ' outros'
    var escapedKey = groupKey.replace(/'/g, "\\'")
    btnHtml = '<div style="margin-top:4px;">'
      + '<button onclick="togglePlatoonExpand(\'' + escapedKey + '\')"'
      + ' style="background:none;border:none;color:#60a5fa;font-size:11px;cursor:pointer;padding:0;">'
      + btnLabel + '</button></div>'
  }

  div.innerHTML = header + resumo + lista + btnHtml
}

// =====================================================
// GERAR LISTA DE FARM PARA CLIPBOARD
// Gera diretamente dos déficits de platoon com 1 personagem por jogador
// =====================================================
function _copyFarmListToClipboard() {
  var rosterMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.loadActive() : null
  if (!rosterMap || Object.keys(rosterMap).length === 0) {
    _showCopyToast('❌ Sincronize o roster primeiro.')
    return
  }

  var now = new Date()
  var dateStr = now.getDate() + '/' + (now.getMonth()+1) + '/' + now.getFullYear()
  var lines = ['Farm List ROTE — ' + dateStr, '']

  // Coletar déficits por prioridade via farmEngine se disponível
  var deficits = []
  if (typeof farmEngine !== 'undefined') {
    var fullRoster = (typeof rosterEngine !== 'undefined') ? rosterEngine.load() : rosterMap
    deficits = farmEngine.collectAllDeficits(rosterMap, fullRoster)
  }

  if (deficits.length === 0) {
    _showCopyToast('✅ Nenhum déficit de platoon encontrado.')
    return
  }

  // 1 personagem por jogador — greedy por ordem de prioridade
  var assignedPlayers = {}  // playerId → unitId já atribuído
  var groupLines = { 1: [], 2: [], 3: [] }

  deficits.forEach(function(deficit) {
    var uname = (typeof getUnitName === 'function') ? getUnitName(deficit.unitId) : deficit.unitId
    var relicStr = 'R' + deficit.targetRelic
    var slotsToFill = deficit.deficit
    var toRequest = slotsToFill + Math.ceil(slotsToFill / 3)
    var assigned = 0
    var playerLines = []

    deficit.candidates.forEach(function(candidate) {
      if (assigned >= toRequest) return
      var pid = candidate.playerId
      if (assignedPlayers[pid]) return  // já tem 1 personagem

      assignedPlayers[pid] = deficit.unitId
      assigned++

      var relicNow = candidate.currentRelic < 0 ? 'sem o personagem' : 'R' + candidate.currentRelic
      playerLines.push('  • ' + candidate.name + ' (' + relicNow + ' → ' + relicStr + ')')
    })

    if (playerLines.length > 0) {
      var priority = deficit.priority || 1
      if (!groupLines[priority]) groupLines[priority] = []
      groupLines[priority].push(
        uname + ' ' + relicStr + ' — ' + deficit.planet + ' [' + playerLines.length + ' jogadores]'
      )
      playerLines.forEach(function(l) { groupLines[priority].push(l) })
    }
  })

  var groupLabels = {
    1: '🔴 CRÍTICO — Planetas ativos com déficit',
    2: '🟡 PRÓXIMO — Mesmo tier, não jogado ainda',
    3: '🔵 CRESCIMENTO — Próximo tier'
  }

  var grupos = [1, 2, 3]
  grupos.forEach(function(g) {
    if (!groupLines[g] || groupLines[g].length === 0) return
    lines.push(groupLabels[g])
    groupLines[g].forEach(function(l) { lines.push(l) })
    lines.push('')
  })

  var text = lines.join('\n')
  _showFarmModal(text)
}

function _showFarmModal(text) {
  // Remove modal anterior se existir
  var old = document.getElementById('farmModal')
  if (old) old.remove()

  var overlay = document.createElement('div')
  overlay.id = 'farmModal'
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;'

  var box = document.createElement('div')
  box.style.cssText = 'background:#0f172a;border:1px solid #334155;border-radius:10px;padding:20px;width:540px;max-width:95vw;max-height:80vh;display:flex;flex-direction:column;gap:10px;'

  var titleRow = document.createElement('div')
  titleRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;'
  titleRow.innerHTML = '<span style="color:#e2e8f0;font-weight:bold;font-size:13px;">📋 Farm List</span>'

  var closeBtn = document.createElement('button')
  closeBtn.textContent = '✕'
  closeBtn.style.cssText = 'background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;padding:0 4px;'
  closeBtn.onclick = function() { overlay.remove() }
  titleRow.appendChild(closeBtn)

  var ta = document.createElement('textarea')
  ta.value = text
  ta.readOnly = true
  ta.style.cssText = 'width:100%;flex:1;min-height:320px;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:6px;padding:10px;font-size:11px;font-family:monospace;resize:vertical;box-sizing:border-box;'

  var copyBtn = document.createElement('button')
  copyBtn.textContent = '📋 Copiar tudo'
  copyBtn.style.cssText = 'padding:8px 16px;background:#1e40af;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:bold;'
  copyBtn.onclick = function() {
    ta.select()
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        copyBtn.textContent = '✅ Copiado!'
        setTimeout(function() { copyBtn.textContent = '📋 Copiar tudo' }, 2000)
      })
    } else {
      try { document.execCommand('copy'); copyBtn.textContent = '✅ Copiado!'; setTimeout(function() { copyBtn.textContent = '📋 Copiar tudo' }, 2000) } catch(e) {}
    }
  }

  box.appendChild(titleRow)
  box.appendChild(ta)
  box.appendChild(copyBtn)
  overlay.appendChild(box)

  // Fechar ao clicar fora
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove() }

  document.body.appendChild(overlay)

  // Selecionar o texto automaticamente
  setTimeout(function() { ta.select() }, 50)
}

function _fallbackCopy(text) {
  var ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
    _showCopyToast('✅ Lista copiada!')
  } catch(e) {
    _showCopyToast('❌ Não foi possível copiar automaticamente.')
  }
  document.body.removeChild(ta)
}

function _showCopyToast(msg) {
  var toast = document.getElementById('copyToast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'copyToast'
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e40af;color:#fff;padding:10px 16px;border-radius:8px;font-size:12px;z-index:9999;transition:opacity 0.3s;'
    document.body.appendChild(toast)
  }
  toast.textContent = msg
  toast.style.opacity = '1'
  clearTimeout(toast._timer)
  toast._timer = setTimeout(function() { toast.style.opacity = '0' }, 3000)
}

// =====================================================
// FARM ESQUADRÕES/NAVES — placeholder até definição da lógica
// =====================================================
function _showSquadFarmModal() {
  _showFarmModal('⚔️ Farm Esquadrões/Naves\n\n[Em construção — aguardando definição da lógica de GAC/TW]')
}
