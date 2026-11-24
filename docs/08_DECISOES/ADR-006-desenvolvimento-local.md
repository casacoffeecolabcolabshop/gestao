# ADR-006: Desenvolvimento e testes 100% locais antes da nuvem

- **Status:** Aceito · **Data:** 2026-11-24

## Contexto
O Matheus quer testar tudo sem nada na web e só no final subir para Supabase na nuvem e Vercel.

## Decisão
Supabase local pelo CLI (`npx supabase start`, precisa de Docker). `supabase/migrations/` cria o banco a partir do schema; `supabase/seed.sql` cria a equipe de teste (senha `casa1234`) e dados de exemplo, só no local. E-mails de convite e de senha caem no Inbucket/Mailpit local (porta 54324). O app roda com `npm run dev` apontando para o Supabase local via `.env.local`.

## Consequências
- Testes de RLS de verdade, sem custo e sem dado real.
- `supabase/seed.sql` nunca roda em produção (o deploy usa só as migrations).
- Ao subir, basta `supabase link` + `supabase db push` e trocar o `.env` na Vercel.
