/**
 * guildEngine.js
 * Busca dados da guilda via Cloudflare Worker → Railway Comlink → API oficial do jogo
 * Fluxo: allyCode → playerId + guildId → membros da guilda
 */

var COMLINK_URL = 'https://worker-lively-heart-f0a0.leopreichelt.workers.dev'

var guildEngine = {

  // Dado um allycode, retorna info da guilda e lista de membros
  // callback(err, { guildId, guildName, totalGP, playerCount, members:[{name,playerId,allyCode,gp}] })
  fetchFromAllycode: function(allycode, callback) {
    var cleanCode = String(allycode).replace(/\D/g, '')
    if (!cleanCode) return callback('Allycode inválido')

    // Passo 1: buscar dados do jogador para pegar guildId e playerId
    fetch(COMLINK_URL + '/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { allyCode: cleanCode } })
    })
    .then(function(r) { return r.json() })
    .then(function(player) {
      var guildId = player.guildId
      var guildName = player.guildName

      if (!guildId) return callback('Jogador não está em uma guilda')

      // Passo 2: buscar membros da guilda
      return fetch(COMLINK_URL + '/guild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: { guildId: guildId } })
      })
      .then(function(r) { return r.json() })
      .then(function(d) {
        var members = d.guild.member.map(function(m) {
          return {
            name: m.playerName,
            playerId: m.playerId,
            gp: Number(m.galacticPower) || 0
          }
        })

        var totalGP = members.reduce(function(s, m) { return s + m.gp }, 0)

        callback(null, {
          guildId: guildId,
          guildName: guildName,
          totalGP: totalGP,
          playerCount: members.length,
          members: members
        })
      })
    })
    .catch(function(e) { callback('Erro: ' + e.message) })
  }

}
