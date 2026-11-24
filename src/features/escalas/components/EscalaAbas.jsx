import { NavLink } from 'react-router-dom'

// Chave Semana | Mês no topo da Escala (docs/03, Calendário). Mês é o calendário, sem item novo na navegação.
export function EscalaAbas() {
  return (
    <nav className="abas abas-escala" aria-label="Ver escala por">
      <NavLink to="/escala" end>
        Semana
      </NavLink>
      <NavLink to="/escala/mes">Mês</NavLink>
    </nav>
  )
}
