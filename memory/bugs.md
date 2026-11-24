# Bugs conhecidos

**Objetivo do arquivo:** bugs em produção, para não reportar duas vezes.
Severidade: CRÍTICA (dado perdido ou vazado) · ALTA (trava o uso) · MÉDIA · BAIXA.

| ID | Data | Área | O que acontece | Severidade | Status |
|---|---|---|---|---|---|
| B-001 | 2026-11-24 | Dependências | `react-router-dom` 6.30.6 tem 2 alertas moderados no `npm audit` (open redirect com barra invertida em `<Link>`/`useNavigate`; injeção no SSR). O app só navega para rotas internas e não usa SSR, então o risco real é baixo. Correção exige migrar para v7 (mudança grande nas rotas). | BAIXA | Adiado: migrar para v7 numa rodada própria, testando todas as telas |
