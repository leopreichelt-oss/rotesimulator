/**
 * squadMeta.js
 * Lista curada de esquadrões meta para GAC/TW/ROTE.
 *
 * Campos:
 *   id           — identificador único
 *   name         — nome legível
 *   leader       — base_id do líder
 *   members      — todos os membros incluindo líder
 *   minRelic     — relic mínimo útil (naves: 0 = usa lógica 7★)
 *   idealRelic   — relic ideal (máximo retorno)
 *   isFleet      — true para frotas (usa lógica de raridade, não relic)
 *   events       — { rote, gac, tw }
 *   alignment    — 'DS' | 'LS' | 'MS' | 'fleet'
 *   leagueMin    — liga mínima relevante
 *   note         — observação curta
 *
 *   journeyUnit  — base_id do personagem/nave que precisa estar no roster
 *                  para esse squad ser recomendável (jornada/evento concluído)
 *                  null = sem restrição, sempre recomendável
 *   minJourneyStars — estrelas mínimas do journeyUnit (naves: 4 = pior parte passou)
 *                     personagens: 7 = jornada concluída
 *
 * Atualização: Abril 2026
 */

var SQUAD_META = [

  // ══════════════════════════════════════════════════════════════════════
  // FROTAS
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'executor_fleet',
    name: 'Frota Executor',
    leader: 'CAPITALEXECUTOR',
    members: ['CAPITALEXECUTOR', 'SCYTHE', 'TIEFIGHTERIMPERIAL', 'TIEADVANCED', 'TIEBOMBERIMPERIAL'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALEXECUTOR', minJourneyStars: 4,
    events: { rote: true, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'CARBONITE',
    note: 'Frota DS dominante. Com 4★ a pior parte passou. Scythe + TIE Imperial prioritários.'
  },
  {
    id: 'leviathan_fleet',
    name: 'Frota Leviathan',
    leader: 'CAPITALLEVIATHAN',
    members: ['CAPITALLEVIATHAN', 'SITHFIGHTER', 'SITHBOMBER', 'SITHINFILTRATOR', 'RAVAGER'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALLEVIATHAN', minJourneyStars: 4,
    events: { rote: false, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'BRONZIUM',
    note: 'Frota DS Sith. Alternativa ao Executor para quem tem Revan/Malak altos.'
  },
  {
    id: 'profundity_fleet',
    name: 'Frota Profundity',
    leader: 'CAPITALPROFUNDITY',
    members: ['CAPITALPROFUNDITY', 'GHOST', 'OUTRIDER', 'UWINGROGUEONE', 'PHANTOM2'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALPROFUNDITY', minJourneyStars: 4,
    events: { rote: true, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'BRONZIUM',
    note: 'Principal contra-frota do Executor. Ghost + Outrider prioritários.'
  },
  {
    id: 'negotiator_fleet',
    name: 'Frota Negotiator',
    leader: 'CAPITALNEGOTIATOR',
    members: ['CAPITALNEGOTIATOR', 'JEDISTARFIGHTERANAKIN', 'JEDISTARFIGHTERCONSULAR', 'YWINGCLONEWARS', 'ARC170CLONESERGEANT'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'BRONZIUM',
    note: 'Frota LS farmável diretamente, sem jornada. Sólida em ROTE F3+ e GAC.'
  },
  {
    id: 'chimera_fleet',
    name: 'Frota Quimera (Thrawn)',
    leader: 'CAPITALCHIMAERA',
    members: ['CAPITALCHIMAERA', 'TIEADVANCED', 'TIEFIGHTERFIRSTORDER', 'TIEINTERCEPTOR', 'TIEREAPER'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALCHIMAERA', minJourneyStars: 4,
    events: { rote: false, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'AURODIUM',
    note: 'Frota DS Imperial de alto nível. Requer jornada lendária com naves Rebeldes 7★.'
  },

  // ══════════════════════════════════════════════════════════════════════
  // DARK SIDE — farmáveis diretamente (sem jornada)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'inquisitors',
    name: 'Inquisidores (Grande Inquisidor)',
    leader: 'GRANDINQUISITOR',
    members: ['GRANDINQUISITOR', 'FIFTHBROTHER', 'EIGHTHBROTHER', 'SEVENTHSISTER', 'SECONDSISTER'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CARBONITE',
    note: 'Excelente early-mid GAC. Todos os membros são farmáveis diretamente. Útil em ROTE F5 (Haven).'
  },
  {
    id: 'doctor_aphra',
    name: 'Dra. Aphra + Droids',
    leader: 'DOCTORAPHRA',
    members: ['DOCTORAPHRA', 'BT1', 'SANASTARROS', 'MAGNAGUARD', 'TRIPLEZERODROID'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: 'DOCTORAPHRA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CARBONITE',
    specialMission: true,
    note: 'Aphra requer Evento de Legado (Hondo, 0-0-0, BT-1, Sana Starros R5). Chave para ROTE.'
  },
  {
    id: 'geonosians',
    name: 'Geonosianos (Brood Alpha)',
    leader: 'GEONOSIANBROODALPHA',
    members: ['GEONOSIANBROODALPHA', 'GEONOSIANSOLDIER', 'GEONOSIANSPY', 'SUNFAC', 'POGGLETHELESSER'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CARBONITE',
    note: 'Farmável diretamente. R5 já é competitivo em Carbonita/Bronzium. Necessário para liberar Padmé.'
  },
  {
    id: 'nightsisters',
    name: 'Nightsisters (Merrin)',
    leader: 'MERRIN',
    members: ['MERRIN', 'ASAJJVENTRESS', 'MOTHTALZIN', 'TALPINI', 'DAKA'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CARBONITE',
    note: 'Merrin (Gear 12) é pré-req de Cal Kestis Cavaleiro Jedi. Squad resiliente em GAC mid.'
  },
  {
    id: 'darth_malgus',
    name: 'Darth Malgus (Império Sith Antigo)',
    leader: 'DARTHMALGUS',
    members: ['DARTHMALGUS', 'DARTHREVAN', 'MALAK', 'HKVANGUARD', 'IMPERIALPROBEDROID'],
    minRelic: 6, idealRelic: 8,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'AURODIUM',
    note: 'Forte em Aurodium+. Darth Malgus é chave em vários planetas ROTE.'
  },
  {
    id: 'sith_triumvirate',
    name: 'Sith Eternos (Darth Revan)',
    leader: 'DARTHREVAN',
    members: ['DARTHREVAN', 'MALAK', 'DARTHSION', 'DARTHTRAYA', 'JUHANI'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: 'DARTHREVAN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'BRONZIUM',
    note: 'Darth Revan requer Antiga Jornada (Bastila Fallen, Canderous Ordo, HK-47 7★). Sólido mid GAC.'
  },

  // ══════════════════════════════════════════════════════════════════════
  // DARK SIDE — requerem jornada/GL
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'jk_revan',
    name: 'Cavaleiro Jedi Revan (KOTOR)',
    leader: 'JEDIKNIGHTREVAN',
    members: ['JEDIKNIGHTREVAN', 'BASTILASHAN', 'T3_M4', 'JOLEEBINDO', 'MISSIONVAO'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: 'JEDIKNIGHTREVAN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM',
    note: 'JKR requer Antiga Jornada (Mission Vao, Zaalbar, Bastila, T3-M4, Jolee Bindo 7★). Top GAC LS mid.'
  },
  {
    id: 'lord_vader',
    name: 'Senhor Vader (Império)',
    leader: 'LORDVADER',
    members: ['LORDVADER', 'VADER', 'GRANDADMIRALTHRAWN', 'GRANDMOFFTARKIN', 'DARTHSIDIOUS'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'LORDVADER', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM',
    omicronUnits: ['VADER', 'GRANDADMIRALTHRAWN'],
    note: 'GL — requer jornada heroica. Melhor squad DS da GAC quando disponível.'
  },
  {
    id: 'jabba_bh',
    name: 'Jabba + Caçadores de Recompensa',
    leader: 'JABBATHEHUTT',
    members: ['JABBATHEHUTT', 'BOSSK', 'BOBAFETTSCION', 'FENNECSHAND', 'EMBO'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'JABBATHEHUTT', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'BRONZIUM',
    note: 'GL — requer jornada heroica. Essencial para ROTE MS (6 planetas). Meta GAC sólida.'
  },

  // ══════════════════════════════════════════════════════════════════════
  // LIGHT SIDE — farmáveis diretamente
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'gas_clones',
    name: 'General Skywalker + Clones 501st',
    leader: 'GENERALSKYWALKER',
    members: ['GENERALSKYWALKER', 'CT7567', 'CC2224', 'ARCTROOPER501ST', 'CLONESERGEANTPHASEI'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GENERALSKYWALKER', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM',
    omicronUnits: ['GENERALSKYWALKER'],
    note: 'GAS requer evento lendário (Padmé + Separatistas). Top GAC. Rex e GAS essenciais para ROTE LS.'
  },
  {
    id: 'padme',
    name: 'Padmé Amidala (República)',
    leader: 'PADMEAMIDALA',
    members: ['PADMEAMIDALA', 'GENERALKENOBI', 'AHSOKATANO', 'JEDIKNIGHTANAKIN', 'C3POLEGENDARY'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: 'PADMEAMIDALA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM',
    omicronUnits: ['PADMEAMIDALA'],
    note: 'Padmé requer evento lendário (Geonosianos + outros Separatistas). Forte no mid game.'
  },
  {
    id: 'mandalorian',
    name: 'Mandalorianos (Bo-Katan)',
    leader: 'BOKATAN',
    members: ['BOKATAN', 'THEMANDALORIANBESKARARMOR', 'SABINESWIRSHS3', 'PAZVIZSLA', 'AXEWOVES'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: 'BOKATAN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'BRONZIUM',
    specialMission: true,
    note: 'Bo-Katan libera Mandalore (ROTE). O Mandaloriano Beskar requer jornada própria.'
  },
  {
    id: 'rogue_one',
    name: 'Rogue One (Cassian)',
    leader: 'CASSIANANDORS1',
    members: ['CASSIANANDORS1', 'K2SO', 'PAO', 'BAZEMALBUS', 'CHIRRUTIMWE'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM',
    note: 'Farmável diretamente. Essenciais para Scarif e Kafrene no ROTE.'
  },
  {
    id: 'bad_batch',
    name: 'Bad Batch (Hunter)',
    leader: 'HUNTER',
    members: ['HUNTER', 'WRECKER', 'TECHBADGE', 'CROSSHAIR', 'OMEGA'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM',
    note: 'Farmável diretamente. Top squad GAC/TW LS.'
  },
  {
    id: 'wookiees',
    name: 'Wookiees (Tarfful)',
    leader: 'TARFFUL',
    members: ['TARFFUL', 'CHEWBACCALEGENDARY', 'YOUNGCHEWBACCA', 'ZAALBAR', 'CHEWBACCA'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CARBONITE',
    note: 'Farmável diretamente. Tarfful + Chewbacca são pré-req do Cal Kestis Cavaleiro Jedi. Kasshhyyk ROTE M1.'
  },
  {
    id: 'young_han',
    name: 'Han Jovem + Chewie Jovem',
    leader: 'YOUNGHAN',
    members: ['YOUNGHAN', 'YOUNGCHEWBACCA', 'YOUNGLANDO', 'QIRA', 'L3_37'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'CARBONITE',
    note: 'Farmável diretamente. Missões especiais Vandor e Kessel (ROTE). Squad MS sólido em GAC.'
  },
  {
    id: 'cal_kestis_jk',
    name: 'Cal Kestis Cavaleiro Jedi',
    leader: 'CALKESTIS',
    members: ['CALKESTIS', 'CEREJUNDA', 'MERRIN', 'TARFFUL', 'SAWGERRERA'],
    minRelic: 5, idealRelic: 7,
    // Cal Kestis base é farmável; o JKCK requer jornada com os 5 acima em Gear 12
    // Checamos se o jogador já tem o CALKESTIS desbloqueado (farmável diretamente)
    journeyUnit: null,
    events: { rote: true, gac: true, tw: false },
    alignment: 'LS', leagueMin: 'CARBONITE',
    specialMission: true,
    note: '⭐ PRIORIDADE: libera Zeffo (dobra premiação do evento). Todos os membros farmáveis diretamente. Cal Kestis Cavaleiro Jedi requer todos em Gear 12.'
  },

  // ══════════════════════════════════════════════════════════════════════
  // LIGHT SIDE — requerem jornada/GL
  // ══════════════════════════════════════════════════════════════════════
  // GL Rey — 4 variants em cadeia de upgrade
  // skipIfPlayerHas: descarta o variant quando personagem do próximo tier já está relicado
  {
    id: 'gl_rey_base',
    name: 'GL Rey + Resistência',
    leader: 'GLREY',
    members: ['GLREY', 'EPIXFINN', 'EPIXPOE', 'AMILYNHOLDO', 'L3_37'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLREY', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM',
    skipIfPlayerHas: ['BENSOLO'],
    note: 'Squad base. L3-37 sai quando Ben Solo estiver relicado.'
  },
  {
    id: 'gl_rey_ben',
    name: 'GL Rey + Ben Solo',
    leader: 'GLREY',
    members: ['GLREY', 'EPIXFINN', 'EPIXPOE', 'AMILYNHOLDO', 'BENSOLO'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLREY', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM',
    skipIfPlayerHas: ['EZRABRIDGERS3'],
    note: 'Ben Solo > L3-37. Upgrade para variant com Ezra quando disponível.'
  },
  {
    id: 'gl_rey_ben_ezra',
    name: 'GL Rey + Ben Solo + Ezra',
    leader: 'GLREY',
    members: ['GLREY', 'BENSOLO', 'EZRABRIDGERS3', 'CALKESTIS', 'EPIXFINN'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLREY', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM',
    skipIfPlayerHas: ['BARRISSOFFEE'],
    note: 'Ezra Bridger + Cal Kestis elevam muito o desempenho. Adicionar Barriss quando disponível.'
  },
  {
    id: 'gl_rey_ben_ezra_barriss',
    name: 'GL Rey + Ben Solo + Ezra + Barriss',
    leader: 'GLREY',
    members: ['GLREY', 'BENSOLO', 'EZRABRIDGERS3', 'CALKESTIS', 'BARRISSOFFEE'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLREY', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM',
    note: 'Squad completo — Barriss Offee maximiza o desempenho de Rey+Ben+Cal.'
  },
  {
    id: 'gl_luke',
    name: 'GL Luke (Rebeldes)',
    leader: 'GRANDMASTERLUKE',
    members: ['GRANDMASTERLUKE', 'COMMANDERLUKESKYWALKER', 'HANSOLO', 'JEDIKNIGHTLUKE', 'WEDGEANTILLES'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GRANDMASTERLUKE', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM',
    note: 'GL — requer jornada heroica. CLS (pré-req) é farmável por Luke + Old Ben + R2-D2.'
  },
  {
    id: 'jedi_master_kenobi',
    name: 'Mestre Jedi Kenobi + CAT',
    leader: 'JEDIMASTERKENOBI',
    members: ['JEDIMASTERKENOBI', 'GENERALSKYWALKER', 'COMMANDERAHSOKA', 'PADMEAMIDALA', 'GENERALKENOBI'],
    minRelic: 6, idealRelic: 8,
    journeyUnit: 'JEDIMASTERKENOBI', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM',
    omicronUnits: ['GENERALSKYWALKER', 'COMMANDERAHSOKA', 'PADMEAMIDALA'],
    note: 'GL — requer jornada heroica. JMK + CAT é o squad mais forte do jogo.'
  }

]

// Ordem das ligas
var LEAGUE_ORDER_META = ['CARBONITE', 'BRONZIUM', 'CHROMIUM', 'AURODIUM', 'KYBER']

// Relic mínimo por liga (contexto do ROTE)
var LEAGUE_MIN_RELIC = {
  'CARBONITE': 5,
  'BRONZIUM':  5,
  'CHROMIUM':  6,
  'AURODIUM':  7,
  'KYBER':     7
}
