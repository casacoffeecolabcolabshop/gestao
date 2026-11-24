# 02 Design system

Meta: **bateu o olho, entendeu.** Celular primeiro (360px), funciona no desktop.

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
