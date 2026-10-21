# Atualizar seu repositório com as correções

Este pacote contém o projeto completo baseado no commit bab144a0b2d2866f3c8a229ce966e607ee2f86fd, com as cinco falhas corrigidas. Não inclui credenciais, banco de dados, node_modules, .next ou histórico .git.

## Pelo site do GitHub

1. Extraia o ZIP no computador. Abra a pasta que contém package.json, src e tests.
2. Acesse https://github.com/MauricioSpeth/Projeto-Evento-Geek-Friday e entre na sua conta.
3. Na página principal do repositório, clique em **Add file > Upload files**.
4. Para atualizar apenas o necessário, arraste as pastas **src**, **tests**, **.github**, o arquivo **.gitignore** e este **COMO-ATUALIZAR.md** para a área de upload. Preserve os caminhos: src deve aparecer diretamente na raiz, e não dentro de outra pasta. Não envie o ZIP como um único arquivo.
5. Confira a lista. Arquivos de mesmo caminho serão atualizados. Se você alterou o projeto depois do commit acima, compare essas mudanças antes de substituí-las.
6. Use a mensagem “Corrige login, cadastro e acessibilidade dos modais”. Escolha criar uma nova branch, por exemplo **correcoes-auditoria**, e clique em **Propose changes**.
7. Abra o pull request para a branch principal, confira as diferenças e aguarde os testes na aba **Checks**. Depois faça **Merge pull request** e confirme.
8. Se o Netlify estiver conectado a esse repositório e à branch atualizada, com publicação automática habilitada, acompanhe a nova publicação na área **Deploys**. Estas correções só estarão no site depois da publicação concluída.

O upload pelo navegador aceita até 100 arquivos por vez. Se houver restrição de branch ou de quantidade, use GitHub Desktop ou a alternativa abaixo. Se o sistema ocultar .github e .gitignore, habilite a visualização de itens ocultos; confira esses arquivos no commit.

## Alternativa com Git no computador

Em uma pasta nova, execute:

```powershell
git clone https://github.com/MauricioSpeth/Projeto-Evento-Geek-Friday.git
cd Projeto-Evento-Geek-Friday
git switch -c correcoes-auditoria
```

Copie o conteúdo extraído do ZIP para dentro dessa cópia do repositório, substituindo os arquivos correspondentes. Preserve a pasta .git. Não copie a pasta externa do ZIP como subpasta do projeto. Depois:

```powershell
npm ci
npm run test:logic
npm run typecheck
npm run build
git diff --stat
git add src tests .github .gitignore COMO-ATUALIZAR.md
git commit -m "Corrige login, cadastro e acessibilidade dos modais"
git push -u origin correcoes-auditoria
```

Abra o repositório no navegador, crie o pull request dessa branch e faça a integração após os testes. Você pode precisar autenticar o Git com sua conta do GitHub.

## Banco e configuração

Não é necessário executar migrações, recriar administradores ou limpar o banco para aplicar estas alterações. Preserve as variáveis de ambiente já configuradas no Netlify. O .env.example é apenas modelo para uma instalação nova; não o use para substituir a configuração existente. Senhas de login agora são limitadas a 512 caracteres e o usuário normalizado a 40 caracteres, seguindo o limite de criação de contas.

## Correções e validação

- Login usa a mesma normalização de usuário para consultar a conta e limitar tentativas, evitando contorno por espaços.
- JSON inválido, null, arrays e entradas inadequadas no login retornam 400.
- O servidor decide se o navegador já foi inscrito; marcas antigas e indisponibilidade de localStorage não bloqueiam o formulário.
- Arrays e objetos não são aceitos como tipo/período do participante.
- Os modais de participante e administrador fecham com Esc, mantêm o foco durante a navegação por Tab e devolvem o foco ao acionador. Quando um dropdown está aberto, o primeiro Esc fecha o dropdown.
- A consulta periódica também detecta inscrição já realizada em outra aba.

Validação em 20/10/2026: **269 testes de código aprovados**, **12 verificações locais de interface aprovadas**, TypeScript e compilação aprovados com Next 15.5.27. Os testes locais de interface usam APIs simuladas e não modificam o site real. As alterações deste pacote ainda precisam ser publicadas e verificadas no ambiente do usuário.

O workflow .github/workflows/testes.yml executa a suíte de código, TypeScript e compilação em pushes e pull requests quando GitHub Actions estiver habilitado. Para impedir a integração de alterações com testes falhando, configure esse check como obrigatório na proteção da branch, se disponível no repositório. Nenhum teste garante ausência de todos os defeitos; estes cobrem as regressões encontradas.

## Testes opcionais de interface no Windows

Com Microsoft Edge instalado, na raiz do projeto:

```powershell
npm install --prefix .test-tools --no-audit --no-fund playwright esbuild
node tests/ui/regressoes.mjs
```

As ferramentas ficam separadas das dependências da aplicação. O teste abre apenas um servidor local temporário e encerra o navegador ao terminar. Não precisa de senha nem acesso ao banco.

Fontes: [upload de arquivos no GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) e [publicação no Netlify](https://docs.netlify.com/deploy/create-deploys/).
