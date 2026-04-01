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

// estado de expand por planeta (persiste entre redesenhos)
var _platoonExpandState = _platoonExpandState || {}

// ----------------------
// TOGGLE EXPAND (chamado pelo botao)
// ----------------------
function togglePlatoonExpand(planetName) {
  _platoonExpandState[planetName] = !_platoonExpandState[planetName]
  drawPlatoonList()
}

// ----------------------
// DESENHAR COLUNA DE PLATOONS
// ----------------------
function drawPlatoonList() {
  var container = document.getElementById("platoonList")
  if (!container) return

  if (typeof platoonRequirements === "undefined") {
    container.innerHTML = '<div style="color:#f87171;font-size:11px;">platoonRequirements.js nao carregado.</div>'
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

  activePlanets.forEach(function(name) {
    var planetState = state.planets[name]
    var phase = Number(planetState.phase)
    var platoons = Number(planetState.platoons) || 0
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

    // completo
    if (platoons >= totalOps) {
      div.style.borderLeft = "3px solid #4ade80"
      div.innerHTML = header + '<div style="color:#4ade80;">\u2705 Todos os platoons completos</div>'
      container.appendChild(div)
      return
    }

    // coletar personagens faltantes
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
    var opsFaltando = totalOps - platoons

    var borderColor = platoons === 0 ? "#f87171"
      : platoons < Math.ceil(totalOps / 2) ? "#f97316"
      : "#facc15"
    div.style.borderLeft = "3px solid " + borderColor

    var resumo = '<div style="color:#94a3b8;font-size:11px;margin-bottom:6px;">'
      + platoons + '/' + totalOps + ' ops'
      + ' &mdash; <strong style="color:#fcd34d;">' + total + ' personagens faltando</strong>'
      + '</div>'

    // preview: primeiros 5 sempre visíveis
    var PREVIEW = 5
    var expanded = !!_platoonExpandState[name]
    var visibleEntries = expanded ? missingEntries : missingEntries.slice(0, PREVIEW)

    var lista = '<div>'
    visibleEntries.forEach(function(entry) {
      var unitId = entry[0]
      var data = entry[1]
      var needed = data.count
      var request = needed + Math.ceil(needed / 3)
      var uname = getUnitName(unitId)
      lista += '<div style="color:#fcd34d;font-size:11px;margin-bottom:2px;">'
        + '\u26a0 ' + uname + ' \xd7' + needed
        + '<span style="color:#94a3b8;"> (pedir ' + request + ')</span>'
        + '</div>'
    })
    lista += '</div>'

    // botão expand/collapse
    var btnHtml = ""
    if (total > PREVIEW) {
      var resto = total - PREVIEW
      var btnLabel = expanded ? "\u25b2 ver menos" : "\u25bc +" + resto + " outros"
      // escapar aspas simples no nome do planeta para o onclick
      var escapedName = name.replace(/'/g, "\\'")
      btnHtml = '<div style="margin-top:4px;">'
        + '<button onclick="togglePlatoonExpand(\'' + escapedName + '\')"'
        + ' style="background:none;border:none;color:#60a5fa;font-size:11px;cursor:pointer;padding:0;">'
        + btnLabel
        + '</button>'
        + '</div>'
    }

    div.innerHTML = header + resumo + lista + btnHtml
    container.appendChild(div)
  })
}
