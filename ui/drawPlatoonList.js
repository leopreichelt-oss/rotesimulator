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
// ANÁLISE DE PLATOON
// Retorna para cada unitId: slots necessários, jogadores disponíveis,
// fases necessárias para completar
// =====================================================
function analyzePlatoon(requirements, relicMin, rosterMap, fasesDisponiveis, fasesConflito) {
  // fasesConflito: por fase, quantos jogadores estão comprometidos com planetas objetivo
  // fasesDisponiveis: total de fases em que o planeta está ativo

  // Contar slots necessários por personagem (1 slot = 1 op que contém este personagem)
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

    // Total de jogadores da guilda com este personagem no relic mínimo
    var playersWithUnit = Object.values(rosterMap).filter(function(player) {
      var unit = player.units.find(function(u) { return u.base_id === id })
      if (!unit) return false
      if (unit.combat_type === 2) return unit.rarity >= 7
      return rosterEngine.toRelicLevel(unit.relic_tier) >= relicMin
    })
    var totalHave = playersWithUnit.length

    if (totalHave === 0) {
      results.push({ id: id, needed: needed, have: 0, status: 'missing', fasesNecessarias: 999 })
      return
    }

    // Calcular disponibilidade considerando conflitos por fase
    // Em cada fase, jogadores comprometidos com planeta objetivo são subtraídos
    // A disponibilidade acumulada ao longo das fases determina se é completável
    var slotsCompletaveis = 0
    for (var f = 0; f < fasesDisponiveis; f++) {
      // conflito[f] = nº de jogadores com este personagem usados em planetas objetivo nesta fase
      var usadosNaFase = fasesConflito[f] ? (fasesConflito[f][id] || 0) : 0
      var dispNaFase = Math.max(0, totalHave - usadosNaFase)
      slotsCompletaveis += dispNaFase
      if (slotsCompletaveis >= needed) break
    }

    if (slotsCompletaveis >= needed) {
      // Calcular em quantas fases
      var fasesNecessarias = 1
      var acumulado = 0
      for (var f2 = 0; f2 < fasesDisponiveis; f2++) {
        var usados2 = fasesConflito[f2] ? (fasesConflito[f2][id] || 0) : 0
        var disp2 = Math.max(0, totalHave - usados2)
        acumulado += disp2
        if (acumulado >= needed) { fasesNecessarias = f2 + 1; break }
      }
      results.push({
        id: id,
        needed: needed,
        have: totalHave,
        fasesNecessarias: fasesNecessarias,
        status: fasesNecessarias === 1 ? 'ok' : 'multifase'
      })
    } else {
      // Não completável nem com todas as fases disponíveis
      results.push({
        id: id,
        needed: needed,
        have: totalHave,
        slotsCompletaveis: slotsCompletaveis,
        fasesNecessarias: 999,
        status: 'impossible'
      })
    }
  })

  return results
}

// =====================================================
// CALCULAR CONFLITOS POR FASE
// Para cada fase em que o planeta está ativo, quais personagens
// já estão sendo usados em planetas OBJETIVO da mesma fase?
// =====================================================
function calcConflitos(planetName, fasesAtivas, allActivePlanets, rosterMap, relicMin) {
  var conflitoPorFase = {}

  fasesAtivas.forEach(function(fase, idx) {
    conflitoPorFase[idx] = {}

    // Planetas que são OBJETIVO desta fase (phase == fase) exceto o planeta atual
    var planetasObjetivoNaFase = allActivePlanets.filter(function(other) {
      if (other === planetName) return false
      return Number(state.planets[other].phase) === fase
    })

    // Para cada planeta objetivo, contar quantos jogadores usa de cada personagem
    planetasObjetivoNaFase.forEach(function(other) {
      var otherKey = PLANET_PLATOON_KEY[other]
      var otherReq = otherKey ? platoonRequirements[otherKey] : null
      var otherTier = getPlanetTier(other)
      var otherRelicMin = TIER_RELIC[otherTier] || 5
      if (!otherReq) return

      // Contar slots necessários neste planeta concorrente
      var otherSlots = {}
      Object.keys(otherReq).forEach(function(op) {
        otherReq[op].forEach(function(slot) {
          var id = slot.unitId || slot
          otherSlots[id] = (otherSlots[id] || 0) + 1
        })
      })

      // Para cada personagem do planeta concorrente, registrar jogadores consumidos
      Object.keys(otherSlots).forEach(function(id) {
        var have = Object.values(rosterMap).filter(function(player) {
          var unit = player.units.find(function(u) { return u.base_id === id })
          if (!unit) return false
          if (unit.combat_type === 2) return unit.rarity >= 7
          return rosterEngine.toRelicLevel(unit.relic_tier) >= otherRelicMin
        }).length

        // O planeta objetivo consome min(have, needed) jogadores
        var consumed = Math.min(have, otherSlots[id])
        conflitoPorFase[idx][id] = (conflitoPorFase[idx][id] || 0) + consumed
      })
    })
  })

  return conflitoPorFase
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

    // Fases disponíveis: do tier até o objetivo
    var fasesDisponiveis = Math.max(1, phase - tier + 1)

    var fasesInfo = fasesDisponiveis > 1
      ? ' <span style="color:#60a5fa;font-size:10px;">(' + fasesDisponiveis + ' fases disp.)</span>'
      : ''

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
      // Calcular fases ativas do planeta (do tier até o objetivo)
      var fasesAtivas = []
      for (var f = tier; f <= phase; f++) fasesAtivas.push(f)

      // Calcular conflitos com outros planetas objetivo em cada fase
      var conflitos = calcConflitos(name, fasesAtivas, activePlanets, rosterMap, relicMin)

      var results = analyzePlatoon(requirements, relicMin, rosterMap, fasesDisponiveis, conflitos)
      _renderWithRoster(div, header, name, results, fasesDisponiveis)
    } else {
      _renderManual(div, header, name, planetState, requirements)
    }

    container.appendChild(div)
  })
}

