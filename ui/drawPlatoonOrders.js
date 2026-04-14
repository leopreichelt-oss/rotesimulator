/**
 * drawPlatoonOrders.js
 * Modal "Ordens de Platoon" — exibe por jogador quais unidades alocar e onde.
 *
 * Regras:
 *   - Planetas da fase N: alocar todos os slots de todas as ops (respeita
 *     o nº de ops configurado no planeta, padrão 6)
 *   - Planetas da fase N+1 conforme earlyPlatoonStatus:
 *       "completar"              → todos os 15 slots por op
 *       "preencher_nao_completar"→ apenas 14/15 por op (não completar a op)
 *       "nao_fazer"              → não incluir
 *   - Planetas da fase N-1 que na fase anterior foram "preencher_nao_completar":
 *       → agora completar apenas o slot restante (índice 14) de cada op
 *   - Máximo 10 unidades por jogador por planeta
 *   - Apenas jogadores ativos (loadActive)
 */

function openPlatoonOrdersModal(phase) {
  var overlay = document.getElementById('platoonOrdersOverlay')
  if (!overlay) return

  var orders = _buildPlatoonOrders(phase)
  _renderPlatoonOrdersModal(phase, orders, overlay)
  overlay.style.display = 'flex'
}

function closePlatoonOrdersModal() {
  var overlay = document.getElementById('platoonOrdersOverlay')
  if (overlay) overlay.style.display = 'none'
}

// ── Constrói a lista de ordens por jogador ─────────────────────────────────
function _buildPlatoonOrders(phase) {
  if (typeof platoonAllocEngine === 'undefined' || typeof rosterEngine === 'undefined') return []

  var alloc    = platoonAllocEngine.load()
  var rosterMap = rosterEngine.loadActive()
  if (!alloc || !rosterMap || Object.keys(rosterMap).length === 0) return []

  var currentPlanets = getPlanetsOfPhase(phase)
  var nextPlanets    = getPlanetsOfPhase(phase + 1)

  // Status de early platoon para a fase atual (afeta planetas da próxima fase)
  var earlyStatusNext = computeEarlyPlatoonStatus(phase)
  // Status de early platoon da fase anterior (afeta planetas atuais que foram partial)
  var earlyStatusPrev = phase > 1 ? computeEarlyPlatoonStatus(phase - 1) : {}

  // { planet → { maxOps, slotStart, slotEnd, tag, isCarryForward } }
  var planetConfigs = {}

  // Planetas da fase atual
  currentPlanets.forEach(function(p) {
    var cfgOps = Number(state.planets[p]?.platoons) || 6
    var maxOps = cfgOps > 0 ? cfgOps : 6

    var wasPartial = earlyStatusPrev[p] === 'preencher_nao_completar'
    if (wasPartial) {
      // Só o último slot de cada op (completar o que ficou faltando na fase anterior)
      planetConfigs[p] = { maxOps: maxOps, slotStart: 14, slotEnd: 15, tag: '⚑ completar restante', isCarryForward: true }
    } else {
      planetConfigs[p] = { maxOps: maxOps, slotStart: 0, slotEnd: 15, tag: '', isCarryForward: false }
    }
  })

  // Planetas da próxima fase (early platoon)
  nextPlanets.forEach(function(p) {
    var status = earlyStatusNext[p]
    if (!status || status === 'nao_fazer') return

    if (status === 'completar') {
      planetConfigs[p] = { maxOps: 6, slotStart: 0, slotEnd: 15, tag: '▸ próx. fase', isCarryForward: false }
    } else if (status === 'preencher_nao_completar') {
      // 14/15: não completar a operação (risco de bater star1 antecipado)
      planetConfigs[p] = { maxOps: 6, slotStart: 0, slotEnd: 14, tag: '▸ próx. fase — não completar', isCarryForward: false }
    }
  })

  // Construir ordens por jogador
  // playerId → { playerName, assignments[], countByPlanet{}, usedUnits{} }
  // usedUnits: unitId → true — cada personagem pode ser alocado apenas 1x por fase
  var playerOrders = {}

  var planetNames = Object.keys(planetConfigs)
    .sort(function(a, b) {
      // current phase first, then next phase
      var phA = Number(state.planets[a]?.phase) || 99
      var phB = Number(state.planets[b]?.phase) || 99
      return phA - phB
    })

  planetNames.forEach(function(planetName) {
    var config     = planetConfigs[planetName]
    var planetAlloc = alloc[planetName]
    if (!planetAlloc) return

    var opKeys = Object.keys(planetAlloc)
      .map(Number).sort(function(a, b) { return a - b })

    opKeys.forEach(function(op, opIdx) {
      if (opIdx >= config.maxOps) return

      var slots       = planetAlloc[op] || []
      var targetSlots = slots.slice(config.slotStart, config.slotEnd)

      targetSlots.forEach(function(slot) {
        if (!slot.playerId || !slot.playerName) return  // placeholder
        if (!rosterMap[slot.playerId]) return           // inativo/margem

        if (!playerOrders[slot.playerId]) {
          playerOrders[slot.playerId] = {
            playerName:    slot.playerName,
            assignments:   [],
            countByPlanet: {},
            usedUnits:     {}   // unitId → true: controle de duplicatas por fase
          }
        }

        var po = playerOrders[slot.playerId]

        // Cada personagem só pode ser alocado 1 vez por fase
        if (po.usedUnits[slot.unitId]) return

        po.countByPlanet[planetName] = po.countByPlanet[planetName] || 0
        if (po.countByPlanet[planetName] >= 10) return  // max 10 por planeta

        var isShip = (typeof platoonAllocEngine !== 'undefined') && platoonAllocEngine._isShip(slot.unitId)
        var relicLabel = isShip ? '7★' : 'R' + slot.relic
        var unitName   = (typeof getUnitName === 'function') ? getUnitName(slot.unitId) : slot.unitId

        po.usedUnits[slot.unitId] = true
        po.assignments.push({
          planet:        planetName,
          planetTag:     config.tag,
          op:            op,
          unitName:      unitName,
          relicLabel:    relicLabel,
          isCarryForward: config.isCarryForward
        })
        po.countByPlanet[planetName]++
      })
    })
  })

  return Object.values(playerOrders)
    .filter(function(p) { return p.assignments.length > 0 })
    .sort(function(a, b) { return a.playerName.localeCompare(b.playerName) })
}

