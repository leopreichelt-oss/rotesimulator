function getPlanetsOfPhase(phase){
  let list = []
  Object.keys(state.planets).forEach(name => {
    let p = state.planets[name]
    if(!p) return
    if(Number(p.phase) === phase){
      list.push(name)
    }
  })
  return list
}

function getPlanetTier(name){
  if(!planetData[name]) return 1
  return planetData[name].tier
}

// ----------------------
// CALENDÁRIO DO EVENTO
// ----------------------

function getNextEventStart(){
  let anchor = new Date(Date.UTC(2026, 2, 30, 17, 0, 0))
  let now = new Date()
  let cycleMs = 14 * 24 * 60 * 60 * 1000

  let diffMs = now - anchor
  let cyclesPassed = Math.floor(diffMs / cycleMs)
  let nextStart = new Date(anchor.getTime() + cyclesPassed * cycleMs)

  if(nextStart <= now){
    nextStart = new Date(nextStart.getTime() + cycleMs)
  }

  return nextStart
}

function getCurrentEventStart(){
  let anchor = new Date(Date.UTC(2026, 2, 30, 17, 0, 0))
  let now = new Date()
  let cycleMs = 14 * 24 * 60 * 60 * 1000
  let eventDurationMs = 6 * 24 * 60 * 60 * 1000

  let diffMs = now - anchor
  let cyclesPassed = Math.floor(diffMs / cycleMs)
  let cycleStart = new Date(anchor.getTime() + cyclesPassed * cycleMs)

  let sinceStart = now - cycleStart
  if(sinceStart >= 0 && sinceStart < eventDurationMs){
    return cycleStart
  }

  return null
}

function getEventStatus(){
  if(getCurrentEventStart()) return "during"
  return "before"
}

function getDaysUntilNextEvent(){
  let nextStart = getNextEventStart()
  let now = new Date()
  let diffMs = nextStart - now
  return diffMs / (1000 * 60 * 60 * 24)
}

function getProjectedGP(){
  let baseGP =
    Number(document.getElementById("guildGP").value) || 0

  let status = getEventStatus()
  if(status === "during") return baseGP

  let daysUntil = getDaysUntilNextEvent()
  if(daysUntil <= 0) return baseGP

  let players =
    Number(document.getElementById("players").value) || 0

  let inactive =
    Number(document.getElementById("inactive").value) || 0

  let safe =
    Number(document.getElementById("safe").value) || 0

  let activePlayers = Math.max(0, players - inactive - safe)

  let dailyGrowthPerPlayer =
    Number(document.getElementById("dailyGrowth")?.value) || 5500

  let projectedGP =
    baseGP + (daysUntil * activePlayers * dailyGrowthPerPlayer)

  return Math.round(projectedGP)
}

function updateGPProjectionDisplay(){
  let info = document.getElementById("gpProjectionInfo")
  if(!info) return

  let baseGP =
    Number(document.getElementById("guildGP").value) || 0

  let now = new Date()
  let currentStart = getCurrentEventStart()

  // ── DURANTE O EVENTO ──
  if(currentStart){
    let msPassed = now - currentStart
    let daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24))
    let currentPhase = Math.min(daysPassed + 1, 6)
    let daysLeft = 6 - daysPassed

    info.className = "status-during"
    info.innerHTML =
      `<span>⚡ Evento em andamento — Fase ${currentPhase} — ${daysLeft} dia(s) restante(s)</span>`
    return
  }

  let nextStart = getNextEventStart()
  let msUntil = nextStart - now
  let hoursUntil = msUntil / (1000 * 60 * 60)
  let daysUntil = msUntil / (1000 * 60 * 60 * 24)
  let daysFull = Math.ceil(daysUntil)

  let projected = getProjectedGP()
  let gain = projected - baseGP

  let dateStr = nextStart.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  })

  let gpLine = `<span style="color:#4da6ff;">📈 GP projetado: ~${formatNumber(projected)} (+${formatNumber(gain)})</span>`

  // ── ENCERRADO ──
  if(daysUntil > 8){
    info.className = "status-ended"
    info.innerHTML =
      `<span>✅ Evento encerrado — Próximo: ${dateStr} — em ${daysFull} dia(s)</span><br>${gpLine}`
    return
  }

  // ── CRÍTICO: menos de 12h ──
  if(hoursUntil <= 12){
    let hoursLeft = Math.ceil(hoursUntil)
    info.className = "status-critical"
    info.innerHTML =
      `<span>🚨 Evento começa em ${hoursLeft}h! — ${dateStr}</span><br>${gpLine}`
    return
  }

  // ── EM BREVE: menos de 2 dias ──
  if(daysUntil <= 2){
    info.className = "status-soon"
    info.innerHTML =
      `<span>⚠️ Evento em breve: ${dateStr} — em ${daysFull} dia(s)</span><br>${gpLine}`
    return
  }

  // ── PADRÃO ──
  info.className = "status-before"
  info.innerHTML =
    `<span>📅 Próximo evento: ${dateStr} — em ${daysFull} dia(s)</span><br>${gpLine}`
}

function applyGPProjection(){
  let projected = getProjectedGP()
  let status = getEventStatus()

  if(status !== "during"){
    document.getElementById("guildGP").value = projected
  }

  updateGPProjectionDisplay()
  calculate()
}

function applyGPGrowth(guildGP, players, phase){
  let inactive =
    Number(document.getElementById("inactive").value) || 0

  let safe =
    Number(document.getElementById("safe").value) || 0

  // crescimento apenas nos jogadores plenamente ativos (exclui inativos e margem)
  let activePlayers = Math.max(0, players - inactive - safe)

  let dailyGrowthPerPlayer =
    Number(document.getElementById("dailyGrowth")?.value) || 5500

  let growthPerPhase = activePlayers * dailyGrowthPerPlayer

  let phaseGP =
    guildGP + (growthPerPhase * (phase - 1))

  return phaseGP
}