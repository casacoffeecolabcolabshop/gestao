export function Carregando({ texto = 'Carregando…' }) {
  return (
    <div className="estado" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  )
}

export function EstadoVazio({ titulo, children }) {
  return (
    <div className="estado">
      <strong>{titulo}</strong>
      {children}
    </div>
  )
}

export function EstadoErro({ mensagem, onTentar }) {
  return (
    <div className="estado" role="alert">
      <strong>Não deu para carregar</strong>
      {mensagem}
      {onTentar && (
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={onTentar}>
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  )
}
