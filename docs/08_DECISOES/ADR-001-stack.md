# ADR-001: Stack React + Vite + Supabase + Vercel

- **Status:** Aceito · **Data:** 2026-11-24

## Contexto
App interno pequeno, custo zero, precisa de login, banco e permissões por papel, e de subir rápido.

## Decisão
React + Vite + React Router no front, Supabase (Auth, Postgres, RLS) no back, deploy na Vercel. Mesmo padrão dos outros projetos Kora.

## Alternativas
- API própria Node + Postgres: mais trabalho e hospedagem para manter, sem ganho nesse tamanho.
- Planilha/Google Forms: não resolve permissão nem a experiência no celular.

## Consequências
- Tudo grátis no volume da Casa.
- Segurança depende do RLS bem feito (ADR-004).
- Supabase Free pausa projeto após 7 dias sem uso: o uso diário evita isso.
