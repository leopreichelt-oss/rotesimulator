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
 *   bestFor      — 'defense' | 'attack' | 'both' (referência GAC S76)
 *   note         — observação curta
 *
 *   journeyUnit  — base_id do personagem/nave que precisa estar no roster
 *                  para esse squad ser recomendável (jornada/evento concluído)
 *                  null = sem restrição, sempre recomendável
 *   minJourneyStars — estrelas mínimas do journeyUnit (naves: 4 = pior parte passou)
 *                     personagens: 7 = jornada concluída
 *
 * Atualização: Abril 2026 — GAC Season 76
 */

var SQUAD_META = [

  // ══════════════════════════════════════════════════════════════════════
  // FROTAS
  // ══════════════════════════════════════════════════════════════════════
  // counteredBy: frotas que vencem esta como defensora (S76 5v5, SWGOH.GG, 279K batalhas)
  // win: win% do atacante contra esta frota defensora
  {
    id: 'executor_fleet',
    name: 'Frota Executor',
    leader: 'CAPITALEXECUTOR',
    members: ['CAPITALEXECUTOR', 'HOUNDSTOOTH', 'PUNISHINGONE', 'RAZORCREST', 'IG2000'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALEXECUTOR', minJourneyStars: 4,
    keyPilots: ['BOSSK', 'DENGAR', 'CADBANE', 'IG88'],
    events: { rote: true, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'CARBONITE', bestFor: 'both',
    counteredBy: [
      { fleet: 'profundity_fleet', win: 99 },
      { fleet: 'leviathan_fleet',  win: 92 }
    ],
    note: '43.7K batalhas S76 · 84% win como defesa. Hound\'s Tooth + Punishing One + Razor Crest.'
  },
  {
    id: 'leviathan_fleet',
    name: 'Frota Leviathan',
    leader: 'CAPITALLEVIATHAN',
    members: ['CAPITALLEVIATHAN', 'FURYINTERCEPTOR', 'B28EXTINCTIONBOMBER', 'TIEDAGGER', 'SITHFIGHTER'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALLEVIATHAN', minJourneyStars: 4,
    keyPilots: ['DARTHMALGUS', 'DARTHREVAN', 'DARTHMALAK'],
    events: { rote: false, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'BRONZIUM', bestFor: 'both',
    counteredBy: [
      { fleet: 'leviathan_fleet', win: 96 },
      { fleet: 'executor_fleet',  win: 82 }
    ],
    note: '23.9K batalhas S76 · 78% win como defesa. A mais difícil de contra-atacar — só outra Leviathan tem win% alto.'
  },
  {
    id: 'profundity_fleet',
    name: 'Frota Profundity',
    leader: 'CAPITALPROFUNDITY',
    members: ['CAPITALPROFUNDITY', 'MILLENNIUMFALCONHAN', 'OUTRIDER', 'YWINGREBEL', 'UWINGROGUEONE'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALPROFUNDITY', minJourneyStars: 4,
    keyPilots: ['ADMIRALRADDUS', 'CAPTAINDROGAN', 'JYNERSO'],
    events: { rote: true, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'BRONZIUM', bestFor: 'both',
    counteredBy: [
      { fleet: 'leviathan_fleet',  win: 99 },
      { fleet: 'profundity_fleet', win: 82 }
    ],
    note: '17.2K batalhas S76 · 75% win como defesa. Millennium Falcon (Han) + Outrider + Y-Wing Rebelde.'
  },
  {
    id: 'negotiator_fleet',
    name: 'Frota Negotiator',
    leader: 'CAPITALNEGOTIATOR',
    members: ['CAPITALNEGOTIATOR', 'JEDISTARFIGHTERANAKIN', 'MARAUDER', 'YWINGCLONEWARS', 'BLADEOFDORIN'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: null,
    keyPilots: ['JEDIKNIGHTANAKIN', 'GENERALKENOBI', 'AHSOKATANO'],
    events: { rote: true, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'BRONZIUM', bestFor: 'both',
    counteredBy: [
      { fleet: 'leviathan_fleet',  win: 98 },
      { fleet: 'profundity_fleet', win: 98 },
      { fleet: 'executor_fleet',   win: 96 },
      { fleet: 'chimera_fleet',    win: 85 }
    ],
    note: '39.3K batalhas S76 · 87% win como defesa. Farmável sem jornada. Anakin + Marauder + Y-Wing CW.'
  },
  {
    id: 'chimera_fleet',
    name: 'Frota Quimera (Thrawn)',
    leader: 'CAPITALCHIMAERA',
    members: ['CAPITALCHIMAERA', 'SCYTHE', 'TIEADVANCED', 'TIEFIGHTERIMPERIAL', 'TIEINTERCEPTOR'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALCHIMAERA', minJourneyStars: 4,
    keyPilots: ['GRANDADMIRALTHRAWN', 'DEATHTROOPER', 'GRANDMOFFTARKIN'],
    events: { rote: false, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'AURODIUM', bestFor: 'both',
    counteredBy: [
      { fleet: 'leviathan_fleet',  win: 100 },
      { fleet: 'profundity_fleet', win: 100 },
      { fleet: 'executor_fleet',   win: 100 },
      { fleet: 'negotiator_fleet', win: 90  },
      { fleet: 'malevolence_fleet',win: 87  }
    ],
    note: '8.2K batalhas S76 · 89% win como defesa. Requer jornada lendária com naves Rebeldes 7★.'
  },
  {
    id: 'home_one_fleet',
    name: 'Frota Home One (Ackbar)',
    leader: 'CAPITALHOMEONE',
    members: ['CAPITALHOMEONE', 'RAVENSCLAW', 'UWINGHERO', 'XWINGWEDGE', 'BWING'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALHOMEONE', minJourneyStars: 4,
    keyPilots: ['ADMIRALACKBAR', 'WEDGEANTILLES', 'BIGGDARKLIGHTER'],
    events: { rote: false, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'BRONZIUM', bestFor: 'both',
    counteredBy: [
      { fleet: 'profundity_fleet', win: 100 },
      { fleet: 'leviathan_fleet',  win: 100 },
      { fleet: 'executor_fleet',   win: 99  },
      { fleet: 'malevolence_fleet',win: 82  }
    ],
    note: '59.7K batalhas S76 · 87% win como defesa. Raven\'s Claw + U-Wing + X-Wing (Wedge) + B-Wing.'
  },
  {
    id: 'raddus_fleet',
    name: 'Frota Raddus',
    leader: 'CAPITALRADDUS',
    members: ['CAPITALRADDUS', 'MG100STARFORTRESS', 'MILLENNIUMFALCONCHEWIE', 'XWINGBLACKONE', 'COMEUPPANCE'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALRADDUS', minJourneyStars: 4,
    keyPilots: ['ADMIRALRADDUS', 'CHEWBACCALEGENDARY', 'JYNERSO'],
    events: { rote: false, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'CHROMIUM', bestFor: 'both',
    counteredBy: [
      { fleet: 'leviathan_fleet',  win: 100 },
      { fleet: 'negotiator_fleet', win: 99  },
      { fleet: 'executrix_fleet',  win: 99  },
      { fleet: 'executor_fleet',   win: 98  },
      { fleet: 'chimera_fleet',    win: 97  },
      { fleet: 'profundity_fleet', win: 94  }
    ],
    note: '30.2K batalhas S76 · 93% win como defesa. MG-100 + Falcon (Chewie) + X-Wing Black One.'
  },
  {
    id: 'malevolence_fleet',
    name: 'Frota Malevolência (Grievous)',
    leader: 'CAPITALMALEVOLENCE',
    members: ['CAPITALMALEVOLENCE', 'SUNFACSTARFIGHTER', 'HIENABOMBER', 'VULTUREDROID', 'SOLDIERSTARFIGHTER'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALMALEVOLENCE', minJourneyStars: 4,
    keyPilots: ['GENERALGRIEVOUS', 'SUNFAC', 'POGGLETHELESSER'],
    events: { rote: false, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'BRONZIUM', bestFor: 'both',
    counteredBy: [
      { fleet: 'leviathan_fleet',  win: 100 },
      { fleet: 'negotiator_fleet', win: 99  },
      { fleet: 'executor_fleet',   win: 99  },
      { fleet: 'profundity_fleet', win: 92  },
      { fleet: 'malevolence_fleet',win: 89  },
      { fleet: 'raddus_fleet',     win: 87  }
    ],
    note: '27.9K batalhas S76 · 94% win como defesa. Sun Fac + Hyena Bomber + Vulture Droid.'
  },
  {
    id: 'executrix_fleet',
    name: 'Frota Executrix (Krennic)',
    leader: 'CAPITALEXECUTRIX',
    members: ['CAPITALEXECUTRIX', 'SCYTHE', 'TIEADVANCED', 'TIEFIGHTERIMPERIAL', 'TIEDEFENDER'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALEXECUTRIX', minJourneyStars: 4,
    keyPilots: ['DIRECTORKRENNIC', 'GRANDMOFFTARKIN', 'DEATHTROOPER'],
    events: { rote: false, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'CHROMIUM', bestFor: 'both',
    counteredBy: [
      { fleet: 'executor_fleet',   win: 100 },
      { fleet: 'leviathan_fleet',  win: 99  },
      { fleet: 'profundity_fleet', win: 92  },
      { fleet: 'negotiator_fleet', win: 87  },
      { fleet: 'chimera_fleet',    win: 82  }
    ],
    note: '13.7K batalhas S76 · 91% win como defesa. Scythe + TIE Advanced + TIE Defender.'
  },
  {
    id: 'finalizer_fleet',
    name: 'Frota Finalizer (Hux)',
    leader: 'CAPITALFINALIZER',
    members: ['CAPITALFINALIZER', 'SFTIEFIGHTER', 'TIESILENCER', 'SFTIEHEAVY', 'FIRSTORDERTRANSPORT'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALFINALIZER', minJourneyStars: 4,
    keyPilots: ['GENERALHUX', 'KYLORENUNMASKED', 'FIRSTORDEROFFICERMALEMATT'],
    events: { rote: false, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'CHROMIUM', bestFor: 'both',
    counteredBy: [
      { fleet: 'negotiator_fleet', win: 100 },
      { fleet: 'profundity_fleet', win: 100 },
      { fleet: 'leviathan_fleet',  win: 100 },
      { fleet: 'malevolence_fleet',win: 99  },
      { fleet: 'executor_fleet',   win: 99  },
      { fleet: 'home_one_fleet',   win: 96  }
    ],
    note: '12.8K batalhas S76 · 97% win como defesa. Praticamente toda frota meta a counter.'
  },
  {
    id: 'endurance_fleet',
    name: 'Frota Endurance (Mace Windu)',
    leader: 'CAPITALENDURANCE',
    members: ['CAPITALENDURANCE', 'ETA2ACTIS', 'DELTA7B', 'BTLBYWING', 'XWINGBIGGS'],
    minRelic: 0, idealRelic: 0,
    isFleet: true,
    journeyUnit: 'CAPITALENDURANCE', minJourneyStars: 4,
    keyPilots: ['MACEWINDU', 'JEDIKNIGHTANAKIN', 'GENERALKENOBI'],
    events: { rote: false, gac: true, tw: true },
    alignment: 'fleet', leagueMin: 'AURODIUM', bestFor: 'both',
    counteredBy: [
      { fleet: 'profundity_fleet', win: 100 },
      { fleet: 'leviathan_fleet',  win: 100 },
      { fleet: 'executor_fleet',   win: 100 },
      { fleet: 'chimera_fleet',    win: 100 }
    ],
    note: '2.4K batalhas S76 · 92% win como defesa. Toda frota meta counter com 100%.'
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
    alignment: 'DS', leagueMin: 'CARBONITE', bestFor: 'defense',
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
    alignment: 'DS', leagueMin: 'CARBONITE', bestFor: 'attack',
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
    alignment: 'DS', leagueMin: 'CARBONITE', bestFor: 'defense',
    note: 'Farmável diretamente. R5 já é competitivo em Carbonita/Bronzium. Necessário para liberar Padmé.'
  },
  {
    id: 'nightsisters',
    name: 'Irmãs da Noite (Mãe Talzin)',
    leader: 'MOTHERTALZIN',
    members: ['MOTHERTALZIN', 'ASAJJVENTRESS', 'DAKA', 'MERRIN', 'NIGHTSISTERZOMBIE'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CARBONITE', bestFor: 'defense',
    omicronUnits: ['ASAJJVENTRESS', 'MERRIN'],
    note: 'Merrin (Gear 12) é pré-req de Cal Kestis Cavaleiro Jedi. Talzin lidera o meta atual.'
  },
  {
    id: 'darth_malgus',
    name: 'Darth Malgus (Império Sith Antigo)',
    leader: 'DARTHMALGUS',
    members: ['DARTHMALGUS', 'BASTILASHANDARK', 'DARTHMALAK', 'DARTHREVAN', 'SITHMARAUDER'],
    minRelic: 6, idealRelic: 8,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'AURODIUM', bestFor: 'defense',
    omicronUnits: ['DARTHMALGUS'],
    note: 'Forte em Aurodium+. Darth Malgus é chave em vários planetas ROTE. Comp meta: Bastila Fallen + Malak + DR + Marauder.'
  },
  {
    id: 'sith_triumvirate',
    name: 'Sith Eternos (Darth Revan)',
    leader: 'DARTHREVAN',
    members: ['DARTHREVAN', 'DARTHMALAK', 'DARTHSION', 'DARTHTRAYA', 'JUHANI'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: 'DARTHREVAN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'BRONZIUM', bestFor: 'defense',
    omicronUnits: ['DARTHTRAYA'],
    note: 'Darth Revan requer Antiga Jornada (Bastila Fallen, Canderous Ordo, HK-47 7★). Sólido mid GAC.'
  },
  {
    id: 'separatists_dooku',
    name: 'Separatistas (Conde Dooku)',
    leader: 'COUNTDOOKU',
    members: ['COUNTDOOKU', 'TRENCH', 'JANGOFETT', 'NUTEGUNRAY', 'WATTAMBOR'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'BRONZIUM', bestFor: 'defense',
    note: 'Comp meta GAC S76. Trench + Dooku + Jango farmáveis. Forte defesa DS mid.'
  },

  // ══════════════════════════════════════════════════════════════════════
  // DARK SIDE — requerem jornada/GL
  // ══════════════════════════════════════════════════════════════════════

  // SLKR — variants sem Dark Rey (base) e com Dark Rey
  // Skip base quando Dark Rey disponível; entre Dark Rey variants, skip por personagem preferencial
  {
    id: 'slkr_base',
    name: 'SLKR (base)',
    leader: 'SUPREMELEADERKYLOREN',
    members: ['SUPREMELEADERKYLOREN', 'GENERALHUX', 'FOSITHTROOPER', 'KYLORENUNMASKED', 'FIRSTORDERTROOPER'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SUPREMELEADERKYLOREN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['DARKREY'],
    note: 'SLKR base sem Dark Rey. HUX + Sith Trooper + KRU + FO Trooper. (linha 13 def)'
  },
  {
    id: 'slkr_base_officer',
    name: 'SLKR + Oficial FO (base)',
    leader: 'SUPREMELEADERKYLOREN',
    members: ['SUPREMELEADERKYLOREN', 'FIRSTORDEROFFICERMALE', 'FOSITHTROOPER', 'GENERALHUX', 'KYLORENUNMASKED'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SUPREMELEADERKYLOREN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['DARKREY', 'FIRSTORDERTROOPER'],
    note: 'SLKR base sem Dark Rey. Oficial FO + Sith Trooper + HUX + KRU. (linha 16 def)'
  },
  {
    id: 'slkr_rey',
    name: 'SLKR + Rey LS (principal)',
    leader: 'SUPREMELEADERKYLOREN',
    members: ['SUPREMELEADERKYLOREN', 'DARKREY', 'FOSITHTROOPER', 'GENERALHUX', 'KYLORENUNMASKED'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SUPREMELEADERKYLOREN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    note: 'SLKR + Dark Rey + Sith Trooper + HUX + KRU. Mais popular (6.4K). (linha 1 def)'
  },
  {
    id: 'slkr_rey_fot',
    name: 'SLKR + Rey LS + FO Trooper',
    leader: 'SUPREMELEADERKYLOREN',
    members: ['SUPREMELEADERKYLOREN', 'DARKREY', 'FIRSTORDERTROOPER', 'FOSITHTROOPER', 'KYLORENUNMASKED'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SUPREMELEADERKYLOREN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['GENERALHUX'],
    note: 'SLKR + Dark Rey + FO Trooper + Sith Trooper + KRU. Sem HUX. (linha 2 def, 1.3K)'
  },
  {
    id: 'slkr_rey_sfpilot',
    name: 'SLKR + Rey LS + Piloto SF',
    leader: 'SUPREMELEADERKYLOREN',
    members: ['SUPREMELEADERKYLOREN', 'DARKREY', 'FIRSTORDERSPECIALFORCESPILOT', 'GENERALHUX', 'KYLORENUNMASKED'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SUPREMELEADERKYLOREN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['FOSITHTROOPER'],
    note: 'SLKR + Dark Rey + Piloto TIE SF + HUX + KRU. Sem Sith Trooper. (linha 3 def, 1.1K)'
  },
  {
    id: 'slkr_rey_officer',
    name: 'SLKR + Rey LS + Oficial FO',
    leader: 'SUPREMELEADERKYLOREN',
    members: ['SUPREMELEADERKYLOREN', 'DARKREY', 'FIRSTORDEROFFICERMALE', 'GENERALHUX', 'KYLORENUNMASKED'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SUPREMELEADERKYLOREN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['FOSITHTROOPER', 'FIRSTORDERSPECIALFORCESPILOT'],
    note: 'SLKR + Dark Rey + Oficial FO + HUX + KRU. (linha 4 def, 364)'
  },
  {
    id: 'slkr_rey_fot_hux',
    name: 'SLKR + Rey LS + FO Trooper + HUX',
    leader: 'SUPREMELEADERKYLOREN',
    members: ['SUPREMELEADERKYLOREN', 'DARKREY', 'FIRSTORDERTROOPER', 'GENERALHUX', 'KYLORENUNMASKED'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SUPREMELEADERKYLOREN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['FOSITHTROOPER', 'FIRSTORDERSPECIALFORCESPILOT', 'FIRSTORDEROFFICERMALE'],
    note: 'SLKR + Dark Rey + FO Trooper + HUX + KRU. (linha 5 def, 361)'
  },
  // ── SEE (Sith Eternal Emperor) ─────────────────────────────────────────────
  // DEFESA: Triumvirato Sith (Nihilus + Traya + Talon/Sion + Savage)
  {
    id: 'see_def_triumvirate_talon',
    name: 'SEE · Nihilus + Talon + Traya + Savage',
    leader: 'SITHETERNALPALPATINE',
    members: ['SITHETERNALPALPATINE', 'DARTHNIHILUS', 'DARTHTALON', 'DARTHTRAYA', 'SAVAGEOPRESS'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SITHETERNALPALPATINE', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    note: 'Triumvirato + Talon. Variante mais popular (def row 1: 1205 vistas, 25% hold)'
  },
  {
    id: 'see_def_triumvirate_sion',
    name: 'SEE · Nihilus + Sion + Traya + Savage',
    leader: 'SITHETERNALPALPATINE',
    members: ['SITHETERNALPALPATINE', 'DARTHNIHILUS', 'DARTHSION', 'DARTHTRAYA', 'SAVAGEOPRESS'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SITHETERNALPALPATINE', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['DARTHTALON'],
    note: 'Triumvirato + Sion (sem Talon) — def row 5: 93 vistas, 24% hold; atk row 6: 1048, 47% win'
  },
  // DEFESA: Old Republic Sith (Malak + Revan + Malgus/Bastila)
  {
    id: 'see_def_malak_malgus',
    name: 'SEE · Bastila + Malak + Malgus + Revan',
    leader: 'SITHETERNALPALPATINE',
    members: ['SITHETERNALPALPATINE', 'BASTILASHANDARK', 'DARTHMALAK', 'DARTHMALGUS', 'DARTHREVAN'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SITHETERNALPALPATINE', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Old Republic + Malgus. 2ª variante mais popular (def row 2: 562, 23% hold)'
  },
  {
    id: 'see_def_malak_revan',
    name: 'SEE · Bastila + Malak + Revan + Trooper',
    leader: 'SITHETERNALPALPATINE',
    members: ['SITHETERNALPALPATINE', 'BASTILASHANDARK', 'DARTHMALAK', 'DARTHREVAN', 'SITHEMPIRETROOPER'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SITHETERNALPALPATINE', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    skipIfPlayerHas: ['DARTHMALGUS'],
    note: 'Old Republic sem Malgus — maior hold% (def row 15: 21 vistas, 38% hold)'
  },
  // ATAQUE: SEE com Wat Tambor (sinergia de proteção — altíssima taxa de vitória)
  {
    id: 'see_atk_tambor',
    name: 'SEE · Wat Tambor',
    leader: 'SITHETERNALPALPATINE',
    members: ['SITHETERNALPALPATINE', 'WATTAMBOR'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SITHETERNALPALPATINE', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    note: 'Ataque: maior taxa de vitória do SEE (atk row 2: 15.6K, 84% win)'
  },
  {
    id: 'see_atk_bane',
    name: 'SEE · Darth Bane',
    leader: 'SITHETERNALPALPATINE',
    members: ['SITHETERNALPALPATINE', 'DARTHBANE'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SITHETERNALPALPATINE', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    note: 'Ataque: combo mais popular (atk row 1: 20.7K vistas, 77% win)'
  },
  {
    id: 'see_atk_sidious_maul',
    name: 'SEE · Sidious + Maul + Trooper + Tambor',
    leader: 'SITHETERNALPALPATINE',
    members: ['SITHETERNALPALPATINE', 'DARTHSIDIOUS', 'MAUL', 'SITHEMPIRETROOPER', 'WATTAMBOR'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'SITHETERNALPALPATINE', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    skipIfPlayerHas: ['DARTHBANE'],
    note: 'Ataque 5-personagens (atk row 4: 2698, 68% win). Fallback sem Darth Bane'
  },

  // Hondo GL — pirata neutro
  {
    id: 'gl_hondo',
    name: 'Hondo Ohnaka (GL Pirata)',
    leader: 'GLHONDO',
    members: ['GLHONDO', 'VANE', 'BRUTUS', 'SM33', 'CAPTAINSILVO'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLHONDO', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    note: 'GL — pirata neutro. Crew: Vane, Brutus, SM-33, Capitão Silvo.'
  },
  {
    id: 'jk_revan',
    name: 'Cavaleiro Jedi Revan (KOTOR)',
    leader: 'JEDIKNIGHTREVAN',
    members: ['JEDIKNIGHTREVAN', 'BASTILASHAN', 'T3_M4', 'JOLEEBINDO', 'MISSIONVAO'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: 'JEDIKNIGHTREVAN', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'defense',
    skipIfPlayerHas: ['GRANDMASTERLUKE'],
    note: 'JKR requer Antiga Jornada (Mission Vao, Zaalbar, Bastila, T3-M4, Jolee Bindo 7★). Top GAC LS mid. ⚠ JKR é membro essencial do squad JML — esses farms servem para ambos.'
  },
  {
    id: 'lord_vader',
    name: 'Senhor Vader (Império)',
    leader: 'LORDVADER',
    members: ['LORDVADER', 'VADER', 'GRANDADMIRALTHRAWN', 'GRANDMOFFTARKIN', 'DARTHSIDIOUS'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'LORDVADER', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    omicronUnits: ['VADER', 'GRANDADMIRALTHRAWN'],
    note: 'GL — requer jornada heroica. Melhor squad DS da GAC quando disponível.'
  },
  {
    id: 'lord_vader_501st',
    name: 'Senhor Vader + 501st',
    leader: 'LORDVADER',
    members: ['LORDVADER', 'APPO', 'DISGUISEDCLONE', 'CX2', 'SCORCH'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'LORDVADER', minJourneyStars: 7,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Comp alternativo de LV com 501st. Appo + CX-2 + Scorch são a coluna do squad. Alta taxa de hold no GAC S76.'
  },
  {
    id: 'jabba_bh',
    name: 'Jabba + Caçadores de Recompensa',
    leader: 'JABBATHEHUTT',
    members: ['JABBATHEHUTT', 'BOSSK', 'BOBAFETTSCION', 'FENNECSHAND', 'EMBO'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'JABBATHEHUTT', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'BRONZIUM', bestFor: 'defense',
    skipIfPlayerHas: ['BOUSHH'],
    note: 'GL — requer jornada heroica. Essencial para ROTE MS (6 planetas). Meta GAC defesa sólida.'
  },
  {
    id: 'jabba_boushh',
    name: 'Jabba + Boushh',
    leader: 'JABBATHEHUTT',
    members: ['JABBATHEHUTT', 'BOUSHH', 'EMBO', 'KRRSANTAN', 'UNDERCOVERLANDO'],
    minRelic: 5, minRelicSupport: 0, idealRelic: 8,
    journeyUnit: 'JABBATHEHUTT', minJourneyStars: 7,
    events: { rote: false, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    omicronUnits: ['KRRSANTAN'],
    note: 'Variant com Boushh + Krrsantan + Lando Disfarçado. GAC defesa S76.'
  },
  {
    id: 'the_stranger',
    name: 'O Estranho (A Acólita)',
    leader: 'STRANGER',
    members: ['STRANGER', 'BARRISSOFFEE', 'MAULHATEFUELED', 'STARKILLER', 'VISASMARR'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    omicronUnits: ['STARKILLER'],
    note: 'Maior taxa de hold do GAC S76 (58%). O Estranho + Barriss + Maul (Ódio) formam o core.'
  },
  {
    id: 'night_troopers',
    name: 'Tropas Noturnas (Grandes Mães)',
    leader: 'GREATMOTHERS',
    members: ['GREATMOTHERS', 'NIGHTTROOPERPERIDEA', 'MORGANELSBETH', 'NIGHTSISTERSPIRIT', 'NIGHTTROOPER'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Tropas noturnas de Peridea (Ahsoka). Grandes Mães controlam o squad. Alta resistência em GAC.'
  },
  {
    id: 'dt_moff_gideon',
    name: 'Moff Gideon Dark Trooper',
    leader: 'MOFFGIDEONS3',
    members: ['MOFFGIDEONS3', 'CAPTAINENOCH', 'DEATHTROOPER', 'MOFFGIDEONS1', 'SCOUTTROOPER_V3'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Dark Trooper Moff Gideon + Capitão Enoch + Death Trooper. Sólida defesa DS no GAC S76.'
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
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'defense',
    omicronUnits: ['GENERALSKYWALKER', 'CT7567'],
    note: 'GAS requer evento lendário (Padmé + Separatistas). Top GAC defesa. Rex e GAS essenciais para ROTE LS.'
  },
  {
    id: 'padme',
    name: 'Padmé Amidala (República)',
    leader: 'PADMEAMIDALA',
    members: ['PADMEAMIDALA', 'GENERALKENOBI', 'AHSOKATANO', 'JEDIKNIGHTANAKIN', 'C3POLEGENDARY'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: 'PADMEAMIDALA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'defense',
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
    alignment: 'MS', leagueMin: 'BRONZIUM', bestFor: 'attack',
    specialMission: true,
    omicronUnits: ['BOKATAN'],
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
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'attack',
    note: 'Farmável diretamente. Essenciais para Scarif e Kafrene no ROTE.'
  },
  {
    id: 'bad_batch',
    name: 'Bad Batch (Hunter)',
    leader: 'BADBATCHHUNTER',
    members: ['BADBATCHHUNTER', 'BADBATCHWRECKER', 'BADBATCHTECH', 'BADBATCHECHO', 'BADBATCHOMEGA'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'attack',
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
    alignment: 'LS', leagueMin: 'CARBONITE', bestFor: 'defense',
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
    alignment: 'MS', leagueMin: 'CARBONITE', bestFor: 'attack',
    note: 'Farmável diretamente. Missões especiais Vandor e Kessel (ROTE). Squad MS sólido em GAC.'
  },
  {
    id: 'cal_kestis_jk',
    name: 'Cal Kestis Cavaleiro Jedi',
    leader: 'CALKESTIS',
    members: ['CALKESTIS', 'CEREJUNDA', 'MERRIN', 'TARFFUL', 'SAWGERRERA'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: false },
    alignment: 'LS', leagueMin: 'CARBONITE', bestFor: 'attack',
    specialMission: true,
    note: '⭐ PRIORIDADE: libera Zeffo (dobra premiação do evento). Todos os membros farmáveis diretamente. Cal Kestis Cavaleiro Jedi requer todos em Gear 12.'
  },
  {
    id: 'gungans',
    name: 'Gungans (Boss Nass)',
    leader: 'BOSSNASS',
    members: ['BOSSNASS', 'GUNGANBOOMADIER', 'CAPTAINTARPALS', 'GUNGANPHALANX', 'JARJARBINKS'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'defense',
    omicronUnits: ['JARJARBINKS'],
    note: 'Comp meta GAC S76. Boss Nass lidera. Boomadier + Tarpals + Falange Gungan. Alta resiliência defensiva.'
  },
  {
    id: 'mace_windu_squad',
    name: 'Mace Windu (Conselho Jedi)',
    leader: 'MACEWINDU',
    members: ['MACEWINDU', 'AAYLASECURA', 'DEPABILLABA', 'JOCASTANU', 'JEDITEMPLECOURTGUARD'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'defense',
    note: 'Mace Windu lidera o Conselho Jedi no meta GAC S76. Aayla + Depa + Jocasta + Guarda do Templo.'
  },
  {
    id: 'saw_rebels',
    name: 'Rebeldes de Saw Gerrera',
    leader: 'SAWGERRERA',
    members: ['SAWGERRERA', 'BAZEMALBUS', 'CHIRRUTIMWE', 'KYLEKATARN', 'LUTHENRAEL'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'attack',
    omicronUnits: ['SAWGERRERA'],
    note: 'Comp ataque GAC S76. Saw + Baze + Chirrut farmáveis. Kyle Katarn + Luthen Rael completam.'
  },
  {
    id: 'queen_amidala_sq',
    name: 'Rainha Amidala (Naboo)',
    leader: 'QUEENAMIDALA',
    members: ['QUEENAMIDALA', 'GRANDMASTERYODA', 'MASTERQUIGON', 'PADAWANOBIWAN', 'SHAAKTI'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'attack',
    omicronUnits: ['AMIDALA'],
    note: 'Rainha Amidala (não Padmé) + GL Yoda + Mestre Qui-Gon + Obi-Wan Padawan + Shaak Ti. Meta GAC S76.'
  },
  {
    id: 'bad_batch_fugitives',
    name: 'Bad Batch Fugitivos (Season 3)',
    leader: 'HUNTERMERCENARY',
    members: ['HUNTERMERCENARY', 'WRECKERMERCENARY', 'CROSSHAIRSCARRED', 'OMEGAFUGITIVE', 'BATCHER'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    note: 'Versões Season 3 do Bad Batch. Hunter + Wrecker (Mercenários) + Crosshair (Cicatriz) + Omega Fugitiva + Batcher.'
  },

  // ══════════════════════════════════════════════════════════════════════
  // LIGHT SIDE — requerem jornada/GL
  // ══════════════════════════════════════════════════════════════════════
  // GL Rey — variants em cadeia de upgrade
  // A variante base sem Ben Solo já é meta defensivo por conta própria (Finn EP IX + Poe EP IX)
  {
    id: 'gl_rey_base',
    name: 'GL Rey + Resistência',
    leader: 'GLREY',
    members: ['GLREY', 'EPIXFINN', 'EPIXPOE', 'AMILYNHOLDO', 'L3_37'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLREY', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Squad meta defensivo mesmo sem Ben Solo — Finn EP IX + Poe EP IX formam sinergia forte com GL Rey.'
  },
  {
    id: 'gl_rey_ben',
    name: 'GL Rey + Ben Solo',
    leader: 'GLREY',
    members: ['GLREY', 'EPIXFINN', 'EPIXPOE', 'AMILYNHOLDO', 'BENSOLO'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLREY', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    omicronUnits: ['BENSOLO'],
    skipIfPlayerHas: ['CALKESTIS'],
    note: 'Ben Solo > L3-37. Upgrade para variant com Cal Kestis quando disponível.'
  },
  {
    id: 'gl_rey_ben_cal',
    name: 'GL Rey + Ben + Cal Kestis',
    leader: 'GLREY',
    members: ['GLREY', 'BENSOLO', 'CALKESTIS', 'EPIXFINN', 'EPIXPOE'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLREY', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    omicronUnits: ['BENSOLO'],
    skipIfPlayerHas: ['BARRISSOFFEE', 'EZRABRIDGER'],
    note: 'Cal Kestis é o maior upgrade sem precisar do Ezra Exilado. Boa defesa mesmo sem GL.'
  },
  {
    id: 'gl_rey_ben_cal_barriss',
    name: 'GL Rey + Cal + Barriss',
    leader: 'GLREY',
    members: ['GLREY', 'BENSOLO', 'CALKESTIS', 'BARRISSOFFEE', 'EPIXFINN'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLREY', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    omicronUnits: ['BENSOLO'],
    skipIfPlayerHas: ['EZRABRIDGER'],
    note: 'Melhor comp sem Ezra Exilado — Barriss Offee + Cal Kestis substituem bem o Ezra. Top defensivo mesmo no meta S76.'
  },
  {
    id: 'gl_rey_ben_ezra',
    name: 'GL Rey + Ben + Ezra',
    leader: 'GLREY',
    members: ['GLREY', 'BENSOLO', 'EZRABRIDGER', 'CALKESTIS', 'EPIXFINN'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLREY', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    omicronUnits: ['BENSOLO'],
    skipIfPlayerHas: ['BARRISSOFFEE'],
    note: 'Ezra Exilado + Cal Kestis — top meta. Adicionar Barriss para versão definitiva.'
  },
  {
    id: 'gl_rey_ben_ezra_barriss',
    name: 'GL Rey + Ezra + Barriss',
    leader: 'GLREY',
    members: ['GLREY', 'BENSOLO', 'EZRABRIDGER', 'CALKESTIS', 'BARRISSOFFEE'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLREY', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    omicronUnits: ['BENSOLO'],
    note: 'Squad definitivo GL Rey — Ezra Exilado + Cal Kestis + Barriss Offee. Top 3 defensivo S76.'
  },
  {
    id: 'gl_luke',
    name: 'GL Luke (Rebeldes)',
    leader: 'GRANDMASTERLUKE',
    members: ['GRANDMASTERLUKE', 'COMMANDERLUKESKYWALKER', 'HANSOLO', 'JEDIKNIGHTLUKE', 'WEDGEANTILLES'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GRANDMASTERLUKE', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    skipIfPlayerHas: ['JEDIKNIGHTREVAN'],
    note: 'GL — requer jornada heroica. CLS (pré-req) é farmável por Luke + Old Ben + R2-D2.'
  },
  {
    id: 'gl_luke_jkr',
    name: 'GL Luke + JKR (top meta)',
    leader: 'GRANDMASTERLUKE',
    members: ['GRANDMASTERLUKE', 'HERMITYODA', 'CALKESTIS', 'JEDIKNIGHTLUKE', 'JEDIKNIGHTREVAN'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GRANDMASTERLUKE', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    note: 'Top ataque meta GAC S76 (rank 4). JML + Yoda Eremita + Cal Kestis + Luke JK + JKR. Farm do JKR serve para ambos os squads.'
  },
  {
    id: 'jedi_master_kenobi',
    name: 'Mestre Jedi Kenobi + CAT',
    leader: 'JEDIMASTERKENOBI',
    members: ['JEDIMASTERKENOBI', 'GENERALSKYWALKER', 'COMMANDERAHSOKA', 'PADMEAMIDALA', 'GENERALKENOBI'],
    minRelic: 6, idealRelic: 8,
    journeyUnit: 'JEDIMASTERKENOBI', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    omicronUnits: ['GENERALSKYWALKER', 'COMMANDERAHSOKA', 'PADMEAMIDALA'],
    note: 'GL — requer jornada heroica. JMK + CAT é o squad mais forte do jogo.'
  },
  // GL Leia — 9 variants ordenadas por desempenho (melhor primeiro)
  {
    id: 'gl_leia_3po_rex',
    name: 'GL Leia + 3PO + Rex',
    leader: 'GLLEIA',
    members: ['GLLEIA', 'CAPTAINDROGAN', 'R2D2_LEGENDARY', 'C3POCHEWBACCA', 'CT7567'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLLEIA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    omicronUnits: ['CAPTAINDROGAN'],
    note: 'GL Leia — melhor desempenho de ataque (86%). Threepio+Chewie + Rex + Drogan + R2.'
  },
  {
    id: 'gl_leia_raddus',
    name: 'GL Leia + Raddus + Jyn',
    leader: 'GLLEIA',
    members: ['GLLEIA', 'CAPTAINDROGAN', 'R2D2_LEGENDARY', 'ADMIRALRADDUS', 'JYNERSO'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLLEIA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'both',
    omicronUnits: ['ADMIRALRADDUS', 'CAPTAINDROGAN'],
    note: 'GL Leia — 2ª melhor formação de ataque (84%). A mais popular (65K batalhas). Raddus + Jyn + Drogan + R2.'
  },
  {
    id: 'gl_leia_3po_oldben',
    name: 'GL Leia + 3PO + Obi-Wan',
    leader: 'GLLEIA',
    members: ['GLLEIA', 'CAPTAINDROGAN', 'R2D2_LEGENDARY', 'C3POCHEWBACCA', 'OLDBENKENOBI'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLLEIA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    skipIfPlayerHas: ['CT7567'],
    omicronUnits: ['CAPTAINDROGAN'],
    note: 'GL Leia — 83%. 3PO + Obi-Wan Velho + Drogan + R2. Usar quando não tem Rex.'
  },
  {
    id: 'gl_leia_han_chewie',
    name: 'GL Leia + Chewie + Han',
    leader: 'GLLEIA',
    members: ['GLLEIA', 'CAPTAINDROGAN', 'R2D2_LEGENDARY', 'CHEWBACCALEGENDARY', 'HANSOLO'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLLEIA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['CT7567', 'OLDBENKENOBI'],
    omicronUnits: ['CAPTAINDROGAN'],
    note: 'GL Leia — 82%. Chewie + Han + Drogan + R2. Alternativa sem Obi-Wan Velho ou Rex.'
  },
  {
    id: 'gl_leia_rex_ahsoka',
    name: 'GL Leia + Rex + Ahsoka',
    leader: 'GLLEIA',
    members: ['GLLEIA', 'CAPTAINDROGAN', 'R2D2_LEGENDARY', 'CT7567', 'FULCRUMAHSOKA'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLLEIA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['C3POCHEWBACCA'],
    omicronUnits: ['CAPTAINDROGAN'],
    note: 'GL Leia — 80%. Rex + Ahsoka (Fulcrum) + Drogan + R2. Usar quando não tem 3PO.'
  },
  {
    id: 'gl_leia_rex_mothma',
    name: 'GL Leia + Rex + Mon Mothma',
    leader: 'GLLEIA',
    members: ['GLLEIA', 'CAPTAINDROGAN', 'R2D2_LEGENDARY', 'CT7567', 'MONMOTHMA'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLLEIA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['C3POCHEWBACCA', 'FULCRUMAHSOKA'],
    omicronUnits: ['CAPTAINDROGAN'],
    note: 'GL Leia — 80%. Rex + Mon Mothma + Drogan + R2.'
  },
  {
    id: 'gl_leia_rex_oldben',
    name: 'GL Leia + Rex + Obi-Wan',
    leader: 'GLLEIA',
    members: ['GLLEIA', 'CAPTAINDROGAN', 'R2D2_LEGENDARY', 'CT7567', 'OLDBENKENOBI'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLLEIA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['C3POCHEWBACCA', 'FULCRUMAHSOKA', 'MONMOTHMA'],
    omicronUnits: ['CAPTAINDROGAN'],
    note: 'GL Leia — 80%. Rex + Obi-Wan Velho + Drogan + R2.'
  },
  {
    id: 'gl_leia_raddus_rex',
    name: 'GL Leia + Raddus + Rex',
    leader: 'GLLEIA',
    members: ['GLLEIA', 'CAPTAINDROGAN', 'R2D2_LEGENDARY', 'ADMIRALRADDUS', 'CT7567'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLLEIA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['C3POCHEWBACCA', 'JYNERSO'],
    omicronUnits: ['ADMIRALRADDUS', 'CAPTAINDROGAN'],
    note: 'GL Leia — 79%. Raddus + Rex + Drogan + R2. Usar quando não tem 3PO nem Jyn.'
  },
  {
    id: 'gl_leia_mothma_oldben',
    name: 'GL Leia + Mon Mothma + Obi-Wan',
    leader: 'GLLEIA',
    members: ['GLLEIA', 'CAPTAINDROGAN', 'R2D2_LEGENDARY', 'MONMOTHMA', 'OLDBENKENOBI'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLLEIA', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'both',
    skipIfPlayerHas: ['CT7567'],
    omicronUnits: ['CAPTAINDROGAN'],
    note: 'GL Leia — 79%. Mon Mothma + Obi-Wan Velho + Drogan + R2. Usar quando não tem Rex.'
  },

  // GL Ahsoka — 2 variants: sem Ezra e com Ezra
  {
    id: 'gl_ahsoka_initial',
    name: 'GL Ahsoka Tano (sem Ezra)',
    leader: 'GLAHSOKATANO',
    members: ['GLAHSOKATANO', 'FULCRUMAHSOKA', 'SABINEWRENS3', 'HUYANG', 'HERASYNDULLAS3'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLAHSOKATANO', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    skipIfPlayerHas: ['EZRABRIDGER'],
    note: 'Squad inicial. Quando Ezra estiver relicado, usar variant com Ezra.'
  },
  // ══════════════════════════════════════════════════════════════════════
  // SQUADS ADICIONAIS — S76 top attack/defense (SWGOH.GG data)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: 'baylan_skoll',
    name: 'Baylan Skoll (A Acólita)',
    leader: 'BAYLANSKOLL',
    members: ['BAYLANSKOLL', 'SHINHATI', 'MARROK', 'DASHRENDAR', 'QIRA'],
    minRelic: 6, idealRelic: 8,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'KYBER', bestFor: 'attack',
    omicronUnits: ['DASHRENDAR'],
    note: 'Top ataque Kyber S76 (~90% win). Baylan + Shin Hati + Marrok + Dash Rendar + Qira.'
  },
  {
    id: 'emperor_palpatine_sq',
    name: 'Imperador Palpatine (Galactic Empire)',
    leader: 'EMPERORPALPATINE',
    members: ['EMPERORPALPATINE', 'MARAJADE', 'ROYALGUARD', 'VADER', 'GRANDMOFFTARKIN'],
    minRelic: 6, idealRelic: 8,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'AURODIUM', bestFor: 'defense',
    note: 'Imperador + Mara Jade + Guarda Real + Vader + Tarkin. ~32% hold rate GAC S76.'
  },
  {
    id: 'boba_fett_bh',
    name: 'Boba Fett + Caçadores (Renegados)',
    leader: 'BOBAFETT',
    members: ['BOBAFETT', 'BOSSK', 'DENGAR', 'FENNECSHAND', 'ZAMWESELL'],
    minRelic: 6, idealRelic: 8,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'AURODIUM', bestFor: 'attack',
    omicronUnits: ['ZAMWESELL'],
    note: 'Top ataque S76 (87-94% win). Boba Fett + Bossk + Dengar + Fennec + Zam Wesell.'
  },
  {
    id: 'slkr_gac_atk',
    name: 'Líder Supremo Kylo Ren (GAC Ataque)',
    leader: 'SUPREMELEADERKYLOREN',
    members: ['SUPREMELEADERKYLOREN', 'REYDARKSIDE', 'GENERALHUX', 'KYLORENUNMASKED', 'SITHTROOPER'],
    minRelic: 6, idealRelic: 8,
    journeyUnit: 'SUPREMELEADERKYLOREN', minJourneyStars: 7,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'KYBER', bestFor: 'attack',
    note: 'Comp de ataque SLKR S76 (84-87% win). Rey Sombria + Hux + Kylo sem máscara + Sith Trooper.'
  },

  {
    id: 'gl_ahsoka_ezra',
    name: 'GL Ahsoka Tano + Ezra',
    leader: 'GLAHSOKATANO',
    members: ['GLAHSOKATANO', 'EZRABRIDGER', 'SABINEWRENS3', 'HUYANG', 'HERASYNDULLAS3'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'GLAHSOKATANO', minJourneyStars: 7,
    events: { rote: true, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Ezra Bridger substitui Ahsoka Fulcrum — squad definitivo de GL Ahsoka.'
  },

  // ══════════════════════════════════════════════════════════════════════
  // SQUADS S76 — líderes defensivos sem cadastro anterior
  // Dados extraídos do SWGOH.GG GAC Season 76 (abril 2026)
  // ══════════════════════════════════════════════════════════════════════

  // ─ Dark Side ─────────────────────────────────────────────────────────
  {
    id: 'third_sister_inq',
    name: 'Irmã Terceira (Inquisidores)',
    leader: 'THIRDSISTER',
    members: ['THIRDSISTER', 'GRANDINQUISITOR', 'SEVENTHSISTER', 'FIFTHBROTHER', 'EIGHTHBROTHER'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Irmã Terceira lidera os Inquisidores. Mesmos membros do squad do Grande Inquisidor, variant com win% mais alto em S76.'
  },
  {
    id: 'darth_traya_sith',
    name: 'Darth Traya (Sith Triumvirate)',
    leader: 'DARTHTRAYA',
    members: ['DARTHTRAYA', 'DARTHNIHILUS', 'DARTHSION', 'DARTHTALON', 'SAVAGEOPRESS'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'AURODIUM', bestFor: 'both',
    note: 'Darth Traya lidera comp Sith com Nihilus + Sion + Darth Talon + Savage. Forte GAC S76 Aurodium+.'
  },
  {
    id: 'grievous_droids',
    name: 'General Grievous (Droides)',
    leader: 'GRIEVOUS',
    members: ['GRIEVOUS', 'B1BATTLEDROIDV2', 'MAGNAGUARD', 'B2SUPERBATTLEDROID', 'DROIDEKA'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    note: 'Grievous + B1 + B2 + MagnaGuard + Droideika. Separatista/Droide clássico. 7.6K batalhas S76.'
  },
  {
    id: 'trench_sep',
    name: 'Almirante Trench (Separatistas)',
    leader: 'TRENCH',
    members: ['TRENCH', 'COUNTDOOKU', 'JANGOFETT', 'NUTEGUNRAY', 'WATTAMBOR'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    note: 'Almirante Trench + Separatistas clássicos. 5.6K batalhas S76.'
  },
  {
    id: 'iden_versio',
    name: 'Iden Versio (Império)',
    leader: 'IDENVERSIOEMPIRE',
    members: ['IDENVERSIOEMPIRE', 'SHORETROOPER', 'DEATHTROOPER', 'RANGETROOPER', 'STORMTROOPER'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Iden Versio + tropa Imperial. Shore + Death + Range + Storm Trooper. 3.6K batalhas S76.'
  },
  {
    id: 'phasma_fo',
    name: 'Capitã Phasma (Primeira Ordem)',
    leader: 'PHASMA',
    members: ['PHASMA', 'FIRSTORDERTIEPILOT', 'FIRSTORDEREXECUTIONER', 'FIRSTORDERTROOPER', 'KYLOREN'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Phasma lidera PO sem GL. Pilot + Executora + Trooper + Kylo. 2.2K batalhas S76.'
  },
  {
    id: 'grand_moff_tarkin',
    name: 'Grande Moff Tarkin (501st)',
    leader: 'GRANDMOFFTARKIN',
    members: ['GRANDMOFFTARKIN', 'SCORCH', 'APPO', 'DISGUISEDCLONETROOPER', 'OPERATIVE'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    note: 'Tarkin + squad 501st. Scorch + Appo + Clone Disfarçado + Operativo. 1.5K batalhas S76.'
  },
  {
    id: 'maul_shadow_collective',
    name: 'Maul (Coletivo das Sombras)',
    leader: 'MAULS7',
    members: ['MAULS7', 'GARSAXON', 'CANDEROUSORDO', 'IMPERIALSUPERCOMMANDO', 'JANGOFETT'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'AURODIUM', bestFor: 'both',
    note: 'Maul (S7) + Mandalorians Imperiais + Gar Saxon + Canderous. 1.4K batalhas S76.'
  },
  {
    id: 'tusken_raiders',
    name: 'Tuskens (Chefe dos Tuskens)',
    leader: 'TUSKENCHIEFTAIN',
    members: ['TUSKENCHIEFTAIN', 'TUSKENHUNTRESS', 'TUSKENRAIDER', 'TUSKENSHAMAN', 'URORRURRR'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'both',
    note: 'Squad Tusken completo. Chefe + Caçadora + Raider + Xamã + Urrorrurrr. 2.9K batalhas S76.'
  },
  {
    id: 'darthbane_solo',
    name: 'Darth Bane (Sith Solo Counter)',
    leader: 'DARTHBANE',
    members: ['DARTHBANE', 'COUNTDOOKU', 'SITHASSASSIN', 'SITHTROOPER', 'DARTHSIDIOUS'],
    minRelic: 6, idealRelic: 8,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: false },
    alignment: 'DS', leagueMin: 'KYBER', bestFor: 'attack',
    note: 'Darth Bane é counter quase solo — 28K batalhas S76 como atacante com ~96% win. O 5º membro é flexível (Dooku/Sith Assassin/Sith Trooper).'
  },

  // ─ Light Side ─────────────────────────────────────────────────────────
  {
    id: 'finn_resistance',
    name: 'Finn (Resistência)',
    leader: 'FINN',
    members: ['FINN', 'ZORIIBLISS_V2', 'EPIXFINN', 'EPIXPOE', 'ROSETICO'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'AURODIUM', bestFor: 'defense',
    note: 'Finn + Zorri Bliss + Finn (ET) + Poe (ET) + Rose Tico. 13.2K batalhas S76 como defesa.'
  },
  {
    id: 'jm_mace_windu',
    name: 'Mestre Jedi Mace Windu',
    leader: 'JEDIMASTERMACEWINDU',
    members: ['JEDIMASTERMACEWINDU', 'DEPABILLABA', 'VANGUARDTEMPLEGUARD', 'JOCASTANU', 'AAYLASECURA'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'KYBER', bestFor: 'both',
    note: 'JM Mace Windu + Conselho Jedi. Depa + Guarda do Templo + Jocasta + Aayla. 11.7K batalhas S76.'
  },
  {
    id: 'qui_gon_jinn',
    name: 'Qui-Gon Jinn (Conselho Jedi)',
    leader: 'QUIGONJINN',
    members: ['QUIGONJINN', 'ANAKINKNIGHT', 'KIADIMUNDI', 'KELLERANBEQ', 'MACEWINDU'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'attack',
    note: 'Qui-Gon + Anakin Cavaleiro + Ki-Adi + Kelleran + Mace. 4.8K batalhas S76.'
  },
  {
    id: 'mon_mothma_rebels',
    name: 'Mon Mothma (Rebeldes)',
    leader: 'MONMOTHMA',
    members: ['MONMOTHMA', 'KYLEKATARN', 'LUTHENRAEL', 'CARADUNE', 'PAO'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'both',
    note: 'Mon Mothma + Kyle Katarn + Luthen Rael + Cara Dune + Pao. 4.2K batalhas S76.'
  },
  {
    id: 'commander_luke',
    name: 'Comandante Luke Skywalker',
    leader: 'COMMANDERLUKESKYWALKER',
    members: ['COMMANDERLUKESKYWALKER', 'C3POCHEWBACCA', 'C3POLEGENDARY', 'CHEWBACCALEGENDARY', 'HANSOLO'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: 'COMMANDERLUKESKYWALKER', minJourneyStars: 7,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'AURODIUM', bestFor: 'attack',
    skipIfPlayerHas: ['GRANDMASTERLUKE', 'GLLEIA'],
    note: 'CLS + Threepio & Chewie + C-3PO + Chewbacca + Han. Oculto quando JML ou GL Leia disponíveis.'
  },
  {
    id: 'commander_luke_alt',
    name: 'Comandante Luke Skywalker (alt)',
    leader: 'COMMANDERLUKESKYWALKER',
    members: ['COMMANDERLUKESKYWALKER', 'HANSOLO', 'CHEWBACCALEGENDARY', 'OLDBENKENOBI', 'R2D2_LEGENDARY'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: 'COMMANDERLUKESKYWALKER', minJourneyStars: 7,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'AURODIUM', bestFor: 'attack',
    skipIfPlayerHas: ['GRANDMASTERLUKE'],
    note: 'CLS sem Threepio & Chewie — alternativa quando GL Leia usa Threepio & Chewie. Han + Chewie + Obi-Wan + R2.'
  },
  {
    id: 'admiral_raddus',
    name: 'Almirante Raddus (Rebeldes)',
    leader: 'ADMIRALRADDUS',
    members: ['ADMIRALRADDUS', 'CASSIANANDOR', 'JYNERSO', 'K2SO', 'BISTAN'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    note: 'Raddus + Cassian + Jyn + K-2SO + Bistan. Counter 99% win. 5.7K batalhas S76.'
  },
  {
    id: 'hera_ghost_crew',
    name: 'Hera Syndulla (Tripulação do Ghost)',
    leader: 'HERASYNDULLAS3',
    members: ['HERASYNDULLAS3', 'CAPTAINREX', 'KANANJARRUSS3', 'CHOPPERS3', 'SABINEWRENS3'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'AURODIUM', bestFor: 'defense',
    note: 'Hera (S3) + Rex + Kanan (S3) + Chopper (S3) + Sabine (S3). Ghost Crew Season 3. 2K batalhas S76.'
  },
  {
    id: 'kelleran_beq',
    name: 'Kelleran Beq (Conselho Jedi)',
    leader: 'KELLERANBEQ',
    members: ['KELLERANBEQ', 'JOCASTANU', 'SHAAKTI', 'VANGUARDTEMPLEGUARD', 'AAYLASECURA'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'both',
    note: 'Kelleran Beq + Jocasta Nu + Shaak Ti + Guarda do Templo + Aayla. 1.1K batalhas S76.'
  },
  {
    id: 'chief_chirpa_ewoks',
    name: 'Chefe Chirpa (Ewoks)',
    leader: 'CHIEFCHIRPA',
    members: ['CHIEFCHIRPA', 'PRINCESSKNEESAA', 'WICKET', 'PAPLOO', 'LOGRAY'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'both',
    note: 'Ewoks clássicos: Chirpa + Princesa Kneesaa + Wicket + Paploo + Logray.'
  },
  {
    id: 'carth_onasi_kotor',
    name: 'Carth Onasi (KOTOR LS)',
    leader: 'CARTHONASI',
    members: ['CARTHONASI', 'MISSIONVAO', 'ZAALBAR', 'JOLEEBINDO', 'JUHANI'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    note: 'Carth Onasi + Mission Vao + Zaalbar + Jolee Bindo + Juhani. KOTOR LS squad. 94% win, 745 batalhas S76.'
  },

  // ─ Mixed / Neutros ────────────────────────────────────────────────────
  {
    id: 'maz_kanata_pirates',
    name: 'Maz Kanata (Piratas)',
    leader: 'MAZKANATA',
    members: ['MAZKANATA', 'ITHANO', 'KIX', 'QUIGGOLD', 'HONDO'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'BRONZIUM', bestFor: 'defense',
    note: 'Maz Kanata + Capitão Ithano + Kix + Quiggold + Hondo. 10.2K batalhas S76 como defesa.'
  },
  {
    id: 'mandalor_bokatan',
    name: 'Bo-Katan (Mand\'alor) GL',
    leader: 'MANDALORBOKATAN',
    members: ['MANDALORBOKATAN', 'BOKATAN', 'IG12', 'PAZVIZSLA', 'THEMANDALORIANBESKARARMOR'],
    minRelic: 5, idealRelic: 8,
    journeyUnit: 'MANDALORBOKATAN', minJourneyStars: 7,
    events: { rote: false, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'KYBER', bestFor: 'both',
    note: 'GL Bo-Katan (Mand\'alor) + Bo-Katan regular + IG-12 + Paz Vizsla + O Mandaloriano. 14.8K batalhas S76.'
  },
  {
    id: 'boba_fett_scion',
    name: 'Boba Fett Scion de Jango',
    leader: 'BOBAFETTSCION',
    members: ['BOBAFETTSCION', 'ASAJJDARKDISCIPLE', 'FENNECSHAND', '4LOM', 'ZUCKUSS'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'CHROMIUM', bestFor: 'both',
    note: 'Boba Fett Scion + Aprendiz da Asajj + Fennec Shand + 4-LOM + Zuckuss. 1.5K batalhas S76.'
  },
  {
    id: 'dash_rendar_scoundrels',
    name: 'Dash Rendar (Facínoras)',
    leader: 'DASHRENDAR',
    members: ['DASHRENDAR', 'YOUNGCHEWBACCA', 'L3_37', 'ENFYSNEST', 'KUIIL'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'CHROMIUM', bestFor: 'both',
    note: 'Dash Rendar + Chewie Jovem + L3-37 + Enfys Nest + Kuiil. 652 batalhas S76.'
  },
  {
    id: 'chief_nebit_jawas',
    name: 'Chefe Nebit (Jawas)',
    leader: 'CHIEFNEBIT',
    members: ['CHIEFNEBIT', 'DATHCHA', 'JAWA', 'JAWAENGINEER', 'JAWASCAVENGER'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'BRONZIUM', bestFor: 'both',
    note: 'Nebit + Dathcha + Jawa + Engenheiro Jawa + Catador Jawa. Squad Jawa completo.'
  },

  // Bad Batch Fugitivos Season 3 — Omega como líder defensiva
  {
    id: 'omega_s3_fugitive',
    name: 'Omega Fugitiva (Bad Batch S3)',
    leader: 'OMEGAS3',
    members: ['OMEGAS3', 'HUNTERS3', 'WRECKERS3', 'CROSSHAIRS3', 'BATCHERS3'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Omega Fugitiva lidera o Bad Batch S3. Hunter + Wrecker + Crosshair + Batcher (S3). 5.3K batalhas S76.'
  },
  {
    id: 'savage_opress_sith',
    name: 'Savage Opress (Sith)',
    leader: 'SAVAGEOPRESS',
    members: ['SAVAGEOPRESS', 'DARTHTRAYA', 'DARTHNIHILUS', 'DARTHSION', 'DARTHTALON'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'AURODIUM', bestFor: 'attack',
    note: 'Savage Opress liderando Triunvirato Sith. 87% win como atacante, 325 batalhas S76.'
  },

  // ─ Squads adicionais — líderes com 100-1200 batalhas S76 ─────────────
  {
    id: 'captain_enoch_nighttroopers',
    name: 'Capitão Enoch (Night Troopers)',
    leader: 'CAPTAINENOCH',
    members: ['CAPTAINENOCH', 'DEATHTROOPERPERIDEA', 'NIGHTTROOPER', 'SCOUTTROOPER_V3', 'TIEFIGHTERPILOT'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'CHROMIUM', bestFor: 'defense',
    note: 'Capitão Enoch lidera Night Troopers de Peridea. Variant do squad Moff Gideon S3. 1.1K batalhas S76.'
  },
  {
    id: 'bossk_bh',
    name: 'Bossk (Caçadores de Recompensa)',
    leader: 'BOSSK',
    members: ['BOSSK', 'DENGAR', 'ZAMWESELL', 'BOBAFETT', 'FENNECSHAND'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'MS', leagueMin: 'BRONZIUM', bestFor: 'both',
    note: 'Bossk lidera BH clássicos: Dengar + Zam + Boba + Fennec. 691 batalhas S76.'
  },
  {
    id: 'ct7567_clones',
    name: 'CT-7567 Rex (Clones 501st)',
    leader: 'CT7567',
    members: ['CT7567', 'CT5555', 'ARCTROOPER501ST', 'CT210408', 'GENERALKENOBI'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'CHROMIUM', bestFor: 'attack',
    note: 'Rex liderando 501st: Fives + ARC Trooper + Cody + Kenobi. 239 batalhas S76.'
  },
  {
    id: 'veers_empire',
    name: 'General Veers (Império)',
    leader: 'VEERS',
    members: ['VEERS', 'ADMIRALPIETT', 'COLONELSTARCK', 'DARKTROOPER', 'RANGETROOPER'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'BRONZIUM', bestFor: 'defense',
    note: 'Veers + Piett + Coronel Starck + Dark Trooper + Range Trooper. 187 batalhas S76.'
  },
  {
    id: 'vader_empire',
    name: 'Darth Vader (Império clássico)',
    leader: 'VADER',
    members: ['VADER', 'ADMIRALPIETT', 'COLONELSTARCK', 'VEERS', 'GRANDADMIRALTHRAWN'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'BRONZIUM', bestFor: 'defense',
    note: 'Vader (sem GL) liderando Império clássico. Piett + Starck + Veers + Thrawn. 159 batalhas S76.'
  },
  {
    id: 'stormtrooper_luke',
    name: 'Luke Stormtrooper (Rebeldes OT)',
    leader: 'STORMTROOPERLUKE',
    members: ['STORMTROOPERLUKE', 'PRINCESSLEIA', 'STORMTROOPERHAN', 'CHEWBACCALEGENDARY', 'HANSOLO'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'both',
    note: 'Luke (Stormtrooper) + Leia + Han (Stormtrooper) + Chewie Lendário + Han Solo. Squad OT original. 796 batalhas S76.'
  },
  {
    id: 'rey_jedi_training',
    name: 'Rey (Treinamento Jedi)',
    leader: 'REYJEDITRAINING',
    members: ['REYJEDITRAINING', 'BB8', 'EPIXPOE', 'AMILYNHOLDO', 'EPIXFINN'],
    minRelic: 5, idealRelic: 7,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'LS', leagueMin: 'BRONZIUM', bestFor: 'both',
    skipIfPlayerHas: ['GLREY'],
    note: 'Rey JT + BB-8 + Poe (ET) + Holdo + Finn (ET). Resistência sem GL. 138 batalhas S76. Oculto quando GL Rey disponível.'
  },

  // ─ Dark Side — Cere Junda (cross-alignment) ──────────────────────────
  {
    id: 'cere_junda',
    name: 'Cere Junda (Inquisidores + Jedi)',
    leader: 'CEREJUNDA',
    members: ['CEREJUNDA', 'CALKESTIS', 'TARONMALICOS', 'FULCRUMAHSOKA', 'KYLORENUNMASKED'],
    minRelic: 6, idealRelic: 8,
    journeyUnit: null,
    events: { rote: false, gac: true, tw: true },
    alignment: 'DS', leagueMin: 'AURODIUM', bestFor: 'attack',
    note: 'Cere Junda + Cal Kestis + Taron Malicos + Ahsoka Fulcrum + Kylo sem máscara. 6.6K batalhas S76, até 100% win.'
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
