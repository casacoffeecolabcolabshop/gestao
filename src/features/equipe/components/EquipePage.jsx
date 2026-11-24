import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useToast } from '../../../components/Toast.jsx'
import { Etiqueta } from '../../../components/Etiqueta.jsx'
import { EstadoVazio } from '../../../components/Estados.jsx'
import { alterarPapel, ativarDesativar } from '../services.js'

const PAPEL = { dono: 'Dono', gerente: 'Gerente', funcionario: 'Funcionário' }

export function EquipePage() {
  const { perfil, souDono } = useAuth()
  const { equipe, recarregarEquipe } = useOutletContext()
  const toast = useToast()
  const lista = [...equipe].sort((a, b) => b.ativo - a.ativo || a.nome.localeCompare(b.nome))

  const mudarPapel = async (p, papel) => {
    const antigo = p.papel
    const { error } = await alterarPapel(p.id, papel)
    if (error) return toast(error, { erro: true })
    await recarregarEquipe()
    toast(`${p.nome} agora é ${PAPEL[papel]}`, {
      desfazer: async () => {
        const r = await alterarPapel(p.id, antigo)
        if (r.error) toast(r.error, { erro: true })
        recarregarEquipe()
      },
    })
  }

  const alternarAtivo = async (p) => {
    const { error } = await ativarDesativar(p.id, !p.ativo)
    if (error) return toast(error, { erro: true })
    await recarregarEquipe()
    toast(`${p.nome} ${p.ativo ? 'desativado' : 'reativado'}`, {
      desfazer: async () => {
        const r = await ativarDesativar(p.id, p.ativo)
        if (r.error) toast(r.error, { erro: true })
        recarregarEquipe()
      },
    })
  }

  return (
    <>
      <div className="topo">
        <div>
          <h1>Equipe</h1>
          <p>{equipe.filter((p) => p.ativo).length} pessoas ativas</p>
        </div>
      </div>
      {!souDono && <p className="dica topo-dica">Só o dono muda papel ou desativa alguém.</p>}
      {!lista.length && <EstadoVazio titulo="Ninguém na equipe ainda">Quem entrar com Google aparece aqui.</EstadoVazio>}
      <div className="lista">
        {lista.map((p) => {
          const eu = p.id === perfil.id
          return (
            <div key={p.id} className={`card ${p.ativo ? '' : 'apagado'}`}>
              <div className="corpo">
                <span className="titulo">
                  {p.nome}
                  {eu ? ' (você)' : ''}
                </span>
                <span className="linha">
                  <Etiqueta cor={p.papel === 'funcionario' ? 'neutro' : 'marca'}>{PAPEL[p.papel]}</Etiqueta>
                  {p.ativo ? <Etiqueta cor="ok">Ativo</Etiqueta> : <Etiqueta cor="alerta">Desativado</Etiqueta>}
                </span>
                <span className="meta">{p.telefone || 'Sem telefone'}</span>
              </div>
              {souDono && !eu && (
                <div className="pessoa-acoes">
                  <select aria-label={`Papel de ${p.nome}`} value={p.papel} disabled={!p.ativo} onChange={(e) => mudarPapel(p, e.target.value)}>
                    {Object.entries(PAPEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <button className={`btn peq ${p.ativo ? 'perigo' : ''}`} onClick={() => alternarAtivo(p)}>
                    {p.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="secao">
        <span>Gente nova</span>
      </div>
      <p className="dica">
        Quem entra com Google aparece aqui como Funcionário, sem convite. Não reconhece alguém? Desative. O papel muda aqui.
      </p>
    </>
  )
}
