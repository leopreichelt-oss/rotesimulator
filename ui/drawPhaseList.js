function drawPhaseList(){

const container = document.getElementById("phaseList")
container.innerHTML = ""

for(let phase=1;phase<=6;phase++){

let p = state.phases[phase] || {}

let div = document.createElement("div")
div.className = "phaseBox"

// ⭐ estrelas calculadas da fase
let totalStarsMin = 0
let totalStarsMax = 0

let phasePlanetsForStars = getPlanetsOfPhase(phase)
phasePlanetsForStars.forEach(name => {
  let pl = state.planets[name] || {}
  totalStarsMin += pl.starsMin || 0
  totalStarsMax += pl.starsMax || 0
})

let starsMin = `<span style="color:#FFD700;">${"★".repeat(totalStarsMin)}</span>` || "0★"
let starsMax = `<span style="color:#FFD700;">${"★".repeat(totalStarsMax)}</span>` || "0★"
let stars = totalStarsMin === totalStarsMax
  ? starsMax
  : `${starsMin} – ${starsMax}`

// ⭐ carry formatado
let carryMin = formatNumber(p.carryMin || 0)
let carryMax = formatNumber(p.carryMax || 0)

let carryClass = "carryNeutral"
if(p.carryMin < 0) carryClass = "carryNegative"
else if(p.carryMax > 0) carryClass = "carryPositive"

let carryWarning = ""
if((p.carryMin || 0) > (p.carryMax || 0)){
  carryWarning += `<div class="carryWarning">⚠ Carry mínimo maior que máximo: a guilda pode bater 5★ sem atingir 6★. Avalie travar movimentação ao atingir 5★ e não fazer ações antecipadas no planeta seguinte.</div>`
}

// CENÁRIO A: otimista bate máximo, pessimista não
if(p.cenarioA){
  carryWarning += `<div class="carryWarning">
    ⚠ <strong>Risco de queda de estrelas:</strong> cenário otimista bate ${p.maxPossibleStars}★ mas pessimista pode ficar em ${p.totalStarsMin}★.<br>
    👉 Ao bater ${p.totalStarsMin + 1}★, avaliar bloquear deploy em 1 planeta para garantir ${p.totalStarsMin + 2}★.<br>
👉 Após garantir ${p.totalStarsMin + 2}★, avaliar GP restante: se suficiente, retomar o planeta bloqueado para tentar ${p.maxPossibleStars}★.
  </div>`
}

// CENÁRIO B: 5★ alcançável sacrificando 6★
if(p.cenarioB && !p.cenarioA){
  let alvo = (p.maxPossibleStars || 6) - 1
  let gpRestanteTexto = phase < 6
    ? "👉 GP restante vira carry para a próxima fase."
    : ""
  carryWarning += `<div class="carryWarning">
    ⚠ <strong>Estratégia de garantia:</strong> ${p.maxPossibleStars}★ fora do alcance, mas ${alvo}★ é possível concentrando GP.<br>
    👉 Ao bater ${alvo - 1}★, bloquear deploy em 1 planeta e concentrar tudo no outro para garantir ${alvo}★.<br>
    ${gpRestanteTexto}
  </div>`
}
// ⭐ gap (opcional)
let gapText = ""

if(p.starGap){
gapText += `⚠ faltam ${formatNumber(p.starGap)} para próxima estrela<br>`
}

if(p.guildGrowthNeeded){
  let label = p.guildGrowthNeededLabel || "para atingir 6 estrelas com segurança"
  gapText += `<span style="color:#ff4444;">📈 É necessário crescer ~${formatNumber(p.guildGrowthNeeded)} GP ${label}<br>`
}
if(p.guildGrowthNeededMin && !p.guildGrowthNeeded){
  let labelMin = p.guildGrowthNeededLabel || "para garantir 6 estrelas"
  gapText += `<span style="color:#ff4444;">⚠ No cenário pessimista faltam ~${formatNumber(p.guildGrowthNeededMin)} GP ${labelMin}</span><br>`
}


// ⭐ detalhes técnicos
let detailsHTML = `
PG entrada: ${formatNumber(p.activeGP||0)}<br>
${p.carryIn ? `Carry in: ${formatNumber(p.carryIn)}<br>` : ""}
Platoons: ${formatNumber(p.platoons||0)}<br>
Batalhas: ${formatNumber(p.battles||0)}<br>
Battles antecipadas: ${formatNumber(p.earlyBattles||0)}<br>
Platoons antecipados: ${formatNumber(p.earlyPlatoons||0)}<br>
`

let planetNames = phasePlanetsForStars.map(n => `<span style="color:#4da6ff;">${n}</span>`).join(" · ")
div.innerHTML = `

<div class="phaseHeader">
Fase ${phase} — ${planetNames}
</div>
<div class="phaseStars">
${stars}
</div>

<div class="phaseCarry ${carryClass}">
Carry ${carryMin} → ${carryMax}
</div>

${carryWarning}

${gapText ? `<div class="phaseGap">${gapText}</div>` : ""}

<div class="phaseResult">
Resultado real
<input
type="number"
id="realPhase${phase}"
${state.historyMode ? "disabled" : ""}
onchange="updateROTEResult(${phase}, this.value); calculate();"
oninput="updateROTEResult(${phase}, this.value);">
</div>

<div class="phaseActions">
<button onclick="generatePhaseGuide(${phase})">
Roteiro
</button>

<span class="phaseToggle"
onclick="togglePhaseDetails(${phase}, this)">
▸ detalhes técnicos
</span>
</div>

<div class="phaseDetails hidden" id="phaseDetails${phase}">
${detailsHTML}
</div>

`

container.appendChild(div)

}

// carregar resultados salvos apenas no modo histórico
if(state.historyMode === true){
  loadROTEResults()
}
}

