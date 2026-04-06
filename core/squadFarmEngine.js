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
 *     2. Ordena por "mais próximo de completar" → recomenda o top squad por jogador
 *     3. Mostra min_relic → ideal_relic (sem retrabalho)
 *
 * Repetição: múltiplos jogadores podem receber o mesmo squad.
 * Cada jogador recebe 1 recomendação por vez.
 */

var squadFarmEngine = {

  // Ordem das ligas do mais fraco ao mais forte
  LEAGUE_ORDER: ['CARBONITE', 'BRONZIUM', 'CHROMIUM', 'AURODIUM', 'KYBER'],

  leagueIndex: function(leagueId) {
    var idx = squadFarmEngine.LEAGUE_ORDER.indexOf(leagueId)
    return idx >= 0 ? idx : 0
  },

  // Relic atual de um personagem para um jogador (-1 = não tem)
  _playerRelicFor: function(player, unitId) {
    if (!player.units) return -1
    var unit = player.units.find(function(u) { return u.base_id === unitId })
    if (!unit) return -1
    if (unit.combat_type === 2 || (typeof SHIP_IDS !== 'undefined' && SHIP_IDS[unitId]))
      return unit.rarity >= 7 ? 99 : -1
    return (typeof rosterEngine !== 'undefined')
      ? rosterEngine.toRelicLevel(unit.relic_tier)
      : Math.max(0, (unit.relic_tier || 0) - 2)
  },

  // Para um squad e um jogador: quantos membros já atendem minRelic
  _squadCoverage: function(squad, player) {
    if (squad.isFleet) {
      // Naves: conta quem tem 7★
      var have = squad.members.filter(function(uid) {
        var unit = player.units ? player.units.find(function(u) { return u.base_id === uid }) : null
        return unit && unit.rarity >= 7
      }).length
      return { have: have, total: squad.members.length }
    }

    var have = squad.members.filter(function(uid) {
      var relic = squadFarmEngine._playerRelicFor(player, uid)
      return relic >= squad.minRelic
    }).length
    return { have: have, total: squad.members.length }
  },

  // Score de prioridade para um squad dado o jogador
  // Maior score = mais recomendado
  _scoreSquad: function(squad, player, leagueIdx) {
    var cov = squadFarmEngine._squadCoverage(squad, player)

    // Squad inacessível: liga do squad acima da liga do jogador (mas permitimos 1 nível acima)
    var squadLeagueIdx = squadFarmEngine.leagueIndex(squad.leagueMin)
    if (squadLeagueIdx > leagueIdx + 1) return -1  // muito avançado

    // Fator de cobertura: 0.0 a 1.0 (quanto já tem)
    var coverage = cov.total > 0 ? cov.have / cov.total : 0

    // Fator multi-evento: 1 evento = 1pt, 2 = 2pt, 3 = 3pt
    var eventsCount = (squad.events.rote ? 1 : 0) + (squad.events.gac ? 1 : 0) + (squad.events.tw ? 1 : 0)

    // Fator de liga: squads de ligas mais altas têm peso para jogadores que já estão lá
    var leagueMatch = squadLeagueIdx <= leagueIdx ? 1.2 : 1.0

    // Score final: cobertura (principal) + multi-evento + liga
    // Cobertura alta = já tem boa base = menor custo de farm
    return (coverage * 5) + (eventsCount * 0.5) + leagueMatch
  },

  // Gera recomendações para todos os jogadores ativos
  // Retorna: [{ player, squad, have, total, membersNeeded, minRelic, idealRelic, note }]
  recommend: function(rosterMap) {
    if (!rosterMap || typeof SQUAD_META === 'undefined') return []

    var results = []

    Object.values(rosterMap).forEach(function(player) {
      var gac = player.gac || { leagueId: 'CARBONITE', divisionId: 5, skillRating: 0 }
      var leagueIdx = squadFarmEngine.leagueIndex(gac.leagueId)

      // Calcular score para cada squad
      var scored = SQUAD_META.map(function(squad) {
        return { squad: squad, score: squadFarmEngine._scoreSquad(squad, player, leagueIdx) }
      })
      .filter(function(s) { return s.score >= 0 })
      .sort(function(a, b) { return b.score - a.score })

      if (scored.length === 0) return

      var best = scored[0].squad
      var cov  = squadFarmEngine._squadCoverage(best, player)

      // Membros que ainda precisam farmar
      var membersNeeded = []
      best.members.forEach(function(uid) {
        var relic = squadFarmEngine._playerRelicFor(player, uid)
        var meetsMin = best.isFleet ? relic === 99 : relic >= best.minRelic
        if (!meetsMin) {
          var relicStr = relic < 0 ? 'sem o personagem'
            : best.isFleet ? (relic + '★') : 'R' + relic
          membersNeeded.push({
            unitId: uid,
            name: (typeof getUnitName === 'function') ? getUnitName(uid) : uid,
            current: relicStr,
            target: best.isFleet ? '7★' : 'R' + best.minRelic
          })
        }
      })

      results.push({
        player:        player,
        squad:         best,
        have:          cov.have,
        total:         cov.total,
        membersNeeded: membersNeeded,
        leagueId:      gac.leagueId,
        divisionId:    gac.divisionId,
        skillRating:   gac.skillRating
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
