import { describe, expect, it } from 'vitest'
import { validarCadastro } from './cadastro.js'

const ok = { nome: 'Ana Souza', email: 'ana@exemplo.com', senha: 'segredo123', repetir: 'segredo123' }

describe('validarCadastro', () => {
  it('aceita cadastro completo', () => {
    expect(validarCadastro(ok)).toBeNull()
  })

  it('pede nome, até 80 letras', () => {
    expect(validarCadastro({ ...ok, nome: '   ' })).toBe('Escreva seu nome')
    expect(validarCadastro({ ...ok, nome: 'a'.repeat(81) })).toBe('Nome muito longo (máximo 80 letras)')
  })

  it('pede e-mail com cara de e-mail', () => {
    expect(validarCadastro({ ...ok, email: '' })).toBe('Escreva seu e-mail')
    expect(validarCadastro({ ...ok, email: 'ana@' })).toBe('Confira o e-mail')
    expect(validarCadastro({ ...ok, email: 'ana exemplo.com' })).toBe('Confira o e-mail')
  })

  it('senha com 8 letras ou mais e repetida igual', () => {
    expect(validarCadastro({ ...ok, senha: '1234567', repetir: '1234567' })).toBe('Use pelo menos 8 caracteres')
    expect(validarCadastro({ ...ok, repetir: 'outra1234' })).toBe('As senhas não são iguais')
  })
})
