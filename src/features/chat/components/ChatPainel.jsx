import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useToast } from '../../../components/Toast.jsx'
import { Carregando, EstadoErro, EstadoVazio } from '../../../components/Estados.jsx'
import { useChat } from '../ChatContext.jsx'
import { SALAS, listarMensagens, enviarMensagem, apagarMensagem, restaurarMensagem } from '../services.js'
import { fmtHora, rotuloDia, ymd } from '../../../lib/datas.js'
import '../chat.css'

const EXEMPLO = {
  compras: 'Ex.: “O fornecedor do leite entrega amanhã?”',
  escalas: 'Ex.: “Alguém troca comigo o sábado de manhã?”',
}
const ordenar = (lista) => [...lista].sort((a, b) => a.created_at.localeCompare(b.created_at))

export function ChatPainel({ nomeDe }) {
  const { aberto: sala, fechar, ouvir } = useChat()
  const { perfil, souGestor } = useAuth()
  const toast = useToast()
  const [msgs, setMsgs] = useState([])
  const [estado, setEstado] = useState('carregando')
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const lista = useRef(null)
  const colar = useRef(true)

  const carregar = async () => {
    setEstado('carregando')
    const { data, error } = await listarMensagens(sala)
    if (error) return setEstado(error)
    colar.current = true
    setMsgs(data)
    setEstado('ok')
  }

  useEffect(() => {
    if (!sala) return
    setMsgs([])
    setTexto('')
    carregar()
    return ouvir((ev) => {
      if (ev.tipo === 'nova' && ev.m.sala === sala) {
        const el = lista.current
        colar.current = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 80 || ev.m.autor_id === perfil.id
        setMsgs((l) => (l.some((x) => x.id === ev.m.id) ? l : ordenar([...l, ev.m])))
      }
      if (ev.tipo === 'apagada') setMsgs((l) => l.filter((x) => x.id !== ev.id))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sala])

  useLayoutEffect(() => {
    if (colar.current && lista.current) lista.current.scrollTop = lista.current.scrollHeight
  }, [msgs])

  useEffect(() => {
    if (!sala) return
    const esc = (e) => e.key === 'Escape' && fechar()
    document.addEventListener('keydown', esc)
    document.body.classList.add('sem-rolagem')
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.classList.remove('sem-rolagem')
    }
  }, [sala, fechar])

  if (!sala) return null

  const enviar = async (e) => {
    e?.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    const { data, error } = await enviarMensagem(sala, texto)
    setEnviando(false)
    if (error) return toast(error, { erro: true })
    setTexto('')
    const campo = document.getElementById('chat-texto')
    if (campo) campo.style.height = ''
    colar.current = true
    setMsgs((l) => (l.some((x) => x.id === data.id) ? l : ordenar([...l, data])))
  }

  const apagar = async (m) => {
    const { error } = await apagarMensagem(m.id)
    if (error) return toast(error, { erro: true })
    setMsgs((l) => l.filter((x) => x.id !== m.id))
    const minha = m.autor_id === perfil.id
    toast('Mensagem apagada', {
      desfazer: minha
        ? async () => {
            const r = await restaurarMensagem(m)
            if (r.error) return toast(r.error, { erro: true })
            setMsgs((l) => (l.some((x) => x.id === m.id) ? l : ordenar([...l, r.data])))
          }
        : null,
    })
  }

  let dia = ''
  return (
    <div className="chat-veu" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="chat" role="dialog" aria-modal="true" aria-label={SALAS[sala]}>
        <div className="chat-topo">
          <div>
            <h2>{SALAS[sala]}</h2>
            <p>Toda a equipe vê e escreve aqui</p>
          </div>
          <button onClick={fechar} aria-label="Fechar chat">
            ×
          </button>
        </div>
        <div className="chat-lista" ref={lista} aria-live="polite">
          {estado === 'carregando' && <Carregando texto="Carregando mensagens…" />}
          {estado !== 'carregando' && estado !== 'ok' && <EstadoErro mensagem={estado} onTentar={carregar} />}
          {estado === 'ok' && !msgs.length && <EstadoVazio titulo="Nenhuma mensagem ainda">{EXEMPLO[sala]}</EstadoVazio>}
          {estado === 'ok' &&
            msgs.map((m) => {
              const d = ymd(new Date(m.created_at))
              const separador = d !== dia
              dia = d
              const minha = m.autor_id === perfil.id
              return (
                <div key={m.id} className="chat-item">
                  {separador && <div className="chat-dia">{rotuloDia(d)}</div>}
                  <div className={`msg ${minha ? 'minha' : ''}`}>
                    {!minha && <div className="msg-autor">{nomeDe(m.autor_id)}</div>}
                    <div className="bolha">{m.texto}</div>
                    <div className="msg-meta">
                      {fmtHora(m.created_at)}
                      {(minha || souGestor) && (
                        <>
                          {' · '}
                          <button onClick={() => apagar(m)}>Apagar</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
        <form className="chat-form" onSubmit={enviar}>
          <textarea
            id="chat-texto"
            rows={1}
            maxLength={500}
            value={texto}
            placeholder="Escreva para a equipe"
            aria-label="Mensagem"
            onChange={(e) => {
              setTexto(e.target.value)
              e.target.style.height = ''
              e.target.style.height = Math.min(e.target.scrollHeight + 2, 140) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(hover: hover)').matches) enviar(e)
            }}
          />
          <button className="btn prim" disabled={enviando || !texto.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}
