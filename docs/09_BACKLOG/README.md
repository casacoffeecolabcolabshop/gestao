# 09 Backlog

Ordem de construção. Cada item termina com tela funcionando no celular e RLS testado.

## Fase 1: MVP
1. [ ] Setup: Vite + React Router + Supabase client + `.env` + deploy Vercel
2. [ ] Banco: rodar `supabase/schema.sql`, desligar cadastro público, convidar o dono
3. [ ] Login + `AuthContext` + rota protegida + navegação inferior
4. [ ] Design base: tokens.css + componentes base
5. [ ] **Compras:** listar, adicionar, marcar comprado (com desfazer), editar/apagar
6. [ ] **Escala:** semana, criar/editar/apagar turno, copiar semana anterior
7. [ ] **Minhas horas** e horas da equipe (gerente)
8. [ ] **Pedidos:** folga e troca, cancelar, aprovar/recusar
9. [ ] **Equipe:** lista, mudar papel, desativar (dono)
10. [ ] Teste com a equipe real por 1 semana, anotar em `memory/learnings.md`

## Fase 2 (só se a equipe pedir)
- Convite pelo próprio app (edge function)
- Cadastro de insumos e fornecedores
- Estoque mínimo com alerta
- Histórico de preços e gastos
- Compartilhar lista/escala no WhatsApp (link, grátis)
- PWA (ícone na tela inicial)
