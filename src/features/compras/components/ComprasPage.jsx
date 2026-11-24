import { useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useToast } from '../../../components/Toast.jsx'
import { AcaoPrincipal } from '../../../components/AcaoPrincipal.jsx'
import { Carregando, EstadoErro, EstadoVazio } from '../../../components/Estados.jsx'
import { Etiqueta } from '../../../components/Etiqueta.jsx'
import { IconeCheck } from '../../../components/Icones.jsx'
import { BotaoChat } from '../../chat/index.js'
import { haQuanto } from '../../../lib/datas.js'
import { useComputador } from '../../../lib/useComputador.js'
import { listarItens, adicionarItem, adicionarVarios, editarItem, marcarComoComprado, marcarVariosComoComprados, desfazerCompra, desfazerVarios, apagarItem, recriarItem, assinarItens } from '../services.js'
import { agruparParaComprar } from '../lista.js'
import { baixarPdfCompras } from '../pdf.js'
import { ItemForm } from './ItemForm.jsx'
import { Confirmar } from '../../../components/Confirmar.jsx'
import { ListaForm } from './ListaForm.jsx'
import { PainelComprar } from './PainelComprar.jsx'
import '../compras.css'

// urgentes primeiro, depois os mais antigos (docs/03)
const ordemPendentes = (a, b) => b.urgente - a.urgente || a.created_at.localeCompare(b.created_at)

