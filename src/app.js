const SB_URL='https://nwcixkllbxmetfcozkwb.supabase.co',SB_KEY='sb_publishable_kZ8Rmo4zBi0undvEfe5GGQ_mAbFdk4B',OWNER='dd3e1b45-230a-48aa-8d7d-01df7cfe9d0a';
const sb=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'comando-integra-auth'}});
const CATS={dia:'Dia a dia',fuel:'Chamados FUEL',air:'Chamados AIR',b2b:'B2B',pessoas:'Pessoas importantes',potenciais:'Clientes potenciais',rotas:'Rotas importantes'};
const STS=['ABERTO','EM ANDAMENTO','CONCLUÍDO','CANCELADO'],$=s=>document.querySelector(s);
let items=[],sugs=[],tab='hoje';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hoje=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const addD=n=>{const d=new Date(hoje()+'T12:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const fmtD=d=>d?d.split('-').reverse().slice(0,2).join('/'):'';
const aberto=i=>i.status==='ABERTO'||i.status==='EM ANDAMENTO';
const late=i=>aberto(i)&&i.data&&i.data<hoje();
const ord=(a,b)=>a.prioridade-b.prioridade||(a.data||'9999').localeCompare(b.data||'9999')||(a.hora||'99').localeCompare(b.hora||'99');
const ordHora=(a,b)=>(a.hora||'99').localeCompare(b.hora||'99')||a.prioridade-b.prioridade;
const APP_URL='https://integrafuel.github.io/comando-implacavel/';
let recovering=false;
function showOnly(which){['lf','rf','nf'].forEach(id=>{const el=$('#'+id);if(el)el.hidden=id!==which});}
async function enterApp(){$('#login').hidden=true;$('#app').hidden=false;await load()}
async function boot(){const{data:{session}}=await sb.auth.getSession();if(!session)return showLogin();
 if(session.user.id!==OWNER){await sb.auth.signOut({scope:'local'});return showLogin('Acesso restrito.')}
 if(recovering)return showNewCode();
 await enterApp()}
function showLogin(msg){$('#app').hidden=true;$('#login').hidden=false;recovering=false;showOnly('lf');$('#lmsg').textContent=msg||'';$('#rmsg').textContent='';$('#nmsg').textContent=''}
function showRecover(msg){$('#app').hidden=true;$('#login').hidden=false;showOnly('rf');$('#rmsg').textContent=msg||''}
function showNewCode(msg){$('#app').hidden=true;$('#login').hidden=false;recovering=true;showOnly('nf');$('#nmsg').textContent=msg||'Defina um novo código numérico (4 a 12 dígitos).'}
$('#lf').onsubmit=async e=>{e.preventDefault();const code=($('#lc').value||'').replace(/\D/g,'');if(!code)return $('#lmsg').textContent='Informe o código.';$('#lmsg').textContent='Entrando…';$('#lf button').disabled=true;
 try{const r=await fetch(SB_URL+'/functions/v1/cmd-code-login',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify({code})});
  const j=await r.json().catch(()=>({}));
  if(r.status===429){$('#lmsg').textContent=j.error||'Muitas tentativas. Aguarde.';return}
  if(!r.ok||!j.token_hash){$('#lmsg').textContent=j.error||'Código inválido.';return}
  const{error}=await sb.auth.verifyOtp({token_hash:j.token_hash,type:'email'});
  if(error){$('#lmsg').textContent='Falha ao entrar. Tente de novo.';return}
  $('#lc').value='';boot()}catch(err){$('#lmsg').textContent='Sem conexão. Tente de novo.'}finally{$('#lf button').disabled=false}};
$('#forgot').onclick=()=>showRecover();
$('#rback').onclick=()=>showLogin();
$('#rf').onsubmit=async e=>{e.preventDefault();$('#rmsg').textContent='Enviando…';$('#rf button.pri').disabled=true;
 try{const{error}=await sb.auth.resetPasswordForEmail('brianezi.heritage@gmail.com',{redirectTo:APP_URL});
  if(error){$('#rmsg').textContent='Não foi possível enviar. Tente de novo.';return}
  $('#rmsg').textContent='Link enviado para brianezi.heritage@gmail.com. Abra o e-mail e defina o novo código.'}catch(err){$('#rmsg').textContent='Sem conexão. Tente de novo.'}finally{$('#rf button.pri').disabled=false}};
$('#nf').onsubmit=async e=>{e.preventDefault();const a=($('#nc').value||'').replace(/\D/g,''),b=($('#ncc').value||'').replace(/\D/g,'');
 if(a.length<4||a.length>12)return $('#nmsg').textContent='Use de 4 a 12 dígitos.';
 if(a!==b)return $('#nmsg').textContent='Os códigos não conferem.';
 $('#nmsg').textContent='Salvando…';$('#nf button').disabled=true;
 try{const{data:{session}}=await sb.auth.getSession();if(!session){showLogin('Sessão expirada. Peça um novo link.');return}
  // Completa o fluxo de recovery do Auth com senha aleatória (não é o código do app).
  const rnd=crypto.randomUUID()+crypto.randomUUID();
  const{error:uErr}=await sb.auth.updateUser({password:rnd});
  if(uErr){$('#nmsg').textContent='Falha ao confirmar. Peça um novo link.';return}
  const{data:{session:s2}}=await sb.auth.getSession();
  const r=await fetch(SB_URL+'/functions/v1/cmd-set-code',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY,'Authorization':'Bearer '+(s2||session).access_token},body:JSON.stringify({code:a})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){$('#nmsg').textContent=j.error||'Falha ao salvar código.';return}
  $('#nc').value='';$('#ncc').value='';recovering=false;await enterApp()}catch(err){$('#nmsg').textContent='Sem conexão. Tente de novo.'}finally{$('#nf button').disabled=false}};
