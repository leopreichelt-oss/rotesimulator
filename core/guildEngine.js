/**
 * guildEngine.js
 * Busca dados da guilda via Cloudflare Worker → Railway Comlink → API oficial do jogo
 */

var COMLINK_URL = 'https://worker-lively-heart-f0a0.leopreichelt.workers.dev'

var guildEngine = {

  fetchFromAllycode: function(allycode, callback) {
    var cleanCode = String(allycode).replace(/\D/g, '')
    if (!cleanCode) return callback('Allycode inválido')

    // Passo 1: buscar dados do jogador para pegar guildId
    fetch(COMLINK_URL + '/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { allyCode: cleanCode } })
    })
    .then(function(r) { return r.json() })
    .then(function(player) {
      // Comlink pode retornar guildId em campos diferentes dependendo da versão
      var guildId    = player.guildId || (player.guild && player.guild.id) || (player.guildInfo && player.guildInfo.guildId)
      var guildName  = player.guildName || (player.guild && player.guild.name) || ''
      var myPlayerId = player.playerId

      console.log('[guildEngine] player response keys:', Object.keys(player))
      console.log('[guildEngine] guildId:', guildId, '| playerId:', myPlayerId)

      if (!guildId) return callback('Jogador não está em uma guilda (guildId não encontrado — response: ' + JSON.stringify(Object.keys(player)) + ')')

      // Passo 2: buscar dados da guilda
      return fetch(COMLINK_URL + '/guild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: { guildId: guildId, includeRecentGuildActivityInfo: true } })
      })
      .then(function(r) { return r.json() })
      .then(function(d) {
        var profile = d.guild.profile
        var totalGP = Number(profile.guildGalacticPower) || 0
        var memberCount = Number(profile.memberCount) || d.guild.member.length

        var members = d.guild.member.map(function(m) {
          // lastActivityTime pode vir em ms (>1e12) ou segundos
          var lat = m.lastActivityTime ? Number(m.lastActivityTime) : null
          if (lat && lat < 1e12) lat = lat * 1000  // normalizar para ms
          return {
            name:             m.playerName,
            playerId:         m.playerId,
            gp:               Number(m.galacticPower) || 0,
            lastActivityTime: lat,
            memberLevel:      Number(m.memberLevel) || 1  // 1=membro 2=veterano 3=oficial 4=líder
          }
        })

        // Nível do usuário que fez o sync
        var myMember      = members.find(function(m) { return m.playerId === myPlayerId })
        var myMemberLevel = myMember ? (myMember.memberLevel || 1) : 1

        callback(null, {
          guildId:       guildId,
          guildName:     profile.name || guildName,
          totalGP:       totalGP,
          playerCount:   memberCount,
          members:       members,
          myPlayerId:    myPlayerId,
          myMemberLevel: myMemberLevel   // 3+ = oficial/líder → pode editar estratégia
        })
      })
    })
    .catch(function(e) { callback('Erro: ' + e.message) })
  }

}
