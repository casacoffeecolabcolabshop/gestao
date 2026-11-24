import { describe, expect, it } from 'vitest'
import { agruparParaComprar, lerLista } from './lista.js'

describe('lerLista', () => {
  it('lê nome e quantidade com hífen ou dois-pontos', () => {
    expect(lerLista('Leite integral - 2 caixas\nCafé: 1 kg')).toEqual([
      { nome: 'Leite integral', quantidade: '2 caixas' },
      { nome: 'Café', quantidade: '1 kg' },
    ])
  })

  it('quantidade é opcional e hífen no meio do nome não separa', () => {
    expect(lerLista('Copo 300ml\nPão-de-queijo')).toEqual([
      { nome: 'Copo 300ml', quantidade: '' },
      { nome: 'Pão-de-queijo', quantidade: '' },
    ])
  })

  it('ignora marcadores, linhas vazias e espaços', () => {
    const texto = '- Leite\n\n* Açúcar\n• Canela\n1. Guardanapo\n2) Mexedor\n[ ] Tampa\n[x] Canudo\n   \n'
    expect(lerLista(texto).map((i) => i.nome)).toEqual(['Leite', 'Açúcar', 'Canela', 'Guardanapo', 'Mexedor', 'Tampa', 'Canudo'])
  })

  it('repetido na própria lista entra uma vez (ignora maiúscula e acento)', () => {
    expect(lerLista('Açúcar\nacucar - 2kg\nAÇÚCAR').map((i) => i.nome)).toEqual(['Açúcar'])
  })

  it('aceita quebra de linha do Windows e texto vazio', () => {
    expect(lerLista('Leite\r\nCafé\r\n')).toHaveLength(2)
    expect(lerLista('')).toEqual([])
    expect(lerLista(undefined)).toEqual([])
  })
})

describe('agruparParaComprar', () => {
  const item = (nome, extra) => ({ nome, status: 'pendente', urgente: false, tipo: 'insumo', created_at: '2026-11-24T10:00:00Z', ...extra })

  it('só pendentes, em Urgentes, Insumos e Produtos, mais antigos primeiro', () => {
    const grupos = agruparParaComprar([
      item('Pão', { tipo: 'produto' }),
      item('Leite', { urgente: true, created_at: '2026-11-24T11:00:00Z' }),
      item('Café', { created_at: '2026-11-24T09:00:00Z' }),
      item('Copo', { created_at: '2026-11-24T12:00:00Z' }),
      item('Bolo', { tipo: 'produto', urgente: true, created_at: '2026-11-24T08:00:00Z' }),
      item('Açúcar', { status: 'comprado' }),
    ])
    expect(grupos.map((g) => [g.titulo, g.itens.map((i) => i.nome)])).toEqual([
      ['Urgentes', ['Bolo', 'Leite']],
      ['Insumos', ['Café', 'Copo']],
      ['Produtos', ['Pão']],
    ])
  })

  it('comprado enquanto o painel está aberto continua no mesmo grupo e lugar', () => {
    const grupos = agruparParaComprar(
      [
        item('Leite', { id: 'a', urgente: true, status: 'comprado' }),
        item('Café', { id: 'b', created_at: '2026-11-24T09:00:00Z', status: 'comprado' }),
        item('Copo', { id: 'c' }),
        item('Açúcar', { id: 'd', status: 'comprado' }),
      ],
      new Set(['a', 'b']),
    )
    expect(grupos.map((g) => [g.titulo, g.itens.map((i) => i.nome)])).toEqual([
      ['Urgentes', ['Leite']],
      ['Insumos', ['Café', 'Copo']],
    ])
  })

  it('grupo vazio não aparece; nada pendente devolve lista vazia', () => {
    expect(agruparParaComprar([item('Pão', { tipo: 'produto' })]).map((g) => g.titulo)).toEqual(['Produtos'])
    expect(agruparParaComprar([item('Pão', { status: 'comprado' })])).toEqual([])
  })
})
