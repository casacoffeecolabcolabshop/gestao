import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext.jsx'
import { assinarChat, contarNovas, SALAS } from './services.js'

const ChatContext = createContext(null)
const chaveVisto = (uid, sala) => `casa-chat-visto:${uid}:${sala}`
const lerVisto = (uid, sala) => {
  try {
    return localStorage.getItem(chaveVisto(uid, sala)) || new Date(0).toISOString()
  } catch {
    return new Date(0).toISOString()
  }
}
const gravarVisto = (uid, sala) => {
  try {
    localStorage.setItem(chaveVisto(uid, sala), new Date().toISOString())
  } catch {
    /* navegador sem armazenamento: contador só zera na sessão */
  }
}

// Mantém uma assinatura ao vivo para as duas salas: contador de não lidas + chat aberto.
export function ChatProvider({ children }) {
  const { perfil } = useAuth()
  const meuId = perfil?.id
  const [aberto, setAberto] = useState(null)
  const [novas, setNovas] = useState({ compras: 0, escalas: 0 })
  const ouvintes = useRef(new Set())
  const abertoRef = useRef(null)
  abertoRef.current = aberto

  useEffect(() => {
    if (!meuId) return
    let ativo = true
    Object.keys(SALAS).forEach(async (sala) => {
      const { data } = await contarNovas(sala, lerVisto(meuId, sala), meuId)
      if (ativo && typeof data === 'number') setNovas((n) => ({ ...n, [sala]: data }))
    })
    const parar = assinarChat({
      onNova: (m) => {
        ouvintes.current.forEach((fn) => fn({ tipo: 'nova', m }))
        if (m.autor_id === meuId) return
        if (abertoRef.current === m.sala) gravarVisto(meuId, m.sala)
        else setNovas((n) => ({ ...n, [m.sala]: (n[m.sala] || 0) + 1 }))
      },
      onApagada: (id) => ouvintes.current.forEach((fn) => fn({ tipo: 'apagada', id })),
    })
    return () => {
      ativo = false
      parar()
    }
  }, [meuId])

  const abrir = useCallback(
    (sala) => {
      setAberto(sala)
      gravarVisto(meuId, sala)
      setNovas((n) => ({ ...n, [sala]: 0 }))
    },
    [meuId],
  )
  const fechar = useCallback(() => {
    if (abertoRef.current) gravarVisto(meuId, abertoRef.current)
    setAberto(null)
  }, [meuId])
  const ouvir = useCallback((fn) => {
    ouvintes.current.add(fn)
    return () => ouvintes.current.delete(fn)
  }, [])

  return <ChatContext.Provider value={{ aberto, abrir, fechar, novas, ouvir }}>{children}</ChatContext.Provider>
}

export const useChat = () => useContext(ChatContext)
