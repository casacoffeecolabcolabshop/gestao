import { useState } from 'react'
import { criarConta } from '../services.js'

// Criar conta com nome, e-mail e senha (docs/03). Quem cria vira funcionário ativo.
export function CriarConta({ onVoltar, onPrecisaConfirmar }) {
  const [d, setD] = useState({ nome: '', email: '', senha: '', repetir: '' })
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const mudar = (campo) => (e) => setD({ ...d, [campo]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setOcupado(true)
    const { data, error } = await criarConta(d)
    setOcupado(false)
    if (error) return setErro(error)
    // sem confirmação o Supabase já loga e o app abre sozinho; com confirmação, avisa para abrir o e-mail
    if (data.precisaConfirmar) onPrecisaConfirmar(d.email.trim())
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className="campo">
        <span>Seu nome</span>
        <input id="cadastro-nome" value={d.nome} onChange={mudar('nome')} maxLength={80} autoComplete="name" autoFocus />
      </label>
      <label className="campo">
        <span>E-mail</span>
        <input id="cadastro-email" type="email" value={d.email} onChange={mudar('email')} autoComplete="email" inputMode="email" />
      </label>
      <label className="campo">
        <span>Senha</span>
        <input id="cadastro-senha" type="password" value={d.senha} onChange={mudar('senha')} autoComplete="new-password" />
      </label>
      <label className="campo">
        <span>Repita a senha</span>
        <input id="cadastro-repetir" type="password" value={d.repetir} onChange={mudar('repetir')} autoComplete="new-password" />
      </label>
      <p className="dica">Pelo menos 8 caracteres.</p>
      {erro && <div className="erro-form">{erro}</div>}
      <button className="btn prim cheio" disabled={ocupado}>
        {ocupado ? 'Criando…' : 'Criar conta'}
      </button>
      <button type="button" className="link" onClick={onVoltar}>
        Já tenho conta
      </button>
    </form>
  )
}
