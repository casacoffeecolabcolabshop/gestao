import { describe, it, expect } from 'vitest'
import { duracaoMin, sobrepoe, minutosNaSemana, minutosNoMes, fmtHoras, viraODia } from './horas.js'

const t = (profile_id, data, inicio, fim) => ({ profile_id, data, inicio, fim })

describe('duracaoMin', () => {
  it('soma turno normal', () => expect(duracaoMin('07:00', '13:00')).toBe(360))
  it('aceita segundos vindos do banco', () => expect(duracaoMin('07:00:00', '13:30:00')).toBe(390))
  it('turno que passa da meia-noite', () => expect(duracaoMin('18:00', '01:00')).toBe(420))
  it('marca quando vira o dia', () => {
    expect(viraODia('18:00', '01:00')).toBe(true)
    expect(viraODia('07:00', '13:00')).toBe(false)
  })
})

describe('sobrepoe', () => {
  it('turnos colados não sobrepõem', () =>
    expect(sobrepoe(t('a', '2026-11-24', '07:00', '13:00'), t('a', '2026-11-24', '13:00', '19:00'))).toBe(false))
  it('turnos que se cruzam sobrepõem', () =>
    expect(sobrepoe(t('a', '2026-11-24', '07:00', '13:00'), t('a', '2026-11-24', '12:00', '15:00'))).toBe(true))
  it('turno da madrugada cruza com o do dia seguinte', () =>
    expect(sobrepoe(t('a', '2026-11-28', '22:00', '03:00'), t('a', '2026-11-29', '02:00', '08:00'))).toBe(true))
})

describe('horas', () => {
  const turnos = [
    t('a', '2026-11-23', '07:00', '13:00'), // seg
    t('a', '2026-11-29', '18:00', '01:00'), // dom, termina segunda: conta no domingo
    t('a', '2026-11-30', '07:00', '13:00'), // próxima semana e outro mês
    t('b', '2026-11-24', '09:00', '17:00'),
  ]
  it('soma a semana de segunda a domingo', () => expect(minutosNaSemana(turnos, 'a', '2026-11-23')).toBe(780))
  it('soma o mês', () => expect(minutosNoMes(turnos, 'a', 2026, 10)).toBe(1140))
  it('não mistura pessoas', () => expect(minutosNaSemana(turnos, 'b', '2026-11-23')).toBe(480))
  it('formata horas', () => {
    expect(fmtHoras(780)).toBe('13h')
    expect(fmtHoras(390)).toBe('6h30')
    expect(fmtHoras(0)).toBe('0h')
  })
})
