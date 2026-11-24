# 03 Regras de negócio

## Papéis e permissões
| Ação | Funcionário | Gerente | Dono |
|---|---|---|---|
| Ver lista de compras | ✅ | ✅ | ✅ |
| Adicionar item na lista | ✅ | ✅ | ✅ |
| Editar/apagar item que criou (enquanto pendente) | ✅ | ✅ | ✅ |
| Marcar item como comprado / apagar qualquer item | ❌ | ✅ | ✅ |
| Ver escala da semana (todos) | ✅ | ✅ | ✅ |
| Criar/editar/apagar turnos | ❌ | ✅ | ✅ |
| Pedir troca ou folga | ✅ | ✅ | ✅ |
| Aprovar/recusar pedidos | ❌ | ✅ | ✅ |
| Ver horas de todos | ❌ (só as suas) | ✅ | ✅ |
| Ativar/desativar pessoa, mudar papel | ❌ | ❌ | ✅ |
| Ler e escrever nos chats (compras e escala) | ✅ | ✅ | ✅ |
| Apagar a própria mensagem | ✅ | ✅ | ✅ |
| Apagar mensagem de outra pessoa | ❌ | ✅ | ✅ |

## Compras
- Item tem: nome, quantidade (texto livre, ex. "2 caixas"), tipo (**insumo** ou **produto**), observação opcional, urgente sim/não.
- Status: **pendente** → **comprado**. Comprado registra quem e quando.
- Item igual já pendente (mesmo nome, ignorando maiúscula/acento): avisar "Já está na lista" e não duplicar.
- Comprados somem da lista principal após 7 dias (continuam no banco).
- Ordem da lista: urgentes primeiro, depois mais antigos.

## Escalas
- Turno: pessoa, data, hora início, hora fim, observação opcional (ex. "abre a loja").
- Semana vai de segunda a domingo.
- Turno pode passar da meia-noite (fim < início = termina no dia seguinte).
- Mesma pessoa não pode ter dois turnos sobrepostos.
- Horas = soma de (fim − início) dos turnos da semana e do mês. Sem cálculo de intervalo no MVP.
- Funcionário vê a semana toda, com os próprios turnos destacados.

## Pedidos de troca e folga
- **Folga:** pessoa escolhe um dia e motivo opcional.
- **Troca:** pessoa escolhe um turno dela e, opcionalmente, quem vai cobrir.
- Status: **pendente** → **aprovado** ou **recusado**. Quem decidiu fica registrado.
- Troca aprovada com substituto: o turno passa para o substituto.
- Folga aprovada: turnos da pessoa naquele dia são removidos.
- Só pedido pendente pode ser cancelado, e só por quem pediu.

## Chat da equipe
- Dois chats, um por assunto: **compras** e **escala**. Toda a equipe ativa lê e escreve nos dois.
- Mensagem tem até 500 letras. Não se edita depois de enviada; quem escreveu pode apagar (com desfazer).
- Gerente e dono podem apagar qualquer mensagem (moderação).
- Mensagens chegam ao vivo. O botão **Chat** mostra quantas mensagens novas chegaram desde a última vez que a pessoa abriu.
- Pessoa desativada não lê nem escreve (RLS).

## Equipe
- Ninguém se cadastra sozinho: o dono convida (ADR-003).
- Pessoa desativada não entra mais, mas o histórico de turnos fica.
