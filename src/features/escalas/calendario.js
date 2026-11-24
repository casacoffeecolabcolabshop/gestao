import { pad, segundaDaSemana, somarDias, ymd } from '../../lib/datas.js'

// Grade do mês (docs/03, Calendário): semanas de segunda a domingo, cobrindo o mês inteiro.
// Dias de fora do mês entram com doMes = false para completar a primeira e a última semana.
export function montarMes(ano, mes) {
  const primeiro = `${ano}-${pad(mes + 1)}-01`
  const ultimo = ymd(new Date(ano, mes + 1, 0))
  const semanas = []
  let dia = segundaDaSemana(primeiro)
  while (dia <= ultimo) {
    const semana = []
    for (let i = 0; i < 7; i++) {
      semana.push({ data: dia, doMes: dia.slice(0, 7) === primeiro.slice(0, 7) })
      dia = somarDias(dia, 1)
    }
    semanas.push(semana)
  }
  return semanas
}

// Turnos agrupados por dia, em ordem de horário.
export function turnosPorDia(turnos) {
  const mapa = {}
  for (const t of [...turnos].sort((a, b) => a.inicio.localeCompare(b.inicio))) (mapa[t.data] ||= []).push(t)
  return mapa
}

// Cor fixa por pessoa (docs/02): paleta sem verde, amarelo e vermelho, que têm significado no app.
// ordem: os tons mais diferentes primeiro (equipe pequena usa só os primeiros)
export const CORES_PESSOA = ['#4f7fd9', '#d65c9e', '#2f9bb3', '#b07a4f', '#8a5cd6', '#c46ad1', '#4a8fa8', '#9a7b6a', '#6c6fd8', '#5d8bd3']
export function corDaPessoa(id = '') {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return CORES_PESSOA[h % CORES_PESSOA.length]
}

// Cores distintas para a equipe: pela ordem dos ids (até 10 pessoas sem repetir); quem não está na lista cai no cálculo por id.
export function coresDaEquipe(ids) {
  const mapa = {}
  ;[...ids].sort().forEach((id, i) => {
    mapa[id] = i < CORES_PESSOA.length ? CORES_PESSOA[i] : corDaPessoa(id)
  })
  return (id) => mapa[id] || corDaPessoa(id)
}
