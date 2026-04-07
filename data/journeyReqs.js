/**
 * journeyReqs.js
 * Pré-requisitos das jornadas/eventos lendários por grau.
 *
 * Estrutura:
 *   JOURNEY_REQS[unitId].grades[grau] = [ req, ... ]
 *
 * Campos de req:
 *   id      — base_id do personagem/nave
 *   relic   — relíquia mínima (R3, R5, R7, R9...)
 *   gear    — gear mínimo (ex: 12) — usado quando não há relic
 *   stars   — estrelas mínimas (naves: 7)
 *   isShip  — true se for nave
 *   phase   — fase do evento (opcional, informativo)
 *
 * Obs:
 *   - Grau 5 = nível mais difícil (mais personagens / mais alto)
 *   - Para JKLS e GAS cada grau tem lista diferente de personagens
 *   - IDs marcados com (?) são estimativas — confirmar no jogo se necessário
 *
 * Atualização: Abril 2026
 */

var JOURNEY_REQS = {

  // ══════════════════════════════════════════════════════════════════════
  // FROTAS — Capital Ships
  // ══════════════════════════════════════════════════════════════════════

  CAPITALPROFUNDITY: {
    name: 'Profundity',
    type: 'fleet',
    grades: {
      5: [
        { id: 'ADMIRALRADDUS',         relic: 9 },
        { id: 'JYNERSO',               relic: 7 },
        { id: 'CASSIANANDOR',          relic: 5 },
        { id: 'BISTAN',                relic: 5 },
        { id: 'SCARIFPATHFINDER',      relic: 5 },
        { id: 'HERASYNDULLA',          relic: 5 },
        { id: 'DASHRENDAR',            relic: 5 },
        { id: 'OUTRIDER',              stars: 7, isShip: true },
        { id: 'RAVENSCLAW',            stars: 7, isShip: true }
      ]
    }
  },

  CAPITALEXECUTOR: {
    name: 'Executor',
    type: 'fleet',
    grades: {
      5: [
        { id: 'ADMIRALPIETT',      relic: 8 },
        { id: 'VADER',             relic: 7 },
        { id: 'BOBAFETT',          relic: 8 },
        { id: 'BOSSK',             relic: 5 },
        { id: 'DENGAR',            relic: 5 },
        { id: 'IG88',              relic: 5 },
        { id: 'TIEFIGHTERPILOT',   relic: 5 },
        { id: 'RAZORCREST',        stars: 7, isShip: true },
        { id: 'TIEBOMBERIMPERIAL', stars: 7, isShip: true }
      ]
    }
  },

  CAPITALLEVIATHAN: {
    name: 'Leviathan',
    type: 'fleet',
    grades: {
      5: [
        { id: 'DARTHREVAN',            relic: 9 },
        { id: 'DARTHMALAK',            relic: 9 },
        { id: 'SITHEMPIRETROOPER',     relic: 7 },
        { id: 'SITHMARAUDER',          relic: 7 },
        { id: 'HK47',                  relic: 7 },
        { id: 'SITHASSASSIN',          relic: 5 },
        { id: 'FURYCLASSINTERCEPTOR',  stars: 7, isShip: true },
        { id: 'MARKVIINTERCEPTOR',     stars: 7, isShip: true }
      ]
    }
  },

  // ══════════════════════════════════════════════════════════════════════
  // JORNADAS DE PERSONAGENS — Legendários / Semi-Lendários
  // ══════════════════════════════════════════════════════════════════════

  DARTHMALAK: {
    name: 'Darth Malak',
    type: 'legendary',
    grades: {
      5: [
        { id: 'JEDIKNIGHTREVAN', gear: 12 },
        { id: 'BASTILASHAN',     gear: 12 },
        { id: 'JOLEEBINDO',      gear: 12 },
        { id: 'MISSIONVAO',      gear: 12 },
        { id: 'ZAALBAR',         gear: 12 },
        { id: 'DARTHREVAN',      gear: 12 },
        { id: 'CARTHONASI',      gear: 12 },
        { id: 'CANDEROUS',       gear: 12 },
        { id: 'HK47',            gear: 12 },
        { id: 'JUHANI',          gear: 12 }
      ]
    }
  },

  GENERALSKYWALKER: {
    name: 'General Skywalker',
    type: 'legendary',
    grades: {
      // Grau 5: cada fase tem personagens diferentes
      5: [
        // Fase 1 — Heróis da República
        { id: 'PADMEAMIDALA',          gear: 12, phase: 1 },
        { id: 'GENERALKENOBI',         gear: 12, phase: 1 },
        { id: 'AHSOKATANO',            gear: 12, phase: 1 },
        { id: 'SHAAKTI',               gear: 12, phase: 1 },
        { id: 'C3PO',                  gear: 12, phase: 1 },
        // Fase 2 — Naves
        { id: 'JEDISTARFIGHTERANAKIN', stars: 7, isShip: true, phase: 2 },
        { id: 'AHSOKATANO2SHIP',      stars: 7, isShip: true, phase: 2 },
        { id: 'YWINGCLONEWARS',        stars: 7, isShip: true, phase: 2 },
        // Fase 4 — Separatistas
        { id: 'GENERALGRIEVOUS',       gear: 12, phase: 4 },
        { id: 'B1BATTLEDROID',         gear: 12, phase: 4 },
        { id: 'B2SUPERBATTLEDROID',    gear: 12, phase: 4 },
        { id: 'DROIDEKA',              gear: 12, phase: 4 },
        { id: 'ASAJJVENTRESS',         gear: 12, phase: 4 }
      ]
    }
  },

  JEDIKNIGHTLUKE: {
    name: 'Cavaleiro Jedi Luke Skywalker',
    type: 'legendary',
    grades: {
      5: [
        { id: 'COMMANDERLUKESKYWALKER',  relic: 3 },
        { id: 'VADER',                  relic: 3 },
        { id: 'WAMPA',                  relic: 3 },
        { id: 'HERMITYODA',             relic: 3 },
        { id: 'CAPTAINHANSOLO',         relic: 3 },
        { id: 'LANDOCALRISSIAN',         relic: 3 },
        { id: 'LEIA',                    relic: 3 }
      ]
    }
  },

  BOKATANMANDALORE: {
    name: "Bo-Katan Mand'alor",
    type: 'legendary',
    grades: {
      5: [
        { id: 'BOKATAN',                  relic: 7 },
        { id: 'MANDALORIANBESKAR',         relic: 7 },
        { id: 'GROGU',                    relic: 7 },
        { id: 'PAZVIZSLA',                relic: 7 },
        { id: 'ARMORER',                  relic: 7 }
      ]
    }
  },

  BAYLANSKOLL: {
    name: 'Baylan Skoll',
    type: 'legendary',
    grades: {
      5: [
        { id: 'SHINHATI',        relic: 7 },
        { id: 'MORGANELSBETH',   relic: 7 },
        { id: 'MARROK',          relic: 7 },
        { id: 'FULCRUM',         relic: 7 },  // Ahsoka Tano (Fulcrum)
        { id: 'GREATMOTHERS',    relic: 7 }   // Grandes Mães
      ]
    }
  }

}

/**
 * Retorna o grau mais alto disponível nos pré-requisitos de uma jornada.
 * @param {string} unitId
 * @returns {number|null}
 */
function getJourneyMaxGrade(unitId) {
  if (typeof JOURNEY_REQS === 'undefined') return null
  var jd = JOURNEY_REQS[unitId]
  if (!jd) return null
  var grades = Object.keys(jd.grades).map(Number)
  return grades.length > 0 ? Math.max.apply(null, grades) : null
}
