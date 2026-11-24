import { useState } from 'react'
import { useAuth } from '../AuthContext.jsx'
import { definirSenha } from '../services.js'
import { useToast } from '../../../components/Toast.jsx'
import { CASA } from '../../../lib/config.js'

export function DefinirSenha() {
  const { senhaDefinida } = useAuth()
  const toast = useToast()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    if (senha.length < 8) return setErro('Use pelo menos 8 caracteres')
    if (senha !== confirma) return setErro('As senhas não são iguais')
    setOcupado(true)
    const { error } = await definirSenha(senha)
    setOcupado(false)
    if (error) return setErro(error)
    toast('Senha criada')
    senhaDefinida()
  }

  return (
    <div className="app entrada">
      <div className="entrada-marca">
        <span className="marca">{CASA.nome}</span>
        <h1>Crie sua senha</h1>
        <p>Você vai usar seu e-mail e esta senha para entrar.</p>
      </div>
      <form onSubmit={enviar} noValidate>
        <label className="campo">
          <span>Senha nova</span>
          <input id="nova-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
        </label>
        <label className="campo">
          <span>Repita a senha</span>
          <input id="nova-senha-2" type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" />
        </label>
        {erro && <div className="erro-form">{erro}</div>}
        <button className="btn prim cheio" disabled={ocupado}>
          Salvar senha
        </button>
      </form>
    </div>
  )
}
