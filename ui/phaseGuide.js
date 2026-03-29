function generatePhaseGuide(phase){

let text = "⚔ TB ROTE — FASE " + phase + "\n"
text += "━━━━━━━━━━━━━━━━\n\n"

let phasePlanets = Object.keys(state.planets)
  .filter(p => Number(state.planets[p].phase) === phase)

let nextPlanets = Object.keys(state.planets)
  .filter(p => Number(state.planets[p].phase) === phase+1)

let phaseData = state.phases?.[phase] || {}

// ----------------
// PLANETAS DA FASE
// ----------------

if(phasePlanets.length){
  text += "PLANETAS\n"
  phasePlanets.forEach(p => text += "• " + p + "\n")
  text += "\n"
}

// ----------------
// OBJETIVO
// ----------------

text += "OBJETIVO\n"
phasePlanets.forEach(p => {
  let starsMin = state.planets[p].starsMin || 0
  let starsMax = state.planets[p].starsMax || 0
  let starsText = starsMin === starsMax
    ? starsMax + "⭐"
    : starsMin + "–" + starsMax + "⭐"
  text += "• " + starsText + " " + p + "\n"
})
text += "\n"

// ----------------
// PLANETA DA PRÓXIMA FASE
// ----------------

if(nextPlanets.length){
  text += "PLANETA DA PRÓXIMA FASE\n"
  nextPlanets.forEach(p => text += "• " + p + "\n")
  text += "\n"
}

// ----------------
// ANÁLISE DE EARLY
// ----------------

let carryMaxSemEarly = (phaseData.carryMax || 0)
  - (phaseData.earlyBattles || 0)
  - (phaseData.earlyPlatoons || 0)

let carryPorPlaneta = nextPlanets.length > 0
  ? carryMaxSemEarly / nextPlanets.length
  : carryMaxSemEarly

// determinar situação de early platoon por planeta
let earlyPlatoonStatus = {}
nextPlanets.forEach(p => {
  let star1 = planetData[p]?.stars?.one || 0
  let carryComPlatoon = carryPorPlaneta + (phaseData.earlyPlatoons || 0)
  let carrySemPlatoon = carryPorPlaneta

  if(carryComPlatoon >= star1){
    // mesmo completando platoon bate star1
    if(carrySemPlatoon >= star1){
      earlyPlatoonStatus[p] = "nao_fazer" // bate star1 mesmo sem platoon
    } else {
      earlyPlatoonStatus[p] = "preencher_nao_completar" // só completa bate star1
    }
  } else {
    // não bate star1 mesmo completando
    earlyPlatoonStatus[p] = "completar"
  }
})

// ----------------
// FAZER IMEDIATAMENTE
// ----------------

text += "━━━━━━━━━━━━━━━━\n\n"
text += "FAZER IMEDIATAMENTE\n"

// platoons da fase atual
if(phasePlanets.length){
  text += "• Completar os platoons de " + phasePlanets.join(" e ") + "\n"
}

// platoons da próxima fase
if(nextPlanets.length){
  nextPlanets.forEach(p => {
    let status = earlyPlatoonStatus[p]
    if(status === "completar" && phaseData.earlyPlatoons > 0){
      text += "• Completar os platoons de " + p + "\n"
    } else if(status === "preencher_nao_completar" || status === "completar"){
      text += "• Preencher os platoons de " + p + " deixando 1 personagem (não completar)\n"
    } else {
      text += "• NÃO preencher platoons de " + p + "\n"
    }
  })
}

// batalhas da fase atual
if(phasePlanets.length){
  text += "• Fazer batalhas em " + phasePlanets.join(" e ") + "\n"
}

// early battles
if(phaseData.earlyBattles > 0){
  text += "• Após batalhas em " + phasePlanets.join(" e ")
    + ", fazer batalhas em " + nextPlanets.join(" e ")
    + " antes da mobilização final\n"
}

// mobilização fase atual
if(phasePlanets.length > 1){
  text += "• Mobilizar em " + phasePlanets.join(" e ")
    + " (sempre no planeta com menor pontuação)\n"
} else if(phasePlanets.length === 1){
  text += "• Mobilizar em " + phasePlanets[0] + "\n"
}

text += "\n"

// ----------------
// AGUARDAR ORDEM
// ----------------

text += "━━━━━━━━━━━━━━━━\n\n"
text += "AGUARDAR ORDEM\n"

if(nextPlanets.length){
  text += "• Mobilização em " + nextPlanets.join(" e ") + "\n"
}

text += "\n"

// ----------------
// NÃO FAZER
// ----------------

text += "━━━━━━━━━━━━━━━━\n\n"
text += "NÃO FAZER\n"

// não mobilizar antes de completar platoons e batalhas
if(phasePlanets.length){
  text += "• Não mobilizar em " + phasePlanets.join(" e ")
    + " antes de completar platoons e batalhas\n"
}

// não mobilizar na próxima fase antes de bater estrelas na atual
if(nextPlanets.length){
  let totalStarsMax = phasePlanets.reduce((s,p) =>
    s + (state.planets[p]?.starsMax || 0), 0)
  text += "• Não mobilizar em " + nextPlanets.join(" e ")
    + " antes de bater " + totalStarsMax + "⭐ em "
    + phasePlanets.join(" e ") + "\n"
}

// não fazer batalhas antes de completar platoons
let todosPlanetas = [...new Set([...phasePlanets, ...nextPlanets])]
text += "• Não fazer batalhas antes de completar os platoons em "
  + todosPlanetas.join(", ") + "\n"

// não completar platoons da próxima fase se não for seguro
let naoCompletar = nextPlanets.filter(p => earlyPlatoonStatus[p] !== "completar")
if(naoCompletar.length){
  text += "• Não completar platoons de " + naoCompletar.join(" e ")
    + " (risco de bater star1 antecipadamente)\n"
}

// ----------------
// ALERTA PLATOON PARCIAL
// ----------------

let specialPlatoons = phasePlanets.filter(p => {
  let ops = state.planets[p].platoons || 0
  return ops > 0 && ops < 6
})

if(specialPlatoons.length){
  text += "\n⚠ Completar apenas "
    + state.planets[specialPlatoons[0]].platoons
    + " platoons em " + specialPlatoons.join(" e ") + "\n"
}

// ----------------
// COPIAR
// ----------------

navigator.clipboard.writeText(text)
alert("Roteiro da fase copiado")

}