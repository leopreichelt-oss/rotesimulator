function gpBattle(t){
return 160000+(t-1)*5000
}

function gpCharacter(t){
return 35000+(t-1)*1000
}

function gpPlatoonOperation(t){
return gpCharacter(t)*15
}

function gpPlatoonPlanet(t){
return gpPlatoonOperation(t)*6
}