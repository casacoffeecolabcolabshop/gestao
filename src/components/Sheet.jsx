import { useEffect } from 'react'

export function Sheet({ titulo, onFechar, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onFechar()
    document.addEventListener('keydown', esc)
    document.body.classList.add('sem-rolagem')
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.classList.remove('sem-rolagem')
    }
  }, [onFechar])

  return (
    <div className="veu" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="alca" />
        <h2>
          {titulo}
          <button onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </h2>
        {children}
      </div>
    </div>
  )
}
