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
10b. [x] **Compras:** colar vários itens de uma vez + painel "Para comprar" com Baixar PDF (ADR-007)
11. [x] Testes locais completos (checklist de `docs/11_SEGURANCA`, revisão de 24/11)
12. [x] Subir: Supabase na nuvem (`makrghducycdotzbknig`) + Vercel da Casa (projeto `casa-gestao`, publica sozinho a cada push na `main`)
13. [ ] Teste com a equipe real por 1 semana, anotar em `memory/learnings.md`
14. [x] **Entrar com Google** sem convite (ADR-008): conta nova vira funcionário ativo.
15. [x] **Layout para computador** (a partir de 960px): navegação lateral, Compras com painel ao lado, Escala em grade, formulários no centro, chat na lateral (docs/02).
16. [x] **Gerente ativa e desativa pessoas** (decisão do Matheus, 24/11): nunca o dono nem a si mesmo; papel continua só com o dono.
17. [x] **Funcionário manda os próprios turnos, gerente aprova** (pedido da equipe, 24/11): turno "Aguardando" até gerente/dono aprovar.

## Fase 2 (só se a equipe pedir)
- Convite pelo próprio app (edge function)
- Cadastro de insumos e fornecedores
- Estoque mínimo com alerta
- Histórico de preços e gastos
- Compartilhar lista/escala no WhatsApp (link, grátis)
- PWA (ícone na tela inicial)
