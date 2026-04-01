// ----------------------
// ORQUESTRADOR
// ----------------------

function calculate(){

console.count("CALCULATE")

// limpar fases antigas
state.phases = {}

// limpar carry antigo
Object.values(state.planets).forEach(p => {
if(p.carryIn === undefined){
p.carryIn = 0
}
})

let gp = calculateActiveGP()

let results = runROTESimulation(gp)

state.results = results

applyPlanetResults(results)

simulateExtraPlanetStars()

drawGalaxyMap()
drawPlanetList()
drawPhaseList()
drawPlatoonList()
updateStarCounter()

drawROTEHistory()
}



// ----------------------
// CALCULAR GP ATIVO
// ----------------------

function calculateActiveGP(){

let guildGP = Number(document.getElementById("guildGP").value)
let players = Number(document.getElementById("players").value)
let inactive = Number(document.getElementById("inactive").value)
let safe = Number(document.getElementById("safe").value)

let gpPerPlayer = guildGP / players

let activePlayersMax = players - inactive
let activePlayersMin = players - inactive - safe

let activeGPmax = gpPerPlayer * activePlayersMax
let activeGPmin = gpPerPlayer * activePlayersMin

document.getElementById("activeGPmax").innerText =
formatNumber(activeGPmax)

document.getElementById("activeGPmin").innerText =
formatNumber(activeGPmin)

return {
guildGP,
players,
activeGPmax,
activeGPmin
}

}



// ----------------------
// APLICAR RESULTADOS
// ----------------------

function applyPlanetResults(results){

Object.values(results).forEach(phase => {

phase.forEach(p => {

if(!state.planets[p.name]){
state.planets[p.name] = {}
}

state.planets[p.name].starsMin = p.starsMin
state.planets[p.name].starsMax = p.starsMax

// manter compatibilidade com UI
let avgStars = Math.round((p.starsMin + p.starsMax) / 2)

state.planets[p.name].stars = avgStars
state.planets[p.name].carryOut = p.carryOutMax

})

})

}

//verifica estrela extra na 6a fase:
checkExtraStars()
function checkExtraStars(){

let phase6 = state.phases[6]

if(!phase6) return

let carryFinal = phase6.carryMax || 0

let nextPlanet = state.sequence?.next || null

if(!nextPlanet) return

let star1 = planetData[nextPlanet]?.stars?.one || 0

if(carryFinal >= star1){

state.extraStar = {
planet: nextPlanet,
stars:1
}

}else{

state.extraStar = null

}

}
//-----------------------
//simula estrela extra
//-----------------------
simulateExtraPlanetStars()
function simulateExtraPlanetStars(){

let phase6 = state.phases[6]
if(!phase6) return

let carryFinal = phase6.carryMax || 0

let nextPlanets = getPlanetsOfPhase(7) || []

state.extraStars = []

nextPlanets.forEach(name=>{

let originalCarry = state.planets[name]?.carryIn || 0

state.planets[name] ??= {}
state.planets[name].carryIn = carryFinal

let result = calculatePlanet(
name,
7,
phase6.activeGP,
phase6.activeGP
)

if(result.starsMax >= 1){

state.extraStars.push({
planet:name,
stars:1
})

}

state.planets[name].carryIn = originalCarry

})

}

// ----------------------
// SIMULAÇÃO COMPLETA
// ----------------------

function runROTESimulation(gpData){

let guildGP = gpData.guildGP
let players = gpData.players
let activeGPmax = gpData.activeGPmax
let activeGPmin = gpData.activeGPmin

let phases = {}

for(let phase=1; phase<=6; phase++){

let phaseGP =
applyGPGrowth(guildGP, players, phase)

let results =
calculatePhase(
phase,
phaseGP,
activeGPmin,
activeGPmax
)

phases[phase] = results


}

return phases

}
//--------------------
//contador de estrelas
//--------------------
function updateStarCounter(){

let min = 0
let max = 0

Object.values(state.planets).forEach(p => {

min += p.starsMin || 0
max += p.starsMax || 0

})

document.getElementById("starResult").innerText =
`Estrelas previstas: ${min}★ – ${max}★`

}



