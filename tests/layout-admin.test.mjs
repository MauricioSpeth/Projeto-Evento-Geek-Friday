import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const admin = readFileSync(new URL('../src/components/AdminPanel.tsx', import.meta.url), 'utf8');
const cadastro = readFileSync(new URL('../src/components/CadastroForm.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
const api = readFileSync(new URL('../src/app/api/participantes/route.ts', import.meta.url), 'utf8');

test('aviso orienta usuário a procurar a portaria', () => {
  assert.match(cadastro, /Se precisar corrigir alguma informação, procure a portaria do evento\./);
  assert.doesNotMatch(cadastro, /procure a organização do evento/);
});

test('gráficos no topo, cadastros na sequência e controle no fim', () => {
  const index = (term) => admin.indexOf(term);
  assert.ok(index('className="resumo"') < index('className="graficos"'));
  assert.ok(index('className="graficos"') < index('className="cartao cartao-tabela"'));
  assert.ok(index('className="cartao cartao-tabela"') < index('<ControleEvento onStatusChange={setEventoAtivo}/>'));
});

test('lista interna com rolagem e ordem dos registros recentes', () => {
  assert.match(css, /\.tabela-scroll\s*\{[^}]*max-height:\s*360px;[^}]*overflow:\s*auto;/s);
  assert.match(css, /\.tabela-cadastros tbody tr\s*\{[^}]*height:\s*64px;/s);
  assert.match(css, /\.tabela-cadastros th\s*\{[^}]*position:\s*sticky;/s);
  assert.match(admin, /className="tabela-scroll" tabIndex=\{0\}/);
  assert.match(api, /ORDER BY id DESC/);
});
