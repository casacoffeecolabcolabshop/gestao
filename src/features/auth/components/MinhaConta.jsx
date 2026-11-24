import { useState } from 'react'
import { Sheet } from '../../../components/Sheet.jsx'
import { useToast } from '../../../components/Toast.jsx'
import { useAuth } from '../AuthContext.jsx'
import { sair } from '../services.js'
import { editarMeuContato } from '../../equipe/services.js'

const PAPEL = { dono: 'Dono', gerente: 'Gerente', funcionario: 'Funcionário' }

export function MinhaConta({ onFechar, onSalvo }) {
  const { perfil, sessao, recarregarPerfil } = useAuth()
  const toast = useToast()
  const [nome, setNome] = useState(perfil.nome)
  const [telefone, setTelefone] = useState(perfil.telefone || '')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const salvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    const { error } = await editarMeuContato(perfil.id, { nome, telefone })
    setSalvando(false)
    if (error) return setErro(error)
    await recarregarPerfil()
    onSalvo()
    onFechar()
    toast('Salvo')
  }

  const handleSair = async () => {
    const { error } = await sair()
    if (error) toast(error, { erro: true })
  }

  return (
    <Sheet titulo="Minha conta" onFechar={onFechar}>
      <form onSubmit={salvar} noValidate>
        <p className="dica" style={{ margin: 0 }}>
          {sessao.user.email} · {PAPEL[perfil.papel]}
        </p>
        <label className="campo">
          <span>Seu nome</span>
          <input id="conta-nome" value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
        </label>
        <label className="campo">
          <span>
            Telefone <em>(opcional)</em>
          </span>
          <input id="conta-tel" value={telefone} maxLength={20} onChange={(e) => setTelefone(e.target.value)} inputMode="tel" autoComplete="tel" />
        </label>
        {erro && <div className="erro-form">{erro}</div>}
        <div className="acoes">
          <button type="button" className="btn" onClick={handleSair}>
            Sair
          </button>
          <button className="btn prim" disabled={salvando}>
            Salvar
          </button>
        </div>
      </form>
    </Sheet>
  )
}
