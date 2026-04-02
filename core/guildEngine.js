/**
 * guildEngine.js
 * Dado um allycode, busca informações da guilda e lista de membros.
 * Fluxo: allycode → guild_id → membros (nome + allycode)
 */

var guildEngine = {

  // Busca guild_id e membros a partir de um allycode
  // callback(err, result) onde result = { guildId, guildName, members: [{name, allycode}] }
  fetchFromAllycode: function(allycode, callback) {

    var cleanCode = String(allycode).replace(/\D/g, '')
    if (!cleanCode) return callback('Allycode inválido')

    // Passo 1: buscar dados do jogador para pegar guild_id
    fetch('https://swgoh.gg/api/player/' + cleanCode + '/')
      .then(function(r) { return r.json() })
      .then(function(playerData) {
        var guildId = playerData.data.guild_id
        var guildName = playerData.data.guild_name

        if (!guildId) return callback('Jogador não está em uma guilda')

        // Passo 2: buscar membros da guilda
        return fetch('https://swgoh.gg/api/guild-profile/' + guildId + '/')
          .then(function(r) { return r.json() })
          .then(function(guildData) {
            var members = guildData.data.members.map(function(m) {
              return {
                name: m.player_name,
                allycode: m.ally_code,
                gp: m.galactic_power || 0
              }
            })
            callback(null, {
              guildId: guildId,
              guildName: guildName,
              members: members,
              totalGP: members.reduce(function(sum, m) { return sum + m.gp }, 0),
              playerCount: members.length
            })
          })
      })
      .catch(function(e) { callback('Erro ao buscar guilda: ' + e.message) })
  }

}
