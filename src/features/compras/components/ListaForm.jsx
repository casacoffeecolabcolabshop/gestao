import { useState } from 'react'
import { Sheet } from '../../../components/Sheet.jsx'
import { lerLista, MAX_ITENS_POR_VEZ } from '../lista.js'

// Vários de uma vez: um item por linha (docs/03).
export function ListaForm({ onSalvar, onUmItem, onFechar }) {
  const [texto, setTexto] = useState('')
  const [tipo, setTipo] = useState('insumo')
  const [urgente, setUrgente] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const itens = lerLista(texto)
  const demais = itens.length > MAX_ITENS_POR_VEZ

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)
    const msg = await onSalvar(itens, { tipo, urgente })
    setSalvando(false)
    if (msg) setErro(msg)
  }

  return (
    <Sheet titulo="Vários de uma vez" onFechar={onFechar}>
      <form onSubmit={handleSubmit} noValidate>
        <label className="campo">
          <span>Um item por linha</span>
          <textarea
            id="lista-texto"
            className="lista-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={'Leite integral - 2 caixas\nCafé em grão - 1 kg\nCopo 300ml'}
            autoFocus
          />
        </label>
        <p className="dica">Pode colar do WhatsApp. Quantidade depois do hífen, se quiser.</p>
        <div className="campo">
          <span>Tipo de todos</span>
          <div className="seg">
            {[
              ['insumo', 'Insumo'],
              ['produto', 'Produto'],
            ].map(([v, l]) => (
              <label key={v}>
                <input type="radio" name="tipo-lista" value={v} checked={tipo === v} onChange={() => setTipo(v)} />
                <span>{l}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="toggle" htmlFor="lista-urgente">
          <span>Todos urgentes</span>
          <input type="checkbox" id="lista-urgente" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} />
        </label>
        {erro && <div className="erro-form">{erro}</div>}
        {demais && <div className="erro-form">Máximo {MAX_ITENS_POR_VEZ} itens por vez</div>}
        <div className="acoes">
          <button type="button" className="btn" onClick={onUmItem}>
            Só um item
          </button>
          <button className="btn prim" disabled={salvando || !itens.length || demais}>
            {itens.length ? `Adicionar ${itens.length}` : 'Adicionar'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
