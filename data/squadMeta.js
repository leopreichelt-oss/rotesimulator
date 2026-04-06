/**
 * squadMeta.js
 * Lista curada de esquadrões meta para GAC/TW/ROTE.
 *
 * Campos:
 *   id          — identificador único
 *   name        — nome legível
 *   leader      — base_id do líder (pode ser null para frota sem líder fixo)
 *   members     — todos os membros incluindo o líder (para checar elegibilidade)
 *   minRelic    — relic mínimo para ser útil na GAC/TW
 *   idealRelic  — relic ideal (máximo retorno competitivo)
 *   events      — { rote, gac, tw } booleanos
 *   alignment   — 'DS' | 'LS' | 'MS' | 'fleet'
 *   leagueMin   — liga mínima onde esse squad é relevante (CARBONITE/BRONZIUM/CHROMIUM/AURODIUM/KYBER)
 *   note        — observação curta
 *
 * Atualização: Abril 2026
 */

var SQUAD_META = [

  // ── FROTAS ──────────────────────────────────────────────────────────
  {
    id: 'executor_fleet',
    name: 'Frota Executor',
    leader: 'CAPITALEXECUTOR',
    members: ['CAPITALEXECUTOR', 'SCYTHE', 'TIEFIGHTERIMPERIAL', 'TIEADVANCED', 'TIEBOMBERIMPERIAL'],
    minRelic: 0,   // naves: 7★
    idealRelic: 0,
    isFleet: true,
    events: { rote: true, gac: true, tw: true },
    alignment: 'fleet',
    leagueMin: 'CARBONITE',
    note: 'Frota DS dominante. Scythe + TIE Imperial são prioridade.'
  },
  {
    id: 'profundity_fleet',
    name: 'Frota Profundity',
    leader: 'CAPITALPROFUNDITY',
    members: ['CAPITALPROFUNDITY', 'GHOST', 'OUTRIDER', 'UWINGROGUEONE', 'PHANTOM2'],
    minRelic: 0,
    idealRelic: 0,
    isFleet: true,
    events: { rote: true, gac: true, tw: true },
    alignment: 'fleet',
    leagueMin: 'BRONZIUM',
    note: 'Principal contra-frota do Executor. Ghost + Outrider prioritários.'
  },
  {
    id: 'negotiator_fleet',
    name: 'Frota Negotiator',
    leader: 'CAPITALNEGOTIATOR',
    members: ['CAPITALNEGOTIATOR', 'JEDISTARFIGHTERANAKIN', 'JEDISTARFIGHTERCONSULAR', 'YWINGCLONEWARS', 'ARC170CLONESERGEANT'],
    minRelic: 0,
    idealRelic: 0,
    isFleet: true,
    events: { rote: true, gac: true, tw: true },
    alignment: 'fleet',
    leagueMin: 'BRONZIUM',
    note: 'Frota LS sólida para GAC e ROTE F3+.'
  },

  // ── DARK SIDE ────────────────────────────────────────────────────────
  {
    id: 'lord_vader',
    name: 'Senhor Vader (Império Sith)',
    leader: 'LORDVADER',
    members: ['LORDVADER', 'VADER', 'GRANDADMIRALTHRAWN', 'GRANDMOFFTARKIN', 'DARTHSIDIOUS'],
    minRelic: 5,
    idealRelic: 8,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS',
    leagueMin: 'CHROMIUM',
    note: 'Melhor squad DS da GAC. Lord Vader é GL, prioridade máxima.'
  },
  {
    id: 'inquisitors',
    name: 'Inquisidores (Grande Inquisidor)',
    leader: 'GRANDINQUISITOR',
    members: ['GRANDINQUISITOR', 'FIFTHBROTHER', 'EIGHTHBROTHER', 'SEVENTHSISTER', 'SECONDSISTER'],
    minRelic: 5,
    idealRelic: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS',
    leagueMin: 'CARBONITE',
    note: 'Excelente early-mid GAC. Todos os Inquisidores se ajudam. Útil em ROTE F5 (Haven).'
  },
  {
    id: 'doctor_aphra',
    name: 'Dra. Aphra + Droids',
    leader: 'DOCTORAPHRA',
    members: ['DOCTORAPHRA', 'BT1', 'SANASTARROS', 'MAGNAGUARD', 'TRIPLEZERODROID'],
    minRelic: 5,
    idealRelic: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS',
    leagueMin: 'CARBONITE',
    note: 'Aphra e BT-1 são chave para ROTE (Corellia, Dathomir, Hoth). Sólida em GAC.'
  },
  {
    id: 'geonosians',
    name: 'Geonosianos (Brood Alpha)',
    leader: 'GEONOSIANBROODALPHA',
    members: ['GEONOSIANBROODALPHA', 'GEONOSIANSOLDIER', 'GEONOSIANSPY', 'SUNFAC', 'POGGLETHELESSER'],
    minRelic: 5,
    idealRelic: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS',
    leagueMin: 'CARBONITE',
    note: 'Squad econômica e eficiente. Brood Alpha em R5 já é competitivo em Carbonita/Bronzium.'
  },
  {
    id: 'nightsisters',
    name: 'Nightsisters (Merrin)',
    leader: 'MERRIN',
    members: ['MERRIN', 'ASAJJVENTRESS', 'MOTHTALZIN', 'TALPINI', 'DAKA'],
    minRelic: 5,
    idealRelic: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS',
    leagueMin: 'CARBONITE',
    note: 'Merrin lidera missão especial de Dathomir. Squad resiliente em GAC mid.'
  },
  {
    id: 'darth_malgus',
    name: 'Darth Malgus (Império Sith Antigo)',
    leader: 'DARTHMALGUS',
    members: ['DARTHMALGUS', 'DARTHREVAN', 'MALAK', 'HKVANGUARD', 'IMPERIAL_PROBE_DROID'],
    minRelic: 6,
    idealRelic: 8,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS',
    leagueMin: 'AURODIUM',
    note: 'Forte em Aurodium+. Darth Malgus é chave em vários planetas ROTE.'
  },
  {
    id: 'jabba_bh',
    name: 'Jabba + Caçadores de Recompensa',
    leader: 'JABBATHEHUTT',
    members: ['JABBATHEHUTT', 'BOSSK', 'BOBAFETTSCION', 'FENNECSHAND', 'EMBO'],
    minRelic: 5,
    idealRelic: 8,
    events: { rote: true, gac: true, tw: true },
    alignment: 'MS',
    leagueMin: 'BRONZIUM',
    note: 'Jabba GL + BH é meta GAC sólida. Essencial para ROTE MS (Corellia, Tatooine, Felucia, Kessel, Vandor, Hoth).'
  },

  // ── LIGHT SIDE ───────────────────────────────────────────────────────
  {
    id: 'gl_rey',
    name: 'GL Rey + Resistência',
    leader: 'GLREY',
    members: ['GLREY', 'FINN', 'ROSE', 'REYJEDITRAINING', 'BB8'],
    minRelic: 5,
    idealRelic: 8,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS',
    leagueMin: 'CHROMIUM',
    note: 'GL dominante. Rey é prioritária em qualquer liga acima de Chromium.'
  },
  {
    id: 'gl_luke',
    name: 'GL Luke (Rebeldes)',
    leader: 'GRANDMASTERLUKE',
    members: ['GRANDMASTERLUKE', 'COMMANDERLUKESKYWALKER', 'HANSOLO', 'JEDIKNIGHTLUKE', 'WEDGEANTILLES'],
    minRelic: 5,
    idealRelic: 8,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS',
    leagueMin: 'CHROMIUM',
    note: 'GL versátil. CLS serve em ROTE. GML lidera em GAC Chromium+.'
  },
  {
    id: 'gas_clones',
    name: 'General Skywalker + Clones 501st',
    leader: 'GENERALSKYWALKER',
    members: ['GENERALSKYWALKER', 'CT7567', 'CC2224', 'ARCTROOPER501ST', 'CLONESERGEANTPHASEI'],
    minRelic: 5,
    idealRelic: 8,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS',
    leagueMin: 'BRONZIUM',
    note: 'GAS + Clones é top GAC. Rex e GAS essenciais para ROTE LS.'
  },
  {
    id: 'mandalorian',
    name: 'Mandalorianos (Bo-Katan)',
    leader: 'BOKATAN',
    members: ['BOKATAN', 'THEMANDALORIANBESKARARMOR', 'SABINESWIRSHS3', 'PAZVIZSLA', 'AXEWOVES'],
    minRelic: 5,
    idealRelic: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'MS',
    leagueMin: 'BRONZIUM',
    note: 'Bo-Katan libera Mandalore (missão especial Tatooine). Forte em GAC mid.'
  },
  {
    id: 'rogue_one',
    name: 'Rogue One (Cassian)',
    leader: 'CASSIANANDORS1',
    members: ['CASSIANANDORS1', 'K2SO', 'PAO', 'BAZEMALBUS', 'CHIRRUTIMWE'],
    minRelic: 5,
    idealRelic: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS',
    leagueMin: 'BRONZIUM',
    note: 'Essenciais para Scarif e Kafrene no ROTE. Bom em GAC mid-range.'
  },
  {
    id: 'bad_batch',
    name: 'Bad Batch (Hunter)',
    leader: 'HUNTER',
    members: ['HUNTER', 'WRECKER', 'TECHBADGE', 'CROSSHAIR', 'OMEGA'],
    minRelic: 5,
    idealRelic: 7,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS',
    leagueMin: 'BRONZIUM',
    note: 'Top squad GAC/TW LS. Não tem papel direto em ROTE, mas libera slots para outros.'
  },
  {
    id: 'wookiees',
    name: 'Wookiees (Tarfful)',
    leader: 'TARFFUL',
    members: ['TARFFUL', 'CHEWBACCALEGENDARY', 'YOUNGCHEWBACCA', 'CHEWBACCA', 'ZAALBAR'],
    minRelic: 5,
    idealRelic: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS',
    leagueMin: 'CARBONITE',
    note: 'Tarfful ou Chewbacca necessários para Kashyyyk (ROTE M1). Sólido em Carbonita/Bronzium.'
  },
  {
    id: 'young_han',
    name: 'Han Jovem + Chewie Jovem',
    leader: 'YOUNGHAN',
    members: ['YOUNGHAN', 'YOUNGCHEWBACCA', 'YOUNGLANDO', 'QIRA', 'L3_37'],
    minRelic: 5,
    idealRelic: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'MS',
    leagueMin: 'CARBONITE',
    note: 'Missões especiais Vandor e Kessel (ROTE). Também serve em GAC como squad MS.'
  },
  {
    id: 'jedi_master_kenobi',
    name: 'Mestre Jedi Kenobi',
    leader: 'JEDIMASTERKENOBI',
    members: ['JEDIMASTERKENOBI', 'GENERALSKYWALKER', 'COMMANDERAHSOKA', 'PADMEAMIDALA', 'GENERALKENOBI'],
    minRelic: 6,
    idealRelic: 8,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS',
    leagueMin: 'CHROMIUM',
    note: 'JMK + CAT é o squad mais forte do jogo. Prioritário para Chromium+.'
  },
  {
    id: 'sith_triumvirate',
    name: 'Sith Eternos (Darth Revan)',
    leader: 'DARTHREVAN',
    members: ['DARTHREVAN', 'MALAK', 'DARTHSION', 'DARTHTRAYA', 'JUHANI'],
    minRelic: 5,
    idealRelic: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS',
    leagueMin: 'BRONZIUM',
    note: 'Revan + Malak sólido em mid GAC. Revan aparece em vários platoons de ROTE.'
  }

]

// Mapeamento de liga para score numérico (quanto menor = mais fraco = mais urgente para farmar squads básicos)
var LEAGUE_SCORE = {
  'CARBONITE': 1,
  'BRONZIUM':  2,
  'CHROMIUM':  3,
  'AURODIUM':  4,
  'KYBER':     5
}

// Relic mínimo por liga (contexto do ROTE)
var LEAGUE_MIN_RELIC = {
  'CARBONITE': 5,
  'BRONZIUM':  5,
  'CHROMIUM':  6,
  'AURODIUM':  7,
  'KYBER':     7
}
