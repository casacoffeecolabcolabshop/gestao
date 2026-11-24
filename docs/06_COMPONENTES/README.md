# 06 Componentes

Componentes base listados em `docs/02_DESIGN_SYSTEM/`. Aqui entra a ficha de cada um (props + quando usar) conforme forem criados.

| Componente | Status |
|---|---|
| `Etiqueta` | Pronto: status com cor e palavra (`ok`, `pend`, `alerta`, `neutro`, `marca`) |
| `Toast` (`useToast`) | Pronto: `toast(msg, { erro, desfazer })`. Sucesso some em 2s (5s com desfazer); erro fica até fechar |
| `NavInferior` | Pronto |
| `Carregando`, `EstadoVazio`, `EstadoErro` | Prontos (`src/components/Estados.jsx`) |
| `Sheet` | Pronto: formulário que sobe do rodapé |
| `AcaoPrincipal` | Pronto: botão grande no rodapé, acima da navegação |
| `BotaoChat`, `ChatPainel` | Prontos (`src/features/chat/`) |
| `ListaForm`, `PainelComprar` | Prontos (`src/features/compras/`): colar vários itens; painel do que falta com Baixar PDF |
