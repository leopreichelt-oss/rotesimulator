// ----------------------
// MAPEAMENTO PLANETA → CHAVE DO PLATOON
// ----------------------

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

// ----------------------
// CALCULAR FASES DISPONÍVEIS PARA PLATOON
// Um planeta fica ativo a partir do seu tier
// Se o objetivo é a fase N e o tier é T, há (N - T + 1) fases disponíveis
// ----------------------
function calcFasesDisponiveis(planetName, phaseObjetivo) {
  var tier = getPlanetTier(planetName)
  return Math.max(1, phaseObjetivo - tier + 1)
}

// ----------------------
// CALCULAR DISPONIBILIDADE REAL CONSIDERANDO CONFLITOS ENTRE PLANETAS
// Para cada unidade, conta jogadores disponíveis por fase,
// considerando que outros planetas ativos na mesma fase também competem pelo mesmo personagem
// ----------------------
function calcDisponibilidadeComConflitos(planetName, requirements, relicMin, rosterMap, allActivePlanets) {
  var phaseObjetivo = Number(state.planets[planetName].phase)
  var tier = getPlanetTier(planetName)
  var guildSize = Object.keys(rosterMap).length

  // Fases em que este planeta está ativo
  // Ex: Kashyyyk tier=3, fase=4 → ativo em F3 e F4
  var fasesAtivas = []
  for (var f = tier; f <= phaseObjetivo; f++) {
    fasesAtivas.push(f)
  }

  // Para cada fase ativa, quais outros planetas também estão ativos e competem por personagens?
  // Um planeta X está ativo na fase F se: tier(X) <= F <= phase_objetivo(X)
  var conflitoPorFase = {}
  fasesAtivas.forEach(function(fase) {
    conflitoPorFase[fase] = []
    allActivePlanets.forEach(function(otherName) {
      if (otherName === planetName) return
      var otherTier = getPlanetTier(otherName)
      var otherPhase = Number(state.planets[otherName].phase)
      if (otherTier <= fase && fase <= otherPhase) {
        conflitoPorFase[fase].push(otherName)
      }
    })
  })

  // Para cada unitId necessário, calcular disponibilidade total considerando conflitos
  var unitNeeded = {}  // unitId → slots necessários no planeta (1 por op = 1 por fase)
  Object.keys(requirements).forEach(function(op) {
    requirements[op].forEach(function(slot) {
      var id = slot.unitId || slot
      unitNeeded[id] = (unitNeeded[id] || 0) + 1
    })
  })

  var totalOps = Object.keys(requirements).length
  var unitAnalysis = {}

  Object.keys(unitNeeded).forEach(function(id) {
    var needed = unitNeeded[id] // total de slots neste planeta (= nº de ops onde aparece)

    // Jogadores que têm este personagem no relic necessário
    var playersWithUnit = Object.values(rosterMap).filter(function(player) {
      var unit = player.units.find(function(u) { return u.base_id === id })
      if (!unit) return false
      if (unit.combat_type === 2) return unit.rarity >= 7
      return rosterEngine.toRelicLevel(unit.relic_tier) >= relicMin
    })

    var totalHave = playersWithUnit.length

    // Calcular disponibilidade por fase considerando conflitos
    // Em cada fase, quantos desses jogadores já estão "comprometidos" com outros planetas?
    // Simplificação conservadora: em cada fase com conflito, estimamos que
    // ceil(totalHave * conflitos / (conflitos + 1)) jogadores são usados nos outros planetas
    var disponibilidadeTotalNasFases = 0
    fasesAtivas.forEach(function(fase) {
      var conflitos = conflitoPorFase[fase].length
      // Estimativa de quantos ficam disponíveis para este planeta nesta fase
      var dispNaFase = conflitos === 0 
        ? totalHave 
        : Math.floor(totalHave / (conflitos + 1))
      disponibilidadeTotalNasFases += dispNaFase
    })

    // Ops que podem ser completadas com a disponibilidade total nas fases
    var opsPossíveis = Math.min(needed, disponibilidadeTotalNasFases)
    var opsImpossiveis = needed - opsPossíveis

    // Verificar se há conflito real de sequência
    var hasSequenceConflict = false
    fasesAtivas.forEach(function(fase) {
      if (conflitoPorFase[fase].length > 0 && totalHave > 0 && totalHave < needed) {
        hasSequenceConflict = true
      }
    })

    unitAnalysis[id] = {
      needed: needed,
      have: totalHave,
      fasesDisponiveis: fasesAtivas.length,
      opsPossíveis: opsPossíveis,
      opsImpossíveis: opsImpossiveis,
      hasSequenceConflict: hasSequenceConflict,
      conflictPlanets: [].concat.apply([], Object.values(conflitoPorFase)).filter(function(v,i,a){return a.indexOf(v)===i})
    }
  })

  return { unitAnalysis: unitAnalysis, totalOps: totalOps, fasesAtivas: fasesAtivas }
}

// ----------------------
// DESENHAR COLUNA DE PLATOONS
// ----------------------
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

    var fasesDisponiveis = calcFasesDisponiveis(name, phase)
    var fasesInfo = fasesDisponiveis > 1 
      ? ' <span style="color:#60a5fa;font-size:10px;">(' + fasesDisponiveis + ' fases disponíveis)</span>'
      : ''

    var header = '<div style="font-weight:bold;color:#4da6ff;margin-bottom:4px;">'
      + 'F' + phase + ' \u2014 ' + name
      + '<span style="color:#94a3b8;font-weight:normal;"> (R' + relicMin + '+)</span>'
      + fasesInfo
      + '</div>'

    if (!requirements) {
      div.innerHTML = header + '<div style="color:#94a3b8;font-size:11px;">Sem dados de platoon.</div>'
      container.appendChild(div)
      return
    }

    if (hasRoster) {
      _renderWithRoster(div, header, name, requirements, relicMin, rosterMap, activePlanets, phase, fasesDisponiveis)
    } else {
      _renderManual(div, header, name, planetState, requirements)
    }

    container.appendChild(div)
  })
}

