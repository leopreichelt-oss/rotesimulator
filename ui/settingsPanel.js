/**
 * settingsPanel.js
 * Painel de configurações do simulador.
 * Permite configurar allycode, sincronizar guilda e roster.
 */

// Estado do painel
var settingsState = {
  allycode: localStorage.getItem('rote_allycode') || '',
  guildData: null,
  syncing: false,
  activityStatus: null  // { inactive: N, safeMargin: N, list: [...] }
}

// Reconstrói activityStatus a partir do localStorage (sem precisar resincronizar)
function _loadActivityStatusFromStorage() {
  var activityMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.loadActivity() : {}
  if (!activityMap || !Object.keys(activityMap).length) return

  var rosterMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.load() : {}

  var list = Object.keys(activityMap).map(function(pid) {
    var player = rosterMap ? rosterMap[pid] : null
    return {
      name:      player ? player.name : pid,
      playerId:  pid,
      daysAgo:   null,  // sem lastActivityTime no roster; "?" na UI
      status:    activityMap[pid]
    }
  })

  list.sort(function(a, b) {
    var order = { inativo: 0, margem: 1, ativo: 2 }
    return ((order[a.status] !== undefined ? order[a.status] : 2) -
            (order[b.status] !== undefined ? order[b.status] : 2))
  })

  var inactive   = list.filter(function(p) { return p.status === 'inativo' }).length
  var safeMargin = list.filter(function(p) { return p.status === 'margem'  }).length

  settingsState.activityStatus = { inactive: inactive, safeMargin: safeMargin, list: list }
}

// Calcula status de atividade dos membros com base em lastActivityTime
function computeActivityStatus(members) {
  var now = Date.now()
  var DAY_MS = 24 * 60 * 60 * 1000
  var inactive = 0
  var safeMargin = 0
  var list = []

  members.forEach(function(m) {
    var daysAgo = null
    var status = 'ativo'

    if (m.lastActivityTime) {
      var diffMs = now - m.lastActivityTime
      daysAgo = diffMs / DAY_MS
      if (daysAgo > 3) {
        status = 'inativo'
        inactive++
      } else if (daysAgo > 1) {
        status = 'margem'
        safeMargin++
      }
    }

    list.push({
      name: m.name,
      playerId: m.playerId,
      daysAgo: daysAgo,
      status: status
    })
  })

  // Ordenar: inativos primeiro, depois margem, depois ativos; dentro de cada grupo por daysAgo desc
  list.sort(function(a, b) {
    var order = { inativo: 0, margem: 1, ativo: 2 }
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    return (b.daysAgo || 0) - (a.daysAgo || 0)
  })

  return { inactive: inactive, safeMargin: safeMargin, list: list }
}

// Formata daysAgo em string legível
function formatDaysAgo(daysAgo) {
  if (daysAgo === null) return '?'
  var days = Math.floor(daysAgo)
  var hours = Math.floor((daysAgo - days) * 24)
  if (days > 0) return days + 'd ' + hours + 'h'
  return hours + 'h'
}

// Abre/fecha o painel de settings
function toggleSettingsPanel() {
  var panel = document.getElementById('settingsPanel')
  if (!panel) return
  var isOpen = panel.style.display !== 'none'
  panel.style.display = isOpen ? 'none' : 'block'

  if (!isOpen) renderSettingsPanel()
}

// Calcula o crescimento médio diário de GP por jogador com base no histórico de eventos.
// Retorna { growthPerPlayer, eventsUsed, note } ou null se histórico insuficiente.
function computeHistoryGrowth() {
  if (typeof getROTEHistory !== 'function') return null
  var history = getROTEHistory()
  // Usar apenas eventos fechados (F6 preenchida) com guildGP e startTime
  var closed = history.filter(function(e) { return e.closedAt && e.guildGP && e.startTime })
  if (closed.length < 2) return null

  // Ordenar do mais antigo ao mais recente
  closed.sort(function(a, b) { return new Date(a.startTime) - new Date(b.startTime) })

  var oldest = closed[0]
  var newest = closed[closed.length - 1]
  var daysDiff = (new Date(newest.startTime) - new Date(oldest.startTime)) / (1000 * 60 * 60 * 24)
  if (daysDiff < 7) return null  // menos de 1 semana: não confiável

  var gpDiff = newest.guildGP - oldest.guildGP
  if (gpDiff <= 0) return null

  // Usar o nº de jogadores do evento mais recente como referência
  var players = newest.players || 1
  var growthPerPlayer = Math.round(gpDiff / daysDiff / players)

  return {
    growthPerPlayer: growthPerPlayer,
    eventsUsed: closed.length,
    daysCovered: Math.round(daysDiff),
    note: closed.length + ' evento(s), ' + Math.round(daysDiff) + ' dias'
  }
}

