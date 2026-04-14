/**
 * drawBattleMap.js
 * Modal "Mapa de Batalhas" — abre ao clicar no link do planeta.
 * Mostra: mapa do planeta + jogadores elegíveis por missão.
 *
 * Features:
 *   - Seletor de fase: padrão = fase do planeta atual, mas qualquer fase selecionável
 *   - Sugestão platoon×batalha: cruza platoonAllocEngine com elegíveis para sugerir
 *     quem liberar do platoon para ganhar batalhas extras
 */

// Estado interno do modal
var _bmState = {
  planetName: null,
  selectedPhase: null
}

function openBattleMap(planetName) {
  var overlay = document.getElementById('battleMapOverlay')
  if (!overlay) return

  _bmState.planetName = planetName

  // Fase padrão = fase configurada para o planeta (ou 1)
  var planetPhase = (state.planets[planetName] && state.planets[planetName].phase)
    ? Number(state.planets[planetName].phase) : 1
  _bmState.selectedPhase = planetPhase

  overlay.querySelector('#bmPlanetName').textContent = planetName

  _bmRenderAll()
  overlay.style.display = 'flex'
}

function _bmRenderAll() {
  var overlay = document.getElementById('battleMapOverlay')
  if (!overlay) return

  var planetName = _bmState.planetName
  var combatData = (typeof PLANET_COMBAT_DATA !== 'undefined') ? PLANET_COMBAT_DATA[planetName] : null

  // Imagem do mapa
  var imgEl = overlay.querySelector('#bmMapImg')
  if (combatData && combatData.mapUrl) {
    imgEl.src = combatData.mapUrl
    imgEl.style.display = 'block'
  } else {
    imgEl.style.display = 'none'
  }

  var playerPanel = overlay.querySelector('#bmPlayerPanel')
  playerPanel.innerHTML = ''

  var rosterMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.loadActive() : null
  if (!rosterMap || Object.keys(rosterMap).length === 0) {
    playerPanel.innerHTML = '<div style="color:#94a3b8;font-size:12px;padding:8px;">Sincronize o roster primeiro (🔄)</div>'
    return
  }

  // ── Seletor de fase ────────────────────────────────────────────────────
  var phaseSelector = document.createElement('div')
  phaseSelector.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 8px 8px;border-bottom:1px solid #334155;flex-wrap:wrap;'
  phaseSelector.innerHTML = '<span style="font-size:10px;color:#64748b;">Fase:</span>'

  var allPhases = [1, 2, 3, 4, 5, 6]
  // Incluir fases bonus se existirem planetas ativos nelas
  var bonusPlanets = { 'Zeffo': 'B1', 'Mandalore': 'B2' }
  var activeBonusPhases = []
  Object.keys(bonusPlanets).forEach(function(p) {
    if (state.planets[p] && state.planets[p].phase) activeBonusPhases.push(bonusPlanets[p])
  })

  allPhases.forEach(function(f) {
    var btn = document.createElement('button')
    btn.textContent = 'F' + f
    var isActive = f === _bmState.selectedPhase
    btn.style.cssText = 'font-size:10px;padding:2px 7px;border-radius:3px;cursor:pointer;border:1px solid ' +
      (isActive ? '#4da6ff' : '#334155') + ';background:' +
      (isActive ? '#1e3a5f' : 'transparent') + ';color:' +
      (isActive ? '#93c5fd' : '#64748b') + ';'
    btn.onclick = function() { _bmState.selectedPhase = f; _bmRenderAll() }
    phaseSelector.appendChild(btn)
  })

  // Botão "Planeta atual" se a fase do planeta for diferente da selecionada
  var planetPhase = (state.planets[planetName] && state.planets[planetName].phase)
    ? Number(state.planets[planetName].phase) : null
  if (planetPhase && planetPhase !== _bmState.selectedPhase) {
    var btnCurrent = document.createElement('button')
    btnCurrent.textContent = '↩ F' + planetPhase
    btnCurrent.title = 'Voltar para a fase atual do planeta'
    btnCurrent.style.cssText = 'font-size:10px;padding:2px 7px;border-radius:3px;cursor:pointer;border:1px solid #475569;background:transparent;color:#94a3b8;margin-left:4px;'
    btnCurrent.onclick = function() { _bmState.selectedPhase = planetPhase; _bmRenderAll() }
    phaseSelector.appendChild(btnCurrent)
  }

  playerPanel.appendChild(phaseSelector)

  // ── Dados da fase selecionada ──────────────────────────────────────────
  // Para exibição, usar o tier da fase selecionada (não necessariamente do planeta)
  // Mapear fase → tier via TIER_RELIC order
  var phaseTierMap = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6 }
  var displayTier = phaseTierMap[_bmState.selectedPhase] || 1
  var minRelic = (typeof TIER_RELIC !== 'undefined') ? (TIER_RELIC[displayTier] || 5) : 5

  // Recalcular com a fase selecionada: precisamos de um planeta representativo dessa fase
  // para buscar as composições certas. Usar o planeta atual se for da fase selecionada,
  // senão usar qualquer planeta ativo daquela fase, senão usar o próprio planetName.
  var targetPlanet = planetName
  if (planetPhase !== _bmState.selectedPhase) {
    // Procurar outro planeta ativo da fase selecionada
    var phasePlanet = Object.keys(state.planets).find(function(n) {
      return state.planets[n] && Number(state.planets[n].phase) === _bmState.selectedPhase
    })
    if (phasePlanet && PLANET_COMBAT_DATA && PLANET_COMBAT_DATA[phasePlanet]) {
      targetPlanet = phasePlanet
    }
    // Mostrar aviso se fase diferente do planeta
    var phaseNote = document.createElement('div')
    phaseNote.style.cssText = 'font-size:10px;color:#f59e0b;padding:4px 8px;background:#451a03;border-radius:3px;margin:4px 8px;'
    phaseNote.textContent = '⚠ Visualizando composições da F' + _bmState.selectedPhase +
      (phasePlanet ? ' (' + phasePlanet + ')' : ' — sem planeta ativo nesta fase') +
      '. Mapa exibe ' + planetName + '.'
    playerPanel.appendChild(phaseNote)
  }

  var playerData = (typeof combatEngine !== 'undefined')
    ? combatEngine.computePlayerMissionsForPlanet(targetPlanet, rosterMap)
    : []

  if (playerData.length === 0) {
    var noData = document.createElement('div')
    noData.style.cssText = 'color:#f87171;font-size:12px;padding:8px;'
    noData.textContent = 'Nenhum jogador elegível para este planeta/fase.'
    playerPanel.appendChild(noData)
    return
  }

  // ── Sugestão platoon×batalha (item 5b) ────────────────────────────────
  if (typeof platoonAllocEngine !== 'undefined' && planetPhase === _bmState.selectedPhase) {
    var platoonSuggestions = _bmBuildPlatoonSuggestions(planetName, playerData, rosterMap)
    if (platoonSuggestions) {
      playerPanel.appendChild(platoonSuggestions)
    }
  }

  // ── Resumo ─────────────────────────────────────────────────────────────
  var totalMissions = 0
  playerData.forEach(function(p) { totalMissions += p.missions.length })

  var summary = document.createElement('div')
  summary.style.cssText = 'font-size:11px;color:#64748b;padding:4px 8px 8px;border-bottom:1px solid #334155;margin-bottom:6px;'
  summary.textContent = playerData.length + ' jogadores · ' + totalMissions + ' batalhas elegíveis'
  playerPanel.appendChild(summary)

  // ── Lista de jogadores ─────────────────────────────────────────────────
  playerData.forEach(function(pData) {
    var row = document.createElement('div')
    row.className = 'bm-player-row'

    var badges = pData.missions.map(function(m) {
      var color = m.type === 'ship' ? '#a78bfa' : '#4da6ff'
      return '<span style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '44;border-radius:3px;padding:1px 4px;font-size:10px;margin-right:2px;">M' + m.n + '</span>'
    }).join('')

    row.innerHTML =
      '<div class="bm-player-header" onclick="toggleBattleMapPlayer(this)">' +
        '<span style="font-weight:bold;font-size:12px;">' + _escHtml(pData.playerName) + '</span>' +
        '<span style="margin-left:6px;">' + badges + '</span>' +
        '<span style="margin-left:auto;color:#64748b;font-size:11px;">▼</span>' +
      '</div>' +
      '<div class="bm-player-detail" style="display:none;">' +
        _buildPlayerDetail(pData) +
      '</div>'

    playerPanel.appendChild(row)
  })
}

