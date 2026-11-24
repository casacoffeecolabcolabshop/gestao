# Casa Gestão

Sistema interno da Casa Coffee Colab para três coisas:

1. **Compras**: lista colaborativa do que está acabando (insumos e produtos), ao vivo.
2. **Escalas**: grade semanal de turnos, pedidos de troca e folga, total de horas.
3. **Chat da equipe**: um chat de compras e um de escala (ADR-005).

Regra de ouro: **bateu o olho, entendeu.**

## Rodar tudo local (ADR-006)
Precisa de Node 20+ e Docker rodando.

```bash
npm install
npm run db:start      # sobe o Supabase local e cria banco + equipe de teste
npm run dev           # app em http://localhost:5173
```

`.env.local` aponta o app para o Supabase local (já vem com as chaves de demonstração do CLI):
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

**Equipe de teste** (senha `casa1234` para todos, só existe no local):

| E-mail | Pessoa | Papel |
|---|---|---|
| dono@casa.local | Matheus | Dono |
| gerente@casa.local | Carla | Gerente |
| joao@casa.local | João | Funcionário |
| bia@casa.local | Bia | Funcionária |
| rafa@casa.local | Rafa | Funcionário |
| lu@casa.local | Lu | Desativada |

Dica: abra uma janela anônima com outra pessoa para ver lista e chat atualizando ao vivo.

| Endereço | O que é |
|---|---|
| http://localhost:5173 | App |
| http://127.0.0.1:54323 | Supabase Studio (tabelas, convidar usuário) |
| http://127.0.0.1:54324 | Caixa de e-mail local (convites e "esqueci a senha") |

## Testes
```bash
npm test              # funções puras (horas, datas)
npm run test:rls      # permissões direto no banco local (apaga e recria os dados de teste)
npm run db:reset      # volta o banco local ao estado inicial
npm run db:stop       # desliga o Supabase local
```

## Por onde começar
- `CLAUDE.md`: regras do projeto (ler antes de codar)
- `memory/identity.md`: o que é o produto
- `docs/03_REGRAS_DE_NEGOCIO/`: o que o sistema faz e quem pode o quê
- `docs/09_BACKLOG/`: o que construir, em ordem
- `supabase/schema.sql`: banco + permissões (foto atual); `supabase/migrations/`: o que é aplicado

## Stack
React + Vite, Supabase (auth + banco + RLS + realtime), Vercel. Tudo no plano gratuito.
