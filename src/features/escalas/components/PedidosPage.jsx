import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useToast } from '../../../components/Toast.jsx'
import { AcaoPrincipal } from '../../../components/AcaoPrincipal.jsx'
import { Carregando, EstadoErro, EstadoVazio } from '../../../components/Estados.jsx'
import { Etiqueta } from '../../../components/Etiqueta.jsx'
import { fmtDia, haQuanto, hoje, somarDias } from '../../../lib/datas.js'
import { listarPedidos, listarTurnos, pedirFolga, pedirTroca, cancelarPedido, decidirPedido } from '../services.js'
import { PedidoForm } from './PedidoForm.jsx'

const STATUS = {
  pendente: ['pend', 'Aguardando'],
  aprovado: ['ok', 'Aprovado'],
  recusado: ['alerta', 'Recusado'],
  cancelado: ['neutro', 'Cancelado'],
}
const descricao = (p) =>
  p.tipo === 'folga' ? `Folga em ${fmtDia(p.data)}` : `Troca do turno ${p.turno ? `${fmtDia(p.turno.data)}, ${p.turno.inicio} às ${p.turno.fim}` : '(turno removido)'}`

export function PedidosPage() {
  const { perfil, souGestor } = useAuth()
  const { equipe, nomeDe, recarregarPendentes } = useOutletContext()
  const toast = useToast()
  const [pedidos, setPedidos] = useState([])
  const [estado, setEstado] = useState('carregando')
  const [aba, setAba] = useState(souGestor ? 'pendentes' : 'meus')
  const [form, setForm] = useState(null) // null | { meusTurnos }
  const [decidindo, setDecidindo] = useState(null)

  const carregar = useCallback(
    async (silencioso) => {
      if (!silencioso) setEstado('carregando')
      const { data, error } = await listarPedidos()
      if (error) return silencioso ? toast(error, { erro: true }) : setEstado(error)
      setPedidos(data)
      setEstado('ok')
      recarregarPendentes()
    },
    [toast, recarregarPendentes],
  )
  useEffect(() => {
    carregar()
  }, [carregar])

  const abrirForm = async () => {
    const { data, error } = await listarTurnos(hoje(), somarDias(hoje(), 60))
    if (error) return toast(error, { erro: true })
    setForm({ meusTurnos: data.filter((t) => t.profile_id === perfil.id) })
  }

  const enviar = async (d) => {
    const { error } = d.tipo === 'folga' ? await pedirFolga(d, hoje()) : await pedirTroca(d)
    if (error) return error
    setForm(null)
    setAba('meus')
    toast('Pedido enviado')
    carregar(true)
  }

  const cancelar = async (p) => {
    const { error } = await cancelarPedido(p.id)
    if (error) return toast(error, { erro: true })
    toast('Pedido cancelado')
    carregar(true)
  }

  const decidir = async (p, aprovado) => {
    setDecidindo(p.id)
    const { error } = await decidirPedido(p.id, aprovado)
    setDecidindo(null)
    if (error) return toast(error, { erro: true })
    let efeito = ''
    if (aprovado && p.tipo === 'troca' && p.substituto_id) efeito = ` O turno passou para ${nomeDe(p.substituto_id)}.`
    if (aprovado && p.tipo === 'folga') efeito = ' Os turnos desse dia saíram da escala.'
    toast((aprovado ? 'Aprovado.' : 'Recusado.') + efeito)
    carregar(true)
  }

  const pendentes = pedidos.filter((p) => p.status === 'pendente').sort((a, b) => a.created_at.localeCompare(b.created_at))
  const decididos = pedidos.filter((p) => p.status !== 'pendente' && p.status !== 'cancelado').slice(0, 10)
  const meus = pedidos.filter((p) => p.solicitante_id === perfil.id)

  const Card = ({ p, decidir: podeDecidir }) => {
    const [cor, rotulo] = STATUS[p.status]
    const meu = p.solicitante_id === perfil.id
    return (
      <div className="card pedido">
        <div className="linha entre">
          <span className="titulo">{descricao(p)}</span>
          <Etiqueta cor={cor}>{rotulo}</Etiqueta>
        </div>
        <span className="meta">
          {meu ? 'Pedido seu' : `Pedido de ${nomeDe(p.solicitante_id)}`}, {haQuanto(p.created_at)}
        </span>
        {p.tipo === 'troca' && <span className="meta">{p.substituto_id ? `Quem cobre: ${nomeDe(p.substituto_id)}` : 'Sem substituto indicado'}</span>}
        {p.motivo && <span className="meta">“{p.motivo}”</span>}
        {p.decidido_por && (
          <span className="meta">
            {rotulo} por {nomeDe(p.decidido_por)}
          </span>
        )}
        {p.status === 'pendente' && podeDecidir && (
          <div className="acoes">
            <button className="btn perigo" disabled={decidindo === p.id} onClick={() => decidir(p, false)}>
              Recusar
            </button>
            <button className="btn ok" disabled={decidindo === p.id} onClick={() => decidir(p, true)}>
              Aprovar
            </button>
          </div>
        )}
        {p.status === 'pendente' && !podeDecidir && meu && (
          <div className="acoes">
            <button className="btn peq" onClick={() => cancelar(p)}>
              Cancelar pedido
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="topo">
        <div>
          <h1>Pedidos</h1>
          <p>Troca de turno e folga</p>
        </div>
      </div>

      {souGestor && (
        <div className="abas" role="tablist">
          <button role="tab" aria-selected={aba === 'pendentes'} onClick={() => setAba('pendentes')}>
            Para decidir ({pendentes.length})
          </button>
          <button role="tab" aria-selected={aba === 'meus'} onClick={() => setAba('meus')}>
            Meus pedidos
          </button>
        </div>
      )}

      {estado === 'carregando' && <Carregando />}
      {estado !== 'carregando' && estado !== 'ok' && <EstadoErro mensagem={estado} onTentar={() => carregar()} />}
      {estado === 'ok' && aba === 'pendentes' && (
        <>
          {pendentes.length ? (
            <div className="lista">{pendentes.map((p) => <Card key={p.id} p={p} decidir />)}</div>
          ) : (
            <EstadoVazio titulo="Nada para decidir">Pedidos novos da equipe aparecem aqui.</EstadoVazio>
          )}
          {decididos.length > 0 && (
            <>
              <div className="secao">
                <span>Decididos recentemente</span>
              </div>
              <div className="lista">{decididos.map((p) => <Card key={p.id} p={p} />)}</div>
            </>
          )}
        </>
      )}
      {estado === 'ok' && aba === 'meus' &&
        (meus.length ? (
          <div className="lista">{meus.map((p) => <Card key={p.id} p={p} />)}</div>
        ) : (
          <EstadoVazio titulo="Você não fez nenhum pedido">
            Precisa de folga ou de trocar um turno? Toque em <b>+ Novo pedido</b>.
          </EstadoVazio>
        ))}

      <AcaoPrincipal onClick={abrirForm}>+ Novo pedido</AcaoPrincipal>
      {form && (
        <PedidoForm
          meusTurnos={form.meusTurnos}
          colegas={equipe.filter((p) => p.ativo && p.id !== perfil.id)}
          onEnviar={enviar}
          onFechar={() => setForm(null)}
        />
      )}
    </>
  )
}
