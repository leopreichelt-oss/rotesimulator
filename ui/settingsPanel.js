/**
 * settingsPanel.js
 * Painel de configurações do simulador.
 * Permite configurar allycode, sincronizar guilda e roster.
 */

// Estado do painel
var settingsState = {
  allycode: localStorage.getItem('rote_allycode') || '',
  guildData: null,
  syncing: false
}

// Abre/fecha o painel de settings
function toggleSettingsPanel() {
  var panel = document.getElementById('settingsPanel')
  if (!panel) return
  var isOpen = panel.style.display !== 'none'
  panel.style.display = isOpen ? 'none' : 'block'

  if (!isOpen) renderSettingsPanel()
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

  content.innerHTML =
    '<div style="margin-bottom:12px;">' +
      '<label style="font-size:12px;color:#94a3b8;display:block;margin-bottom:4px;">Allycode (qualquer membro da guilda)</label>' +
      '<input id="settingsAllycode" type="text" value="' + settingsState.allycode + '"' +
        ' placeholder="Ex: 447623167"' +
        ' style="width:100%;box-sizing:border-box;margin-bottom:8px;">' +
      '<button onclick="syncGuild()" id="btnSyncGuild"' +
        ' style="width:100%;padding:6px;background:#1d4ed8;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">' +
        '🔄 Sincronizar Guilda e Roster' +
      '</button>' +
    '</div>' +

    '<div id="syncProgress" style="display:none;margin-bottom:10px;">' +
      '<div style="font-size:11px;color:#94a3b8;" id="syncProgressText">Iniciando...</div>' +
      '<div style="background:#334155;border-radius:4px;height:6px;margin-top:4px;">' +
        '<div id="syncProgressBar" style="background:#4da6ff;height:6px;border-radius:4px;width:0%;transition:width 0.3s;"></div>' +
      '</div>' +
    '</div>' +

    '<div style="font-size:11px;color:#94a3b8;border-top:1px solid #334155;padding-top:8px;">' +
      lastSyncText + (memberCount ? ' (' + memberCount + ' jogadores)' : '') +
    '</div>' +

    '<div style="margin-top:12px;border-top:1px solid #334155;padding-top:10px;">' +
      '<label style="font-size:12px;color:#94a3b8;display:block;margin-bottom:4px;">Margem de segurança</label>' +
      '<input id="settingsSafe" type="number" value="' + (document.getElementById('safe') ? document.getElementById('safe').value : 3) + '"' +
        ' style="width:100%;box-sizing:border-box;margin-bottom:8px;">' +
      '<label style="font-size:12px;color:#94a3b8;display:block;margin-bottom:4px;">Inativos</label>' +
      '<input id="settingsInactive" type="number" value="' + (document.getElementById('inactive') ? document.getElementById('inactive').value : 0) + '"' +
        ' style="width:100%;box-sizing:border-box;margin-bottom:8px;">' +
      '<label style="font-size:12px;color:#94a3b8;display:block;margin-bottom:4px;">Crescimento diário/jogador</label>' +
      '<input id="settingsDailyGrowth" type="number" value="' + (document.getElementById('dailyGrowth') ? document.getElementById('dailyGrowth').value : 5500) + '"' +
        ' style="width:100%;box-sizing:border-box;margin-bottom:8px;">' +
      '<button onclick="saveSettings()"' +
        ' style="width:100%;padding:6px;background:#334155;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">' +
        '💾 Salvar configurações' +
      '</button>' +
    '</div>'
}

// Sincroniza guilda e roster
function syncGuild() {
  if (settingsState.syncing) return

  var allycodeInput = document.getElementById('settingsAllycode')
  var allycode = allycodeInput ? allycodeInput.value.replace(/\D/g, '') : ''

  if (!allycode) {
    alert('Digite um allycode válido')
    return
  }

  // Salvar allycode
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
    setSyncProgress('Guilda: ' + guildData.guildName + ' (' + guildData.playerCount + ' jogadores)', 5)

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
            setSyncProgress('Erro na coleta: ' + err, 100)
            return
          }

          setSyncProgress('✅ Sincronizado! ' + Object.keys(rosterMap).length + ' jogadores', 100)
          setTimeout(function() {
            renderSettingsPanel()
            // Atualizar coluna de platoons com dados reais
            if (typeof drawPlatoonList === 'function') drawPlatoonList()
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
  var safe = document.getElementById('settingsSafe')
  var inactive = document.getElementById('settingsInactive')
  var daily = document.getElementById('settingsDailyGrowth')

  if (safe && document.getElementById('safe')) {
    document.getElementById('safe').value = safe.value
    document.getElementById('safe').dispatchEvent(new Event('input'))
  }
  if (inactive && document.getElementById('inactive')) {
    document.getElementById('inactive').value = inactive.value
    document.getElementById('inactive').dispatchEvent(new Event('input'))
  }
  if (daily && document.getElementById('dailyGrowth')) {
    document.getElementById('dailyGrowth').value = daily.value
    document.getElementById('dailyGrowth').dispatchEvent(new Event('input'))
  }

  if (typeof calculate === 'function') calculate()

  toggleSettingsPanel()
}