$('#out').onclick=async()=>{await sb.auth.signOut({scope:'local'});showLogin()};
async function load(){const[a,b]=await Promise.all([sb.from('cmd_items').select('*'),sb.from('cmd_sugestoes').select('*').eq('status','pendente').order('created_at')]);
 if(a.error||b.error){alert('Erro ao carregar: '+(a.error||b.error).message);return}items=a.data;sugs=b.data;render()}
function listas(){const h=hoje(),open=items.filter(aberto);
 const agenda=open.filter(i=>i.data===h).sort(ordHora);
 const emg=open.filter(i=>late(i)||i.prioridade===1).sort((a,b)=>(late(a)?0:1)-(late(b)?0:1)||ord(a,b));
 const pen=open.filter(i=>i.data!==h&&!late(i)&&i.prioridade!==1).sort(ord);
 const done=items.filter(i=>!aberto(i)).sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
 return {open,agenda,emg,pen,done}}
function foco(k){if(k==='feitos'){tab='feitos';render();return}tab='hoje';render();
 const id=k==='emg'?'sec-emg':k==='pen'?'sec-pen':'sec-agenda';document.getElementById(id)?.scrollIntoView({block:'start'})}
function render(){const L=listas();
 const tabs=[['hoje','HOJE'],...Object.entries(CATS),['radar','Sugestões do RADAR'+(sugs.length?`<span class="badge">${sugs.length}</span>`:'')],['feitos','Concluídos']];
 $('#tabs').innerHTML=tabs.map(([k,v])=>`<button type="button" class="${k===tab?'on':''}" data-t="${k}">${v}</button>`).join('');
 document.querySelectorAll('#tabs [data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;render()});
 const kpis=[['agenda','Agenda',L.agenda.length,''],['emg','Emergências',L.emg.length,L.emg.length?'hot':''],['pen','Pendências',L.open.length,''],['feitos','Concluídos',L.done.length,tab==='feitos'?'on':'']];
 $('#kpis').innerHTML=kpis.map(([id,l,n,c])=>`<button type="button" class="kpi ${c}" data-foco="${id}"><b>${n}</b><span>${l}</span></button>`).join('');
 document.querySelectorAll('[data-foco]').forEach(b=>b.onclick=()=>foco(b.dataset.foco));
 const sec=(id,cls,title,count,note,body,head)=>`<section id="${id}" class="sec ${cls}"><div class="sechead"><h2>${title} <b>${count}</b></h2>${head||''}</div>${note?`<p class="note">${note}</p>`:''}${body}</section>`;
 let h='';if(tab==='hoje'){const at=items.filter(late),p1hoje=L.agenda.filter(i=>i.prioridade===1).length;
  const headAt=at.length?`<div class="row"><button type="button" class="pri" onclick="reprogTodos(0)">Atrasados (${at.length}) → hoje</button><button type="button" onclick="reprogTodos(1)">Atrasados → amanhã</button></div>`:'';
  const emgNote=p1hoje?(p1hoje===1?'1 P1 de hoje também está na agenda.':p1hoje+' P1 de hoje também estão na agenda.'):'';
  const shown=L.done.slice(0,4);
  const doneNote=L.done.length>shown.length?`Mostrando ${shown.length} de ${L.done.length}, com cancelados. O filtro Concluídos abre a lista.`:'Com cancelados. O filtro Concluídos abre a lista.';
  h=`<div class="board">`+
   sec('sec-emg','emg','Emergências',L.emg.length,emgNote,L.emg.map(card).join('')||'<div class="empty">Nenhuma emergência.</div>',headAt)+
   sec('sec-agenda','','Agenda de '+fmtD(hoje()),L.agenda.length,'',L.agenda.map(card).join('')||'<div class="empty">Nada na agenda de hoje.</div>')+
   sec('sec-pen','','Pendências',L.pen.length,'Fora da agenda de hoje e das emergências. Em aberto no total: '+L.open.length+'.',L.pen.map(card).join('')||'<div class="empty">Nada além da agenda e das emergências.</div>')+
   sec('sec-done','','Concluídos',L.done.length,doneNote,shown.map(card).join('')||'<div class="empty">Nenhum concluído.</div>')+
   `</div>`}
 else if(tab==='radar'){h=sec('sec-radar','','Sugestões pendentes',sugs.length,'',sugs.map(scard).join('')||'<div class="empty">Nenhuma sugestão pendente.</div>')}
 else if(tab==='feitos'){const all=L.done,l=all.slice(0,100);h=sec('sec-feitos','','Concluídos e cancelados',l.length,all.length>100?'Mostrando 100 de '+all.length+'.':'',l.map(card).join('')||'<div class="empty">Nenhum concluído ou cancelado.</div>')}
 else{const l=items.filter(i=>i.categoria===tab&&aberto(i)).sort(ord);h=sec('sec-cat','',esc(CATS[tab]),l.length,'',l.map(card).join('')||'<div class="empty">Nenhum item em aberto.</div>')}
 $('#main').innerHTML=h}
function wa(t){const n=String(t||'').replace(/\D/g,'');return n?`https://wa.me/${n.length<=11?'55'+n:n}`:''}
function card(i){const P='P'+i.prioridade,when=i.hora?i.hora.slice(0,5):(i.data?fmtD(i.data):'—');
 const meta=[];if(i.data&&i.hora)meta.push(fmtD(i.data));if(!i.data)meta.push('sem data');if(i.local)meta.push(esc(i.local));
 if(i.valor!=null)meta.push('R$ '+Number(i.valor).toLocaleString('pt-BR',{minimumFractionDigits:2}));if(i.proxima_acao)meta.push(esc(i.proxima_acao));
 return `<article class="card ${P}${late(i)?' late':''}${aberto(i)?'':' done'}"><div class="when">${when}</div><div class="bd"><div class="tline"><span class="tag t${P}">${P}</span><span class="tag">${esc(CATS[i.categoria]||'')}</span>${late(i)?'<span class="tag tP1">Atrasado</span>':''}${i.status!=='ABERTO'?`<span class="tag">${esc(i.status)}</span>`:''}<span class="t">${esc(i.titulo)}</span></div>
 ${meta.length?`<div class="m">${meta.join(' · ')}</div>`:''}${i.descricao?`<div class="m">${esc(i.descricao)}</div>`:''}
 ${i.contato_nome||i.contato_tel?`<div class="m">${esc(i.contato_nome||'')} ${i.contato_tel?`<a href="${wa(i.contato_tel)}" target="_blank" rel="noopener">WhatsApp ${esc(i.contato_tel)}</a>`:''}</div>`:''}</div>
 <div class="row">${aberto(i)?`<button type="button" class="ok" onclick="concluir('${i.id}')">Concluir</button><button type="button" onclick="reprog('${i.id}',1)">Amanhã</button><button type="button" onclick="reprog('${i.id}',2)">+2 dias</button><button type="button" onclick="reprogEsc('${i.id}')">Data</button>`:''}<button type="button" onclick="editar('${i.id}')">Editar</button></div></article>`}
function scard(s){const p=s.payload||{},pr=p.prioridade||3,P='P'+pr,when=p.hora?String(p.hora).slice(0,5):(p.data?fmtD(p.data):'—');
 const meta=[p.data?fmtD(p.data):'',p.descricao?esc(p.descricao):'',p.local?esc(p.local):''].filter(Boolean);
 return `<article class="card ${P}"><div class="when">${esc(when)}</div><div class="bd"><div class="tline"><span class="tag t${P}">${P}</span><span class="tag">${esc(CATS[p.categoria]||'Dia a dia')}</span><span class="tag">${esc(s.origem||'')}</span><span class="t">${esc(p.titulo)}</span></div>${meta.length?`<div class="m">${meta.join(' · ')}</div>`:''}</div>
 <div class="row"><button type="button" class="ok" onclick="aprovar('${s.id}')">Aprovar</button><button type="button" onclick="aprovar('${s.id}')">Editar</button><button type="button" class="bad" onclick="recusar('${s.id}')">Recusar</button></div></article>`}
const H=(i,txt)=>[...(i?.historico||[]),{em:new Date().toISOString(),txt}];
async function upd(id,ch,txt){const i=items.find(x=>x.id===id);const{error}=await sb.from('cmd_items').update({...ch,historico:H(i,txt)}).eq('id',id);if(error)alert(error.message);await load()}
window.concluir=id=>{const i=items.find(x=>x.id===id);if(confirm(`Concluir "${i.titulo}"?`))upd(id,{status:'CONCLUÍDO'},'Concluído')};
window.reprog=(id,n)=>{const d=addD(n);upd(id,{data:d},'Reprogramado para '+fmtD(d))};
window.reprogEsc=id=>{const i=items.find(x=>x.id===id);form('Reprogramar',`<label>Data</label><input name="data" type="date" value="${i.data||hoje()}" required><label>Hora</label><input name="hora" type="time" value="${(i.hora||'').slice(0,5)}">`,v=>upd(id,{data:v.data,hora:v.hora||null},`Reprogramado para ${fmtD(v.data)} ${v.hora||''}`))};
window.reprogTodos=async n=>{const at=items.filter(late),d=addD(n);if(!confirm(`Mover ${at.length} atrasados para ${fmtD(d)}?`))return;
 for(const i of at)await sb.from('cmd_items').update({data:d,historico:H(i,`Atrasado (${fmtD(i.data)}) reprogramado para ${fmtD(d)}`)}).eq('id',i.id);load()};
function campos(i={}){const o=(a,v)=>a.map(([k,l])=>`<option value="${k}" ${k==v?'selected':''}>${l}</option>`).join('');
 return `<label>Categoria</label><select name="categoria">${o(Object.entries(CATS),i.categoria||(CATS[tab]?tab:'dia'))}</select><label>Título</label><input name="titulo" required value="${esc(i.titulo)}">
 <label>Descrição</label><textarea name="descricao" rows="2">${esc(i.descricao)}</textarea><div class="g2"><div><label>Data</label><input name="data" type="date" value="${i.data||''}"></div><div><label>Hora</label><input name="hora" type="time" value="${(i.hora||'').slice(0,5)}"></div>
 <div><label>Prioridade</label><select name="prioridade">${o([[1,'P1 crítico'],[2,'P2 alto'],[3,'P3 normal'],[4,'P4 baixo']],i.prioridade||3)}</select></div><div><label>Status</label><select name="status">${o(STS.map(s=>[s,s]),i.status||'ABERTO')}</select></div>
 <div><label>Contato</label><input name="contato_nome" value="${esc(i.contato_nome)}"></div><div><label>Telefone/WhatsApp</label><input name="contato_tel" inputmode="tel" value="${esc(i.contato_tel)}"></div>
 <div><label>Local/cidade</label><input name="local" value="${esc(i.local)}"></div><div><label>Valor (R$)</label><input name="valor" inputmode="decimal" value="${i.valor??''}"></div></div>
 <label>Próxima ação</label><input name="proxima_acao" value="${esc(i.proxima_acao)}">`+(i.historico?.length?`<div class="hist"><b>Histórico</b><br>${i.historico.map(h=>new Date(h.em).toLocaleString('pt-BR')+' — '+esc(h.txt)).join('<br>')}</div>`:'')}
function norm(v){const r={...v};r.prioridade=+r.prioridade;for(const k of['data','hora','descricao','contato_nome','contato_tel','local','proxima_acao'])if(!r[k])r[k]=null;r.valor=r.valor?Number(String(r.valor).replace(/\./g,'').replace(',','.')):null;return r}
function form(tit,html,ok){const f=$('#f');f.innerHTML=`<h2>${tit}</h2>${html}<div class="row"><button class="pri" value="ok">Salvar</button><button value="x" formnovalidate>Cancelar</button></div>`;
 f.onsubmit=e=>{if(e.submitter?.value!=='ok')return;ok(Object.fromEntries(new FormData(f)))};$('#dlg').showModal()}
$('#add').onclick=()=>form('Novo item',campos(),async v=>{const{error}=await sb.from('cmd_items').insert({...norm(v),historico:H(null,'Criado')});if(error)alert(error.message);load()});
window.editar=id=>{const i=items.find(x=>x.id===id);form('Editar',campos(i),v=>{const n=norm(v);if(n.status==='CONCLUÍDO'&&i.status!=='CONCLUÍDO'&&!confirm('Confirmar conclusão?'))return;
 const mud=Object.keys(n).filter(k=>String(n[k]??'')!==String((k==='hora'?(i[k]||'').slice(0,5):i[k])??'')).join(', ');upd(id,n,'Editado: '+(mud||'sem mudanças'))})};
window.aprovar=id=>{const s=sugs.find(x=>x.id===id);form('Aprovar sugestão do RADAR',campos({...s.payload,status:'ABERTO'}),async v=>{
 const{error}=await sb.from('cmd_items').insert({...norm(v),origem:'RADAR',sugestao_id:id,historico:H(null,'Aprovado da sugestão do '+s.origem)});if(error)return alert(error.message);
 await sb.from('cmd_sugestoes').update({status:'aprovada',decided_at:new Date().toISOString()}).eq('id',id);load()})};
window.recusar=async id=>{if(!confirm('Recusar esta sugestão?'))return;await sb.from('cmd_sugestoes').update({status:'recusada',decided_at:new Date().toISOString()}).eq('id',id);load()};
sb.auth.onAuthStateChange(async(e,session)=>{
 if(e==='SIGNED_OUT'){recovering=false;return showLogin()}
 if(e==='PASSWORD_RECOVERY'){recovering=true;return showNewCode()}
 if(e==='SIGNED_IN'&&session?.user?.id===OWNER&&recovering)return showNewCode();
});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
(async()=>{
 // Sessão de recovery que chega pela URL (hash/query) antes do listener.
 const{data:{session}}=await sb.auth.getSession();
 const hash=location.hash||'',q=location.search||'';
 const looksRecovery=/type=recovery/i.test(hash+q)||/type=recovery/i.test(decodeURIComponent(hash+q));
 if(looksRecovery&&session){recovering=true;history.replaceState(null,'',location.pathname);return showNewCode()}
 boot();
})();
