# Casa Gestão

Sistema interno da Casa Coffee Colab para duas coisas:

1. **Compras**: lista colaborativa do que está acabando (insumos e produtos).
2. **Escalas**: grade semanal de turnos, pedidos de troca e folga, total de horas.

Regra de ouro: **bateu o olho, entendeu.**

## Por onde começar
- `CLAUDE.md`: regras do projeto (ler antes de codar)
- `memory/identity.md`: o que é o produto
- `docs/03_REGRAS_DE_NEGOCIO/`: o que o sistema faz e quem pode o quê
- `docs/09_BACKLOG/`: o que construir, em ordem
- `supabase/schema.sql`: banco + permissões

## Stack
React + Vite, Supabase (auth + banco + RLS), Vercel. Tudo no plano gratuito.
