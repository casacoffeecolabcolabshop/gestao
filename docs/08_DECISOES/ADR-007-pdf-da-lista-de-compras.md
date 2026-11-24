# ADR-007: PDF da lista de compras gerado no aparelho (jsPDF)

- **Status:** Aceito
- **Data:** 2026-11-24

## Contexto
A equipe quer ver tudo que falta comprar num painel e, se quiser, levar a lista num PDF (mandar no WhatsApp, imprimir). Precisa ser grátis e funcionar no celular sem passo escondido.

## Decisão
O PDF é montado no próprio aparelho com a biblioteca `jspdf` (MIT, grátis), carregada só quando a pessoa toca em **Baixar PDF** (import dinâmico, não pesa na abertura do app). Usa os itens que o painel já carregou: nenhuma chamada nova ao banco, nenhum servidor, nada sai do app.

## Alternativas
- `window.print()` com "Salvar como PDF": sem biblioteca, mas no celular é um passo a mais e pouco óbvio (fere "bateu o olho, entendeu").
- Edge function gerando o PDF: precisa de servidor e de deploy, sem ganho para uma lista curta.

## Consequências
- Nova dependência de front (`jspdf`, versão fixa no `package.json`).
- Fonte padrão do PDF (Helvetica) cobre acentos do português; emoji não aparece no PDF.
