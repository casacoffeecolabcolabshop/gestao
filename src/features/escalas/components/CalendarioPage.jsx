import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { Sheet } from '../../../components/Sheet.jsx'
import { Carregando, EstadoErro } from '../../../components/Estados.jsx'
import { Etiqueta } from '../../../components/Etiqueta.jsx'
import { BotaoChat } from '../../chat/index.js'
import { DIAS, DIAS_LONGOS, MESES_LONGOS, fmtDia, hoje, parseData, somarDias } from '../../../lib/datas.js'
import { viraODia } from '../horas.js'
import { listarTurnos } from '../services.js'
import { coresDaEquipe, montarMes, turnosPorDia } from '../calendario.js'
import { EscalaAbas } from './EscalaAbas.jsx'
import '../calendario.css'

const CABECALHO = [1, 2, 3, 4, 5, 6, 0].map((d) => DIAS[d]) // segunda a domingo

// Calendário do mês (docs/03): quem trabalha em cada dia, com cor por pessoa (docs/02).
export function CalendarioPage() {
  const { perfil } = useAuth()
  const { equipe } = useOutletContext()
  const [mes, setMes] = useState(() => {
    const d = parseData(hoje())
    return { ano: d.getFullYear(), mes: d.getMonth() }
  })
  const [turnos, setTurnos] = useState([])
  const [estado, setEstado] = useState('carregando')
  const [dia, setDia] = useState(null) // dia aberto no detalhe

  const semanas = montarMes(mes.ano, mes.mes)
  const de_ = semanas[0][0].data
  const ate = somarDias(semanas.at(-1)[6].data, 1)

  const carregar = useCallback(async () => {
    setEstado('carregando')
    const { data, error } = await listarTurnos(de_, ate)
    if (error) return setEstado(error)
    setTurnos(data)
    setEstado('ok')
  }, [de_, ate])
  useEffect(() => {
    carregar()
  }, [carregar])

  const porDia = turnosPorDia(turnos)
  const corDaPessoa = coresDaEquipe(equipe.map((p) => p.id))
  const pessoa = (id) => equipe.find((p) => p.id === id)
  const nome = (id) => (id === perfil.id ? 'Você' : pessoa(id)?.nome || 'Alguém')
  const primeiroNome = (id) => (id === perfil.id ? 'Você' : (pessoa(id)?.nome || 'Alguém').split(' ')[0])
  const mudarMes = (n) =>
    setMes(({ ano, mes: m }) => {
      const d = new Date(ano, m + n, 1)
      return { ano: d.getFullYear(), mes: d.getMonth() }
    })
  const ehMesAtual = (() => {
    const d = parseData(hoje())
    return d.getFullYear() === mes.ano && d.getMonth() === mes.mes
  })()

  // legenda: quem aparece no mês
  const noMes = [...new Set(turnos.filter((t) => t.data.slice(5, 7) === String(mes.mes + 1).padStart(2, '0')).map((t) => t.profile_id))]
    .map((id) => ({ id, nome: primeiroNome(id) }))
    .sort((a, b) => a.nome.localeCompare(b.nome))

  const descreverDia = (d) => {
    const ts = porDia[d] || []
    const dt = parseData(d)
    const quem = ts.length ? ts.map((t) => `${nome(t.profile_id)} ${t.inicio} às ${t.fim}${t.status === 'pendente' ? ' (aguardando)' : ''}`).join(', ') : 'ninguém escalado'
    return `${DIAS_LONGOS[dt.getDay()]} ${dt.getDate()}: ${quem}`
  }

  return (
    <>
      <div className="topo">
        <div>
          <h1>Calendário</h1>
          <p>Quem trabalha em cada dia</p>
        </div>
        <div className="acoes-topo">
          {!ehMesAtual && (
            <button
              className="btn peq"
              onClick={() => {
                const d = parseData(hoje())
                setMes({ ano: d.getFullYear(), mes: d.getMonth() })
              }}
            >
              Hoje
            </button>
          )}
          <BotaoChat sala="escalas" />
        </div>
      </div>

      <EscalaAbas />

      <div className="semana">
        <button onClick={() => mudarMes(-1)} aria-label="Mês anterior">
          ‹
        </button>
        <strong>
          {MESES_LONGOS[mes.mes]} de {mes.ano}
        </strong>
        <button onClick={() => mudarMes(1)} aria-label="Próximo mês">
          ›
        </button>
      </div>

      {estado === 'carregando' && <Carregando />}
      {estado !== 'carregando' && estado !== 'ok' && <EstadoErro mensagem={estado} onTentar={carregar} />}
      {estado === 'ok' && (
        <>
          {noMes.length > 0 && (
            <ul className="cal-legenda" aria-label="Pessoas no mês">
              {noMes.map((p) => (
                <li key={p.id}>
                  <span className="cal-bolinha" style={{ '--cor': corDaPessoa(p.id) }} aria-hidden="true">
                    {p.nome.slice(0, 1)}
                  </span>
                  {p.nome}
                </li>
              ))}
              <li className="cal-legenda-aguarda">
                <span className="cal-bolinha aguardando" aria-hidden="true" />
                Aguardando aprovação
              </li>
            </ul>
          )}

          <div className="cal" role="grid" aria-label={`Calendário de ${MESES_LONGOS[mes.mes]}`}>
            <div className="cal-linha cal-cabeca" role="row">
              {CABECALHO.map((d) => (
                <span key={d} role="columnheader">
                  {d}
                </span>
              ))}
            </div>
            {semanas.map((s) => (
              <div className="cal-linha" role="row" key={s[0].data}>
                {s.map(({ data, doMes }) => {
                  const ts = porDia[data] || []
                  return (
                    <button
                      key={data}
                      role="gridcell"
                      className={`cal-dia ${doMes ? '' : 'fora'} ${data === hoje() ? 'hoje' : ''}`}
                      onClick={() => setDia(data)}
                      aria-label={descreverDia(data)}
                    >
                      <span className="cal-num">{parseData(data).getDate()}</span>
                      <span className="cal-gente">
                        {ts.map((t) => (
                          <span
                            key={t.id}
                            className={`cal-turno ${t.status === 'pendente' ? 'aguardando' : ''} ${t.profile_id === perfil.id ? 'meu' : ''}`}
                            style={{ '--cor': corDaPessoa(t.profile_id) }}
                          >
                            <span className="cal-bolinha">{primeiroNome(t.profile_id).slice(0, 1)}</span>
                            <span className="cal-nome">
                              {primeiroNome(t.profile_id)} <small>{t.inicio}</small>
                            </span>
                          </span>
                        ))}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {dia && (
        <Sheet titulo={`${DIAS_LONGOS[parseData(dia).getDay()]}, ${fmtDia(dia).slice(4)}`} onFechar={() => setDia(null)}>
          {(porDia[dia] || []).length ? (
            <div className="lista">
              {porDia[dia].map((t) => (
                <div key={t.id} className={`turno ${t.profile_id === perfil.id ? 'meu' : ''} ${t.status === 'pendente' ? 'aguardando' : ''}`}>
                  <span className="cal-bolinha" style={{ '--cor': corDaPessoa(t.profile_id) }} aria-hidden="true">
                    {primeiroNome(t.profile_id).slice(0, 1)}
                  </span>
                  <span className="p">
                    <b>{nome(t.profile_id)}</b>
                    {t.status === 'pendente' && (
                      <>
                        {' '}
                        <Etiqueta cor="pend">Aguardando</Etiqueta>
                      </>
                    )}
                    <small>
                      {t.inicio} às {t.fim}
                      {viraODia(t.inicio, t.fim) ? ' (dia seguinte)' : ''}
                      {t.observacao ? ` · ${t.observacao}` : ''}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="dica cal-vazio">Ninguém escalado nesse dia. Para mandar ou mudar horários, use a aba Semana.</p>
          )}
          <button className="btn cheio cal-fechar" onClick={() => setDia(null)}>
            Fechar
          </button>
        </Sheet>
      )}
    </>
  )
}
