/**
 * combatData.js
 * Dados de elegibilidade de batalhas por planeta, gerados de tb_combat_eligibility_all_planets.json
 *
 * Tipos de missão:
 *   'squad'   — batalha de esquadrão (2 ondas, pontuação completa)
 *   'ship'    — batalha de nave (1 onda, pontuação diferente)
 *   'special' — missão especial (material/desbloqueia planeta, SEM pontuação de GP)
 *
 * Missões especiais (type:'special'):
 *   - Cada jogador pode fazer APENAS 1 VEZ (não se repete por fase)
 *   - NÃO entram no cálculo de early battles
 *   - Premiação é material/fragmentos ou desbloqueia planeta
 *
 * Missões normais (squad/ship):
 *   - Podem ser feitas 1x POR FASE (early battles incluídas)
 *
 * relicBonus:true — missão exige personagens 1 grau acima do tier do planeta
 *
 * Cada missão tem:
 *   eligible   — squads que VENCEM (apenas 1 batalha por missão, independente de quantos squads)
 *   ineligible — squads que o jogador tem mas NÃO vence ainda
 *   type       — 'squad' | 'ship' | 'special'
 *   waves      — 2 para squad, 1 para ship/special
 *
 * safeBattles (80% do total de batalhas elegíveis) cobre:
 *   - Falsos positivos do bot
 *   - Jogadores sem tempo na fase
 *   - 20% das batalhas elegíveis que podem não vencer a 2ª onda
 */

// Mapa de URL local dos mapas
var PLANET_MAP_URL = {
  "Mustafar":                    "assets/maps/Mustafar-labelled.png",
  "Corellia":                    "assets/maps/Corellia-labelled.png",
  "Coruscant":                   "assets/maps/Coruscant-labelled.png",
  "Geonosis":                    "assets/maps/Geonosis-labelled.png",
  "Felucia":                     "assets/maps/Felucia-labelled.png",
  "Bracca":                      "assets/maps/Bracca-labelled.png",
  "Dathomir":                    "assets/maps/Dathomir-labelled.png",
  "Tatooine":                    "assets/maps/Tatooine-labelled.png",
  "Kashyyyk":                    "assets/maps/Kashyyyk-labelled.png",
  "Haven Medical Station":       "assets/maps/Haven-class_Medical_Station-labelled.png",
  "Kessel":                      "assets/maps/Kessel-labelled.png",
  "Lothal":                      "assets/maps/Lothal-labelled.png",
  "Malachor":                    "assets/maps/Malachor-labelled.png",
  "Vandor":                      "assets/maps/Vandor-labelled.png",
  "Kafrene":                     "assets/maps/Ring_of_Kafrene-labelled.png",
  "Death Star":                  "assets/maps/Death_Star-labelled.png",
  "Hoth":                        "assets/maps/Hoth-labelled.png",
  "Scarif":                      "assets/maps/Scarif-labelled.png",
  "Zeffo":                       "assets/maps/Zeffo-labelled.png",
  "Mandalore":                   "assets/maps/Mandalore-labelled.png"
}

/**
 * Pontuação de GP por tipo de batalha e tier do planeta.
 *
 * squad1 = missão de esquadrão com 1 onda (máximo)
 * squad2 = missão de esquadrão com 2 ondas (padrão)
 * ship   = missão de frota (1 onda, pontuação maior)
 *
 * Fonte: valores exatos fornecidos pela guilda.
 */
var BATTLE_SCORE = {
  1: { squad1:  100000, squad2:  200000, ship:   400000 },
  2: { squad1:  125000, squad2:  250000, ship:   500000 },
  3: { squad1:  162500, squad2:  341250, ship:   682500 },
  4: { squad1:  219375, squad2:  493594, ship:   987188 },
  5: { squad1:  307125, squad2:  721744, ship:  1443488 },
  6: { squad1:  460688, squad2: 1151719, ship:  2303438 }
}

/**
 * Piloto principal de cada nave usada em missões de batalha.
 * Usado para checar se o piloto está no relic mínimo do tier (garante vitória).
 *
 * Capital ships: o comandante que pilota/lidera a frota.
 * Ships de combate: o piloto do cockpit.
 *
 * Garante vitória na batalha de frota: piloto no tier+1 (minRelic+1).
 * Piloto no tier (minRelic): multiplicador reduzido (0.6×).
 */
