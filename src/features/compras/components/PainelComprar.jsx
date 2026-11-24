import { useState } from 'react'
import { Sheet } from '../../../components/Sheet.jsx'
import { EstadoVazio } from '../../../components/Estados.jsx'
import { IconeCheck } from '../../../components/Icones.jsx'
import { useToast } from '../../../components/Toast.jsx'
import { agruparParaComprar } from '../lista.js'
import { baixarPdfCompras } from '../pdf.js'

// Painel "Para comprar": primeiro ver, depois o PDF se quiser (docs/03, ADR-007).
// Gerente e dono marcam item por item; o que foi marcado aqui fica verde no lugar até fechar.
// `fixo`: no computador o painel fica sempre aberto ao lado da lista, sem janela (docs/02).
export function PainelComprar({ itens, podeMarcar, onComprar, onDesmarcar, onFechar, fixo = false }) {
  const toast = useToast()
  const [gerando, setGerando] = useState(false)
  const [marcadosAqui, setMarcadosAqui] = useState(() => new Set())

  const grupos = agruparParaComprar(itens, marcadosAqui)
  const total = grupos.reduce((n, g) => n + g.itens.length, 0)
  const comprados = grupos.reduce((n, g) => n + g.itens.filter((i) => i.status === 'comprado').length, 0)
  const faltam = total - comprados

  const alternar = (it) => {
    if (it.status === 'comprado') return onDesmarcar(it)
    setMarcadosAqui((s) => new Set(s).add(it.id))
    onComprar(it)
  }

  const baixar = async () => {
    setGerando(true)
    try {
      await baixarPdfCompras(agruparParaComprar(itens))
      toast('PDF baixado')
    } catch {
      toast('Não deu para gerar o PDF. Tente de novo.', { erro: true })
    } finally {
      setGerando(false)
    }
  }

  // no painel fixo, "fechar" é tirar da vista os que já foram comprados
  const limparComprados = () => setMarcadosAqui(new Set())
  const resumo = comprados
    ? `${comprados} de ${total} comprado${comprados > 1 ? 's' : ''}`
    : `${total} ${total === 1 ? 'item' : 'itens'}`

  const conteudo =
    total === 0 ? (
        <EstadoVazio titulo="Nada para comprar">Quando algo acabar, toque em <b>+ Acabou algo</b>.</EstadoVazio>
      ) : (
        <>
          <p className={`painel-total ${comprados ? 'com-progresso' : ''}`}>
            {resumo}
            {fixo && comprados > 0 && faltam > 0 && (
              <button className="link painel-limpar" onClick={limparComprados}>
                Tirar os comprados daqui
              </button>
            )}
          </p>
          {comprados > 0 && (
            <div className="painel-progresso" aria-hidden="true">
              <span style={{ width: `${(comprados / total) * 100}%` }} />
            </div>
          )}
          {podeMarcar && !comprados && <p className="dica painel-dica">Toque no círculo de cada item que já pegou.</p>}
          {grupos.map((g) => (
            <section key={g.titulo} className="painel-grupo">
              <h3 className={g.titulo === 'Urgentes' ? 'urgente' : ''}>
                {g.titulo} <span>({g.itens.length})</span>
              </h3>
              <ul>
                {g.itens.map((it) => {
                  const feito = it.status === 'comprado'
                  return (
                    <li key={it.id} className={feito ? 'feito' : ''}>
                      <div className="texto">
                        <span className="nome">{it.nome}</span>
                        {it.quantidade && <span className="qtd">{it.quantidade}</span>}
                        {it.observacao && <span className="obs">“{it.observacao}”</span>}
                      </div>
                      {podeMarcar && (
                        <button
                          className={`check ${feito ? 'on' : ''}`}
                          onClick={() => alternar(it)}
                          aria-label={feito ? `Desmarcar ${it.nome}` : `Marcar como comprado: ${it.nome}`}
                        >
                          <IconeCheck />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          <div className="acoes painel-acoes">
            {faltam === 0 ? (
              <button className="btn ok" onClick={fixo ? limparComprados : onFechar}>
                Tudo comprado
              </button>
            ) : (
              <button className="btn prim" onClick={baixar} disabled={gerando}>
                {gerando ? 'Gerando...' : comprados ? `Baixar PDF do que falta (${faltam})` : 'Baixar PDF'}
              </button>
            )}
          </div>
        </>
      )

  if (!fixo) {
    return (
      <Sheet titulo="Para comprar" onFechar={onFechar}>
        {conteudo}
      </Sheet>
    )
  }
  return (
    <section className="painel-fixo" aria-label="Para comprar">
      <h2>Para comprar</h2>
      {conteudo}
    </section>
  )
}
