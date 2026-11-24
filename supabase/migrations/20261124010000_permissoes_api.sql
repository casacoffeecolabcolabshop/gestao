-- Permissões da API explícitas (não depender do "expor tabelas novas automaticamente" do projeto).
-- Só quem está logado (authenticated) acessa; o que cada um vê e mexe continua decidido pelo RLS (ADR-004).
-- Anônimo (anon) não recebe nada: o app só funciona com login (ADR-003).

grant usage on schema public to authenticated;

grant select, insert, update, delete
  on profiles, shopping_items, shifts, shift_requests, chat_messages
  to authenticated;

grant select on v_horas_semana to authenticated;

-- funções usadas pelas políticas RLS, pelos índices e pelos gatilhos
grant execute on function meu_papel() to authenticated;
grant execute on function sou_gestor() to authenticated;
grant execute on function nome_normalizado(text) to authenticated;
grant execute on function intervalo_turno(date, time, time) to authenticated;
