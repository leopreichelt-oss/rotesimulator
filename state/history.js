function _historyKey(){
  var ac = localStorage.getItem('rote_allycode') || ''
  return ac ? ('roteHistory_' + ac) : 'roteHistory'
}

// ----------------------
// LER / SALVAR HISTÓRICO
// ----------------------

function getROTEHistory(){
  return JSON.parse(localStorage.getItem(_historyKey()) || "[]")
}

function saveROTEHistory(history){
  localStorage.setItem(_historyKey(), JSON.stringify(history))
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

  // Gráfico de tendência (últimas 5 TBs fechadas)
  let closed = history.filter(e => e.closedAt && e.results)
  if(closed.length >= 2){
    let chart = _buildTrendChart(closed.slice(0, 5).reverse())
    container.appendChild(chart)
  }

}

// ----------------------
// GRÁFICO DE TENDÊNCIA: estrelas por fase nas últimas 5 TBs
// ----------------------

function _buildTrendChart(events){
  // events: array cronológico (mais antigo → mais recente), máx 5

  const PHASES   = [1, 2, 3, 4, 5, 6]
  const W        = 280
  const H        = 72
  const PAD_L    = 22
  const PAD_B    = 16
  const PAD_T    = 6
  const plotW    = W - PAD_L - 4
  const plotH    = H - PAD_B - PAD_T

  // Descobrir o max de estrelas por fase para escala
  let maxStars = 1
  events.forEach(e => PHASES.forEach(ph => {
    let v = Number(e.results[ph] || 0)
    if(v > maxStars) maxStars = v
  }))
  // Arredondar para próximo múltiplo de 5 para eixo limpo
  maxStars = Math.ceil(maxStars / 5) * 5 || 5

  // Cores para cada TB (mais antigo = mais opaco/frio, mais recente = amarelo)
  const COLORS = ['#475569','#64748b','#0ea5e9','#f59e0b','#facc15']

  let svgNS = 'http://www.w3.org/2000/svg'
  let svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('width',  W)
  svg.setAttribute('height', H)
  svg.setAttribute('style',  'display:block;margin-top:8px;')

  // Fundo
  let bg = document.createElementNS(svgNS, 'rect')
  bg.setAttribute('width',  W)
  bg.setAttribute('height', H)
  bg.setAttribute('fill',   '#0f172a')
  bg.setAttribute('rx',     '4')
  svg.appendChild(bg)

  // Linhas de grade horizontais (0, metade, max)
  ;[0, 0.5, 1].forEach(frac => {
    let y = PAD_T + plotH - frac * plotH
    let line = document.createElementNS(svgNS, 'line')
    line.setAttribute('x1',    PAD_L)
    line.setAttribute('x2',    W - 4)
    line.setAttribute('y1',    y)
    line.setAttribute('y2',    y)
    line.setAttribute('stroke','#1e293b')
    line.setAttribute('stroke-width','1')
    svg.appendChild(line)

    // Rótulo do eixo Y
    let label = document.createElementNS(svgNS, 'text')
    label.setAttribute('x',            PAD_L - 3)
    label.setAttribute('y',            y + 3)
    label.setAttribute('text-anchor',  'end')
    label.setAttribute('font-size',    '8')
    label.setAttribute('fill',         '#475569')
    label.textContent = Math.round(frac * maxStars)
    svg.appendChild(label)
  })

  // Rótulos do eixo X (F1–F6)
  let xStep = plotW / (PHASES.length - 1)
  PHASES.forEach((ph, i) => {
    let x = PAD_L + i * xStep
    let label = document.createElementNS(svgNS, 'text')
    label.setAttribute('x',           x)
    label.setAttribute('y',           H - 2)
    label.setAttribute('text-anchor', 'middle')
    label.setAttribute('font-size',   '8')
    label.setAttribute('fill',        '#64748b')
    label.textContent = 'F' + ph
    svg.appendChild(label)
  })

  // Linhas de tendência: uma por evento
  events.forEach((evt, ei) => {
    let color   = COLORS[Math.min(ei, COLORS.length - 1) + (COLORS.length - events.length)]
    let points  = PHASES.map((ph, i) => {
      let v = Number(evt.results[ph] || 0)
      let x = PAD_L + i * xStep
      let y = PAD_T + plotH - (v / maxStars) * plotH
      return { x, y, v }
    })

    // Linha
    let d = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
    let path = document.createElementNS(svgNS, 'path')
    path.setAttribute('d',            d)
    path.setAttribute('fill',         'none')
    path.setAttribute('stroke',       color)
    path.setAttribute('stroke-width', ei === events.length - 1 ? '2' : '1')
    path.setAttribute('opacity',      ei === events.length - 1 ? '1' : '0.55')
    svg.appendChild(path)

    // Pontos + tooltip nativo
    points.forEach(p => {
      let dot = document.createElementNS(svgNS, 'circle')
      dot.setAttribute('cx', p.x.toFixed(1))
      dot.setAttribute('cy', p.y.toFixed(1))
      dot.setAttribute('r',  ei === events.length - 1 ? '3' : '2')
      dot.setAttribute('fill', color)
      let title = document.createElementNS(svgNS, 'title')
      let label = new Date(evt.startTime).toLocaleDateString('pt-BR')
      title.textContent = label + ': ' + p.v + '★'
      dot.appendChild(title)
      svg.appendChild(dot)
    })
  })

  // Legenda: datas (mais antigo → mais recente)
  let legendY = PAD_T + 4
  events.forEach((evt, ei) => {
    let color = COLORS[Math.min(ei, COLORS.length - 1) + (COLORS.length - events.length)]
    let lx = PAD_L + ei * (plotW / Math.max(events.length - 1, 1))
    // Linha de cor
    let lline = document.createElementNS(svgNS, 'line')
    lline.setAttribute('x1',     (W - 4 - events.length * 36) + ei * 36)
    lline.setAttribute('x2',     (W - 4 - events.length * 36) + ei * 36 + 10)
    lline.setAttribute('y1',     legendY)
    lline.setAttribute('y2',     legendY)
    lline.setAttribute('stroke', color)
    lline.setAttribute('stroke-width', ei === events.length - 1 ? '2' : '1')
    svg.appendChild(lline)

    let ltext = document.createElementNS(svgNS, 'text')
    ltext.setAttribute('x',          (W - 4 - events.length * 36) + ei * 36 + 12)
    ltext.setAttribute('y',          legendY + 3)
    ltext.setAttribute('font-size',  '7')
    ltext.setAttribute('fill',       color)
    let d = new Date(evt.startTime)
    ltext.textContent = (d.getDate()).toString().padStart(2,'0') + '/' + (d.getMonth()+1).toString().padStart(2,'0')
    svg.appendChild(ltext)
  })

  return svg
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