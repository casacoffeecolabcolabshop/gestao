# ADR-008: Entrar com Google, sem convite

- **Status:** Aceito
- **Data:** 2026-11-24
- **Substitui:** ADR-003 (acesso só por convite)

## Contexto
O Matheus quer que a equipe entre com a conta do Google, sem precisar de convite. O argumento: só a equipe vai ter o link do app.

## Decisão
- Botão **Entrar com Google** na tela de login (Supabase Auth, provedor Google).
- Cadastro aberto no Supabase: qualquer conta Google que entrar vira **funcionário ativo** na hora, com o nome que o Google manda.
- Convite pelo painel continua funcionando; e-mail e senha continuam funcionando para quem já tem.
- O dono ajusta papel e desativa quem não for da equipe na tela **Equipe**.

## Risco aceito (decisão do Matheus, 24/11)
O link não é segredo: está no repositório público do GitHub e endereços `*.vercel.app` são achados por buscadores. Qualquer pessoa que achar o link e entrar vê telefones da equipe, escala, chats e lista de compras até o dono desativar.
O Supabase não deixa abrir só o Google: o cadastro por e-mail e senha também fica aberto pela API (sem tela no app; na nuvem exige confirmar o e-mail).

## Alternativas
- Entrar com Google + dono libera cada pessoa nova (tela "Aguardando liberação"): protege os dados; recusado por enquanto pelo Matheus.
- Bloquear cadastro por e-mail com gatilho no banco: mais uma peça para manter; recusado.

## Consequências
- Dono precisa olhar a tela Equipe de vez em quando e desativar quem não reconhecer.
- Se aparecer estranho, voltar para "dono libera" é uma mudança pequena (conta nova nasce `ativo = false`).
- Precisa de cliente OAuth no Google Cloud (grátis) e do provedor Google ligado no Supabase.
