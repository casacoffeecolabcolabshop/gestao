import { useState } from 'react'
import { Sheet } from '../../../components/Sheet.jsx'

export function ItemForm({ item, onSalvar, onApagar, onVarios, onFechar }) {
  const [d, setD] = useState({
    nome: item?.nome || '',
    quantidade: item?.quantidade || '',
    tipo: item?.tipo || 'insumo',
    observacao: item?.observacao || '',
    urgente: item?.urgente || false,
  })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const mudar = (campo) => (e) => setD({ ...d, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)
    const msg = await onSalvar(d)
    setSalvando(false)
    if (msg) setErro(msg)
  }

  return (
    <Sheet titulo={item ? 'Editar item' : 'O que acabou?'} onFechar={onFechar}>
      <form onSubmit={handleSubmit} noValidate>
        <label className="campo">
          <span>Nome</span>
          <input id="item-nome" value={d.nome} onChange={mudar('nome')} maxLength={80} placeholder="Ex.: Leite integral" autoComplete="off" autoFocus={!item} />
        </label>
        <label className="campo">
          <span>
            Quantidade <em>(opcional)</em>
          </span>
          <input id="item-qtd" value={d.quantidade} onChange={mudar('quantidade')} maxLength={40} placeholder="Ex.: 2 caixas" autoComplete="off" />
        </label>
        <div className="campo">
          <span>Tipo</span>
          <div className="seg">
            {[
              ['insumo', 'Insumo'],
              ['produto', 'Produto'],
            ].map(([v, l]) => (
              <label key={v}>
                <input type="radio" name="tipo" value={v} checked={d.tipo === v} onChange={mudar('tipo')} />
                <span>{l}</span>
              </label>
            ))}
          </div>
        </div>
        <p className="dica">Insumo vai no preparo (leite, café, copo). Produto é o que vende pronto.</p>
        <label className="toggle" htmlFor="item-urgente">
          <span>Urgente, faz falta hoje</span>
          <input type="checkbox" id="item-urgente" checked={d.urgente} onChange={mudar('urgente')} />
        </label>
        <label className="campo">
          <span>
            Observação <em>(opcional)</em>
          </span>
          <input id="item-obs" value={d.observacao} onChange={mudar('observacao')} maxLength={200} autoComplete="off" />
        </label>
        {erro && <div className="erro-form">{erro}</div>}
        <div className="acoes">
          {item && (
            <button type="button" className="btn perigo" onClick={onApagar}>
              Apagar
            </button>
          )}
          <button className="btn prim" disabled={salvando}>
            {item ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
        {!item && onVarios && (
          <button type="button" className="link-varios" onClick={onVarios}>
            Vários de uma vez
          </button>
        )}
      </form>
    </Sheet>
  )
}
