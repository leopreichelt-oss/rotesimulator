/**
 * missionSquads.js
 * Composições de esquadrões válidas por missão de batalha no ROTE.
 *
 * Fonte: tb_combat_eligibility_all_planets.json
 *
 * Lógica:
 *   Um jogador é ELEGÍVEL para uma missão se tiver TODOS os personagens de
 *   ao menos UMA composição no relic mínimo do planeta.
 *
 * MISSION_SQUADS[planeta][missão] pode ser:
 *   - Array de { require:[unitId,...], isShip?:true } → checar roster do jogador
 *   - [] (array vazio)                               → 0 elegíveis confirmado
 *   - undefined / ausente                            → sem dados, usa keyUnit fallback
 *
 * Abreviações → base_id usadas:
 *   Palp=EMPERORPALPATINE, LV=LORDVADER, DV=VADER, SEE=SITHETERNALPALPATINE,
 *   MJ=MARAJADE, SLK=SUPREMELEADERKYLOREN, KRU=KYLORENUNMASKED, Hux=GENERALHUX,
 *   GI=GRANDINQUISITOR, 5th=FIFTHBROTHER, 7th=SEVENTHSISTER, 8th=EIGHTHBROTHER,
 *   9th=NINTHSISTER, 2nd=SECONDSISTER, Reva=THIRDSISTER, DTMG=MOFFGIDEONTROOPER,
 *   GM=GREATMOTHERS, GAS=GENERALSKYWALKER, CAT=COMMANDERAHSOKA,
 *   JMK=JEDIMASTERKENOBI, GK=GENERALKENOBI, Snips=AHSOKATANO, JKA=ANAKINKNIGHT,
 *   JML=GRANDMASTERLUKE, JKL=JEDIKNIGHTLUKE, JKR=JEDIKNIGHTREVAN,
 *   GMY=GRANDMASTERYODA, KAM=KIADIMUNDI, ST=SHAAKTI, OGMace=MACEWINDU,
 *   CLS=COMMANDERLUKESKYWALKER, CRex=CAPTAINREX, RJT=REYJEDITRAINING,
 *   5s=CT5555, Rex=CT7567, Echo=CT210408, ARC=ARCTROOPER501ST,
 *   Jabba=JABBATHEHUTT, Fennec=FENNECSHAND, GG=GRIEVOUS,
 *   Malgus=DARTHMALGUS, DR=DARTHREVAN, Malak=DARTHMALAK, BSF=BASTILASHANDARK,
 *   Traya=DARTHTRAYA, Sion=DARTHSION, DN=DARTHNIHILUS, SET=SITHEMPIRETROOPER,
 *   Wat=WATTAMBOR, Nute=NUTEGUNRAY, Dooku=COUNTDOOKU, Trench=TRENCH,
 *   Cass=CASSIANANDORS1, BAM=MANDALORIANBESKAR, BKM=BOKATANMANDALORE,
 *   Nego=CAPITALNEGOTIATOR, Prof=CAPITALPROFUNDITY, Exec=CAPITALEXECUTOR,
 *   Lev=CAPITALLEVIATHAN, Chim=CAPITALCHIMAERA, Mal=CAPITALMALEVOLENCE,
 *   GLAT=GLAHSOKATANO, JMMW=JEDIMASTERMACEWINDU, Enoch=CAPTAINENOCH,
 *   NT=NIGHTTROOPER, DTP=DEATHTROOPERPERIDEA
 *
 * IDs ainda sem confirmação: Depa (Depa Billaba), TG, JN, Bolo, RHF, RHP
 */

