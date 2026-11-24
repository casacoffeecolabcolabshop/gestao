# ADR-002: Single-tenant, só a Casa

- **Status:** Aceito · **Data:** 2026-11-24

## Contexto
O padrão Kora é multi-tenant desde a linha 1. Este projeto é ferramenta interna da Casa Coffee Colab, sem plano de revenda.

## Decisão
Sem `tenant_id`, sem white-label, sem planos. Um único projeto Supabase só da Casa. Nome e cores da Casa ficam em `src/styles/tokens.css` e numa constante de config, não espalhados pelo código.

## Alternativas
- Multi-tenant desde já: mais complexidade em toda tabela e política sem uso real.

## Consequências
- Código e RLS mais simples.
- Se um dia virar produto para outras cafeterias, exige migração (adicionar `tenant_id` e reescrever políticas). Decisão consciente.
