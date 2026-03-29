function validateCarry(carryOut,nextPlanets){

let perPlanet = carryOut / nextPlanets.length

let warnings=[]

nextPlanets.forEach(name=>{

let star1 = planetData[name]?.stars?.one || 0

if(perPlanet >= star1){

warnings.push({
planet:name,
carry:perPlanet,
limit:star1
})

}

})

return warnings

}