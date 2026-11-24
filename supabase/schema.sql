-- Casa Gestão: schema + permissões (fonte de verdade do banco)
-- Rodar no SQL Editor do Supabase. Regras em docs/03_REGRAS_DE_NEGOCIO.

create extension if not exists unaccent with schema extensions;

-- ========== tipos ==========
create type papel_t      as enum ('dono', 'gerente', 'funcionario');
create type tipo_item_t  as enum ('insumo', 'produto');
create type status_item_t as enum ('pendente', 'comprado');
create type tipo_pedido_t as enum ('troca', 'folga');
create type status_pedido_t as enum ('pendente', 'aprovado', 'recusado', 'cancelado');
create type sala_chat_t    as enum ('compras', 'escalas');

-- ========== util ==========
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ========== profiles ==========
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null check (char_length(nome) between 1 and 80),
  telefone    text check (char_length(telefone) <= 20),
  papel       papel_t not null default 'funcionario',
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_upd before update on profiles for each row execute function set_updated_at();

-- papel de quem está logado (null se inativo ou sem perfil)
create or replace function meu_papel() returns papel_t
language sql stable security definer set search_path = public as $$
  select papel from profiles where id = auth.uid() and ativo
$$;

create or replace function sou_gestor() returns boolean
language sql stable as $$ select meu_papel() in ('dono', 'gerente') $$;

