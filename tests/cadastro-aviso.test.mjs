import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const form=readFileSync('src/components/CadastroForm.tsx','utf8');
const css=readFileSync('src/app/globals.css','utf8');
const entrar=readFileSync('src/app/entrar/route.ts','utf8');
const sessao=readFileSync('src/app/api/sessao/route.ts','utf8');
const participantes=readFileSync('src/app/api/participantes/route.ts','utf8');
const security=readFileSync('src/lib/security.ts','utf8');

test('cadastro concluído usa o tema do formulário e texto neutro',()=>{
 assert.match(form,/status==='bloqueado'.*return <main className="pagina">/s);
 assert.match(form,/cartao-formulario cartao-cadastro-realizado/);
 assert.match(css,/\.pagina \{/);
 assert.match(css,/banner-hallowgeek\.webp/);
 assert.match(css,/\.cartao-cadastro-realizado/);
 assert.match(form,/>Cadastro já realizado</);
 assert.match(form,/Não é possível realizar outro cadastro\./);
 assert.doesNotMatch(form,/>[^<]*(?:navegador|cookie|dispositivo|aparelho)/i);
});
test('novo QR no mesmo navegador abre a página temática sem emitir nova sessão',()=>{
 assert.match(entrar,/if\(resultado==='duplicado'\)\{[\s\S]*?NextResponse\.redirect\(new URL\('\/cadastro',getBaseUrl\(request\)\),303\)/);
 assert.match(entrar,/if\(resultado==='duplicado'\)[\s\S]*?return response;/);
 assert.match(entrar,/res\.cookies\.set\(qrSessionCookie/);
});
test('APIs públicas retornam erro neutro sem explicar a trava',()=>{
 assert.match(sessao,/jsonError\('Cadastro já realizado\.',409\)/);
 assert.match(participantes,/Error\('Cadastro já realizado\.'\)/);
 assert.match(security,/if\(e\.constraint==='dispositivos_cadastrados_pkey'\)return 'Cadastro já realizado\.'/);
 assert.match(form,/r\.status===409&&data\.mensagem==='Cadastro já realizado\.'/);
 assert.match(form,/localStorage\.setItem\(STORE_KEY,'1'\)/);
});
