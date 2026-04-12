/**
 * modEngine.js
 * Avaliação de qualidade de modificadores (mods) por personagem.
 *
 * A API Comlink retorna, em cada rosterUnit, o array equippedStatMod[].
 * Cada mod contém:
 *   - definitionId: string numérica que codifica set e shape
 *       último dígito  (defId % 10)           = shape (1-6)
 *       penúltimo dígito (floor(defId/10)%10) = set   (1-8)
 *   - tier: 1=E(cinza) 2=D(verde) 3=C(azul) 4=B(roxo) 5=A(ouro) 6=S(dourado)
 *   - level: 1-15
 *   - primaryStat.stat.unitStatId: stat do primário
 *   - secondaryStat[]: array de stats secundários
 *       .stat.unitStatId: qual stat
 *       .stat.statValueDecimal: valor × 10000  (ex: 50000 = 5 speed)
 *       .statRolls: número de upgrades aplicados
 *       .roll[]: valores relativos de cada roll (0.0-0.2, max teórico = 0.2)
 *
 * Sets: 1=Health 2=Offense 3=Defense 4=Speed 5=CritChance 6=CritDamage 7=Potency 8=Tenacity
 * Shapes: 1=Square 2=Arrow 3=Diamond 4=Triangle 5=Circle 6=Cross
 *
 * Stat IDs relevantes:
 *   1=Health  5=Speed  17=Defense  18=Defense%
 *   28=Protection  41=Offense  42=Offense%
 *   48=Potency%  49=Tenacity%  53=CritChance%  55=CritDamage%  56=SpecialCritChance%
 *
 * scoreMods(mods, baseId) -> { score:0-100, label, speedBonus, details }
 *   score >= 85 -> "Excelente"
 *   score >= 70 -> "Bom"
 *   score >= 55 -> "Regular"
 *   score >= 40 -> "Fraco"
 *   score  < 40 -> "Ruim"
 *
 * A qualidade é sempre relativa ao perfil do personagem:
 * um mesmo conjunto de mods pode ser "Excelente" para um personagem
 * e "Fraco" para outro com requisitos diferentes.
 */

