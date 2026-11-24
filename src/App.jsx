import { Navigate, Route, Routes } from 'react-router-dom'
import { configurado } from './lib/supabase.js'
import { ToastProvider } from './components/Toast.jsx'
import { Layout } from './components/Layout.jsx'
import { Carregando, EstadoErro } from './components/Estados.jsx'
import { AuthProvider, useAuth, Login, DefinirSenha } from './features/auth/index.js'
import { sair } from './features/auth/services.js'
import { ChatProvider } from './features/chat/index.js'
import { ComprasPage } from './features/compras/index.js'
import { EscalaPage, PedidosPage } from './features/escalas/index.js'
import { EquipePage } from './features/equipe/index.js'

export function App() {
  if (!configurado) {
    return (
      <div className="app">
        <EstadoErro mensagem="Faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env. Veja o README." />
      </div>
    )
  }
  return (
    <ToastProvider>
      <AuthProvider>
        <Portao />
      </AuthProvider>
    </ToastProvider>
  )
}

// Rota protegida: nada renderiza antes de checar a sessão e o perfil.
function Portao() {
  const { sessao, estado, souGestor, precisaSenha, recarregarPerfil } = useAuth()

  if (sessao === undefined || estado === 'carregando') return <div className="app"><Carregando /></div>
  if (sessao && precisaSenha) return <DefinirSenha />
  if (!sessao) return <Login />
  if (estado === 'erro') return <div className="app"><EstadoErro mensagem="Confira a internet." onTentar={recarregarPerfil} /></div>
  if (estado === 'desativado') {
    return (
      <div className="app">
        <div className="bloqueado">
          <h2>Acesso desativado</h2>
          <p>Seu acesso foi desativado. Fale com o dono da Casa.</p>
          <button className="btn" onClick={sair}>Sair</button>
        </div>
      </div>
    )
  }

  return (
    <ChatProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/escala" element={<EscalaPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/equipe" element={souGestor ? <EquipePage /> : <Navigate to="/compras" replace />} />
          <Route path="*" element={<Navigate to="/compras" replace />} />
        </Route>
      </Routes>
    </ChatProvider>
  )
}
