/**
 * drawGACPanel.js
 * Painel GAC — mapa de defesa, colunas defesa/ataque, sync individual e settings.
 */

// ── Layout por liga/modo ──────────────────────────────────────────────────────
// territories: [T1-sup-esq, T2-sup-dir, T3-inf-esq, T4-inf-dir]
var GAC_LAYOUT = {
  '5v5': {
    'CARBONITE': { squads: 3,  fleets: 1, territories: [1, 1, 1, 1] },
    'BRONZIUM':  { squads: 5,  fleets: 1, territories: [1, 2, 1, 2] },
    'CHROMIUM':  { squads: 7,  fleets: 2, territories: [2, 3, 2, 2] },
    'AURODIUM':  { squads: 9,  fleets: 2, territories: [2, 3, 3, 3] },
    'KYBER':     { squads: 11, fleets: 3, territories: [3, 4, 3, 4] },
  },
  '3v3': {
    'CARBONITE': { squads: 3,  fleets: 1, territories: [1, 1, 1, 1] },
    'BRONZIUM':  { squads: 7,  fleets: 1, territories: [1, 2, 3, 2] },
    'CHROMIUM':  { squads: 10, fleets: 2, territories: [2, 3, 4, 3] },
    'AURODIUM':  { squads: 13, fleets: 2, territories: [2, 4, 5, 4] },
    'KYBER':     { squads: 15, fleets: 3, territories: [3, 5, 5, 5] },
  }
}

var GAC_LEAGUE_LABELS = {
  'CARBONITE': 'Carbonite', 'BRONZIUM': 'Bronzium',
  'CHROMIUM':  'Chromium',  'AURODIUM': 'Aurodium', 'KYBER': 'Kyber'
}
var GAC_LEAGUE_ORDER = ['CARBONITE', 'BRONZIUM', 'CHROMIUM', 'AURODIUM', 'KYBER']

var _gacMode           = '5v5'
var _gacLeague         = 'KYBER'
var _gacSettingsOpen   = false

// ── Entrada / saída ───────────────────────────────────────────────────────────
function showGACPanel() {
  var el = document.getElementById('gacPage')
  if (!el) return
  _gacMode   = localStorage.getItem('gac_mode')   || '5v5'
  _gacLeague = localStorage.getItem('gac_league')  || 'KYBER'
  el.style.display = 'flex'
  _gacSettingsOpen = false
  var sp = document.getElementById('gacSettingsPanel')
  if (sp) sp.style.display = 'none'
  _renderGACPanel()
}

function hideGACPanel() {
  var el = document.getElementById('gacPage')
  if (el) el.style.display = 'none'
}

// ── Controles ─────────────────────────────────────────────────────────────────
function gacSetMode(mode) {
  _gacMode = mode
  localStorage.setItem('gac_mode', mode)
  _renderGACPanel()
}

function toggleGACSettings() {
  var sp = document.getElementById('gacSettingsPanel')
  if (!sp) return
  _gacSettingsOpen = !_gacSettingsOpen
  sp.style.display = _gacSettingsOpen ? 'block' : 'none'
  if (_gacSettingsOpen) _renderGACSettingsPanel()
}

function gacSaveOpponent() {
  var input = document.getElementById('gacOpponentAllycodeInput')
  if (!input) return
  var code = input.value.replace(/\D/g, '')
  localStorage.setItem('gac_opponent_allycode', code)
  if (code.length >= 9) syncGACOpponent()
}

// ── Sync do adversário ────────────────────────────────────────────────────────
function syncGACOpponent() {
  var code = localStorage.getItem('gac_opponent_allycode') || ''
  if (code.length < 9) return
  var btn = document.getElementById('gacOppSyncBtn')
  if (btn) { btn.disabled = true; btn.textContent = '⏳' }
  fetch(COMLINK_URL + '/player', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: { allyCode: code } })
  })
  .then(function(r) { return r.json() })
  .then(function(d) {
    var rarityMap = {'ONE_STAR':1,'TWO_STAR':2,'THREE_STAR':3,'FOUR_STAR':4,'FIVE_STAR':5,'SIX_STAR':6,'SEVEN_STAR':7}
    var units = (d.rosterUnit || []).map(function(u) {
      var defId  = u.definitionId || ''
      var baseId = defId.split(':')[0]
      var rarity = rarityMap[defId.split(':')[1]] || u.currentRarity || 0
      return {
        base_id:    baseId,
        relic_tier: u.relic ? (u.relic.currentTier || 0) : 0,
        rarity:     rarity,
      }
    })
    var opponent = { name: d.name || code, units: units }
    localStorage.setItem('gac_opponent_data', JSON.stringify(opponent))
    if (btn) { btn.disabled = false; btn.textContent = '🔄' }
    _renderGACSquadColumns(_gacGetPlayer())
  })
  .catch(function() {
    if (btn) { btn.disabled = false; btn.textContent = '🔄' }
  })
}

function _gacGetOpponent() {
  try { return JSON.parse(localStorage.getItem('gac_opponent_data') || 'null') } catch(e) { return null }
}

