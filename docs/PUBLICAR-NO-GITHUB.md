# Publicação segura da versão de portfólio

**Não altere a visibilidade do repositório conectado à produção do Netlify.** Crie um **novo repositório público** e mantenha esta pasta separada da versão real.

1. Extraia o ZIP em outra pasta, por exemplo `App-Geek-Portfolio-Publico-2026`.
2. Opcional, mas recomendado: execute `npm ci`, `npm run test:logic` e `npm run build`, com seus dados de demonstração quando necessário.
3. Crie um repositório **Public** no GitHub chamado `app-geek-portfolio`, sem inicializar README ou `.gitignore` (já existem no ZIP).
4. No PowerShell dentro da **nova pasta**, execute:

   ```powershell
   git init
   git add .
   git status
   git diff --cached --name-only
   ```

5. **Confirme visualmente** que não há `.env.local`, certificados, CSVs, backups ou senhas. Somente então faça:

   ```powershell
   git commit -m "Publicar App Geek como portfolio"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/app-geek-portfolio.git
   git push -u origin main
   ```

6. No GitHub, adicione uma descrição, tópicos `nextjs react typescript postgresql qr-code fullstack` e capturas com registros fictícios (ver `CAPTURAS-DE-TELA.md`).
7. Coloque o link público na seção **Projetos/Destaques** do LinkedIn.

> GitHub público mostra o código, mas não executa o Next.js. Para uma demonstração navegável sem risco à produção, hospede uma **instância diferente com um banco de testes separado**. Evite vincular o repositório público ao Netlify da aplicação real.
