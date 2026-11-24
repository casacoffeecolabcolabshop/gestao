// Nome da Casa num lugar só (ADR-002).
export const CASA = {
  nome: 'Casa Coffee Colab',
  app: 'Casa Gestão',
}

// Botão "Entrar com Google" (ADR-008). Só liga onde o provedor Google está configurado no Supabase.
export const LOGIN_GOOGLE = import.meta.env.VITE_LOGIN_GOOGLE === 'true'
