import { useState } from 'react'
import { entrar, pedirNovaSenha } from '../services.js'
import { CASA } from '../../../lib/config.js'

export function Login() {
  const [modo, setModo] = useState('entrar') // entrar | esqueci | enviado
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setErro('')
    if (!email.includes('@')) return setErro('Escreva seu e-mail')
    if (modo === 'entrar' && !senha) return setErro('Escreva sua senha')
    setOcupado(true)
    const { error } = modo === 'entrar' ? await entrar(email, senha) : await pedirNovaSenha(email)
    setOcupado(false)
    if (error) return setErro(error)
    if (modo === 'esqueci') setModo('enviado')
  }

  return (
    <div className="app entrada">
      <div className="entrada-marca">
        <span className="marca">{CASA.nome}</span>
        <h1>{CASA.app}</h1>
        <p>O que comprar e quem trabalha quando.</p>
      </div>
      {modo === 'enviado' ? (
        <div className="card coluna">
          <strong>Confira seu e-mail</strong>
          <span className="meta">Mandamos um link para {email}. Abra e crie uma senha nova.</span>
          <button className="btn" onClick={() => setModo('entrar')}>
            Voltar para entrar
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate>
          <label className="campo">
            <span>E-mail</span>
            <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
          </label>
          {modo === 'entrar' && (
            <label className="campo">
              <span>Senha</span>
              <input id="login-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
            </label>
          )}
          {erro && <div className="erro-form">{erro}</div>}
          <button className="btn prim cheio" disabled={ocupado}>
            {modo === 'entrar' ? 'Entrar' : 'Mandar link'}
          </button>
          <button type="button" className="link" onClick={() => setModo(modo === 'entrar' ? 'esqueci' : 'entrar')}>
            {modo === 'entrar' ? 'Esqueci a senha' : 'Voltar para entrar'}
          </button>
          {modo === 'entrar' && <p className="dica">Sem conta? Peça um convite ao dono da Casa.</p>}
        </form>
      )}
    </div>
  )
}
