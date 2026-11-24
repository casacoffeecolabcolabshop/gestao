import { pad } from '../../lib/datas.js'

// PDF do painel "Para comprar", montado no aparelho (ADR-007). jsPDF só carrega ao tocar no botão.
// Cores iguais às de src/styles/tokens.css (marca, linha, alerta).
const COR = {
  marca: [58, 40, 29],
  marcaSuave: [241, 230, 218],
  texto: [30, 25, 21],
  suave: [107, 97, 88],
  linha: [226, 219, 211],
  zebra: [250, 248, 246],
  grupo: [239, 234, 228],
  alerta: [191, 51, 40],
  alertaFundo: [251, 227, 224],
  branco: [255, 255, 255],
}

const MARGEM = 14
const CABECALHO = 30
const RODAPE = 12
const PAD_X = 3 // respiro dentro da célula
const ALTURA_LINHA = 4.6 // por linha de texto 10pt

export async function baixarPdfCompras(grupos, agora = new Date()) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const larguraPagina = doc.internal.pageSize.getWidth()
  const alturaPagina = doc.internal.pageSize.getHeight()
  const largura = larguraPagina - MARGEM * 2
  const fim = alturaPagina - MARGEM - RODAPE

  // colunas: quadradinho | Item | Quantidade | Observação
  const col = [
    { x: MARGEM, w: 11 },
    { x: MARGEM + 11, w: 72 },
    { x: MARGEM + 83, w: 38 },
    { x: MARGEM + 121, w: largura - 121 },
  ]

  const data = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()}`
  const hora = `${pad(agora.getHours())}:${pad(agora.getMinutes())}`
  const total = grupos.reduce((n, g) => n + g.itens.length, 0)
  const urgentes = grupos.find((g) => g.titulo === 'Urgentes')?.itens.length || 0

  const fonte = (estilo, tamanho, cor = COR.texto) => doc.setFont('helvetica', estilo).setFontSize(tamanho).setTextColor(...cor)
  const caixa = (x, y, w, h, cor) => doc.setFillColor(...cor).rect(x, y, w, h, 'F')

  // ---------- cabeçalho (primeira página grande, demais compactas) ----------
  const cabecalho = (primeira) => {
    if (primeira) {
      caixa(0, 0, larguraPagina, CABECALHO, COR.marca)
      fonte('bold', 20, COR.branco).text('Lista de compras', MARGEM, 15)
      fonte('normal', 10, COR.marcaSuave).text('Casa Coffee Colab', MARGEM, 22)
      fonte('bold', 12, COR.branco).text(data, larguraPagina - MARGEM, 15, { align: 'right' })
      fonte('normal', 10, COR.marcaSuave).text(`gerada às ${hora}`, larguraPagina - MARGEM, 22, { align: 'right' })
      return CABECALHO + 8
    }
    caixa(0, 0, larguraPagina, 12, COR.marca)
    fonte('bold', 10, COR.branco).text('Lista de compras', MARGEM, 7.8)
    fonte('normal', 10, COR.marcaSuave).text(data, larguraPagina - MARGEM, 7.8, { align: 'right' })
    return 12 + 8
  }

  let y = cabecalho(true)

  // resumo
  const resumo = [`${total} ${total === 1 ? 'item' : 'itens'}`, urgentes && `${urgentes} urgente${urgentes > 1 ? 's' : ''}`].filter(Boolean)
  fonte('bold', 12).text(resumo[0], MARGEM, y)
  if (resumo[1]) {
    const x = MARGEM + doc.getTextWidth(resumo[0]) + 4
    fonte('bold', 12, COR.alerta).text(`· ${resumo[1]}`, x, y)
  }
  y += 8

  const novaPagina = () => {
    doc.addPage()
    y = cabecalho(false)
  }
  const garantir = (altura) => {
    if (y + altura > fim) {
      novaPagina()
      return true
    }
    return false
  }

  const cabecalhoTabela = (g) => {
    const urgente = g.titulo === 'Urgentes'
    caixa(MARGEM, y, largura, 9, urgente ? COR.alertaFundo : COR.grupo)
    caixa(MARGEM, y, 1.6, 9, urgente ? COR.alerta : COR.marca)
    fonte('bold', 11, urgente ? COR.alerta : COR.marca).text(`${g.titulo.toUpperCase()}  (${g.itens.length})`, MARGEM + 5, y + 6)
    y += 9
    fonte('bold', 8, COR.suave)
    doc.text('ITEM', col[1].x + PAD_X, y + 5)
    doc.text('QUANTIDADE', col[2].x + PAD_X, y + 5)
    doc.text('OBSERVAÇÃO', col[3].x + PAD_X, y + 5)
    y += 7
    doc.setDrawColor(...COR.linha).setLineWidth(0.3).line(MARGEM, y, MARGEM + largura, y)
  }

  const quadradinho = (yLinha) => {
    doc.setDrawColor(...COR.suave).setLineWidth(0.35).roundedRect(col[0].x + 3.2, yLinha - 3.4, 4.2, 4.2, 0.6, 0.6, 'S')
  }

  for (const g of grupos) {
    garantir(9 + 7 + 10 + 4)
    cabecalhoTabela(g)

    g.itens.forEach((it, i) => {
      const nome = fonte('bold', 10.5).splitTextToSize(it.nome, col[1].w - PAD_X * 2)
      const qtd = fonte('normal', 10).splitTextToSize(it.quantidade || '', col[2].w - PAD_X * 2)
      const obs = fonte('italic', 9.5).splitTextToSize(it.observacao || '', col[3].w - PAD_X * 2)
      const linhas = Math.max(nome.length, qtd.length, obs.length, 1)
      const altura = linhas * ALTURA_LINHA + 5

      if (garantir(altura)) cabecalhoTabela({ ...g, titulo: `${g.titulo} (continuação)` })

      if (i % 2 === 1) caixa(MARGEM, y, largura, altura, COR.zebra)
      const base = y + 6.2
      quadradinho(base)
      fonte('bold', 10.5).text(nome, col[1].x + PAD_X, base)
      fonte('normal', 10).text(qtd.length && qtd[0] ? qtd : ['-'], col[2].x + PAD_X, base)
      if (obs[0]) fonte('italic', 9.5, COR.suave).text(obs, col[3].x + PAD_X, base)
      y += altura
      doc.setDrawColor(...COR.linha).setLineWidth(0.2).line(MARGEM, y, MARGEM + largura, y)
    })
    y += 7
  }

  // espaço para anotar à mão
  const linhasLivres = 4
  if (y + 9 + linhasLivres * 9 <= fim) {
    fonte('bold', 9, COR.suave).text('ANOTAÇÕES', MARGEM, y + 4)
    y += 7
    for (let i = 0; i < linhasLivres; i++) {
      y += 9
      quadradinho(y - 2)
      doc.setDrawColor(...COR.linha).setLineWidth(0.2).line(col[1].x + PAD_X, y, MARGEM + largura, y)
    }
  }

  // rodapé com página em todas as folhas
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    const yr = alturaPagina - MARGEM + 2
    doc.setDrawColor(...COR.linha).setLineWidth(0.2).line(MARGEM, yr - 5, MARGEM + largura, yr - 5)
    fonte('normal', 8, COR.suave).text('Casa Gestão', MARGEM, yr)
    doc.text(`Página ${p} de ${paginas}`, MARGEM + largura, yr, { align: 'right' })
  }

  doc.save(`compras-${data.replaceAll('/', '-')}.pdf`)
}
