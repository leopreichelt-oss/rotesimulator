const STORAGE_KEY = "rotePlannerState"

function saveState(){

const data = {
guildGP: document.getElementById("guildGP").value,
players: document.getElementById("players").value,
inactive: document.getElementById("inactive").value,
safe: document.getElementById("safe").value,
planets: {}
}

Object.keys(state.planets).forEach(name => {

let p = state.planets[name]

data.planets[name] = {
battles: p.battles || 0,
platoons: p.platoons || 0
}

})

localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

}
function loadState(){

let raw = localStorage.getItem(STORAGE_KEY)
if(!raw) return

let data = JSON.parse(raw)

// restaurar inputs
document.getElementById("guildGP").value = data.guildGP || ""
document.getElementById("players").value = data.players || ""
document.getElementById("inactive").value = data.inactive || ""
document.getElementById("safe").value = data.safe || ""

// restaurar planetas
Object.keys(data.planets || {}).forEach(name => {

if(!state.planets[name]){
state.planets[name] = {}
}

let p = data.planets[name]

state.planets[name].battles = p.battles
state.planets[name].platoons = p.platoons

})

}