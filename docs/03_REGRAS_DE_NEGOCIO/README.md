# 03 Regras de negócio

## Papéis e permissões
| Ação | Funcionário | Gerente | Dono |
|---|---|---|---|
| Ver lista de compras | ✅ | ✅ | ✅ |
| Adicionar item na lista (um ou vários de uma vez) | ✅ | ✅ | ✅ |
| Ver painel "Para comprar" e baixar o PDF | ✅ | ✅ | ✅ |
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
- **Vários de uma vez:** a pessoa escreve ou cola uma lista, um item por linha. `Nome - quantidade` ou `Nome: quantidade` (quantidade opcional). Marcadores no começo da linha (`-`, `*`, `•`, `1.`, `[ ]`) e linhas vazias são ignorados. Linha repetida na própria lista entra uma vez só. O tipo (insumo/produto) e o urgente valem para todos os itens colados. Máximo 50 itens por vez. Item que já está pendente é pulado e a pessoa vê quantos entraram e quantos já estavam na lista.
- **Painel "Para comprar":** mostra só os pendentes, em três grupos nesta ordem: Urgentes, Insumos, Produtos (dentro de cada grupo, mais antigos primeiro). Cada item mostra nome, quantidade e observação. Gerente e dono têm um check em cada item para marcar como comprado ali mesmo, um por vez (a compra pode ser feita aos poucos). O item marcado fica verde e riscado no painel até ele ser fechado, pode ser desmarcado, e o topo mostra o progresso ("3 de 9 comprados"). Funcionário vê o painel sem os checks. Dentro do painel, botão **Baixar PDF** gera o arquivo `compras-DD-MM-AAAA.pdf` no próprio aparelho, só com o que ainda falta, nos mesmos grupos, data/hora e um quadradinho para riscar à mão. Nada é enviado para fora do app.

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
- Qualquer pessoa entra com a conta do Google, sem convite, e já vira **funcionário ativo** com o nome do Google (ADR-008). Convite pelo painel e e-mail/senha continuam valendo.
- O dono confere a tela Equipe e desativa quem não for da equipe.
- Pessoa desativada não entra mais, mas o histórico de turnos fica.
