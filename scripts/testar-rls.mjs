// Testa as permissões direto no banco local (docs/11): "via console, não só pela tela".
// Rodar com o Supabase local no ar: npm run test:rls   (recria os dados com db reset antes)
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPA_URL || 'http://127.0.0.1:54321'
const KEY = process.env.SUPA_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const SENHA = 'casa1234'
if (!/127\.0\.0\.1|localhost/.test(URL)) throw new Error('Este teste só roda contra o Supabase local')

let falhas = 0
const ok = (cond, nome) => {
  console.log(`${cond ? '✓' : '✗'} ${nome}`)
  if (!cond) falhas++
}
async function como(email) {
  const c = createClient(URL, KEY, { auth: { persistSession: false } })
  const { data, error } = await c.auth.signInWithPassword({ email, password: SENHA })
  return { c, id: data?.user?.id, error }
}

const joao = await como('joao@casa.local')
const carla = await como('gerente@casa.local')
const dono = await como('dono@casa.local')
const lu = await como('lu@casa.local')
const anon = createClient(URL, KEY, { auth: { persistSession: false } })

console.log('\n— Acesso')
ok(!joao.error && !carla.error && !dono.error, 'equipe de teste entra')
{
  const { error } = await anon.auth.signUp({ email: 'estranho@x.com', password: 'abcd12345' })
  ok(Boolean(error), 'estranho não consegue se cadastrar (cadastro público desligado)')
  const { data } = await anon.from('shopping_items').select('id')
  ok(data?.length === 0, 'sem login não lê nada')
}
{
  const tabelas = ['profiles', 'shopping_items', 'shifts', 'shift_requests', 'chat_messages']
  let leu = 0
  for (const t of tabelas) leu += (await lu.c.from(t).select('id')).data?.length || 0
  ok(leu === 0, 'usuário desativado não lê nada')
  const { error } = await lu.c.from('chat_messages').insert({ sala: 'compras', texto: 'oi' })
  ok(Boolean(error), 'usuário desativado não escreve no chat')
}

console.log('\n— Compras')
{
  const { data: item, error } = await joao.c.from('shopping_items').insert({ nome: 'Canela em pó', tipo: 'insumo' }).select().single()
  ok(!error, 'funcionário adiciona item')
  const dup = await joao.c.from('shopping_items').insert({ nome: '  canela EM PO ', tipo: 'insumo' })
  ok(dup.error?.code === '23505', 'item igual pendente não duplica (ignora maiúscula e acento)')
  const marcar = await joao.c.from('shopping_items').update({ status: 'comprado' }).eq('id', item.id).select()
  ok(!marcar.data?.length, 'funcionário não marca como comprado')
  const alheio = (await joao.c.from('shopping_items').select('id').neq('criado_por', joao.id).eq('status', 'pendente')).data[0]
  const apagaAlheio = await joao.c.from('shopping_items').delete().eq('id', alheio.id).select()
  ok(!apagaAlheio.data?.length, 'funcionário não apaga item dos outros')
  const comprou = await carla.c.from('shopping_items').update({ status: 'comprado', comprado_por: carla.id, comprado_em: new Date().toISOString() }).eq('id', item.id).select()
  ok(comprou.data?.length === 1, 'gerente marca como comprado')
  const editaComprado = await joao.c.from('shopping_items').update({ nome: 'x' }).eq('id', item.id).select()
  ok(!editaComprado.data?.length, 'funcionário não edita item já comprado')
  await carla.c.from('shopping_items').delete().eq('id', item.id)
}

console.log('\n— Escala')
{
  const cria = await joao.c.from('shifts').insert({ profile_id: joao.id, data: '2030-01-07', inicio: '07:00', fim: '13:00' }).select()
  ok(Boolean(cria.error) || !cria.data?.length, 'funcionário não cria turno')
  const t1 = await carla.c.from('shifts').insert({ profile_id: joao.id, data: '2030-01-07', inicio: '22:00', fim: '03:00' }).select().single()
  ok(!t1.error, 'gerente cria turno que passa da meia-noite')
  const choque = await carla.c.from('shifts').insert({ profile_id: joao.id, data: '2030-01-08', inicio: '02:00', fim: '08:00' })
  ok(/já tem um turno/.test(choque.error?.message || ''), 'turno sobreposto é barrado (inclusive virando o dia)')
  const horas = await carla.c.from('v_horas_semana').select('horas').eq('profile_id', joao.id).eq('semana', '2030-01-07').single()
  ok(Number(horas.data?.horas) === 5, 'horas da semana calculadas pela view')
  await carla.c.from('shifts').delete().eq('id', t1.data.id)
}

