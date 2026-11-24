import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useToast } from '../../../components/Toast.jsx'
import { Carregando, EstadoErro, EstadoVazio } from '../../../components/Estados.jsx'
import { Etiqueta } from '../../../components/Etiqueta.jsx'
import { BotaoChat } from '../../chat/index.js'
import { DIAS_LONGOS, MESES_LONGOS, fmtSemana, hoje, pad, parseData, segundaDaSemana, somarDias, ymd } from '../../../lib/datas.js'
import { fmtHoras, minutosNaSemana, minutosNoMes, viraODia } from '../horas.js'
import { listarTurnos, criarTurno, editarTurno, apagarTurno, copiarSemana, apagarVarios } from '../services.js'
import { TurnoForm } from './TurnoForm.jsx'

export function EscalaPage() {
  const { perfil, souGestor } = useAuth()
  const { equipe } = useOutletContext()
  const toast = useToast()
  const [semana, setSemana] = useState(() => segundaDaSemana(hoje()))
  const [turnos, setTurnos] = useState([])
  const [estado, setEstado] = useState('carregando')
  const [form, setForm] = useState(null)
  const [copiando, setCopiando] = useState(false)

  // mês de referência = mês da quinta-feira da semana
  const meio = parseData(somarDias(semana, 3))
  const inicioMes = ymd(new Date(meio.getFullYear(), meio.getMonth(), 1))
  const fimMes = ymd(new Date(meio.getFullYear(), meio.getMonth() + 1, 1))
  const de_ = inicioMes < semana ? inicioMes : semana
  const ate = fimMes > somarDias(semana, 7) ? fimMes : somarDias(semana, 7)

  const carregar = useCallback(
    async (silencioso) => {
      if (!silencioso) setEstado('carregando')
      const { data, error } = await listarTurnos(de_, ate)
      if (error) return silencioso ? toast(error, { erro: true }) : setEstado(error)
      setTurnos(data)
      setEstado('ok')
    },
    [de_, ate, toast],
  )
  useEffect(() => {
    carregar()
  }, [carregar])

  const daSemana = turnos.filter((t) => t.data >= semana && t.data < somarDias(semana, 7))
  const atual = semana === segundaDaSemana(hoje())
  const pessoa = (id) => equipe.find((p) => p.id === id)

  const salvar = async (d) => {
    const { error } = form.id ? await editarTurno(form.id, d) : await criarTurno(d)
    if (error) return error
    setForm(null)
    toast('Turno salvo')
    carregar(true)
  }
  const apagar = async () => {
    const t = form
    const { error } = await apagarTurno(t.id)
    if (error) return toast(error, { erro: true })
    setForm(null)
    carregar(true)
    toast(`Turno de ${pessoa(t.profile_id)?.nome || 'alguém'} apagado`, {
      desfazer: async () => {
        const r = await criarTurno(t)
        if (r.error) toast(r.error, { erro: true })
        carregar(true)
      },
    })
  }
  const copiar = async () => {
    setCopiando(true)
    const ativos = new Set(equipe.filter((p) => p.ativo).map((p) => p.id))
    const { data, error } = await copiarSemana(somarDias(semana, -7), semana, ativos)
    setCopiando(false)
    if (error) return toast(error, { erro: true })
    carregar(true)
    const n = data.criados.length
    toast(`${n} turno${n !== 1 ? 's' : ''} copiado${n !== 1 ? 's' : ''}${data.pulados ? `, ${data.pulados} pulado${data.pulados !== 1 ? 's' : ''} (horário ocupado ou pessoa desativada)` : ''}`, {
      desfazer: n
        ? async () => {
            const r = await apagarVarios(data.criados)
            if (r.error) toast(r.error, { erro: true })
            carregar(true)
          }
        : null,
    })
  }

  const minSem = minutosNaSemana(turnos, perfil.id, semana)
  const minMes = minutosNoMes(turnos, perfil.id, meio.getFullYear(), meio.getMonth())
  const linhasEquipe = souGestor
    ? equipe
        .filter((p) => p.ativo || daSemana.some((t) => t.profile_id === p.id))
        .map((p) => ({ p, m: minutosNaSemana(turnos, p.id, semana) }))
        .sort((a, b) => b.m - a.m)
    : []
  const maxMin = Math.max(1, ...linhasEquipe.map((r) => r.m))

  return (
    <>
      <div className="topo">
        <div>
          <h1>Escala</h1>
          <p>{atual ? 'Esta semana' : semana < segundaDaSemana(hoje()) ? 'Semana que já passou' : 'Semana que vem pela frente'}</p>
        </div>
        <div className="acoes-topo">
          {!atual && (
            <button className="btn peq" onClick={() => setSemana(segundaDaSemana(hoje()))}>
              Hoje
            </button>
          )}
          <BotaoChat sala="escalas" />
        </div>
      </div>

      <div className="semana">
        <button onClick={() => setSemana(somarDias(semana, -7))} aria-label="Semana anterior">
          ‹
        </button>
        <strong>{fmtSemana(semana)}</strong>
        <button onClick={() => setSemana(somarDias(semana, 7))} aria-label="Próxima semana">
          ›
        </button>
      </div>

      {estado === 'carregando' && <Carregando />}
      {estado !== 'carregando' && estado !== 'ok' && <EstadoErro mensagem={estado} onTentar={() => carregar()} />}
      {estado === 'ok' && (
        <>
          <div className="escala-resumo">
          <div className="horas">
            <div>
              <div className="l">Suas horas</div>
              <div className="n">{fmtHoras(minSem)}</div>
            </div>
            <div className="l direita">
              nesta semana
              <br />
              {fmtHoras(minMes)} em {MESES_LONGOS[meio.getMonth()]}
            </div>
          </div>

          {souGestor && (
            <div className="escala-equipe">
              <div className="secao">
                <span>Horas da equipe na semana</span>
              </div>
              <div className="equipe-horas">
                {linhasEquipe.map(({ p, m }) => (
                  <div className="r" key={p.id}>
                    <span>{p.nome}</span>
                    <span className="barra">
                      <i style={{ width: `${Math.round((m / maxMin) * 100)}%` }} />
                    </span>
                    <b>{fmtHoras(m)}</b>
                  </div>
                ))}
              </div>
              <div className="copiar-semana">
                <button className="btn cheio" onClick={copiar} disabled={copiando}>
                  {copiando ? 'Copiando…' : 'Copiar semana anterior'}
                </button>
              </div>
            </div>
          )}
          </div>

          {!daSemana.length && (
            <EstadoVazio titulo="Semana sem turnos">{souGestor ? 'Copie a semana anterior ou adicione turno por dia.' : 'A escala desta semana ainda não saiu.'}</EstadoVazio>
          )}

          <div className="secao">
            <span>Dias</span>
          </div>
          <div className="lista dias">
            {Array.from({ length: 7 }, (_, i) => {
              const d = somarDias(semana, i)
              const dt = parseData(d)
              const doDia = daSemana.filter((t) => t.data === d)
              return (
                <div key={d} className={`dia ${d === hoje() ? 'hoje' : ''}`}>
                  <h3>
                    {DIAS_LONGOS[dt.getDay()]}{' '}
                    <span>
                      {pad(dt.getDate())}/{pad(dt.getMonth() + 1)}
                      {d === hoje() ? ' · hoje' : ''}
                    </span>
                  </h3>
                  {doDia.length ? (
                    doDia.map((t) => {
                      const p = pessoa(t.profile_id)
                      const meu = t.profile_id === perfil.id
                      const conteudo = (
                        <>
                          <span className="h">
                            {t.inicio} às {t.fim}
                            {viraODia(t.inicio, t.fim) ? ' (dia seguinte)' : ''}
                          </span>
                          <span className="p">
                            {meu ? <b>Você</b> : p?.nome || 'Alguém'}
                            {p && !p.ativo && (
                              <>
                                {' '}
                                <Etiqueta>Desativado</Etiqueta>
                              </>
                            )}
                            {t.observacao && <small>{t.observacao}</small>}
                          </span>
                        </>
                      )
                      return souGestor ? (
                        <button key={t.id} className={`turno ${meu ? 'meu' : ''}`} onClick={() => setForm(t)}>
                          {conteudo}
                        </button>
                      ) : (
                        <div key={t.id} className={`turno ${meu ? 'meu' : ''}`}>
                          {conteudo}
                        </div>
                      )
                    })
                  ) : (
                    <div className="vazio-dia">Ninguém escalado</div>
                  )}
                  {souGestor && (
                    <button className="btn peq mais-turno" onClick={() => setForm({ data: d })}>
                      + Turno
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {form && <TurnoForm turno={form} equipe={equipe} onSalvar={salvar} onApagar={apagar} onFechar={() => setForm(null)} />}
    </>
  )
}
