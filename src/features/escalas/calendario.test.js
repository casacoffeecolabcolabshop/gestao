import { describe, expect, it } from 'vitest'
import { CORES_PESSOA, coresDaEquipe, corDaPessoa, montarMes, turnosPorDia } from './calendario.js'

describe('montarMes', () => {
  it('novembro de 2026: começa na segunda 26/10 e termina no domingo 06/12', () => {
    const semanas = montarMes(2026, 10)
    expect(semanas).toHaveLength(6)
    expect(semanas[0][0]).toEqual({ data: '2026-10-26', doMes: false })
    expect(semanas[0][6]).toEqual({ data: '2026-11-01', doMes: true })
    expect(semanas.at(-1)[6]).toEqual({ data: '2026-12-06', doMes: false })
  })

  it('toda semana tem 7 dias e cobre todos os dias do mês', () => {
    for (const [ano, mes, dias] of [[2026, 1, 28], [2028, 1, 29], [2026, 11, 31]]) {
      const semanas = montarMes(ano, mes)
      expect(semanas.every((s) => s.length === 7)).toBe(true)
      expect(semanas.flat().filter((d) => d.doMes)).toHaveLength(dias)
    }
  })

  it('mês que começa numa segunda não tem dia de fora no começo', () => {
    // junho de 2026 começa numa segunda
    expect(montarMes(2026, 5)[0][0]).toEqual({ data: '2026-06-01', doMes: true })
  })
})

describe('turnosPorDia', () => {
  it('agrupa por dia em ordem de horário', () => {
    const m = turnosPorDia([
      { id: 'a', data: '2026-11-24', inicio: '13:00' },
      { id: 'b', data: '2026-11-24', inicio: '07:00' },
      { id: 'c', data: '2026-11-25', inicio: '09:00' },
    ])
    expect(m['2026-11-24'].map((t) => t.id)).toEqual(['b', 'a'])
    expect(m['2026-11-25'].map((t) => t.id)).toEqual(['c'])
  })
})

describe('corDaPessoa', () => {
  it('mesma pessoa, mesma cor; sempre da paleta', () => {
    const id = '33333333-3333-3333-3333-333333333333'
    expect(corDaPessoa(id)).toBe(corDaPessoa(id))
    expect(CORES_PESSOA).toContain(corDaPessoa(id))
    expect(CORES_PESSOA).toContain(corDaPessoa(''))
  })
})

describe('coresDaEquipe', () => {
  it('cada pessoa da equipe tem cor diferente (até 10) e a mesma ordem dá a mesma cor', () => {
    const ids = Array.from({ length: 10 }, (_, i) => `id-${i}`)
    const cor = coresDaEquipe(ids)
    expect(new Set(ids.map(cor)).size).toBe(10)
    expect(coresDaEquipe([...ids].reverse())('id-3')).toBe(cor('id-3'))
  })

  it('quem não está na equipe ainda ganha uma cor da paleta', () => {
    expect(CORES_PESSOA).toContain(coresDaEquipe(['a'])('fora'))
  })
})
