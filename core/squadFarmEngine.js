/**
 * squadFarmEngine.js
 * Recomenda squads a farmar para GAC/TW/ROTE por jogador ativo.
 *
 * Lógica:
 *   Para cada jogador ativo:
 *     1. Calcula score de cada squad meta:
 *        - Cobertura: % de membros que JÁ TEM (reduz custo de farm)
 *        - Multi-evento: squads que cobrem ROTE+GAC+TW têm peso extra
 *        - Liga: squads acima do leagueMin do squad são filtrados para jogadores fracos
 *     2. Filtro de jornada:
 *        a) Jornada concluída (tem a unidade no grau mínimo) → score normal
 *        b) Jornada ≥ 80% pronta → score com multiplicador 0.7 + flag journeyPending
 *        c) Jornada < 80% pronta → descartado (custo muito alto)
 *        d) Sem jornada (null) → score normal
 *     3. Recomenda o squad de maior score por jogador
 *     4. Mostra min_relic → ideal_relic (sem retrabalho)
 *
 * Repetição: múltiplos jogadores podem receber o mesmo squad.
 * Cada jogador recebe 1 recomendação por vez.
 */

var squadFarmEngine = {

  // Cache do roteWeight por squadId (calculado uma vez por sessão)
  _roteWeightCache: null,

  // Varre MISSION_SQUADS e platoonRequirements para descobrir quais unitIds
  // aparecem como requisito real de missão ou platoon no ROTE.
  // Retorna um Set de unitIds relevantes para ROTE.
  _buildRoteUnitSet: function() {
    var units = {}

    // Missões: cada unitId dentro de require[] conta como presença em missão
    if (typeof MISSION_SQUADS !== 'undefined') {
      Object.values(MISSION_SQUADS).forEach(function(planet) {
        Object.values(planet).forEach(function(missionComps) {
          if (!Array.isArray(missionComps)) return
          missionComps.forEach(function(comp) {
            if (comp.require) comp.require.forEach(function(uid) { units[uid] = (units[uid] || 0) + 1 })
          })
        })
      })
    }

    // Platoons: cada slot unitId conta como presença em platoon
    if (typeof platoonRequirements !== 'undefined') {
      Object.values(platoonRequirements).forEach(function(phase) {
        Object.values(phase).forEach(function(ops) {
          if (!Array.isArray(ops)) return
          ops.forEach(function(slot) { if (slot.unitId) units[slot.unitId] = (units[slot.unitId] || 0) + 1 })
        })
      })
    }

    return units
  },

  // Para um squad, retorna um peso ROTE entre 0 e 1 (fração de membros presentes
  // em MISSION_SQUADS ou platoonRequirements, ponderada pela frequência de aparição).
  _roteWeight: function(squad) {
    if (!squadFarmEngine._roteWeightCache) {
      squadFarmEngine._roteWeightCache = squadFarmEngine._buildRoteUnitSet()
    }
    var unitFreq = squadFarmEngine._roteWeightCache
    if (!squad.members || squad.members.length === 0) return 0

    var totalFreq = 0
    squad.members.forEach(function(uid) { totalFreq += Math.min(unitFreq[uid] || 0, 10) })
    // Normaliza: máximo teórico = 10 aparições por membro
    return totalFreq / (squad.members.length * 10)
  },

  // Ordem das ligas do mais fraco ao mais forte
  LEAGUE_ORDER: ['CARBONITE', 'BRONZIUM', 'CHROMIUM', 'AURODIUM', 'KYBER'],

  leagueIndex: function(leagueId) {
    var idx = squadFarmEngine.LEAGUE_ORDER.indexOf(leagueId)
    return idx >= 0 ? idx : 0
  },

  // Relic atual de uma unidade para um jogador (-1 = não tem / não elegível).
  // Para naves: retorna 99 se nave 7★ E piloto no minRelic, -1 caso contrário.
  // minRelic é opcional (padrão 0 = só checa 7★ da nave).
  _playerRelicFor: function(player, unitId, minRelic) {
    if (!player.units) return -1
    var unit = player.units.find(function(u) { return u.base_id === unitId })
    if (!unit) return -1
    if (unit.combat_type === 2 || (typeof SHIP_IDS !== 'undefined' && SHIP_IDS[unitId])) {
      if ((unit.rarity || 0) < 7) return -1
      // Verificar piloto se minRelic fornecido e SHIP_PILOT disponível
      var reqRelic = minRelic || 0
      if (reqRelic > 0 && typeof SHIP_PILOT !== 'undefined') {
        var pilotId = SHIP_PILOT[unitId]
        if (pilotId) {
          var pilotUnit = player.units.find(function(u) { return u.base_id === pilotId })
          if (!pilotUnit) return -1
          var pilotRelic = (typeof rosterEngine !== 'undefined')
            ? rosterEngine.toRelicLevel(pilotUnit.relic_tier)
            : Math.max(0, (pilotUnit.relic_tier || 0) - 2)
          if (pilotRelic < reqRelic) return pilotRelic  // nave ok, piloto fraco → retorna relic do piloto
        }
      }
      return 99
    }
    return (typeof rosterEngine !== 'undefined')
      ? rosterEngine.toRelicLevel(unit.relic_tier)
      : Math.max(0, (unit.relic_tier || 0) - 2)
  },

  // Verifica se o jogador atende a um único pré-requisito de jornada
  _playerMeetsReq: function(player, req) {
    if (!player.units) return false
    var unit = player.units.find(function(u) { return u.base_id === req.id })
    if (!unit) return false

    if (req.isShip) {
      return (unit.rarity || 0) >= (req.stars || 7)
    }
    if (req.relic !== undefined) {
      var relicLevel = (typeof rosterEngine !== 'undefined')
        ? rosterEngine.toRelicLevel(unit.relic_tier)
        : Math.max(0, (unit.relic_tier || 0) - 2)
      return relicLevel >= req.relic
    }
    if (req.gear !== undefined) {
      // Gear 12: relic_tier >= 3 = R1+ (passou do Gear 12), ou level >= 85
      var relicTier = unit.relic_tier || 0
      if (relicTier >= 3) return true          // R1+ → certamente G12+
      if ((unit.level || 0) >= 85) return true  // nível max → provavelmente G12+
      return false
    }
    return true
  },

  // Calcula o percentual de prontidão da jornada de um personagem para um jogador
  // Retorna null se JOURNEY_REQS não tiver dados para esse unit
  // Retorna { pct, met, total, missing[], grade, journeyName }
  _journeyReadiness: function(player, unitId) {
    if (typeof JOURNEY_REQS === 'undefined') return null
    var jd = JOURNEY_REQS[unitId]
    if (!jd) return null

    // Usa o grau mais alto disponível (grau 5 = mais exigente)
    var grades = Object.keys(jd.grades).map(Number).sort(function(a, b) { return b - a })
    if (grades.length === 0) return null
    var grade = grades[0]
    var reqs = jd.grades[grade]
    if (!reqs || reqs.length === 0) return null

    var met = 0
    var missing = []
    reqs.forEach(function(req) {
      if (squadFarmEngine._playerMeetsReq(player, req)) {
        met++
      } else {
        missing.push(req)
      }
    })

    return {
      pct:         met / reqs.length,
      met:         met,
      total:       reqs.length,
      missing:     missing,
      grade:       grade,
      journeyName: jd.name
    }
  },

  // Para um squad e um jogador: quantos membros já atendem minRelic
  _squadCoverage: function(squad, player) {
    if (squad.isFleet) {
      var have = squad.members.filter(function(uid) {
        return squadFarmEngine._playerRelicFor(player, uid, squad.minRelic) === 99
      }).length
      return { have: have, total: squad.members.length }
    }

    var have = squad.members.filter(function(uid) {
      var relic = squadFarmEngine._playerRelicFor(player, uid)
      return relic >= squad.minRelic
    }).length
    return { have: have, total: squad.members.length }
  },

  // Score de prioridade para um squad dado o jogador.
  // Retorna { score, journeyPending } onde journeyPending = readiness obj | null
  // score < 0 = descartado
  _scoreSquad: function(squad, player, leagueIdx) {
    var cov = squadFarmEngine._squadCoverage(squad, player)

    // Squad inacessível: liga do squad acima da liga do jogador (mas permitimos 1 nível acima)
    var squadLeagueIdx = squadFarmEngine.leagueIndex(squad.leagueMin)
    if (squadLeagueIdx > leagueIdx + 1) return { score: -1, journeyPending: null }

    // skipIfPlayerHas: descartar este variant se o jogador já tem esses personagens
    // no minRelic do squad — indica que um variant mais forte está disponível
    if (squad.skipIfPlayerHas) {
      for (var ski = 0; ski < squad.skipIfPlayerHas.length; ski++) {
        var skipRelic = squadFarmEngine._playerRelicFor(player, squad.skipIfPlayerHas[ski])
        if (skipRelic >= squad.minRelic) return { score: -1, journeyPending: null }
      }
    }

    // ── Filtro de jornada ─────────────────────────────────────────────────
    var journeyPending = null
    if (squad.journeyUnit) {
      var journeyUnitData = player.units
        ? player.units.find(function(u) { return u.base_id === squad.journeyUnit })
        : null
      var minStars = squad.minJourneyStars || 7
      var journeyComplete = journeyUnitData && (journeyUnitData.rarity || 0) >= minStars

      if (!journeyComplete) {
        var readiness = squadFarmEngine._journeyReadiness(player, squad.journeyUnit)
        if (!readiness || readiness.pct < 0.8) {
          // Jornada longe demais — custo muito alto, descarta
          return { score: -1, journeyPending: null }
        }
        // Jornada ≥ 80%: incluir com penalidade (custo ainda existe)
        journeyPending = readiness
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    // Fator de cobertura: 0.0 a 1.0 (quanto já tem, mais perto de completar = maior score)
    var coverage = cov.total > 0 ? cov.have / cov.total : 0

    // Fator multi-evento: 1 evento = 1pt, 2 = 2pt, 3 = 3pt
    var eventsCount = (squad.events.rote ? 1 : 0) + (squad.events.gac ? 1 : 0) + (squad.events.tw ? 1 : 0)

    // Fator de liga: squads de ligas mais altas têm peso para jogadores que já estão lá
    var leagueMatch = squadLeagueIdx <= leagueIdx ? 1.2 : 1.0

    // Fator ROTE: bônus para squads com membros presentes em missões/platoons do ROTE
    // Escala: 0 (sem presença) → 1.5 (todos os membros aparecem frequentemente)
    var roteBonus = squadFarmEngine._roteWeight(squad) * 1.5

    // Bônus de missão especial: squads que desbloqueiam planetas chave (Bracca/Mandalore)
    // ou são essenciais para ROTE — garante que apareçam como próxima recomendação
    var specialBonus = squad.specialMission ? 2.0 : 0

    // Score base: cobertura (principal) + multi-evento + liga + ROTE + missão especial
    var baseScore = (coverage * 5) + (eventsCount * 0.5) + leagueMatch + roteBonus + specialBonus

    // Penalidade se jornada ainda pendente (maior custo total)
    var score = journeyPending ? baseScore * 0.7 : baseScore

    // Penalidade extra: frota onde o capital (journeyUnit) ainda não chegou em 7★
    // mas passou o filtro de minJourneyStars (ex: Executor a 5★, precisa de 7★)
    if (squad.isFleet && squad.journeyUnit && !journeyPending) {
      var capitalUnit = player.units
        ? player.units.find(function(u) { return u.base_id === squad.journeyUnit })
        : null
      var capitalStars = capitalUnit ? (capitalUnit.rarity || 0) : 0
      if (capitalStars > 0 && capitalStars < 7) {
        // Capital existe mas não chegou em 7★ — farm de estrelas pendente, pode demorar meses
        score = score * (0.4 + capitalStars * 0.08)  // 4★→56%, 5★→72%, 6★→88%
      }
    }

    return { score: score, journeyPending: journeyPending }
  },

  // Calcula membersNeeded para um squad e jogador (extração para reutilização no loop)
  _membersNeeded: function(squad, player) {
    var needed = []
    squad.members.forEach(function(uid) {
      var relic    = squadFarmEngine._playerRelicFor(player, uid, squad.isFleet ? squad.minRelic : 0)
      var meetsMin = squad.isFleet ? relic === 99 : relic >= squad.minRelic
      if (!meetsMin) {
        if (squad.isFleet && relic >= 0 && relic < 99) {
          var pilotId  = (typeof SHIP_PILOT !== 'undefined') ? SHIP_PILOT[uid] : null
          var shipUnit = player.units ? player.units.find(function(u) { return u.base_id === uid }) : null
          var hasShip  = shipUnit && (shipUnit.rarity || 0) >= 7
          if (hasShip && pilotId) {
            needed.push({
              unitId: pilotId, id: pilotId,
              name:   (typeof getUnitName === 'function') ? getUnitName(pilotId) : pilotId,
              current: 'R' + relic, target: 'R' + squad.minRelic,
              isPilot: true,
              shipName: (typeof getUnitName === 'function') ? getUnitName(uid) : uid
            })
          } else if (!hasShip) {
            var shipUnit2 = player.units ? player.units.find(function(u) { return u.base_id === uid }) : null
            var shipStars2 = shipUnit2 ? (shipUnit2.rarity || 0) : 0
            needed.push({
              unitId: uid, id: uid,
              name:   (typeof getUnitName === 'function') ? getUnitName(uid) : uid,
              current: shipStars2 > 0 ? (shipStars2 + '★') : 'não tem', target: '7★',
              isShip: true, shipStars: shipStars2
            })
          }
        } else {
          var shipUnit3 = squad.isFleet
            ? (player.units ? player.units.find(function(u) { return u.base_id === uid }) : null)
            : null
          var shipStars3 = shipUnit3 ? (shipUnit3.rarity || 0) : 0
          var relicStr = relic >= 0 ? (squad.isFleet ? (relic + '★') : 'R' + relic)
            : (shipStars3 > 0 ? (shipStars3 + '★') : 'não tem')
          needed.push({
            unitId: uid, id: uid,
            name:   (typeof getUnitName === 'function') ? getUnitName(uid) : uid,
            current: relicStr,
            target:  squad.isFleet ? '7★' : 'R' + squad.minRelic,
            isShip:  squad.isFleet, shipStars: shipStars3
          })
        }
      }
    })
    return needed
  },

  // Gera recomendações para todos os jogadores ativos
  // Retorna: [{ player, squad, have, total, membersNeeded, journeyPending, leagueId, divisionId, skillRating }]
  recommend: function(rosterMap) {
    if (!rosterMap || typeof SQUAD_META === 'undefined') return []

    var results = []

    Object.values(rosterMap).forEach(function(player) {
      var gac = player.gac || { leagueId: 'CARBONITE', divisionId: 5, skillRating: 0 }
      var leagueIdx = squadFarmEngine.leagueIndex(gac.leagueId)

      // Calcular score para cada squad
      var scored = SQUAD_META.map(function(squad) {
        var res = squadFarmEngine._scoreSquad(squad, player, leagueIdx)
        return { squad: squad, score: res.score, journeyPending: res.journeyPending }
      })
      .filter(function(s) { return s.score >= 0 })
      .sort(function(a, b) { return b.score - a.score })

      if (scored.length === 0) return

      // Monta o conjunto de membros já "comprometidos" em squads completos.
      // Squads completos não precisam de farm, mas seus membros estão alocados —
      // nenhum outro squad pode usar esses membros como líder (evita recomendar
      // Padmé squad quando JMK está completo, pois Padmé é membro do JMK).
      var completedMembers = {}
      SQUAD_META.forEach(function(sq) {
        if (squadFarmEngine._membersNeeded(sq, player).length === 0) {
          sq.members.forEach(function(uid) { completedMembers[uid] = true })
        }
      })

      // Percorre squads por ordem de score até encontrar um que:
      //   (a) ainda precise de farm
      //   (b) cujo líder não esteja comprometido em um squad completo
      var found = null
      for (var si = 0; si < scored.length; si++) {
        var candidate = scored[si]
        // Líder comprometido em squad mais forte — pular
        if (candidate.squad.leader && completedMembers[candidate.squad.leader]) continue
        var membersNeeded = squadFarmEngine._membersNeeded(candidate.squad, player)
        if (membersNeeded.length > 0) {
          found = {
            squad:          candidate.squad,
            journeyPending: candidate.journeyPending,
            membersNeeded:  membersNeeded
          }
          break
        }
      }

      // Todos os squads deste jogador já estão completos — nada a recomendar
      if (!found) return

      var best           = found.squad
      var journeyPending = found.journeyPending
      var membersNeeded  = found.membersNeeded
      var cov            = squadFarmEngine._squadCoverage(best, player)

      results.push({
        player:         player,
        squad:          best,
        have:           cov.have,
        total:          cov.total,
        membersNeeded:  membersNeeded,
        journeyPending: journeyPending,
        leagueId:       gac.leagueId,
        divisionId:     gac.divisionId,
        skillRating:    gac.skillRating
      })
    })

    // Ordenar: jogadores mais fracos (menor skillRating) primeiro — são prioridade
    results.sort(function(a, b) { return a.skillRating - b.skillRating })

    return results
  },

  // Formata nome da liga
  formatLeague: function(leagueId, divisionId) {
    var names = {
      'CARBONITE': 'Carbonita',
      'BRONZIUM':  'Bronzium',
      'CHROMIUM':  'Chromium',
      'AURODIUM':  'Aurodium',
      'KYBER':     'Kyber'
    }
    return (names[leagueId] || leagueId) + ' ' + (divisionId || '')
  }

}
