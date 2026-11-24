-- Conta nova pelo Google (ADR-008): usar o nome que o Google manda (full_name / name).
-- Convite continua usando "nome" se o dono passar; sem nada, a parte do e-mail antes do @.
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
