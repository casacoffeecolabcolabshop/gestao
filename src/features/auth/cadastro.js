// Criar conta com e-mail e senha (docs/03, Equipe). Devolve a mensagem do primeiro problema ou null.
export function validarCadastro({ nome, email, senha, repetir }) {
  const n = (nome || '').trim()
  if (!n) return 'Escreva seu nome'
  if (n.length > 80) return 'Nome muito longo (máximo 80 letras)'
  const e = (email || '').trim()
  if (!e) return 'Escreva seu e-mail'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Confira o e-mail'
  if ((senha || '').length < 8) return 'Use pelo menos 8 caracteres'
  if (senha !== repetir) return 'As senhas não são iguais'
  return null
}
