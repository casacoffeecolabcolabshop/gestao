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

// Entrar com Google (ADR-008): sai do app, volta logado. Conta nova vira funcionário.
export async function entrarComGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
  })
  if (error) {
    if (/provider is not enabled|unsupported provider/i.test(error.message)) return falha('Entrar com Google ainda não está ligado')
    return falha(traduzirErro(error))
  }
  return ok(true)
}

// Erro que o Google/Supabase devolve na URL ao voltar (ex.: pessoa cancelou).
// Lido quando o módulo carrega: o supabase-js limpa a URL ao iniciar, antes da tela de login montar.
let erroGoogle = (() => {
  const params = new URLSearchParams(window.location.hash.slice(1) + '&' + window.location.search.slice(1))
  const erro = params.get('error')
  if (!erro) return null
  window.history.replaceState(null, '', window.location.pathname)
  return erro === 'access_denied' ? 'Entrada com Google cancelada' : 'Não deu para entrar com Google. Tente de novo.'
})()

// Ler não apaga (o React em modo dev monta a tela duas vezes); some quando a pessoa tenta entrar de novo.
export const erroDaVoltaDoGoogle = () => erroGoogle
export const esquecerErroDoGoogle = () => {
  erroGoogle = null
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
