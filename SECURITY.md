# Segurança e privacidade

Esta é a versão pública de portfólio do App Geek. Use-a com **dados fictícios e banco próprio**. O repositório não contém credenciais ou uma cópia dos participantes do evento.

## Não publicar

- `.env.local`, variáveis reais do Netlify/Supabase, passwords, tokens ou segredos de cookies.
- Arquivos `*.pem`, `*.key`, certificados privados, dumps, CSVs, backups JSON ou relatórios com nomes reais.
- Prints de participantes, IDs ou sessões administrativas reais.
- Scripts temporários de recuperação de senha usados na produção.

O `.gitignore` impede inclusão acidental de várias extensões, mas **não substitui a inspeção de `git diff --cached` antes de publicar**. Se um segredo for exposto, rotacione-o e remova-o também do histórico Git, não só do commit atual.

## Limites conhecidos

A restrição por cookie é uma camada de prevenção por navegador, não um identificador físico infalível. A restrição nome + tipo pode afetar homônimos. Não considere a aplicação auditada para uso de alto risco.

A exclusão de inscrições preserva administradores e configurações, mas é destrutiva e requer backup verificado. Faça testes apenas em banco de demonstração. O arquivo de backup JSON não equivale a um `pg_dump` completo.

## Relatar problemas

Caso encontre uma falha de segurança, entre em contato com o proprietário do repositório por um canal privado; evite publicar detalhes de exploração em issues públicas.
