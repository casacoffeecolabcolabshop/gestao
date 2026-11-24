# 01 Arquitetura

```
Celular/PC ──> App React (Vercel) ──> Supabase
                                      ├─ Auth (e-mail + senha, por convite)
                                      ├─ Postgres + RLS (permissão por papel)
                                      └─ RPC (aprovar pedido de troca/folga)
```

- SPA React + Vite, React Router, deploy na Vercel (grátis).
- Front fala direto com o Supabase usando a chave `anon`. Quem decide o que cada um pode é o **RLS** no banco, não a tela.
- Ações com várias etapas (aprovar troca = mudar status + trocar pessoa do turno) ficam numa função SQL, para não ficar meio feito.
- Sem servidor próprio, sem edge function no MVP.
- Ambiente: `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Decisões: ADR-001, ADR-002, ADR-004.
