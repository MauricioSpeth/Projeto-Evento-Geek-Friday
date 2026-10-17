// CSV para planilhas brasileiras: UTF-8 com BOM e separador ponto e vírgula.
// Não exportar dados administrativos, tokens nem identificadores do navegador.
export type TipoExportacao='todos'|'alunos';
export type LinhaParticipante={
 id:number;nome:string;tipo:string;curso:string|null;periodo:number|null;
 data_hora:Date|string;origem_cadastro:string|null;
};
const COLUNAS=['ID','Nome','Tipo','Curso','Período','Data/Hora','Origem do cadastro'];
const TIPO:Record<string,string>={aluno:'Aluno',professor:'Professor',visitante:'Visitante'};
export function campo(valor:unknown):string{
 let s=String(valor??'').replace(/[\r\n\t]/g,' ');
 // Neutraliza valores interpretáveis como fórmulas no Excel/LibreOffice.
 if(/^[\s]*[=+@-]/u.test(s))s="'"+s;
 return '"'+s.replace(/"/g,'""')+'"';
}
function dataBrasil(valor:Date|string):string{
 if(!valor)return '';
 const date=new Date(valor);
 if(Number.isNaN(date.getTime()))return '';
 return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date).replace(',','');
}
export function gerarCSV(participantes:LinhaParticipante[]):string{
 const linhas=[COLUNAS.map(campo).join(';')];
 for(const p of participantes){
  const valores=[p.id,p.nome,TIPO[p.tipo]??p.tipo,p.curso??'',p.periodo??'',dataBrasil(p.data_hora),p.origem_cadastro??''];
  linhas.push(valores.map(campo).join(';'));
 }
 return '\uFEFF'+linhas.join('\r\n')+'\r\n';
}
const QUERY_BASE='SELECT id,nome,tipo,curso,periodo,data_hora,origem_cadastro FROM participantes';
export function consulta(tipo:string):{sql:string;params:string[]}|null{
 if(tipo!=='todos'&&tipo!=='alunos')return null;
 return {sql:QUERY_BASE+(tipo==='alunos'?' WHERE tipo = $1':'')+' ORDER BY id ASC',params:tipo==='alunos'?['aluno']:[]};
}
export function nomeArquivo(tipo:TipoExportacao):string{
 return 'hallowgeek-'+(tipo==='alunos'?'somente-alunos':'todos-cadastros')+'-'+new Date().toISOString().slice(0,10)+'.csv';
}
