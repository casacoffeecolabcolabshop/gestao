# ADR-005: Chat da equipe com Supabase Realtime

- **Status:** Aceito · **Data:** 2026-11-24

## Contexto
O Matheus pediu um chat para compras e um para escalas, entre toda a equipe. Hoje essa conversa acontece no grupo do WhatsApp, longe da lista e da escala.

## Decisão
Tabela `chat_messages` com `sala` (`compras` ou `escalas`), RLS igual ao resto (equipe ativa lê e escreve; apaga a própria; gestor apaga qualquer uma; ninguém edita). Mensagens chegam ao vivo pelo Supabase Realtime (`postgres_changes`), que respeita o RLS. O chat abre pelo botão **Chat** no topo de Compras e de Escala, para não passar de 4 itens na navegação. Não lidas contadas a partir da última abertura, guardada no navegador.

## Alternativas
- Grupo do WhatsApp: continua espalhado e fora do app.
- Tabela por chat ou chat por item/turno: mais complexo sem pedido real.
- Serviço de chat pago: fere a regra de custo zero.

## Consequências
- Grátis no plano Free (Realtime incluso).
- Contador de não lidas é por aparelho (não sincroniza entre celular e PC). Aceitável no MVP.
- Sem notificação push: a pessoa vê o número ao abrir o app (Fase 2, se pedirem).
