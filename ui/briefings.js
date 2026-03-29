function generateOfficerBriefing(){

let text = "📊 BRIEFING TB ROTE\n"
text += "━━━━━━━━━━━━━━━━━━\n\n"

text += document.getElementById("starResult").innerText + "\n\n"

let gpMin = document.getElementById("activeGPmin").innerText
let gpMax = document.getElementById("activeGPmax").innerText
text += `⚙️ GP ativo: ${gpMin} – ${gpMax}\n\n`

for(let phase=1; phase<=6; phase++){

  let planets = Object.keys(state.planets)
    .filter(p => Number(state.planets[p].phase) === phase)

  if(planets.length === 0) continue

  let phaseData = state.phases?.[phase]

  text += "FASE " + phase + " (" + planets.length + " planeta"
    + (planets.length>1?"s":"") + ")\n"

  // GP da fase
  if(phaseData){
    let gpFaseMin = Math.round((phaseData.activeGP||0) / 1000000)
    text += `⚙️ GP previsto: ~${gpFaseMin}M\n`
  }

  // planetas e estrelas previstas
  planets.forEach(p=>{
    let starsMin = state.planets[p].starsMin || 0
    let starsMax = state.planets[p].starsMax || 0
    let starsText = starsMin === starsMax
      ? starsMax + "⭐"
      : starsMin + "–" + starsMax + "⭐"
    text += "• " + p + " (" + starsText + ")\n"
  })

  // carry out
  if(phaseData){
    let carryMin = Math.round((phaseData.carryMin||0)/1000000)
    let carryMax = Math.round((phaseData.carryMax||0)/1000000)

    if(carryMax > 0){
      let nextPlanets = Object.keys(state.planets)
        .filter(p => Number(state.planets[p].phase) === phase+1)

      if(nextPlanets.length){
        text += "• pré carregamento " + nextPlanets.join("+")
          + ": " + carryMin + "–" + carryMax + "M\n"
      }
    }
  }

  // early battles
  if(phaseData?.earlyBattles > 0){
    text += "⚡ batalhas antecipadas previstas\n"
  }

  // early platoons
  if(phaseData?.earlyPlatoons > 0){
    let nextPlanets = Object.keys(state.planets)
      .filter(p => Number(state.planets[p].phase) === phase+1)
    text += "🔧 platoons antecipados: " + nextPlanets.join("+") + "\n"
  }

  // aviso de crescimento necessário
  if(phaseData?.guildGrowthNeeded){
    let label = phaseData.guildGrowthNeededLabel || "para atingir 6 estrelas"
    text += "📈 crescer ~" + Math.round(phaseData.guildGrowthNeeded/1000000*10)/10
      + "M GP " + label + "\n"
  }

  if(phaseData?.guildGrowthNeededMin && !phaseData?.guildGrowthNeeded){
    text += "⚠ cenário pessimista: crescer ~"
      + Math.round(phaseData.guildGrowthNeededMin/1000000*10)/10
      + "M GP para garantir 6 estrelas\n"
  }

// sequência crítica
  if(phaseData){

    // situação 1: não bate máximo de estrelas nos planetas da fase
    let naoMaxEstrelas = planets.some(p => {
      let starsMax = state.planets[p]?.starsMax || 0
      return starsMax < 3
    })
    if(naoMaxEstrelas){
      text += "🚨 não atinge máximo de estrelas em todos os planetas desta fase\n"
    }
// situação 2 e 3: carry out vs star1 do planeta seguinte
    let nextPlanets = Object.keys(state.planets)
      .filter(p => Number(state.planets[p].phase) === phase+1)

  // carry sem early = carryMax antes de somar earlyBattles e earlyPlatoons
    let carryMaxSemEarly = (phaseData.carryMax || 0)
      - (phaseData.earlyBattles || 0)
      - (phaseData.earlyPlatoons || 0)

    // dividir carry pelo número de planetas da próxima fase
    let carryPorPlaneta = nextPlanets.length > 0
      ? carryMaxSemEarly / nextPlanets.length
      : carryMaxSemEarly

    let alertadoCarry = false
    nextPlanets.forEach(p=>{
      let star1 = planetData[p]?.stars?.one || 0

      // carry por planeta já bate star1
      if(carryPorPlaneta >= star1 && !alertadoCarry){
        text += "🚨 carry out bate star1 em " + p + " — revisar estratégia\n"
        alertadoCarry = true
      }
      // carry por planeta próximo de star1 (dentro do buffer)
      else if(carryPorPlaneta >= (star1 - STAR_BUFFER) && !alertadoCarry){
        text += "⚠ não fazer early battles/platoons em " + p + " para não bater star1 antecipadamente\n"
        alertadoCarry = true
      }
    })
  
  }

  text += "\n"

}

text += "━━━━━━━━━━━━━━━━━━\n"
text += "INSTRUÇÕES GERAIS\n"
text += "• Completar platoons do planeta objetivo da fase primeiro\n"
text += "• Preencher platoons da fase seguinte sem completar\n"
text += "• Fazer todas batalhas possíveis\n"
text += "• Não executar ações fora da sequência indicada\n"

navigator.clipboard.writeText(text)
alert("Briefing copiado para área de transferência")

}
