# Casa Gestão: regras do projeto

## Princípio nº 1: bateu o olho, entendeu (inegociável)
Quem usa é equipe de cafeteria, no celular, no meio do turno. Se precisa explicar, está errado.

- Uma tela, uma tarefa. Nada de menu escondido ou configuração.
- No máximo 4 itens na navegação inferior: **Compras, Escala, Pedidos, Equipe** (Equipe só para gerente/dono).
- Botão principal grande, no rodapé, ao alcance do polegar.
- Texto curto e direto ("Acabou o leite"), sem jargão.
- Cor tem significado fixo: verde = ok/comprado/aprovado, amarelo = pendente, vermelho = recusado/urgente.
- Toda ação dá retorno na hora (toast curto). Desfazer em vez de "tem certeza?".
- Estados sempre visíveis: carregando, vazio (com o que fazer), erro (com tentar de novo).
- Na dúvida entre mais uma feature e simplicidade, simplicidade vence.

## Fonte de verdade
- `memory/`: identidade, decisões, padrões, restrições.
- `docs/03_REGRAS_DE_NEGOCIO/`: comportamento e permissões.
- `docs/08_DECISOES/`: ADRs. ADR-001 define a stack.
- Banco: `supabase/schema.sql`.
- Doc e código em conflito: a doc vale, e se a doc estiver errada, corrige a doc.

## Escopo
Ferramenta interna só da Casa (single-tenant, ADR-002). Não construir multi-empresa, planos ou white-label.

## Custo
Tudo no plano gratuito (Supabase Free, Vercel Hobby). Qualquer coisa paga é adiada e vai para decisão do Matheus com custo, alternativa grátis e impacto.

## Segurança (todo código novo)
- Nada de chave ou URL hardcodada: usar `import.meta.env.VITE_*`.
- `service_role` nunca no front.
- RLS em toda tabela nova, antes de usar.
- Validar input antes de gravar.
- Nunca logar dado pessoal ou token.
- Rota protegida só renderiza depois de checar sessão.

## Código
- Organização por feature: `src/features/<compras|escalas|equipe|auth>/`.
- Acesso ao Supabase só via `src/lib/` e `services` da feature, nunca direto no componente.
- Domínio em português (`marcarComoComprado`), técnico em inglês (`handleSubmit`).
- CSS separado do JSX.
- Todo `await supabase...` checa `.error`.
- `npm test` antes de commitar; função pura nasce com teste (ex.: cálculo de horas).
- Textos da interface em pt-BR, sem travessão.