var modEngine = (function () {

  // -- Mapeamentos ----------------------------------------------------------

  var STAT_NAME = {
    1: 'Health', 5: 'Speed', 17: 'Defense', 18: 'Defense%',
    28: 'Protection', 41: 'Offense', 42: 'Offense%',
    48: 'Potency%', 49: 'Tenacity%', 53: 'CritChance%',
    55: 'CritDamage%', 56: 'SpecialCritChance%'
  }

  var SET_NAME = {
    1: 'Health', 2: 'Offense', 3: 'Defense', 4: 'Speed',
    5: 'CritChance', 6: 'CritDamage', 7: 'Potency', 8: 'Tenacity'
  }

  var SHAPE_NAME = {
    1: 'Square', 2: 'Arrow', 3: 'Diamond',
    4: 'Triangle', 5: 'Circle', 6: 'Cross'
  }

  var TIER_LABEL = { 1: 'E', 2: 'D', 3: 'C', 4: 'B', 5: 'A', 6: 'S' }

  // -- Perfis de mods por personagem ----------------------------------------
  // wantedSets       : sets desejados (checagem proporcional)
  // wantedPrimaries  : { shape -> statId } primario esperado por slot
  // wantedSecondaries: [statIds] que pontuam positivamente
  // speedWeight      : 0-1 (quanto speed importa vs outros stats)
  // minSpeedMods     : speed mínimo esperado APENAS dos mods secundários
  //                    (não inclui base do personagem). Ausente = sem verificação.
  //                    Referência: speed total alvo menos base aprox. do char.
  //                    Ex: JMK alvo 340 total, base ~175 → minSpeedMods: 140
  // minSpeedMods: calculado a partir do speed real de mods do jogador #1 GP (allycode 666716133)
  // Fórmula: speedWeight 1.0 → 75% do real; 0.8–0.9 → 70%; 0.7 → 65%; ≤0.6 → sem mínimo
  var CHARACTER_PROFILES = {
    // GL / topo
    'GLREY':              { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods: 130 }, // real:150 → 112, mantém 130 (padrão comunidade)
    'GRANDMASTERLUKE':    { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods: 120 }, // real:137 → 103, mantém 120
    'LORDVADER':          { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.9, minSpeedMods:  95 }, // real:131 → 92
    'JABBATHEHUTT':       { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  85 }, // real:117 → 88
    'JEDIMASTERKENOBI':   { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods: 140 }, // real:132 → 99, mantém 140
    // DS
    'DARTHMALGUS':        { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods: 105 }, // real:141 → 106
    'DARTHREVAN':         { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  95 }, // real:128 → 96
    'GRANDINQUISITOR':    { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  90 }, // real:121 → 91
    'DOCTORAPHRA':        { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:55, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  85 }, // real:117 → 88
    'GEONOSIANBROODALPHA':{ wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  75 }, // real:110 → 77
    'MERRIN':             { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:55, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  60 }, // real:80 → 60 (mods não-speed nesse roster)
    'MALAK':              { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  70 }, // real:~105 → 74
    // LS
    'GENERALSKYWALKER':   { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods: 100 }, // real:134 → 100
    'PADMEAMIDALA':       { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods: 100 }, // real:133 → 100
    'GENERALKENOBI':      { wantedSets: [1,1,4], wantedPrimaries: { 2:5, 3:49, 4:55, 5:28, 6:1  }, wantedSecondaries: [5,28,1,49],   speedWeight: 0.6 },                    // tank — sem mínimo
    'BOKATAN':            { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods: 100 }, // real:135 → 101
    'CASSIANANDORS1':     { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:55, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  70 }, // real:95 → 71
    'HUNTER':             { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  80 }, // real:120 → 84
    'HERMITYODA':         { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.7, minSpeedMods:  65 }, // real:106 → 69
    'CT7567':             { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:55, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  95 }, // real:125 → 94
    'CALKESTIS':          { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0 },                    // sem mín — mods não-speed nesse roster (43 real)
    'JEDIKNIGHTREVAN':    { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  90 }, // real:122 → 92
    // Suporte / tank
    'BASTILASHAN':        { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  80 }, // real:108 → 81
    'DARTHSION':          { wantedSets: [1,3,4], wantedPrimaries: { 2:5, 3:49, 4:28, 5:28, 6:1  }, wantedSecondaries: [5,28,1,49],   speedWeight: 0.7, minSpeedMods:  65 }, // real:109 → 71
    'DARTHTRAYA':         { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  70 }, // real:96 → 72
    // GL / topo (adicionais)
    'SUPREMELEADERKYLOREN':   { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.9, minSpeedMods:  95 }, // real:137 → 96
    'SITHETERNALPALPATINE':   { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  80 }, // estimativa ~110 → 83
    'GLAHSOKATANO':           { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods: 120 }, // real:126 → 95, mantém 120
    'JEDIMASTERMACEWINDU':    { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods: 120 }, // real:156 → 117, mantém 120
    // Imperial Remnant (Peridea)
    'CAPTAINENOCH':           { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  95 }, // real:130 → 98
    'NIGHTTROOPER':           { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  90 }, // real:129 → 90
    'DEATHTROOPERPERIDEA':    { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  80 }, // real:119 → 83
    // Executor crew (DS Imperio)
    'VADER':                  { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  95 }, // real:136 → 95
    'ADMIRALPIETT':           { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  95 }, // real:125 → 94
    'GRANDADMIRALTHRAWN':     { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,49],  speedWeight: 1.0, minSpeedMods: 120 }, // real:132 → 99, mantém 120
    'DEATHTROOPER':           { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  65 }, // real:99 → 69
    'MOFFGIDEONTROOPER':      { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  90 }, // ref MOFFGIDEONS3:122 → 92
    'EMPERORPALPATINE':       { wantedSets: [4,4,7], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  70 }, // real:98 → 74
    'MARAJADE':               { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  85 }, // real:127 → 89
    // Profundity crew (LS Rogue One)
    'ADMIRALRADDUS':          { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,49],  speedWeight: 1.0, minSpeedMods:  80 }, // real:107 → 80
    'JYNERSO':                { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:55, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  85 }, // real:113 → 85
    'K2SO':                   { wantedSets: [1,1,4], wantedPrimaries: { 2:5, 3:49, 4:28, 5:28, 6:1  }, wantedSecondaries: [5,28,1,49],   speedWeight: 0.5 },                    // tank — sem mínimo
    'SCARIFPATHFINDER':       { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  70 }, // estimativa ~105 → 74
    // LS Jedi / Rebeldes
    'COMMANDERAHSOKA':        { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods: 135 }, // real:140 → 105, mantém 135
    'JEDIKNIGHTLUKE':         { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.7, minSpeedMods:  70 }, // real:115 → 75
    'COMMANDERLUKESKYWALKER': { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  90 }, // real:130 → 91
    'GRANDMASTERYODA':        { wantedSets: [4,4,7], wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  95 }, // real:127 → 95
    'AHSOKATANO':             { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  85 }, // real:116 → 87
    'ANAKINKNIGHT':           { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  75 }, // real:111 → 78
    'JEDIKNIGHTCAL':          { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:49, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  70 }, // real:98 → 74
    'BOKATANMANDALORE':       { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  80 }, // estimativa ~110 → 83
    // FO / outros DS
    'KYLORENUNMASKED':        { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  85 }, // real:125 → 88
    'GENERALHUX':             { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  75 }, // real:102 → 77
    'DARTHMALAK':             { wantedSets: [6,6,2], wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 0.8, minSpeedMods:  70 }, // real:105 → 74
    'DARTHNIHILUS':           { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  75 }, // real:104 → 78
    'BASTILASHANDARK':        { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,48],  speedWeight: 1.0, minSpeedMods:  90 }, // real:122 → 92
    // Padrão speed-focused
    'DEFAULT':                { wantedSets: [4,4],   wantedPrimaries: { 2:5, 3:48, 4:56, 5:53, 6:55 }, wantedSecondaries: [5,41,42,53],  speedWeight: 1.0, minSpeedMods:  70 }
  }

  // -- Speed mínimo por personagem (sem perfil específico) ------------------
  // Derivado do jogador #1 GP (allycode 666716133), fórmula: floor(speed_real * 0.75)
  // 0 = sem mínimo (sobrescreve o DEFAULT de 70 para chars com speed baixo)
  // Chars que JÁ TÊM perfil em CHARACTER_PROFILES não aparecem aqui.
  var DEFAULT_SPEED_MINS = {
    '4LOM':99, '50RT':67, 'AAYLASECURA':93, 'ADMINISTRATORLANDO':104, 'AMILYNHOLDO':65,
    'APPO':90, 'ARCTROOPER501ST':82, 'ARMORER':87, 'ASAJJDARKDISCIPLE':90, 'ASAJVENTRESS':81,
    'AURRA_SING':88, 'B1BATTLEDROIDV2':92, 'B2SUPERBATTLEDROID':69, 'BADBATCHECHO':93, 'BADBATCHHUNTER':87,
    'BADBATCHOMEGA':94, 'BADBATCHTECH':82, 'BADBATCHWRECKER':93, 'BARRISSOFFEE':79, 'BATCHERS3':90,
    'BAYLANSKOLL':92, 'BAZEMALBUS':99, 'BB8':79, 'BENSOLO':97, 'BIGGSDARKLIGHTER':84,
    'BISTAN':80, 'BOBAFETT':106, 'BOBAFETTSCION':78, 'BODHIROOK':90, 'BOOMADIER':82,
    'BOSSK':93, 'BOSSNASS':87, 'BOUSHH':83, 'BRUTUS':77, 'BT1':84,
    'C3POCHEWBACCA':76, 'C3POLEGENDARY':81, 'CADBANE':78, 'CANDEROUSORDO':60, 'CAPTAINDROGAN':89,
    'CAPTAINREX':90, 'CAPTAINSILVO':86, 'CAPTAINTARPALS':82, 'CARADUNE':88, 'CARTHONASI':99,
    'CASSIANANDOR':71, 'CC2224':74, 'CEREJUNDA':0, 'CHEWBACCALEGENDARY':77, 'CHIEFCHIRPA':72,
    'CHIEFNEBIT':65, 'CHIRRUTIMWE':71, 'CHOPPERS3':70, 'CLONESERGEANTPHASEI':117, 'CLONEWARSCHEWBACCA':87,
    'COLONELSTARCK':78, 'CORUSCANTUNDERWORLDPOLICE':90, 'COUNTDOOKU':93, 'CROSSHAIRS3':96, 'CT210408':56,
    'CT5555':56, 'DAKA':99, 'DARKREY':90, 'DARKTROOPER':108, 'DARTHBANE':83,
    'DARTHSIDIOUS':91, 'DASHRENDAR':75, 'DATHCHA':88, 'DENGAR':73, 'DEPABILLABA':87,
    'DIRECTORKRENNIC':70, 'DISGUISEDCLONETROOPER':87, 'DROIDEKA':79, 'EETHKOTH':101, 'EIGHTHBROTHER':78,
    'EMBO':84, 'ENFYSNEST':0, 'EPIXFINN':84, 'EPIXPOE':83, 'EWOKELDER':67,
    'EWOKSCOUT':109, 'EZRABRIDGERS3':70, 'EZRAEXILE':95, 'FENNECSHAND':92, 'FIFTHBROTHER':90,
    'FINN':96, 'FIRSTORDEREXECUTIONER':69, 'FIRSTORDEROFFICERMALE':78, 'FIRSTORDERSPECIALFORCESPILOT':84, 'FIRSTORDERTIEPILOT':72,
    'FIRSTORDERTROOPER':95, 'FOSITHTROOPER':102, 'FULCRUMAHSOKA':78, 'GAMORREANGUARD':93, 'GARSAXON':87,
    'GENERALSYNDULLA':93, 'GEONOSIANSOLDIER':84, 'GEONOSIANSPY':72, 'GLHONDO':114, 'GLLEIA':98,
    'GRANDMOFFTARKIN':93, 'GREATMOTHERS':80, 'GREEDO':64, 'GREEFKARGA':90, 'GRIEVOUS':87,
    'GUNGANPHALANX':96, 'HANSOLO':97, 'HERASYNDULLAS3':74, 'HK47':96, 'HONDO':85,
    'HOTHHAN':88, 'HOTHLEIA':0, 'HOTHREBELSCOUT':81, 'HOTHREBELSOLDIER':108, 'HUMANTHUG':83,
    'HUNTERS3':90, 'HUYANG':75, 'IDENVERSIOEMPIRE':76, 'IG11':89, 'IG12':77,
    'IG86SENTINELDROID':112, 'IG88':77, 'IG90':81, 'IMAGUNDI':109, 'IMPERIALPROBEDROID':64,
    'IMPERIALSUPERCOMMANDO':81, 'INQUISITORBARRISS':95, 'ITHANO':75, 'JANGOFETT':89, 'JARJARBINKS':83,
    'JAWA':77, 'JAWAENGINEER':70, 'JAWASCAVENGER':81, 'JEDIKNIGHTCONSULAR':97, 'JEDIKNIGHTGUARDIAN':113,
    'JOCASTANU':75, 'JOLEEBINDO':98, 'JUHANI':70, 'KELLERANBEQ':96, 'KIADIMUNDI':111,
    'KITFISTO':76, 'KIX':79, 'KRRSANTAN':91, 'KUIIL':89, 'KYLEKATARN':104,
    'KYLOREN':87, 'L3_37':87, 'LOBOT':81, 'LOGRAY':61, 'LUKESKYWALKER':63,
    'LUMINARAUNDULI':69, 'LUTHENRAEL':79, 'MACEWINDU':93, 'MAGMATROOPER':75, 'MAGNAGUARD':54,
    'MANDALORBOKATAN':75, 'MARROK':99, 'MASTERQUIGON':91, 'MAUL':61, 'MAULHATEFUELED':111,
    'MAULS7':104, 'MAZKANATA':90, 'MISSIONVAO':81, 'MOFFGIDEONS1':92, 'MOFFGIDEONS3':91,
    'MONMOTHMA':83, 'MORGANELSBETH':89, 'MOTHERTALZIN':84, 'NIGHTSISTERACOLYTE':80, 'NIGHTSISTERINITIATE':92,
    'NIGHTSISTERSPIRIT':72, 'NIGHTSISTERZOMBIE':66, 'NINTHSISTER':96, 'NUTEGUNRAY':78, 'OLDBENKENOBI':78,
    'OMEGAS3':75, 'OPERATIVE':97, 'PADAWANOBIWAN':105, 'PADAWANSABINE':96, 'PAO':77,
    'PAPLOO':81, 'PAZVIZSLA':99, 'PHASMA':88, 'PLOKOON':84, 'POE':88,
    'POGGLETHELESSER':79, 'PRINCESSKNEESAA':72, 'PRINCESSLEIA':110, 'QIRA':77, 'QUEENAMIDALA':93,
    'QUIGGOLD':103, 'QUIGONJINN':111, 'R2D2_LEGENDARY':82, 'RANGETROOPER':85, 'RESISTANCEPILOT':66,
    'RESISTANCETROOPER':81, 'REY':94, 'REYJEDITRAINING':90, 'ROSETICO':77, 'ROYALGUARD':56,
    'SABINEWRENS3':81, 'SANASTARROS':80, 'SATELESHAN':87, 'SAVAGEOPRESS':79, 'SAWGERRERA':75,
    'SCARIFREBEL':93, 'SCORCH':106, 'SCOUTTROOPER_V3':94, 'SECONDSISTER':78, 'SEVENTHSISTER':93,
    'SHAAKTI':96, 'SHINHATI':108, 'SHORETROOPER':92, 'SITHASSASSIN':81, 'SITHMARAUDER':92,
    'SITHPALPATINE':102, 'SITHTROOPER':0, 'SM33':108, 'SMUGGLERCHEWBACCA':72, 'SMUGGLERHAN':82,
    'SNOWTROOPER':92, 'STAP':89, 'STARKILLER':105, 'STORMTROOPER':66, 'STORMTROOPERHAN':85,
    'STORMTROOPERLUKE':84, 'STRANGER':110, 'SUNFAC':103, 'T3_M4':78, 'TALIA':109,
    'TARFFUL':76, 'TARONMALICOS':95, 'TEEBO':113, 'THEMANDALORIAN':66, 'THEMANDALORIANBESKARARMOR':93,
    'THIRDSISTER':108, 'TIEFIGHTERPILOT':84, 'TRENCH':81, 'TRIPLEZERO':84, 'TUSKENCHIEFTAIN':80,
    'TUSKENHUNTRESS':81, 'TUSKENRAIDER':83, 'TUSKENSHAMAN':87, 'UGNAUGHT':114, 'UNDERCOVERLANDO':90,
    'URORRURRR':66, 'VADERDUELSEND':100, 'VANE':95, 'VANGUARDTEMPLEGUARD':96, 'VEERS':95,
    'VISASMARR':74, 'WAMPA':78, 'WATTAMBOR':72, 'WEDGEANTILLES':63, 'WICKET':75,
    'WRECKERS3':81, 'YODACHEWBACCA':81, 'YOUNGCHEWBACCA':78, 'YOUNGHAN':70, 'YOUNGLANDO':78,
    'ZAALBAR':78, 'ZAMWESELL':78, 'ZEBS3':74, 'ZORIIBLISS_V2':90, 'ZUCKUSS':88
  }

  // -- Decodificacao do definitionId ----------------------------------------
  function decodeModDef (defId) {
    var n = parseInt(defId)
    return { shape: n % 10, set: Math.floor(n / 10) % 10 }
  }

  // -- Velocidade total nos secundarios (valor real; divisor 10000) ----------
  function totalSpeedFromMods (mods) {
    var total = 0
    mods.forEach(function (m) {
      ;(m.secondaryStat || []).forEach(function (s) {
        if (s.stat.unitStatId === 5) total += parseInt(s.stat.statValueDecimal) / 10000
      })
    })
    return Math.round(total)
  }

  // -- Eficiencia media de um stat secundario (roll medio / 0.2 ideal) ------
  function statEfficiency (sec) {
    if (!sec.roll || sec.roll.length === 0) return 0
    var avg = sec.roll.reduce(function (a, b) { return a + parseFloat(b) }, 0) / sec.roll.length
    return avg / 0.2
  }

  // -- Pontuacao principal ---------------------------------------------------
  // Scoring breakdown (max 100 pts):
  //   Tier medio dos mods          : ate 30 pts
  //   Level medio dos mods         : ate 10 pts
  //   Sets corretos para o char    : ate 15 pts
  //   Primarios corretos por shape : ate 15 pts
  //   Speed nos secundarios        : ate 30 pts x speedWeight
  //   Secundarios desejados        : ate (30 x (1-speedWeight) + 10) pts
  function scoreMods (mods, baseId) {
    if (!mods || mods.length === 0) {
      return { score: 0, label: 'Sem mods', speedBonus: 0, details: {} }
    }

    var profile = CHARACTER_PROFILES[baseId] || CHARACTER_PROFILES['DEFAULT']
    // Sobrescreve minSpeedMods do DEFAULT com valor específico do personagem (se existir)
    if (!CHARACTER_PROFILES[baseId] && DEFAULT_SPEED_MINS[baseId] !== undefined) {
      profile = Object.assign({}, profile, { minSpeedMods: DEFAULT_SPEED_MINS[baseId] })
    }

    // 1. Tier
    var avgTier = mods.reduce(function (a, m) { return a + m.tier }, 0) / mods.length
    var tierScore = (avgTier / 6) * 30

    // 2. Level
    var avgLevel = mods.reduce(function (a, m) { return a + m.level }, 0) / mods.length
    var levelScore = (avgLevel / 15) * 10

    // 3. Sets
    var modSets = mods.map(function (m) { return decodeModDef(m.definitionId).set })
    var setScore = 0
    profile.wantedSets.forEach(function (ws) {
      var idx = modSets.indexOf(ws)
      if (idx >= 0) { modSets.splice(idx, 1); setScore += 15 / profile.wantedSets.length }
    })

    // 4. Primarios
    var primaryHits = 0; var primaryChecks = 0
    mods.forEach(function (m) {
      var dec = decodeModDef(m.definitionId)
      var wanted = profile.wantedPrimaries[dec.shape]
      if (wanted !== undefined) {
        primaryChecks++
        if (m.primaryStat.stat.unitStatId === wanted) primaryHits++
      }
    })
    var primaryScore = primaryChecks > 0 ? (primaryHits / primaryChecks) * 15 : 0

    // 5. Speed
    var speedTotal = totalSpeedFromMods(mods)
    var rawSp = speedTotal >= 30 ? 30 : speedTotal >= 25 ? 25 : speedTotal >= 20 ? 20
              : speedTotal >= 15 ? 15 : speedTotal >= 10 ? 10 : speedTotal >= 5 ? 5 : 0
    var speedScore = rawSp * profile.speedWeight

    // 6. Secundarios desejados
    var secBudget = 30 * (1 - profile.speedWeight) + 10
    var secRaw = 0
    mods.forEach(function (m) {
      ;(m.secondaryStat || []).forEach(function (s) {
        if (profile.wantedSecondaries.indexOf(s.stat.unitStatId) >= 0) {
          secRaw += statEfficiency(s) * (secBudget / (6 * 4))
        }
      })
    })
    var secScore = Math.min(secRaw, secBudget)

    var total = Math.min(100, Math.round(tierScore + levelScore + setScore + primaryScore + speedScore + secScore))

    // 7. Penalidade de speed mínimo
    // Se o personagem tem minSpeedMods e o speed dos mods está abaixo, reduz o score.
    // A penalidade é proporcional ao gap: até -15 pts quando speed = 0.
    var speedWarning = false
    if (profile.minSpeedMods && speedTotal < profile.minSpeedMods) {
      speedWarning = true
      var gap = profile.minSpeedMods - speedTotal
      var penalty = Math.round(Math.min(15, gap * 0.5))
      total = Math.max(0, total - penalty)
    }

    var label = total >= 85 ? 'Excelente' : total >= 70 ? 'Bom' : total >= 55 ? 'Regular'
              : total >= 40 ? 'Fraco' : 'Ruim'

    return {
      score: total, label: label, speedBonus: speedTotal, speedWarning: speedWarning,
      speedMin: profile.minSpeedMods || null,
      details: {
        tier:        Math.round(tierScore),
        level:       Math.round(levelScore),
        sets:        Math.round(setScore),
        primaries:   Math.round(primaryScore),
        speed:       Math.round(speedScore),
        secondaries: Math.round(secScore)
      }
    }
  }

  // -- Resumo para tooltip / briefing ---------------------------------------
  // Ex: "73 Bom (+18 spd)" ou "73 Bom (+18 spd ⚠spd<140)"
  function modSummary (mods, baseId) {
    if (!mods || mods.length === 0) return 'Sem mods'
    var r = scoreMods(mods, baseId)
    var warn = r.speedWarning ? ' ⚠spd<' + r.speedMin : ''
    return r.score + ' ' + r.label + ' (+' + r.speedBonus + ' spd' + warn + ')'
  }

  // -- API publica ----------------------------------------------------------
  return {
    scoreMods:          scoreMods,
    modSummary:         modSummary,
    totalSpeedFromMods: totalSpeedFromMods,
    decodeModDef:       decodeModDef,
    hasProfile:         function (baseId) { return !!CHARACTER_PROFILES[baseId] },
    CHARACTER_PROFILES: CHARACTER_PROFILES,
    STAT_NAME:          STAT_NAME,
    SET_NAME:           SET_NAME,
    SHAPE_NAME:         SHAPE_NAME,
    TIER_LABEL:         TIER_LABEL
  }
})()
