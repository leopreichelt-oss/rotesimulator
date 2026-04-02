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
// LISTAR JOGADORES MAIS PROXIMOS DE UM PERSONAGEM
// =====================================================
function getClosestPlayers(unitId, relicMin, rosterMap, howMany) {
  // Retorna jogadores que NĀNO atendem o requisito, ordenados por nivel atual (mais próximos primeiro)
  var players = Object.values(rosterMap).map(function(player) {
    var unit = player.units.find(function(u) { return u.base_id === unitId })
    var isShip = unit && unit.combat_type === 2
    var currentLevel = unit ? (isShip ? unit.rarity : rosterEngine.toRelicLevel(unit.relic_tier)) : -1
    var meetsReq = unit ? (isShip ? unit.rarity >= 7 : currentLevel >= relicMin) : false
    if (meetsReq) return null // já tem, não precisa listar
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
// ANÁLISE DE PLATOON PARA UM PLANETA
// fasesNecessarias vs fasesDisponiveis:
//   = fasesDisponiveis → aloca na fase objetivo (normal, sem aviso)
//   < fasesDisponiveis → pode pré-alocar em fases anteriores (informativo)
//   > fasesDisponiveis → impossível (problema real)
// =====================================================
function analyzePlanetPlatoon(planetName, requirements, relicMin, rosterMap, allActivePlanets) {
  var phaseObjetivo = Number(state.planets[planetName].phase)
  var tier = getPlanetTier(planetName)
  var fasesAtivas = []
  for (var f = tier; f <= phaseObjetivo; f++) fasesAtivas.push(f)
  var fasesDisponiveis = fasesAtivas.length

  var unitSlots = {}
  Object.keys(requirements).forEach(function(op) {
    requirements[op].forEach(function(slot) {
      var id = slot.unitId || slot
      unitSlots[id] = (unitSlots[id] || 0) + 1
    })
  })

  var results = []

  Object.keys(unitSlots).forEach(function(id) {
    var needed = unitSlots[id]
    var totalHave = countPlayersWithUnit(id, relicMin, rosterMap)

    if (totalHave === 0) {
      var request = needed + Math.ceil(needed / 3)
      results.push({ id:id, needed:needed, have:0, status:'missing', request:request })
      return
    }

    // Calcular em quantas fases é possível completar
    var slotsAcumulados = 0
    var fasesNecessarias = fasesDisponiveis + 1 // pessimista

    for (var fi = 0; fi < fasesAtivas.length; fi++) {
      var fase = fasesAtivas[fi]
      var demandaFase = calcDemandaPorFase(fase, allActivePlanets)
      // Demanda dos outros planetas objetivo (excluindo este planeta)
      var demandaOutros = (demandaFase[id] || 0)
      if (fase === phaseObjetivo) demandaOutros = Math.max(0, demandaOutros - needed)
      var dispNaFase = Math.max(0, totalHave - demandaOutros)
      slotsAcumulados += dispNaFase
      if (slotsAcumulados >= needed) {
        fasesNecessarias = fi + 1
        break
      }
    }

    if (fasesNecessarias <= fasesDisponiveis) {
      // Verificar se completa somente na fase objetivo (sem precisar pre-alocar)
      var dFaseObj = calcDemandaPorFase(phaseObjetivo, allActivePlanets)
      var dOutrosFaseObj = Math.max(0, (dFaseObj[id] || 0) - needed)
      var dispFaseObj = Math.max(0, totalHave - dOutrosFaseObj)
      var completaNaFaseObj = dispFaseObj >= needed

      results.push({
        id: id,
        needed: needed,
        have: totalHave,
        fasesNecessarias: fasesNecessarias,
        fasesDisponiveis: fasesDisponiveis,
        status: completaNaFaseObj && fasesNecessarias === 1 ? 'ok'
               : completaNaFaseObj ? 'normal'
               : 'prealoca'
      })
    } else {
      // Impossível mesmo com todas as fases
      var faltam = needed - slotsAcumulados
      var request2 = faltam + Math.ceil(faltam / 3)
      results.push({
        id: id, needed: needed, have: totalHave,
        faltam: faltam, request: request2,
        status: 'impossible'
      })
    }
  })

  return { results:results, fasesDisponiveis:fasesDisponiveis }
}

// =====================================================
// DESENHAR COLUNA DE PLATOONS
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

  var rosterMap = (typeof rosterEngine !== "undefined") ? rosterEngine.load() : null
  var hasRoster = rosterMap && Object.keys(rosterMap).length > 0

  activePlanets.forEach(function(name) {
    var planetState = state.planets[name]
    var phase = Number(planetState.phase)
    var tier = getPlanetTier(name)
    var relicMin = TIER_RELIC[tier] || 5
    var platoonKey = PLANET_PLATOON_KEY[name]
    var requirements = platoonKey ? platoonRequirements[platoonKey] : null

    var div = document.createElement("div")
    div.style.cssText = "margin-bottom:10px;padding:8px;border-radius:6px;background:#1e3a5f;border-left:3px solid #334155;"

    var fasesDisponiveis = Math.max(1, phase - tier + 1)
    var fasesInfo = fasesDisponiveis > 1
      ? ' <span style="color:#60a5fa;font-size:10px;">(' + fasesDisponiveis + ' fases disp.)</span>' : ''

    var header = '<div style="font-weight:bold;color:#4da6ff;margin-bottom:4px;">'
      + 'F' + phase + ' \u2014 ' + name
      + '<span style="color:#94a3b8;font-weight:normal;"> (R' + relicMin + '+)</span>'
      + fasesInfo + '</div>'

    if (!requirements) {
      div.innerHTML = header + '<div style="color:#94a3b8;font-size:11px;">Sem dados de platoon.</div>'
      container.appendChild(div)
      return
    }

    if (hasRoster) {
      var analysis = analyzePlanetPlatoon(name, requirements, relicMin, rosterMap, activePlanets)
      _renderWithRoster(div, header, name, analysis.results, analysis.fasesDisponiveis, relicMin, rosterMap)
    } else {
      _renderManual(div, header, name, planetState, requirements)
    }

    container.appendChild(div)
  })
}

// =====================================================
// RENDER COM ROSTER REAL
// =====================================================
function _renderWithRoster(div, header, name, results, fasesDisponiveis, relicMin, rosterMap) {
  // Classificar por relevância
  var missing    = results.filter(function(r) { return r.status === 'missing' })
  var impossible = results.filter(function(r) { return r.status === 'impossible' })
  var prealoca   = results.filter(function(r) { return r.status === 'prealoca' })
  // 'ok' e 'normal' não aparecem — são situações sem problema

  // VERDE: tudo ok (status ok ou normal)
  if (missing.length === 0 && impossible.length === 0 && prealoca.length === 0) {
    div.style.borderLeft = "3px solid #4ade80"
    div.innerHTML = header + '<div style="color:#4ade80;">\u2705 Platoons completos em 1 fase</div>'
    return
  }

  // VERDE CLARO: só tem "prealoca" — pode completar usando fases anteriores
  if (missing.length === 0 && impossible.length === 0) {
    var maxFases = Math.max.apply(null, prealoca.map(function(r) { return r.fasesNecessarias }))
    div.style.borderLeft = "3px solid #86efac"
    var statusLine = '<div style="color:#86efac;font-size:11px;margin-bottom:4px;">'
      + '\u2705 Completável em ' + maxFases + ' fase(s) \u2014 alocar antecipadamente</div>'

    var lista = '<div>'
    prealoca.forEach(function(r) {
      lista += '<div style="color:#fbbf24;font-size:11px;margin-bottom:2px;">'
        + '\u26a0 ' + getUnitName(r.id)
        + ' <span style="color:#64748b;">' + r.have + '/' + r.needed
        + ' — alocar 1 slot na F' + (r.fasesNecessarias - 1 + (results[0] && results[0].fasesDisponiveis ? (fasesDisponiveis - r.fasesNecessarias + 1) : 1))
        + ' anterior</span></div>'
    })
    lista += '</div>'
    div.innerHTML = header + statusLine + lista
    return
  }

  // VERMELHO/LARANJA: tem problemas reais
  var borderColor = missing.length > 0 ? "#f87171" : "#f97316"
  div.style.borderLeft = "3px solid " + borderColor

  var partes = []
  if (missing.length > 0) partes.push(missing.length + ' sem ninguém na guilda')
  if (impossible.length > 0) partes.push(impossible.length + ' impossíveis de completar')
  if (prealoca.length > 0) partes.push(prealoca.length + ' precisam de pré-alocação')

  var resumo = '<div style="color:#94a3b8;font-size:11px;margin-bottom:6px;">'
    + partes.join(' \u2014 ') + '</div>'

  var allProblems = missing.concat(impossible).concat(prealoca)
  var PREVIEW = 5
  var expanded = !!_platoonExpandState[name]
  var visible = expanded ? allProblems : allProblems.slice(0, PREVIEW)

  var lista = '<div>'
  visible.forEach(function(r) {
    var uname = getUnitName(r.id)
    var color, icon, sub

    if (r.status === 'missing') {
      var faltamN = r.needed
      var pedirN = faltamN + Math.ceil(faltamN / 3)
      var closest = getClosestPlayers(r.id, relicMin, rosterMap, pedirN)
      var closestTxt = closest.map(function(p) {
        return p.name + ' (R' + p.currentLevel + ')'
      }).join(', ')
      color = "#f87171"; icon = "\u274c"
      sub = "nenhum \u2014 pedir " + pedirN + (closestTxt ? ": " + closestTxt : "")
    } else if (r.status === 'impossible') {
      var faltamI = r.faltam
      var pedirI = faltamI + Math.ceil(faltamI / 3)
      var closestI = getClosestPlayers(r.id, relicMin, rosterMap, pedirI)
      var closestTxtI = closestI.map(function(p) { return p.currentLevel >= 0 ? p.name + ' (R' + p.currentLevel + ')' : p.name + ' (sem o personagem)' }).join(', ')
      color = "#f97316"; icon = "\u274c"
      sub = r.have + '/' + r.needed + ' \u2014 faltam ' + faltamI + (closestTxtI ? '. Pedir: ' + closestTxtI : '')
    } else {
      var faltamP = Math.max(1, r.needed - r.have)
      var pedirP = faltamP + Math.ceil(faltamP / 3)
      var closestP = getClosestPlayers(r.id, relicMin, rosterMap, pedirP)
      var closestTxtP = closestP.map(function(p) { return p.currentLevel >= 0 ? p.name + ' (R' + p.currentLevel + ')' : p.name + ' (sem o personagem)' }).join(', ')
      color = "#fbbf24"; icon = "\u26a0"
      sub = r.have + '/' + r.needed + (closestTxtP ? ' \u2014 pedir: ' + closestTxtP : '')
    }

    lista += '<div style="color:' + color + ';font-size:11px;margin-bottom:3px;">'
      + icon + ' ' + uname
      + ' <span style="color:#64748b;">' + sub + '</span></div>'
  })
  lista += '</div>'

  var btnHtml = ''
  if (allProblems.length > PREVIEW) {
    var resto = allProblems.length - PREVIEW
    var btnLabel = expanded ? '\u25b2 ver menos' : '\u25bc +' + resto + ' outros'
    var esc = name.replace(/'/g, "\\'")
    btnHtml = '<div style="margin-top:4px;">'
      + '<button onclick="togglePlatoonExpand(\'' + esc + '\')"'
      + ' style="background:none;border:none;color:#60a5fa;font-size:11px;cursor:pointer;padding:0;">'
      + btnLabel + '</button></div>'
  }

  div.innerHTML = header + resumo + lista + btnHtml
}

// =====================================================
// RENDER MANUAL (fallback sem roster)
// =====================================================
function _renderManual(div, header, name, planetState, requirements) {
  var totalOps = Object.keys(requirements).length
  var platoons = Number(planetState.platoons) || 0

  if (platoons >= totalOps) {
    div.style.borderLeft = "3px solid #4ade80"
    div.innerHTML = header + '<div style="color:#4ade80;">\u2705 Todos os platoons completos</div>'
    return
  }

  var borderColor = platoons === 0 ? "#f87171"
    : platoons < Math.ceil(totalOps / 2) ? "#f97316" : "#facc15"
  div.style.borderLeft = "3px solid " + borderColor

  var missingUnits = {}
  for (var op = platoons + 1; op <= totalOps; op++) {
    var slots = requirements[op] || []
    slots.forEach(function(slot) {
      var id = slot.unitId || slot
      if (!missingUnits[id]) missingUnits[id] = 0
      missingUnits[id]++
    })
  }

  var missingEntries = Object.entries(missingUnits)
  var total = missingEntries.length
  var PREVIEW = 5
  var expanded = !!_platoonExpandState[name]
  var visible = expanded ? missingEntries : missingEntries.slice(0, PREVIEW)

  var resumo = '<div style="color:#94a3b8;font-size:11px;margin-bottom:6px;">'
    + platoons + '/' + totalOps + ' ops \u2014 '
    + '<strong style="color:#fcd34d;">' + total + ' personagens</strong>'
    + ' <span style="color:#475569;">(sem roster)</span></div>'

  var lista = '<div>'
  visible.forEach(function(entry) {
    var id = entry[0], needed = entry[1]
    var request = needed + Math.ceil(needed / 3)
    lista += '<div style="color:#fcd34d;font-size:11px;margin-bottom:2px;">'
      + '\u26a0 ' + getUnitName(id) + ' \xd7' + needed
      + ' <span style="color:#94a3b8;">(pedir ' + request + ')</span></div>'
  })
  lista += '</div>'

  var btnHtml = ''
  if (total > PREVIEW) {
    var resto = total - PREVIEW
    var btnLabel = expanded ? '\u25b2 ver menos' : '\u25bc +' + resto + ' outros'
    var esc = name.replace(/'/g, "\\'")
    btnHtml = '<div style="margin-top:4px;">'
      + '<button onclick="togglePlatoonExpand(\'' + esc + '\')"'
      + ' style="background:none;border:none;color:#60a5fa;font-size:11px;cursor:pointer;padding:0;">'
      + btnLabel + '</button></div>'
  }

  div.innerHTML = header + resumo + lista + btnHtml
}
