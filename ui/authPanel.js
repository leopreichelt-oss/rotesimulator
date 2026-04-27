/**
 * authPanel.js
 * Autenticação EA via popup OAuth (PKCE).
 * O login acontece na página real da EA — no navegador do usuário.
 * O código OAuth retorna para o Worker via /auth/callback.
 */

function _workerUrl() {
  return (typeof COMLINK_URL !== 'undefined' && COMLINK_URL) ? COMLINK_URL : ''
}

function _eaTokenKey() {
  var ac = localStorage.getItem('rote_allycode') || ''
  return ac ? ('ea_token_' + ac) : 'ea_token'
}

function _saveEAToken(data) {
  try { localStorage.setItem(_eaTokenKey(), JSON.stringify(data)) } catch(e) {}
}

function _loadEAToken() {
  try { var d = localStorage.getItem(_eaTokenKey()); return d ? JSON.parse(d) : null } catch(e) { return null }
}

function _clearEAToken() {
  try { localStorage.removeItem(_eaTokenKey()) } catch(e) {}
}

// ── Renderiza a seção de autenticação EA ──────────────────────────────────────
function renderEAAuthSection() {
  var allycode = localStorage.getItem('rote_allycode') || ''
  if (!allycode) {
    return '<div style="font-size:11px;color:#f59e0b;padding:8px;background:#451a03;border-radius:4px;">Configure o Allycode primeiro para autenticar.</div>'
  }

  var token = _loadEAToken()
  if (token && token.expiresAt && token.expiresAt > Date.now()) {
    var exp    = new Date(token.expiresAt)
    var expStr = exp.toLocaleDateString('pt-BR') + ' ' + exp.toLocaleTimeString('pt-BR')
    return '<div style="background:#052e16;border:1px solid #16a34a;border-radius:6px;padding:10px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
        '<span style="color:#4ade80;font-size:12px;font-weight:bold;">✅ Autenticado via EA</span>' +
        '<button onclick="eaSignOut()" style="font-size:10px;padding:2px 8px;background:#450a0a;color:#fca5a5;border:1px solid #7f1d1d;border-radius:4px;cursor:pointer;">Sair</button>' +
      '</div>' +
      '<div style="font-size:10px;color:#4ade80;">Expira: ' + expStr + '</div>' +
    '</div>'
  }

  return '<div style="background:#0f172a;border:1px solid #334155;border-radius:6px;padding:10px;">' +
    '<div style="color:#e2e8f0;font-size:12px;font-weight:bold;margin-bottom:8px;">🔑 Autenticação EA</div>' +
    '<div style="font-size:11px;color:#94a3b8;margin-bottom:10px;line-height:1.5;">' +
      'Abre a página de login da EA no seu navegador.<br>Faça login normalmente — o token é salvo automaticamente.' +
    '</div>' +
    '<button onclick="eaOpenPopup()" id="eaPopupBtn"' +
      ' style="width:100%;padding:8px;background:#1e40af;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:bold;">' +
      '🔐 Entrar com conta EA' +
    '</button>' +
    '<div id="eaAuthMsg" style="font-size:10px;margin-top:6px;color:#f87171;min-height:14px;"></div>' +
    '<div style="font-size:9px;color:#475569;margin-top:6px;">Sua senha não é armazenada — apenas o token de acesso (~1 hora).</div>' +
  '</div>'
}

// ── Abre o popup OAuth da EA ──────────────────────────────────────────────────
function eaOpenPopup() {
  var allycode = localStorage.getItem('rote_allycode') || ''
  if (!allycode) { _setEaMsg('Configure o Allycode primeiro.'); return }

  var btn = document.getElementById('eaPopupBtn')
  if (btn) btn.textContent = '⏳ Iniciando...'
  _setEaMsg('')

  fetch(_workerUrl() + '/auth/popup-init', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ allycode: allycode }),
  })
  .then(function(r) { return r.json() })
  .then(function(data) {
    if (!data.authUrl) {
      if (btn) btn.textContent = '🔐 Entrar com conta EA'
      _setEaMsg('Erro ao iniciar autenticação.')
      return
    }

    // Abrir popup de login da EA
    var popup = window.open(data.authUrl, 'ea_login',
      'width=520,height=680,left=' + Math.round((screen.width-520)/2) +
      ',top=' + Math.round((screen.height-680)/2))

    if (!popup) {
      if (btn) btn.textContent = '🔐 Entrar com conta EA'
      _setEaMsg('Popup bloqueado. Permita popups para este site.')
      return
    }

    if (btn) btn.textContent = '⏳ Aguardando login...'

    // Escutar mensagem do popup quando autenticar
    function _onMessage(e) {
      if (!e.data || e.data.type !== 'ea_auth_success') return
      window.removeEventListener('message', _onMessage)
      _saveEAToken({ expiresAt: e.data.expiresAt, allycode: e.data.allycode })
      renderSettingsPanel()
    }
    window.addEventListener('message', _onMessage)

    // Fallback: detectar fechamento manual do popup
    var pollTimer = setInterval(function() {
      if (popup.closed) {
        clearInterval(pollTimer)
        window.removeEventListener('message', _onMessage)
        _checkAuthStatus(allycode)
      }
    }, 800)
  })
  .catch(function(e) {
    if (btn) btn.textContent = '🔐 Entrar com conta EA'
    _setEaMsg('Erro de conexão: ' + e.message)
  })
}

// Verifica status no Worker após popup fechar
function _checkAuthStatus(allycode) {
  fetch(_workerUrl() + '/auth/status?allycode=' + encodeURIComponent(allycode))
    .then(function(r) { return r.json() })
    .then(function(data) {
      if (data.authenticated) {
        _saveEAToken({ expiresAt: data.expiresAt, allycode: allycode })
      }
      renderSettingsPanel()
    })
    .catch(function() { renderSettingsPanel() })
}

// ── Sair ─────────────────────────────────────────────────────────────────────
function eaSignOut() {
  _clearEAToken()
  renderSettingsPanel()
}

// ── Verifica autenticação (chamado externamente) ───────────────────────────────
function isEAAuthenticated() {
  var token = _loadEAToken()
  return !!(token && token.expiresAt && token.expiresAt > Date.now())
}

function getEAToken() {
  var token = _loadEAToken()
  return (token && token.expiresAt > Date.now()) ? token.access_token : null
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function _setEaMsg(msg) {
  var el = document.getElementById('eaAuthMsg')
  if (el) el.textContent = msg
}
