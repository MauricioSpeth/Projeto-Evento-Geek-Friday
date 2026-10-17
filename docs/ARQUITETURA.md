# Arquitetura do App Geek

## Componentes

- **Next.js App Router**: páginas React, renderização e endpoints de API no mesmo projeto.
- **PostgreSQL**: participantes, administradores, sessões, estado do evento e associação a navegador.
- **QR**: URL temporal que abre `/entrar?t=...`; após validação, cria sessão curta de preenchimento.
- **Autenticação administrativa**: senhas com hash `scrypt`, tokens de sessão persistidos no banco e cookies HTTP-only.
- **Permissões**: coluna `admins.papel` com `admin` ou `geral`. Exclusão de contas, backup e limpeza exigem master e verificação no backend.
- **Admins online**: a sessão autenticada registra atividade e o painel conta contas distintas recentemente ativas. Exposição pública restrita à quantidade, sem nomes.
- **Backups**: exportação lógica JSON das tabelas da aplicação; limpeza de inscrições em transação após confirmação e evento desligado.

## Migrações

`sql/001_schema_nextjs.sql` → tabelas base; `sql/002_controle_evento.sql` → configurações; `sql/003_admin_geral_presenca.sql` → papéis e atividade administrativa. O comando `npm run db:migrate` utiliza `.env.local` e deve ser aplicado somente ao banco de testes nesta edição.

## Dados e limites

As estatísticas do painel são calculadas com dados do banco — os números fictícios de artes conceituais não existem no código. O tratamento de cookies evita repetição pelo mesmo navegador conhecido, mas não produz um identificador permanente de dispositivo. O Next.js em produção precisa de um PostgreSQL acessível pelo servidor.
