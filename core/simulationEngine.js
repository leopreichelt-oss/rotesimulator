// ----------------------
// CALCULAR FASE
// ----------------------

function calculatePhase(phase,guildGP,activeGPmin,activeGPmax){

let phasePlanets = getPlanetsOfPhase(phase)

let results = []

phasePlanets.forEach(name => {

let result = calculatePlanet(
name,
phase,
activeGPmin,
activeGPmax
)

results.push(result)

})

updatePhaseState(phase,results,activeGPmax)

let nextPlanets = getPlanetsOfPhase(phase+1)

if(nextPlanets){
distributeCarry(results,nextPlanets)
}

return results

}


// ----------------------
// ATUALIZAR STATE DA FASE
// ----------------------

function updatePhaseState(phase,results,activeGP){

let totalCarryMin = results.reduce((sum,p)=>sum+p.carryOutMin,0)
let totalCarryMax = results.reduce((sum,p)=>sum+p.carryOutMax,0)

let carryPerPlanet = 0

if(results.length > 0){
carryPerPlanet = totalCarryMax / results.length
}

state.phases[phase].activeGP = activeGP
state.phases[phase].carryIn = results.reduce((sum,p)=>sum+p.carryIn,0)
state.phases[phase].carryPerPlanet = carryPerPlanet
state.phases[phase].carryMin = totalCarryMin
state.phases[phase].carryMax = totalCarryMax

}

function runROTESimulation(){

let guildGP = Number(document.getElementById("guildGP").value)
let players = Number(document.getElementById("players").value)
let inactive = Number(document.getElementById("inactive").value)
let safeMargin = Number(document.getElementById("safe").value)

let phases = {}

for(let phase = 1; phase <= 6; phase++){

// crescimento de GP da guilda
let phaseGP = applyGPGrowth(guildGP, players, phase)

// GP por jogador
let gpPerPlayer = phaseGP / players

// jogadores ativos
let activePlayersMax = players - inactive
let activePlayersMin = players - inactive - safeMargin

// PG ativo
let activeGPmax = gpPerPlayer * activePlayersMax
let activeGPmin = gpPerPlayer * activePlayersMin

// salvar PG entrada da fase
state.phases[phase].activeGP = phaseGP

// calcular fase
phases[phase] = calculatePhase(
phase,
phaseGP,
activeGPmin,
activeGPmax
)

}

// atualizar painel superior
document.getElementById("activeGPmax").innerText =
formatNumber(activeGPmax)

document.getElementById("activeGPmin").innerText =
formatNumber(activeGPmin)

return phases

}
