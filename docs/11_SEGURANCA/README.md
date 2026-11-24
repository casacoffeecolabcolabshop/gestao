# 11 Segurança

## Riscos reais deste app
| Risco | Proteção |
|---|---|
| Funcionário mexe na escala ou aprova o próprio pedido | RLS por papel + RPC confere papel (ADR-004) |
| Estranho cria conta | **Risco aceito (ADR-008):** cadastro aberto com Google; dono desativa na tela Equipe |
| Ex-funcionário continua entrando | Dono desativa; RLS bloqueia quem tem `ativo = false` |
| Chave vazada | Só `anon` no front; `.env` fora do git; `service_role` nunca no app |
| Vazar telefone da equipe | Só dados mínimos; nada de log com dado pessoal |

## Checklist antes de ir para produção
- [x] RLS ligado em todas as tabelas (`profiles`, `shopping_items`, `shifts`, `shift_requests`, `chat_messages`)
- [x] Testado: funcionário não consegue criar turno nem aprovar pedido (via console, não só pela tela)
- [x] Testado: usuário desativado não lê nada
- [x] Cadastro aberto de propósito (ADR-008, risco aceito); dono confere a tela Equipe
- [x] `.env` no `.gitignore`, só `.env.example` versionado
- [x] Rota protegida checa sessão antes de renderizar (revisão 24/11: sem login cai no login; funcionário em /equipe volta para Compras; desativado vê "Acesso desativado")
- [x] Inputs validados (revisão 24/11: item duplicado, nome vazio, senha curta/diferente, turno sem pessoa e sobreposto, folga sem dia ou no passado)
- [x] `npm audit` sem crítica (2 moderadas no react-router adiadas, `memory/bugs.md` B-001)

## LGPD
Só nome, e-mail, telefone e turnos. Na saída de alguém: desativar no mesmo dia; apagar contato se pedir.
