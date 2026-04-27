/**
 * drawDeployPanel.js
 * Modal "🚀 Deploy de Platoons" — visão completa de todas as ops de uma fase
 * com rastreamento de progresso.
 *
 * Para cada op mostra:
 *   - Checkbox: marcar como concluída no jogo
 *   - Lista compacta de personagens → jogador
 *   - Conflitos de batalha (se houver)
 *
 * Abre via: openDeployModal(phase)
 */

function openDeployModal(phase) {
  var old = document.getElementById('deployModalOverlay')
  if (old) old.remove()

  var overlay = document.createElement('div')
  overlay.id = 'deployModalOverlay'
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.78);z-index:10000;display:flex;align-items:center;justify-content:center;'
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove() }

  var box = document.createElement('div')
  box.style.cssText = 'background:#0f172a;border:1px solid #334155;border-radius:10px;width:620px;max-width:97vw;max-height:90vh;display:flex;flex-direction:column;'

  // ── Header ────────────────────────────────────────────────────────────────
  var header = document.createElement('div')
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid #334155;flex-shrink:0;'

  var titleSpan = document.createElement('span')
  titleSpan.style.cssText = 'font-weight:bold;font-size:15px;color:#ffd700;'
  titleSpan.textContent = '🚀 Deploy de Platoons — Fase ' + phase

  var closeBtn = document.createElement('button')
  closeBtn.textContent = '✕'
  closeBtn.style.cssText = 'background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;padding:0 4px;'
  closeBtn.onclick = function() { overlay.remove() }

  header.appendChild(titleSpan)
  header.appendChild(closeBtn)
  box.appendChild(header)

  // ── Barra de progresso ────────────────────────────────────────────────────
  var progressBar = document.createElement('div')
  progressBar.id = 'deployProgressBar_' + phase
  progressBar.style.cssText = 'padding:8px 16px;border-bottom:1px solid #1e293b;flex-shrink:0;'
  box.appendChild(progressBar)

  // ── Corpo ─────────────────────────────────────────────────────────────────
  var body = document.createElement('div')
  body.id = 'deployModalBody_' + phase
  body.style.cssText = 'flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:12px;'
  box.appendChild(body)

  // ── Footer ────────────────────────────────────────────────────────────────
  var footer = document.createElement('div')
  footer.style.cssText = 'display:flex;gap:8px;padding:10px 14px;border-top:1px solid #1e293b;flex-shrink:0;'

  var resetBtn = document.createElement('button')
  resetBtn.textContent = '↺ Resetar fase'
  resetBtn.title = 'Zerar progresso de deploy desta fase'
  resetBtn.style.cssText = 'padding:6px 12px;background:#450a0a;color:#fca5a5;border:1px solid #7f1d1d;border-radius:6px;cursor:pointer;font-size:11px;'
  resetBtn.onclick = function() {
    var planets = getPlanetsOfPhase(phase)
    deployTracker.resetPlanets(planets)
    _renderDeployBody(phase, body, progressBar)
  }

  var copyBtn = document.createElement('button')
  copyBtn.textContent = '📋 Copiar pendentes'
  copyBtn.title = 'Copia para clipboard as ops ainda não concluídas'
  copyBtn.style.cssText = 'padding:6px 12px;background:#1e3a5f;color:#93c5fd;border:1px solid #3b82f6;border-radius:6px;cursor:pointer;font-size:11px;'
  copyBtn.onclick = function() { _copyPendingOps(phase) }

  footer.appendChild(resetBtn)
  footer.appendChild(copyBtn)
  box.appendChild(footer)

  overlay.appendChild(box)
  document.body.appendChild(overlay)

  _renderDeployBody(phase, body, progressBar)
}