var SHIP_PILOT = {
  // ── Capital ships ─────────────────────────────────────────────────────
  'CAPITALEXECUTOR':          'VADER',
  'CAPITALPROFUNDITY':        'ADMIRALRADDUS',
  'CAPITALNEGOTIATOR':        'GENERALKENOBI',
  'CAPITALLEVIATHAN':         'DARTHMALGUS',
  'CAPITALCHIMAERA':          'GRANDADMIRALTHRAWN',
  'CAPITALMALEVOLENCE':       'GRIEVOUS',
  'CAPITALRADDUS':            'ADMIRALRADDUS',
  'CAPITALFINALIZER':         'KYLORENUNMASKED',
  'CAPITALSTARDESTROYER':     'GRANDMOFFTARKIN',
  'CAPITALJEDICRUISER':       'PADMEAMIDALA',
  'CAPITALMONCALAMARICRUISER':'ADMIRALACKBAR',

  // ── Galactic Republic / Clone Wars ────────────────────────────────────
  'ARC170CLONESERGEANT':      'CLONESERGEANTPHASEI',
  'ARC170REX':                'CT7567',
  'BLADEOFDORIN':             'PLOKOON',
  'JEDISTARFIGHTERANAKIN':    'ANAKINKNIGHT',
  'JEDISTARFIGHTERCONSULAR':  'JEDIKNIGHTCONSULAR',
  'UMBARANSTARFIGHTER':       'CT210408',
  'YWINGCLONEWARS':           'BARRISSOFFEE',

  // ── CIS / Separatistas ────────────────────────────────────────────────
  'GEONOSIANSTARFIGHTER2':    'GEONOSIANSOLDIER',
  'GEONOSIANSTARFIGHTER3':    'SUNFAC',
  'HYENABOMBER':              'POGGLETHELESSER',
  'STAP':                     'B1BATTLEDROIDV2',
  'VULTUREDROID':             'DROIDEKA',

  // ── Old Republic / Império Sith ───────────────────────────────────────
  'EBONHAWK':                 'CARTHONASI',
  'FURYCLASSINTERCEPTOR':     'DARTHREVAN',
  'SITHFIGHTER':              'SITHASSASSIN',
  'SITHBOMBER':               'SITHMARAUDER',
  'SITHINFILTRATOR':          'MAUL',

  // ── Império Galáctico ─────────────────────────────────────────────────
  'COMMANDSHUTTLE':           'ADMIRALPIETT',
  'EMPERORSSHUTTLE':          'EMPERORPALPATINE',
  'IDENVERSIOEMPIRE':         'IDENVERSIOEMPIRE',
  'TIEADVANCED':              'VADER',
  'TIEBOMBERIMPERIAL':        'COLONELSTARCK',
  'TIEFIGHTERFIRSTORDER':     'FIRSTORDERTROOPER',
  'TIEFIGHTERFOSF':           'FIRSTORDERSPECIALFORCESPILOT',
  'TIEINTERCEPTOR':           'ROYALGUARD',
  'TIEREAPER':                'DIRECTORKRENNIC',
  'TIESILENCER':              'KYLORENUNMASKED',
  'SITHSUPREMACYCLASS':       'SUPREMELEADERKYLOREN',

  // ── Rebeldes / LS ─────────────────────────────────────────────────────
  'COMEUPPANCE':              'AMILYNHOLDO',
  'MG100STARFORTRESSSF17':    'ROSETICO',
  'MILLENNIUMFALCONPRISTINE': 'HANSOLO',
  'RAVENSCLAW':               'KYLEKATARN',
  'UWINGROGUEONE':            'CASSIANANDOR',
  'UWINGSCARIF':              'BODHIROOK',
  'XWINGBLACKONE':            'EPIXPOE',
  'XWINGRED2':                'WEDGEANTILLES',
  'XWINGRED3':                'BIGGSDARKLIGHTER',
  'XWINGRESISTANCE':          'RESISTANCEPILOT',
  'YWINGREBEL':               'HOTHREBELSCOUT',

  // ── Caçadores / Mistos ────────────────────────────────────────────────
  'IG2000':                   'IG88',
  'XANADUBLOOD':              'AURRA_SING',

  // ── Ships nomeados já mapeados ────────────────────────────────────────
  'SCYTHE':                   'LORDVADER',
  'GHOST':                    'HERASYNDULLAS3',
  'OUTRIDER':                 'DASHRENDAR',
  'GAUNTLETSTARFIGHTER':      'BOKATANMANDALORE',
  'TIEFIGHTERIMPERIAL':       'TIEFIGHTERPILOT',
  'MILLENNIUMFALCON':         'YOUNGLANDO',
  'SLAVE1':                   'BOBAFETT',
  'HOUNDSTOOTH':              'BOSSK',
  'RAZORCREST':               'THEMANDALORIAN',
  'PHANTOM2':                 'CHOPPERS3',
}

