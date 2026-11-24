import { useState } from 'react'
import { entrar, entrarComGoogle, erroDaVoltaDoGoogle, esquecerErroDoGoogle, pedirNovaSenha } from '../services.js'
import { CASA, LOGIN_GOOGLE } from '../../../lib/config.js'
import { IconeGoogle } from '../../../components/Icones.jsx'
import { CriarConta } from './CriarConta.jsx'

export function Login() {
  const [modo, setModo] = useState('entrar') // entrar | criar | esqueci | enviado | confirmar
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(() => erroDaVoltaDoGoogle() || '')
  const [ocupado, setOcupado] = useState(false)

  const google = async () => {
    esquecerErroDoGoogle()
    setErro('')
    setOcupado(true)
    const { error } = await entrarComGoogle()
    // sem erro a página sai para o Google; só volta aqui se falhar
    if (error) {
      setOcupado(false)
      setErro(error)
    }
  }

  const enviar = async (e) => {
    e.preventDefault()
    esquecerErroDoGoogle()
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
      {modo === 'enviado' || modo === 'confirmar' ? (
        <div className="card coluna">
          <strong>Confira seu e-mail</strong>
          <span className="meta">
            {modo === 'enviado' ? `Mandamos um link para ${email}. Abra e crie uma senha nova.` : `Mandamos um link para ${email}. Abra para confirmar a conta e entrar.`}
          </span>
          <button className="btn" onClick={() => setModo('entrar')}>
            Voltar para entrar
          </button>
        </div>
      ) : modo === 'criar' ? (
        <CriarConta
          onVoltar={() => setModo('entrar')}
          onPrecisaConfirmar={(e) => {
            setEmail(e)
            setModo('confirmar')
          }}
        />
      ) : (
        <form onSubmit={enviar} noValidate>
          {modo === 'entrar' && LOGIN_GOOGLE && (
            <>
              <button type="button" className="btn google" onClick={google} disabled={ocupado}>
                <IconeGoogle />
                Entrar com Google
              </button>
              <div className="ou">ou com e-mail</div>
            </>
          )}
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
          {modo === 'entrar' && (
            <button
              type="button"
              className="btn cheio"
              onClick={() => {
                setErro('')
                setModo('criar')
              }}
            >
              Criar conta
            </button>
          )}
        </form>
      )}
    </div>
  )
}
