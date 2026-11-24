# Migrations
`schema.sql` é a foto atual. Toda mudança depois da primeira subida vira arquivo aqui: `AAAAMMDDHHMMSS_descricao.sql` (formato que o Supabase CLI exige), e o `schema.sql` é atualizado junto.

## Projeto na nuvem (`makrghducycdotzbknig`)
As migrations foram aplicadas pelo SQL Editor do painel, não pelo CLI. Antes do primeiro `supabase db push` nesse projeto, marcar como aplicadas para não rodar de novo:
```
npx supabase link --project-ref makrghducycdotzbknig
npx supabase migration repair --status applied 20261124000000 20261124010000 20261124020000 20261124030000 20261124040000
```
