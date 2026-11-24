# 07 APIs (services)

Sem API própria. Cada feature tem um `services.js` que fala com o Supabase.

| Feature | Funções |
|---|---|
| compras | `listarItens()`, `adicionarItem(dados)`, `editarItem(id, dados)`, `marcarComoComprado(id)`, `desfazerCompra(id)`, `apagarItem(id)` |
| escalas | `listarTurnosDaSemana(inicio)`, `criarTurno(dados)`, `editarTurno(id, dados)`, `apagarTurno(id)`, `copiarSemana(origem, destino)`, `horasDaSemana(inicio)` |
| pedidos | `listarPedidos(filtro)`, `pedirFolga(dados)`, `pedirTroca(dados)`, `cancelarPedido(id)`, `decidirPedido(id, aprovado)` → RPC `decidir_pedido` |
| equipe | `listarEquipe()`, `alterarPapel(id, papel)`, `ativarDesativar(id, ativo)` |
| auth | `entrar(email, senha)`, `sair()`, `meuPerfil()` |

Todas retornam `{ data, error }`.
