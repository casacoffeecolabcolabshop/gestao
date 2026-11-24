import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { NavInferior } from './NavInferior.jsx'
import { useAuth } from '../features/auth/AuthContext.jsx'
import { MinhaConta } from '../features/auth/components/MinhaConta.jsx'
import { ChatPainel } from '../features/chat/index.js'
import { listarEquipe } from '../features/equipe/services.js'
import { listarPedidos } from '../features/escalas/services.js'
import { CASA } from '../lib/config.js'

// Moldura comum: topo com a conta, conteúdo, ação principal + navegação no rodapé.
export function Layout() {
  const { perfil, souGestor } = useAuth()
  const [slot, setSlot] = useState(null)
  const [equipe, setEquipe] = useState([])
  const [pendentes, setPendentes] = useState(0)
  const [conta, setConta] = useState(false)
  const { pathname } = useLocation()

  const recarregarEquipe = useCallback(async () => {
    const { data } = await listarEquipe()
    if (data) setEquipe(data)
  }, [])
  const recarregarPendentes = useCallback(async () => {
    if (!souGestor) return setPendentes(0)
    const { data } = await listarPedidos()
    if (data) setPendentes(data.filter((p) => p.status === 'pendente').length)
  }, [souGestor])

  useEffect(() => {
    recarregarEquipe()
  }, [recarregarEquipe])
  useEffect(() => {
    recarregarPendentes()
    window.scrollTo(0, 0)
  }, [pathname, recarregarPendentes])

  const nomeDe = useCallback(
    (id) => (id === perfil.id ? 'Você' : equipe.find((p) => p.id === id)?.nome || 'Alguém'),
    [equipe, perfil.id],
  )
  const contexto = useMemo(
    () => ({ slot, equipe, nomeDe, recarregarEquipe, recarregarPendentes }),
    [slot, equipe, nomeDe, recarregarEquipe, recarregarPendentes],
  )

  return (
    <>
      <div className="app">
        <header className="barra-topo">
          <span className="marca">{CASA.nome}</span>
          <button className="avatar" onClick={() => setConta(true)} aria-label="Minha conta">
            {perfil.nome.slice(0, 1).toUpperCase()}
          </button>
        </header>
        <main data-tela={pathname.split('/')[1] || 'compras'}>
          <Outlet context={contexto} />
        </main>
      </div>
      <div className="rodape">
        <div className="in">
          <span className="marca rodape-marca">{CASA.nome}</span>
          <div ref={setSlot} />
          <NavInferior pendentes={pendentes} />
        </div>
      </div>
      <ChatPainel nomeDe={nomeDe} />
      {conta && <MinhaConta onFechar={() => setConta(false)} onSalvo={recarregarEquipe} />}
    </>
  )
}
