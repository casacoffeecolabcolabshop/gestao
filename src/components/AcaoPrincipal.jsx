import { createPortal } from 'react-dom'
import { useOutletContext } from 'react-router-dom'

// Botão principal grande, no rodapé, ao alcance do polegar.
export function AcaoPrincipal({ children, onClick }) {
  const { slot } = useOutletContext()
  if (!slot) return null
  return createPortal(
    <div className="cta">
      <button className="btn prim" onClick={onClick}>
        {children}
      </button>
    </div>,
    slot,
  )
}
