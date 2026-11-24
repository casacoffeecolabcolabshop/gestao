import { supabase } from '../../lib/supabase.js'
import { de, ok, falha, traduzirErro } from '../../lib/resultado.js'
import { somarDias } from '../../lib/datas.js'

const CAMPOS_TURNO = 'id, profile_id, data, inicio, fim, observacao, status'
const hhmm = (t) => (t ? t.slice(0, 5) : t)
const normalizarTurno = (t) => ({ ...t, inicio: hhmm(t.inicio), fim: hhmm(t.fim) })

// ---------- turnos ----------
export async function listarTurnos(de_, ate) {
  const r = await supabase
    .from('shifts')
    .select(CAMPOS_TURNO)
    .gte('data', de_)
    .lt('data', ate)
    .order('data')
    .order('inicio')
  return r.error ? de(r) : ok(r.data.map(normalizarTurno))
}

export const listarTurnosDaSemana = (inicio) => listarTurnos(inicio, somarDias(inicio, 7))

function validarTurno(d) {
  if (!d.profile_id) return 'Escolha a pessoa'
  if (!d.data || !d.inicio || !d.fim) return 'Preencha dia, começo e fim'
  if (d.inicio === d.fim) return 'Começo e fim não podem ser iguais'
  if ((d.observacao || '').length > 100) return 'Observação muito longa (máximo 100 letras)'
  return null
}
const limparTurno = (d) => ({
  profile_id: d.profile_id,
  data: d.data,
  inicio: d.inicio,
  fim: d.fim,
  observacao: d.observacao?.trim() || null,
  // funcionário sempre grava "pendente" (gatilho no banco); gerente/dono mantém o que veio (copiar, desfazer)
  ...(d.status ? { status: d.status } : {}),
})

export async function criarTurno(dados) {
  const erro = validarTurno(dados)
  if (erro) return falha(erro)
  const r = await supabase.from('shifts').insert(limparTurno(dados)).select(CAMPOS_TURNO).single()
  return r.error ? de(r) : ok(normalizarTurno(r.data))
}

export async function editarTurno(id, dados) {
  const erro = validarTurno(dados)
  if (erro) return falha(erro)
  const r = await supabase.from('shifts').update(limparTurno(dados)).eq('id', id).select(CAMPOS_TURNO).single()
  return r.error ? de(r) : ok(normalizarTurno(r.data))
}

// Turnos que funcionários mandaram e aguardam gerente/dono (docs/03), de hoje em diante.
export async function listarTurnosAguardando(desde) {
  const r = await supabase.from('shifts').select(CAMPOS_TURNO).eq('status', 'pendente').gte('data', desde).order('data').order('inicio')
  return r.error ? de(r) : ok(r.data.map(normalizarTurno))
}

export async function aprovarTurno(id) {
  const r = await supabase.from('shifts').update({ status: 'aprovado' }).eq('id', id).select('id')
  if (r.error) return de(r)
  return r.data.length ? ok(true) : falha('Esse turno não está mais aguardando')
}

export async function apagarTurno(id) {
  const r = await supabase.from('shifts').delete().eq('id', id).select('id')
  if (r.error) return de(r)
  return r.data.length ? ok(true) : falha('Você não pode apagar esse turno')
}

// Copia turno a turno: o que bater horário ou for de pessoa desativada é pulado.
export async function copiarSemana(origem, destino, ativos) {
  const r = await listarTurnosDaSemana(origem)
  if (r.error) return r
  r.data = r.data.filter((t) => t.status === 'aprovado') // só turno aprovado é copiado (docs/03)
  if (!r.data.length) return falha('A semana anterior não tem turnos para copiar')
  const deslocamento = Math.round((new Date(destino) - new Date(origem)) / 864e5)
  const criados = []
  let pulados = 0
  for (const t of r.data) {
    if (!ativos.has(t.profile_id)) {
      pulados++
      continue
    }
    const novo = await criarTurno({ ...t, data: somarDias(t.data, deslocamento) })
    if (novo.error) pulados++
    else criados.push(novo.data.id)
  }
  return ok({ criados, pulados })
}

export async function apagarVarios(ids) {
  if (!ids.length) return ok(true)
  return de(await supabase.from('shifts').delete().in('id', ids))
}

// ---------- pedidos de troca e folga ----------
const CAMPOS_PEDIDO =
  'id, tipo, solicitante_id, shift_id, substituto_id, data, motivo, status, decidido_por, decidido_em, created_at, turno:shifts(id, data, inicio, fim)'
const normalizarPedido = (p) => ({ ...p, turno: p.turno ? normalizarTurno(p.turno) : null })

export async function listarPedidos() {
  const r = await supabase.from('shift_requests').select(CAMPOS_PEDIDO).order('created_at', { ascending: false }).limit(100)
  return r.error ? de(r) : ok(r.data.map(normalizarPedido))
}

export async function pedirFolga({ data, motivo }, hojeStr) {
  if (!data) return falha('Escolha o dia da folga')
  if (data < hojeStr) return falha('Escolha um dia de hoje em diante')
  if ((motivo || '').length > 200) return falha('Motivo muito longo (máximo 200 letras)')
  return de(await supabase.from('shift_requests').insert({ tipo: 'folga', data, motivo: motivo?.trim() || null }).select('id').single())
}

export async function pedirTroca({ shift_id, substituto_id, motivo }) {
  if (!shift_id) return falha('Escolha o turno que quer trocar')
  if ((motivo || '').length > 200) return falha('Motivo muito longo (máximo 200 letras)')
  return de(
    await supabase
      .from('shift_requests')
      .insert({ tipo: 'troca', shift_id, substituto_id: substituto_id || null, motivo: motivo?.trim() || null })
      .select('id')
      .single(),
  )
}

export async function cancelarPedido(id) {
  const r = await supabase.from('shift_requests').update({ status: 'cancelado' }).eq('id', id).select('id')
  if (r.error) return de(r)
  return r.data.length ? ok(true) : falha('Só quem pediu cancela, e só enquanto está aguardando')
}

// RPC: confere o papel e faz tudo numa transação (ADR-004).
export async function decidirPedido(id, aprovado) {
  const { error } = await supabase.rpc('decidir_pedido', { p_id: id, p_aprovado: aprovado })
  if (error) {
    if (/sobrepost|turno nesse hor/i.test(error.message || '')) return falha('Quem vai cobrir já tem turno nesse horário. Recuse ou ajuste a escala.')
    return falha(traduzirErro(error))
  }
  return ok(true)
}
