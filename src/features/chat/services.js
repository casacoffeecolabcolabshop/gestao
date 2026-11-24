import { supabase } from '../../lib/supabase.js'
import { de, ok, falha } from '../../lib/resultado.js'

const CAMPOS = 'id, sala, autor_id, texto, created_at'
export const SALAS = { compras: 'Chat das compras', escalas: 'Chat da escala' }

export async function listarMensagens(sala) {
  const r = await supabase.from('chat_messages').select(CAMPOS).eq('sala', sala).order('created_at', { ascending: false }).limit(200)
  return r.error ? de(r) : ok(r.data.reverse())
}

export async function enviarMensagem(sala, texto) {
  const t = (texto || '').trim()
  if (!t) return falha('Escreva a mensagem')
  if (t.length > 500) return falha('Mensagem muito longa (máximo 500 letras)')
  return de(await supabase.from('chat_messages').insert({ sala, texto: t }).select(CAMPOS).single())
}

export async function apagarMensagem(id) {
  const r = await supabase.from('chat_messages').delete().eq('id', id).select('id')
  if (r.error) return de(r)
  return r.data.length ? ok(true) : falha('Você não pode apagar essa mensagem')
}

// Desfazer: volta a mesma mensagem (só funciona para quem escreveu, pelo RLS).
export async function restaurarMensagem(m) {
  return de(await supabase.from('chat_messages').insert({ id: m.id, sala: m.sala, texto: m.texto, created_at: m.created_at }).select(CAMPOS).single())
}

// Uma assinatura para as duas salas: alimenta o chat aberto e os contadores de não lidas.
export function assinarChat({ onNova, onApagada }) {
  const canal = supabase
    .channel(`chat-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (p) => onNova(p.new))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (p) => onApagada(p.old.id))
    .subscribe()
  return () => supabase.removeChannel(canal)
}

export async function contarNovas(sala, desde, meuId) {
  const r = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('sala', sala)
    .gt('created_at', desde)
    .neq('autor_id', meuId)
  return r.error ? de(r) : ok(r.count || 0)
}
