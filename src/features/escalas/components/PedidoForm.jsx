import { useState } from 'react'
import { Sheet } from '../../../components/Sheet.jsx'
import { fmtDia, hoje } from '../../../lib/datas.js'
import { EstadoVazio } from '../../../components/Estados.jsx'

export function PedidoForm({ meusTurnos, colegas, onEnviar, onFechar }) {
  const [d, setD] = useState({ tipo: 'folga', data: '', shift_id: '', substituto_id: '', motivo: '' })
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const mudar = (campo) => (e) => setD({ ...d, [campo]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    const msg = await onEnviar(d)
    setEnviando(false)
    if (msg) setErro(msg)
  }

  return (
    <Sheet titulo="Novo pedido" onFechar={onFechar}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="campo">
          <span>O que você precisa?</span>
          <div className="seg">
            {[
              ['folga', 'Folga'],
              ['troca', 'Trocar turno'],
            ].map(([v, l]) => (
              <label key={v}>
                <input type="radio" name="tipo" value={v} checked={d.tipo === v} onChange={mudar('tipo')} />
                <span>{l}</span>
              </label>
            ))}
          </div>
        </div>
        {d.tipo === 'folga' ? (
          <label className="campo">
            <span>Qual dia?</span>
            <input type="date" id="pedido-data" min={hoje()} value={d.data} onChange={mudar('data')} />
          </label>
        ) : meusTurnos.length ? (
          <>
            <label className="campo">
              <span>Qual turno seu?</span>
              <select id="pedido-turno" value={d.shift_id} onChange={mudar('shift_id')}>
                <option value="">Escolha</option>
                {meusTurnos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {fmtDia(t.data)}, {t.inicio} às {t.fim}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span>
                Quem vai cobrir? <em>(opcional)</em>
              </span>
              <select id="pedido-sub" value={d.substituto_id} onChange={mudar('substituto_id')}>
                <option value="">Ainda não sei</option>
                {colegas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <EstadoVazio titulo="Você não tem turnos daqui para frente">Não há o que trocar agora.</EstadoVazio>
        )}
        <label className="campo">
          <span>
            Motivo <em>(opcional)</em>
          </span>
          <input id="pedido-motivo" value={d.motivo} onChange={mudar('motivo')} maxLength={200} autoComplete="off" />
        </label>
        {erro && <div className="erro-form">{erro}</div>}
        <div className="acoes">
          <button className="btn prim" disabled={enviando}>
            Enviar pedido
          </button>
        </div>
      </form>
    </Sheet>
  )
}
