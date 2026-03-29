const HISTORY_KEY = "roteHistory"

// ----------------------
// LER / SALVAR HISTÓRICO
// ----------------------

function getROTEHistory(){
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
}

function saveROTEHistory(history){
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

// ----------------------
// EVENTO ATUAL
// ----------------------

function getActiveROTE(){
  let history = getROTEHistory()
  return history.length ? history[0] : null
}

// ----------------------
// BRIEFING — INICIA OU SOBRESCREVE EVENTO ATUAL
// ----------------------

function handleBriefing(){

  let history = getROTEHistory()

  // descartar evento atual se F6 não preenchida
  if(history.length && !history[0]?.results?.[6]){
    history.shift()
  }

  // criar novo snapshot
  let snapshot = {
    id: Date.now(),
    startTime: new Date().toISOString(),
    guildGP: Number(document.getElementById("guildGP").value),
    players: Number(document.getElementById("players").value),
    inactive: Number(document.getElementById("inactive").value),
    safe: Number(document.getElementById("safe").value),
    sequence: {},
    results: {}
  }

  // salvar sequência de planetas
  Object.keys(state.planets).forEach(name => {
    let p = state.planets[name]
    snapshot.sequence[name] = {
      phase: p.phase,
      battles: p.battles,
      platoons: p.platoons,
      specialMission: p.specialMission
    }
  })

  history.unshift(snapshot)

  // manter apenas 6 eventos
  history = history.slice(0, 6)

  saveROTEHistory(history)

  state.historyMode = false

  drawROTEHistory()

}

// ----------------------
// ATUALIZAR RESULTADO REAL
// ----------------------

function updateROTEResult(phase, value){

  let history = getROTEHistory()
  if(!history.length) return

  // se não há evento ativo, criar automaticamente
  if(!history[0]){
    handleBriefing()
    history = getROTEHistory()
  }

  history[0].results = history[0].results || {}
  history[0].results[phase] = Number(value)

  // se F6 preenchida, fechar evento
  if(history[0].results[6]){
    history[0].closedAt = new Date().toISOString()
  }

  saveROTEHistory(history)

}

// ----------------------
// CARREGAR RESULTADOS DO EVENTO ATUAL NA UI
// ----------------------

function loadROTEResults(){

  let active = getActiveROTE()
  if(!active || !active.results) return

  Object.keys(active.results).forEach(phase => {
    let input = document.getElementById("realPhase" + phase)
    if(input) input.value = active.results[phase]
  })

}

// ----------------------
// DESENHAR BOTÕES DE HISTÓRICO
// ----------------------

function drawROTEHistory(){

  let history = getROTEHistory()
  let container = document.getElementById("roteHistoryPanel")
  if(!container) return

  container.innerHTML = ""

  if(!history.length) return

  history.forEach((rote, index) => {

    let btn = document.createElement("button")
    btn.disabled = false

    if(index === 0){
      btn.innerText = "Atual"
      btn.onclick = () => loadCurrentROTE()
    } else {
      btn.innerText = new Date(rote.startTime).toLocaleDateString()
      btn.onclick = () => loadHistoryROTE(index)
    }

    container.appendChild(btn)

  })

}

// ----------------------
// CARREGAR EVENTO ATUAL (EDITÁVEL)
// ----------------------

function loadCurrentROTE(){

  let history = getROTEHistory()
  if(!history.length) return

  let entry = history[0]

  state.historyMode = false

  // restaurar GP e jogadores
  document.getElementById("guildGP").value = entry.guildGP || ""
  document.getElementById("players").value = entry.players || ""
  document.getElementById("inactive").value = entry.inactive || ""
  document.getElementById("safe").value = entry.safe || ""

  // restaurar sequência de planetas
  Object.keys(entry.sequence || {}).forEach(name => {
    state.planets[name] = {
      ...state.planets[name],
      ...entry.sequence[name]
    }
  })

  // limpar resultados reais
  for(let phase = 1; phase <= 6; phase++){
    let input = document.getElementById("realPhase" + phase)
    if(input) input.value = ""
  }

  // restaurar resultados reais salvos
  Object.keys(entry.results || {}).forEach(phase => {
    let input = document.getElementById("realPhase" + phase)
    if(input) input.value = entry.results[phase]
  })

  calculate()

}

// ----------------------
// CARREGAR EVENTO DO HISTÓRICO (SOMENTE LEITURA)
// ----------------------

function loadHistoryROTE(index){

  let history = getROTEHistory()
  let entry = history[index]
  if(!entry) return

  state.historyMode = true

  // restaurar GP e jogadores do evento histórico
  document.getElementById("guildGP").value = entry.guildGP || ""
  document.getElementById("players").value = entry.players || ""
  document.getElementById("inactive").value = entry.inactive || ""
  document.getElementById("safe").value = entry.safe || ""

  // restaurar sequência de planetas
  Object.keys(entry.sequence || {}).forEach(name => {
    state.planets[name] = {
      ...state.planets[name],
      ...entry.sequence[name]
    }
  })

  // limpar e restaurar resultados reais
  for(let phase = 1; phase <= 6; phase++){
    let input = document.getElementById("realPhase" + phase)
    if(input) input.value = ""
  }

  Object.keys(entry.results || {}).forEach(phase => {
    let input = document.getElementById("realPhase" + phase)
    if(input) input.value = entry.results[phase]
  })

  calculate()

}