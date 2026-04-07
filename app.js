window.onload = function(){
  drawPlanetList()
  drawGalaxyMap()
  loadState()
  if (typeof applySimMode === 'function') applySimMode()
  // Restaurar lista de inativos/margem do localStorage (sem precisar resincronizar)
  if (typeof _loadActivityStatusFromStorage === 'function') _loadActivityStatusFromStorage()
  calculate()
  drawROTEHistory()
  updateGPProjectionDisplay()
  if (typeof drawPlatoonList === 'function') drawPlatoonList()
  if (typeof drawFarmCritical === 'function') drawFarmCritical()
}

function togglePhaseDetails(phase, el){
  let box = document.getElementById("phaseDetails"+phase)
  if(!box) return
  box.classList.toggle("hidden")
  if(box.classList.contains("hidden")){
    el.innerText = "▸ detalhes técnicos"
  } else {
    el.innerText = "▾ detalhes técnicos"
  }
}