// ── Renderiza o modal ──────────────────────────────────────────────────────
function _renderPlatoonOrdersModal(phase, orders, overlay) {
  var header = overlay.querySelector('#poPhaseLabel')
  if (header) header.textContent = 'Fase ' + phase

  var container = overlay.querySelector('#poPlayerList')
  if (!container) return
  container.innerHTML = ''

  if (orders.length === 0) {
    container.innerHTML = '<div style="color:#94a3b8;font-size:12px;padding:12px;">Sincronize o roster primeiro ou configure os planetas da fase.</div>'
    return
  }

  // Botão copiar tudo
  var copyAllBtn = document.createElement('button')
  copyAllBtn.textContent = '📋 Copiar tudo'
  copyAllBtn.style.cssText = 'width:100%;padding:6px;background:#1e3a5f;border:1px solid #3b82f6;color:#93c5fd;border-radius:4px;cursor:pointer;font-size:12px;margin-bottom:10px;'
  copyAllBtn.onclick = function() { _copyAllOrders(phase, orders) }
  container.appendChild(copyAllBtn)

  orders.forEach(function(po) {
    var card = document.createElement('div')
    card.style.cssText = 'margin-bottom:8px;border:1px solid #334155;border-radius:6px;overflow:hidden;'

    // Agrupar assignments por planeta
    var byPlanet = {}
    po.assignments.forEach(function(a) {
      var key = a.planet
      if (!byPlanet[key]) byPlanet[key] = { tag: a.planetTag, isCarryForward: a.isCarryForward, items: [] }
      byPlanet[key].items.push(a)
    })

    var bodyHtml = ''
    Object.keys(byPlanet).forEach(function(planet) {
      var pg = byPlanet[planet]
      var tagColor  = pg.isCarryForward ? '#f59e0b' : (pg.tag.indexOf('próx') >= 0 ? '#64748b' : '#4da6ff')
      var tagHtml   = pg.tag ? (' <span style="font-size:9px;color:' + tagColor + ';">' + pg.tag + '</span>') : ''

      bodyHtml += '<div style="padding:4px 8px 2px;background:#0f172a;">'
      bodyHtml += '<div style="font-size:10px;color:#4da6ff;font-weight:bold;margin-bottom:2px;">' + _escHtmlPO(planet) + tagHtml + '</div>'

      pg.items.forEach(function(a) {
        bodyHtml += '<div style="font-size:11px;color:#e2e8f0;padding:1px 0 1px 8px;">'
          + 'Op' + a.op + ': ' + _escHtmlPO(a.unitName)
          + ' <span style="color:#64748b;">(' + a.relicLabel + ')</span></div>'
      })

      bodyHtml += '</div>'
    })

    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:#1e293b;">' +
        '<span style="font-size:12px;font-weight:bold;color:#e2e8f0;">' + _escHtmlPO(po.playerName) + '</span>' +
        '<span style="font-size:10px;color:#64748b;">' + po.assignments.length + ' unid.</span>' +
        '<button onclick="this.closest(\'.po-card\').nextElementSibling" style="font-size:10px;padding:2px 7px;background:#1e3a5f;border:1px solid #3b82f6;color:#93c5fd;border-radius:3px;cursor:pointer;" ' +
          'onclick="_copyPlayerOrders(' + "'" + po.playerName + "'" + ',' + phase + ')">📋</button>' +
      '</div>' +
      bodyHtml

    // Fix the copy button properly
    var cardDiv = document.createElement('div')
    cardDiv.style.cssText = 'margin-bottom:8px;border:1px solid #334155;border-radius:6px;overflow:hidden;'

    var headerDiv = document.createElement('div')
    headerDiv.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:#1e293b;'

    var nameSpan = document.createElement('span')
    nameSpan.style.cssText = 'font-size:12px;font-weight:bold;color:#e2e8f0;flex:1;'
    nameSpan.textContent = po.playerName

    var countSpan = document.createElement('span')
    countSpan.style.cssText = 'font-size:10px;color:#64748b;margin-right:6px;'
    countSpan.textContent = po.assignments.length + ' unid.'

    var copyBtn = document.createElement('button')
    copyBtn.textContent = '📋'
    copyBtn.title = 'Copiar ordens de ' + po.playerName
    copyBtn.style.cssText = 'font-size:11px;padding:2px 7px;background:#1e3a5f;border:1px solid #3b82f6;color:#93c5fd;border-radius:3px;cursor:pointer;'
    ;(function(playerOrders, ph) {
      copyBtn.onclick = function() { _copyPlayerOrders(playerOrders, ph) }
    })(po, phase)

    headerDiv.appendChild(nameSpan)
    headerDiv.appendChild(countSpan)
    headerDiv.appendChild(copyBtn)
    cardDiv.appendChild(headerDiv)

    var bodyDiv = document.createElement('div')
    bodyDiv.innerHTML = bodyHtml
    cardDiv.appendChild(bodyDiv)

    container.appendChild(cardDiv)
  })
}

