// Todo service devolve { data, error } com error em texto curto para a tela.
const MENSAGENS = {
  '23505': 'Já está na lista',
  '42501': 'Você não tem permissão para isso',
  PGRST116: 'Não encontrado',
}

export function traduzirErro(error) {
  if (!error) return null
  if (MENSAGENS[error.code]) return MENSAGENS[error.code]
  // exceções do banco (raise exception) já vêm em português
  if (error.code === 'P0001' && error.message) return error.message
  if (/Failed to fetch|NetworkError/i.test(error.message || '')) return 'Sem conexão. Confira a internet e tente de novo.'
  return 'Algo deu errado. Tente de novo.'
}

export const ok = (data) => ({ data, error: null })
export const falha = (msg) => ({ data: null, error: msg })
export const de = ({ data, error }) => (error ? falha(traduzirErro(error)) : ok(data))
