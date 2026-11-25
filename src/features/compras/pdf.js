import { DIAS_LONGOS, MESES_LONGOS, pad } from '../../lib/datas.js'

// PDF da lista de compras, montado no aparelho (ADR-007). jsPDF só carrega ao tocar no botão.
// Visual: cabeçalho fino, uma coluna de item (observação embaixo) e quantidade à direita, sem listras.
// Cores iguais às de src/styles/tokens.css.
const COR = {
  marca: [58, 40, 29],
  texto: [30, 25, 21],
  suave: [107, 97, 88],
  claro: [150, 141, 132],
  linha: [226, 219, 211],
  alerta: [191, 51, 40],
}

const MARGEM = 16
const RODAPE = 14
const CAIXA = 4.6 // quadradinho para riscar
const L_NOME = 5 // altura por linha do nome (11pt)
const L_OBS = 4.2 // altura por linha da observação (9pt)
const RESPIRO = 3.6 // em cima e embaixo de cada item

export async function baixarPdfCompras(grupos, agora = new Date()) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const larguraPagina = doc.internal.pageSize.getWidth()
  const alturaPagina = doc.internal.pageSize.getHeight()
  const largura = larguraPagina - MARGEM * 2
  const fim = alturaPagina - MARGEM - RODAPE
  const direita = MARGEM + largura

  // colunas: quadradinho | item (+ observação) | quantidade (à direita)
  const xItem = MARGEM + CAIXA + 4
  const larguraQtd = 34
  const larguraItem = largura - (CAIXA + 4) - larguraQtd - 4

  const data = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()}`
  const dataLonga = `${DIAS_LONGOS[agora.getDay()]}, ${agora.getDate()} de ${MESES_LONGOS[agora.getMonth()]} de ${agora.getFullYear()}`
  const hora = `${pad(agora.getHours())}:${pad(agora.getMinutes())}`
  const total = grupos.reduce((n, g) => n + g.itens.length, 0)
  const urgentes = grupos.find((g) => g.titulo === 'Urgentes')?.itens.length || 0

  const fonte = (estilo, tamanho, cor = COR.texto) => doc.setFont('helvetica', estilo).setFontSize(tamanho).setTextColor(...cor)
  const traco = (y, cor = COR.linha, esp = 0.2) => doc.setDrawColor(...cor).setLineWidth(esp).line(MARGEM, y, direita, y)

  let y = MARGEM

  // ---------- cabeçalho ----------
  const cabecalho = (primeira) => {
    y = MARGEM
    if (primeira) {
      fonte('bold', 9, COR.suave).text('CASA COFFEE COLAB', MARGEM, y + 3)
      fonte('bold', 22, COR.marca).text('Lista de compras', MARGEM, y + 13)
      fonte('normal', 10, COR.suave).text(`${dataLonga} · ${hora}`, MARGEM, y + 20)
      // resumo à direita
      fonte('bold', 22, COR.texto).text(String(total), direita, y + 13, { align: 'right' })
      const rotulo = total === 1 ? 'item' : 'itens'
      fonte('normal', 10, COR.suave).text(urgentes ? `${rotulo} · ` : rotulo, direita - (urgentes ? doc.setFont('helvetica', 'bold').getTextWidth(`${urgentes} urgente${urgentes > 1 ? 's' : ''}`) : 0), y + 20, { align: 'right' })
      if (urgentes) fonte('bold', 10, COR.alerta).text(`${urgentes} urgente${urgentes > 1 ? 's' : ''}`, direita, y + 20, { align: 'right' })
      y += 25
      traco(y, COR.marca, 0.6)
      y += 8
      return
    }
    fonte('bold', 10, COR.marca).text('Lista de compras', MARGEM, y + 4)
    fonte('normal', 9, COR.suave).text(data, direita, y + 4, { align: 'right' })
    y += 7
    traco(y)
    y += 7
  }

  const novaPagina = () => {
    doc.addPage()
    cabecalho(false)
  }

  // ---------- grupos e itens ----------
  const tituloGrupo = (g, continua) => {
    const urgente = g.titulo === 'Urgentes'
    const cor = urgente ? COR.alerta : COR.marca
    doc.setFillColor(...cor).circle(MARGEM + 1.4, y - 1.3, 1.4, 'F')
    fonte('bold', 11, cor).text(`${g.titulo}${continua ? ' (continuação)' : ''}`, MARGEM + 5, y)
    fonte('normal', 10, COR.claro).text(`${g.itens.length}`, MARGEM + 5 + doc.setFont('helvetica', 'bold').setFontSize(11).getTextWidth(`${g.titulo}${continua ? ' (continuação)' : ''}`) + 2.5, y)
    fonte('bold', 7.5, COR.claro).text('QUANTIDADE', direita, y, { align: 'right' })
    y += 3
    traco(y, COR.linha, 0.3)
  }

  const medirItem = (it) => {
    const nome = fonte('bold', 11).splitTextToSize(it.nome, larguraItem)
    const obs = it.observacao ? fonte('italic', 9).splitTextToSize(it.observacao, larguraItem) : []
    const qtd = it.quantidade ? fonte('normal', 10.5).splitTextToSize(it.quantidade, larguraQtd) : []
    const conteudo = Math.max(nome.length * L_NOME + obs.length * L_OBS, qtd.length * L_NOME, CAIXA)
    return { nome, obs, qtd, altura: conteudo + RESPIRO * 2 }
  }

  const desenharItem = (it, m, urgente) => {
    const topo = y
    const meio = topo + m.altura / 2
    if (urgente) doc.setFillColor(...COR.alerta).rect(MARGEM - 3, topo + 2.5, 0.9, m.altura - 5, 'F')
    // quadradinho centralizado na altura do item
    doc.setDrawColor(...COR.suave).setLineWidth(0.35).roundedRect(MARGEM, meio - CAIXA / 2, CAIXA, CAIXA, 0.8, 0.8, 'S')
    // texto: bloco (nome + observação) centralizado na vertical
    const blocoTexto = m.nome.length * L_NOME + m.obs.length * L_OBS
    let linha = meio - blocoTexto / 2 + L_NOME * 0.75
    fonte('bold', 11).text(m.nome, xItem, linha)
    linha += m.nome.length * L_NOME
    if (m.obs.length) fonte('italic', 9, COR.suave).text(m.obs, xItem, linha - 0.6)
    if (m.qtd.length) fonte('normal', 10.5).text(m.qtd, direita, meio - (m.qtd.length * L_NOME) / 2 + L_NOME * 0.75, { align: 'right' })
    y = topo + m.altura
    traco(y)
  }

  cabecalho(true)

  for (const g of grupos) {
    const urgente = g.titulo === 'Urgentes'
    const primeiro = medirItem(g.itens[0])
    if (y + 8 + primeiro.altura > fim) novaPagina()
    y += 4
    tituloGrupo(g, false)
    for (const it of g.itens) {
      const m = medirItem(it)
      if (y + m.altura > fim) {
        novaPagina()
        y += 4
        tituloGrupo(g, true)
      }
      desenharItem(it, m, urgente)
    }
    y += 6
  }

  // ---------- espaço para anotar à mão ----------
  const linhasLivres = 4
  if (y + 10 + linhasLivres * 9 <= fim) {
    y += 2
    fonte('bold', 7.5, COR.claro).text('OUTROS ITENS', MARGEM, y)
    y += 2
    for (let i = 0; i < linhasLivres; i++) {
      y += 9
      doc.setDrawColor(...COR.claro).setLineWidth(0.3).roundedRect(MARGEM, y - CAIXA - 1, CAIXA, CAIXA, 0.8, 0.8, 'S')
      doc.setDrawColor(...COR.linha).setLineWidth(0.2).line(xItem, y, direita, y)
    }
  }

  // ---------- rodapé em todas as páginas ----------
  const paginas = doc.getNumberOfPages()
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p)
    const yr = alturaPagina - MARGEM + 4
    fonte('normal', 8, COR.claro).text(`Casa Gestão · gerada em ${data} às ${hora}`, MARGEM, yr)
    doc.text(`${p} de ${paginas}`, direita, yr, { align: 'right' })
  }

  doc.save(`compras-${data.replaceAll('/', '-')}.pdf`)
}
