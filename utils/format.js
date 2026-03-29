function fmt(n){
return Math.round(n).toLocaleString("pt-BR")
}
function formatNumber(n){

if(!n) return "0"

return Math.round(n).toLocaleString("pt-BR")

}
function formatNumber(value){

if(value === undefined || value === null) return "0"

return Math.round(value).toLocaleString("pt-BR")

}