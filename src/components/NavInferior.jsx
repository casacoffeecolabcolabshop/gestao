import { NavLink } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext.jsx'
import { IconeCompras, IconeEscala, IconePedidos, IconeEquipe } from './Icones.jsx'

export function NavInferior({ pendentes = 0 }) {
  const { souGestor } = useAuth()
  const itens = [
    ['/compras', 'Compras', IconeCompras],
    ['/escala', 'Escala', IconeEscala],
    ['/pedidos', 'Pedidos', IconePedidos],
    ...(souGestor ? [['/equipe', 'Equipe', IconeEquipe]] : []),
  ]
  return (
    <nav className="nav" aria-label="Navegação">
      {itens.map(([para, rotulo, Icone]) => (
        <NavLink key={para} to={para}>
          <Icone />
          <span>{rotulo}</span>
          {para === '/pedidos' && souGestor && pendentes > 0 && <span className="badge">{pendentes}</span>}
        </NavLink>
      ))}
    </nav>
  )
}