// ── Renderiza / re-renderiza o corpo e a barra de progresso ───────────────────
function _renderDeployBody(phase, body, progressBar) {
  var planets = getPlanetsOfPhase(phase)
  var alloc   = (typeof platoonAllocEngine !== 'undefined') ? platoonAllocEngine.load() : {}

  // Progresso global da fase
  var prog = (typeof deployTracker !== 'undefined') ? deployTracker.getProgress(planets) : { done: 0, total: 0 }
  var pct  = prog.total > 0 ? Math.round(prog.done / prog.total * 100) : 0
  var barColor = prog.done === prog.total && prog.total > 0 ? '#4ade80' : pct >= 50 ? '#facc15' : '#60a5fa'

  progressBar.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
      '<span style="font-size:11px;color:#94a3b8;">Ops concluídas</span>' +
      '<span style="font-size:12px;font-weight:bold;color:' + barColor + ';">' + prog.done + ' / ' + prog.total + '</span>' +
    '</div>' +
    '<div style="background:#1e293b;border-radius:4px;height:6px;overflow:hidden;">' +
      '<div style="background:' + barColor + ';height:100%;width:' + pct + '%;transition:width 0.3s;border-radius:4px;"></div>' +
    '</div>'

  body.innerHTML = ''

  if (planets.length === 0) {
    body.innerHTML = '<div style="color:#94a3b8;font-size:12px;text-align:center;padding:20px;">Nenhum planeta configurado para a fase ' + phase + '.</div>'
    return
  }

  planets.forEach(function(planetName) {
    var platoonKey  = (typeof PLANET_PLATOON_KEY !== 'undefined') ? PLANET_PLATOON_KEY[planetName] : null
    var requirements = platoonKey && (typeof platoonRequirements !== 'undefined') ? platoonRequirements[platoonKey] : null
    if (!requirements) return

    var tier     = (typeof getPlanetTier === 'function') ? getPlanetTier(planetName) : 1
    var relicMin = (typeof TIER_RELIC !== 'undefined') ? (TIER_RELIC[tier] || 5) : 5
    var nOps     = (typeof deployTracker !== 'undefined') ? deployTracker._numOpsForPlanet(planetName) : Object.keys(requirements).length
    var planetAlloc = alloc[planetName] || {}

    var pSection = document.createElement('div')
    pSection.style.cssText = 'border:1px solid #334155;border-radius:8px;overflow:hidden;'

    var pHeader = document.createElement('div')
    pHeader.style.cssText = 'padding:6px 12px;background:#1e3a5f;display:flex;justify-content:space-between;align-items:center;'

    var pProg = (typeof deployTracker !== 'undefined') ? deployTracker.getProgress([planetName]) : { done: 0, total: nOps }
    var pDone = pProg.done >= pProg.total && pProg.total > 0
    pHeader.innerHTML =
      '<span style="font-size:12px;font-weight:bold;color:#93c5fd;">' + _escDp(planetName) + '</span>' +
      '<span style="font-size:10px;color:' + (pDone ? '#4ade80' : '#94a3b8') + ';">' +
        (pDone ? '✅ ' : '') + pProg.done + '/' + pProg.total + ' ops' +
      '</span>'

    pSection.appendChild(pHeader)

    for (var op = 1; op <= nOps; op++) {
      (function(op, planetName, phase, body, progressBar) {
        var opSlots = planetAlloc[op] || []
        var isDone  = (typeof deployTracker !== 'undefined') && deployTracker.isMarked(planetName, op)

        var opRow = document.createElement('div')
        opRow.id  = 'deployOpRow_' + planetName.replace(/\s/g,'_') + '_' + op
        opRow.style.cssText = 'display:flex;align-items:flex-start;gap:8px;padding:7px 12px;border-top:1px solid #1e293b;background:' + (isDone ? '#052e16' : 'transparent') + ';cursor:pointer;transition:background 0.15s;'

        opRow.onclick = function() {
          if (typeof deployTracker === 'undefined') return
          deployTracker.toggle(planetName, op)
          _renderDeployBody(phase, body, progressBar)
          // Redesenhar painel de fases para atualizar o badge de progresso
          if (typeof drawPhaseList === 'function') drawPhaseList()
        }

        // Checkbox visual
        var chk = document.createElement('div')
        chk.style.cssText = 'flex-shrink:0;width:18px;height:18px;border-radius:4px;border:2px solid ' + (isDone ? '#4ade80' : '#475569') + ';background:' + (isDone ? '#16a34a' : 'transparent') + ';display:flex;align-items:center;justify-content:center;margin-top:2px;'
        chk.innerHTML = isDone ? '<span style="color:#fff;font-size:11px;line-height:1;">✓</span>' : ''

        // Conteúdo da op
        var opContent = document.createElement('div')
        opContent.style.cssText = 'flex:1;min-width:0;'

        var opLabel = document.createElement('div')
        opLabel.style.cssText = 'font-size:11px;font-weight:bold;color:' + (isDone ? '#4ade80' : '#e2e8f0') + ';margin-bottom:3px;'
        opLabel.textContent = 'Operação ' + op

        opContent.appendChild(opLabel)

        if (opSlots.length === 0) {
          var noSlots = document.createElement('div')
          noSlots.style.cssText = 'font-size:10px;color:#475569;'
          noSlots.textContent = '(sem alocação calculada)'
          opContent.appendChild(noSlots)
        } else {
          // Agrupar slots por personagem
          var byUnit = {}
          opSlots.forEach(function(s) {
            if (!s.unitId) return
            if (!byUnit[s.unitId]) byUnit[s.unitId] = []
            byUnit[s.unitId].push(s)
          })

          var slotList = document.createElement('div')
          slotList.style.cssText = 'display:flex;flex-direction:column;gap:2px;'

          Object.keys(byUnit).forEach(function(unitId) {
            var slotsForUnit = byUnit[unitId]
            var uname = (typeof getUnitName === 'function') ? getUnitName(unitId) : unitId

            slotsForUnit.forEach(function(s) {
              var slotRow = document.createElement('div')
              slotRow.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:10px;'

              var isShip  = (typeof platoonAllocEngine !== 'undefined') && platoonAllocEngine._isShip(unitId)
              var relicLbl = isShip ? '7★' : (s.relic >= 0 ? 'R' + s.relic : '?')

              if (!s.playerId) {
                slotRow.innerHTML = '<span style="color:#f87171;">❌ ' + _escDp(uname) + '</span><span style="color:#64748b;"> sem candidato</span>'
              } else {
                var conflictHtml = ''
                if (s.conflict && s.conflict.missions && s.conflict.missions.length > 0) {
                  conflictHtml = ' <span style="color:#fb923c;" title="Conflito com batalha M' + s.conflict.missions.join(',') + '">⚔</span>'
                }
                slotRow.innerHTML =
                  '<span style="color:#94a3b8;">' + _escDp(uname) + '</span>' +
                  '<span style="color:#475569;">(' + relicLbl + ')</span>' +
                  '<span style="color:#60a5fa;font-weight:500;">→ ' + _escDp(s.playerName) + '</span>' +
                  conflictHtml
              }

              slotList.appendChild(slotRow)
            })
          })

          opContent.appendChild(slotList)
        }

        opRow.appendChild(chk)
        opRow.appendChild(opContent)
        pSection.appendChild(opRow)
      })(op, planetName, phase, body, progressBar)
    }

    body.appendChild(pSection)
  })
}