-- cria o perfil de toda conta nova: convite (ADR-003) ou Google sem convite (ADR-008)
create or replace function criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nome)
  values (
    new.id,
    left(coalesce(
      nullif(trim(new.raw_user_meta_data->>'nome'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(new.email, '@', 1)
    ), 80)
  );
  return new;
end $$;
create trigger trg_novo_usuario after insert on auth.users for each row execute function criar_perfil();

-- ========== shopping_items (lista de compras) ==========
create table shopping_items (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null check (char_length(nome) between 1 and 80),
  quantidade    text check (char_length(quantidade) <= 40),
  tipo          tipo_item_t not null default 'insumo',
  observacao    text check (char_length(observacao) <= 200),
  urgente       boolean not null default false,
  status        status_item_t not null default 'pendente',
  criado_por    uuid not null default auth.uid() references profiles(id),
  comprado_por  uuid references profiles(id),
  comprado_em   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
-- não duplica item pendente com o mesmo nome (ignora maiúscula e acento)
create or replace function nome_normalizado(t text) returns text
language sql immutable as $$ select lower(extensions.unaccent('extensions.unaccent', trim(t))) $$;
create unique index uq_item_pendente on shopping_items (nome_normalizado(nome)) where status = 'pendente';
create index ix_items_status on shopping_items (status, urgente desc, created_at);
create trigger trg_items_upd before update on shopping_items for each row execute function set_updated_at();

-- ========== shifts (turnos) ==========
create table shifts (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id),
  data        date not null,
  inicio      time not null,
  fim         time not null check (fim <> inicio),
  observacao  text check (char_length(observacao) <= 100),
  criado_por  uuid default auth.uid() references profiles(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index ix_shifts_data on shifts (data);
create trigger trg_shifts_upd before update on shifts for each row execute function set_updated_at();

-- intervalo real do turno (fim < início = vira o dia)
create or replace function intervalo_turno(d date, i time, f time) returns tsrange
language sql immutable as $$
  select tsrange(d + i, case when f > i then d + f else (d + 1) + f end, '[)')
$$;

-- mesma pessoa não pode ter turnos sobrepostos
create or replace function checar_sobreposicao() returns trigger language plpgsql as $$
begin
  if exists (
    select 1 from shifts s
    where s.profile_id = new.profile_id and s.id <> new.id
      and intervalo_turno(s.data, s.inicio, s.fim) && intervalo_turno(new.data, new.inicio, new.fim)
  ) then
    raise exception 'Essa pessoa já tem um turno nesse horário';
  end if;
  return new;
end $$;
create trigger trg_shifts_sobreposicao before insert or update on shifts for each row execute function checar_sobreposicao();

-- horas por pessoa por semana (segunda a domingo)
create or replace view v_horas_semana with (security_invoker = true) as
select profile_id,
       date_trunc('week', data)::date as semana,
       round(sum(extract(epoch from (upper(intervalo_turno(data, inicio, fim)) - lower(intervalo_turno(data, inicio, fim)))) / 3600)::numeric, 2) as horas
from shifts
group by profile_id, date_trunc('week', data);

-- ========== shift_requests (troca e folga) ==========
create table shift_requests (
  id             uuid primary key default gen_random_uuid(),
  tipo           tipo_pedido_t not null,
  solicitante_id uuid not null default auth.uid() references profiles(id),
  shift_id       uuid references shifts(id) on delete set null,
  substituto_id  uuid references profiles(id),
  data           date,
  motivo         text check (char_length(motivo) <= 200),
  status         status_pedido_t not null default 'pendente',
  decidido_por   uuid references profiles(id),
  decidido_em    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check ((tipo = 'troca' and shift_id is not null) or (tipo = 'folga' and data is not null))
);
create index ix_pedidos_status on shift_requests (status, created_at);
create trigger trg_pedidos_upd before update on shift_requests for each row execute function set_updated_at();

-- aprovar/recusar numa transação só (ADR-004)
create or replace function decidir_pedido(p_id uuid, p_aprovado boolean) returns void
language plpgsql security definer set search_path = public as $$
declare p shift_requests;
begin
  if not sou_gestor() then raise exception 'Só gerente ou dono pode decidir pedidos'; end if;
  select * into p from shift_requests where id = p_id and status = 'pendente' for update;
  if not found then raise exception 'Pedido não encontrado ou já decidido'; end if;

  update shift_requests
     set status = case when p_aprovado then 'aprovado' else 'recusado' end::status_pedido_t,
         decidido_por = auth.uid(), decidido_em = now()
   where id = p_id;

  if p_aprovado then
    if p.tipo = 'troca' and p.substituto_id is not null then
      update shifts set profile_id = p.substituto_id where id = p.shift_id;
    elsif p.tipo = 'folga' then
      delete from shifts where profile_id = p.solicitante_id and data = p.data;
    end if;
  end if;
end $$;
revoke all on function decidir_pedido(uuid, boolean) from public;
grant execute on function decidir_pedido(uuid, boolean) to authenticated;

-- ========== chat_messages (chat da equipe: um de compras, um de escala) ==========
create table chat_messages (
  id          uuid primary key default gen_random_uuid(),
  sala        sala_chat_t not null,
  autor_id    uuid not null default auth.uid() references profiles(id),
  texto       text not null check (char_length(trim(texto)) between 1 and 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index ix_chat_sala on chat_messages (sala, created_at desc);
create trigger trg_chat_upd before update on chat_messages for each row execute function set_updated_at();

-- ========== RLS (tabela de permissões de docs/03) ==========
alter table profiles       enable row level security;
alter table shopping_items enable row level security;
alter table shifts         enable row level security;
alter table shift_requests enable row level security;
alter table chat_messages  enable row level security;

-- profiles: equipe ativa vê a equipe; cada um edita o próprio contato; dono gerencia papel/ativo
create policy perfis_ler on profiles for select using (meu_papel() is not null);
create policy perfis_editar_proprio on profiles for update
  using (id = auth.uid() and meu_papel() is not null) with check (id = auth.uid());
create policy perfis_dono on profiles for update using (meu_papel() = 'dono');

-- só o dono muda papel ou ativo (nem a própria pessoa)
create or replace function proteger_papel() returns trigger language plpgsql as $$
begin
  if (new.papel is distinct from old.papel or new.ativo is distinct from old.ativo)
     and coalesce(meu_papel()::text, '') <> 'dono' and auth.uid() is not null then
    raise exception 'Só o dono pode mudar papel ou ativar/desativar';
  end if;
  return new;
end $$;
create trigger trg_proteger_papel before update on profiles for each row execute function proteger_papel();

-- compras
create policy itens_ler on shopping_items for select using (meu_papel() is not null);
create policy itens_criar on shopping_items for insert
  with check (meu_papel() is not null and criado_por = auth.uid() and status = 'pendente');
create policy itens_editar_proprio on shopping_items for update
  using (criado_por = auth.uid() and status = 'pendente' and meu_papel() is not null)
  with check (criado_por = auth.uid() and status = 'pendente');
create policy itens_gestor_editar on shopping_items for update using (sou_gestor());
create policy itens_apagar_proprio on shopping_items for delete
  using (criado_por = auth.uid() and status = 'pendente' and meu_papel() is not null);
create policy itens_gestor_apagar on shopping_items for delete using (sou_gestor());

-- escala
create policy turnos_ler on shifts for select using (meu_papel() is not null);
create policy turnos_gestor on shifts for all using (sou_gestor()) with check (sou_gestor());

-- pedidos: funcionário vê e cria os seus; gestor vê todos (decisão só via RPC)
create policy pedidos_ler on shift_requests for select
  using ((solicitante_id = auth.uid() and meu_papel() is not null) or sou_gestor());
create policy pedidos_criar on shift_requests for insert
  with check (meu_papel() is not null and solicitante_id = auth.uid() and status = 'pendente'
              and (shift_id is null or exists (select 1 from shifts s where s.id = shift_id and s.profile_id = auth.uid())));
create policy pedidos_cancelar on shift_requests for update
  using (solicitante_id = auth.uid() and status = 'pendente')
  with check (solicitante_id = auth.uid() and status = 'cancelado');

-- chat: equipe ativa lê e escreve; mensagem não se edita; apaga a própria (gestor apaga qualquer uma)
create policy chat_ler on chat_messages for select using (meu_papel() is not null);
create policy chat_enviar on chat_messages for insert
  with check (meu_papel() is not null and autor_id = auth.uid());
create policy chat_apagar on chat_messages for delete
  using ((autor_id = auth.uid() and meu_papel() is not null) or sou_gestor());

-- ========== realtime (lista e chat atualizam sozinhos; respeita o RLS) ==========
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table chat_messages;

-- ========== permissões da API (migration 20261124010000_permissoes_api) ==========

grant usage on schema public to authenticated;

grant select, insert, update, delete
  on profiles, shopping_items, shifts, shift_requests, chat_messages
  to authenticated;

grant select on v_horas_semana to authenticated;

grant execute on function meu_papel() to authenticated;
grant execute on function sou_gestor() to authenticated;
grant execute on function nome_normalizado(text) to authenticated;
grant execute on function intervalo_turno(date, time, time) to authenticated;
