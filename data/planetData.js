const planetData = {
//Mixed side//
Corellia:{
tier:1,
phase:1,
battleMultiplier:4,
requirement:null,
stars:{
one:111718750,
two:178750000,
three:238333333
}
},

Felucia:{
tier:2,
phase:2,
battleMultiplier:5,
requirement:"Corellia",
stars:{
one:148125000,
two:237000000,
three:316000000
}
},

Tatooine:{
tier:3,
phase:3,
battleMultiplier:4,
requirement:"Felucia",
stars:{
one:190953125,
two:305525000,
three:407366667
}
},

Mandalore:{
tier:4,
phase:4,
battleMultiplier:4,
unlock:"specialMission",
missionPlanet:"Tatooine",
stars:{
one:198748651,
two:null,
three:null
}
},


Kessel:{
tier:4,
phase:4,
battleMultiplier:4,
requirement:"Tatooine",
stars:{
one:235143105,
two:400243583,
three:500304479
}
},

Vandor:{
tier:5,
phase:5,
battleMultiplier:4,
requirement:"Kessel",
stars:{
one:341250768,
two:620455942,
three:729948167
}
},

Hoth:{
tier:6,
phase:6,
battleMultiplier:5,
requirement:"Vandor",
stars:{
one:582632425,
two:1059331682,
three:1246272567
}
},

//DarkSide//

Mustafar:{
tier:1,
phase:1,
battleMultiplier:5,
requirement:null,
stars:{
one:116406250,
two:186250000,
three:248333333
}
},

Geonosis:{
tier:2,
phase:2,
battleMultiplier:5,
requirement:"Mustafar",
stars:{
one:148125000,
two:237000000,
three:316000000
}
},

Dathomir:{
tier:3,
phase:3,
battleMultiplier:4,
requirement:"Geonosis",
stars:{
one:158960938,
two:254337500,
three:339116667
}
},

"Haven Medical Station":{
tier:4,
phase:4,
battleMultiplier:4,
requirement:"Dathomir",
stars:{
one:235143105,
two:400243583,
three:500304479
}
},

Malachor:{
tier:5,
phase:5,
battleMultiplier:4,
requirement:"Haven Medical Station",
stars:{
one:341250768,
two:620455942,
three:729948167
}
},

"Death Star":{
tier:6,
phase:6,
battleMultiplier:5,
requirement:"Malachor",
stars:{
one:582632425,
two:1059331682,
three:1246272567
}
},

//LightSide

Coruscant:{
tier:1,
phase:1,
battleMultiplier:5,
requirement:null,
stars:{
one:116406250,
two:186250000,
three:248333333
}
},

Bracca:{
tier:2,
phase:2,
battleMultiplier:4,
requirement:"Coruscant",
stars:{
one:142265625,
two:227625000,
three:303500000
}
},

Zeffo:{
tier:3,
phase:3,
battleMultiplier:4,
unlock:"specialMission",
missionPlanet:"Bracca",
stars:{
one:287179167,
two:null,
three:null
}
},

Kashyyyk:{
tier:3,
phase:3,
battleMultiplier:4,
requirement:"Bracca",
stars:{
one:190953125,
two:305525000,
three:407366667
}
},

Lothal:{
tier:4,
phase:4,
battleMultiplier:4,
requirement:"Kashyyyk",
stars:{
one:246742558,
two:419987333,
three:524984167
}
},

Kafrene:{
tier:5,
phase:5,
battleMultiplier:5,
requirement:"Lothal",
stars:{
one:341250768,
two:620455942,
three:729948167
}
},

Scarif:{
tier:6,
phase:6,
battleMultiplier:5,
requirement:"Kafrene",
stars:{
one:555710999,
two:1010383635,
three:1188686629
}
}

}