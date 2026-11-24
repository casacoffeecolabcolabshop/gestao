import { useState } from 'react'
import { Sheet } from '../../../components/Sheet.jsx'
import { duracaoMin, fmtHoras, viraODia } from '../horas.js'

// `meuId`: funcionário mandando o próprio turno (sem escolher pessoa; fica "Aguardando", docs/03)
export function TurnoForm({ turno, equipe, meuId = null, onSalvar, onApagar, onFechar }) {
  const [d, setD] = useState({
    profile_id: meuId || turno.profile_id || '',
    data: turno.data,
    inicio: turno.inicio || '07:00',
    fim: turno.fim || '13:00',
    observacao: turno.observacao || '',
  })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const mudar = (campo) => (e) => setD({ ...d, [campo]: e.target.value })
  const pessoas = equipe.filter((p) => p.ativo || p.id === d.profile_id)

  let dica = ''
  if (d.inicio && d.fim) {
    dica = d.inicio === d.fim ? 'Começo e fim não podem ser iguais.' : `${fmtHoras(duracaoMin(d.inicio, d.fim))} de turno${viraODia(d.inicio, d.fim) ? ', termina no dia seguinte' : ''}.`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)
    const msg = await onSalvar(d)
    setSalvando(false)
    if (msg) setErro(msg)
  }

  return (
    <Sheet titulo={meuId ? (turno.id ? 'Ajustar meu turno' : 'Mandar meu turno') : turno.id ? 'Editar turno' : 'Novo turno'} onFechar={onFechar}>
      <form onSubmit={handleSubmit} noValidate>
        {meuId ? (
          <p className="dica turno-aviso">Fica como <b>Aguardando</b> até o gerente aprovar.</p>
        ) : (
          <label className="campo">
            <span>Pessoa</span>
            <select id="turno-pessoa" value={d.profile_id} onChange={mudar('profile_id')}>
              <option value="">Escolha</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="campo">
          <span>Dia</span>
          <input type="date" id="turno-data" value={d.data} onChange={mudar('data')} />
        </label>
        <div className="dupla">
          <label className="campo">
            <span>Começa</span>
            <input type="time" id="turno-inicio" value={d.inicio} onChange={mudar('inicio')} />
          </label>
          <label className="campo">
            <span>Termina</span>
            <input type="time" id="turno-fim" value={d.fim} onChange={mudar('fim')} />
          </label>
        </div>
        {dica && <p className="dica">{dica}</p>}
        <label className="campo">
          <span>
            Observação <em>(opcional)</em>
          </span>
          <input id="turno-obs" value={d.observacao} onChange={mudar('observacao')} maxLength={100} placeholder="Ex.: abre a loja" autoComplete="off" />
        </label>
        {erro && <div className="erro-form">{erro}</div>}
        <div className="acoes">
          {turno.id && (
            <button type="button" className="btn perigo" onClick={onApagar}>
              Apagar
            </button>
          )}
          <button className="btn prim" disabled={salvando}>
            {meuId && !turno.id ? 'Mandar' : 'Salvar'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
