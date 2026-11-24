import { useEffect, useState } from 'react'

// Mesmo corte do CSS (docs/02, Computador): a partir de 960px a tela muda de arrumação.
const CONSULTA = '(min-width: 960px)'

export function useComputador() {
  const [sim, setSim] = useState(() => window.matchMedia(CONSULTA).matches)
  useEffect(() => {
    const mq = window.matchMedia(CONSULTA)
    const mudou = () => setSim(mq.matches)
    mq.addEventListener('change', mudou)
    return () => mq.removeEventListener('change', mudou)
  }, [])
  return sim
}
