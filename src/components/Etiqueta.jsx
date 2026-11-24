// Cor nunca sozinha: sempre com palavra. cor: ok | pend | alerta | neutro | marca
export function Etiqueta({ cor = 'neutro', children }) {
  return <span className={`tag ${cor}`}>{children}</span>
}
