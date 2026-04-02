// ----------------------
// MAPEAMENTO PLANETA → CHAVE DO PLATOON
// ----------------------

const PLANET_PLATOON_KEY = {
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

const TIER_RELIC = { 1:5, 2:6, 3:7, 4:8, 5:9, 6:9 }

function getPlanetTier(name) {
  if (typeof planetData !== "undefined" && planetData[name]) {
    return planetData[name].tier || 1
  }
  return 1
}

// estado de expand por planeta
var _platoonExpandState = _platoonExpandState || {}

function togglePlatoonExpand(planetName) {
  _platoonExpandState[planetName] = !_platoonExpandState[planetName]
  drawPlatoonList()
}

// ----------------------
// LÓGICA PRINCIPAL
// ----------------------

function drawPlatoonList() {
  var container = document.getElementById("platoonList")
  if (!container) return

  if (typeof platoonRequirements === "undefined") {
    container.innerHTML = '<div style="color:#f87171;font-size:11px;">platoonRequirements.js não carregado.</div>'
    return
  }

  container.innerHTML = ""

  // Planetas ativos no mapa
  var activePlanets = Object.keys(state.planets)
    .filter(function(name) { return state.planets[name] && state.planets[name].phase })
    .sort(function(a, b) { return Number(state.planets[a].phase) - Number(state.planets[b].phase) })

  if (activePlanets.length === 0) {
    container.innerHTML = '<div style="color:#94a3b8;font-size:11px;">Nenhum planeta configurado.</div>'
    return
  }

  // Carregar roster
  var rosterMap = (typeof rosterEngine !== "undefined") ? rosterEngine.load() : null

  activePlanets.forEach(function(name) {
    var planetState = state.planets[name]
    var phase = Number(planetState.phase)
    var tier = getPlanetTier(name)
    var relicMin = TIER_RELIC[tier] || 5
    var platoonKey = PLANET_PLATOON_KEY[name]
    var requirements = platoonKey ? platoonRequirements[platoonKey] : null

    var div = document.createElement("div")
    div.style.cssText = "margin-bottom:10px;padding:8px;border-radius:6px;background:#1e3a5f;border-left:3px solid #334155;"

    var header = '<div style="font-weight:bold;color:#4da6ff;margin-bottom:4px;">'
      + 'F' + phase + ' \u2014 ' + name
      + '<span style="color:#94a3b8;font-weight:normal;"> (R' + relicMin + '+)</span>'
      + '</div>'

    if (!requirements) {
      div.innerHTML = header + '<div style="color:#94a3b8;font-size:11px;">Sem dados de platoon.</div>'
      container.appendChild(div)
      return
    }

    var totalOps = Object.keys(requirements).length

    // Se temos roster real, usar ele; caso contrário usar campo manual
    if (rosterMap && Object.keys(rosterMap).length > 0) {
      _renderWithRoster(div, header, name, requirements, totalOps, relicMin, rosterMap)
    } else {
      _renderManual(div, header, name, planetState, requirements, totalOps)
    }

    container.appendChild(div)
  })
}

// Render com dados reais do roster
function _renderWithRoster(div, header, name, requirements, totalOps, relicMin, rosterMap) {
  var guildSize = Object.keys(rosterMap).length
  var opResults = []

  // Para cada operação, verificar se podemos completar
  for (var op = 1; op <= totalOps; op++) {
    var slots = requirements[op] || []
    var opOk = true
    var missing = []

    slots.forEach(function(slot) {
      var unitId = slot.unitId || slot
      // Contar jogadores disponíveis para este personagem
      var available = Object.values(rosterMap).filter(function(player) {
        var unit = player.units.find(function(u) { return u.base_id === unitId })
        if (!unit) return false
        if (unit.combat_type === 2) return unit.rarity >= 7
        return rosterEngine.toRelicLevel(unit.relic_tier) >= relicMin
      })

      if (available.length === 0) {
        opOk = false
        missing.push({ unitId: unitId, available: 0 })
      }
    })

    opResults.push({ op: op, ok: opOk, missing: missing })
  }

  var opsCompletas = opResults.filter(function(r) { return r.ok }).length
  var opsFaltando = totalOps - opsCompletas

  // Coletar personagens problemáticos (sem ninguém na guilda)
  var missingUnits = {}
  opResults.filter(function(r) { return !r.ok }).forEach(function(r) {
    r.missing.forEach(function(m) {
      if (!missingUnits[m.unitId]) missingUnits[m.unitId] = { count: 0, ops: [] }
      missingUnits[m.unitId].count++
      missingUnits[m.unitId].ops.push(r.op)
    })
  })

  // Cor do border
  var borderColor = opsCompletas === totalOps ? "#4ade80"
    : opsCompletas === 0 ? "#f87171"
    : opsCompletas < Math.ceil(totalOps / 2) ? "#f97316"
    : "#facc15"
  div.style.borderLeft = "3px solid " + borderColor

  if (opsCompletas === totalOps) {
    div.innerHTML = header + '<div style="color:#4ade80;">\u2705 Todos os platoons completos</div>'
    return
  }

  var resumo = '<div style="color:#94a3b8;font-size:11px;margin-bottom:6px;">'
    + opsCompletas + '/' + totalOps + ' ops completas'
    + (opsFaltando > 0 ? ' \u2014 <strong style="color:#fcd34d;">' + Object.keys(missingUnits).length + ' personagens sem cobertura</strong>' : '')
    + '</div>'

  var missingEntries = Object.entries(missingUnits)
  var total = missingEntries.length
  var PREVIEW = 5
  var expanded = !!_platoonExpandState[name]
  var visible = expanded ? missingEntries : missingEntries.slice(0, PREVIEW)

  var lista = '<div>'
  visible.forEach(function(entry) {
    var unitId = entry[0]
    var data = entry[1]
    var uname = getUnitName(unitId)
    var needed = data.count
    var request = needed + Math.ceil(needed / 3)
    lista += '<div style="color:#f87171;font-size:11px;margin-bottom:2px;">'
      + '\u274c ' + uname
      + ' <span style="color:#94a3b8;">(nenhum jogador \u2014 pedir ' + request + ')</span>'
      + '</div>'
  })
  lista += '</div>'

  var btnHtml = ""
  if (total > PREVIEW) {
    var resto = total - PREVIEW
    var btnLabel = expanded ? "\u25b2 ver menos" : "\u25bc +" + resto + " outros"
    var escapedName = name.replace(/'/g, "\\'")
    btnHtml = '<div style="margin-top:4px;">'
      + '<button onclick="togglePlatoonExpand(\'' + escapedName + '\')"'
      + ' style="background:none;border:none;color:#60a5fa;font-size:11px;cursor:pointer;padding:0;">'
      + btnLabel + '</button></div>'
  }

  div.innerHTML = header + resumo + lista + btnHtml
}

// Render com campo manual (fallback sem roster)
function _renderManual(div, header, name, planetState, requirements, totalOps) {
  var platoons = Number(planetState.platoons) || 0

  if (platoons >= totalOps) {
    div.style.borderLeft = "3px solid #4ade80"
    div.innerHTML = header + '<div style="color:#4ade80;">\u2705 Todos os platoons completos</div>'
    return
  }

  var borderColor = platoons === 0 ? "#f87171"
    : platoons < Math.ceil(totalOps / 2) ? "#f97316" : "#facc15"
  div.style.borderLeft = "3px solid " + borderColor

  // Personagens das ops faltando
  var missingUnits = {}
  for (var op = platoons + 1; op <= totalOps; op++) {
    var slots = requirements[op] || []
    slots.forEach(function(slot) {
      var id = slot.unitId || slot
      if (!missingUnits[id]) missingUnits[id] = { count: 0 }
      missingUnits[id].count++
    })
  }

  var missingEntries = Object.entries(missingUnits)
  var total = missingEntries.length
  var PREVIEW = 5
  var expanded = !!_platoonExpandState[name]
  var visible = expanded ? missingEntries : missingEntries.slice(0, PREVIEW)

  var resumo = '<div style="color:#94a3b8;font-size:11px;margin-bottom:6px;">'
    + platoons + '/' + totalOps + ' ops \u2014 <strong style="color:#fcd34d;">' + total + ' personagens faltando</strong>'
    + ' <span style="color:#475569;font-size:10px;">(sem roster)</span>'
    + '</div>'

  var lista = '<div>'
  visible.forEach(function(entry) {
    var unitId = entry[0]
    var data = entry[1]
    var needed = data.count
    var request = needed + Math.ceil(needed / 3)
    lista += '<div style="color:#fcd34d;font-size:11px;margin-bottom:2px;">'
      + '\u26a0 ' + getUnitName(unitId) + ' \xd7' + needed
      + ' <span style="color:#94a3b8;">(pedir ' + request + ')</span>'
      + '</div>'
  })
  lista += '</div>'

  var btnHtml = ""
  if (total > PREVIEW) {
    var resto = total - PREVIEW
    var btnLabel = expanded ? "\u25b2 ver menos" : "\u25bc +" + resto + " outros"
    var escapedName = name.replace(/'/g, "\\'")
    btnHtml = '<div style="margin-top:4px;">'
      + '<button onclick="togglePlatoonExpand(\'' + escapedName + '\')"'
      + ' style="background:none;border:none;color:#60a5fa;font-size:11px;cursor:pointer;padding:0;">'
      + btnLabel + '</button></div>'
  }

  div.innerHTML = header + resumo + lista + btnHtml
}
