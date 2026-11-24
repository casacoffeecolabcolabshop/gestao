import { supabase } from '../../lib/supabase.js'
import { de } from '../../lib/resultado.js'

export async function listarEquipe() {
  return de(await supabase.from('profiles').select('id, nome, telefone, papel, ativo').order('nome'))
}

export async function alterarPapel(id, papel) {
  return de(await supabase.from('profiles').update({ papel }).eq('id', id).select('id, papel').single())
}

export async function ativarDesativar(id, ativo) {
  return de(await supabase.from('profiles').update({ ativo }).eq('id', id).select('id, ativo').single())
}

export async function editarMeuContato(id, { nome, telefone }) {
  const n = (nome || '').trim()
  if (!n) return { data: null, error: 'Escreva seu nome' }
  if (n.length > 80) return { data: null, error: 'Nome muito longo (máximo 80 letras)' }
  if ((telefone || '').length > 20) return { data: null, error: 'Telefone muito longo' }
  return de(await supabase.from('profiles').update({ nome: n, telefone: telefone?.trim() || null }).eq('id', id).select('id').single())
}