/**
 * Missões de batalha por planeta.
 * type:
 *   'squad'   = missão de esquadrão (waves:1 ou waves:2)
 *   'ship'    = missão de frota (waves:1, pontuação de nave)
 *   'special' = sem pontuação de GP (material / desbloqueia planeta)
 *
 * eligibleCount  = número de squads elegíveis (mas apenas 1 batalha por missão)
 * ineligibleCount = squads que o jogador tem mas não vence
 */
var PLANET_COMBAT_DATA = {

  "Mustafar": {
    mapUrl: PLANET_MAP_URL["Mustafar"],
    missions: [
      { n:1, req:"Lord Vader",  type:"squad",   waves:2, eligibleCount:0,  ineligibleCount:0 },
      { n:2, req:"Any DS",      type:"squad",   waves:2, eligibleCount:3,  ineligibleCount:5 },
      { n:3, req:"Any DS",      type:"squad",   waves:2, eligibleCount:5,  ineligibleCount:11 },
      { n:4, req:"Any DS",      type:"squad",   waves:2, eligibleCount:4,  ineligibleCount:7 },
      { n:5, req:"Scythe",      type:"ship",    waves:1, eligibleCount:0,  ineligibleCount:3 }
    ]
  },

  "Corellia": {
    mapUrl: PLANET_MAP_URL["Corellia"],
    missions: [
      { n:1, req:"Doctor Aphra",          type:"squad",   waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:2, req:"Any",                   type:"squad",   waves:2, eligibleCount:6, ineligibleCount:8 },
      { n:3, req:"Jabba",                 type:"squad",   waves:2, eligibleCount:1, ineligibleCount:0 },
      { n:4, req:"Qi'ra, Young Han Solo", type:"special", waves:2, eligibleCount:0, ineligibleCount:5 },
      { n:5, req:"Lando's MF",            type:"ship",    waves:1, eligibleCount:1, ineligibleCount:2 }
    ]
  },

  "Coruscant": {
    mapUrl: PLANET_MAP_URL["Coruscant"],
    missions: [
      { n:1, req:"Outrider",          type:"ship",  waves:1, eligibleCount:2, ineligibleCount:1 },
      { n:2, req:"Any LS",            type:"squad", waves:2, eligibleCount:10, ineligibleCount:8 },
      { n:3, req:"Any LS",            type:"squad", waves:2, eligibleCount:9,  ineligibleCount:6 },
      { n:4, req:"Jedi",              type:"squad", waves:2, eligibleCount:3,  ineligibleCount:4 },
      { n:5, req:"Jedi, Mace, Kit",   type:"squad", waves:2, eligibleCount:1,  ineligibleCount:2 }
    ]
  },

  "Geonosis": {
    mapUrl: PLANET_MAP_URL["Geonosis"],
    missions: [
      { n:1, req:"Reek",          type:"squad",  waves:2, eligibleCount:4, ineligibleCount:6 },
      { n:2, req:"Acklay",        type:"squad",  waves:2, eligibleCount:8, ineligibleCount:4 },
      { n:3, req:"R7 Geonosians", type:"squad",  waves:2, eligibleCount:0, ineligibleCount:1, relicBonus:true },
      { n:4, req:"Nexu",          type:"squad",  waves:2, eligibleCount:4, ineligibleCount:3 },
      { n:5, req:"Any DS",        type:"ship",   waves:1, eligibleCount:0, ineligibleCount:1 }
    ]
  },

  "Felucia": {
    mapUrl: PLANET_MAP_URL["Felucia"],
    missions: [
      { n:1, req:"Young Lando",  type:"squad", waves:2, eligibleCount:0, ineligibleCount:5 },
      { n:2, req:"Hondo Ohnaka", type:"squad", waves:2, eligibleCount:0, ineligibleCount:6 },
      { n:3, req:"Any",          type:"squad", waves:2, eligibleCount:7, ineligibleCount:12 },
      { n:4, req:"Jabba",        type:"squad", waves:2, eligibleCount:1, ineligibleCount:0 },
      { n:5, req:"Any",          type:"ship",  waves:1, eligibleCount:1, ineligibleCount:2 }
    ]
  },

  "Bracca": {
    mapUrl: PLANET_MAP_URL["Bracca"],
    missions: [
      { n:1, req:"Any LS",       type:"squad",   waves:2, eligibleCount:8, ineligibleCount:8 },
      { n:2, req:"Jedi",         type:"squad",   waves:2, eligibleCount:3, ineligibleCount:1 },
      { n:3, req:"Any LS",       type:"squad",   waves:2, eligibleCount:8, ineligibleCount:11 },
      { n:4, req:"Any LS",       type:"ship",    waves:1, eligibleCount:0, ineligibleCount:1 },
      { n:5, req:"Cal, Cere (R7)", type:"special", waves:2, eligibleCount:1, ineligibleCount:1, unlocks:"Zeffo", winsRequired:30 }
    ]
  },

  "Dathomir": {
    mapUrl: PLANET_MAP_URL["Dathomir"],
    missions: [
      { n:1, req:"Empire",               type:"squad",   waves:2, eligibleCount:4, ineligibleCount:4 },
      { n:2, req:"Any DS",               type:"squad",   waves:2, eligibleCount:5, ineligibleCount:7 },
      { n:3, req:"Doctor Aphra",         type:"squad",   waves:2, eligibleCount:0, ineligibleCount:4 },
      { n:4, req:"Any DS",               type:"squad",   waves:2, eligibleCount:5, ineligibleCount:7 },
      { n:5, req:"Merrin, Nightsisters", type:"special", waves:2, eligibleCount:0, ineligibleCount:3 }
    ]
  },

  "Tatooine": {
    mapUrl: PLANET_MAP_URL["Tatooine"],
    missions: [
      { n:1, req:"Any",              type:"squad",   waves:2, eligibleCount:8, ineligibleCount:11 },
      { n:2, req:"Jabba",            type:"squad",   waves:2, eligibleCount:1, ineligibleCount:0 },
      { n:3, req:"Executor",         type:"ship",    waves:1, eligibleCount:0, ineligibleCount:1 },
      { n:4, req:"Fennec Shand",     type:"squad",   waves:2, eligibleCount:1, ineligibleCount:5 },
      { n:5, req:"GI Inquisitorius", type:"special", waves:2, eligibleCount:1, ineligibleCount:0, reward:"Reva fragments" },
      { n:6, req:"Bo'katan, BAM",    type:"special", waves:2, eligibleCount:0, ineligibleCount:1, unlocks:"Mandalore", winsRequired:30 }
    ]
  },

  "Kashyyyk": {
    mapUrl: PLANET_MAP_URL["Kashyyyk"],
    missions: [
      { n:1, req:"Wookiees",             type:"squad",   waves:2, eligibleCount:0, ineligibleCount:4 },
      { n:2, req:"Any LS vs Mara",       type:"squad",   waves:2, eligibleCount:9, ineligibleCount:4 },
      { n:3, req:"Any LS",               type:"squad",   waves:2, eligibleCount:9, ineligibleCount:7 },
      { n:4, req:"Profundity",           type:"ship",    waves:1, eligibleCount:0, ineligibleCount:1 },
      { n:5, req:"Saw, Rebel Fighters",  type:"special", waves:2, eligibleCount:0, ineligibleCount:8 }
    ]
  },

  "Haven Medical Station": {
    mapUrl: PLANET_MAP_URL["Haven Medical Station"],
    missions: [
      { n:1, req:"Any DS Droids",        type:"squad",   waves:2, eligibleCount:0, ineligibleCount:2 },
      { n:2, req:"Any DS",               type:"squad",   waves:2, eligibleCount:0, ineligibleCount:7 },
      { n:3, req:"Any DS",               type:"squad",   waves:2, eligibleCount:0, ineligibleCount:10 },
      { n:4, req:"Reva, Inquisitorius",  type:"special", waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:5, req:"Any DS",               type:"squad",   waves:2, eligibleCount:0, ineligibleCount:10 }
    ]
  },

  "Kessel": {
    mapUrl: PLANET_MAP_URL["Kessel"],
    missions: [
      { n:1, req:"Any",        type:"squad",   waves:2, eligibleCount:2, ineligibleCount:11 },
      { n:2, req:"Any",        type:"squad",   waves:2, eligibleCount:2, ineligibleCount:11 },
      { n:3, req:"Qi'ra, L3",  type:"special", waves:2, eligibleCount:0, ineligibleCount:4 },
      { n:4, req:"Jabba",      type:"squad",   waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:5, req:"Ghost",      type:"ship",    waves:1, eligibleCount:0, ineligibleCount:4 }
    ]
  },

  "Lothal": {
    mapUrl: PLANET_MAP_URL["Lothal"],
    missions: [
      { n:1, req:"Any LS",    type:"ship",    waves:1, eligibleCount:1, ineligibleCount:3 },
      { n:2, req:"Any LS",    type:"squad",   waves:2, eligibleCount:2, ineligibleCount:8 },
      { n:3, req:"Phoenix",   type:"special", waves:1, eligibleCount:0, ineligibleCount:1 },
      { n:4, req:"Jedi",      type:"squad",   waves:2, eligibleCount:0, ineligibleCount:4 }
    ]
  },

  "Malachor": {
    mapUrl: PLANET_MAP_URL["Malachor"],
    missions: [
      { n:1, req:"Any DS vs Kanan",    type:"squad", waves:2, eligibleCount:0, ineligibleCount:4 },
      { n:2, req:"Any DS vs Hera",     type:"squad", waves:2, eligibleCount:0, ineligibleCount:4 },
      { n:3, req:"8th, 5th, 7th",      type:"squad", waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:4, req:"Any DS vs Hera+4",   type:"squad", waves:2, eligibleCount:0, ineligibleCount:2 }
    ]
  },

  "Vandor": {
    mapUrl: PLANET_MAP_URL["Vandor"],
    missions: [
      { n:1, req:"Young Han, Vandor Chewie", type:"special", waves:2, eligibleCount:0, ineligibleCount:2 },
      { n:2, req:"Any",                      type:"squad",   waves:2, eligibleCount:0, ineligibleCount:3 },
      { n:3, req:"Any vs Nest",              type:"squad",   waves:2, eligibleCount:0, ineligibleCount:6 },
      { n:4, req:"Jabba",                    type:"squad",   waves:2, eligibleCount:0, ineligibleCount:3 },
      { n:5, req:"Any",                      type:"ship",    waves:1, eligibleCount:0, ineligibleCount:3 }
    ]
  },

  "Kafrene": {
    mapUrl: PLANET_MAP_URL["Kafrene"],
    missions: [
      { n:1, req:"Any LS",       type:"squad", waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:2, req:"Any LS",       type:"squad", waves:2, eligibleCount:0, ineligibleCount:3 },
      { n:3, req:"Cassian, K2",  type:"squad", waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:4, req:"Any LS",       type:"ship",  waves:1, eligibleCount:0, ineligibleCount:1 },
      { n:5, req:"Any LS",       type:"squad", waves:2, eligibleCount:0, ineligibleCount:1 }
    ]
  },

  "Death Star": {
    mapUrl: PLANET_MAP_URL["Death Star"],
    missions: [
      { n:1, req:"Iden Versio",         type:"squad",   waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:2, req:"Any DS vs Rebels",    type:"squad",   waves:2, eligibleCount:0, ineligibleCount:2 },
      { n:3, req:"Any DS vs named Rebels", type:"squad",waves:2, eligibleCount:0, ineligibleCount:0 },
      { n:4, req:"Darth Vader",         type:"special", waves:1, eligibleCount:0, ineligibleCount:1 },
      { n:5, req:"Imperial TIE",        type:"ship",    waves:1, eligibleCount:1, ineligibleCount:3 }
    ]
  },

  "Hoth": {
    mapUrl: PLANET_MAP_URL["Hoth"],
    missions: [
      { n:1, req:"Jabba",          type:"squad", waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:2, req:"Any",            type:"squad", waves:2, eligibleCount:0, ineligibleCount:0 },
      { n:3, req:"Any",            type:"squad", waves:2, eligibleCount:0, ineligibleCount:0 },
      { n:4, req:"Any",            type:"squad", waves:2, eligibleCount:0, ineligibleCount:0 },
      { n:5, req:"Doctor Aphra, BT-1", type:"squad", waves:2, eligibleCount:0, ineligibleCount:1 }
    ]
  },

  "Scarif": {
    mapUrl: PLANET_MAP_URL["Scarif"],
    missions: [
      { n:1, req:"Baze, Chirrut, SRP", type:"squad", waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:2, req:"Cassian, K2, Pao",   type:"squad", waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:3, req:"Profundity",         type:"ship",  waves:1, eligibleCount:0, ineligibleCount:1 },
      { n:4, req:"Any LS",             type:"squad", waves:2, eligibleCount:0, ineligibleCount:0 },
      { n:5, req:"Any LS",             type:"squad", waves:2, eligibleCount:0, ineligibleCount:0 }
    ]
  },

  "Zeffo": {
    mapUrl: PLANET_MAP_URL["Zeffo"],
    missions: [
      { n:1, req:"Any LS",         type:"squad",   waves:2, eligibleCount:3, ineligibleCount:5 },
      { n:2, req:"LS UFU",         type:"squad",   waves:2, eligibleCount:1, ineligibleCount:2 },
      { n:3, req:"JKCK",           type:"squad",   waves:2, eligibleCount:0, ineligibleCount:5 },
      { n:4, req:"Clone Troopers", type:"special", waves:2, eligibleCount:0, ineligibleCount:3 },
      { n:5, req:"Negotiator",     type:"ship",    waves:1, eligibleCount:1, ineligibleCount:1 }
    ]
  },

  "Mandalore": {
    mapUrl: PLANET_MAP_URL["Mandalore"],
    missions: [
      { n:1, req:"DTMG",       type:"squad",   waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:2, req:"Any",        type:"squad",   waves:2, eligibleCount:0, ineligibleCount:6 },
      { n:3, req:"R9 BKM",     type:"squad",   waves:2, eligibleCount:0, ineligibleCount:1 },
      { n:4, req:"Gauntlet",   type:"ship",    waves:1, eligibleCount:0, ineligibleCount:3 }
    ]
  }

}

