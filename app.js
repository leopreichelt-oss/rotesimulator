// ── Landing page / seleção de modo ────────────────────────────────────────

function showLanding() {
  var landing = document.getElementById('landingPage')
  var header  = document.querySelector('header')
  var app     = document.querySelector('.container')
  if (landing) landing.style.display = 'block'
  if (header)  header.style.display  = 'none'
  if (app)     app.style.display     = 'none'
}

function selectMode(mode) {
  localStorage.setItem('rote_lastMode', mode)
  if (mode === 'ROTE') {
    var landing = document.getElementById('landingPage')
    var header  = document.querySelector('header')
    var app     = document.querySelector('.container')
    if (landing) landing.style.display = 'none'
    if (header)  header.style.display  = ''
    if (app)     app.style.display     = ''
  }
  // TW e GAC: módulos futuros — não fazem nada por enquanto
}

// ── Inicialização ──────────────────────────────────────────────────────────

window.onload = function(){
  drawPlanetList()
  drawGalaxyMap()
  loadState()
  if (typeof applySimMode === 'function') applySimMode()
  // Multi-conta: limpar contas antigas e registrar acesso à conta atual
  if (typeof rosterEngine !== 'undefined') {
    rosterEngine.pruneOldAccounts()
    var _ac = localStorage.getItem('rote_allycode')
    if (_ac) rosterEngine.touchAccount(_ac)
  }
  // Restaurar lista de inativos/margem do localStorage (sem precisar resincronizar)
  if (typeof _loadActivityStatusFromStorage === 'function') _loadActivityStatusFromStorage()
  if (typeof checkAutoSync === 'function') checkAutoSync()
  calculate()
  drawROTEHistory()
  updateGPProjectionDisplay()
  if (typeof drawPlatoonList === 'function') drawPlatoonList()
  if (typeof drawFarmCritical === 'function') drawFarmCritical()

  // Mostrar landing ou ir direto ao último modo usado
  var lastMode = localStorage.getItem('rote_lastMode')
  if (lastMode === 'ROTE') {
    selectMode('ROTE')
  } else {
    showLanding()
  }
}

function togglePhaseDetails(phase, el){
  let box = document.getElementById("phaseDetails"+phase)
  if(!box) return
  box.classList.toggle("hidden")
  if(box.classList.contains("hidden")){
    el.innerText = "▸ detalhes técnicos"
  } else {
    el.innerText = "▾ detalhes técnicos"
  }
}