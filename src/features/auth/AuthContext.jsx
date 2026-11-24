import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase.js'
import { meuPerfil } from './services.js'

const AuthContext = createContext(null)

// Convite e "esqueci a senha" chegam com type=invite/recovery na URL: a pessoa precisa criar a senha.
const chegouParaCriarSenha = () => /type=(invite|recovery)/.test(window.location.hash + window.location.search)

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(undefined) // undefined = ainda checando
  const [perfil, setPerfil] = useState(null)
  const [estado, setEstado] = useState('carregando') // carregando | ok | desativado | erro
  const [estadoDe, setEstadoDe] = useState(undefined) // de qual usuário é o estado acima
  const [precisaSenha, setPrecisaSenha] = useState(chegouParaCriarSenha)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSessao(data.session ?? null))
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setPrecisaSenha(true)
      setSessao(s ?? null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const carregarPerfil = useCallback(async (userId) => {
    const { data, error } = await meuPerfil(userId)
    setEstadoDe(userId)
    if (error) return setEstado('erro')
    if (!data || !data.ativo) {
      setPerfil(null)
      return setEstado('desativado')
    }
    setPerfil(data)
    setEstado('ok')
  }, [])

  const userId = sessao?.user?.id
  useEffect(() => {
    if (sessao === undefined) return
    if (!userId) {
      setPerfil(null)
      setEstado('ok')
      setEstadoDe(null)
      return
    }
    carregarPerfil(userId)
  }, [sessao, userId, carregarPerfil])

  const valor = useMemo(() => {
    // Enquanto o estado não for do usuário logado agora, ainda está carregando.
    const estadoAtual = estadoDe === (userId ?? null) ? estado : 'carregando'
    const papel = estadoAtual === 'ok' ? (perfil?.papel ?? null) : null
    return {
      sessao,
      perfil: estadoAtual === 'ok' ? perfil : null,
      estado: estadoAtual,
      papel,
      souGestor: papel === 'dono' || papel === 'gerente',
      souDono: papel === 'dono',
      precisaSenha,
      senhaDefinida: () => {
        setPrecisaSenha(false)
        window.history.replaceState(null, '', '/')
      },
      recarregarPerfil: () => userId && carregarPerfil(userId),
    }
  }, [sessao, perfil, estado, estadoDe, precisaSenha, userId, carregarPerfil])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
