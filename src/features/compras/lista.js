import { normalizar } from '../../lib/datas.js'

export const MAX_ITENS_POR_VEZ = 50

// Marcadores do começo da linha: "-", "*", "•", "1.", "1)", "[ ]", "[x]"
const MARCADOR = /^\s*(?:[-*•·]+|\d+[.)]|\[[ xX]?\])\s*/

// "Leite - 2 caixas" | "Leite: 2 caixas" | "Leite" (docs/03, Vários de uma vez)
function lerLinha(linha) {
  const texto = linha.replace(MARCADOR, '').trim()
  if (!texto) return null
  const m = texto.match(/^(.+?)\s*(?:\s[-–]\s|:)\s*(.*)$/)
  const nome = (m ? m[1] : texto).trim()
  const quantidade = (m ? m[2] : '').trim()
  return nome ? { nome, quantidade } : null
}

// Texto colado → itens prontos para validar. Repetidos na própria lista entram uma vez.
export function lerLista(texto) {
  const vistos = new Set()
  const itens = []
  for (const linha of (texto || '').split(/\r?\n/)) {
    const item = lerLinha(linha)
    if (!item) continue
    const chave = normalizar(item.nome)
    if (vistos.has(chave)) continue
    vistos.add(chave)
    itens.push(item)
  }
  return itens
}

const maisAntigoPrimeiro = (a, b) => a.created_at.localeCompare(b.created_at)

// Painel "Para comprar": só pendentes, em Urgentes, Insumos, Produtos (docs/03).
// `manter`: ids comprados enquanto o painel está aberto, que continuam no lugar (verdes).
export function agruparParaComprar(itens, manter = new Set()) {
  const pendentes = itens.filter((i) => i.status === 'pendente' || manter.has(i.id)).sort(maisAntigoPrimeiro)
  return [
    { titulo: 'Urgentes', itens: pendentes.filter((i) => i.urgente) },
    { titulo: 'Insumos', itens: pendentes.filter((i) => !i.urgente && i.tipo === 'insumo') },
    { titulo: 'Produtos', itens: pendentes.filter((i) => !i.urgente && i.tipo === 'produto') },
  ].filter((g) => g.itens.length)
}