console.log('\n— Pedidos')
{
  const outro = (await joao.c.from('shifts').select('id').neq('profile_id', joao.id).limit(1)).data[0]
  const trocaAlheia = await joao.c.from('shift_requests').insert({ tipo: 'troca', shift_id: outro.id })
  ok(Boolean(trocaAlheia.error), 'funcionário não pede troca de turno que não é dele')
  const t = await carla.c.from('shifts').insert({ profile_id: joao.id, data: '2030-02-04', inicio: '07:00', fim: '13:00' }).select().single()
  const folga = await joao.c.from('shift_requests').insert({ tipo: 'folga', data: '2030-02-04', motivo: 'teste' }).select().single()
  ok(!folga.error, 'funcionário pede folga')
  const aprovaProprio = await joao.c.rpc('decidir_pedido', { p_id: folga.data.id, p_aprovado: true })
  ok(/Só gerente ou dono/.test(aprovaProprio.error?.message || ''), 'funcionário não aprova o próprio pedido')
  const veAlheios = (await joao.c.from('shift_requests').select('solicitante_id')).data
  ok(veAlheios.every((p) => p.solicitante_id === joao.id), 'funcionário só vê os próprios pedidos')
  const aprova = await carla.c.rpc('decidir_pedido', { p_id: folga.data.id, p_aprovado: true })
  ok(!aprova.error, 'gerente aprova folga')
  const sumiu = await carla.c.from('shifts').select('id').eq('id', t.data.id)
  ok(sumiu.data?.length === 0, 'folga aprovada remove o turno do dia')
  const denovo = await carla.c.rpc('decidir_pedido', { p_id: folga.data.id, p_aprovado: false })
  ok(Boolean(denovo.error), 'pedido já decidido não é decidido de novo')
}

console.log('\n— Equipe')
{
  const sobe = await joao.c.from('profiles').update({ papel: 'dono' }).eq('id', joao.id)
  ok(Boolean(sobe.error), 'funcionário não muda o próprio papel')
  const gerentePromove = await carla.c.from('profiles').update({ papel: 'gerente' }).eq('id', joao.id).select()
  const papelJoao = (await dono.c.from('profiles').select('papel').eq('id', joao.id).single()).data?.papel
  ok(!gerentePromove.data?.length && papelJoao === 'funcionario', 'gerente não muda papel de ninguém')
  const contato = await joao.c.from('profiles').update({ telefone: '(11) 98888-0000' }).eq('id', joao.id).select()
  ok(contato.data?.length === 1, 'cada um edita o próprio contato')
  const promove = await dono.c.from('profiles').update({ papel: 'gerente' }).eq('id', joao.id).select()
  ok(promove.data?.length === 1, 'dono muda papel')
  await dono.c.from('profiles').update({ papel: 'funcionario' }).eq('id', joao.id)
}

console.log('\n— Chat')
{
  const m = await joao.c.from('chat_messages').insert({ sala: 'escalas', texto: 'Teste de RLS' }).select().single()
  ok(!m.error, 'funcionário escreve no chat')
  const finge = await joao.c.from('chat_messages').insert({ sala: 'escalas', texto: 'fingindo', autor_id: carla.id })
  ok(Boolean(finge.error), 'ninguém escreve em nome de outra pessoa')
  const vazia = await joao.c.from('chat_messages').insert({ sala: 'escalas', texto: '   ' })
  ok(Boolean(vazia.error), 'mensagem vazia é barrada')
  const edita = await joao.c.from('chat_messages').update({ texto: 'editado' }).eq('id', m.data.id).select()
  ok(!edita.data?.length, 'mensagem não se edita')
  const alheia = (await joao.c.from('chat_messages').select('id').neq('autor_id', joao.id).limit(1)).data[0]
  const apagaAlheia = await joao.c.from('chat_messages').delete().eq('id', alheia.id).select()
  ok(!apagaAlheia.data?.length, 'funcionário não apaga mensagem dos outros')
  const modera = await carla.c.from('chat_messages').delete().eq('id', m.data.id).select()
  ok(modera.data?.length === 1, 'gerente apaga mensagem de qualquer um')
}

console.log(falhas ? `\n${falhas} teste(s) falharam` : '\nTodos os testes de permissão passaram')
process.exit(falhas ? 1 : 0)
