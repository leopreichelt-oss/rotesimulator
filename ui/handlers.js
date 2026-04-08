function savePlanet(){

if(!state.selectedPlanet) return

let name = state.selectedPlanet

let phase = Number(document.getElementById("planetPhase").value)
if(!phase){

delete state.planets[name]

saveState()
calculate()

return

}
let pData = planetData[name]

let battles = 0
let platoons = 0

if (state.simulationMode) {
  // Modo simulação: batalhas manuais com validação de máximo
  battles = parseInt(document.getElementById("possibleBattles").value) || 0
  let players = Number(document.getElementById("players").value)
  let inactive = Number(document.getElementById("inactive").value)
  let activePlayers = players - inactive
  let multiplier = pData.battleMultiplier || 5
  let maxBattles = activePlayers * multiplier
  if(battles > maxBattles){
    alert("Máximo de batalhas para este planeta: " + maxBattles)
    return
  }
} else {
  // Modo real: batalhas vêm do combatEngine (autoBattles no state)
  battles = state.planets[name]?.autoBattles !== undefined
    ? Number(state.planets[name].autoBattles)
    : (state.planets[name]?.battles || 0)
}

if (state.simulationMode) {
  platoons = parseInt(document.getElementById("platoons").value) || 0
  if(platoons > 6){
    alert("Máximo de 6 operações de platoon por planeta")
    return
  }
} else {
  platoons = state.planets[name]?.platoons || 0
}

let planetsInPhase =
Object.values(state.planets)
.filter(p => p.phase == phase).length

let minPhase = pData.phase

if(pData.requirement){
let reqPlanet = state.planets?.[pData.requirement]
if(reqPlanet){
let reqPhase = Number(reqPlanet.phase) || 0
minPhase = Math.max(minPhase, reqPhase + 1)
}
}

if(phase < minPhase){
alert("Devido às fases anteriores, este planeta só pode ser executado na fase " + minPhase)
return
}

if(planetsInPhase >= 3){
alert("Máximo de 3 planetas por fase")
return
}

if(!state.planets[name]){
state.planets[name] = {}
}

state.planets[name].phase = phase
state.planets[name].battles = parseInt(battles) || 0
state.planets[name].platoons = parseInt(platoons) || 0

calculate()
saveState()

}

// ----------------------
// MODO SIMULAÇÃO
// ----------------------

function toggleSimMode() {
  state.simulationMode = !state.simulationMode
  localStorage.setItem('rote_simmode', state.simulationMode ? '1' : '0')
  applySimMode()
}

function applySimMode() {
  var simFields = document.getElementById('simHeaderFields')
  var btn = document.getElementById('btnSimMode')
  var planetSimFields = document.getElementById('planetSimFields')
  var battlesLabel = document.getElementById('possibleBattlesLabel')

  if (simFields) simFields.style.display = state.simulationMode ? '' : 'none'
  if (btn) {
    btn.style.background = state.simulationMode ? '#7c3aed' : ''
    btn.style.color = state.simulationMode ? '#fff' : ''
  }
  if (planetSimFields) planetSimFields.style.display = state.simulationMode ? '' : 'none'
  if (battlesLabel) battlesLabel.style.display = state.simulationMode ? '' : 'none'
}

// ----------------------
// BATALHAS DO PLANETA (combat data)
// ----------------------

// Formata GP: ≥1M → "1.4M", ≥1000 → "400K", resto → número
function _fmtGP(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1000)    return Math.round(n / 1000) + 'K'
  return String(n)
}

