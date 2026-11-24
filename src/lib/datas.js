// Datas no formato do banco: 'AAAA-MM-DD', sempre no fuso local.
export const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DIAS_LONGOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
export const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

export const pad = (n) => String(n).padStart(2, '0')
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseData = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const somarDias = (s, n) => {
  const d = parseData(s)
  d.setDate(d.getDate() + n)
  return ymd(d)
}
// Semana vai de segunda a domingo (docs/03).
export const segundaDaSemana = (s) => {
  const d = parseData(s)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return ymd(d)
}
export const hoje = () => ymd(new Date())

export const fmtDia = (s) => {
  const d = parseData(s)
  return `${DIAS[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}
export const fmtSemana = (inicio) => {
  const a = parseData(inicio)
  const b = parseData(somarDias(inicio, 6))
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} a ${b.getDate()} de ${MESES[b.getMonth()]}`
    : `${a.getDate()} ${MESES[a.getMonth()]} a ${b.getDate()} ${MESES[b.getMonth()]}`
}
export const fmtHora = (iso) => {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
export const rotuloDia = (s, agora = hoje()) => {
  if (s === agora) return 'Hoje'
  if (s === somarDias(agora, -1)) return 'Ontem'
  return `${DIAS_LONGOS[parseData(s).getDay()]}, ${fmtDia(s).slice(4)}`
}

export function haQuanto(iso, agora = Date.now()) {
  const m = Math.round((agora - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `há ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.round(h / 24)
  return d === 1 ? 'ontem' : `há ${d} dias`
}

// Igual ao nome_normalizado() do banco: ignora maiúscula, acento e espaço sobrando.
export const normalizar = (t) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
