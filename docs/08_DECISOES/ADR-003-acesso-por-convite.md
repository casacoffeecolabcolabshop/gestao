# ADR-003: Acesso só por convite

- **Status:** Substituído por ADR-008 (cadastro aberto com Google) · **Data:** 2026-11-24

## Contexto
Só a equipe pode entrar. Tela de convite própria exigiria `service_role` num servidor (edge function).

## Decisão
Cadastro público desligado no Supabase. O dono convida pelo painel do Supabase (Authentication → Invite). Um trigger cria o `profile` como `funcionario`; o dono muda o papel na tela Equipe.

## Alternativas
- Cadastro aberto com aprovação: risco de estranho criar conta.
- Edge function de convite: melhor experiência, fica para a Fase 2.

## Consequências
- Zero código de convite no MVP.
- Dono precisa abrir o painel do Supabase para convidar (raro: equipe pequena).
