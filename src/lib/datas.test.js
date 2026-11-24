import { describe, it, expect } from 'vitest'
import { segundaDaSemana, somarDias, fmtSemana, normalizar, rotuloDia } from './datas.js'

describe('datas', () => {
  it('acha a segunda da semana', () => {
    expect(segundaDaSemana('2026-11-24')).toBe('2026-11-23')
    expect(segundaDaSemana('2026-11-29')).toBe('2026-11-23') // domingo fecha a semana
    expect(segundaDaSemana('2026-11-23')).toBe('2026-11-23')
  })
  it('soma dias virando o mês', () => expect(somarDias('2026-11-30', 1)).toBe('2026-12-01'))
  it('formata a semana', () => {
    expect(fmtSemana('2026-11-23')).toBe('23 a 29 de nov')
    expect(fmtSemana('2026-11-30')).toBe('30 nov a 6 dez')
  })
  it('normaliza igual ao banco', () => expect(normalizar('  Açúcar   DEMERARA ')).toBe('acucar demerara'))
  it('rotula hoje e ontem', () => {
    expect(rotuloDia('2026-11-24', '2026-11-24')).toBe('Hoje')
    expect(rotuloDia('2026-11-23', '2026-11-24')).toBe('Ontem')
    expect(rotuloDia('2026-11-20', '2026-11-24')).toBe('Sexta, 20/11')
  })
})
