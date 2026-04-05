const BATTLE_POINTS = {
1:200000,
2:250000,
3:341250,
4:493594,
5:721744,
6:1151719
}

const PLATOON_REWARD = {
1:10000000,
2:11000000,
3:13200000,
4:18480000,
5:33264000,
6:86486400
}

// ----------------------
// CALCULAR PLANETA
// ----------------------

function calculatePlanet(name,phase,activeGPmin,activeGPmax){

let planet = state.planets[name] || {}

let starData = planetData[name]?.stars || {}

let star1 = starData.one || 0
let star2 = starData.two || 0
let star3 = starData.three || 0

let carryIn = planet.carryIn || 0

let tier = getPlanetTier(name)

let battles = planet.autoBattles !== undefined ? Number(planet.autoBattles) : (Number(planet.battles) || 0)

let planetsInPhase = getPlanetsOfPhase(phase).length || 1

let gpMin = activeGPmin / planetsInPhase
let gpMax = activeGPmax / planetsInPhase

console.log("BATTLES INPUT", name, {
  battlesFromState: planet.battles,
  battlesFinal: battles
})

// ----------------------
// PLATOONS
// ----------------------

let platoonOps = planet.autoPlatoons !== undefined
  ? Number(planet.autoPlatoons)
  : Number(planet.platoons) || 0

let platoonScore =
platoonOps * PLATOON_REWARD[tier]


// ----------------------
// EARLY DEPLOYS
// ----------------------

let earlyBattles =
(planet.earlyBattles || 0) * BATTLE_POINTS[tier]

let earlyPlatoons =
(planet.earlyPlatoons || 0) * PLATOON_REWARD[tier]


// ----------------------
// SCORE INICIAL (sem batalhas)
// ----------------------

let baseScoreMin =
carryIn +
platoonScore +
earlyBattles +
earlyPlatoons +
gpMin

let baseScoreMax =
carryIn +
platoonScore +
earlyBattles +
earlyPlatoons +
gpMax
// ----------------------
// CARRY
// ----------------------




// ----------------------
// VALIDADOR EARLY BATTLES
// ----------------------

let squadGP = 150000 + ((tier - 1) * 5000)

let safeBattles =
Math.floor(battles * 0.8)

let requiredGP =
safeBattles * squadGP

let earlyBattlesPossible = 0

if(baseScoreMax >= requiredGP){

earlyBattlesPossible = safeBattles

}

let earlyBattleScore =
earlyBattlesPossible * BATTLE_POINTS[tier]

// ----------------------
// BATALHAS BASEADAS EM CARRY (CORRETO)
// ----------------------
let totalPlayers = state.players || 50
let inactivePlayers = state.inactivePlayers || 0

let activePlayers = totalPlayers - inactivePlayers

// ----------------------
// BASE SEM GP
// ----------------------

baseScoreMin =
carryIn +
platoonScore +
earlyBattles +
earlyPlatoons

baseScoreMax =
carryIn +
platoonScore +
earlyBattles +
earlyPlatoons

// batalhas calculadas no nível da fase (phaseEngine)
// planetEngine apenas monta o score base sem batalhas
// os valores de battleScoreMax/Min e scoreMax/Min
// serão injetados pelo phaseEngine após este retorno

let battleScoreMax = 0
let battleScoreMin = 0

let scoreMin = baseScoreMin + gpMin
let scoreMax = baseScoreMax + gpMax

let carryOutMin =
Math.max(0, scoreMin - star3)

let carryOutMax =
Math.max(0, scoreMax - star3)

if(phase === 6){
carryOutMin = 0
carryOutMax = 0
}

// ----------------------
// ESTRELAS
// ----------------------

let starsMax = calculateStars(name,scoreMax)
let starsMin = calculateStars(name,scoreMin)

return {

name,
gpUsed: (gpMin + gpMax) / 2,
phase,

carryIn,

carryOutMin,
carryOutMax,

starsMax,
starsMin,

scoreMin,
scoreMax,

battleScoreMax,
battleScoreMin,

earlyBattlesPossible,
earlyBattleScore,

platoonScore

}
}