// Renderiza o conteúdo do painel
function renderSettingsPanel() {
  var content = document.getElementById('settingsPanelContent')
  if (!content) return

  var lastSync = rosterEngine.lastSyncDate()
  var lastSyncText = lastSync
    ? 'Última sync: ' + lastSync.toLocaleDateString('pt-BR') + ' ' + lastSync.toLocaleTimeString('pt-BR')
    : 'Roster não sincronizado'

  var rosterData = rosterEngine.load()
  var memberCount = rosterData ? Object.keys(rosterData).length : 0

  // Crescimento diário: auto se histórico disponível, senão padrão 5500
  var histGrowth = computeHistoryGrowth()
  var currentGrowth = document.getElementById('dailyGrowth') ? Number(document.getElementById('dailyGrowth').value) : 5500
  var growthNote = histGrowth
    ? '<div style="font-size:10px;color:#4ade80;margin-top:2px;">📈 Calculado do histórico (' + histGrowth.note + ')</div>'
    : '<div style="font-size:10px;color:#94a3b8;margin-top:2px;">Histórico insuficiente — usando padrão manual</div>'

  // Margem de segurança: valor atual
  var currentSafe = document.getElementById('safe') ? document.getElementById('safe').value : 3

  // Nº de jogadores na margem identificados automaticamente
  var actStatus = settingsState.activityStatus
  var identMargin = actStatus ? actStatus.safeMargin : 0

  content.innerHTML =
    // ── Allycode + info de sync ────────────────────────────────────────
    '<div style="margin-bottom:12px;">' +
      '<label style="font-size:12px;color:#94a3b8;display:block;margin-bottom:4px;">Allycode (qualquer membro da guilda)</label>' +
      '<input id="settingsAllycode" type="text" value="' + settingsState.allycode + '"' +
        ' placeholder="Ex: 447623167"' +
        ' onchange="settingsState.allycode=this.value.replace(/\\D/g,\'\');localStorage.setItem(\'rote_allycode\',settingsState.allycode)"' +
        ' style="width:100%;box-sizing:border-box;">' +
      '<div style="font-size:11px;color:#94a3b8;margin-top:6px;">' +
        lastSyncText + (memberCount ? ' (' + memberCount + ' jogadores)' : '') +
      '</div>' +
    '</div>' +

    // ── Configurações ──────────────────────────────────────────────────
    '<div style="margin-top:12px;border-top:1px solid #334155;padding-top:10px;">' +

      // Margem de segurança com explicação
      '<label style="font-size:12px;color:#94a3b8;display:block;margin-bottom:2px;">' +
        'Margem de segurança' +
        '<span style="font-size:10px;color:#475569;font-weight:normal;"> (jogadores incertos além dos identificados)</span>' +
      '</label>' +
      '<div style="font-size:10px;color:#64748b;margin-bottom:4px;line-height:1.4;">' +
        'A sincronização identifica automaticamente os jogadores inativos e na margem.<br>' +
        'Este campo adiciona uma margem genérica extra para jogadores não identificados.<br>' +
        '<span style="color:#f59e0b;">GP mín = GP máx − GP(inativos) − GP(margem auto: ' + identMargin + ') − GP médio × este valor</span>' +
      '</div>' +
      '<input id="settingsSafe" type="number" value="' + currentSafe + '"' +
        ' style="width:100%;box-sizing:border-box;margin-bottom:12px;">' +

      // Crescimento diário
      '<label style="font-size:12px;color:#94a3b8;display:block;margin-bottom:2px;">Crescimento diário/jogador</label>' +
      growthNote +
      '<input id="settingsDailyGrowth" type="number" value="' + (histGrowth ? histGrowth.growthPerPlayer : currentGrowth) + '"' +
        ' style="width:100%;box-sizing:border-box;margin-top:4px;margin-bottom:12px;">' +

      '<button onclick="saveSettings()"' +
        ' style="width:100%;padding:6px;background:#334155;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">' +
        '💾 Salvar configurações' +
      '</button>' +
    '</div>' +

    renderActivityList()
}

// Alterna status de um jogador manualmente (ativo → margem → inativo → ativo)
function togglePlayerStatus(playerId) {
  var actStatus = settingsState.activityStatus
  if (!actStatus) return

  var player = actStatus.list.find(function(p) { return p.playerId === playerId })
  if (!player) return

  var cycle = { ativo: 'margem', margem: 'inativo', inativo: 'ativo' }
  player.status = cycle[player.status] || 'ativo'

  // Recalcular contadores
  actStatus.inactive = actStatus.list.filter(function(p) { return p.status === 'inativo' }).length
  actStatus.safeMargin = actStatus.list.filter(function(p) { return p.status === 'margem' }).length

  // Salvar e atualizar
  _saveAndApplyActivity(actStatus)
}