// ── Gera texto Discord para um único jogador ───────────────────────────────
function _formatPlayerOrderText(po, phase) {
  var lines = [po.playerName + ' — Platoons F' + phase + ':']

  var byPlanet = {}
  po.assignments.forEach(function(a) {
    if (!byPlanet[a.planet]) byPlanet[a.planet] = []
    byPlanet[a.planet].push(a)
  })

  Object.keys(byPlanet).forEach(function(planet) {
    byPlanet[planet].forEach(function(a) {
      var suffix = a.isCarryForward ? ' ⚑' : ''
      lines.push('• ' + planet + ' Op' + a.op + ': ' + a.unitName + ' (' + a.relicLabel + ')' + suffix)
    })
  })

  return lines.join('\n')
}

function _copyPlayerOrders(po, phase) {
  var text = _formatPlayerOrderText(po, phase)
  navigator.clipboard.writeText(text).then(function() {
    // flash visual feedback: noop (alert would be annoying per player)
  })
}

function _copyAllOrders(phase, orders) {
  var sections = ['⚔ PLATOONS — FASE ' + phase + '\n' + '━'.repeat(24)]
  orders.forEach(function(po) {
    sections.push(_formatPlayerOrderText(po, phase))
  })
  var text = sections.join('\n\n')
  navigator.clipboard.writeText(text).then(function() {
    alert('Ordens da Fase ' + phase + ' copiadas (' + orders.length + ' jogadores)')
  })
}

function _escHtmlPO(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Fechar ao clicar fora do modal
document.addEventListener('DOMContentLoaded', function() {
  var overlay = document.getElementById('platoonOrdersOverlay')
  if (!overlay) return
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closePlatoonOrdersModal()
  })
})
