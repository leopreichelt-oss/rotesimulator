const PLAYER_GP_GROWTH = 5300

function applyGPGrowth(baseGP, players, phase){

let growth = players * PLAYER_GP_GROWTH * (phase - 1)

return baseGP + growth

}