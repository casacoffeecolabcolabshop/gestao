# Padrões

**Objetivo do arquivo:** como o código é escrito. Padrão novo entra aqui depois de usado de verdade.

## Pastas
```
src/
  features/
    compras/   components/ services.js  index.js
    escalas/   components/ services.js  horas.js (+ horas.test.js)
    equipe/
    auth/
  components/  # Botao, Card, Toast, NavInferior, EstadoVazio...
  lib/supabase.js
  styles/      # tokens.css (cores, espaços, fontes)
```

## Regras
- Componente não chama Supabase. Chama `services.js` da feature.
- Todo service retorna `{ data, error }` e a tela trata os dois.
- Nomes: domínio em português (`pedirFolga`), técnico em inglês (`useEffect`).
- Estado: `useState` local + `AuthContext` para sessão e papel. Sem Redux.
- Toda tela tem: carregando, vazio, erro, normal.
- Feedback: toast de 2s no sucesso; erro fica até a pessoa agir.

✅ `const { error } = await marcarComoComprado(id)` no componente
❌ `supabase.from('shopping_items').update(...)` dentro do componente