// ----------------------
// RENDER COM ROSTER REAL
// ----------------------
function _renderWithRoster(div, header, name, requirements, relicMin, rosterMap, allActivePlanets, phaseObjetivo, fasesDisponiveis) {
  var analysis = calcDisponibilidadeComConflitos(name, requirements, relicMin, rosterMap, allActivePlanets)
  var unitAnalysis = analysis.unitAnalysis
  var totalOps = analysis.totalOps

  // Classificar personagens
  var ok = [], partial = [], missing = []

  Object.keys(unitAnalysis).forEach(function(id) {
    var u = unitAnalysis[id]
    if (u.have === 0) {
      missing.push(id)
    } else if (u.opsPossíveis >= u.needed) {
      ok.push(id)
    } else {
      partial.push(id)
    }
  })

  // Status geral
  var borderColor, statusLines = []

  if (missing.length === 0 && partial.length === 0) {
    borderColor = "#4ade80"
    div.style.borderLeft = "3px solid " + borderColor
    if (fasesDisponiveis > 1) {
      div.innerHTML = header + '<div style="color:#4ade80;">\u2705 Platoons completos'
        + ' <span style="color:#86efac;font-size:10px;">(em até ' + fasesDisponiveis + ' fases)</span></div>'
    } else {
      div.innerHTML = header + '<div style="color:#4ade80;">\u2705 Platoons completos em 1 fase</div>'
    }
    return
  }

  if (missing.length === 0 && partial.length > 0) {
    borderColor = "#f97316"
  } else {
    borderColor = "#f87171"
  }
  div.style.borderLeft = "3px solid " + borderColor

  // Montar mensagens de status
  var allProblems = []

  // MISSING - vermelho
  missing.forEach(function(id) {
    var u = unitAnalysis[id]
    var request = u.needed + Math.ceil(u.needed / 3)
    allProblems.push({
      color: "#f87171",
      icon: "\u274c",
      text: getUnitName(id),
      sub: "nenhum jogador \u2014 pedir " + request
    })
  })

  // PARTIAL - laranja, com info de fases
  partial.forEach(function(id) {
    var u = unitAnalysis[id]
    var falta = u.needed - u.opsPossíveis
    var color, icon, sub

    if (u.hasSequenceConflict && u.conflictPlanets.length > 0) {
      // Conflito de sequência
      color = "#fb923c"
      icon = "\u26a0"
      var conflictNames = u.conflictPlanets.slice(0,2).join(', ')
      if (fasesDisponiveis > 1) {
        sub = u.have + '/' + u.needed + ' jogadores \u2014 conflito com ' + conflictNames
          + '. Completável em ' + fasesDisponiveis + ' fases se sequência permitir'
      } else {
        sub = u.have + '/' + u.needed + ' jogadores \u2014 sequência não permite completar'
          + ' (conflito com ' + conflictNames + ')'
      }
    } else if (fasesDisponiveis > 1) {
      // Pode completar em mais fases
      color = "#fbbf24"
      icon = "\u26a0"
      var opsPerFase = Math.floor(u.needed / fasesDisponiveis)
      sub = u.have + '/' + u.needed + ' jogadores \u2014 completar em ' + fasesDisponiveis + ' fases ('
        + u.opsPossíveis + ' ops possíveis)'
    } else {
      // Insuficiente e só 1 fase
      color = "#fb923c"
      icon = "\u26a0"
      sub = u.have + '/' + u.needed + ' jogadores \u2014 faltam ' + falta
        + ', pedir ' + (falta + Math.ceil(falta/3))
    }

    allProblems.push({ color: color, icon: icon, text: getUnitName(id), sub: sub })
  })

  // Resumo
  var resumoTexto = ''
  if (missing.length > 0 && partial.length > 0) {
    resumoTexto = missing.length + ' sem cobertura, ' + partial.length + ' parciais'
  } else if (missing.length > 0) {
    resumoTexto = missing.length + ' personagens sem ninguém na guilda'
  } else {
    var fasesNecessarias = Math.ceil(partial.reduce(function(max, id) {
      var u = unitAnalysis[id]
      return Math.max(max, Math.ceil(u.needed / Math.max(1, u.have)))
    }, 1))
    if (fasesDisponiveis >= fasesNecessarias) {
      resumoTexto = '\u26a0 Completável em ' + fasesNecessarias + ' fase(s) \u2014 planeta ativo por ' + fasesDisponiveis + ' fase(s)'
    } else {
      resumoTexto = '\u274c Sequência não permite completar \u2014 precisa de ' + fasesNecessarias + ' fases, tem apenas ' + fasesDisponiveis
    }
  }

  var resumo = '<div style="font-size:11px;margin-bottom:6px;color:#94a3b8;">' + resumoTexto + '</div>'

  // Lista de problemas
  var PREVIEW = 5
  var expanded = !!_platoonExpandState[name]
  var visible = expanded ? allProblems : allProblems.slice(0, PREVIEW)
  var total = allProblems.length

  var lista = '<div>'
  visible.forEach(function(item) {
    lista += '<div style="color:' + item.color + ';font-size:11px;margin-bottom:3px;">'
      + item.icon + ' ' + item.text
      + ' <span style="color:#64748b;">' + item.sub + '</span>'
      + '</div>'
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

// ----------------------
// RENDER MANUAL (fallback sem roster)
// ----------------------
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
