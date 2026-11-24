# ADR-004: Permissão por papel no banco (RLS)

- **Status:** Aceito · **Data:** 2026-11-24

## Contexto
O front usa a chave pública `anon`. Esconder botão não protege nada.

## Decisão
Papel (`dono`, `gerente`, `funcionario`) fica em `profiles.papel`. Função `meu_papel()` lê o papel de quem está logado e as políticas RLS usam ela. A tabela de permissões em `docs/03_REGRAS_DE_NEGOCIO/` é implementada 1:1 em `supabase/schema.sql`. Aprovar pedido é uma RPC (`decidir_pedido`) que confere o papel e faz tudo numa transação.

## Consequências
- A tela só esconde o que a pessoa não pode; quem barra é o banco.
- Toda tabela nova precisa de política antes de ir para produção.