// Salva activity map no rosterEngine e atualiza campos + platoons
function _saveAndApplyActivity(actStatus) {
  var activityMap = {}
  actStatus.list.forEach(function(p) { activityMap[p.playerId] = p.status })
  rosterEngine.saveActivity(activityMap)

  // Atualizar contadores nos campos principais
  var inactiveField = document.getElementById('inactive')
  var safeField = document.getElementById('safe')
  if (inactiveField) {
    inactiveField.value = actStatus.inactive
    inactiveField.dispatchEvent(new Event('input'))
  }
  if (safeField) {
    safeField.value = actStatus.safeMargin
    safeField.dispatchEvent(new Event('input'))
  }
  if (typeof calculate === 'function') calculate()
  if (typeof drawPlatoonList === 'function') drawPlatoonList()
  if (typeof drawFarmCritical === 'function') drawFarmCritical()

  // Re-renderizar apenas a lista de atividade
  var listContainer = document.getElementById('activityListContainer')
  if (listContainer) listContainer.innerHTML = _buildActivityRows(actStatus)
  var badges = document.getElementById('activityBadges')
  if (badges) badges.innerHTML = _buildActivityBadges(actStatus)
}

function _buildActivityBadges(status) {
  var badgeStyle = 'display:inline-block;padding:2px 6px;border-radius:3px;font-size:11px;font-weight:bold;margin-right:6px;'
  return '<span style="' + badgeStyle + 'background:#7f1d1d;color:#ef4444;">' + status.inactive + ' inativos</span>' +
         '<span style="' + badgeStyle + 'background:#78350f;color:#f59e0b;">' + status.safeMargin + ' margem</span>'
}

function _buildActivityRows(status) {
  var colorMap = { inativo: '#ef4444', margem: '#f59e0b', ativo: '#22c55e' }
  var labelMap = { inativo: 'INATIVO', margem: 'MARGEM', ativo: 'ATIVO' }

  // Mostrar apenas inativos e margem; ativos ficam ocultos
  var visible = status.list.filter(function(p) { return p.status !== 'ativo' })

  if (visible.length === 0) {
    return '<div style="font-size:11px;color:#4ade80;padding:4px 0;">✅ Todos os jogadores ativos</div>'
  }

  return visible.map(function(p) {
    var color = colorMap[p.status]
    var label = labelMap[p.status]
    var ago = p.daysAgo !== null ? formatDaysAgo(p.daysAgo) : '?'
    var pid = p.playerId ? p.playerId.replace(/'/g, "\\'") : ''
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid #1e293b;">' +
      '<span style="font-size:11px;color:#cbd5e1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;">' + p.name + '</span>' +
      '<span style="font-size:10px;color:#64748b;margin:0 4px;">' + ago + '</span>' +
      '<button onclick="togglePlayerStatus(\'' + pid + '\')" title="Clique para alternar status"' +
        ' style="font-size:10px;color:' + color + ';font-weight:bold;min-width:52px;text-align:right;background:none;border:none;cursor:pointer;padding:0;">' +
        label + ' ▾</button>' +
    '</div>'
  }).join('')
}

// Renderiza lista de atividade dos jogadores
function renderActivityList() {
  var status = settingsState.activityStatus
  if (!status || !status.list.length) return ''

  return '<div style="margin-top:12px;border-top:1px solid #334155;padding-top:10px;">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
      '<span style="font-size:12px;color:#94a3b8;">Atividade dos jogadores</span>' +
      '<span id="activityBadges">' + _buildActivityBadges(status) + '</span>' +
    '</div>' +
    '<div id="activityListContainer" style="max-height:200px;overflow-y:auto;">' + _buildActivityRows(status) + '</div>' +
    '<div style="font-size:10px;color:#475569;margin-top:4px;">Auto: &gt;3d=inativo, 1–3d=margem &nbsp;|&nbsp; Clique no status para alterar</div>' +
  '</div>'
}

// Verifica se o roster está desatualizado (>24h) e dispara sync automático
function checkAutoSync() {
  var allycode = settingsState.allycode
  if (!allycode) return

  var lastSync = (typeof rosterEngine !== 'undefined') ? rosterEngine.lastSyncDate() : null
  if (!lastSync) return  // nunca sincronizou — aguarda ação manual

  var hoursAgo = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60)
  if (hoursAgo >= 24) syncGuild()
}

