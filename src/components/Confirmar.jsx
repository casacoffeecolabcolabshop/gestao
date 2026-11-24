import { useEffect, useRef, useState } from 'react'

// Única confirmação do app (docs/02, exceção): pergunta curta, ação em vermelho e Voltar.
export function Confirmar({ titulo, texto, acao, onConfirmar, onVoltar }) {
  const voltar = useRef(null)
  const aoVoltar = useRef(onVoltar)
  aoVoltar.current = onVoltar
  const [ocupado, setOcupado] = useState(false)

  // roda uma vez só: a lista ao vivo atualiza a tela por trás sem tirar o foco daqui
  useEffect(() => {
    voltar.current?.focus() // foco no lado seguro
    const esc = (e) => e.key === 'Escape' && aoVoltar.current()
    document.addEventListener('keydown', esc)
    document.body.classList.add('sem-rolagem')
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.classList.remove('sem-rolagem')
    }
  }, [])

  const confirmar = async () => {
    setOcupado(true)
    await onConfirmar()
    setOcupado(false)
  }

  return (
    <div className="veu veu-centro" onClick={(e) => e.target === e.currentTarget && onVoltar()}>
      <div className="confirmar" role="alertdialog" aria-modal="true" aria-labelledby="confirmar-titulo" aria-describedby="confirmar-texto">
        <h2 id="confirmar-titulo">{titulo}</h2>
        {texto && <p id="confirmar-texto">{texto}</p>}
        <div className="acoes">
          <button ref={voltar} className="btn" onClick={onVoltar} disabled={ocupado}>
            Voltar
          </button>
          <button className="btn perigo-cheio" onClick={confirmar} disabled={ocupado}>
            {acao}
          </button>
        </div>
      </div>
    </div>
  )
}
