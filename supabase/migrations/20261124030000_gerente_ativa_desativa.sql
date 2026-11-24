-- Gerente ativa e desativa pessoas (docs/03, backlog 16).
-- Nunca o dono nem a si mesmo; papel continua só com o dono; contato dos outros ninguém além do dono mexe.

create policy perfis_gerente_ativar on profiles for update
  using (meu_papel() = 'gerente' and papel <> 'dono' and id <> auth.uid())
  with check (papel <> 'dono' and id <> auth.uid());

create or replace function proteger_papel() returns trigger language plpgsql as $$
declare
  quem papel_t := meu_papel();
begin
  -- painel do Supabase / SQL direto (sem usuário logado) e dono: tudo liberado
  if auth.uid() is null or quem = 'dono' then
    return new;
  end if;

  if new.papel is distinct from old.papel then
    raise exception 'Só o dono muda o papel de alguém';
  end if;

  if new.ativo is distinct from old.ativo
     and not (quem = 'gerente' and old.papel <> 'dono' and old.id <> auth.uid()) then
    raise exception 'Só o dono ou o gerente ativam e desativam (nunca o dono nem a si mesmo)';
  end if;

  if old.id <> auth.uid() and (new.nome is distinct from old.nome or new.telefone is distinct from old.telefone) then
    raise exception 'Só a própria pessoa muda o nome e o telefone';
  end if;

  return new;
end $$;
