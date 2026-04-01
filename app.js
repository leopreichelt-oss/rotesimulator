window.onload = function(){
  drawPlanetList()
  drawGalaxyMap()
  loadState()
  calculate()
  drawROTEHistory()
  updateGPProjectionDisplay()
  drawPlatoonList()
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