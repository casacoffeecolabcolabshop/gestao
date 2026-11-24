import { supabase } from '../../lib/supabase.js'
import { de, ok, falha, traduzirErro } from '../../lib/resultado.js'
import { MAX_ITENS_POR_VEZ } from './lista.js'

const CAMPOS = 'id, nome, quantidade, tipo, observacao, urgente, status, criado_por, comprado_por, comprado_em, created_at'

// Pendentes + comprados dos últimos 7 dias (docs/03). Ordem final é feita na tela.
export async function listarItens() {
  const seteDias = new Date(Date.now() - 7 * 864e5).toISOString()
  const r = await supabase
    .from('shopping_items')
    .select(CAMPOS)
    .or(`status.eq.pendente,comprado_em.gte.${seteDias}`)
    .order('created_at', { ascending: true })
  return de(r)
}

function validar(d) {
  const nome = (d.nome || '').trim()
  if (!nome) return 'Escreva o nome do item'
  if (nome.length > 80) return 'Nome muito longo (máximo 80 letras)'
  if ((d.quantidade || '').length > 40) return 'Quantidade muito longa (máximo 40 letras)'
  if ((d.observacao || '').length > 200) return 'Observação muito longa (máximo 200 letras)'
  if (!['insumo', 'produto'].includes(d.tipo)) return 'Escolha insumo ou produto'
  return null
}
const limpar = (d) => ({
  nome: d.nome.trim(),
  quantidade: d.quantidade?.trim() || null,
  tipo: d.tipo,
  observacao: d.observacao?.trim() || null,
  urgente: Boolean(d.urgente),
})

export async function adicionarItem(dados) {
  const erro = validar(dados)
  if (erro) return falha(erro)
  return de(await supabase.from('shopping_items').insert(limpar(dados)).select(CAMPOS).single())
}

// Vários de uma vez (docs/03): valida tudo antes, grava um por um para pular só o que já está pendente.
export async function adicionarVarios(itens, { tipo, urgente }) {
  if (!itens.length) return falha('Escreva pelo menos um item, um por linha')
  if (itens.length > MAX_ITENS_POR_VEZ) return falha(`Máximo ${MAX_ITENS_POR_VEZ} itens por vez`)
  for (const it of itens) {
    const erro = validar({ ...it, tipo })
    if (erro) return falha(`${it.nome.slice(0, 30)}: ${erro}`)
  }
  let adicionados = 0
  let jaEstavam = 0
  for (const it of itens) {
    const r = await supabase.from('shopping_items').insert(limpar({ ...it, tipo, urgente })).select('id').single()
    if (r.error?.code === '23505') jaEstavam++
    else if (r.error) return falha(adicionados ? `${adicionados} adicionados, mas parou em ${it.nome}: ${traduzirErro(r.error)}` : traduzirErro(r.error))
    else adicionados++
  }
  return ok({ adicionados, jaEstavam })
}

export async function editarItem(id, dados) {
  const erro = validar(dados)
  if (erro) return falha(erro)
  return de(await supabase.from('shopping_items').update(limpar(dados)).eq('id', id).select(CAMPOS).single())
}

export async function marcarComoComprado(id, meuId) {
  return de(
    await supabase
      .from('shopping_items')
      .update({ status: 'comprado', comprado_por: meuId, comprado_em: new Date().toISOString() })
      .eq('id', id)
      .select(CAMPOS)
      .single(),
  )
}

// Dar baixa em vários de uma vez (docs/03). Devolve os ids que mudaram (o RLS barra quem não pode).
export async function marcarVariosComoComprados(ids, meuId) {
  if (!ids.length) return falha('Marque pelo menos um item')
  const r = await supabase
    .from('shopping_items')
    .update({ status: 'comprado', comprado_por: meuId, comprado_em: new Date().toISOString() })
    .in('id', ids)
    .eq('status', 'pendente')
    .select('id')
  if (r.error) return de(r)
  return r.data.length ? ok(r.data.map((x) => x.id)) : falha('Nenhum item mudou. Você pode não ter permissão para dar baixa.')
}

export async function desfazerVarios(ids) {
  return de(
    await supabase.from('shopping_items').update({ status: 'pendente', comprado_por: null, comprado_em: null }).in('id', ids).select('id'),
  )
}

export async function desfazerCompra(id) {
  return de(
    await supabase
      .from('shopping_items')
      .update({ status: 'pendente', comprado_por: null, comprado_em: null })
      .eq('id', id)
      .select(CAMPOS)
      .single(),
  )
}

export async function apagarItem(id) {
  const r = await supabase.from('shopping_items').delete().eq('id', id).select('id')
  if (r.error) return de(r)
  return r.data.length ? ok(true) : falha('Você não pode apagar esse item')
}

// Recriar item apagado (desfazer). Volta como pendente, criado por quem apagou.
export async function recriarItem(item) {
  return adicionarItem(item)
}

// Lista ao vivo: qualquer mudança na tabela chama onMudanca.
export function assinarItens(onMudanca) {
  const canal = supabase
    .channel(`compras-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, onMudanca)
    .subscribe()
  return () => supabase.removeChannel(canal)
}