// ── Sync individual do jogador ────────────────────────────────────────────────
function syncGACPlayer() {
  var allycode = localStorage.getItem('rote_allycode') || ''
  if (!allycode) {
    toggleGACSettings()
    return
  }

  var btn = document.getElementById('gacSyncBtn')
  if (btn) { btn.disabled = true; btn.textContent = '⏳' }

  fetch(COMLINK_URL + '/player', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: { allyCode: allycode.replace(/\D/g, '') } })
  })
  .then(function(r) { return r.json() })
  .then(function(d) {
    var rarityMap = {
      'ONE_STAR':1,'TWO_STAR':2,'THREE_STAR':3,
      'FOUR_STAR':4,'FIVE_STAR':5,'SIX_STAR':6,'SEVEN_STAR':7
    }
    var units = (d.rosterUnit || []).map(function(u) {
      var defId  = u.definitionId || ''
      var baseId = defId.split(':')[0]
      var rarityStr = defId.split(':')[1] || ''
      return {
        base_id:     baseId,
        relic_tier:  u.relic ? (u.relic.currentTier || 0) : 0,
        rarity:      rarityMap[rarityStr] || u.currentRarity || 0,
        combat_type: rosterEngine.isShip(baseId) ? 2 : 1,
        level:       u.currentLevel || 0,
        gp:          u.currentGalacticPower || 0,
      }
    })
    var pr  = d.playerRating || {}
    var prs = (pr.playerRankStatus) || {}
    var playerData = {
      playerId: d.playerId,
      name:     d.name || allycode,
      units:    units,
      gac: {
        skillRating: (pr.playerSkillRating || {}).skillRating || 0,
        leagueId:    prs.leagueId   || 'CARBONITE',
        divisionId:  prs.divisionId || 5
      }
    }

    // Persistir playerId e actualizar rosterMap
    localStorage.setItem('gac_my_player_id', playerData.playerId)
    try {
      var key = rosterEngine._key(rosterEngine.STORAGE_KEY)
      var raw = localStorage.getItem(key)
      var map = raw ? JSON.parse(raw) : {}
      map[playerData.playerId] = playerData
      localStorage.setItem(key, JSON.stringify(map))
    } catch(e) {}

    if (btn) { btn.disabled = false; btn.textContent = '🔄' }
    _renderGACPanel()
  })
  .catch(function(e) {
    if (btn) { btn.disabled = false; btn.textContent = '🔄' }
    console.error('GAC sync error:', e)
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _gacGetPlayer() {
  if (typeof rosterEngine === 'undefined') return null
  var map = rosterEngine.load()
  if (!map) return null
  // Lookup via playerId persistido (preenchido pelo sync ROTE ou sync individual GAC)
  var savedId = localStorage.getItem('gac_my_player_id')
  if (savedId && map[savedId]) return map[savedId]
  // Fallback: mapa com só 1 entrada (sync individual sem guild completo)
  var ids = Object.keys(map)
  if (ids.length === 1) return map[ids[0]]
  return null
}

// divisionId global da API → número da divisão dentro da liga (1=melhor, 5=pior)
// Ex: Kyber D1=2 … D5=6 | Aurodium D1=7 … D5=11 | … | Carbonite D1=22 … D5=26
function _gacDivisionNumber(divisionId) {
  if (!divisionId || divisionId < 2) return 0
  return ((divisionId - 2) % 5) + 1  // 10 → ((8)%5)+1 = 4
}

function _gacDivisionLabel(divisionId) {
  var n = _gacDivisionNumber(divisionId)
  return n >= 1 ? ['I','II','III','IV','V'][n - 1] : ''
}

function _gacUnitRelic(unit) {
  if (!unit) return 0
  var tier = unit.relic_tier || 0
  return tier >= 3 ? tier - 2 : 0
}

function _gacEsc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// Força absoluta do squad: relic médio dos membros + bônus de otimização
// Usado para ordenar squads nos territórios (mais forte → territórios da frente)
function _gacSquadStrength(sq, player) {
  if (!player || !player.units) return 0
  if (sq.isFleet) {
    var cap = player.units.find(function(u) { return u.base_id === (sq.journeyUnit || sq.leader) })
    return cap ? (cap.rarity || 0) : 0
  }
  var totalRelic = 0
  sq.members.forEach(function(uid) {
    var unit = player.units.find(function(u) { return u.base_id === uid })
    totalRelic += _gacUnitRelic(unit)
  })
  var avgRelic = totalRelic / (sq.members.length || 1)
  var readiness = _gacSquadReadiness(sq, player)
  return avgRelic * 10 + readiness  // avgRelic domina; readiness desempata
}

function _gacSquadReadiness(sq, player) {
  if (!player || !player.units) return 0
  if (sq.isFleet) {
    var cap = player.units.find(function(u) { return u.base_id === (sq.journeyUnit || sq.leader) })
    return cap ? (cap.rarity || 0) / 7 : 0
  }
  var score = 0
  var minR   = sq.minRelic   != null ? sq.minRelic   : 5
  var idealR = sq.idealRelic != null ? sq.idealRelic : 7
  sq.members.forEach(function(uid) {
    var unit = player.units.find(function(u) { return u.base_id === uid })
    var r = _gacUnitRelic(unit)
    if (r >= idealR) score += 1
    else if (r >= minR) score += 0.5
  })
  return score / sq.members.length
}

// Verifica se TODOS os membros estão no mínimo em minRelic (squad "completo")
// Para frotas: verifica se a nave capital está no roster com estrelas suficientes
function _gacSquadComplete(sq, player) {
  if (!player || !player.units) return false
  if (sq.isFleet) {
    var capId = sq.journeyUnit || sq.leader
    var cap = player.units.find(function(u) { return u.base_id === capId })
    return cap && (cap.rarity || 0) >= (sq.minJourneyStars || 4)
  }
  var min = sq.minRelic != null ? sq.minRelic : 5
  var minSupport = sq.minRelicSupport != null ? sq.minRelicSupport : min
  return sq.members.every(function(uid) {
    var unit = player.units.find(function(u) { return u.base_id === uid })
    if (!unit) return false
    var threshold = (uid === sq.leader) ? min : minSupport
    return _gacUnitRelic(unit) >= threshold
  })
}

// Retorna true se deve pular esta variação (existe uma versão mais forte disponível)
function _gacShouldSkip(sq, player) {
  if (!sq.skipIfPlayerHas || !player || !player.units) return false
  var min = sq.minRelic || 5
  return sq.skipIfPlayerHas.some(function(uid) {
    var unit = player.units.find(function(u) { return u.base_id === uid })
    return unit && _gacUnitRelic(unit) >= min
  })
}

// ── Render principal ──────────────────────────────────────────────────────────
function _renderGACPanel() {
  var player = _gacGetPlayer()

  // Auto-detectar liga do jogador
  if (player && player.gac && player.gac.leagueId) {
    var detected = player.gac.leagueId.toUpperCase()
    if (GAC_LAYOUT['5v5'][detected]) {
      _gacLeague = detected
      localStorage.setItem('gac_league', _gacLeague)
      // Salvar playerId para lookups futuros
      localStorage.setItem('gac_my_player_id', player.playerId)
    }
  }

  var layout = (GAC_LAYOUT[_gacMode] || GAC_LAYOUT['5v5'])[_gacLeague] || GAC_LAYOUT['5v5']['KYBER']

  _renderGACTopBar(player)
  _renderGACSquadColumns(player, layout)
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function _renderGACTopBar(player) {
  var nameEl = document.getElementById('gacPlayerNameDisplay')
  if (nameEl) nameEl.textContent = player ? player.name : '(sem jogador)'

  var leagueEl = document.getElementById('gacLeagueDisplay')
  if (leagueEl) {
    var divLabel = (player && player.gac && player.gac.divisionId)
      ? _gacDivisionLabel(player.gac.divisionId) : ''
    leagueEl.textContent = (GAC_LEAGUE_LABELS[_gacLeague] || _gacLeague) + (divLabel ? ' ' + divLabel : '')
  }

  // Botões de modo
  ;['5v5','3v3'].forEach(function(m) {
    var btn = document.getElementById('gacModeBtn_' + m)
    if (!btn) return
    var active = _gacMode === m
    btn.style.background  = active ? '#1d4ed8' : 'transparent'
    btn.style.color       = active ? '#fff'    : '#64748b'
    btn.style.borderColor = active ? '#3b82f6' : '#334155'
    btn.style.fontWeight  = active ? 'bold'    : 'normal'
  })

  // Ally code adversário
  var oppInput = document.getElementById('gacOpponentAllycodeInput')
  if (oppInput && !oppInput.value) {
    oppInput.value = localStorage.getItem('gac_opponent_allycode') || ''
  }
}

// ── Painel de Settings GAC ────────────────────────────────────────────────────
function _renderGACSettingsPanel() {
  var el = document.getElementById('gacSettingsPanelContent')
  if (!el) return

  var savedAllycode = localStorage.getItem('rote_allycode') || ''

  var html = ''
  html += '<label style="display:block;font-size:11px;color:#94a3b8;margin-bottom:4px;">Ally Code</label>'
  html += '<div style="display:flex;gap:6px;margin-bottom:12px;">'
  html +=   '<input id="gacSettingsAllycodeInput" type="text" maxlength="12" placeholder="123456789"'
  html +=     ' value="' + _gacEsc(savedAllycode) + '"'
  html +=     ' style="flex:1;padding:5px 8px;background:#0f172a;border:1px solid #334155;border-radius:4px;color:#e2e8f0;font-size:12px;"/>'
  html +=   '<button onclick="gacSaveAllycode()"'
  html +=     ' style="padding:5px 10px;background:#1d4ed8;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;">Salvar</button>'
  html += '</div>'

  // Informações do jogador (se disponível)
  var player = _gacGetPlayer()
  if (player) {
    var league = (player.gac && GAC_LEAGUE_LABELS[player.gac.leagueId]) || '—'
    var div    = (player.gac && player.gac.divisionId) || '—'
    var sr     = (player.gac && player.gac.skillRating) || 0
    html += '<div style="background:#0f172a;border-radius:6px;padding:8px;font-size:11px;color:#94a3b8;">'
    html +=   '<div><span style="color:#64748b;">Liga: </span><span style="color:#fcd34d;">' + league + (div !== '—' ? ' D' + div : '') + '</span></div>'
    if (sr) html += '<div><span style="color:#64748b;">Skill Rating: </span><span style="color:#4da6ff;">' + sr + '</span></div>'
    html += '</div>'
  } else if (savedAllycode) {
    html += '<div style="font-size:11px;color:#f59e0b;">Clique 🔄 para carregar os dados do jogador.</div>'
  } else {
    html += '<div style="font-size:11px;color:#94a3b8;">Configure o Ally Code e clique 🔄 para sincronizar.</div>'
  }

  el.innerHTML = html
}

function gacSaveAllycode() {
  var input = document.getElementById('gacSettingsAllycodeInput')
  if (!input) return
  var code = input.value.replace(/\D/g, '')
  if (!code) return
  localStorage.setItem('rote_allycode', code)
  // Actualizar settingsState do ROTE se disponível
  if (typeof settingsState !== 'undefined') settingsState.allycode = code
  _renderGACPanel()
  _renderGACSettingsPanel()
}

// ── Análise estratégica de frota ─────────────────────────────────────────────

function _avgMinRelic(squads, player) {
  if (!squads || !squads.length) return 0
  var sum = squads.reduce(function(acc, sq) {
    return acc + (_gacSquadMinRelicRaw(sq, player) || 0)
  }, 0)
  return sum / squads.length
}

// Versão sem dependência circular (não usa _gacSquadMinRelic que ainda não foi definido)
function _gacSquadMinRelicRaw(sq, player) {
  if (!player || !player.units) return 0
  var min = Infinity
  sq.members.forEach(function(uid) {
    var unit = player.units.find(function(u) { return u.base_id === uid })
    min = Math.min(min, _gacUnitRelic(unit))
  })
  return isFinite(min) ? min : 0
}

// Retorna squads de ataque possíveis de um jogador (mesma lógica do forEach principal)
function _gacAtkSquads(player, leagueIdx) {
  if (!player || typeof SQUAD_META === 'undefined') return []
  return SQUAD_META.filter(function(sq) {
    if (!sq.events || !sq.events.gac || sq.isFleet) return false
    if (GAC_LEAGUE_ORDER.indexOf(sq.leagueMin) > leagueIdx) return false
    if (_gacShouldSkip(sq, player)) return false
    if (!_gacSquadComplete(sq, player)) return false
    return sq.bestFor === 'attack' || sq.bestFor === 'both'
  })
}

function _avgPilotRelic(fleet, player) {
  if (!fleet.keyPilots || !fleet.keyPilots.length || !player || !player.units) return 0
  var total = 0
  fleet.keyPilots.forEach(function(uid) {
    var u = player.units.find(function(x) { return x.base_id === uid })
    total += _gacUnitRelic(u)
  })
  return total / fleet.keyPilots.length
}

function _renderFleetStrategy(layout, myT2, oppT2, myFleet, oppFleet, player, opponent) {
  var el = document.getElementById('gacStrategyInner')
  if (!el) return
  if (!opponent || !myFleet.length) { el.innerHTML = ''; return }

  var leagueIdx = GAC_LEAGUE_ORDER.indexOf(_gacLeague)
  var t2slots   = layout.territories[1] || 3

  // ── T2 pass heuristics ────────────────────────────────────────────────────
  var oppAtk        = _gacAtkSquads(opponent, leagueIdx)
  var myT2Avg       = _avgMinRelic(myT2, player)
  var oppAtkAvg     = _avgMinRelic(oppAtk.slice(0, t2slots), opponent)
  var oppLikelyPass = myT2Avg === 0 || oppAtkAvg >= myT2Avg * 0.85
  var myAtk         = _gacAtkSquads(player, leagueIdx)
  var oppT2Avg      = _avgMinRelic(oppT2, opponent)
  var myAtkAvg      = _avgMinRelic(myAtk.slice(0, t2slots), player)
  var iLikelyPass   = oppT2Avg === 0 || myAtkAvg >= oppT2Avg * 0.85

  // ── Best defense fleet ────────────────────────────────────────────────────
  // frota minha que o adversário tem pior win% para counter
  var bestDefFleet = null, worstOppWin = Infinity
  myFleet.forEach(function(f) {
    var maxWin = 0
    if (f.counteredBy) {
      f.counteredBy.forEach(function(c) {
        if (oppFleet.some(function(of) { return of.id === c.fleet }))
          maxWin = Math.max(maxWin, c.win)
      })
    }
    if (maxWin < worstOppWin) { worstOppWin = maxWin; bestDefFleet = f }
  })

  // ── Best attack fleet vs most likely opp defense ──────────────────────────
  var bestAtkFleet = null, bestAtkWin = 0
  var oppDefFleet  = oppFleet[0]
  if (oppDefFleet && oppDefFleet.counteredBy) {
    oppDefFleet.counteredBy.forEach(function(c) {
      var mf = myFleet.find(function(f) { return f.id === c.fleet })
      if (mf && c.win > bestAtkWin) { bestAtkWin = c.win; bestAtkFleet = mf }
    })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  var dot  = function(ok) { return ok ? '🟢' : '🔴' }
  var clr  = function(v) {
    if (v == null) return '#475569'
    if (v >= 95)   return '#4ade80'
    if (v >= 85)   return '#fbbf24'
    if (v >= 70)   return '#f97316'
    return '#f87171'
  }
  var bar  = function(val, max) {
    var pct = max ? Math.min(100, Math.round(val / max * 100)) : 0
    return '<div style="height:4px;background:#1e293b;border-radius:2px;margin-top:2px;">' +
      '<div style="height:4px;background:#a78bfa;border-radius:2px;width:' + pct + '%;"></div></div>'
  }
  var shortName = function(fleet) {
    return fleet.name.replace(/Frota\s+/i, '').replace(/\s*\(.*\)/, '')
  }

  var html = '<div style="margin-top:8px;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:12px;">'
  html += '<div style="font-size:9px;color:#475569;font-weight:bold;letter-spacing:0.8px;margin-bottom:12px;">🧠 ANÁLISE ESTRATÉGICA DE FROTA</div>'

  // ── Seção 1: Poder dos Pilotos ────────────────────────────────────────────
  var maxRelic = 10
  html += '<div style="margin-bottom:12px;">'
  html += '<div style="font-size:9px;color:#64748b;font-weight:bold;letter-spacing:0.6px;margin-bottom:6px;">⚡ PODER DOS PILOTOS</div>'
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'

  // Minhas frotas
  html += '<div>'
  html += '<div style="font-size:8px;color:#4da6ff;margin-bottom:4px;">MINHAS FROTAS</div>'
  myFleet.forEach(function(f) {
    var avg = _avgPilotRelic(f, player)
    var capU = player && player.units && player.units.find(function(u) { return u.base_id === (f.journeyUnit || f.leader) })
    var stars = capU ? (capU.rarity || 0) : 0
    html += '<div style="margin-bottom:5px;">'
    html += '<div style="display:flex;justify-content:space-between;align-items:center;">'
    html += '<span style="font-size:9px;color:#e2e8f0;">' + _gacEsc(shortName(f)) + '</span>'
    html += '<span style="font-size:9px;color:#94a3b8;">' + stars + '★'
    if (avg > 0) html += ' · R' + avg.toFixed(1)
    html += '</span>'
    html += '</div>'
    if (avg > 0) html += bar(avg, maxRelic)
    html += '</div>'
  })
  html += '</div>'

  // Frotas do adversário
  html += '<div>'
  html += '<div style="font-size:8px;color:#f87171;margin-bottom:4px;">FROTAS DO ADVERSÁRIO</div>'
  oppFleet.forEach(function(f) {
    var avg = _avgPilotRelic(f, opponent)
    var capU = opponent && opponent.units && opponent.units.find(function(u) { return u.base_id === (f.journeyUnit || f.leader) })
    var stars = capU ? (capU.rarity || 0) : 0
    html += '<div style="margin-bottom:5px;">'
    html += '<div style="display:flex;justify-content:space-between;align-items:center;">'
    html += '<span style="font-size:9px;color:#e2e8f0;">' + _gacEsc(shortName(f)) + '</span>'
    html += '<span style="font-size:9px;color:#94a3b8;">' + stars + '★'
    if (avg > 0) html += ' · R' + avg.toFixed(1)
    html += '</span>'
    html += '</div>'
    if (avg > 0) html += bar(avg, maxRelic)
    html += '</div>'
  })
  html += '</div>'
  html += '</div></div>'

  // ── Seção 2: Matriz de matchups ───────────────────────────────────────────
  if (myFleet.length && oppFleet.length) {
    html += '<div style="margin-bottom:12px;overflow-x:auto;">'
    html += '<div style="font-size:9px;color:#64748b;font-weight:bold;letter-spacing:0.6px;margin-bottom:6px;">🎯 MATCHUP (minha frota × defesa deles)</div>'
    html += '<table style="width:100%;border-collapse:collapse;font-size:9px;">'

    // Header row
    html += '<tr><th style="padding:3px 4px;text-align:left;color:#475569;font-weight:normal;border-bottom:1px solid #1e293b;">Minha frota</th>'
    oppFleet.forEach(function(of) {
      html += '<th style="padding:3px 4px;text-align:center;color:#f87171;font-weight:normal;border-bottom:1px solid #1e293b;white-space:nowrap;">' + _gacEsc(shortName(of)) + '</th>'
    })
    html += '</tr>'

    myFleet.forEach(function(mf) {
      html += '<tr>'
      html += '<td style="padding:3px 4px;color:#4da6ff;border-bottom:1px solid #0f172a;white-space:nowrap;">' + _gacEsc(shortName(mf)) + '</td>'
      oppFleet.forEach(function(of) {
        var winVal = null
        if (of.counteredBy) {
          var match = of.counteredBy.find(function(c) { return c.fleet === mf.id })
          if (match) winVal = match.win
        }
        var bg = winVal != null ? clr(winVal) : '#475569'
        var txt = winVal != null ? winVal + '%' : '—'
        html += '<td style="padding:3px 4px;text-align:center;color:' + bg + ';border-bottom:1px solid #0f172a;font-weight:bold;">' + txt + '</td>'
      })
      html += '</tr>'
    })
    html += '</table></div>'
  }

  // ── Seção 3: Recomendações ────────────────────────────────────────────────
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'

  html += '<div style="background:#0a101e;border:1px solid #1e293b;border-radius:8px;padding:10px;">'
  html += '<div style="font-size:11px;font-weight:bold;color:#cbd5e1;margin-bottom:6px;">🛡️ Defesa</div>'
  html += '<div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">Adversário passa T2?</div>'
  html += '<div style="font-size:12px;color:#e2e8f0;margin-bottom:6px;">' + dot(oppLikelyPass) + ' ' +
    (oppLikelyPass ? 'Provável' : 'Improvável') +
    ' <span style="font-size:10px;color:#64748b;">(atk ' + oppAtkAvg.toFixed(1) + ' / def ' + myT2Avg.toFixed(1) + ')</span></div>'
  if (bestDefFleet) {
    html += '<div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">Usar na defesa:</div>'
    html += '<div style="font-size:11px;color:#a78bfa;font-weight:bold;">' + _gacEsc(bestDefFleet.name) + '</div>'
    html += '<div style="font-size:10px;color:#94a3b8;margin-top:3px;">' +
      (worstOppWin === 0 ? '✅ Sem counter deles' :
       worstOppWin === Infinity ? '✅ Sem frota meta deles' :
       'Melhor counter deles: <span style="color:' + clr(worstOppWin) + ';">' + worstOppWin + '%</span>') +
      '</div>'
  }
  html += '</div>'

  html += '<div style="background:#0a101e;border:1px solid #1e293b;border-radius:8px;padding:10px;">'
  html += '<div style="font-size:11px;font-weight:bold;color:#cbd5e1;margin-bottom:6px;">⚔️ Ataque</div>'
  html += '<div style="font-size:10px;color:#94a3b8;margin-bottom:3px;">Passo o T2 deles?</div>'
  html += '<div style="font-size:12px;color:#e2e8f0;margin-bottom:6px;">' + dot(iLikelyPass) + ' ' +
    (iLikelyPass ? 'Provável' : 'Improvável') +
    ' <span style="font-size:10px;color:#64748b;">(atk ' + myAtkAvg.toFixed(1) + ' / def ' + oppT2Avg.toFixed(1) + ')</span></div>'
  if (oppDefFleet) {
    html += '<div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">Frota deles (defesa):</div>'
    html += '<div style="font-size:11px;color:#f87171;margin-bottom:6px;">' + _gacEsc(oppDefFleet.name) + '</div>'
  }
  if (bestAtkFleet) {
    html += '<div style="font-size:10px;color:#94a3b8;margin-bottom:2px;">Melhor counter:</div>'
    html += '<div style="font-size:11px;color:#a78bfa;font-weight:bold;">' + _gacEsc(bestAtkFleet.name) + '</div>'
    html += '<div style="font-size:10px;color:' + clr(bestAtkWin) + ';margin-top:3px;">Win: ' + bestAtkWin + '%</div>'
  } else {
    html += '<div style="font-size:10px;color:#64748b;">Sem counter disponível</div>'
  }
  html += '</div>'

  html += '</div></div>'
  el.innerHTML = html
}

// ── Mapa central ──────────────────────────────────────────────────────────────
// Retorna o menor relic entre os membros do squad (bottleneck)
function _gacSquadMinRelic(sq, player) {
  if (!player || !player.units) return null
  var min = Infinity
  sq.members.forEach(function(uid) {
    var unit = player.units.find(function(u) { return u.base_id === uid })
    min = Math.min(min, _gacUnitRelic(unit))
  })
  return isFinite(min) ? min : null
}

// side: 'blue'|'red'  isFleet: bool
// assignedSquads: array de squad objects para mostrar dentro do campo
// player: dados do jogador para calcular relic mínimo
function _gacShowSquadPopup(sqId, playerKey) {
  var sq = (typeof SQUAD_META !== 'undefined') && SQUAD_META.find(function(s) { return s.id === sqId })
  if (!sq) return
  var player = playerKey === 'opp' ? _gacGetOpponent() : _gacGetPlayer()
  var myPlayer = _gacGetPlayer()

  var existing = document.getElementById('gacSquadPopup')
  if (existing) existing.remove()

  var alignColor = { LS: '#4da6ff', DS: '#f87171', MS: '#a78bfa', fleet: '#a78bfa' }
  var ac = alignColor[sq.alignment] || '#94a3b8'

  // Membros com relic (frotas mostram ★ em vez de relic)
  var membersHtml = sq.members.map(function(uid) {
    var name = typeof getUnitName === 'function' ? getUnitName(uid) : uid
    var unit = player && player.units && player.units.find(function(u) { return u.base_id === uid })
    var r = unit ? _gacUnitRelic(unit) : null
    var starUnit = sq.isFleet && unit ? (unit.rarity || null) : null
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1e293b;">' +
      '<span style="font-size:12px;color:#cbd5e1;">' + _gacEsc(name) + '</span>' +
      (starUnit !== null
        ? '<span style="font-size:12px;color:#fbbf24;">' + starUnit + '★</span>'
        : r !== null
          ? '<span style="font-size:12px;font-weight:bold;color:' + _relicColor(r) + ';">R' + r + '</span>'
          : '<span style="font-size:11px;color:#475569;">—</span>') +
      '</div>'
  }).join('')

  // Counters / risco defensivo
  var countersHtml = ''
  var _cWinColor = function(w) { return w >= 90 ? '#4ade80' : w >= 75 ? '#fbbf24' : '#f87171' }
  var isMyDefense = (playerKey !== 'opp')

  if (sq.isFleet && sq.counteredBy && sq.counteredBy.length) {
    countersHtml += '<div style="margin-top:12px;border-top:1px solid #334155;padding-top:10px;">'
    if (isMyDefense) {
      // Vista de defesa própria: mostrar risco médio ponderado
      var totalW = 0, totalSeen = 0
      sq.counteredBy.forEach(function(c) { totalW += c.win; totalSeen++ })
      var avgWin = totalSeen ? Math.round(totalW / totalSeen) : 0
      countersHtml += '<div style="font-size:10px;color:#64748b;font-weight:bold;margin-bottom:6px;letter-spacing:0.5px;">🛡️ RISCO DEFENSIVO</div>'
      countersHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
      countersHtml += '<span style="font-size:20px;font-weight:bold;color:' + _cWinColor(avgWin) + ';">' + avgWin + '%</span>'
      countersHtml += '<span style="font-size:10px;color:#64748b;">chance média do adversário<br>passar esta frota (' + totalSeen + ' counters)</span>'
      countersHtml += '</div>'
    } else {
      countersHtml += '<div style="font-size:10px;color:#64748b;font-weight:bold;margin-bottom:6px;letter-spacing:0.5px;">🎯 COMO ATACAR ESTA FROTA</div>'
      sq.counteredBy.forEach(function(c) {
        var cSq = SQUAD_META.find(function(s) { return s.id === c.fleet })
        var cName = cSq ? cSq.name : c.fleet
        var hasFleet = myPlayer && cSq && myPlayer.units && myPlayer.units.find(function(u) {
          return u.base_id === cSq.leader && (u.rarity || 0) >= 4
        })
        countersHtml += '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;">'
        countersHtml += '<span style="font-size:11px;color:' + (hasFleet ? '#e2e8f0' : '#475569') + ';">'
        countersHtml += (hasFleet ? '✓ ' : '') + _gacEsc(cName) + '</span>'
        countersHtml += '<span style="font-size:11px;font-weight:bold;color:' + _cWinColor(c.win) + ';">' + c.win + '%</span>'
        countersHtml += '</div>'
      })
    }
    countersHtml += '</div>'
  } else if (!sq.isFleet && typeof GAC_COUNTERS !== 'undefined') {
    var cEntry = GAC_COUNTERS[sq.leader]
    if (cEntry && cEntry.counters && cEntry.counters.length) {
      countersHtml += '<div style="margin-top:12px;border-top:1px solid #334155;padding-top:10px;">'
      if (isMyDefense) {
        // Vista de defesa própria: mostrar risco médio ponderado por batalhas vistas
        var dedupedDef = _gacDedupeCounters(cEntry.counters)
        var totalSeenBattles = 0, weightedWin = 0
        dedupedDef.forEach(function(c) {
          var s = c.seen || 1
          weightedWin += c.win * s
          totalSeenBattles += s
        })
        var avgWinPct = totalSeenBattles ? Math.round(weightedWin / totalSeenBattles) : 0
        var riskColor = avgWinPct >= 80 ? '#f87171' : avgWinPct >= 60 ? '#fbbf24' : '#4ade80'
        countersHtml += '<div style="font-size:10px;color:#64748b;font-weight:bold;margin-bottom:8px;letter-spacing:0.5px;">🛡️ RISCO DEFENSIVO · S76 5v5</div>'
        countersHtml += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">'
        countersHtml += '<span style="font-size:28px;font-weight:bold;color:' + riskColor + ';">' + avgWinPct + '%</span>'
        countersHtml += '<div style="font-size:10px;color:#94a3b8;line-height:1.4;">'
        countersHtml += 'chance média do adversário<br>derrotar este esquadrão<br>'
        countersHtml += '<span style="color:#475569;">(' + dedupedDef.length + ' counters · ' + totalSeenBattles.toLocaleString() + ' batalhas)</span>'
        countersHtml += '</div></div>'
        // Top 3 counters mais perigosos (maior win%)
        var top3 = dedupedDef.slice(0, 3)
        if (top3.length) {
          countersHtml += '<div style="font-size:10px;color:#64748b;margin-bottom:4px;">Principais ameaças:</div>'
          top3.forEach(function(c) {
            var leadName = getUnitName(c.atk.lead)
            countersHtml += '<div style="display:flex;justify-content:space-between;padding:2px 0;">'
            countersHtml += '<span style="font-size:11px;color:#94a3b8;">' + _gacEsc(leadName) + '</span>'
            countersHtml += '<span style="font-size:11px;font-weight:bold;color:' + _cWinColor(c.win) + ';">' + c.win + '%</span>'
            countersHtml += '</div>'
          })
        }
        countersHtml += '<div style="margin-top:8px;text-align:right;">'
        countersHtml += '<span onclick="gacShowCounterSearch(\'' + _gacEsc(sq.leader) + '\')" '
        countersHtml += 'style="font-size:9px;color:#4da6ff;cursor:pointer;text-decoration:underline;">Ver todos os counters</span>'
        countersHtml += '</div>'
      } else {
        countersHtml += '<div style="font-size:10px;color:#64748b;font-weight:bold;margin-bottom:4px;letter-spacing:0.5px;">🎯 COMO ATACAR · S76 5v5</div>'
        _gacDedupeCounters(cEntry.counters).slice(0, 7).forEach(function(c) {
          var leadName = getUnitName(c.atk.lead)
          var allIds = [c.atk.lead].concat(c.atk.members)
          var hasAll = myPlayer && myPlayer.units && allIds.every(function(uid) {
            return myPlayer.units.find(function(u) { return u.base_id === uid })
          })
          countersHtml += '<div style="padding:5px 0;border-bottom:1px solid #0f172a;">'
          countersHtml += '<div style="display:flex;justify-content:space-between;align-items:center;">'
          countersHtml += '<span style="font-size:11px;color:' + (hasAll ? '#e2e8f0' : '#64748b') + ';font-weight:' + (hasAll ? 'bold' : 'normal') + ';">'
          countersHtml += (hasAll ? '✓ ' : '') + _gacEsc(leadName) + '</span>'
          countersHtml += '<div style="display:flex;align-items:center;gap:5px;">'
          countersHtml += '<span style="font-size:11px;font-weight:bold;color:' + _cWinColor(c.win) + ';">' + c.win + '%</span>'
          countersHtml += '<span style="font-size:9px;color:#334155;">' + c.seen + '×</span>'
          countersHtml += '</div></div>'
          countersHtml += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:2px;">'
          c.atk.members.forEach(function(uid) {
            var mName = getUnitName(uid)
            var hasU = myPlayer && myPlayer.units && myPlayer.units.find(function(u) { return u.base_id === uid })
            countersHtml += '<span style="font-size:9px;color:' + (hasU ? '#94a3b8' : '#334155') + ';">' + _gacEsc(mName) + '</span>'
          })
          countersHtml += '</div>'
          countersHtml += '</div>'
        })
        countersHtml += '<div style="margin-top:6px;text-align:right;">'
        countersHtml += '<span onclick="gacShowCounterSearch(\'' + _gacEsc(sq.leader) + '\')" '
        countersHtml += 'style="font-size:9px;color:#4da6ff;cursor:pointer;text-decoration:underline;">Ver todos</span>'
        countersHtml += '</div>'
      }
      countersHtml += '</div>'
    }
  }

  var subtitle = sq.isFleet
    ? 'Nave Capital · S76 5v5'
    : sq.alignment + ' · min R' + sq.minRelic

  var popup = document.createElement('div')
  popup.id = 'gacSquadPopup'
  popup.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);'
  popup.innerHTML =
    '<div style="background:#1e293b;border:1px solid #475569;border-radius:10px;padding:16px 20px;min-width:280px;max-width:360px;max-height:85vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.7);">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">' +
        '<div>' +
          '<div style="font-size:14px;font-weight:bold;color:#e2e8f0;">' + _gacEsc(sq.name) + '</div>' +
          '<div style="font-size:10px;color:' + ac + ';margin-top:2px;">' + subtitle + '</div>' +
        '</div>' +
        '<button onclick="document.getElementById(\'gacSquadPopup\').remove()" style="background:none;border:none;color:#64748b;font-size:18px;cursor:pointer;padding:0 0 0 12px;line-height:1;">×</button>' +
      '</div>' +
      membersHtml +
      countersHtml +
    '</div>'
  popup.addEventListener('click', function(e) { if (e.target === popup) popup.remove() })
  document.body.appendChild(popup)
}

// Nome compacto para o mapa (território box) — nomes completos ficam nos popups
function _gacShortName(name) {
  if (!name) return ''
  return name
    // Abreviações de nomes longos conhecidos
    .replace('Líder Supremo Kylo Ren', 'SLKR')
    .replace('Imperador Sith Eterno', 'SEE')
    .replace('Cavaleiro Jedi Revan', 'JK Revan')
    .replace('Mestre Jedi Kenobi', 'JMK')
    .replace('Mestre Jedi Mace Windu', 'JM Mace Windu')
    .replace('Comandante Luke Skywalker', 'CLS')
    .replace('General Skywalker', 'GAS')
    .replace('Imperador Palpatine', 'Imp. Palpatine')
    .replace('Almirante Trench', 'Alm. Trench')
    .replace('Almirante Raddus', 'Alm. Raddus')
    .replace('Grande Moff Tarkin', 'G.M. Tarkin')
    .replace('Capitão Enoch', 'Cap. Enoch')
    .replace('GL Ahsoka Tano', 'GL Ahsoka')
    .replace('GL Luke', 'JML')
    .replace('GL Leia Organa', 'GL Leia')
    .replace('GL Rey + Ben + Cal Kestis', 'GL Rey + Cal')
    .replace('GL Rey + Cal + Barriss', 'GL Rey+Cal+Barriss')
    .replace('GL Rey + Ben + Ezra', 'GL Rey + Ezra')
    .replace('GL Rey + Ezra + Barriss', 'GL Rey+Ezra+Barriss')
    .replace("Bo-Katan (Mand'alor) GL", 'GL Bo-Katan')
    .replace('Hera Syndulla (Tripulação do Ghost)', 'Hera (Ghost)')
    .replace('Bad Batch Fugitivos (Season 3)', 'BB Fugitivos S3')
    .replace('Omega Fugitiva (Bad Batch S3)', 'Omega Fug. S3')
    .replace('Senhor Vader + 501st', 'Lord Vader + 501st')
    .replace('Senhor Vader', 'Lord Vader')
    .replace('GL Rey + Ben Solo + Ezra + Barriss', 'GL Rey + Squad')
    .replace('Cal Kestis Cavaleiro Jedi', 'Cal Kestis')
    .replace('+ Caçadores de Recompensa', '+ BH')
    .replace('+ Caçadores (Renegados)', '(BH)')
    .replace('+ Caçadores (BH)', '(BH)')
    .replace('+ Clones 501st', '+ 501st')
    .replace(' (Clones 501st)', '')
    .replace(' (Darth Revan)', '')
    .replace(' (Chefe dos Tuskens)', '')
    // Remove parênteses redundantes
    .replace(/ \(Grande Inquisidor\)/, '')
    .replace(/ \(Brood Alpha\)/, '')
    .replace(/ \(Conde Dooku\)/, '')
    .replace(/ \(Separatistas\)/, '')
    .replace(/ \(A Acólita\)/, '')
    .replace(/ \(Galactic Empire\)/, '')
    .replace(/ \(Caçadores de Recompensa\)/, ' (BH)')
    .replace(/ \(Caçadores\)/, ' (BH)')
    .replace(/ \(Renegados\)/, ' (BH)')
    .replace(/ \(Primeira Ordem\)/, ' (PO)')
    .replace(/ \(Naboo\)/, '')
    .replace(/ \(Rebeldes OT\)/, '')
    .replace(/ \(Rebeldes\)/, '')
    .replace(/ \(República\)/, '')
    .replace(/ \(Império Sith Antigo\)/, '')
    .replace(/ \(Império clássico\)/, '')
    .replace(/ \(Império\)/, '')
    .replace(/ \(Conselho Jedi\)/, '')
    .replace(/ \(Facínoras\)/, '')
    .replace(/ \(Piratas\)/, '')
    .replace(/ \(KOTOR LS\)/, '')
    .replace(/ \(KOTOR\)/, '')
    .replace(/ \(Droides\)/, '')
    .replace(/ \(Jawas\)/, '')
    .replace(/ \(Ewoks\)/, '')
    .replace(/ \(top meta\)/, '')
    .replace(/ \(Sith\)/, '')
    .replace(/ \(Inquisidores \+ Jedi\)/, '')
    .replace(/ \(Inquisidores\)/, '')
    .replace(/ \(Night Troopers\)/, '')
    .replace(/ \(GAC Ataque\)/, ' (Atk)')
    .replace(/ \(sem Ezra\)/, '')
    .replace(/ \(Sith Triumvirate\)/, '')
    .replace(/ \(Sith Solo Counter\)/, '')
    .replace(/ \(Coletivo das Sombras\)/, '')
    .replace(/ \(Resistência\)/, ' (Res.)')
    .replace(/ \(GL Pirata\)/, '')
    .replace(/ \(Thrawn\)/, '')
    .replace(/ \(Ackbar\)/, '')
    .replace(/ \(Krennic\)/, '')
    .replace(/ \(Hux\)/, '')
    .replace(/ \(Grievous\)/, '')
    .replace(/ \(Mace Windu\)/, '')
    .replace(/ \(Boss Nass\)/, '')
    .replace(/ \(Bo-Katan\)/, '')
    .replace(/ \(Grandes Mães\)/, '')
    .replace(/ \(Mãe Talzin\)/, '')
    .replace(/ \(Dark Trooper\)/, '')
    .replace(/ \(Mand'alor\) GL/, ' GL')
    .replace(/ \(Treinamento Jedi\)/, ' (JT)')
    .trim()
}

function _gacTerritoryBox(label, slots, side, isFleet, assignedSquads, player, playerKey) {
  var isBlue = side === 'blue'
  var borderColor, bgColor, labelColor, dotBorder
  if (isFleet) {
    borderColor = '#6d28d9'; bgColor = 'rgba(109,40,217,0.18)'; labelColor = '#a78bfa'; dotBorder = '#7c3aed'
  } else {
    borderColor = isBlue ? '#1d4ed8' : '#b91c1c'
    bgColor     = isBlue ? 'rgba(29,78,216,0.13)' : 'rgba(185,28,28,0.13)'
    labelColor  = isBlue ? '#60a5fa' : '#f87171'
    dotBorder   = isBlue ? '#1d4ed8' : '#b91c1c'
  }

  var pk = playerKey || 'me'

  var html = '<div style="background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:8px;padding:6px 8px;">'
  html += '<div style="font-size:9px;color:' + labelColor + ';font-weight:bold;margin-bottom:4px;letter-spacing:0.5px;">'
  html += label + ' · ' + slots + '</div>'

  var assigned = assignedSquads || []
  if (assigned.length > 0) {
    for (var i = 0; i < slots; i++) {
      html += '<div style="border-top:1px solid ' + (i === 0 ? 'transparent' : borderColor) + ';padding:3px 0;">'
      if (i < assigned.length) {
        var sq = assigned[i]
        html += '<div style="display:flex;justify-content:space-between;align-items:center;gap:4px;cursor:pointer;border-radius:4px;padding:1px 3px;transition:background 0.15s;" '
        html += 'onmouseenter="this.style.background=\'rgba(255,255,255,0.06)\'" '
        html += 'onmouseleave="this.style.background=\'transparent\'" '
        html += 'onclick="_gacShowSquadPopup(\'' + sq.id + '\',\'' + pk + '\')">'
        html += '<span style="font-size:11px;color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;white-space:nowrap;">' + _gacEsc(_gacShortName(sq.name)) + '</span>'
        if (sq.isFleet) {
          var capUnit = player && player.units && player.units.find(function(u) { return u.base_id === (sq.journeyUnit || sq.leader) })
          var capStars = capUnit ? (capUnit.rarity || 0) : null
          if (capStars !== null) html += '<span style="font-size:11px;color:#fbbf24;white-space:nowrap;">' + capStars + '★</span>'
        } else {
          var minR = _gacSquadMinRelic(sq, player)
          if (minR !== null) html += '<span style="font-size:11px;font-weight:bold;color:' + _relicColor(minR) + ';white-space:nowrap;">R' + minR + '↑</span>'
        }
        html += '</div>'
      } else {
        html += '<div style="height:18px;border:1px dashed ' + dotBorder + ';border-radius:3px;opacity:0.2;"></div>'
      }
      html += '</div>'
    }
  } else {
    html += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:2px;">'
    for (var j = 0; j < slots; j++) {
      if (isFleet) {
        html += '<div style="width:22px;height:22px;border:1px dashed ' + dotBorder + ';border-radius:4px;background:#0f172a;display:flex;align-items:center;justify-content:center;font-size:12px;">🚀</div>'
      } else {
        html += '<div style="width:22px;height:22px;border:1px dashed ' + dotBorder + ';border-radius:50%;background:#0f172a;display:flex;align-items:center;justify-content:center;color:' + dotBorder + ';font-size:13px;opacity:0.5;">+</div>'
      }
    }
    html += '</div>'
  }

  html += '</div>'
  return html
}

// myGround/oppGround: arrays de squads de terra (defesa)
// myFleet/oppFleet: arrays de frotas (defesa)
function _renderGACMap(layout, myGround, myFleet, oppGround, oppFleet, player, opponent) {
  var el = document.getElementById('gacMapInner')
  if (!el) return

  var t = layout.territories  // [fleet_slots, T2, T3, T4]
  var f = layout.fleets
  var t2 = t[1]||0, t3 = t[2]||0, t4 = t[3]||0

  // Distribuir squads de terra nos territórios: T2 → T3 → T4
  function distribute(squads, s2, s3, s4) {
    var g = squads || []
    return {
      t2: g.slice(0, s2),
      t3: g.slice(s2, s2 + s3),
      t4: g.slice(s2 + s3, s2 + s3 + s4)
    }
  }
  var my  = distribute(myGround,  t2, t3, t4)
  var opp = distribute(oppGround, t2, t3, t4)
  var myF  = (myFleet  || []).slice(0, f)
  var oppF = (oppFleet || []).slice(0, f)

  var html = ''
  html += '<div style="background:linear-gradient(135deg,#0d1b3e 0%,#0f172a 50%,#1a0a0a 100%);'
  html += 'border:2px solid #374151;border-radius:16px;padding:12px;position:relative;width:100%;box-sizing:border-box;overflow:hidden;">'

  // linha divisória vertical (relativa ao container inteiro)
  html += '<div style="position:absolute;top:0;bottom:0;left:50%;width:1px;background:rgba(251,191,36,0.15);transform:translateX(-50%);z-index:0;pointer-events:none;"></div>'

  // grid principal: emblema ⚔ posicionado DENTRO do grid (top:50% relativo ao grid, não ao container+rodapé)
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;position:relative;z-index:1;">'

  // emblema centralizado no grid (position:absolute relativo ao grid)
  html += '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2;pointer-events:none;">'
  html += '<div style="width:26px;height:26px;border-radius:50%;background:#0f172a;border:1px solid rgba(251,191,36,0.35);display:flex;align-items:center;justify-content:center;font-size:12px;opacity:0.6;">⚔</div>'
  html += '</div>'

  // Azul (jogador) — min-width:0 evita overflow do texto no grid 1fr
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;min-width:0;">'
  html += _gacTerritoryBox('FROTA', f,  'blue', true,  myF,     player,   'me')
  html += _gacTerritoryBox('T2',    t2, 'blue', false, my.t2,   player,   'me')
  html += _gacTerritoryBox('T3',    t3, 'blue', false, my.t3,   player,   'me')
  html += _gacTerritoryBox('T4',    t4, 'blue', false, my.t4,   player,   'me')
  html += '</div>'

  // Vermelho (adversário) — espelhado: T4 fica adjacente ao T4 azul no centro
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;min-width:0;">'
  html += _gacTerritoryBox('T2',    t2, 'red', false, opp.t2, opponent, 'opp')
  html += _gacTerritoryBox('FROTA', f,  'red', true,  oppF,   opponent, 'opp')
  html += _gacTerritoryBox('T4',    t4, 'red', false, opp.t4, opponent, 'opp')
  html += _gacTerritoryBox('T3',    t3, 'red', false, opp.t3, opponent, 'opp')
  html += '</div>'

  html += '</div>'

  html += '<div style="text-align:center;font-size:9px;color:#475569;margin-top:7px;">'
  html += layout.squads + ' sq · ' + f + ' fr · ' + (layout.squads + f) + ' defesas'
  html += '</div>'
  html += '</div>'

  el.innerHTML = html
}

// ── Colunas de squads + mapa ──────────────────────────────────────────────────
function _renderGACSquadColumns(player, layout) {
  var atkEl = document.getElementById('gacDefList')  // coluna esq = ataque do jogador
  var oppEl = document.getElementById('gacAtkList')  // coluna dir = adversário
  if (!atkEl || !oppEl) return

  if (typeof SQUAD_META === 'undefined') {
    var msg = '<div style="color:#64748b;font-size:12px;padding:8px;">Dados indisponíveis.</div>'
    atkEl.innerHTML = msg; oppEl.innerHTML = msg
    return
  }

  var leagueIdx = GAC_LEAGUE_ORDER.indexOf(_gacLeague)
  var opponent  = _gacGetOpponent()

  var myDef = [], myAtk = [], myFleet = [], oppDef = [], oppAtk = [], oppFleet = []

  SQUAD_META.forEach(function(sq) {
    if (!sq.events || !sq.events.gac) return
    if (GAC_LEAGUE_ORDER.indexOf(sq.leagueMin) > leagueIdx) return

    // Jogador
    if (!_gacShouldSkip(sq, player) && (!player || _gacSquadComplete(sq, player))) {
      if (sq.isFleet) {
        if (sq.bestFor === 'defense' || sq.bestFor === 'both') myFleet.push(sq)
      } else {
        if (sq.bestFor === 'defense' || sq.bestFor === 'both') myDef.push(sq)
        if (sq.bestFor === 'attack'  || sq.bestFor === 'both') myAtk.push(sq)
      }
    }

    // Adversário — oppDef inclui TODOS os squads (para o mapa); oppAtk filtra por ataque
    if (opponent && !_gacShouldSkip(sq, opponent) && _gacSquadComplete(sq, opponent)) {
      if (sq.isFleet) {
        oppFleet.push(sq)
      } else {
        oppDef.push(sq)
        if (sq.bestFor === 'attack' || sq.bestFor === 'both') oppAtk.push(sq)
      }
    }
  })

  function byStrength(squads, p) {
    return squads.sort(function(a,b) { return _gacSquadStrength(b,p) - _gacSquadStrength(a,p) })
  }
  byStrength(myDef, player); byStrength(myAtk, player); byStrength(myFleet, player)
  if (opponent) { byStrength(oppDef, opponent); byStrength(oppAtk, opponent); byStrength(oppFleet, opponent) }

  // Deduplicar defesa por líder: mantém apenas o squad mais forte por GL/líder
  // (evita múltiplas variantes do mesmo GL ocupando slots no mapa)
  function dedupByLeader(squads) {
    var seen = {}
    return squads.filter(function(sq) {
      if (seen[sq.leader]) return false
      seen[sq.leader] = true
      return true
    })
  }
  myDef = dedupByLeader(myDef)
  if (opponent) oppDef = dedupByLeader(oppDef)

  // Distribuição defesa/ataque: squads 'both' vão para defesa primeiro (até capacidade),
  // o excedente vai para ataque. Squads 'attack' sempre ficam no ataque.
  var defCapacity = layout ? (layout.squads || 9) : 9
  var myDefPlacedIds = {}
  myDef.slice(0, defCapacity).forEach(function(sq) { myDefPlacedIds[sq.id] = true })
  var myAtkDisplay = myAtk.filter(function(sq) {
    if (sq.bestFor !== 'both') return true
    return !myDefPlacedIds[sq.id]
  })

  var oppDefCapacity = layout ? (layout.squads || 9) : 9
  var oppDefPlacedIds = {}
  if (opponent) {
    oppDef.slice(0, oppDefCapacity).forEach(function(sq) { oppDefPlacedIds[sq.id] = true })
  }
  var oppAtkDisplay = oppAtk.filter(function(sq) {
    if (sq.bestFor !== 'both') return true
    return !oppDefPlacedIds[sq.id]
  })

  // Renderizar mapa com squads dentro dos territórios
  if (layout) {
    var t2slots = layout.territories[1] || 3
    var t3slots = layout.territories[2] || 0
    var myT2  = myDef.slice(0, t2slots)
    var oppT2 = oppDef.slice(0, t2slots)
    _renderGACMap(layout, myDef, myFleet, oppDef, oppFleet, player, opponent)
    _renderFleetStrategy(layout, myT2, oppT2, myFleet, oppFleet, player, opponent)
  }

  // Coluna esquerda: ataque do jogador
  atkEl.innerHTML = _renderSquadCards(myAtkDisplay, player)

  // Coluna direita: squads possíveis do adversário
  var titleEl    = document.getElementById('gacAtkListTitle')
  var subtitleEl = document.getElementById('gacAtkListSubtitle')
  if (opponent) {
    if (titleEl)    titleEl.textContent = '⚔ Ataque do Adversário'
    if (subtitleEl) subtitleEl.textContent = (opponent.name || 'Adversário') + ' · squads de ataque'
    oppEl.innerHTML = _renderSquadCards(oppAtkDisplay, opponent)
  } else {
    if (titleEl)    titleEl.textContent = '👁 Adversário'
    if (subtitleEl) subtitleEl.textContent = 'Sincronize o ally code do adversário'
    oppEl.innerHTML = '<div style="color:#475569;font-size:11px;padding:12px 8px;text-align:center;">Insira o ally code do adversário e clique 🔄 para ver os squads possíveis.</div>'
  }
}

function _relicColor(r) {
  if (!r || r < 1) return '#475569'
  if (r >= 9)  return '#22d3ee'
  if (r >= 7)  return '#4ade80'
  if (r >= 5)  return '#fbbf24'
  return '#f87171'
}

function _renderSquadCards(squads, player) {
  if (!squads.length) return '<div style="color:#64748b;font-size:12px;padding:8px 0;">Nenhum squad.</div>'
  var alignColor = { LS: '#4da6ff', DS: '#f87171' }

  var html = ''
  squads.forEach(function(sq) {
    var ac = alignColor[sq.alignment] || '#a78bfa'
    html += '<div style="background:#1e293b;border:1px solid #2d3f55;border-radius:8px;padding:9px;margin-bottom:6px;">'

    // Título + alinhamento
    var hasActiveOmicron = sq.omicronUnits && sq.omicronUnits.some(function(uid) {
      var u = player && player.units && player.units.find(function(u) { return u.base_id === uid })
      return u && _gacUnitRelic(u) >= 1
    })
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px;margin-bottom:5px;">'
    html +=   '<div style="font-size:12px;font-weight:bold;color:#e2e8f0;line-height:1.3;">' + _gacEsc(_gacShortName(sq.name)) + '</div>'
    html +=   '<div style="display:flex;align-items:center;gap:4px;">'
    if (hasActiveOmicron) {
      html += '<span style="font-size:9px;color:#f59e0b;font-weight:bold;" title="Omicron GAC ativo">Ω</span>'
    }
    html +=     '<div style="font-size:9px;color:' + ac + ';white-space:nowrap;padding-top:2px;">' + sq.alignment + '</div>'
    html +=   '</div>'
    html += '</div>'

    // Membros com relic (frotas: estrelas)
    html += '<div style="display:flex;flex-direction:column;gap:2px;">'
    sq.members.forEach(function(uid) {
      var name = typeof getUnitName === 'function' ? getUnitName(uid) : uid
      var unit = player && player.units && player.units.find(function(u) { return u.base_id === uid })
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">'
      html +=   '<span style="font-size:9px;color:#94a3b8;">' + _gacEsc(name) + '</span>'
      if (sq.isFleet) {
        var stars = unit ? (unit.rarity || 0) : null
        html += stars !== null
          ? '<span style="font-size:9px;color:#fbbf24;">' + stars + '★</span>'
          : '<span style="font-size:9px;color:#334155;">—</span>'
      } else {
        var r = unit ? _gacUnitRelic(unit) : null
        html += r !== null
          ? '<span style="font-size:9px;font-weight:bold;color:' + _relicColor(r) + ';">R' + r + '</span>'
          : '<span style="font-size:9px;color:#334155;">—</span>'
      }
      html += '</div>'
    })
    html += '</div>'

    if (sq.journeyUnit) {
      html += '<div style="font-size:8px;color:#475569;margin-top:4px;">🗝 Requer jornada</div>'
    }
    html += '</div>'
  })
  return html
}

// Remove entradas com mesma composição de ataque (líder + membros) — duplicatas
// da base de dados que surgem por variações na composição defensiva
function _gacDedupeCounters(counters) {
  var seen = {}
  return counters.filter(function(c) {
    var key = c.atk.lead + '|' + c.atk.members.slice().sort().join(',')
    if (seen[key]) return false
    seen[key] = true
    return true
  })
}

// ── Counter Search ────────────────────────────────────────────────────────────
function gacShowCounterSearch(leaderId) {
  var existing = document.getElementById('gacCounterSearchModal')
  if (existing) existing.remove()

  var modal = document.createElement('div')
  modal.id = 'gacCounterSearchModal'
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);'
  modal.innerHTML =
    '<div style="background:#1e293b;border:1px solid #475569;border-radius:10px;padding:16px 20px;width:460px;max-width:95vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.7);">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
        '<div style="font-size:14px;font-weight:bold;color:#e2e8f0;">🎯 Counters GAC · S76 5v5</div>' +
        '<button onclick="document.getElementById(\'gacCounterSearchModal\').remove()" style="background:none;border:none;color:#64748b;font-size:18px;cursor:pointer;padding:0 0 0 12px;line-height:1;">×</button>' +
      '</div>' +
      '<input id="gacCounterSearchInput" type="text" placeholder="Buscar líder defensivo…" autocomplete="off"' +
        ' oninput="_gacRenderCounterResults(this.value)"' +
        ' style="padding:7px 10px;background:#0f172a;border:1px solid #334155;border-radius:6px;color:#e2e8f0;font-size:12px;margin-bottom:10px;outline:none;" />' +
      '<div id="gacCounterResults" style="overflow-y:auto;flex:1;"></div>' +
    '</div>'
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove() })
  document.body.appendChild(modal)

  var inp = document.getElementById('gacCounterSearchInput')
  if (leaderId && typeof GAC_COUNTERS !== 'undefined' && GAC_COUNTERS[leaderId]) {
    inp.value = GAC_COUNTERS[leaderId].leader
  }
  _gacRenderCounterResults(inp.value)
  inp.focus()
}

function _gacRenderCounterResults(query) {
  var el = document.getElementById('gacCounterResults')
  if (!el) return
  if (typeof GAC_COUNTERS === 'undefined') {
    el.innerHTML = '<div style="color:#64748b;font-size:12px;padding:8px;">Dados de counters não carregados.</div>'
    return
  }

  query = (query || '').trim().toLowerCase()
  var player = _gacGetPlayer()
  var winColor = function(w) { return w >= 90 ? '#4ade80' : w >= 75 ? '#fbbf24' : '#f87171' }
  var html = ''

  Object.keys(GAC_COUNTERS).forEach(function(charId) {
    var entry = GAC_COUNTERS[charId]
    var leaderDisplayName = entry.leader
    var leaderLocalName = getUnitName(charId)
    if (query && leaderDisplayName.toLowerCase().indexOf(query) < 0 &&
        leaderLocalName.toLowerCase().indexOf(query) < 0 &&
        charId.toLowerCase().indexOf(query) < 0) return

    html += '<div style="margin-bottom:14px;">'
    html += '<div style="font-size:12px;font-weight:bold;color:#f87171;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #334155;">'
    html += '🛡 ' + _gacEsc(leaderLocalName) + ' <span style="color:#475569;font-weight:normal;font-size:10px;">(' + _gacEsc(entry.leader) + ')</span>'
    html += '</div>'

    var dedupedCounters = _gacDedupeCounters(entry.counters).slice(0, 10)
    dedupedCounters.forEach(function(c) {
      var leadName = getUnitName(c.atk.lead)
      var allIds = [c.atk.lead].concat(c.atk.members)
      var hasAll = player && player.units && allIds.every(function(uid) {
        return player.units.find(function(u) { return u.base_id === uid })
      })
      html += '<div style="padding:5px 0 4px;border-bottom:1px solid #0f172a;">'
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">'
      html += '<span style="font-size:11px;color:' + (hasAll ? '#e2e8f0' : '#64748b') + ';font-weight:' + (hasAll ? 'bold' : 'normal') + ';">'
      html += (hasAll ? '✓ ' : '') + _gacEsc(leadName) + '</span>'
      html += '<div style="display:flex;align-items:center;gap:6px;">'
      html += '<span style="font-size:11px;font-weight:bold;color:' + winColor(c.win) + ';">' + c.win + '%</span>'
      html += '<span style="font-size:9px;color:#334155;">' + c.seen + '×</span>'
      html += '</div></div>'
      html += '<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:2px;">'
      c.atk.members.forEach(function(uid) {
        var mName = getUnitName(uid)
        var hasU = player && player.units && player.units.find(function(u) { return u.base_id === uid })
        html += '<span style="font-size:9px;color:' + (hasU ? '#94a3b8' : '#334155') + ';">' + _gacEsc(mName) + '</span>'
      })
      html += '</div>'
      html += '</div>'
    })
    html += '</div>'
  })

  el.innerHTML = html || '<div style="color:#64748b;font-size:12px;padding:8px;">Nenhum líder encontrado.</div>'
}
