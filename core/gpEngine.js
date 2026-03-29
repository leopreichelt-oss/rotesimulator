function calculateActiveGP(){

let guildGP =
Number(document.getElementById("guildGP").value) || 0

let players =
Number(document.getElementById("players").value) || 1

let inactive =
Number(document.getElementById("inactive").value) || 0

let safe =
Number(document.getElementById("safe").value) || 0


// evitar divisão por zero
if(players <= 0){
players = 1
}


let gpPerPlayer = guildGP / players


let activePlayersMax =
Math.max(0, players - inactive)

let activePlayersMin =
Math.max(0, players - inactive - safe)


let activeGPmax =
gpPerPlayer * activePlayersMax

let activeGPmin =
gpPerPlayer * activePlayersMin


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