var MISSION_SQUADS = {

  // ══════════════════════════════════════════════════════════════════════
  // MUSTAFAR — DS Fase 1 / Tier 1 (R5)
  // ══════════════════════════════════════════════════════════════════════
  "Mustafar": {
    // M1 Lord Vader → keyUnit:['LORDVADER'] no COMBAT_MISSION_REQS (não sobrescrever)
    // M2 Any DS
    2: [
      { require: ['SUPREMELEADERKYLOREN', 'GENERALHUX'] },
      { require: ['EMPERORPALPATINE', 'MARAJADE', 'VADER'] },
      // valid ineligible (trabalham no tier, só precisam melhorar):
      { require: ['MOFFGIDEONTROOPER'] },
      { require: ['THIRDSISTER', 'SEVENTHSISTER'] },
      { require: ['DARTHTRAYA', 'SITHETERNALPALPATINE', 'DARTHNIHILUS', 'DARTHSION'] },
      { require: ['MOTHERTALZIN', 'DAKA', 'NIGHTSISTERZOMBIE'] },
    ],
    // M3 Any DS
    3: [
      { require: ['GRANDINQUISITOR', 'NINTHSISTER', 'SEVENTHSISTER', 'FIFTHBROTHER'] },
      { require: ['EMPERORPALPATINE', 'MARAJADE', 'VADER'] },
      { require: ['SITHETERNALPALPATINE', 'WATTAMBOR'] },
      { require: ['DARTHMALGUS', 'DARTHMALAK', 'DARTHREVAN', 'BASTILASHANDARK'] },
      { require: ['THIRDSISTER', 'SEVENTHSISTER'] },
      { require: ['GREATMOTHERS', 'MERRIN', 'MORGANELSBETH'] },
      { require: ['MOFFGIDEONTROOPER'] },
      { require: ['TRENCH', 'WATTAMBOR', 'JANGOFETT', 'NUTEGUNRAY', 'COUNTDOOKU'] },
    ],
    // M4 Any DS
    4: [
      { require: ['SITHETERNALPALPATINE', 'WATTAMBOR'] },
      { require: ['THIRDSISTER', 'SEVENTHSISTER'] },
      { require: ['MOFFGIDEONTROOPER'] },
      { require: ['SITHETERNALPALPATINE', 'WATTAMBOR', 'NIGHTSISTERZOMBIE', 'DAKA'] },
      { require: ['DARTHMALGUS', 'DARTHREVAN', 'DARTHMALAK', 'DARTHTALON'] },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // CORELLIA — MX Fase 1 / Tier 1 (R5)
  // ══════════════════════════════════════════════════════════════════════
  "Corellia": {
    // M1 Aphra → keyUnit no COMBAT_MISSION_REQS
    // M2 Any
    2: [
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN'] },
      { require: ['FINN'] },
      { require: ['REYJEDITRAINING', 'C3POLEGENDARY', 'R2D2_LEGENDARY', 'BB8'] },
      { require: ['COMMANDERLUKESKYWALKER', 'HANSOLO', 'C3POCHEWBACCA', 'CHEWBACCALEGENDARY', 'C3POLEGENDARY'] },
      { require: ['GLREY'] },
      { require: ['GENERALSKYWALKER', 'CT5555', 'CAPTAINREX', 'CT210408', 'ARCTROOPER501ST'] },
      { require: ['ADMIRALRADDUS', 'CASSIANANDORS1', 'JYNERSO'] },
    ],
    // M3 Jabba → keyUnit no COMBAT_MISSION_REQS
    // M4 Qi'ra special → keyUnit requireAll no COMBAT_MISSION_REQS
    // M5 LMF ship → keyUnit isShip no COMBAT_MISSION_REQS
  },

  // ══════════════════════════════════════════════════════════════════════
  // CORUSCANT — LS Fase 1 / Tier 1 (R5)
  // ══════════════════════════════════════════════════════════════════════
  "Coruscant": {
    // M1 Outrider → keyUnit isShip no COMBAT_MISSION_REQS
    // M2 Any LS
    2: [
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN'] },
      { require: ['JEDIMASTERKENOBI', 'BADBATCHHUNTER', 'BADBATCHWRECKER', 'BADBATCHTECH', 'CT210408'] },
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA'] },
      { require: ['FINN', 'REYJEDITRAINING', 'BB8'] },
      { require: ['PADMEAMIDALA', 'ANAKINKNIGHT', 'AHSOKATANO', 'COMMANDERAHSOKA'] },
      { require: ['JEDIMASTERKENOBI', 'GENERALKENOBI', 'AHSOKATANO'] },
      { require: ['COMMANDERLUKESKYWALKER', 'HANSOLO', 'C3POCHEWBACCA', 'CHEWBACCALEGENDARY', 'C3POLEGENDARY'] },
      { require: ['GLREY'] },
      { require: ['BADBATCHHUNTER', 'CT210408', 'BADBATCHWRECKER', 'BADBATCHTECH', 'BADBATCHOMEGA'] },
    ],
    // M3 Any LS
    3: [
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN'] },
      { require: ['JEDIMASTERKENOBI', 'BADBATCHHUNTER', 'BADBATCHWRECKER', 'BADBATCHTECH', 'CT210408'] },
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA'] },
      { require: ['FINN', 'REYJEDITRAINING', 'BB8'] },
      { require: ['PADMEAMIDALA', 'ANAKINKNIGHT', 'AHSOKATANO', 'COMMANDERAHSOKA'] },
      { require: ['JEDIMASTERKENOBI', 'GENERALKENOBI', 'AHSOKATANO'] },
      { require: ['COMMANDERLUKESKYWALKER', 'HANSOLO', 'C3POCHEWBACCA', 'CHEWBACCALEGENDARY', 'C3POLEGENDARY'] },
      { require: ['GLREY'] },
    ],
    // M4 Jedi
    4: [
      { require: ['GRANDMASTERLUKE', 'JEDIKNIGHTLUKE'] },
      { require: ['GRANDMASTERLUKE', 'SHAAKTI', 'GRANDMASTERYODA'] },
      { require: ['JEDIKNIGHTREVAN', 'GRANDMASTERYODA', 'BASTILASHAN', 'JOLEEBINDO'] },
      { require: ['JEDIMASTERKENOBI', 'GENERALKENOBI', 'AHSOKATANO'] },
    ],
    // M5 Jedi+Mace+Kit
    5: [
      { require: ['JEDIMASTERKENOBI', 'MACEWINDU', 'KITFISTO', 'GENERALKENOBI', 'AHSOKATANO'] },
      { require: ['JEDIMASTERKENOBI', 'MACEWINDU', 'KITFISTO', 'KIADIMUNDI', 'AHSOKATANO'] },
      { require: ['JEDIMASTERKENOBI', 'KITFISTO', 'MACEWINDU', 'KIADIMUNDI', 'GENERALKENOBI'] },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // GEONOSIS — DS Fase 2 / Tier 2 (R6)
  // ══════════════════════════════════════════════════════════════════════
  "Geonosis": {
    // M1 Reek
    1: [
      { require: ['LORDVADER'] },
      { require: ['SUPREMELEADERKYLOREN'] },
      { require: ['SITHETERNALPALPATINE', 'WATTAMBOR'] },
      { require: ['DARTHTRAYA', 'SITHETERNALPALPATINE'] },
      { require: ['SITHETERNALPALPATINE', 'WATTAMBOR', 'DARTHMALAK', 'DARTHMALGUS'] },
      { require: ['DOCTORAPHRA', 'GRIEVOUS', 'VADER'] },
      { require: ['TRENCH', 'WATTAMBOR', 'JANGOFETT', 'NUTEGUNRAY', 'COUNTDOOKU'] },
      { require: ['DARTHMALGUS', 'DARTHREVAN', 'DARTHMALAK', 'BASTILASHANDARK'] },
      { require: ['MOTHERTALZIN', 'DAKA', 'NIGHTSISTERZOMBIE'] },
    ],
    // M2 Acklay
    2: [
      { require: ['GRANDINQUISITOR', 'NINTHSISTER', 'SEVENTHSISTER', 'FIFTHBROTHER'] },
      { require: ['LORDVADER', 'WATTAMBOR'] },
      { require: ['FIFTHBROTHER', 'EIGHTHBROTHER', 'SEVENTHSISTER', 'NINTHSISTER', 'SECONDSISTER'] },
      { require: ['SUPREMELEADERKYLOREN', 'GRANDADMIRALTHRAWN'] },
      { require: ['FIFTHBROTHER', 'EIGHTHBROTHER', 'SEVENTHSISTER', 'NINTHSISTER', 'ADMIRALPIETT'] },
      { require: ['EMPERORPALPATINE', 'FIFTHBROTHER', 'SEVENTHSISTER', 'NINTHSISTER'] },
      { require: ['GREATMOTHERS', 'MORGANELSBETH'] },
      { require: ['THIRDSISTER', 'SEVENTHSISTER'] },
      { require: ['BOSSK', 'FENNECSHAND', 'BOBAFETTSCION', 'JANGOFETT', 'WATTAMBOR'] },
    ],
    // M3 R7 Geonosianos → keyUnit:['GEONOSIANBROODALPHA'] no COMBAT_MISSION_REQS
    // M4 Nexu
    4: [
      { require: ['SUPREMELEADERKYLOREN', 'KYLORENUNMASKED', 'GENERALHUX'] },
      { require: ['LORDVADER'] },
      { require: ['SUPREMELEADERKYLOREN', 'KYLORENUNMASKED'] },
      { require: ['EMPERORPALPATINE', 'VADER', 'ADMIRALPIETT', 'GRANDADMIRALTHRAWN'] },
      { require: ['THIRDSISTER', 'GRANDINQUISITOR', 'SEVENTHSISTER', 'EIGHTHBROTHER'] },
      { require: ['EMPERORPALPATINE', 'VADER', 'GRANDADMIRALTHRAWN', 'ADMIRALPIETT', 'DEATHTROOPER'] },
    ],
    // M5 DS ship (atualmente keyUnit:null, isShip:true)
    5: [
      { require: ['CAPITALLEVIATHAN'], isShip: true },
      { require: ['CAPITALEXECUTOR'], isShip: true },
      { require: ['CAPITALCHIMAERA'], isShip: true },
      { require: ['CAPITALMALEVOLENCE'], isShip: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // FELUCIA — MX Fase 2 / Tier 2 (R6)
  // ══════════════════════════════════════════════════════════════════════
  "Felucia": {
    // M1 Young Lando → keyUnit no COMBAT_MISSION_REQS
    // M2 Hondo → keyUnit no COMBAT_MISSION_REQS
    // M3 Any
    3: [
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN'] },
      { require: ['REYJEDITRAINING', 'BB8', 'R2D2_LEGENDARY'] },
      { require: ['SITHETERNALPALPATINE', 'WATTAMBOR'] },
      { require: ['COMMANDERLUKESKYWALKER', 'HANSOLO', 'CHEWBACCALEGENDARY', 'C3POLEGENDARY'] },
      { require: ['GENERALSKYWALKER', 'CT5555', 'CAPTAINREX', 'CT210408', 'ARCTROOPER501ST'] },
      { require: ['BADBATCHHUNTER', 'CT210408', 'BADBATCHWRECKER', 'BADBATCHTECH', 'BADBATCHOMEGA'] },
    ],
    // M4 Jabba → keyUnit no COMBAT_MISSION_REQS
    // M5 Any ship
    5: [
      { require: ['CAPITALNEGOTIATOR'], isShip: true },
      { require: ['CAPITALEXECUTOR'], isShip: true },
      { require: ['CAPITALMALEVOLENCE'], isShip: true },
      { require: ['CAPITALPROFUNDITY'], isShip: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // BRACCA — LS Fase 2 / Tier 2 (R6)
  // ══════════════════════════════════════════════════════════════════════
  "Bracca": {
    // M1 Any LS
    1: [
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA', 'AHSOKATANO', 'GENERALKENOBI', 'PADMEAMIDALA'] },
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN', 'CAPTAINREX'] },
      { require: ['REYJEDITRAINING', 'BB8', 'R2D2_LEGENDARY'] },
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA', 'GENERALKENOBI'] },
      { require: ['PRINCESSLEIA', 'CAPTAINDROGAN', 'CAPTAINREX', 'HANSOLO', 'CHEWBACCALEGENDARY'] },
      { require: ['PRINCESSLEIA', 'CAPTAINDROGAN', 'CAPTAINREX'] },
      { require: ['REYJEDITRAINING', 'BB8', 'C3POLEGENDARY', 'R2D2_LEGENDARY'] },
      { require: ['BOKATANMANDALORE', 'MANDALORIANBESKAR', 'IG12'] },
      { require: ['JEDIMASTERKENOBI', 'BADBATCHHUNTER', 'BADBATCHWRECKER', 'BADBATCHTECH', 'CT210408'] },
    ],
    // M2 Jedi
    2: [
      { require: ['GRANDMASTERLUKE', 'JEDIKNIGHTLUKE', 'JEDIKNIGHTREVAN'] },
      { require: ['GRANDMASTERLUKE', 'SHAAKTI', 'GRANDMASTERYODA'] },
      { require: ['JEDIKNIGHTLUKE', 'GRANDMASTERLUKE', 'GRANDMASTERYODA'] },
    ],
    // M3 Any LS
    3: [
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA', 'AHSOKATANO', 'GENERALKENOBI', 'PADMEAMIDALA'] },
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN', 'CAPTAINREX'] },
      { require: ['REYJEDITRAINING', 'BB8', 'R2D2_LEGENDARY'] },
      { require: ['PADMEAMIDALA', 'COMMANDERAHSOKA', 'ANAKINKNIGHT'] },
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA', 'GENERALKENOBI'] },
      { require: ['PRINCESSLEIA', 'CAPTAINDROGAN', 'CAPTAINREX', 'HANSOLO', 'CHEWBACCALEGENDARY'] },
      { require: ['PRINCESSLEIA', 'CAPTAINDROGAN', 'CAPTAINREX'] },
      { require: ['BOKATANMANDALORE', 'MANDALORIANBESKAR', 'IG12'] },
      { require: ['ADMIRALRADDUS', 'CASSIANANDORS1', 'JYNERSO', 'SCARIFPATHFINDER', 'K2SO'] },
      { require: ['BADBATCHHUNTER', 'CT210408', 'BADBATCHWRECKER', 'BADBATCHTECH', 'BADBATCHOMEGA'] },
    ],
    // M4 Any LS ship
    4: [
      { require: ['CAPITALPROFUNDITY'], isShip: true },
      { require: ['CAPITALNEGOTIATOR'], isShip: true },
    ],
    // M5 special unlock → computeSpecialMissionEligible
  },

  // ══════════════════════════════════════════════════════════════════════
  // DATHOMIR — DS Fase 3 / Tier 3 (R7)
  // ══════════════════════════════════════════════════════════════════════
  "Dathomir": {
    // M1 Empire
    1: [
      { require: ['EMPERORPALPATINE', 'LORDVADER', 'ADMIRALPIETT'] },
      { require: ['EMPERORPALPATINE', 'ADMIRALPIETT', 'VADER'] },
      { require: ['EMPERORPALPATINE', 'FIFTHBROTHER', 'SEVENTHSISTER', 'NINTHSISTER'] },
      { require: ['EMPERORPALPATINE', 'NINTHSISTER', 'SEVENTHSISTER', 'FIFTHBROTHER'] },
      { require: ['LORDVADER', 'ROYALGUARD', 'VADER', 'ADMIRALPIETT'] },
      { require: ['MOFFGIDEONTROOPER', 'DEATHTROOPER'] },
      { require: ['THIRDSISTER', 'SEVENTHSISTER'] },
      { require: ['EMPERORPALPATINE', 'VADER', 'ADMIRALPIETT', 'ROYALGUARD'] },
    ],
    // M2 Any DS
    2: [
      { require: ['GRIEVOUS', 'SITHETERNALPALPATINE', 'WATTAMBOR', 'NUTEGUNRAY'] },
      { require: ['DARTHMALGUS', 'SITHETERNALPALPATINE'] },
      { require: ['EMPERORPALPATINE', 'SITHETERNALPALPATINE'] },
      { require: ['SUPREMELEADERKYLOREN', 'KYLORENUNMASKED', 'WATTAMBOR'] },
      { require: ['MOFFGIDEONTROOPER', 'DEATHTROOPER'] },
      { require: ['THIRDSISTER', 'SEVENTHSISTER'] },
      { require: ['DARTHTRAYA', 'SITHETERNALPALPATINE', 'DARTHSION', 'DARTHNIHILUS'] },
      { require: ['SUPREMELEADERKYLOREN', 'DAKA', 'NIGHTSISTERZOMBIE', 'KYLORENUNMASKED'] },
      { require: ['DARTHMALGUS', 'DARTHMALAK', 'DARTHREVAN', 'BASTILASHANDARK', 'WATTAMBOR'] },
      { require: ['GRIEVOUS', 'B1BATTLEDROIDV2', 'B2SUPERBATTLEDROID', 'MAGNAGUARD', 'WATTAMBOR'] },
    ],
    // M3 Aphra → keyUnit:['DOCTORAPHRA'] no COMBAT_MISSION_REQS
    // M4 Any DS (idêntico ao M2)
    4: [
      { require: ['GRIEVOUS', 'SITHETERNALPALPATINE', 'WATTAMBOR', 'NUTEGUNRAY'] },
      { require: ['DARTHMALGUS', 'SITHETERNALPALPATINE'] },
      { require: ['EMPERORPALPATINE', 'SITHETERNALPALPATINE'] },
      { require: ['SUPREMELEADERKYLOREN', 'KYLORENUNMASKED', 'WATTAMBOR'] },
      { require: ['MOFFGIDEONTROOPER', 'DEATHTROOPER'] },
      { require: ['THIRDSISTER', 'SEVENTHSISTER'] },
      { require: ['DARTHTRAYA', 'SITHETERNALPALPATINE', 'DARTHSION', 'DARTHNIHILUS'] },
      { require: ['SUPREMELEADERKYLOREN', 'DAKA', 'NIGHTSISTERZOMBIE', 'KYLORENUNMASKED'] },
      { require: ['DARTHMALGUS', 'DARTHMALAK', 'DARTHREVAN', 'BASTILASHANDARK', 'WATTAMBOR'] },
    ],
    // M5 Merrin → keyUnit:['MERRIN'] no COMBAT_MISSION_REQS
  },

  // ══════════════════════════════════════════════════════════════════════
  // TATOOINE — MX Fase 3 / Tier 3 (R7)
  // ══════════════════════════════════════════════════════════════════════
  "Tatooine": {
    // M1 Any
    1: [
      { require: ['JEDIMASTERKENOBI'] },
      { require: ['GLREY', 'BB8', 'R2D2_LEGENDARY', 'REYJEDITRAINING'] },
      { require: ['WAMPA'] },
      { require: ['REYJEDITRAINING', 'BB8', 'C3POLEGENDARY', 'R2D2_LEGENDARY'] },
      { require: ['COMMANDERLUKESKYWALKER', 'HANSOLO', 'C3POCHEWBACCA', 'CHEWBACCALEGENDARY', 'C3POLEGENDARY'] },
      { require: ['COMMANDERLUKESKYWALKER', 'R2D2_LEGENDARY'] },
      { require: ['GRANDMASTERLUKE', 'JEDIKNIGHTLUKE'] },
      { require: ['GENERALSKYWALKER', 'CAPTAINREX', 'CT5555', 'CT210408', 'ARCTROOPER501ST'] },
      { require: ['DARTHMALAK'] },
      { require: ['BOSSK'] },
      { require: ['SAVAGEOPRESS'] },
    ],
    // M2 Jabba → keyUnit no COMBAT_MISSION_REQS
    // M3 Executor → keyUnit isShip no COMBAT_MISSION_REQS
    // M4 Fennec → keyUnit no COMBAT_MISSION_REQS
    // M5 GI-lead Inquisitorius
    5: [
      { require: ['GRANDINQUISITOR', 'NINTHSISTER', 'SEVENTHSISTER', 'FIFTHBROTHER'] },
    ],
    // M6 special unlock → computeSpecialMissionEligible
  },

  // ══════════════════════════════════════════════════════════════════════
  // KASHYYYK — LS Fase 3 / Tier 3 (R7)
  // ══════════════════════════════════════════════════════════════════════
  "Kashyyyk": {
    // M1 Wookiees (0 elegíveis no JSON, apenas inelegíveis válidos)
    1: [
      { require: ['TARFFUL', 'ZAALBAR', 'YOUNGCHEWBACCA', 'CHEWBACCALEGENDARY'] },
      { require: ['TARFFUL', 'CHEWBACCALEGENDARY', 'C3POCHEWBACCA'] },
    ],
    // M2 Any LS vs Mara Jade
    2: [
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA', 'GENERALKENOBI', 'PADMEAMIDALA'] },
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA', 'GENERALKENOBI'] },
      { require: ['REYJEDITRAINING', 'BB8', 'C3POLEGENDARY', 'R2D2_LEGENDARY', 'GLREY'] },
      { require: ['JEDIKNIGHTLUKE', 'GRANDMASTERLUKE', 'HANSOLO'] },
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN'] },
      { require: ['GRANDMASTERLUKE', 'JEDIKNIGHTLUKE'] },
      { require: ['PADMEAMIDALA', 'JEDIMASTERKENOBI', 'GENERALKENOBI'] },
      { require: ['PRINCESSLEIA', 'CAPTAINDROGAN', 'CAPTAINREX'] },
    ],
    // M3 Any LS
    3: [
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA', 'GENERALKENOBI', 'PADMEAMIDALA'] },
      { require: ['REYJEDITRAINING', 'BB8', 'C3POLEGENDARY', 'R2D2_LEGENDARY', 'GLREY'] },
      { require: ['GRANDMASTERLUKE', 'JEDIKNIGHTLUKE'] },
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN'] },
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA', 'GENERALKENOBI'] },
      { require: ['PADMEAMIDALA', 'JEDIMASTERKENOBI', 'GENERALKENOBI'] },
      { require: ['PRINCESSLEIA', 'CAPTAINDROGAN', 'CAPTAINREX'] },
      { require: ['BOKATANMANDALORE', 'PAZVIZSLA', 'IG12', 'MANDALORIANBESKAR'] },
    ],
    // M4 Profundity → keyUnit isShip no COMBAT_MISSION_REQS
    // M5 Saw Gerrera (0 elegíveis no JSON, inelegíveis válidos)
    5: [
      { require: ['SAWGERRERA', 'ADMIRALRADDUS', 'CAPTAINREX'] },
      { require: ['SAWGERRERA', 'CAPTAINDROGAN', 'CAPTAINREX', 'BAZEMALBUS'] },
      { require: ['SAWGERRERA', 'BAZEMALBUS'] },
      { require: ['SAWGERRERA', 'CAPTAINDROGAN', 'CAPTAINREX', 'CASSIANANDORS1', 'BAZEMALBUS'] },
      { require: ['SAWGERRERA', 'CAPTAINDROGAN', 'CAPTAINREX'] },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // HAVEN MEDICAL STATION — DS Fase 4 / Tier 4 (R7)
  // 0 elegíveis no JSON — usando inelegíveis como composições válidas
  // ══════════════════════════════════════════════════════════════════════
  "Haven Medical Station": {
    1: [
      { require: ['MOFFGIDEONTROOPER', 'DEATHTROOPER'] },
      { require: ['TRENCH', 'JANGOFETT', 'WATTAMBOR', 'COUNTDOOKU', 'NUTEGUNRAY'] },
    ],
    2: [
      { require: ['MOFFGIDEONTROOPER', 'DEATHTROOPER'] },
      { require: ['JABBATHEHUTT', 'KRRSANTAN'] },
      { require: ['SITHETERNALPALPATINE', 'DARTHMALAK', 'DARTHMALGUS', 'DARTHBANE'] },
      { require: ['GREATMOTHERS', 'MORGANELSBETH', 'MERRIN'] },
      { require: ['TRENCH', 'JANGOFETT', 'WATTAMBOR', 'COUNTDOOKU', 'NUTEGUNRAY'] },
    ],
    3: [
      { require: ['MOFFGIDEONTROOPER', 'DEATHTROOPER'] },
      { require: ['THIRDSISTER', 'SEVENTHSISTER', 'FIFTHBROTHER', 'GRANDINQUISITOR', 'EIGHTHBROTHER'] },
      { require: ['JABBATHEHUTT', 'KRRSANTAN'] },
      { require: ['SITHETERNALPALPATINE', 'DARTHMALAK', 'DARTHMALGUS', 'DARTHBANE'] },
      { require: ['LORDVADER', 'NINTHSISTER', 'SEVENTHSISTER', 'ADMIRALPIETT', 'ROYALGUARD'] },
      { require: ['LORDVADER', 'MAUL', 'ROYALGUARD'] },
      { require: ['GREATMOTHERS', 'MORGANELSBETH', 'MERRIN'] },
      { require: ['TRENCH', 'JANGOFETT', 'WATTAMBOR', 'COUNTDOOKU', 'NUTEGUNRAY'] },
    ],
    // M4 Reva → keyUnit:['THIRDSISTER'] no COMBAT_MISSION_REQS
    5: [
      { require: ['MOFFGIDEONTROOPER', 'DEATHTROOPER'] },
      { require: ['THIRDSISTER', 'SEVENTHSISTER', 'FIFTHBROTHER', 'GRANDINQUISITOR', 'EIGHTHBROTHER'] },
      { require: ['JABBATHEHUTT', 'KRRSANTAN'] },
      { require: ['SITHETERNALPALPATINE', 'DARTHMALAK', 'DARTHMALGUS', 'DARTHBANE'] },
      { require: ['LORDVADER', 'DARTHMALAK'] },
      { require: ['GREATMOTHERS', 'MORGANELSBETH', 'MERRIN'] },
      { require: ['TRENCH', 'JANGOFETT', 'WATTAMBOR', 'COUNTDOOKU', 'NUTEGUNRAY'] },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // KESSEL — MX Fase 4 / Tier 4 (R7)
  // ══════════════════════════════════════════════════════════════════════
  "Kessel": {
    1: [
      { require: ['LORDVADER'] },
      { require: ['JEDIMASTERKENOBI', 'GENERALKENOBI'] },
      { require: ['PADMEAMIDALA', 'COMMANDERAHSOKA', 'GLREY'] },
    ],
    2: [
      { require: ['LORDVADER'] },
      { require: ['JEDIMASTERKENOBI', 'GENERALKENOBI'] },
      { require: ['PADMEAMIDALA', 'COMMANDERAHSOKA', 'GLREY'] },
    ],
    // M3 Qi'ra+L3 → keyUnit requireAll no COMBAT_MISSION_REQS
    // M4 Jabba → keyUnit no COMBAT_MISSION_REQS
    // M5 Ghost ship → keyUnit isShip no COMBAT_MISSION_REQS
  },

  // ══════════════════════════════════════════════════════════════════════
  // LOTHAL — LS Fase 4 / Tier 4 (R7)
  // ══════════════════════════════════════════════════════════════════════
  "Lothal": {
    // M1 Any LS ship (atualmente keyUnit:null, isShip:true)
    1: [
      { require: ['CAPITALNEGOTIATOR'], isShip: true },
      { require: ['CAPITALPROFUNDITY'], isShip: true },
      { require: ['CAPITALRADDUS'], isShip: true },
    ],
    // M2 Any LS
    2: [
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN'] },
      { require: ['JEDIMASTERKENOBI'] },
      { require: ['GRANDMASTERLUKE'] },
      { require: ['FINN'] },
    ],
    // M3 Phoenix/Hera → keyUnit:['HERASYNDULLAS3'] no COMBAT_MISSION_REQS
    // M4 Jedi (0 elegíveis no JSON)
    4: [
      { require: ['JEDIKNIGHTCAL', 'GRANDMASTERLUKE'] },
      { require: ['JEDIMASTERKENOBI', 'GENERALKENOBI', 'AHSOKATANO', 'KIADIMUNDI'] },
      { require: ['GRANDMASTERLUKE', 'GRANDMASTERYODA'] },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // MALACHOR — DS Fase 5 / Tier 5 (R7)
  // 0 elegíveis no JSON — usando inelegíveis como composições válidas
  // ══════════════════════════════════════════════════════════════════════
  "Malachor": {
    1: [
      { require: ['MOFFGIDEONTROOPER', 'DEATHTROOPER'] },
      { require: ['SUPREMELEADERKYLOREN'] },
      { require: ['LORDVADER'] },
      { require: ['EMPERORPALPATINE', 'MARAJADE', 'VADER', 'ADMIRALPIETT'] },
    ],
    2: [
      { require: ['MOFFGIDEONTROOPER', 'DEATHTROOPER'] },
      { require: ['SUPREMELEADERKYLOREN'] },
      { require: ['LORDVADER'] },
      { require: ['EMPERORPALPATINE', 'MARAJADE', 'VADER', 'ADMIRALPIETT'] },
    ],
    // M3 8th+5th+7th → keyUnit requireAll no COMBAT_MISSION_REQS
    4: [
      { require: ['LORDVADER'] },
      { require: ['EMPERORPALPATINE', 'MARAJADE', 'VADER', 'ADMIRALPIETT'] },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // VANDOR — MX Fase 5 / Tier 5 (R7)
  // 0 elegíveis no JSON — usando inelegíveis como composições válidas
  // ══════════════════════════════════════════════════════════════════════
  "Vandor": {
    // M1 Young Han+Chewie special → keyUnit requireAll no COMBAT_MISSION_REQS
    // M2 Any
    2: [
      { require: ['PRINCESSLEIA', 'FULCRUM', 'ADMIRALRADDUS'] },
    ],
    // M3 Any vs Nest
    3: [
      { require: ['SITHETERNALPALPATINE', 'DARTHMALGUS', 'DARTHMALAK'] },
      { require: ['SUPREMELEADERKYLOREN', 'DARTHMALAK'] },
      { require: ['LORDVADER', 'DARTHMALAK'] },
      { require: ['PRINCESSLEIA', 'FULCRUM', 'ADMIRALRADDUS', 'COMMANDERAHSOKA'] },
    ],
    // M4 Jabba → keyUnit no COMBAT_MISSION_REQS
    // M5 Any ship
    5: [
      { require: ['CAPITALEXECUTOR'], isShip: true },
      { require: ['CAPITALPROFUNDITY'], isShip: true },
      { require: ['CAPITALNEGOTIATOR'], isShip: true },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // KAFRENE — LS Fase 5 / Tier 5 (R7)
  // 0 elegíveis no JSON — usando inelegíveis como composições válidas
  // ══════════════════════════════════════════════════════════════════════
  "Kafrene": {
    // M1 JMMW — composições pendentes
    // TODO(futuro): Kafrene T5 só é relevante para guildas com GP total >650M.
    // Poucas guildas chegam aqui; mapear composições reais quando necessário via
    // tb_combat_eligibility_all_planets.json ou conta com JEDIMASTERMACEWINDU.
    1: [],
    2: [
      { require: ['JEDIMASTERKENOBI'] },
    ],
    // M3 Cassian+K2 → keyUnit:['K2SO'] no COMBAT_MISSION_REQS
    // M4 Any LS ship
    4: [
      { require: ['CAPITALPROFUNDITY'], isShip: true },
      { require: ['CAPITALNEGOTIATOR'], isShip: true },
    ],
    // M5 JMMW — composições pendentes (ver M1)
    5: [],
  },

  // ══════════════════════════════════════════════════════════════════════
  // DEATH STAR — DS Fase 6 / Tier 6 (R7)
  // ══════════════════════════════════════════════════════════════════════
  "Death Star": {
    // M1 Iden Versio (atualmente keyUnit:null — corrigindo)
    1: [
      { require: ['IDENVERSIO', 'LORDVADER', 'DARTHMALAK'] },
    ],
    // M2 Any DS vs Rebels
    2: [
      { require: ['LORDVADER', 'THIRDSISTER'] },
      { require: ['SUPREMELEADERKYLOREN'] },
    ],
    3: [], // sem composições utilizáveis neste tier
    // M4 Darth Vader → keyUnit:['VADER'] no COMBAT_MISSION_REQS
    // M5 Imperial TIE → keyUnit isShip no COMBAT_MISSION_REQS
  },

  // ══════════════════════════════════════════════════════════════════════
  // HOTH — MX Fase 6 / Tier 6 (R7)
  // ══════════════════════════════════════════════════════════════════════
  "Hoth": {
    2: [], // Any — 0 elegíveis e 0 inelegíveis no JSON
    3: [],
    4: [],
    // M1 Jabba → keyUnit no COMBAT_MISSION_REQS
    // M5 Aphra+BT-1 → keyUnit requireAll no COMBAT_MISSION_REQS
  },

  // ══════════════════════════════════════════════════════════════════════
  // SCARIF — LS Fase 6 / Tier 6 (R7)
  // ══════════════════════════════════════════════════════════════════════
  "Scarif": {
    4: [], // Any LS — 0 elegíveis e 0 inelegíveis no JSON
    5: [],
    // M1 Baze+Chirrut → keyUnit requireAll no COMBAT_MISSION_REQS
    // M2 Cassian+K2+Pao → keyUnit requireAll no COMBAT_MISSION_REQS
    // M3 Profundity → keyUnit isShip no COMBAT_MISSION_REQS
  },

  // ══════════════════════════════════════════════════════════════════════
  // ZEFFO — BZ Fase bonus-1 / Tier 1 (R5)
  // ══════════════════════════════════════════════════════════════════════
  "Zeffo": {
    // M1 Any LS
    1: [
      { require: ['COMMANDERLUKESKYWALKER', 'C3POCHEWBACCA', 'HANSOLO', 'CHEWBACCALEGENDARY', 'C3POLEGENDARY'] },
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA', 'AHSOKATANO', 'GENERALKENOBI', 'PADMEAMIDALA'] },
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN', 'HANSOLO', 'CHEWBACCALEGENDARY'] },
      { require: ['FINN'] },
      { require: ['JEDIMASTERKENOBI', 'COMMANDERAHSOKA', 'AHSOKATANO', 'CT5555'] },
      { require: ['PRINCESSLEIA', 'R2D2_LEGENDARY', 'CAPTAINDROGAN', 'SCARIFPATHFINDER'] },
      { require: ['BOKATANMANDALORE', 'IG12', 'PAZVIZSLA', 'MANDALORIANBESKAR'] },
    ],
    // M2 LS UFU
    2: [
      { require: ['GLREY', 'COMMANDERAHSOKA'] },
      { require: ['GLREY', 'CALKESTIS', 'CEREJUNDA'] },
    ],
    // M3 JKCK (atualmente keyUnit:['CALKESTIS','CEREJUNDA'] requireAll — corrigindo)
    3: [
      { require: ['JEDIKNIGHTCAL', 'GRANDMASTERLUKE', 'JEDIKNIGHTLUKE'] },
      { require: ['JEDIKNIGHTCAL', 'JEDIMASTERKENOBI'] },
      { require: ['JEDIKNIGHTCAL', 'GRANDMASTERLUKE', 'GENERALSKYWALKER', 'JEDIKNIGHTLUKE'] },
    ],
    // M4 Clone Troopers special (type:'special' → não conta em safeBattles)
    4: [
      { require: ['BADBATCHHUNTER', 'CT210408', 'BADBATCHTECH', 'BADBATCHWRECKER', 'BADBATCHOMEGA'] },
      { require: ['BADBATCHHUNTER', 'CT210408', 'BADBATCHTECH', 'BADBATCHWRECKER'] },
      { require: ['CAPTAINREX', 'CT5555', 'CAPTAINDROGAN'] },
    ],
    // M5 Negotiator → keyUnit isShip no COMBAT_MISSION_REQS
  },

  // ══════════════════════════════════════════════════════════════════════
  // MANDALORE — BZ Fase bonus-2 / Tier 2 (R7)
  // ══════════════════════════════════════════════════════════════════════
  "Mandalore": {
    // M1 DTMG (atualmente keyUnit:['GRANDADMIRALTHRAWN'] — corrigindo para MOFFGIDEONTROOPER)
    1: [
      { require: ['MOFFGIDEONTROOPER', 'DEATHTROOPER'] },
    ],
    // M2 Any (0 elegíveis no JSON)
    2: [
      { require: ['THIRDSISTER', 'MARROK', 'GRANDINQUISITOR'] },
      { require: ['JABBATHEHUTT', 'BOUSHH'] },
      { require: ['SITHETERNALPALPATINE', 'DARTHMALAK'] },
    ],
    // M3 R9 BKM → keyUnit:['BOKATAN'] no COMBAT_MISSION_REQS
    // M4 Gauntlet → keyUnit isShip no COMBAT_MISSION_REQS
  },

}
