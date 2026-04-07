/**
 * drawBattleMap.js
 * Modal "Mapa de Batalhas" — abre ao clicar no link do planeta.
 * Mostra: mapa do planeta em tamanho grande + jogadores elegíveis por missão.
 * Ao clicar no jogador: expande as missões que ele consegue fazer + squads opcionais.
 */

function openBattleMap(planetName) {
  var overlay = document.getElementById('battleMapOverlay')
  if (!overlay) return

  // Dados do planeta
  var combatData = (typeof PLANET_COMBAT_DATA !== 'undefined') ? PLANET_COMBAT_DATA[planetName] : null
  var mapUrl = combatData ? combatData.mapUrl : null

  // Roster ativo
  var rosterMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.loadActive() : null

  // Título
  overlay.querySelector('#bmPlanetName').textContent = planetName

  // Imagem do mapa
  var imgEl = overlay.querySelector('#bmMapImg')
  if (mapUrl) {
    imgEl.src = mapUrl
    imgEl.style.display = 'block'
  } else {
    imgEl.style.display = 'none'
  }

  // Painel de jogadores
  var playerPanel = overlay.querySelector('#bmPlayerPanel')
  playerPanel.innerHTML = ''

  if (!rosterMap || Object.keys(rosterMap).length === 0) {
    playerPanel.innerHTML = '<div style="color:#94a3b8;font-size:12px;padding:8px;">Sincronize o roster primeiro (🔄)</div>'
  } else {
    var playerData = (typeof combatEngine !== 'undefined')
      ? combatEngine.computePlayerMissionsForPlanet(planetName, rosterMap)
      : []

    if (playerData.length === 0) {
      playerPanel.innerHTML = '<div style="color:#f87171;font-size:12px;padding:8px;">Nenhum jogador elegível para este planeta.</div>'
    } else {
      // Cabeçalho resumo
      var totalMissions = 0
      playerData.forEach(function(p) { totalMissions += p.missions.length })

      var summary = document.createElement('div')
      summary.style.cssText = 'font-size:11px;color:#64748b;padding:4px 8px 8px;border-bottom:1px solid #334155;margin-bottom:6px;'
      summary.textContent = playerData.length + ' jogadores · ' + totalMissions + ' batalhas elegíveis'
      playerPanel.appendChild(summary)

      playerData.forEach(function(pData) {
        var row = document.createElement('div')
        row.className = 'bm-player-row'

        // Missão badges
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
  }

  overlay.style.display = 'flex'
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
      // Mostrar até 2 squads
      m.squads.slice(0, 2).forEach(function(squad, idx) {
        if (squad[0] === 'any') {
          html += '<div style="font-size:11px;color:#64748b;padding-left:8px;">Qualquer squad válido</div>'
          return
        }
        var names = squad.map(function(uid) {
          return (typeof getUnitName === 'function') ? getUnitName(uid) : uid
        })
        var isShip = (typeof SHIP_IDS !== 'undefined' && SHIP_IDS[squad[0]])
        var dotColor = isShip ? '#a78bfa' : '#4ade80'
        html += '<div style="font-size:11px;color:#e2e8f0;padding-left:8px;margin-bottom:1px;">' +
                '<span style="color:' + dotColor + ';">●</span> ' +
                _escHtml(names.join(', ')) +
                '</div>'
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
