const STAR_BUFFER = 3000000


// ----------------------
// ESTRELAS DO PLANETA
// ----------------------

function getPlanetStars(name){
let p = state.planets[name]
if(!p) return 0
return p.stars || 0
}


// ----------------------
// PLANETA LIBERADO
// ----------------------

function planetUnlocked(name){

let p = planetData[name]
if(!p) return false

if(p.unlock === "specialMission"){
  var sm = state.specialMission?.[p.missionPlanet]
  // Suporta tanto bool legado quanto número de vitórias
  return sm === true || Number(sm) >= 30
}

if(!p.requirement) return true

let stars = state.planets?.[p.requirement]?.stars || 0

return stars >= 1
}


// ----------------------
// CALCULAR ESTRELAS
// ----------------------

function calculateStars(planet,score){

let starData = planetData[planet]?.stars || {}

let star1 = starData.one || 0
let star2 = starData.two || 0
let star3 = starData.three || 0

if(score >= star3) return 3
if(score >= star2) return 2
if(score >= star1) return 1

return 0
}


// ----------------------
// DISTRIBUIR CARRY
// ----------------------
function distributeCarry(results, nextPlanets) {

  // carry total gerado na fase atual (média de min e max)
  let totalCarry =
    results.reduce((s, p) =>
      s + ((p.carryOutMin + p.carryOutMax) / 2 || 0)
    , 0)

  if (totalCarry <= 0) return
  console.log("DISTRIBUTE CARRY", { totalCarry, nextPlanets })

  // filtrar apenas planetas válidos da próxima fase
  let activePlanets = nextPlanets.filter(name => {
    if (!planetData[name]) return false
    if (!planetUnlocked(name)) return false
    return true
  })

  if (activePlanets.length === 0) return

  // zerar carry in de todos antes de redistribuir
  activePlanets.forEach(name => {
    state.planets[name] ??= {}
    state.planets[name].carryIn = 0
  })

  // teto de carry por planeta = star1 - 3.000.000
  let ceilings = {}
  let totalCeiling = 0

  activePlanets.forEach(name => {
    let star1 = planetData[name]?.stars?.one || 0
    let ceiling = Math.max(0, star1 - 3000000)
    ceilings[name] = ceiling
    totalCeiling += ceiling
  })

  // distribuir carry proporcional ao threshold star1 de cada planeta
  // respeitando o teto individual
  let remaining = totalCarry

  activePlanets.forEach(name => {
    if (totalCeiling <= 0) return

    let proportion = ceilings[name] / totalCeiling
    let allocated = Math.min(
      totalCarry * proportion,
      ceilings[name]
    )

    state.planets[name].carryIn = allocated
    remaining -= allocated
  })

  // se ainda sobrar carry após respeitar tetos,
  // propagar para fase N+2
  if (remaining > 0) {

    let phase = state.planets[activePlanets[0]]?.phase
    if (!phase) return

    let phaseNum = Number(String(phase).replace("F", ""))
    let nextNextPlanets = getPlanetsOfPhase(phaseNum + 1)

    if (!nextNextPlanets || nextNextPlanets.length === 0) return

    let validNext = nextNextPlanets.filter(name => {
      if (!planetData[name]) return false
      if (!planetUnlocked(name)) return false
      return true
    })

    if (validNext.length === 0) return

    let totalCeilingNext = 0
    let ceilingsNext = {}

    validNext.forEach(name => {
      let star1 = planetData[name]?.stars?.one || 0
      let ceiling = Math.max(0, star1 - 3000000)
      ceilingsNext[name] = ceiling
      totalCeilingNext += ceiling
    })

    validNext.forEach(name => {
      if (totalCeilingNext <= 0) return

      state.planets[name] ??= {}
      state.planets[name].carryIn =
        state.planets[name].carryIn || 0

      let proportion = ceilingsNext[name] / totalCeilingNext
      let allocated = Math.min(
        remaining * proportion,
        ceilingsNext[name]
      )

      state.planets[name].carryIn += allocated
    })

  }

}

