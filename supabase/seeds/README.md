# Seeds
Sem seed automático: usuários vêm de convite (ADR-003).
Depois de convidar o Matheus, tornar dono:
```sql
update profiles set papel = 'dono', nome = 'Matheus' where id = (select id from auth.users where email = 'SEU_EMAIL');
```
