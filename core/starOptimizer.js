function optimizePhaseStars(results, carry, planetCount){

// se 3 planetas → sem carry
if(planetCount === 3){
return {updatedResults:results, remainingCarry:0}
}

let bestPlanets = results
let bestCarry = carry
let bestStars = results.reduce((s,p)=>s+calculateStars(p.name,p.scoreMax),0)

// gerar cenários possíveis
let scenarios = []

for(let i=0;i<results.length;i++){

let p = results[i]
let starData = planetData[p.name].stars

let targets = [
starData.one,
starData.two,
starData.three
]

targets.forEach(target=>{

let cost = target - p.scoreMax

if(cost > 0 && cost <= carry){

let clone = results.map(x=>({...x}))

clone[i].scoreMax = target

scenarios.push(clone)

}

})

}

// avaliar cenários
for(let scenario of scenarios){

let stars = scenario.reduce(
(s,p)=>s+calculateStars(p.name,p.scoreMax),
0
)

let scoreUsed = scenario.reduce((s,p)=>{

let starData = planetData[p.name].stars
let stars = calculateStars(p.name,p.scoreMax)

if(stars===3) return s+starData.three
if(stars===2) return s+starData.two
if(stars===1) return s+starData.one

return s

},0)

let phaseScore = scenario.reduce((s,p)=>s+(p.scoreMax||0),0)

let remainingCarry = Math.max(0,phaseScore-scoreUsed)

if(
stars > bestStars ||
(stars === bestStars && remainingCarry < bestCarry)
){
bestPlanets = scenario
bestStars = stars
bestCarry = remainingCarry
}

}

return {
updatedResults:bestPlanets,
remainingCarry:bestCarry
}

}