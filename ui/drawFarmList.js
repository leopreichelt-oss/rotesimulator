/**
 * drawFarmList.js
 * Renderiza a farm list de personagens para platoons.
 *
 * drawFarmCritical() — seção crítica: sempre visível, mostra bloqueadores ativos
 * drawFarmList()     — lista completa: assignments por jogador, avisos de não-progresso
 */

// --------------------------------------------------
// SEÇÃO CRÍTICA (sempre visível junto ao builder de planetas)
// --------------------------------------------------
function drawFarmCritical() {
  var container = document.getElementById('farmCritical')
  if (!container) return

  var rosterMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.loadActive() : null
  if (!rosterMap || Object.keys(rosterMap).length === 0) {
    container.innerHTML = ''
    return
  }

  var activePlanets = Object.keys(state.planets)
    .filter(function(name) { return state.planets[name] && state.planets[name].phase })

  if (activePlanets.length === 0) {
    container.innerHTML = ''
    return
  }

  // Coletar bloqueadores por planeta ativo
  var blockers = []  // [{planet, tier, unitId, have, needed, faltam, status}]

  activePlanets.forEach(function(name) {
    var tier = getPlanetTier(name)
    var relicMin = (typeof TIER_RELIC !== 'undefined' ? TIER_RELIC[tier] : null) || 5
    var platoonKey = (typeof PLANET_PLATOON_KEY !== 'undefined') ? PLANET_PLATOON_KEY[name] : null
    var requirements = (platoonKey && typeof platoonRequirements !== 'undefined') ? platoonRequirements[platoonKey] : null
    if (!requirements || typeof analyzePlanetPlatoon !== 'function') return

    var analysis = analyzePlanetPlatoon(name, requirements, relicMin, rosterMap, activePlanets)
    analysis.results.forEach(function(r) {
      if (r.status === 'missing' || r.status === 'impossible') {
        blockers.push({
          planet: name,
          tier: tier,
          phase: Number(state.planets[name].phase),
          unitId: r.id,
          have: r.have,
          needed: r.needed,
          faltam: r.faltam || r.needed,
          status: r.status
        })
      }
    })
  })

  if (blockers.length === 0) {
    container.innerHTML = '<div style="color:#4ade80;font-size:11px;padding:6px 8px;background:#052e16;border-radius:6px;border-left:3px solid #4ade80;">'
      + '✅ Nenhum bloqueador crítico nos planetas ativos</div>'
    return
  }

  // Agrupar por planeta
  var byPlanet = {}
  blockers.forEach(function(b) {
    if (!byPlanet[b.planet]) byPlanet[b.planet] = { phase: b.phase, tier: b.tier, items: [] }
    byPlanet[b.planet].items.push(b)
  })

  var html = '<div style="background:#1c0a0a;border-radius:6px;border-left:3px solid #f87171;padding:8px;margin-bottom:8px;">'
  html += '<div style="color:#f87171;font-weight:bold;font-size:12px;margin-bottom:6px;">🚫 BLOQUEADORES CRÍTICOS</div>'

  Object.keys(byPlanet).sort(function(a, b) {
    return byPlanet[a].phase - byPlanet[b].phase
  }).forEach(function(planetName) {
    var data = byPlanet[planetName]
    html += '<div style="margin-bottom:4px;">'
    html += '<div style="color:#fca5a5;font-size:11px;font-weight:bold;">F' + data.phase + ' – ' + planetName + ' <span style="color:#64748b;font-weight:normal;">(R' + ((typeof TIER_RELIC !== 'undefined' ? TIER_RELIC[data.tier] : '?')) + '+)</span></div>'

    data.items.forEach(function(b) {
      var uname = (typeof getUnitName === 'function') ? getUnitName(b.unitId) : b.unitId
      var sub = b.status === 'missing'
        ? 'nenhum jogador tem'
        : b.have + '/' + b.needed + ' — faltam ' + b.faltam
      html += '<div style="color:#fcd34d;font-size:10px;padding-left:8px;">⚠ ' + uname
        + ' <span style="color:#64748b;">' + sub + '</span></div>'
    })
    html += '</div>'
  })

  html += '</div>'
  container.innerHTML = html
}