export function ComprasPage() {
  const { perfil, souGestor } = useAuth()
  const { nomeDe } = useOutletContext()
  const toast = useToast()
  const [itens, setItens] = useState([])
  const [estado, setEstado] = useState('carregando')
  const [form, setForm] = useState(null) // null | {} (novo) | item
  const [verComprados, setVerComprados] = useState(false)
  const [varios, setVarios] = useState(false)
  const [painel, setPainel] = useState(false)
  const [desfazendo, setDesfazendo] = useState(null) // item esperando a confirmação de "Desfazer pedido"
  // Selecionar (docs/03): escolher só o que vai comprar -> PDF desses e, para gerente/dono, dar baixa de uma vez
  const [selecao, setSelecao] = useState(null) // null = fora do modo; Set de ids no modo
  const computador = useComputador() // no computador o painel fica fixo ao lado (docs/02)
  const espera = useRef()

  const carregar = useCallback(async (silencioso) => {
    if (!silencioso) setEstado('carregando')
    const { data, error } = await listarItens()
    if (error) return silencioso ? null : setEstado(error)
    setItens(data)
    setEstado('ok')
  }, [])

  useEffect(() => {
    carregar()
    const parar = assinarItens(() => {
      clearTimeout(espera.current)
      espera.current = setTimeout(() => carregar(true), 300)
    })
    return () => {
      clearTimeout(espera.current)
      parar()
    }
  }, [carregar])

  const podeEditar = (it) => souGestor || (it.criado_por === perfil.id && it.status === 'pendente')

  const salvar = async (d) => {
    const { error } = form.id ? await editarItem(form.id, d) : await adicionarItem(d)
    if (error) return error
    setForm(null)
    toast(form.id ? 'Salvo' : 'Adicionado')
    carregar(true)
  }

  const salvarVarios = async (lista, opcoes) => {
    const { data, error } = await adicionarVarios(lista, opcoes)
    if (error) {
      carregar(true)
      return error
    }
    setVarios(false)
    const { adicionados: a, jaEstavam: j } = data
    const partes = [a && `${a} adicionado${a > 1 ? 's' : ''}`, j && `${j} já estava${j > 1 ? 'm' : ''} na lista`].filter(Boolean)
    toast(partes.join(' · '))
    carregar(true)
  }

  const apagar = async () => {
    const it = form
    const { error } = await apagarItem(it.id)
    if (error) return toast(error, { erro: true })
    setForm(null)
    carregar(true)
    toast(`${it.nome} apagado`, {
      desfazer: async () => {
        const r = await recriarItem(it)
        if (r.error) toast(r.error, { erro: true })
        carregar(true)
      },
    })
  }

  // Desfazer pedido (docs/03): só depois da confirmação
  const desfazerPedido = async () => {
    const it = desfazendo
    const { error } = await apagarItem(it.id)
    setDesfazendo(null)
    if (error) return toast(error, { erro: true })
    toast(`Pedido de ${it.nome} desfeito`)
    carregar(true)
  }

  const comprar = async (it) => {
    setItens((l) => l.map((x) => (x.id === it.id ? { ...x, status: 'comprado', comprado_por: perfil.id, comprado_em: new Date().toISOString() } : x)))
    const { error } = await marcarComoComprado(it.id, perfil.id)
    if (error) {
      carregar(true)
      return toast(error, { erro: true })
    }
    toast(`${it.nome}: comprado`, {
      desfazer: async () => {
        const r = await desfazerCompra(it.id)
        if (r.error) toast(r.error, { erro: true })
        carregar(true)
      },
    })
  }

  const desmarcar = async (it) => {
    const { error } = await desfazerCompra(it.id)
    if (error) return toast(error, { erro: true })
    toast('Voltou para a lista')
    carregar(true)
  }

  const pendentes = itens.filter((i) => i.status === 'pendente').sort(ordemPendentes)
  const comprados = itens.filter((i) => i.status === 'comprado').sort((a, b) => b.comprado_em.localeCompare(a.comprado_em))
  const urgentes = pendentes.filter((i) => i.urgente).length

  const alternarSel = (id) =>
    setSelecao((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const darBaixa = async () => {
    const ids = [...selecao].filter((id) => pendentes.some((p) => p.id === id))
    const { data, error } = await marcarVariosComoComprados(ids, perfil.id)
    if (error) return toast(error, { erro: true })
    setSelecao(null)
    carregar(true)
    toast(`${data.length} ${data.length === 1 ? 'item comprado' : 'itens comprados'}`, {
      desfazer: async () => {
        const r = await desfazerVarios(data)
        if (r.error) toast(r.error, { erro: true })
        carregar(true)
      },
    })
  }
  const pdfDaSelecao = async () => {
    try {
      await baixarPdfCompras(agruparParaComprar(pendentes.filter((p) => selecao.has(p.id))))
      toast('PDF baixado')
    } catch {
      toast('Não deu para gerar o PDF. Tente de novo.', { erro: true })
    }
  }

  // card no modo Selecionar: o item inteiro marca/desmarca (função, não componente: não remonta a cada toque)
  const cardSel = (it) => {
    const marcado = selecao.has(it.id)
    const meta = [it.quantidade, it.tipo === 'produto' ? 'Produto' : 'Insumo'].filter(Boolean).join(' · ')
    return (
      <label key={it.id} className={`card sel ${marcado ? 'marcado' : ''} ${it.urgente ? 'urgente' : ''}`}>
        <input type="checkbox" checked={marcado} onChange={() => alternarSel(it.id)} aria-label={`Selecionar ${it.nome}`} />
        <span className="corpo">
          <span className="linha">
            <span className="titulo">{it.nome}</span>
            {it.urgente && <Etiqueta cor="alerta">Urgente</Etiqueta>}
          </span>
          {meta && <span className="meta">{meta}</span>}
          {it.observacao && <span className="meta">“{it.observacao}”</span>}
        </span>
      </label>
    )
  }

  const Card = ({ it }) => {
    const feito = it.status === 'comprado'
    const meta = [it.quantidade, it.tipo === 'produto' ? 'Produto' : 'Insumo'].filter(Boolean).join(' · ')
    const quem = feito
      ? `Comprado por ${nomeDe(it.comprado_por)}, ${haQuanto(it.comprado_em)}`
      : `Pedido por ${it.criado_por === perfil.id ? 'você' : nomeDe(it.criado_por)}, ${haQuanto(it.created_at)}`
    const corpo = (
      <>
        <span className="linha">
          <span className="titulo">{it.nome}</span>
          {it.urgente && !feito && <Etiqueta cor="alerta">Urgente</Etiqueta>}
          {feito && <Etiqueta cor="ok">Comprado</Etiqueta>}
        </span>
        {meta && <span className="meta">{meta}</span>}
        {it.observacao && <span className="meta">“{it.observacao}”</span>}
        <span className="meta">{quem}</span>
      </>
    )
    return (
      <div className={`card ${it.urgente && !feito ? 'urgente' : ''} ${feito ? 'feito' : ''}`}>
        <div className="card-principal">
          {!feito && podeEditar(it) ? (
            <button className="corpo" onClick={() => setForm(it)} aria-label={`Editar ${it.nome}`}>
              {corpo}
            </button>
          ) : (
            <div className="corpo">{corpo}</div>
          )}
          {!feito && it.criado_por === perfil.id && (
            <button className="link desfazer-pedido" onClick={() => setDesfazendo(it)}>
              Desfazer pedido
            </button>
          )}
        </div>
        {souGestor && (
          <button
            className={`check ${feito ? 'on' : ''}`}
            onClick={() => (feito ? desmarcar(it) : comprar(it))}
            aria-label={feito ? `Desmarcar ${it.nome}` : `Marcar como comprado: ${it.nome}`}
          >
            <IconeCheck />
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="topo">
        <div>
          <h1>Compras</h1>
          {estado === 'ok' && (
            <p>{pendentes.length ? `${pendentes.length} para comprar${urgentes ? ` · ${urgentes} urgente${urgentes > 1 ? 's' : ''}` : ''}` : 'Nada pendente'}</p>
          )}
        </div>
        <div className="acoes-topo">
          {estado === 'ok' && pendentes.length > 0 && !selecao && (
            <button className="btn peq" onClick={() => setSelecao(new Set())}>
              Selecionar
            </button>
          )}
          {estado === 'ok' && !computador && !selecao && (
            <button className="btn peq btn-para-comprar" onClick={() => setPainel(true)}>
              Para comprar
            </button>
          )}
          <BotaoChat sala="compras" />
        </div>
      </div>

      {estado === 'carregando' && <Carregando />}
      {estado !== 'carregando' && estado !== 'ok' && <EstadoErro mensagem={estado} onTentar={() => carregar()} />}
      {estado === 'ok' && (
        <div className="compras-grade">
          <div className="compras-lista">
          {selecao && (
            <div className="sel-barra">
              <span>
                <b>{selecao.size}</b> de {pendentes.length} {selecao.size === 1 ? 'selecionado' : 'selecionados'}
              </span>
              <button className="link" onClick={() => setSelecao(selecao.size === pendentes.length ? new Set() : new Set(pendentes.map((p) => p.id)))}>
                {selecao.size === pendentes.length ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
              <button className="btn peq" onClick={pdfDaSelecao} disabled={!selecao.size}>
                PDF
              </button>
              <button className="btn peq" onClick={() => setSelecao(null)}>
                Cancelar
              </button>
            </div>
          )}
          {selecao && !souGestor && <p className="dica sel-dica">Escolha o que você vai comprar e baixe o PDF. Quem dá baixa é o gerente.</p>}
          {pendentes.length ? (
            <div className="lista">{pendentes.map((it) => (selecao ? cardSel(it) : <Card key={it.id} it={it} />))}</div>
          ) : (
            <EstadoVazio titulo="Tudo comprado">
              Acabou alguma coisa? Toque em <b>+ Acabou algo</b>.
            </EstadoVazio>
          )}
          {comprados.length > 0 && !selecao && (
            <>
              <div className="secao">
                <span>Comprados nos últimos 7 dias ({comprados.length})</span>
                <button onClick={() => setVerComprados(!verComprados)}>{verComprados ? 'Esconder' : 'Mostrar'}</button>
              </div>
              {verComprados && <div className="lista">{comprados.map((it) => <Card key={it.id} it={it} />)}</div>}
            </>
          )}
          </div>
          {computador && (
            <aside className="compras-lado">
              <PainelComprar itens={itens} podeMarcar={souGestor} onComprar={comprar} onDesmarcar={desmarcar} fixo />
            </aside>
          )}
        </div>
      )}

      {selecao ? (
        souGestor ? (
          <AcaoPrincipal onClick={darBaixa} desligado={!selecao.size}>
            {selecao.size ? `Marcar ${selecao.size} como ${selecao.size === 1 ? 'comprado' : 'comprados'}` : 'Marque o que foi comprado'}
          </AcaoPrincipal>
        ) : (
          <AcaoPrincipal onClick={pdfDaSelecao} desligado={!selecao.size}>
            {selecao.size ? `Baixar PDF dos ${selecao.size}` : 'Marque o que vai comprar'}
          </AcaoPrincipal>
        )
      ) : (
        <AcaoPrincipal onClick={() => setForm({})}>+ Acabou algo</AcaoPrincipal>
      )}
      {form && (
        <ItemForm
          item={form.id ? form : null}
          onSalvar={salvar}
          onApagar={apagar}
          onVarios={() => {
            setForm(null)
            setVarios(true)
          }}
          onFechar={() => setForm(null)}
        />
      )}
      {varios && (
        <ListaForm
          onSalvar={salvarVarios}
          onUmItem={() => {
            setVarios(false)
            setForm({})
          }}
          onFechar={() => setVarios(false)}
        />
      )}
      {desfazendo && (
        <Confirmar
          titulo={`Desfazer o pedido de ${desfazendo.nome}?`}
          texto="Ele sai da lista de compras."
          acao="Desfazer pedido"
          onConfirmar={desfazerPedido}
          onVoltar={() => setDesfazendo(null)}
        />
      )}
      {painel && !computador && (
        <PainelComprar itens={itens} podeMarcar={souGestor} onComprar={comprar} onDesmarcar={desmarcar} onFechar={() => setPainel(false)} />
      )}
    </>
  )
}
