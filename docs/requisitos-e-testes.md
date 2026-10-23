# Requisitos e testes — módulo Caixa das Barracas

Especificação e verificação do módulo de caixa (PDV) do App Geek. Os casos CT01–CT24 rodam por um roteiro automático contra a API; CT25–CT28 foram executados no navegador. Execução: 22/10/2026.

**Resumo:** 20 requisitos funcionais · 12 não funcionais · 10 regras de negócio · 10 casos de uso · 28 casos de teste (28 aprovados) · matriz de rastreabilidade completa.

## Requisitos funcionais

| Código | Requisito | Descrição |
|---|---|---|
| RF01 | Escolher o curso | Mostrar, em /caixa, um cartão para cada barraca, levando à tela de login daquele curso. |
| RF02 | Entrar no caixa do curso | Cada curso entra pelo próprio link (/caixa/<curso>) informando só a senha da barraca. |
| RF03 | Acesso da organização | Administradores do App Geek acessam a central das barracas com a própria conta, pelo botão do painel de cadastros. |
| RF04 | Criar barraca | A organização cria o caixa de um curso da lista oficial, com fundo de troco, usuário e senha. |
| RF05 | Trocar a senha da barraca | A organização troca a senha de um curso; quem estava logado com a senha antiga é desconectado. |
| RF06 | Acompanhar o evento | A central mostra total vendido, vendas, barracas abertas, totais por forma de pagamento e, por barraca, vendido, gaveta, último fechamento e link de login (com Copiar link). |
| RF07 | Cadastrar e editar produtos | Nome, preço, categoria (Comidas, Bebidas, Doces, Outros) e estoque opcional. |
| RF08 | Pausar e excluir produtos | Produto pausado sai da vitrine sem ser apagado; excluir pede confirmação e mantém o histórico de vendas. |
| RF09 | Registrar venda | Montar a comanda tocando nos produtos, ajustar quantidades e escolher Dinheiro, Pix, Crédito ou Débito. |
| RF10 | Calcular o troco | Em dinheiro, informar o valor recebido (ou usar os atalhos) e mostrar o troco com a sugestão de notas e moedas. |
| RF11 | Controlar o estoque | Baixar o estoque na venda, devolver no cancelamento e impedir vender além do estoque. |
| RF12 | Cancelar venda | Cancelar uma venda do turno aberto, tirando-a dos totais. |
| RF13 | Abrir o caixa | Começar um turno de caixa informando o fundo de troco. |
| RF14 | Sangria e suprimento | Registrar dinheiro tirado da gaveta (sangria) ou colocado (suprimento), com valor e motivo. |
| RF15 | Fechar o caixa | Informar o dinheiro contado; o sistema calcula o esperado e a diferença (bateu, sobrou ou faltou). |
| RF16 | Guardar relatórios de caixa | Guardar o relatório de cada turno (abertura, fechamento, vendas, entrou, saiu, esperado, contado, resultado) e listar todos. |
| RF17 | Emitir recibo do turno | Mostrar o relatório no formato de cupom, com itens vendidos e quantidades, para imprimir ou salvar em PDF. |
| RF18 | Exportar relatório | Baixar o relatório de qualquer turno em CSV para o Excel. |
| RF19 | Sair | Encerrar a sessão do curso e voltar para a tela de login do próprio curso. |
| RF20 | Modo demonstração | Mostrar os logins de demonstração e permitir recriar os exemplos somente no ambiente de teste. |

## Requisitos não funcionais

| Código | Requisito | Descrição |
|---|---|---|
| RNF01 | Segurança das senhas | Senhas guardadas só como resumo criptográfico (scrypt); sessão em cookie protegido (httpOnly) que expira em 8 horas. |
| RNF02 | Proteção contra adivinhação | Depois de 5 senhas erradas em 15 minutos, o login fica bloqueado por 15 minutos. |
| RNF03 | Isolamento entre barracas | Um curso só vê e mexe na própria barraca; o login de administrador não abre o caixa de um curso sem a senha dele. |
| RNF04 | Integridade dos valores | O servidor recalcula total e troco com os preços do banco; valores guardados em centavos; vendas, estoque e gaveta atualizados em transação. |
| RNF05 | Proteção contra outros sites | Pedidos que mudam dados só são aceitos quando vêm do próprio sistema (checagem de origem). |
| RNF06 | Usabilidade e celular | Telas responsivas, botões grandes e atalhos de valor, para uso rápido no balcão e no celular. |
| RNF07 | Desempenho | Respostas da API em menos de 1 segundo; medido em teste local: todas abaixo de 200 ms (máximo 196 ms) após a primeira compilação. |
| RNF08 | Tecnologia e compatibilidade | Next.js 15, React 19, TypeScript, Node.js 20.9 ou superior e PostgreSQL; navegadores atuais (Chrome, Edge) no computador e no celular. |
| RNF09 | Manutenibilidade | Código em TypeScript com verificação de tipos, migrações de banco que podem rodar mais de uma vez e testes automáticos (269 do projeto + 24 do caixa). |
| RNF10 | Rastreabilidade do caixa | Relatório de turno fechado não muda mais; cada venda guarda nome e preço da época do produto. |
| RNF11 | Compatibilidade da exportação | CSV em UTF-8 com marcação para o Excel e separado por ponto e vírgula; textos que pareçam fórmulas são neutralizados. |
| RNF12 | Privacidade (LGPD) | O caixa não coleta dados pessoais de quem compra; só produtos, valores e forma de pagamento. |

