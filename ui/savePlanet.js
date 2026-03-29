function savePlanet(){

if(!state.selectedPlanet) return

let name = state.selectedPlanet

let phase = document.getElementById("planetPhase").value
let battles = document.getElementById("possibleBattles").value
let platoons = document.getElementById("platoons").value

state.planets[name].phase = phase
state.planets[name].battles = parseInt(battles) || 0
state.planets[name].platoons = parseInt(platoons) || 0

console.log("Planeta salvo:",name,state.planets[name])

}