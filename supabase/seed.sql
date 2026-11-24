-- SÓ PARA TESTE LOCAL (supabase start / supabase db reset). Nunca rodar em produção.
-- Cria a equipe de teste com senha "casa1234" e alguns dados de exemplo.
create extension if not exists pgcrypto with schema extensions;

do $$
declare
  u record;
begin
  for u in select * from (values
    ('11111111-1111-1111-1111-111111111111'::uuid, 'dono@casa.local',        'Matheus', 'dono'::papel_t,        true),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'gerente@casa.local',     'Carla',   'gerente'::papel_t,     true),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'joao@casa.local',        'João',    'funcionario'::papel_t, true),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'bia@casa.local',         'Bia',     'funcionario'::papel_t, true),
    ('55555555-5555-5555-5555-555555555555'::uuid, 'rafa@casa.local',        'Rafa',    'funcionario'::papel_t, true),
    ('66666666-6666-6666-6666-666666666666'::uuid, 'lu@casa.local',          'Lu',      'funcionario'::papel_t, false)
  ) as t(id, email, nome, papel, ativo)
  loop
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
            extensions.crypt('casa1234', extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}', jsonb_build_object('nome', u.nome), now(), now(),
            '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
            'email', now(), now(), now());
    -- o trigger criar_perfil já criou como funcionario; aqui só ajusta
    update profiles set papel = u.papel, ativo = u.ativo,
                        telefone = '(11) 90000-000' || substr(u.id::text, 1, 1)
     where id = u.id;
  end loop;
end $$;

-- escala: semana passada e esta semana (segunda a domingo)
do $$
declare
  seg date := date_trunc('week', current_date)::date;
  w int; d int;
  m  uuid := '11111111-1111-1111-1111-111111111111';
  c  uuid := '22222222-2222-2222-2222-222222222222';
  j  uuid := '33333333-3333-3333-3333-333333333333';
  b  uuid := '44444444-4444-4444-4444-444444444444';
  r  uuid := '55555555-5555-5555-5555-555555555555';
  l  uuid := '66666666-6666-6666-6666-666666666666';
  base date;
begin
  for w in 0..1 loop
    base := seg - 7 + 7 * w;
    insert into shifts (profile_id, data, inicio, fim, observacao, criado_por) values
      (j, base,     '07:00', '13:00', 'abre a loja',  c), (case when w = 0 then l else b end, base, '13:00', '19:00', 'fecha a loja', c), (c, base, '09:00', '17:00', null, c),
      (r, base + 1, '07:00', '13:00', 'abre a loja',  c), (j, base + 1, '13:00', '19:00', 'fecha a loja', c), (c, base + 1, '09:00', '17:00', null, c),
      (b, base + 2, '07:00', '13:00', 'abre a loja',  c), (r, base + 2, '13:00', '19:00', 'fecha a loja', c), (c, base + 2, '09:00', '17:00', null, c),
      (j, base + 3, '07:00', '13:00', 'abre a loja',  c), (b, base + 3, '13:00', '19:00', 'fecha a loja', c), (m, base + 3, '09:00', '15:00', null, c),
      (r, base + 4, '07:00', '13:00', 'abre a loja',  c), (j, base + 4, '13:00', '19:00', 'fecha a loja', c), (c, base + 4, '09:00', '17:00', null, c),
      (b, base + 5, '08:00', '14:00', 'abre a loja',  c), (j, base + 5, '14:00', '20:00', 'fecha a loja', c), (r, base + 5, '18:00', '01:00', 'evento de sábado', c),
      (r, base + 6, '08:00', '14:00', 'abre a loja',  c), (b, base + 6, '14:00', '18:00', 'fecha a loja', c);
  end loop;

  insert into shopping_items (nome, quantidade, tipo, observacao, urgente, criado_por, created_at) values
    ('Leite integral', '6 caixas', 'insumo', 'Acabou no meio da manhã', true, j, now() - interval '1 hour'),
    ('Café em grãos', '2 kg', 'insumo', 'O da torra média', false, b, now() - interval '26 hours'),
    ('Copos 300 ml', '1 pacote', 'insumo', null, false, c, now() - interval '20 hours'),
    ('Pão de queijo congelado', '3 pacotes', 'produto', null, false, r, now() - interval '5 hours');
  insert into shopping_items (nome, quantidade, tipo, status, criado_por, comprado_por, comprado_em, created_at) values
    ('Guardanapos', '2 fardos', 'insumo', 'comprado', b, c, now() - interval '20 hours', now() - interval '2 days');

  insert into shift_requests (tipo, solicitante_id, data, motivo) values
    ('folga', j, seg + 5, 'Aniversário da minha mãe');
  insert into shift_requests (tipo, solicitante_id, shift_id, substituto_id, motivo)
    select 'troca', b, s.id, m, 'Prova na faculdade' from shifts s where s.profile_id = b and s.data = seg + 2;

  insert into chat_messages (sala, autor_id, texto, created_at) values
    ('compras', c, 'Vou ao mercado amanhã às 10h. Coloquem na lista até lá.', now() - interval '3 hours'),
    ('compras', j, 'Coloquei o leite como urgente, acabou agora.', now() - interval '1 hour'),
    ('escalas', b, 'Alguém consegue cobrir minha quarta de manhã? Pedi a troca no app.', now() - interval '8 hours');
end $$;
