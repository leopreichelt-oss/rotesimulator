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

  // Missão especial de desbloqueio: exibição automática baseada no roster
  var specialBox = document.getElementById("specialMissionBox")
  if (specialBox) specialBox.style.display = "none"

  var hasSpecialUnlock = (name === 'Bracca' || name === 'Tatooine')
  if (hasSpecialUnlock && specialBox) {
    var rosterMap = (typeof rosterEngine !== 'undefined') ? rosterEngine.loadActive() : null
    var specialResult = (typeof combatEngine !== 'undefined' && rosterMap)
      ? combatEngine.computeSpecialMissionEligible(name, rosterMap)
      : null

    var statusEl = document.getElementById("specialMissionStatus")
    specialBox.style.display = "flex"

    if (specialResult) {
      var won = specialResult.eligible
      var need = specialResult.winsRequired
      var unlockName = specialResult.unlocks

      if (statusEl) {
        if (won >= need) {
          statusEl.innerHTML = '✅ <strong>' + unlockName + ' desbloqueado</strong> (' + won + ' jogadores elegíveis)'
          statusEl.style.color = "#4ade80"
        } else {
          statusEl.innerHTML =
            won + ' de ' + need + ' jogadores elegíveis' +
            ' — faltam <strong>' + (need - won) + '</strong> para desbloquear ' + unlockName
          statusEl.style.color = won > 0 ? "#f59e0b" : "#f87171"
        }
      }
    } else {
      // Sem roster sincronizado: informar o requisito
      if (statusEl) {
        var reqText = name === 'Bracca'
          ? 'Cal R8+Cere R7 ou JKCK R7+Cere R7 — 30 jogadores para Zeffo'
          : 'Mand\'alor R7+Beskar R7+(IG-12 R7 ou Paz R7) — 30 para Mandalore'
        statusEl.innerHTML = '⚠ Sincronize o roster &nbsp;<span style="color:#475569;">' + reqText + '</span>'
        statusEl.style.color = "#94a3b8"
      }
    }
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
  if (typeof updatePlanetBattleInfo === 'function') updatePlanetBattleInfo(name)

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

  // Em mobile (≤860px) o CSS posiciona o box como modal centrado via fixed —
  // não definir left/top via JS para não sobrescrever o transform do CSS
  if(window.innerWidth > 860){
    let left = nodeRect.left - mapRect.left + nodeRect.width + 8
    let top  = nodeRect.top  - mapRect.top

    // evitar sair pela direita
    if(left + 250 > mapRect.width){
      left = nodeRect.left - mapRect.left - 258
    }
    // evitar sair por baixo
    if(top + 300 > mapRect.height){
      top = Math.max(0, mapRect.height - 300)
    }

    box.style.left = left + "px"
    box.style.top  = top  + "px"
  } else {
    box.style.left = ""
    box.style.top  = ""
  }
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