// ── Copia as ops pendentes para clipboard ──────────────────────────────────────
function _copyPendingOps(phase) {
  var planets = getPlanetsOfPhase(phase)
  var alloc   = (typeof platoonAllocEngine !== 'undefined') ? platoonAllocEngine.load() : {}
  var lines   = ['🚀 Platoons Pendentes — Fase ' + phase, '']

  planets.forEach(function(planetName) {
    var platoonKey  = (typeof PLANET_PLATOON_KEY !== 'undefined') ? PLANET_PLATOON_KEY[planetName] : null
    var requirements = platoonKey && (typeof platoonRequirements !== 'undefined') ? platoonRequirements[platoonKey] : null
    if (!requirements) return

    var nOps       = (typeof deployTracker !== 'undefined') ? deployTracker._numOpsForPlanet(planetName) : Object.keys(requirements).length
    var planetAlloc = alloc[planetName] || {}
    var pendingOps  = []

    for (var op = 1; op <= nOps; op++) {
      if ((typeof deployTracker !== 'undefined') && deployTracker.isMarked(planetName, op)) continue
      var opSlots = planetAlloc[op] || []
      var slotLines = []
      opSlots.forEach(function(s) {
        if (!s.playerId) return
        var uname    = (typeof getUnitName === 'function') ? getUnitName(s.unitId) : s.unitId
        var isShip   = (typeof platoonAllocEngine !== 'undefined') && platoonAllocEngine._isShip(s.unitId)
        var relicLbl = isShip ? '7★' : ('R' + s.relic)
        slotLines.push('  ' + s.playerName + ': ' + uname + ' (' + relicLbl + ')')
      })
      if (slotLines.length > 0) {
        pendingOps.push('Op' + op + ':')
        slotLines.forEach(function(l) { pendingOps.push(l) })
      }
    }

    if (pendingOps.length > 0) {
      lines.push('📍 ' + planetName)
      pendingOps.forEach(function(l) { lines.push(l) })
      lines.push('')
    }
  })

  if (lines.length <= 2) {
    lines.push('✅ Todos os platoons desta fase foram concluídos!')
  }

  var text = lines.join('\n')
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      _showDeployToast('📋 Pendentes copiados!')
    })
  } else {
    try {
      var ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;top:-9999px;'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      _showDeployToast('📋 Pendentes copiados!')
    } catch(e) {}
  }
}

function _showDeployToast(msg) {
  var t = document.getElementById('deployToast')
  if (!t) {
    t = document.createElement('div')
    t.id = 'deployToast'
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e40af;color:#fff;padding:8px 16px;border-radius:8px;font-size:12px;z-index:99999;transition:opacity 0.3s;pointer-events:none;'
    document.body.appendChild(t)
  }
  t.textContent = msg
  t.style.opacity = '1'
  clearTimeout(t._timer)
  t._timer = setTimeout(function() { t.style.opacity = '0' }, 2500)
}

function _escDp(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
