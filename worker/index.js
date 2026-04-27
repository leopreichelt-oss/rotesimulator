/**
 * worker/index.js — Cloudflare Worker: ROTE Planner backend
 *
 * Rotas:
 *   POST /auth/popup-init  → inicia popup OAuth (gera PKCE + state)
 *   GET  /auth/callback    → recebe code da EA, troca por token, fecha popup
 *   GET  /auth/status      → verifica token salvo para allycode
 *   *                      → proxy para Railway Comlink
 *
 * Env bindings (wrangler.toml):
 *   STRATEGY_KV  — KV namespace existente
 */

const COMLINK      = 'https://swgoh-comlink-production-81bf.up.railway.app'
const WORKER_URL   = 'https://worker-lively-heart-f0a0.leopreichelt.workers.dev'

const EA_CLIENT_ID    = 'JUNO_PC_CLIENT'
const EA_AUTH_URL     = 'https://accounts.ea.com/connect/auth'
const EA_TOKEN_URL    = 'https://accounts.ea.com/connect/token'
const EA_REDIRECT_URI = WORKER_URL + '/auth/callback'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    const url  = new URL(request.url)
    const path = url.pathname

    try {
      if (path === '/auth/popup-init' && request.method === 'POST') return handlePopupInit(request, env)
      if (path === '/auth/callback'   && request.method === 'GET')  return handleCallback(request, env)
      if (path === '/auth/status'     && request.method === 'GET')  return handleAuthStatus(request, env)

      // proxy Comlink
      const body = request.method === 'POST' ? await request.text() : undefined
      const res  = await fetch(COMLINK + path, {
        method:  request.method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      return new Response(await res.text(), {
        status:  res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    } catch (e) {
      console.error(e)
      return jsonResp({ error: 'internal', detail: e.message }, 500)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PKCE
// ─────────────────────────────────────────────────────────────────────────────

function b64url(buf) {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'')
}

function randomB64url(n) {
  const buf = new Uint8Array(n)
  crypto.getRandomValues(buf)
  return b64url(buf)
}

async function pkceChallenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return b64url(digest)
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/popup-init
// Body: { allycode }
// Retorna: { authUrl }  — frontend abre esse URL em popup
// ─────────────────────────────────────────────────────────────────────────────

async function handlePopupInit(request, env) {
  const { allycode } = await request.json()
  if (!allycode) return jsonErr('missing_allycode')

  const verifier   = randomB64url(32)
  const challenge  = await pkceChallenge(verifier)
  const state      = randomB64url(16)

  await env.STRATEGY_KV.put(
    'auth_popup_' + state,
    JSON.stringify({ allycode, verifier, createdAt: Date.now() }),
    { expirationTtl: 600 }
  )

  const params = new URLSearchParams({
    client_id:             EA_CLIENT_ID,
    redirect_uri:          EA_REDIRECT_URI,
    response_type:         'code',
    code_challenge:        challenge,
    code_challenge_method: 'S256',
    display:               'web/login',
    locale:                'pt_BR',
    state,
  })

  return jsonResp({ authUrl: EA_AUTH_URL + '?' + params.toString() })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/callback?code=XXX&state=YYY
// EA redireciona o popup aqui após login bem-sucedido
// ─────────────────────────────────────────────────────────────────────────────

async function handleCallback(request, env) {
  const url   = new URL(request.url)
  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) return htmlPage('❌ Erro EA: ' + error, null)
  if (!code || !state) return htmlPage('❌ Parâmetros inválidos.', null)

  const raw = await env.STRATEGY_KV.get('auth_popup_' + state)
  if (!raw) return htmlPage('❌ Sessão expirada. Feche esta aba e tente novamente.', null)

  const { allycode, verifier } = JSON.parse(raw)

  // Trocar code por token
  const tokenBody = new URLSearchParams({
    grant_type:    'authorization_code',
    code,
    client_id:     EA_CLIENT_ID,
    redirect_uri:  EA_REDIRECT_URI,
    code_verifier: verifier,
  })

  const tokenRes  = await fetch(EA_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    tokenBody.toString(),
  })
  const tokenData = await tokenRes.json()

  if (!tokenData.access_token) {
    return htmlPage('❌ Falha ao obter token: ' + (tokenData.error || 'desconhecido'), null)
  }

  const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000

  await env.STRATEGY_KV.put(
    'ea_token_' + allycode,
    JSON.stringify({ access_token: tokenData.access_token, expiresAt, allycode }),
    { expirationTtl: 7 * 86400 }
  )

  try { await env.STRATEGY_KV.delete('auth_popup_' + state) } catch (_) {}

  return htmlPage('✅ Autenticado! Pode fechar esta aba.', { allycode, expiresAt })
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /auth/status?allycode=XXX
// ─────────────────────────────────────────────────────────────────────────────

async function handleAuthStatus(request, env) {
  const allycode = new URL(request.url).searchParams.get('allycode')
  if (!allycode) return jsonErr('missing_allycode')

  const raw = await env.STRATEGY_KV.get('ea_token_' + allycode)
  if (!raw) return jsonResp({ authenticated: false })

  const token = JSON.parse(raw)
  return jsonResp({
    authenticated: token.expiresAt > Date.now(),
    expiresAt:     token.expiresAt,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function htmlPage(msg, authData) {
  const script = authData
    ? `window.opener && window.opener.postMessage(${JSON.stringify({ type: 'ea_auth_success', ...authData })}, '*'); setTimeout(() => window.close(), 1500);`
    : ''
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#e2e8f0;font-size:18px;}</style>
    </head><body><div>${msg}</div><script>${script}<\/script></body></html>`,
    { headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
  )
}

function jsonResp(data, status) {
  return new Response(JSON.stringify(data), {
    status:  status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, CORS),
  })
}

function jsonErr(code, extra) {
  return jsonResp(Object.assign({ error: code }, extra || {}), 400)
}