## Regras de negócio

| Código | Regra |
|---|---|
| RN01 | Cada barraca tem no máximo um turno de caixa aberto por vez. |
| RN02 | Dinheiro na gaveta = fundo de troco + vendas em dinheiro + suprimentos − sangrias, sempre do turno. |
| RN03 | Em dinheiro, o valor recebido não pode ser menor que o total; nas outras formas, o recebido é o próprio total. |
| RN04 | A sangria não pode ser maior que o dinheiro que está na gaveta. |
| RN05 | Só é possível vender, fazer sangria ou suprimento com o caixa aberto. |
| RN06 | Venda cancelada sai dos totais e devolve o estoque; só vendas do turno aberto podem ser canceladas. |
| RN07 | Cada curso da lista oficial pode ter só uma barraca. |
| RN08 | Senha da barraca com pelo menos 8 caracteres; usuário de 3 a 30 letras ou números, sem espaço nem acento. |
| RN09 | As vendas são numeradas em sequência dentro de cada barraca. |
| RN10 | Diferença do fechamento = contado − esperado (zero: bateu; positiva: sobrou; negativa: faltou). |

## Casos de uso

Atores: **Caixa da barraca** (pessoa do curso que vende) e **Organização** (administrador do evento).

| Código | Caso de uso | Ator | Requisitos |
|---|---|---|---|
| UC01 | Entrar no caixa do curso | Caixa da barraca | RF01, RF02, RF19 |
| UC02 | Vender | Caixa da barraca | RF09, RF10, RF11 |
| UC03 | Gerenciar produtos | Caixa da barraca | RF07, RF08 |
| UC04 | Abrir o caixa | Caixa da barraca | RF13 |
| UC05 | Registrar sangria ou suprimento | Caixa da barraca | RF14 |
| UC06 | Fechar o caixa | Caixa da barraca | RF15, RF16 |
| UC07 | Emitir e exportar relatório | Caixa da barraca | RF16, RF17, RF18 |
| UC08 | Cancelar venda | Caixa da barraca | RF12 |
| UC09 | Gerenciar barracas | Organização | RF03, RF04, RF05 |
| UC10 | Acompanhar o evento | Organização | RF03, RF06 |

## Casos de teste

