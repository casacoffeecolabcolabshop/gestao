-- Funcionário manda os próprios turnos; ficam "aguardando" até gerente/dono aprovar (docs/03, backlog 17).
-- Só turno aprovado conta nas horas e pode ter pedido de troca.

create type status_turno_t as enum ('aprovado', 'pendente');
alter table shifts add column status status_turno_t not null default 'aprovado';

-- quem não é gerente/dono sempre manda como "pendente", mesmo que tente outra coisa
create or replace function turno_de_funcionario_aguarda() returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not coalesce(sou_gestor(), false) then
    new.status := 'pendente';
  end if;
  return new;
end $$;
create trigger trg_turno_aguarda before insert on shifts for each row execute function turno_de_funcionario_aguarda();

-- funcionário: cria, ajusta e apaga só os próprios turnos que aguardam
create policy turnos_func_criar on shifts for insert
  with check (meu_papel() is not null and profile_id = auth.uid() and status = 'pendente');
create policy turnos_func_editar on shifts for update
  using (meu_papel() is not null and profile_id = auth.uid() and status = 'pendente')
  with check (profile_id = auth.uid() and status = 'pendente');
create policy turnos_func_apagar on shifts for delete
  using (meu_papel() is not null and profile_id = auth.uid() and status = 'pendente');

-- horas: só turno aprovado
create or replace view v_horas_semana with (security_invoker = true) as
select profile_id,
       date_trunc('week', data)::date as semana,
       round(sum(extract(epoch from (upper(intervalo_turno(data, inicio, fim)) - lower(intervalo_turno(data, inicio, fim)))) / 3600)::numeric, 2) as horas
from shifts
where status = 'aprovado'
group by profile_id, date_trunc('week', data);
grant select on v_horas_semana to authenticated;

-- pedido de troca: só de turno aprovado da própria pessoa
drop policy pedidos_criar on shift_requests;
create policy pedidos_criar on shift_requests for insert
  with check (meu_papel() is not null and solicitante_id = auth.uid() and status = 'pendente'
              and (shift_id is null or exists (select 1 from shifts s where s.id = shift_id and s.profile_id = auth.uid() and s.status = 'aprovado')));