// ── Sugestão platoon×batalha ───────────────────────────────────────────────
// Para cada slot "tight" alocado no platoon: verifica se esse jogador também
// é elegível para alguma batalha. Se sim, sugere trocar por outro candidato
// do platoon que NÃO seja elegível para batalha.
function _bmBuildPlatoonSuggestions(planetName, playerData, rosterMap) {
  var alloc = platoonAllocEngine.load()
  var planetAlloc = alloc[planetName]
  if (!planetAlloc) return null

  // Mapa: playerId → missões elegíveis
  var playerMissions = {}
  playerData.forEach(function(p) {
    playerMissions[p.playerId] = p.missions
  })

  var suggestions = []

  Object.keys(planetAlloc).forEach(function(opStr) {
    var slots = planetAlloc[opStr]
    slots.forEach(function(slot) {
      if (!slot.playerId || !slot.isTight) return
      var missions = playerMissions[slot.playerId]
      if (!missions || missions.length === 0) return  // jogador não é elegível para batalha — ok no platoon

      // Jogador está no platoon MAS também poderia batalhar
      // Verificar se há candidato excedente que NÃO é elegível para batalha
      var altCandidates = (slot.surplusCandidates || []).filter(function(sc) {
        return !playerMissions[sc.playerId] || playerMissions[sc.playerId].length === 0
      })

      var unitName = (typeof getUnitName === 'function') ? getUnitName(slot.unitId) : slot.unitId
      var missionLabels = missions.map(function(m) { return 'M' + m.n }).join(', ')

      suggestions.push({
        unitName:      unitName,
        op:            opStr,
        playerInPlatoon: slot.playerName,
        playerRelic:   slot.relic,
        missionLabels: missionLabels,
        altCandidates: altCandidates
      })
    })
  })

  if (suggestions.length === 0) return null

  var div = document.createElement('div')
  div.style.cssText = 'margin:6px 8px;padding:8px;background:#172554;border:1px solid #1e40af;border-radius:6px;'
  div.innerHTML = '<div style="color:#93c5fd;font-size:11px;font-weight:bold;margin-bottom:6px;">💡 Sugestões platoon × batalha</div>'

  suggestions.forEach(function(s) {
    var html = '<div style="margin-bottom:6px;padding:6px;background:#0f172a;border-radius:4px;border-left:3px solid #f59e0b;">'
    html += '<div style="font-size:10px;color:#fbbf24;font-weight:bold;">Op ' + s.op + ' — ' + _escHtml(s.unitName) + '</div>'
    html += '<div style="font-size:10px;color:#e2e8f0;margin-top:2px;">'
    var relicLabel = (typeof platoonAllocEngine !== 'undefined' && platoonAllocEngine._isShip(s.unitId)) ? '7★' : 'R' + s.playerRelic
    html += '<span style="color:#f87171;">⚔ ' + _escHtml(s.playerInPlatoon) + '</span> está no platoon mas pode batalhar (' + s.missionLabels + ')'
    html += '</div>'
    if (s.altCandidates.length > 0) {
      html += '<div style="font-size:10px;color:#86efac;margin-top:3px;">✓ Alternativa p/ platoon: '
      html += s.altCandidates.slice(0, 2).map(function(c) {
        var cRelicLabel = (typeof platoonAllocEngine !== 'undefined' && platoonAllocEngine._isShip(s.unitId)) ? '7★' : 'R' + c.relic
        return _escHtml(c.playerName) + ' (' + cRelicLabel + ')'
      }).join(', ')
      html += '</div>'
    } else {
      html += '<div style="font-size:10px;color:#94a3b8;margin-top:3px;">⚠ Sem substituto disponível para o platoon</div>'
    }
    html += '</div>'
    div.innerHTML += html
  })

  return div
}

