import { somarDias, pad } from '../../lib/datas.js'

// '07:00' ou '07:00:00' -> minutos desde a meia-noite
export const paraMinutos = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// Fim menor ou igual ao início = termina no dia seguinte (docs/03).
export function duracaoMin(inicio, fim) {
  let x = paraMinutos(fim) - paraMinutos(inicio)
  if (x <= 0) x += 1440
  return x
}

export const viraODia = (inicio, fim) => paraMinutos(fim) <= paraMinutos(inicio)

// Intervalo real em minutos absolutos, igual a intervalo_turno() do banco.
export function intervalo(turno) {
  const [y, m, d] = turno.data.split('-').map(Number)
  const ini = Date.UTC(y, m - 1, d) / 60000 + paraMinutos(turno.inicio)
  return [ini, ini + duracaoMin(turno.inicio, turno.fim)]
}

export function sobrepoe(a, b) {
  const [a1, a2] = intervalo(a)
  const [b1, b2] = intervalo(b)
  return a1 < b2 && b1 < a2
}

// Horas contam no dia em que o turno começa (igual à view v_horas_semana).
export function minutosNaSemana(turnos, pessoaId, inicioSemana) {
  const fim = somarDias(inicioSemana, 7)
  return turnos
    .filter((t) => t.profile_id === pessoaId && t.data >= inicioSemana && t.data < fim)
    .reduce((total, t) => total + duracaoMin(t.inicio, t.fim), 0)
}

export function minutosNoMes(turnos, pessoaId, ano, mes) {
  const prefixo = `${ano}-${pad(mes + 1)}`
  return turnos
    .filter((t) => t.profile_id === pessoaId && t.data.startsWith(prefixo))
    .reduce((total, t) => total + duracaoMin(t.inicio, t.fim), 0)
}

export function fmtHoras(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${pad(m)}` : `${h}h`
}
