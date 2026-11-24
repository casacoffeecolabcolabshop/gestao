import { supabase } from '../../lib/supabase.js'
import { de, ok, falha, traduzirErro } from '../../lib/resultado.js'

export async function entrar(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
  if (error) {
    if (error.code === 'invalid_credentials' || /invalid login/i.test(error.message)) return falha('E-mail ou senha não conferem')
    return falha(traduzirErro(error))
  }
  return ok(data.session)
}

export async function sair() {
  const { error } = await supabase.auth.signOut()
  return error ? falha(traduzirErro(error)) : ok(true)
}

export async function pedirNovaSenha(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/definir-senha`,
  })
  return error ? falha(traduzirErro(error)) : ok(true)
}

export async function definirSenha(senha) {
  const { error } = await supabase.auth.updateUser({ password: senha })
  if (error) {
    if (error.code === 'same_password') return falha('Use uma senha diferente da anterior')
    if (error.code === 'weak_password') return falha('Senha fraca. Use pelo menos 8 caracteres.')
    return falha(traduzirErro(error))
  }
  return ok(true)
}

// null quando a pessoa está desativada: o RLS não deixa ler nem o próprio perfil.
export async function meuPerfil(userId) {
  const r = await supabase.from('profiles').select('id, nome, telefone, papel, ativo').eq('id', userId).maybeSingle()
  return de(r)
}