// =====================================================
// RENDER COM ROSTER REAL
// =====================================================
function _renderWithRoster(div, header, name, results, fasesDisponiveis) {
  var missing    = results.filter(function(r) { return r.status === 'missing' })
  var impossible = results.filter(function(r) { return r.status === 'impossible' })
  var multifase  = results.filter(function(r) { return r.status === 'multifase' })
  var ok         = results.filter(function(r) { return r.status === 'ok' })

  // === VERDE: tudo ok em 1 fase ===
  if (missing.length === 0 && impossible.length === 0 && multifase.length === 0) {
    div.style.borderLeft = "3px solid #4ade80"
    div.innerHTML = header + '<div style="color:#4ade80;">\u2705 Platoons completos em 1 fase</div>'
    return
  }

  // === VERDE CLARO: ok mas precisa de mais de 1 fase (sem impossíveis/missing) ===
  if (missing.length === 0 && impossible.length === 0 && multifase.length > 0) {
    var maxFases = Math.max.apply(null, multifase.map(function(r) { return r.fasesNecessarias }))
    div.style.borderLeft = "3px solid #86efac"
    var msg = '\u2705 Completável em ' + maxFases + ' fase(s)'
      + (fasesDisponiveis >= maxFases
        ? ' \u2014 sequência permite \u2713'
        : ' \u2014 <span style="color:#f87171;">sequência não permite \u2717 (só ' + fasesDisponiveis + ' disp.)</span>')
    div.innerHTML = header + '<div style="color:#86efac;font-size:11px;">' + msg + '</div>'

    // Mostrar detalhes dos multifase
    var lista = '<div style="margin-top:4px;">'
    multifase.forEach(function(r) {
      var falta = r.needed - r.have
      lista += '<div style="color:#fbbf24;font-size:11px;margin-bottom:2px;">'
        + '\u26a0 ' + getUnitName(r.id)
        + ' <span style="color:#94a3b8;">' + r.have + '/' + r.needed
        + ' jogadores \u2014 precisa de ' + r.fasesNecessarias + ' fase(s)</span></div>'
    })
    lista += '</div>'
    div.innerHTML = header + '<div style="color:#86efac;font-size:11px;">' + msg + '</div>' + lista
    return
  }

  // === LARANJA: tem personagens mas insuficientes + impossíveis sem conflito ===
  // === VERMELHO: tem missing (ninguém tem) ===
  var borderColor = missing.length > 0 ? "#f87171" : "#f97316"
  div.style.borderLeft = "3px solid " + borderColor

  // Resumo
  var partes = []
  if (missing.length > 0) partes.push(missing.length + ' sem ninguém na guilda')
  if (impossible.length > 0) partes.push(impossible.length + ' impossíveis de completar')
  if (multifase.length > 0) partes.push(multifase.length + ' precisam de mais fases')

  var resumo = '<div style="color:#94a3b8;font-size:11px;margin-bottom:6px;">'
    + partes.join(' \u2014 ') + '</div>'

  // Lista de problemas
  var allProblems = missing.concat(impossible).concat(multifase)
  var PREVIEW = 5
  var expanded = !!_platoonExpandState[name]
  var visible = expanded ? allProblems : allProblems.slice(0, PREVIEW)
  var total = allProblems.length

  var lista = '<div>'
  visible.forEach(function(r) {
    var uname = getUnitName(r.id)
    var color, icon, sub

    if (r.status === 'missing') {
      var request = r.needed + Math.ceil(r.needed / 3)
      color = "#f87171"
      icon = "\u274c"
      sub = "nenhum jogador na guilda \u2014 pedir " + request
    } else if (r.status === 'impossible') {
      var falta = r.needed - r.slotsCompletaveis
      color = "#f97316"
      icon = "\u274c"
      sub = r.have + '/' + r.needed + ' jogadores'
        + ' \u2014 sequência não permite completar'
        + ' (faltam ' + falta + ' slots mesmo com ' + fasesDisponiveis + ' fases)'
    } else { // multifase
      color = "#fbbf24"
      icon = "\u26a0"
      sub = r.have + '/' + r.needed + ' jogadores'
        + ' \u2014 precisa de ' + r.fasesNecessarias + ' fase(s)'
        + (fasesDisponiveis >= r.fasesNecessarias ? ' \u2713' : ' \u2717 só ' + fasesDisponiveis + ' disp.')
    }

    lista += '<div style="color:' + color + ';font-size:11px;margin-bottom:3px;">'
      + icon + ' ' + uname
      + ' <span style="color:#64748b;">' + sub + '</span></div>'
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