| ID | Passos | Requisitos | Esperado | Obtido | Status |
|---|---|---|---|---|---|
| CT01 | Organização cria a barraca Direito com fundo R$ 100,00. | RF04, RF13 | Barraca criada (201) já com o turno nº 1 aberto e fundo R$ 100,00. | 201; turno nº 1 aberto com fundo R$ 100,00 | ✅ Aprovado |
| CT02 | Tentar criar barraca repetida, de curso fora da lista e com senha curta. | RF04, RN07, RN08 | Repetida 409; fora da lista 400; senha curta 400. | duplicada 409 · curso fora da lista 400 · senha curta 400 | ✅ Aprovado |
| CT03 | Entrar no caixa do curso com a senha certa e listar barracas. | RF02, RNF03 | Login aceito (200); o curso vê só a própria barraca. | 200; vê só a barraca Direito | ✅ Aprovado |
| CT04 | Entrar com senha errada. | RF02 | Recusado (401) com "Senha incorreta." | 401 "Senha incorreta." | ✅ Aprovado |
| CT05 | Errar a senha 6 vezes seguidas e tentar a certa. | RNF02 | Bloqueio 429 "Muitas tentativas"; nem a senha certa entra. | 429 "Muitas tentativas"; nem a senha certa entra durante o bloqueio | ✅ Aprovado |
| CT06 | Logado num curso, abrir e mexer na barraca de outro curso. | RNF03 | Recusado (403) nas duas ações. | ver 403 · mexer 403 | ✅ Aprovado |
| CT07 | Cadastrar Pastel R$ 9,00 (estoque 3) e Refrigerante R$ 6,00 (sem estoque). | RF07 | Produtos cadastrados (201). | Pastel R$ 9,00 (estoque 3) e Refrigerante R$ 6,00 (sem controle) cadastrados | ✅ Aprovado |
| CT08 | Cadastrar produto com preço zero e com categoria inválida. | RF07 | Recusado (400) nos dois casos. | preço zero 400 · categoria inválida 400 | ✅ Aprovado |
| CT09 | Vender 2 refrigerantes no Pix enviando preço falso de R$ 0,01. | RF09, RNF04 | Servidor ignora o preço enviado e grava R$ 12,00. | navegador mandou R$ 0,01; servidor gravou R$ 12,00 (2 × R$ 6,00) | ✅ Aprovado |
| CT10 | Vender 1 pastel em dinheiro recebendo R$ 20,00. | RF10, RN03 | Troco R$ 11,00. | total R$ 9,00, recebido R$ 20,00, troco R$ 11,00 | ✅ Aprovado |
| CT11 | Vender 1 pastel recebendo R$ 5,00. | RF10, RN03 | Recusado (400) com "Faltam R$ 4,00". | 400 "O valor recebido é menor que o total. Faltam R$ 4,00." | ✅ Aprovado |
| CT12 | Pedir 5 pastéis com 2 em estoque; conferir o estoque. | RF11 | Recusado (409) "Só restam 2"; estoque 3 → 2 após 1 venda. | pedido de 5 com estoque 2 → 409 "Só restam 2 de Pastel."; estoque 3 → 2 após 1 venda | ✅ Aprovado |
| CT13 | Pausar o pastel e tentar vender. | RF08 | Recusado (409) "não está à venda". | 409 "Pastel não está à venda agora." | ✅ Aprovado |
| CT14 | Suprimento de R$ 10,00, sangria de R$ 5,00 e sangria de R$ 9.999,99. | RF14, RN02, RN04 | Gaveta R$ 114,00; sangria maior que a gaveta recusada (400). | gaveta = 100,00 + 9,00 (dinheiro) + 10,00 − 5,00 = R$ 114,00; sangria de R$ 9.999,99 → 400 | ✅ Aprovado |
| CT15 | Vender 1 pastel no débito e cancelar. | RF11, RF12, RN06 | Venda cancelada e estoque devolvido (1 → 2). | venda cancelada; estoque voltou de 1 para 2 | ✅ Aprovado |
| CT16 | Fechar o caixa contando R$ 113,00. | RF15, RN10 | Esperado R$ 114,00; diferença −R$ 1,00 (faltou); turno guardado. | esperado R$ 114,00, contado R$ 113,00 → faltou R$ 1,00; turno nº 1 guardado | ✅ Aprovado |
| CT17 | Com o caixa fechado, tentar vender e fazer sangria. | RN05 | Recusado (409) nas duas ações. | venda 409 · sangria 409 | ✅ Aprovado |
| CT18 | Abrir o caixa com R$ 50,00 e tentar abrir de novo. | RF13, RN01 | Turno nº 2 com gaveta R$ 50,00; segunda abertura recusada (409). | turno nº 2 aberto com R$ 50,00; gaveta recomeça em R$ 50,00; abrir de novo → 409 | ✅ Aprovado |
| CT19 | Consultar o turno nº 1 e tentar cancelar uma venda dele. | RF16, RNF10, RN06 | Esperado e contado do turno 1 guardados; cancelamento recusado (409). | turno 1: esperado 114,00 e contado 113,00 guardados; cancelar venda dele → 409 | ✅ Aprovado |
| CT20 | Enviar um pedido com origem de outro site. | RNF05 | Recusado (403) "Origem não autorizada". | 403 "Origem não autorizada." | ✅ Aprovado |
| CT21 | Logado só como admin, abrir o caixa do curso. | RNF03, RF02 | A página mostra o login do curso; a API no modo curso recusa (401). | API no modo curso → 401; a página /caixa/direito mostra o login do curso | ✅ Aprovado |
| CT22 | Organização troca a senha do curso logado. | RF05 | Sessão antiga e senha antiga recusadas (401); senha nova aceita (200). | sessão antiga → 401; senha antiga → 401; senha nova → 200 | ✅ Aprovado |
| CT23 | Sair do caixa e tentar usar a API. | RF19 | Recusado (401) depois de sair. | 401 depois de sair | ✅ Aprovado |
| CT24 | Abrir o link de um curso que não existe. | RF01 | Página não encontrada (404). | 404 página não encontrada | ✅ Aprovado |
| CT25 | Abrir /caixa, tocar no curso e entrar com a senha (navegador). | RF01, RF02, RF20 | Lista os cursos; abre /caixa/<curso>; senha errada mostra o erro sem sair da tela. | Lista com 4 cursos; Enfermagem abriu /caixa/enfermagem; senha errada mostrou "Senha incorreta." na mesma tela; com a senha certa entrou no caixa. | ✅ Aprovado |
| CT26 | Montar comanda de R$ 20,00, receber R$ 50,00; repetir no celular (navegador). | RF09, RF10, RNF06 | Troco R$ 30,00 com sugestão de notas; no celular, 2 produtos por linha e comanda abaixo. | Comanda Combo Geek + 2 brigadeiros = R$ 20,00; recebido R$ 50,00 → troco R$ 30,00 (1× R$ 20 + 1× R$ 10); no celular, vitrine em 2 colunas e comanda abaixo. | ✅ Aprovado |
| CT27 | Fechar o caixa com R$ 2,00 a menos, abrir o recibo e baixar o CSV (navegador). | RF15, RF16, RF17, RF18, RNF11 | Recibo com itens, formas de pagamento, gaveta e "faltou R$ 2,00"; CSV abre no Excel com os mesmos números. | Turno 1 da Engenharia de Software: esperado R$ 134,50, contado R$ 132,50 → recibo "faltou R$ 2,00"; CSV com 6 produtos, Diferença -2,00 e Resultado "faltou R$ 2,00". | ✅ Aprovado |
| CT28 | Entrar como organização e clicar em Abrir caixa de um curso (navegador). | RF03, RF06 | Central com indicadores e links; Abrir caixa abre o login do curso em nova aba, sem botões da organização dentro. | Central com R$ 332,00 e 24 vendas; links /caixa/<curso> com Copiar link; Abrir caixa abriu /caixa/enfermagem em nova aba pedindo a senha; dentro, só "Olá, enfermagem" e Sair. | ✅ Aprovado |

