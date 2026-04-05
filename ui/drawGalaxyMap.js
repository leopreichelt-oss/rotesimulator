function drawGalaxyMap(){

const layer = document.getElementById("planetLayer")
layer.innerHTML = ""

Object.keys(planetData).forEach(name => {

let pos = planetPositions[name]
if(!pos) return

let node = document.createElement("div")
node.className = "planetNode"

let planetState = state.planets?.[name] || {}

let phase = Number(planetState.phase) || 0
if(!planetUnlocked(name)){
node.classList.add("planetLocked")
}
node.classList.add("planet" + phase)

node.style.left = pos.x + "%"
node.style.top = pos.y + "%"

node.innerHTML = name.split(" ").join("<br>")

let starBox = document.createElement("div")
starBox.className = "starContainer"

let stars = planetState.stars || 0

for(let i=0;i<3;i++){
let s = document.createElement("div")
if(i < stars){
s.className = "star gold"
}else{
s.className = "star empty"
}
s.innerText = "★"
starBox.appendChild(s)
}

node.appendChild(starBox)

node.onclick = function(e){
  e.stopPropagation()

  let toggleBox = document.getElementById("specialMissionBox")
  let toggle = document.getElementById("specialMissionToggle")

  toggleBox.style.display = "none"
  toggle.checked = false

  let specialTarget = Object.keys(planetData).find(p => {
    return planetData[p].unlock === "specialMission"
      && planetData[p].missionPlanet === name
  })

  if(specialTarget){
    toggleBox.style.display = "block"
    toggle.checked = state.specialMission?.[name] === true
  }

  if(!state.planets[name]){
    state.planets[name] = {}
  }

  let planetState = state.planets[name]

  document.getElementById("planetFloatName").innerText = name
  document.getElementById("planetPhase").value = planetState.phase || ""
  document.getElementById("possibleBattles").value = planetState.battles || 0
  document.getElementById("platoons").value = planetState.platoons || 0

  // Aplicar visibilidade do modo simulação e status de platoon
  if (typeof applySimMode === 'function') applySimMode()
  if (typeof updatePlanetPlatoonStatus === 'function') updatePlanetPlatoonStatus()

  document.querySelectorAll(".planetNode")
    .forEach(p => p.classList.remove("planetSelected"))
  node.classList.add("planetSelected")

  state.selectedPlanet = name

  // posicionar box próximo ao planeta
  let mapEl = document.getElementById("galaxyMap")
  let mapRect = mapEl.getBoundingClientRect()
  let nodeRect = node.getBoundingClientRect()

  let box = document.getElementById("planetFloatBox")
  box.style.display = "block"

  let left = nodeRect.left - mapRect.left + nodeRect.width + 8
  let top = nodeRect.top - mapRect.top

  // evitar sair pela direita
  if(left + 230 > mapRect.width){
    left = nodeRect.left - mapRect.left - 238
  }

  // evitar sair por baixo
  if(top + 260 > mapRect.height){
    top = mapRect.height - 260
  }

  box.style.left = left + "px"
  box.style.top = top + "px"
}

layer.appendChild(node)

})

}

function closePlanetFloat(){
  document.getElementById("planetFloatBox").style.display = "none"
  document.querySelectorAll(".planetNode")
    .forEach(p => p.classList.remove("planetSelected"))
  state.selectedPlanet = null
}

// fechar ao clicar fora
document.addEventListener("click", function(e){
  let box = document.getElementById("planetFloatBox")
  if(box && !box.contains(e.target)){
    closePlanetFloat()
  }
})