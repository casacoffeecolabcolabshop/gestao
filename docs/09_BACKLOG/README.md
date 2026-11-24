# 09 Backlog

Ordem de construção. Cada item termina com tela funcionando no celular e RLS testado.

## Fase 1: MVP
1. [x] Setup: Vite + React Router + Supabase client + `.env` + Supabase local (deploy Vercel fica para o item 11)
2. [x] Banco: rodar `supabase/schema.sql`, desligar cadastro público, convidar o dono
3. [x] Login + `AuthContext` + rota protegida + navegação inferior
4. [x] Design base: tokens.css + componentes base
5. [x] **Compras:** listar, adicionar, marcar comprado (com desfazer), editar/apagar
6. [x] **Escala:** semana, criar/editar/apagar turno, copiar semana anterior
7. [x] **Minhas horas** e horas da equipe (gerente)
8. [x] **Pedidos:** folga e troca, cancelar, aprovar/recusar
9. [x] **Equipe:** lista, mudar papel, desativar (dono)
10. [x] **Chat:** um de compras e um de escala, ao vivo (ADR-005)
11. [ ] Testes locais completos (checklist de `docs/11_SEGURANCA`)
12. [ ] Subir: projeto Supabase na nuvem + Vercel
13. [ ] Teste com a equipe real por 1 semana, anotar em `memory/learnings.md`

## Fase 2 (só se a equipe pedir)
- Convite pelo próprio app (edge function)
- Cadastro de insumos e fornecedores
- Estoque mínimo com alerta
- Histórico de preços e gastos
- Compartilhar lista/escala no WhatsApp (link, grátis)
- PWA (ícone na tela inicial)