function closeBattleMap() {
  var overlay = document.getElementById('battleMapOverlay')
  if (overlay) overlay.style.display = 'none'
}

function toggleBattleMapPlayer(headerEl) {
  var detail = headerEl.nextElementSibling
  var arrow = headerEl.querySelector('span:last-child')
  if (!detail) return
  var isOpen = detail.style.display !== 'none'
  detail.style.display = isOpen ? 'none' : 'block'
  if (arrow) arrow.textContent = isOpen ? '▼' : '▲'
}

// Monta o HTML do detalhe de um jogador (suas missões + squads)
function _buildPlayerDetail(pData) {
  var html = '<div style="padding:6px 0 2px;">'
  pData.missions.forEach(function(m) {
    var typeLabel = m.type === 'ship' ? '🚀' : '⚔'
    html += '<div style="margin-bottom:6px;">'
    html += '<div style="font-size:11px;font-weight:bold;color:#94a3b8;margin-bottom:2px;">' +
            typeLabel + ' M' + m.n + ' — ' + _escHtml(m.req || '') + '</div>'

    if (m.squads && m.squads.length > 0) {
      m.squads.forEach(function(squad) {
        if (squad[0] === 'any') {
          html += '<div style="font-size:11px;color:#64748b;padding-left:8px;">Qualquer squad válido</div>'
          return
        }
        var isShip = (typeof SHIP_IDS !== 'undefined' && SHIP_IDS[squad[0]])
        var dotColor = isShip ? '#a78bfa' : '#4ade80'
        html += '<div style="padding-left:8px;margin-bottom:4px;">'
        squad.forEach(function(uid, i) {
          var name = (typeof getUnitName === 'function') ? getUnitName(uid) : uid
          var prefix = i === 0
            ? '<span style="color:' + dotColor + ';">●</span> '
            : '<span style="color:#475569;padding-left:10px;">+</span> '
          html += '<div style="font-size:11px;color:' + (i === 0 ? '#e2e8f0' : '#94a3b8') + ';line-height:1.5;">' +
                  prefix + _escHtml(name) + '</div>'
        })
        html += '</div>'
      })
    }
    html += '</div>'
  })
  html += '</div>'
  return html
}

function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Fechar ao clicar no overlay (fora do conteúdo)
document.addEventListener('DOMContentLoaded', function() {
  var overlay = document.getElementById('battleMapOverlay')
  if (!overlay) return
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeBattleMap()
  })
})