// Sincroniza guilda e roster
function syncGuild() {
  if (settingsState.syncing) return

  // Allycode: prioriza input no painel (se aberto), senão usa o salvo
  var allycodeInput = document.getElementById('settingsAllycode')
  var allycode = allycodeInput
    ? allycodeInput.value.replace(/\D/g, '')
    : settingsState.allycode

  if (!allycode) {
    // Abrir settings para o usuário digitar o allycode
    var panel = document.getElementById('settingsPanel')
    if (panel) { panel.style.display = 'block'; renderSettingsPanel() }
    alert('Configure o allycode no painel ⚙ Settings antes de sincronizar.')
    return
  }

  // Persistir allycode
  settingsState.allycode = allycode
  localStorage.setItem('rote_allycode', allycode)

  settingsState.syncing = true
  var btn = document.getElementById('btnSyncGuild')
  if (btn) btn.disabled = true

  var progress = document.getElementById('syncProgress')
  if (progress) progress.style.display = 'block'

  setSyncProgress('Buscando dados da guilda...', 0)

  // Passo 1: buscar guilda
  guildEngine.fetchFromAllycode(allycode, function(err, guildData) {
    if (err) {
      setSyncProgress('Erro: ' + err, 0)
      settingsState.syncing = false
      if (btn) btn.disabled = false
      return
    }

    settingsState.guildData = guildData

    // Salvar GP real por jogador
    var gpMap = {}
    guildData.members.forEach(function(m) { gpMap[m.playerId] = m.gp || 0 })
    rosterEngine.saveGuildGP(gpMap)

    // Calcular inativos/margem a partir do lastActivityTime
    var actStatus = computeActivityStatus(guildData.members)
    settingsState.activityStatus = actStatus

    // Salvar mapa de atividade persistente
    _saveAndApplyActivity(actStatus)

    setSyncProgress('Guilda: ' + guildData.guildName + ' — ' + actStatus.inactive + ' inativos, ' + actStatus.safeMargin + ' na margem', 5)

    // Atualizar campos do header automaticamente
    syncHeaderFields(guildData)

    // Passo 2: coletar roster de cada membro
    setTimeout(function() {
      rosterEngine.fetchAll(
        guildData.members,

        // onProgress
        function(current, total, playerName) {
          var pct = Math.round(5 + (current / total) * 90)
          setSyncProgress('Coletando: ' + playerName + ' (' + current + '/' + total + ')', pct)
        },

        // onDone
        function(err, rosterMap) {
          settingsState.syncing = false
          if (btn) btn.disabled = false

          if (err) {
            setSyncProgress('❌ Erro: ' + err, 100)
            setTimeout(function() {
              var progress = document.getElementById('syncProgress')
              if (progress) progress.style.display = 'none'
            }, 3000)
            return
          }

          // Calcular batalhas elegíveis por planeta para todos os jogadores ativos
          if (typeof combatEngine !== 'undefined') {
            combatEngine.computeAndStore(rosterMap)
          }

          setSyncProgress('✅ Sincronizado! ' + Object.keys(rosterMap).length + ' jogadores', 100)
          setTimeout(function() {
            var progress = document.getElementById('syncProgress')
            if (progress) progress.style.display = 'none'
            // Atualizar painel se estiver aberto
            var panel = document.getElementById('settingsPanel')
            if (panel && panel.style.display !== 'none') renderSettingsPanel()
            // Atualizar coluna de platoons com dados reais
            if (typeof drawPlatoonList === 'function') drawPlatoonList()
            if (typeof drawFarmCritical === 'function') drawFarmCritical()
          }, 1500)
        }
      )
    }, 500)
  })
}

// Atualiza os campos do header com dados da guilda
function syncHeaderFields(guildData) {
  var gpField = document.getElementById('guildGP')
  if (gpField) {
    gpField.value = guildData.totalGP
    gpField.dispatchEvent(new Event('input'))
  }

  var playersField = document.getElementById('players')
  if (playersField) {
    playersField.value = guildData.playerCount
    playersField.dispatchEvent(new Event('input'))
  }

  if (typeof calculate === 'function') calculate()
}

// Atualiza barra de progresso
function setSyncProgress(text, pct) {
  var el = document.getElementById('syncProgressText')
  if (el) el.textContent = text
  var bar = document.getElementById('syncProgressBar')
  if (bar) bar.style.width = pct + '%'
}

// Salva configurações manuais
function saveSettings() {
  var safe  = document.getElementById('settingsSafe')
  var daily = document.getElementById('settingsDailyGrowth')

  if (safe && document.getElementById('safe')) {
    document.getElementById('safe').value = safe.value
    document.getElementById('safe').dispatchEvent(new Event('input'))
  }
  if (daily && document.getElementById('dailyGrowth')) {
    document.getElementById('dailyGrowth').value = daily.value
    document.getElementById('dailyGrowth').dispatchEvent(new Event('input'))
  }

  if (typeof calculate === 'function') calculate()

  toggleSettingsPanel()
}