// --------------------------------------------------
// LISTA COMPLETA DE FARM
// --------------------------------------------------
function drawFarmList() {
  var container = document.getElementById('farmList')
  if (!container) return

  var rosterMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.loadActive() : null
  if (!rosterMap || Object.keys(rosterMap).length === 0) {
    container.innerHTML = '<div style="color:#94a3b8;font-size:11px;">Sincronize o roster para gerar a farm list.</div>'
    return
  }

  if (typeof farmEngine === 'undefined') {
    container.innerHTML = '<div style="color:#f87171;font-size:11px;">farmEngine não carregado.</div>'
    return
  }

  var result = farmEngine.buildFarmList(rosterMap)
  var assignments = result.assignments
  var noProgress = result.noProgress
  var completed = result.completed
  var starBlockedSuggestions = result.starBlockedSuggestions || []
  var parallelFarmSuggestions = result.parallelFarmSuggestions || []

  // Indexar noProgress por playerId para lookup rápido
  var noProgressIds = {}
  noProgress.forEach(function(p) { noProgressIds[p.playerId] = p })

  // Agrupar assignments por prioridade e planeta
  // assignments: { playerId: {unitId, targetRelic, planet, priority, ...} }

  var priority1 = [], priority2 = [], priority3 = []

  Object.keys(assignments).forEach(function(pid) {
    var a = assignments[pid]
    var entry = { playerId: pid, assignment: a, noProgress: noProgressIds[pid] || null }
    if (a.priority === 1) priority1.push(entry)
    else if (a.priority === 2) priority2.push(entry)
    else priority3.push(entry)
  })

  var html = ''

  // Completados desde a última execução
  if (completed.length > 0) {
    html += '<div style="background:#052e16;border-radius:6px;border-left:3px solid #4ade80;padding:8px;margin-bottom:8px;">'
    html += '<div style="color:#4ade80;font-size:11px;font-weight:bold;margin-bottom:4px;">✅ Farm concluído desde a última atualização</div>'
    completed.forEach(function(c) {
      var uname = (typeof getUnitName === 'function') ? getUnitName(c.assignment.unitId) : c.assignment.unitId
      html += '<div style="font-size:10px;color:#86efac;">' + c.name + ' — ' + uname + ' (R' + c.assignment.targetRelic + ')</div>'
    })
    html += '</div>'
  }

  function _renderGroup(entries, title, borderColor, titleColor) {
    if (entries.length === 0) return ''

    // Agrupar por personagem dentro do grupo
    var byUnit = {}
    entries.forEach(function(e) {
      var uid = e.assignment.unitId
      if (!byUnit[uid]) byUnit[uid] = { planet: e.assignment.planet, targetRelic: e.assignment.targetRelic, players: [] }
      byUnit[uid].players.push(e)
    })

    var s = '<div style="background:#0f172a;border-radius:6px;border-left:3px solid ' + borderColor + ';padding:8px;margin-bottom:8px;">'
    s += '<div style="color:' + titleColor + ';font-weight:bold;font-size:12px;margin-bottom:6px;">' + title + '</div>'

    Object.keys(byUnit).sort().forEach(function(uid) {
      var group = byUnit[uid]
      var uname = (typeof getUnitName === 'function') ? getUnitName(uid) : uid
      var relicStr = 'R' + group.targetRelic

      s += '<div style="margin-bottom:6px;padding:6px;background:#1e293b;border-radius:4px;">'
      s += '<div style="color:#e2e8f0;font-size:11px;font-weight:bold;margin-bottom:3px;">'
        + uname + ' <span style="color:#60a5fa;">' + relicStr + '</span>'
        + ' <span style="color:#475569;font-weight:normal;font-size:10px;">· ' + group.planet + '</span></div>'

      group.players.forEach(function(e) {
        var pid = e.playerId
        var a = e.assignment
        var relicNow = farmEngine._playerRelicFor(
          Object.values(rosterMap).find(function(p) { return (p.playerId || p.name) === pid }) || { units: [] },
          a.unitId
        )
        var relicStr2 = relicNow < 0 ? 'sem o personagem' : 'R' + relicNow + ' → R' + a.targetRelic

        var isStuck = !!noProgressIds[pid]
        var playerColor = isStuck ? '#f87171' : '#94a3b8'
        var stuckTag = isStuck
          ? ' <span style="color:#f87171;font-size:9px;">⚠ sem progresso (' + noProgressIds[pid].daysSince + 'd)</span>'
          : ''

        s += '<div style="font-size:10px;color:' + playerColor + ';padding-left:8px;">'
          + e.assignment.playerName + ' — ' + relicStr2 + stuckTag + '</div>'
      })

      s += '</div>'
    })

    s += '</div>'
    return s
  }

  // Bloqueados por estrelas
  if (starBlockedSuggestions.length > 0) {
    html += '<div style="background:#1c1200;border-radius:6px;border-left:3px solid #fbbf24;padding:8px;margin-bottom:8px;">'
    html += '<div style="color:#fcd34d;font-weight:bold;font-size:12px;margin-bottom:4px;">⭐ Farm de estrelas necessário</div>'
    html += '<div style="font-size:10px;color:#94a3b8;margin-bottom:6px;">Estes jogadores têm o personagem mas precisam chegar em 7★ antes de relicar.</div>'
    starBlockedSuggestions.forEach(function(s) {
      var uname = (typeof getUnitName === 'function') ? getUnitName(s.unitId) : s.unitId
      html += '<div style="font-size:10px;color:#fcd34d;padding:2px 0 2px 8px;">'
        + s.playerName + ' — <b>' + uname + '</b>'
        + ' <span style="color:#64748b;">(' + s.starCount + '★ atual → 7★ necessário para R' + s.targetRelic + ')</span>'
        + ' · ' + s.planet
        + '</div>'
    })
    html += '</div>'
  }

  // Farm paralelo — personagens lentos
  if (parallelFarmSuggestions.length > 0) {
    html += '<div style="background:#0a1628;border-radius:6px;border-left:3px solid #818cf8;padding:8px;margin-bottom:8px;">'
    html += '<div style="color:#a5b4fc;font-weight:bold;font-size:12px;margin-bottom:4px;">⏳ Farm paralelo recomendado</div>'
    html += '<div style="font-size:10px;color:#94a3b8;margin-bottom:6px;">Personagens lentos de farm (eventos mensais, ~20 fragmentos/mês). Não são atribuídos como farm principal — comece a farmar fragmentos agora em paralelo.</div>'
    parallelFarmSuggestions.forEach(function(s) {
      var uname = (typeof getUnitName === 'function') ? getUnitName(s.unitId) : s.unitId
      html += '<div style="font-size:10px;color:#a5b4fc;padding:2px 0 2px 8px;">'
        + '<b>' + uname + '</b>'
        + ' <span style="color:#64748b;">— faltam ' + s.deficit + ' jogadores em R' + s.targetRelic + ' · ' + s.planet + '</span>'
        + ' <span style="color:#818cf8;">· farm fragmentos em paralelo</span>'
        + '</div>'
    })
    html += '</div>'
  }

  if (priority1.length === 0 && priority2.length === 0 && priority3.length === 0
      && starBlockedSuggestions.length === 0 && parallelFarmSuggestions.length === 0) {
    html += '<div style="color:#4ade80;font-size:11px;padding:8px;">✅ Nenhum farm pendente para os planetas configurados.</div>'
  } else {
    html += _renderGroup(priority1, '🔴 Crítico — Planetas ativos bloqueados', '#f87171', '#fca5a5')
    html += _renderGroup(priority2, '🟡 Próximo — Mesmo tier, ainda não jogado', '#fbbf24', '#fcd34d')
    html += _renderGroup(priority3, '🔵 Crescimento — Próximo tier', '#60a5fa', '#93c5fd')
  }

  container.innerHTML = html
}
