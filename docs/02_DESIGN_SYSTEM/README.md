# 02 Design system

Meta: **bateu o olho, entendeu.** Celular primeiro (360px); no computador aproveita a largura (ver Computador).

## Cores (significado fixo)
| Uso | Cor | Token |
|---|---|---|
| Ok, comprado, aprovado | Verde | `--cor-ok` |
| Pendente, aguardando | Amarelo | `--cor-pendente` |
| Recusado, urgente | Vermelho | `--cor-alerta` |
| Ação principal | Cor da marca Casa | `--cor-primaria` |
| Fundo / texto | Claro / quase preto | `--cor-fundo` / `--cor-texto` |

Cor nunca sozinha: sempre com ícone ou palavra (acessibilidade).

## Tamanhos
- Texto base 16px, títulos 20px. Nada abaixo de 14px.
- Alvo de toque mínimo 48px. Botão principal: largura total, no rodapé.
- Espaçamento em múltiplos de 8px.

## Componentes base
`Botao`, `Card`, `Etiqueta` (status colorido), `Toast`, `NavInferior`, `EstadoVazio`, `EstadoErro`, `Carregando`.

## Navegação
Barra inferior fixa: **Compras · Escala · Pedidos · Equipe** (Equipe só gerente/dono). Abre em Compras.
Chat não ocupa a navegação: é o botão **Chat** no topo de Compras e de Escala, e abre em tela cheia.
Conta (nome, telefone, sair): bolinha com a inicial no topo de toda tela.

## Computador (tela a partir de 960px)
Mesmo app, mesmas telas e textos; só muda a arrumação. Celular continua sendo o principal.
- **Navegação na lateral esquerda**, fixa: nome da Casa, botão principal da tela (ex.: **+ Acabou algo**) e os itens Compras · Escala · Pedidos · Equipe em coluna.
- Conteúdo com até 1120px de largura, ao lado da lateral.
- **Compras:** lista à esquerda e o painel **Para comprar** sempre aberto à direita (com check e Baixar PDF).
- **Escala:** dias da semana em grade (até 7 colunas lado a lado quando couber); suas horas e horas da equipe lado a lado.
- **Pedidos e Equipe:** cartões em duas colunas.
- Formulários abrem como janela no centro da tela (no celular sobem do rodapé).
- Chat abre como painel na lateral direita, sem cobrir a tela toda.
- Avisos (toast) aparecem embaixo, centralizados no conteúdo.

## Cores de pessoa (só no Calendário)
Para o calendário ser ilustrativo, cada pessoa ganha uma cor fixa (calculada pelo id, sempre a mesma). A paleta evita verde, amarelo e vermelho para não confundir com ok, pendente e alerta. A cor nunca vem sozinha: sempre com a inicial ou o nome.
