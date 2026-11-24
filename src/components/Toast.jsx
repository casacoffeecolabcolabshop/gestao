import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

// Sucesso some em 2s (5s se tiver desfazer). Erro fica até a pessoa fechar.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef()

  const mostrar = useCallback((msg, { erro = false, desfazer = null } = {}) => {
    clearTimeout(timer.current)
    setToast({ msg, erro, desfazer, id: Date.now() })
    if (!erro) timer.current = setTimeout(() => setToast(null), desfazer ? 5000 : 2000)
  }, [])

  const fechar = () => {
    clearTimeout(timer.current)
    setToast(null)
  }

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      {toast && (
        <div key={toast.id} className={`toast ${toast.erro ? 'erro' : ''}`} role={toast.erro ? 'alert' : 'status'}>
          <span>{toast.msg}</span>
          {toast.desfazer && (
            <button
              onClick={() => {
                const fn = toast.desfazer
                fechar()
                fn()
              }}
            >
              Desfazer
            </button>
          )}
          {toast.erro && <button onClick={fechar}>Fechar</button>}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
