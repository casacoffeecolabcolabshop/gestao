# Restrições

**Objetivo do arquivo:** limites que não se cruzam sem ADR.

## Custo
- Só plano gratuito: Supabase Free, Vercel Hobby.
- Pago encontrado: listar custo, alternativa grátis, impacto e recomendação. Matheus decide. Padrão: adiar.

| Item pago | Alternativa grátis | Status |
|---|---|---|
| WhatsApp API para avisos | Link de compartilhar no WhatsApp | Adiado |
| SMS | E-mail do Supabase | Adiado |

## Legal (LGPD)
- Guardar só nome, e-mail, telefone e turnos. Proibido salário, CPF, documento, dado de saúde.
- Ex-funcionário: desativar o acesso no dia da saída; apagar contato se a pessoa pedir.

## Produto
- Single-tenant: não construir multi-empresa (ADR-002).
- Nada que precise de treinamento para usar.
