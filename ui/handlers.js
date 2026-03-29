function savePlanet(){

if(!state.selectedPlanet) return

let name = state.selectedPlanet

let phase = Number(document.getElementById("planetPhase").value)
if(!phase){

delete state.planets[name]

saveState()
calculate()

return

}
let battles = document.getElementById("possibleBattles").value
battles = parseInt(battles) || 0

let players = Number(document.getElementById("players").value)
let inactive = Number(document.getElementById("inactive").value)

let activePlayers = players - inactive
let pData = planetData[name]
let multiplier = pData.battleMultiplier || 5

let maxBattles = activePlayers * multiplier

if(battles > maxBattles){
alert("Máximo de batalhas para este planeta: " + maxBattles)
return
}

let platoons = document.getElementById("platoons").value
platoons = parseInt(platoons) || 0

if(platoons > 6){
alert("Máximo de 6 operações de platoon por planeta")
return
}

let planetsInPhase =
Object.values(state.planets)
.filter(p => p.phase == phase).length

let minPhase = pData.phase

if(pData.requirement){
let reqPlanet = state.planets?.[pData.requirement]
if(reqPlanet){
let reqPhase = Number(reqPlanet.phase) || 0
minPhase = Math.max(minPhase, reqPhase + 1)
}
}

if(phase < minPhase){
alert("Devido às fases anteriores, este planeta só pode ser executado na fase " + minPhase)
return
}

if(planetsInPhase >= 3){
alert("Máximo de 3 planetas por fase")
return
}

if(!state.planets[name]){
state.planets[name] = {}
}

state.planets[name].phase = phase
state.planets[name].battles = parseInt(battles) || 0
state.planets[name].platoons = parseInt(platoons) || 0

calculate()
saveState()

}

document.getElementById("guildGP").addEventListener("input", () => {
saveState()
calculate()
updateGPProjectionDisplay()
})

document.getElementById("players").addEventListener("input", () => {
saveState()
calculate()
updateGPProjectionDisplay()
})

document.getElementById("inactive").addEventListener("input", () => {
saveState()
calculate()
updateGPProjectionDisplay()
})

document.getElementById("safe").addEventListener("input", () => {
saveState()
calculate()
})

document.getElementById("dailyGrowth").addEventListener("input", () => {
saveState()
applyGPProjection()
})

document.getElementById("specialMissionToggle")
.addEventListener("change", function(){

let name = state.selectedPlanet
if(!name) return

let specialTarget = Object.keys(planetData).find(p => {
return planetData[p].unlock === "specialMission"
&& planetData[p].missionPlanet === name
})

if(!specialTarget) return

if(!state.specialMission){
state.specialMission = {}
}

state.specialMission[name] = this.checked

calculate()

})

document.querySelectorAll("[id^=realPhase]")
.forEach(input => {
input.addEventListener("input", calculate)
})