/**
 * Calcula batalhas disponíveis por planeta separadas por tipo.
 * Considera apenas missões com pelo menos 1 squad elegível.
 * Aplica 80% de safeBattles em squad e ship (não em special).
 *
 * Retorna:
 *   squadBattles   — missões de esquadrão elegíveis (cada uma = 1 batalha)
 *   shipBattles    — missões de nave elegíveis
 *   specialBattles — missões especiais elegíveis (sem GP score)
 *   totalScoreBattles — squad + ship (usadas no cálculo de GP)
 *   safeBattles    — 80% de totalScoreBattles
 */
function computePlanetBattles(planetName) {
  var data = PLANET_COMBAT_DATA[planetName]
  if (!data) return null

  var squadBattles   = 0  // repetiveis por fase, 2 ondas, GP score
  var shipBattles    = 0  // repetiveis por fase, 1 onda, GP score diferente
  var specialBattles = 0  // 1x por jogador, não entram no safe battles

  data.missions.forEach(function(m) {
    if (m.eligibleCount === 0) return
    if (m.type === 'squad')   squadBattles++
    if (m.type === 'ship')    shipBattles++
    if (m.type === 'special') specialBattles++
  })

  // Apenas squad + ship entram no cálculo de score (repetiveis por fase)
  // safeBattles = 80% cobre: falsos positivos, sem tempo, 20% que não vencem 2ª onda
  var totalScoreBattles = squadBattles + shipBattles
  var safeBattles = Math.floor(totalScoreBattles * 0.8)

  return {
    squadBattles:      squadBattles,
    shipBattles:       shipBattles,
    specialBattles:    specialBattles,
    totalScoreBattles: totalScoreBattles,
    safeBattles:       safeBattles
  }
}