## Matriz de rastreabilidade

| Requisito | Nome | Verificado por |
|---|---|---|
| RF01 | Escolher o curso | CT24, CT25 |
| RF02 | Entrar no caixa do curso | CT03, CT04, CT21, CT25 |
| RF03 | Acesso da organização | CT28 |
| RF04 | Criar barraca | CT01, CT02 |
| RF05 | Trocar a senha da barraca | CT22 |
| RF06 | Acompanhar o evento | CT28 |
| RF07 | Cadastrar e editar produtos | CT07, CT08 |
| RF08 | Pausar e excluir produtos | CT13 |
| RF09 | Registrar venda | CT09, CT26 |
| RF10 | Calcular o troco | CT10, CT11, CT26 |
| RF11 | Controlar o estoque | CT12, CT15 |
| RF12 | Cancelar venda | CT15 |
| RF13 | Abrir o caixa | CT01, CT18 |
| RF14 | Sangria e suprimento | CT14 |
| RF15 | Fechar o caixa | CT16, CT27 |
| RF16 | Guardar relatórios de caixa | CT19, CT27 |
| RF17 | Emitir recibo do turno | CT27 |
| RF18 | Exportar relatório | CT27 |
| RF19 | Sair | CT23 |
| RF20 | Modo demonstração | CT25 |
| RNF01 | Segurança das senhas | verificação de projeto (typecheck, testes automáticos, revisão) |
| RNF02 | Proteção contra adivinhação | CT05 |
| RNF03 | Isolamento entre barracas | CT03, CT06, CT21 |
| RNF04 | Integridade dos valores | CT09 |
| RNF05 | Proteção contra outros sites | CT20 |
| RNF06 | Usabilidade e celular | CT26 |
| RNF07 | Desempenho | verificação de projeto (typecheck, testes automáticos, revisão) |
| RNF08 | Tecnologia e compatibilidade | verificação de projeto (typecheck, testes automáticos, revisão) |
| RNF09 | Manutenibilidade | verificação de projeto (typecheck, testes automáticos, revisão) |
| RNF10 | Rastreabilidade do caixa | CT19 |
| RNF11 | Compatibilidade da exportação | CT27 |
| RNF12 | Privacidade (LGPD) | verificação de projeto (typecheck, testes automáticos, revisão) |
