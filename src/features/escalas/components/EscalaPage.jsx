import { useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useToast } from '../../../components/Toast.jsx'
import { Carregando, EstadoErro, EstadoVazio } from '../../../components/Estados.jsx'
import { Etiqueta } from '../../../components/Etiqueta.jsx'
import { BotaoChat } from '../../chat/index.js'
import { DIAS_LONGOS, MESES_LONGOS, fmtDia, fmtSemana, hoje, pad, parseData, segundaDaSemana, somarDias, ymd } from '../../../lib/datas.js'
import { fmtHoras, minutosNaSemana, minutosNoMes, viraODia } from '../horas.js'
import { listarTurnos, listarTurnosAguardando, aprovarTurno, criarTurno, editarTurno, apagarTurno, copiarSemana, apagarVarios } from '../services.js'
import { TurnoForm } from './TurnoForm.jsx'
import { EscalaAbas } from './EscalaAbas.jsx'
import '../calendario.css'

export function EscalaPage() {
  const { perfil, souGestor } = useAuth()
  const { equipe, recarregarPendentes } = useOutletContext()
  const toast = useToast()
  const [semana, setSemana] = useState(() => segundaDaSemana(hoje()))
  const [turnos, setTurnos] = useState([])
  const [estado, setEstado] = useState('carregando')
  const [form, setForm] = useState(null)
  const [copiando, setCopiando] = useState(false)
  // turnos que funcionários mandaram (docs/03): gerente/dono aprova ou recusa, com desfazer por 5s
  const [aguardando, setAguardando] = useState([])
  const [emEspera, setEmEspera] = useState({}) // id do turno -> aprovado (true/false)
  const adiados = useRef(new Map()) // id -> { timer, aprovado }

  // mês de referência = mês da quinta-feira da semana
  const meio = parseData(somarDias(semana, 3))
  const inicioMes = ymd(new Date(meio.getFullYear(), meio.getMonth(), 1))
  const fimMes = ymd(new Date(meio.getFullYear(), meio.getMonth() + 1, 1))
  const de_ = inicioMes < semana ? inicioMes : semana
  const ate = fimMes > somarDias(semana, 7) ? fimMes : somarDias(semana, 7)

  const carregar = useCallback(
    async (silencioso) => {
      if (!silencioso) setEstado('carregando')
      const [r, ag] = await Promise.all([listarTurnos(de_, ate), souGestor ? listarTurnosAguardando(hoje()) : Promise.resolve({ data: [] })])
      if (r.error) return silencioso ? toast(r.error, { erro: true }) : setEstado(r.error)
      setTurnos(r.data)
      setAguardando(ag.data || [])
      setEstado('ok')
      recarregarPendentes()
    },
    [de_, ate, toast, souGestor, recarregarPendentes],
  )
  useEffect(() => {
    carregar()
  }, [carregar])

  // decisão esperando os 5s já aparece na escala (aprovado fica, recusado some)
  const vistos = turnos.filter((t) => emEspera[t.id] !== false).map((t) => (t.id in emEspera ? { ...t, status: 'aprovado' } : t))
  const daSemana = vistos.filter((t) => t.data >= semana && t.data < somarDias(semana, 7))
  const atual = semana === segundaDaSemana(hoje())
  const pessoa = (id) => equipe.find((p) => p.id === id)

  // funcionário mexe só nos próprios turnos que aguardam; gerente/dono em todos
  const podeMexer = (t) => souGestor || (t.profile_id === perfil.id && t.status === 'pendente')

  const salvar = async (d) => {
    const novo = !form.id
    const { data, error } = novo ? await criarTurno(d) : await editarTurno(form.id, d)
    if (error) return error
    setForm(null)
    carregar(true)
    if (souGestor || !novo) return toast(souGestor ? 'Turno salvo' : 'Turno ajustado')
    // funcionário acabou de mandar: dá para desfazer na hora (docs/03)
    toast('Turno mandado. Aguardando o gerente aprovar.', {
      desfazer: async () => {
        const r = await apagarTurno(data.id)
        if (r.error) toast(r.error, { erro: true })
        carregar(true)
      },
    })
  }

  // quem mandou desiste do turno enquanto aguarda (docs/03), com desfazer
  const desistir = async (t) => {
    const { error } = await apagarTurno(t.id)
    if (error) return toast(error, { erro: true })
    carregar(true)
    toast(`Você desistiu do turno de ${fmtDia(t.data)}`, {
      desfazer: async () => {
        const r = await criarTurno(t)
        if (r.error) toast(r.error, { erro: true })
        carregar(true)
      },
    })
  }

  const tirarDaEspera = (id) =>
    setEmEspera((e) => {
      const n = { ...e }
      delete n[id]
      return n
    })
  const enviarDecisaoTurno = useCallback(
    async (id, aprovado) => {
      adiados.current.delete(id)
      const { error } = aprovado ? await aprovarTurno(id) : await apagarTurno(id)
      tirarDaEspera(id)
      if (error) toast(error, { erro: true })
      carregar(true)
    },
    [toast, carregar],
  )
  // saiu da tela antes dos 5s: manda as decisões que estavam esperando
  useEffect(() => {
    const fila = adiados.current
    return () => {
      for (const [id, { timer, aprovado }] of fila) {
        clearTimeout(timer)
        ;(aprovado ? aprovarTurno(id) : apagarTurno(id)).then((r) => r.error && toast(r.error, { erro: true }))
      }
      fila.clear()
    }
  }, [toast])
  const decidirTurno = (t, aprovado) => {
    setEmEspera((e) => ({ ...e, [t.id]: aprovado }))
    const timer = setTimeout(() => enviarDecisaoTurno(t.id, aprovado), 5000)
    adiados.current.set(t.id, { timer, aprovado })
    toast(`Turno de ${pessoa(t.profile_id)?.nome || 'alguém'} ${aprovado ? 'aprovado' : 'recusado'}`, {
      desfazer: () => {
        clearTimeout(timer)
        adiados.current.delete(t.id)
        tirarDaEspera(t.id)
      },
    })
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

  // horas: só turno aprovado (docs/03)
  const aprovados = vistos.filter((t) => t.status === 'aprovado')
  const minSem = minutosNaSemana(aprovados, perfil.id, semana)
  const minMes = minutosNoMes(aprovados, perfil.id, meio.getFullYear(), meio.getMonth())
  const paraAprovar = aguardando.filter((t) => !(t.id in emEspera))
  const linhasEquipe = souGestor
    ? equipe
        .filter((p) => p.ativo || daSemana.some((t) => t.profile_id === p.id))
        .map((p) => ({ p, m: minutosNaSemana(aprovados, p.id, semana) }))
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

      <EscalaAbas />

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
          {souGestor && paraAprovar.length > 0 && (
            <section className="para-aprovar">
              <div className="secao">
                <span>Turnos para aprovar ({paraAprovar.length})</span>
              </div>
              <div className="lista">
                {paraAprovar.map((t) => (
                  <div key={t.id} className="card coluna turno-aprovar">
                    <span className="linha entre">
                      <span>
                        <b>{pessoa(t.profile_id)?.nome || 'Alguém'}</b>
                        <span className="meta">
                          {' '}
                          · {fmtDia(t.data)}, {t.inicio} às {t.fim}
                          {viraODia(t.inicio, t.fim) ? ' (dia seguinte)' : ''}
                        </span>
                      </span>
                      <Etiqueta cor="pend">Aguardando</Etiqueta>
                    </span>
                    {t.observacao && <span className="meta">“{t.observacao}”</span>}
                    <div className="acoes">
                      <button className="btn perigo" onClick={() => decidirTurno(t, false)}>
                        Recusar
                      </button>
                      <button className="btn ok" onClick={() => decidirTurno(t, true)}>
                        Aprovar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
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
            <EstadoVazio titulo="Semana sem turnos">{souGestor ? 'Copie a semana anterior ou adicione turno por dia.' : 'Ninguém montou esta semana ainda. Toque em + Meu turno no dia para mandar seus horários.'}</EstadoVazio>
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
                            {t.status === 'pendente' && (
                              <>
                                {' '}
                                <Etiqueta cor="pend">Aguardando</Etiqueta>
                              </>
                            )}
                            {t.observacao && <small>{t.observacao}</small>}
                          </span>
                        </>
                      )
                      const classe = `turno ${meu ? 'meu' : ''} ${t.status === 'pendente' ? 'aguardando' : ''}`
                      const turno = podeMexer(t) ? (
                        <button className={classe} onClick={() => setForm(t)}>
                          {conteudo}
                        </button>
                      ) : (
                        <div className={classe}>{conteudo}</div>
                      )
                      // meu turno aguardando: botão Desistir à vista, sem abrir o formulário
                      return meu && t.status === 'pendente' ? (
                        <div key={t.id} className="turno-meu-aguardando">
                          {turno}
                          <button className="link desistir" onClick={() => desistir(t)}>
                            Desistir
                          </button>
                        </div>
                      ) : (
                        <div key={t.id} className="turno-wrap">
                          {turno}
                        </div>
                      )
                    })
                  ) : (
                    <div className="vazio-dia">Ninguém escalado</div>
                  )}
                  {souGestor ? (
                    <button className="btn peq mais-turno" onClick={() => setForm({ data: d })}>
                      + Turno
                    </button>
                  ) : (
                    <button className="btn peq mais-turno" onClick={() => setForm({ data: d })}>
                      + Meu turno
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {form && <TurnoForm turno={form} equipe={equipe} meuId={souGestor ? null : perfil.id} onSalvar={salvar} onApagar={apagar} onFechar={() => setForm(null)} />}
    </>
  )
}