// ----------------------
// CALCULAR FASE
// ----------------------

function calculatePhase(phase, phaseGP, activeGPmin, activeGPmax){

state.phases ??= {}
state.phases[phase] ??= {}

let phaseState = state.phases[phase]

// ----------------------
// PLANETAS DA FASE
// ----------------------

let phasePlanets = getPlanetsOfPhase(phase)

if(!phasePlanets.length) return []

// ----------------------
// RECONSTRUIR CARRY IN DA FASE
// ----------------------

let carryIn = phasePlanets.reduce((sum, name) => {
  return sum + (state.planets[name]?.carryIn || 0)
}, 0)

phaseState.carryIn = carryIn
console.log("CARRY IN FASE", phase, { carryIn, planetas: phasePlanets })
phaseState.gpEntrada = carryIn + phaseGP
phaseState.activeGP = phaseGP

let results = []


// ----------------------
// CALCULAR PLANETAS
// ----------------------

phasePlanets.forEach(name=>{

let result = calculatePlanet(
name,
phase,
activeGPmin,
activeGPmax
)

console.log("PLANET RESULT", result.name, {
  battleScoreMax: result.battleScoreMax,
  scoreMax: result.scoreMax,
  gp: result.gpUsed
})

results.push(result)

})
// ----------------------
// CALCULAR BATALHAS NO NÍVEL DA FASE
// ----------------------

// Batalhas: usa autoBattles (de combatData) se disponível, senão manual
// autoBattles já é o safeBattles calculado (squad + ship * 0.8), sem especiais
let totalBattlesPossible = results.reduce((s,p) => {
  let pl = state.planets[p.name] || {}
  let val = pl.autoBattles !== undefined ? Number(pl.autoBattles) : (Number(pl.battles) || 0)
  return s + val
}, 0)
let totalSafeBattles = totalBattlesPossible  // autoBattles já é safe; manual aplica 0.8
if (results.some(p => (state.planets[p.name]?.autoBattles === undefined))) {
  totalSafeBattles = Math.floor(totalBattlesPossible * 0.8)
}

let totalCarryInPhase = phasePlanets.reduce((s, name) => s + (state.planets[name]?.carryIn || 0), 0)
let totalPlatoonPhase = results.reduce((s,p) => s + (p.platoonScore || 0), 0)

let totalStar3Phase = results.reduce((s,p) => {
  return s + (planetData[p.name]?.stars?.three || 0)
}, 0)
//inicia aqui
// calcular gap individual de cada planeta
let totalGapMax = 0
let totalGapMin = 0
let planetGapsMax = {}
let planetGapsMin = {}

//substituir aqui
results.forEach(p => {
  let star3 = planetData[p.name]?.stars?.three || 0
  let star2 = planetData[p.name]?.stars?.two || 0
  let carryInP = state.planets[p.name]?.carryIn || 0
  let platoonP = p.platoonScore || 0

  // cenário otimista: gap para star3
  let gapMax = Math.max(0, star3 - carryInP - platoonP)

  // cenário pessimista: gap para star2 (objetivo realista com GP mínimo)
  let gapMin = Math.max(0, star2 - carryInP - platoonP)

  planetGapsMax[p.name] = gapMax
  planetGapsMin[p.name] = gapMin

  totalGapMax += gapMax
  totalGapMin += gapMin
})

// distribuir GP proporcional ao gap de cada planeta
// se planeta já bateu star3 (gap=0), excedente vai para os outros
results.forEach(p => {
  let propMax = totalGapMax > 0 ? planetGapsMax[p.name] / totalGapMax : 1 / results.length
  let propMin = totalGapMin > 0 ? planetGapsMin[p.name] / totalGapMin : 1 / results.length

  p.gpAllocatedMax = activeGPmax * propMax
  p.gpAllocatedMin = activeGPmin * propMin
})

// calcular batalhas no nível da fase com GP total
let gpNeededPhaseMax = Math.max(0, totalGapMax)
let gpNeededPhaseMin = Math.max(0, totalGapMin)

let usagePctMax = activeGPmax > 0 ? gpNeededPhaseMax / activeGPmax : 0
let usagePctMin = activeGPmin > 0 ? gpNeededPhaseMin / activeGPmin : 0

usagePctMax = Math.min(1, Math.max(0, usagePctMax))
usagePctMin = Math.min(1, Math.max(0, usagePctMin))

let validBattlesPhaseMax = Math.min(Math.floor(totalBattlesPossible * usagePctMax), totalSafeBattles)
let validBattlesPhaseMin = Math.min(Math.floor(totalBattlesPossible * usagePctMin), totalSafeBattles)

let battlesPerPlanetMax = results.length > 0 ? Math.floor(validBattlesPhaseMax / results.length) : 0
let battlesPerPlanetMin = results.length > 0 ? Math.floor(validBattlesPhaseMin / results.length) : 0

// injetar batalhas e scores com GP proporcional por planeta
results.forEach(p => {
  let tier = getPlanetTier(p.name)
  p.battleScoreMax = battlesPerPlanetMax * BATTLE_POINTS[tier]
  p.battleScoreMin = battlesPerPlanetMin * BATTLE_POINTS[tier]
  p.scoreMax = (state.planets[p.name]?.carryIn || 0) + p.platoonScore + p.gpAllocatedMax + p.battleScoreMax
  p.scoreMin = (state.planets[p.name]?.carryIn || 0) + p.platoonScore + p.gpAllocatedMin + p.battleScoreMin
})
console.log("SCORES INJETADOS FASE", phase, results.map(p => ({
  name: p.name,
  scoreMax: p.scoreMax,
  scoreMin: p.scoreMin,
  gpAllocatedMax: p.gpAllocatedMax,
  gpAllocatedMin: p.gpAllocatedMin,
  star2: planetData[p.name]?.stars?.two,
  star3: planetData[p.name]?.stars?.three,
  starsMax: calculateStars(p.name, p.scoreMax),
  starsMin: calculateStars(p.name, p.scoreMin)
})))
// ----------------------
// OTIMIZAÇÃO DE ESTRELAS
// ----------------------
// calcular pontuação total da fase
let phaseScoreMax =
results.reduce((s,p)=>s+(p.scoreMax||0),0)

// calcular pontuação usada para estrelas atuais
let starsScore =
results.reduce((s,p)=>{

let stars = calculateStars(p.name,p.scoreMax)
let starData = planetData[p.name].stars

if(stars === 3) return s + starData.three
if(stars === 2) return s + starData.two
if(stars === 1) return s + starData.one

return s

},0)

// carry disponível da fase
let carryAvailable = Math.max(0, phaseScoreMax - starsScore)

// otimizar estrelas com esse carry
//let optimization =
optimizePhaseStars(results, carryAvailable, phasePlanets.length)

//results = optimization.updatedResults
//carryAvailable = optimization.remainingCarry

// recalcular estrelas após otimização
results.forEach(p => {

p.starsMax = calculateStars(p.name, p.scoreMax)
p.starsMin = calculateStars(p.name, p.scoreMin)

})

// ----------------------
// SCORE DA FASE
// ----------------------

let battleScore =
results.reduce((s,p)=>s+(p.battleScoreMax||0),0)

let platoonScore =
results.reduce((s,p)=>s+(p.platoonScore||0),0)

// ----------------------
// CALCULAR CARRY DA FASE
// ----------------------

let phaseScoreMin =
results.reduce((s,p)=>s+(p.scoreMin||0),0)


let starsScoreMin =
results.reduce((s,p)=>{

let stars = calculateStars(p.name,p.scoreMin)
let starData = planetData[p.name].stars

if(stars === 3) return s + starData.three
if(stars === 2) return s + starData.two
if(stars === 1) return s + starData.one

return s

},0)

let starsScoreMax =
results.reduce((s,p)=>{

let stars = p.starsMax
let starData = planetData[p.name].stars

if(stars === 3) return s + starData.three
if(stars === 2) return s + starData.two
if(stars === 1) return s + starData.one

return s

},0)


// calcular estrelas totais da fase
let totalStarsMin = results.reduce((s,p)=>s+p.starsMin,0)
let totalStarsMax = results.reduce((s,p)=>s+p.starsMax,0)

// calcular próximo threshold de estrela da fase
let nextStarThreshold = Infinity

results.forEach(p=>{

let starData = planetData[p.name].stars

let stars = p.starsMax

let nextStar =
stars === 0 ? starData.one :
stars === 1 ? starData.two :
stars === 2 ? starData.three :
Infinity

if(nextStar < nextStarThreshold){
nextStarThreshold = nextStar
}

})

// calcular carry apenas se já passou da próxima estrela
let carryMin = Math.max(0, phaseScoreMin - starsScoreMin)
let carryMax = Math.max(0, phaseScoreMax - starsScoreMax)

if(carryMin > carryMax){
console.warn("Carry inconsistente detectado na fase", phase)
}

// regra ROTE: fase com 3 planetas não gera carry
if(phasePlanets.length === 3){
carryMin = 0
carryMax = 0
}

phaseState.carryMin = carryMin
phaseState.carryMax = carryMax

console.log("CARRY FASE", phase, { carryMin, carryMax, planetas: phasePlanets.length })
// ----------------------
// PLANETAS DA PRÓXIMA FASE
// ----------------------

let nextActivePlanets =
Object.keys(state.planets).filter(name=>{

let p = state.planets[name]
if(!p) return false

let pPhase = Number(String(p.phase).replace("F",""))

return pPhase === phase + 1

})


let carryPerPlanet = 0

if(nextActivePlanets.length){

carryPerPlanet = carryMax / nextActivePlanets.length

}


// ----------------------
// EARLY BATTLES / PLATOONS
// ----------------------

let earlyBattleScore = 0
let earlyPlatoonScore = 0


nextActivePlanets.forEach(name=>{

let tier = getPlanetTier(name)

let p = state.planets[name] || {}

let battlesPossible = p.autoBattles !== undefined ? Number(p.autoBattles) : (Number(p.battles) || 0)
let platoons = p.autoPlatoons !== undefined ? Number(p.autoPlatoons) : (Number(p.platoons) || 0)

let safeBattles = Math.floor(battlesPossible * 0.8)

let earlyBattleGP = safeBattles * BATTLE_POINTS[tier]

let platoonCost = 3150000 + ((tier-1) * 100000)

let requiredGP = earlyBattleGP + platoonCost

let star1 = planetData[name]?.stars?.one || 0


// EARLY BATTLES
if(carryMax >= earlyBattleGP){

let projectedScore =
carryPerPlanet + earlyBattleGP

if(projectedScore < (star1 - STAR_BUFFER)){
earlyBattleScore += earlyBattleGP
}

}

// EARLY PLATOONS
if(carryMax >= requiredGP){

let projectedScore =
carryPerPlanet +
(platoons * PLATOON_REWARD[tier]) +
earlyBattleGP

if(projectedScore < (star1 - STAR_BUFFER)){
earlyPlatoonScore += platoons * PLATOON_REWARD[tier]
}

}
})
phaseState.earlyBattles = earlyBattleScore
phaseState.earlyPlatoons = earlyPlatoonScore

// ----------------------
// APLICAR EARLY NOS PLANETAS (PARA CARRY REAL)
// ----------------------

let earlyTotal = earlyBattleScore + earlyPlatoonScore

if(earlyTotal > 0 && results.length){

  let earlyPerPlanet = earlyTotal / results.length

  results.forEach(p => {
    p.carryOutMin = (p.carryOutMin || 0) + earlyPerPlanet
    p.carryOutMax = (p.carryOutMax || 0) + earlyPerPlanet
  })
}

// ----------------------
// RESULTADO DA FASE
// ----------------------

phaseState.battles = battleScore
phaseState.platoons = platoonScore

phaseState.earlyBattles = earlyBattleScore
phaseState.earlyPlatoons = earlyPlatoonScore
// ----------------------
// CARRY FINAL (APÓS EARLY)
// ----------------------

phaseState.carryMin += earlyBattleScore + earlyPlatoonScore
phaseState.carryMax += earlyBattleScore + earlyPlatoonScore



let realCarryApplied = false

// ----------------------
// GAP PARA PRÓXIMA ESTRELA
// ----------------------
let starGap = Infinity

results.forEach(p=>{

  let starData = planetData[p.name]?.stars || {}

  let stars = calculateStars(p.name, p.scoreMax)

  // se não bateu 3 estrelas, gap é para a próxima estrela
  // se bateu 3 estrelas, não há gap neste planeta
  let nextStar =
    stars === 0 ? starData.one :
    stars === 1 ? starData.two :
    stars === 2 ? starData.three :
    null

  if(nextStar){
    let gap = nextStar - p.scoreMax
    if(gap > 0 && gap < starGap){
      starGap = gap
    }
  }

})

// gap baseado no scoreMax (cenário otimista não bate 3 estrelas)
if(starGap !== Infinity){
  phaseState.starGap = starGap

  // verificar se evento está em andamento (algum resultado real preenchido)
  let eventStarted = false
  for(let i = 1; i <= 6; i++){
    let input = document.getElementById("realPhase" + i)
    if(input && input.value){
      eventStarted = true
      break
    }
  }

  if(eventStarted){
    // durante o evento: crescimento diário necessário até aquela fase
    let daysUntilPhase = Math.max(1, phase - 1)
    phaseState.guildGrowthNeeded = Math.ceil(starGap / daysUntilPhase)
    phaseState.guildGrowthNeededLabel = "por dia até esta fase"
  } else {
    // pré-evento: crescimento total necessário
    phaseState.guildGrowthNeeded = starGap
    phaseState.guildGrowthNeededLabel = "antes do evento"
  }

} else {
  phaseState.starGap = null
  phaseState.guildGrowthNeeded = null
  phaseState.guildGrowthNeededLabel = null
}

// gap baseado no scoreMin (cenário pessimista não bate 3 estrelas)
let starGapMin = Infinity

results.forEach(p => {
  let starData = planetData[p.name]?.stars || {}
  let stars = calculateStars(p.name, p.scoreMin)
  let nextStar =
    stars === 0 ? starData.one :
    stars === 1 ? starData.two :
    stars === 2 ? starData.three :
    null
  if(nextStar){
    let gap = nextStar - p.scoreMin
    if(gap > 0 && gap < starGapMin){
      starGapMin = gap
    }
  }
})

if(starGapMin !== Infinity){
  phaseState.starGapMin = starGapMin

  let guildGP = Number(document.getElementById("guildGP").value) || 1
  let activeGPminValue = activeGPmin || 1
  let ratio = activeGPminValue / guildGP

phaseState.guildGrowthNeededMin = Math.ceil(starGapMin * results.length * (guildGP / activeGPminValue))
} else {
  phaseState.starGapMin = null
  phaseState.guildGrowthNeededMin = null
}
// ----------------------
// CARRY REAL
// ----------------------

let realInput = document.getElementById("realPhase"+phase)

if(realInput && realInput.value){

let realScore = Number(realInput.value)

let realCarry = realScore

phaseState.carryMin = carryMin
phaseState.carryMax = carryMax

results.forEach(p => {
p.carryOutMax = realCarry / results.length
})

realCarryApplied = true

// distribuir carry real

if(phase < 6){

let nextPlanets = getPlanetsOfPhase(phase+1)

if(nextPlanets && nextPlanets.length){

let carryPerPlanet = realCarry / nextPlanets.length

nextPlanets.forEach(name=>{

state.planets[name] ??= {}
state.planets[name].carryIn = carryPerPlanet

})

}

}

}

// ----------------------
// FASE FINAL
// ----------------------

if(phase === 6){
  phaseState.strategy = "final"
}

// ----------------------
// ANÁLISE ESTRATÉGICA DE ESTRELAS
// ----------------------

// só aplica em fases com 2 ou 3 planetas
if(phasePlanets.length >= 2){

  let maxPossibleStars = phasePlanets.length * 3

  // calcular score necessário para cada nível de estrelas da fase
  // somando os thresholds de cada planeta
  let scoreFor = (starLevel) => {
    return results.reduce((s, p) => {
      let sd = planetData[p.name]?.stars || {}
      if(starLevel >= 3) return s + (sd.three || 0)
      if(starLevel >= 2) return s + (sd.two || 0)
      if(starLevel >= 1) return s + (sd.one || 0)
      return s
    }, 0)
  }

  let scoreNeeded6 = scoreFor(3) // todas as 3★
  let scoreNeeded5 = results.reduce((s, p) => {
    // 5★ em fase de 2 planetas = 3★ num + 2★ no outro
    // calculamos como: score total mínimo para ter N estrelas
    let sd = planetData[p.name]?.stars || {}
    return s + (sd.two || 0)
  }, 0) + Math.min(...results.map(p => {
    let sd = planetData[p.name]?.stars || {}
    return (sd.three || 0) - (sd.two || 0)
  }))
  let scoreNeeded4 = scoreFor(2) // todas as 2★

  let phaseScoreMaxVal = results.reduce((s,p) => s + (p.scoreMax||0), 0)
  let phaseScoreMinVal = results.reduce((s,p) => s + (p.scoreMin||0), 0)

  // CENÁRIO A: otimista bate máximo, pessimista não bate
  let cenarioA = (
    phasePlanets.length === 2 &&
    totalStarsMax === maxPossibleStars &&
    totalStarsMin < maxPossibleStars &&
    totalStarsMin >= phasePlanets.length // pelo menos 1★ por planeta
  )

  // CENÁRIO B: ambos ficam abaixo do máximo mas 5★ é alcançável
  // sacrificando a tentativa de 6★
  let cenarioB = false
  let score5starAlcancavel = false

  if(phasePlanets.length === 2){
    // verificar se concentrando GP num planeta consegue 5★
    // 5★ = 3★ num planeta + 2★ no outro
    score5starAlcancavel = phaseScoreMaxVal >= scoreNeeded5
    cenarioB = (
      totalStarsMax < maxPossibleStars &&
      score5starAlcancavel &&
      totalStarsMax >= phasePlanets.length
    )
  }

  if(phasePlanets.length === 3){
    // para 3 planetas: verificar se é possível garantir 2★ em todos
    // mesmo não batendo 3★ em algum
    cenarioB = (
      totalStarsMax < maxPossibleStars &&
      totalStarsMin < totalStarsMax
    )
  }

  phaseState.cenarioA = cenarioA
  phaseState.cenarioB = cenarioB
  phaseState.score5starAlcancavel = score5starAlcancavel
  phaseState.totalStarsMax = totalStarsMax
  phaseState.totalStarsMin = totalStarsMin
  phaseState.maxPossibleStars = maxPossibleStars

}


// ----------------------
// DISTRIBUIR CARRY
// ----------------------

if(!realCarryApplied && phase < 6){

let nextPlanets = getPlanetsOfPhase(phase+1)

if(nextPlanets && nextPlanets.length){

distributeCarry(results,nextPlanets)

}

}


return results

}