function updatePlanetBattleInfo(name) {
  var infoEl   = document.getElementById('planetBattleInfo')
  var mapLink  = document.getElementById('planetMapLink')
  var battleInput = document.getElementById('possibleBattles')
  var battleLabel = document.getElementById('possibleBattlesLabel')

  if (!infoEl) return

  // Link do mapa de batalhas
  if (mapLink && typeof PLANET_MAP_URL !== 'undefined' && PLANET_MAP_URL[name]) {
    mapLink.href = '#'
    mapLink.onclick = function(e) { e.preventDefault(); openBattleMap(name) }
    mapLink.textContent = '🗺 Ver mapa de batalhas'
    mapLink.style.display = 'block'
  } else if (mapLink) {
    mapLink.style.display = 'none'
  }

  var b = null

  // Em modo real: preferir dados do combatEngine (por jogador elegível)
  if (!state.simulationMode && typeof combatEngine !== 'undefined') {
    var stored = combatEngine.load()
    b = stored[name] || null
  }

  // Fallback: computePlanetBattles (contagem por missão sem roster)
  if (!b && typeof computePlanetBattles !== 'undefined') {
    b = computePlanetBattles(name)
  }

  if (!b) { infoEl.innerHTML = ''; return }

  // Em modo simulação: auto-preencher campo de batalhas com safeBattles
  if (state.simulationMode && battleInput) {
    battleInput.value = b.safeBattles
    if (!state.planets[name]) state.planets[name] = {}
    state.planets[name].battles = b.safeBattles
  }

  infoEl.innerHTML =
    '<div style="background:#0f2744;border-radius:4px;padding:4px 6px;">' +
      '<span style="color:#4da6ff;">⚔ ' + b.squadBattles + ' esq.</span>' +
      ' &nbsp;' +
      '<span style="color:#a78bfa;">🚀 ' + b.shipBattles + ' nave</span>' +
      (b.specialBattles ? ' &nbsp;<span style="color:#94a3b8;">★ ' + b.specialBattles + ' esp.</span>' : '') +
      '<br>' +
      (b.totalGP
        ? '<span style="color:#4ade80;font-size:10px;">GP: ' + _fmtGP(b.safeGP) + ' safe &nbsp;|&nbsp; ' + _fmtGP(b.totalGP) + ' máx</span>'
        : '<span style="color:#64748b;font-size:10px;">Safe: ' + b.safeBattles + ' &nbsp;|&nbsp; Total: ' + b.totalScoreBattles + '</span>') +
    '</div>'
}

// ----------------------
// STATUS DE PLATOON NO BOX DO PLANETA
// ----------------------

function updatePlanetPlatoonStatus() {
  var statusEl = document.getElementById('planetPlatoonStatus')
  if (!statusEl) return

  var name = state.selectedPlanet
  var phase = Number(document.getElementById('planetPhase').value)

  if (!name || !phase) { statusEl.innerHTML = ''; return }

  var rosterMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.loadActive() : null
  if (!rosterMap || Object.keys(rosterMap).length === 0) { statusEl.innerHTML = ''; return }

  if (typeof PLANET_PLATOON_KEY === 'undefined' || typeof platoonRequirements === 'undefined') return

  var tier = typeof getPlanetTier === 'function' ? getPlanetTier(name) : 1
  var relicMin = (typeof TIER_RELIC !== 'undefined' ? TIER_RELIC[tier] : null) || 5
  var platoonKey = PLANET_PLATOON_KEY[name]
  var requirements = platoonKey ? platoonRequirements[platoonKey] : null
  if (!requirements) { statusEl.innerHTML = ''; return }

  var totalOps = Object.keys(requirements).length
  var completableOps = 0
  for (var op = 1; op <= totalOps; op++) {
    var slots = requirements[op] || []
    var opComplete = slots.every(function(slot) {
      var id = slot.unitId || slot
      return typeof countPlayersWithUnit === 'function'
        ? countPlayersWithUnit(id, relicMin, rosterMap) >= 1
        : false
    })
    if (opComplete) completableOps++
  }

  var incompleteOps = totalOps - completableOps
  if (incompleteOps === 0) {
    statusEl.innerHTML = '<span style="color:#4ade80;font-weight:bold;">✅ Platoons completos (' + totalOps + '/' + totalOps + ')</span>'
  } else {
    statusEl.innerHTML = '<span style="color:#f87171;font-weight:bold;">❌ ' + completableOps + '/' + totalOps + ' ops completáveis</span>'
  }
}

document.getElementById("guildGP").addEventListener("input", () => {
saveState()
calculate()
updateGPProjectionDisplay()
})

document.getElementById("players").addEventListener("input", () => {
saveState()
calculate()
updateGPProjectionDisplay()
})

document.getElementById("inactive").addEventListener("input", () => {
saveState()
calculate()
updateGPProjectionDisplay()
})

document.getElementById("safe").addEventListener("input", () => {
saveState()
calculate()
})

document.getElementById("dailyGrowth").addEventListener("input", () => {
saveState()
applyGPProjection()
})

// specialMissionToggle removido — missão especial agora é calculada automaticamente
// pelo combatEngine.computeSpecialMissionEligible() com base no roster sincronizado

document.querySelectorAll("[id^=realPhase]")
.forEach(input => {
input.addEventListener("input", calculate)
})