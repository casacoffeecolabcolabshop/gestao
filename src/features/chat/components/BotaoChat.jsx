import { IconeChat } from '../../../components/Icones.jsx'
import { useChat } from '../ChatContext.jsx'
import { SALAS } from '../services.js'

export function BotaoChat({ sala }) {
  const { abrir, novas } = useChat()
  const n = novas[sala] || 0
  return (
    <button className="btn peq chat-btn" onClick={() => abrir(sala)} aria-label={`Abrir ${SALAS[sala]}${n ? `, ${n} novas` : ''}`}>
      <IconeChat />
      <span>Chat</span>
      {n > 0 && <span className="badge">{n > 99 ? '99+' : n}</span>}
    </button>
  )
}
