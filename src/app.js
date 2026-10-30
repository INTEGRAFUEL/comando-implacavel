const SB_URL='https://nwcixkllbxmetfcozkwb.supabase.co',SB_KEY='sb_publishable_kZ8Rmo4zBi0undvEfe5GGQ_mAbFdk4B',OWNER='dd3e1b45-230a-48aa-8d7d-01df7cfe9d0a';
const loginEmail=v=>{v=v.trim();return v.includes('@')?v:(v.toLowerCase()==='jbrianezi'?'brianezi.heritage@gmail.com':v)};
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
async function boot(){const{data:{session}}=await sb.auth.getSession();if(!session)return showLogin();
 if(session.user.id!==OWNER){await sb.auth.signOut();return showLogin('Acesso restrito.')}
 $('#login').hidden=true;$('#app').hidden=false;await load()}
function showLogin(msg){$('#app').hidden=true;$('#login').hidden=false;$('#lmsg').textContent=msg||''}
$('#lf').onsubmit=async e=>{e.preventDefault();$('#lmsg').textContent='Entrando…';const{error}=await sb.auth.signInWithPassword({email:loginEmail($('#le').value),password:$('#lp').value});if(error)return $('#lmsg').textContent='E-mail ou senha inválidos.';boot()};
$('#out').onclick=async()=>{await sb.auth.signOut();showLogin()};
async function load(){const[a,b]=await Promise.all([sb.from('cmd_items').select('*'),sb.from('cmd_sugestoes').select('*').eq('status','pendente').order('created_at')]);
 if(a.error||b.error){alert('Erro ao carregar: '+(a.error||b.error).message);return}items=a.data;sugs=b.data;render()}
function render(){const tabs=[['hoje','HOJE'],...Object.entries(CATS),['radar','Sugestões do RADAR'+(sugs.length?`<span class="badge">${sugs.length}</span>`:'')],['feitos','Concluídos']];
 $('#tabs').innerHTML=tabs.map(([k,v])=>`<button class="${k===tab?'on':''}" data-t="${k}">${v}</button>`).join('');
 document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{tab=b.dataset.t;render()});
 let h='';if(tab==='hoje'){const l=items.filter(i=>aberto(i)&&i.data&&i.data<=hoje()).sort(ordHora),at=l.filter(late);
  h=`<h2>Cronograma de ${fmtD(hoje())} — ${l.length} itens</h2>`+(at.length?`<div class="row"><button class="pri" onclick="reprogTodos(0)">Atrasados (${at.length}) → hoje</button><button onclick="reprogTodos(1)">Atrasados → amanhã</button></div>`:'')+(l.map(card).join('')||'<div class="empty">Nada para hoje. Comando limpo.</div>');
  const sem=items.filter(i=>aberto(i)&&!i.data).sort(ord);if(sem.length)h+='<h2>Sem data</h2>'+sem.map(card).join('')}
 else if(tab==='radar'){h='<h2>Sugestões pendentes</h2>'+(sugs.map(scard).join('')||'<div class="empty">Nenhuma sugestão pendente.</div>')}
 else if(tab==='feitos'){h='<h2>Concluídos / cancelados</h2>'+items.filter(i=>!aberto(i)).sort((a,b)=>b.updated_at.localeCompare(a.updated_at)).slice(0,100).map(card).join('')}
 else{const l=items.filter(i=>i.categoria===tab&&aberto(i)).sort(ord);h=`<h2>${CATS[tab]}</h2>`+(l.map(card).join('')||'<div class="empty">Vazio.</div>')}
 $('#main').innerHTML=h}
function wa(t){const n=String(t||'').replace(/\D/g,'');return n?`https://wa.me/${n.length<=11?'55'+n:n}`:''}
function card(i){const P='P'+i.prioridade;return `<div class="card ${P} ${late(i)?'late':''}"><div><span class="tag t${P}">${P}</span><span class="tag">${CATS[i.categoria]}</span>${late(i)?'<span class="tag tP1">ATRASADO</span>':''}${i.status!=='ABERTO'?`<span class="tag">${i.status}</span>`:''}</div>
 <div class="t">${esc(i.titulo)}</div><div class="m">${i.data?fmtD(i.data):'sem data'}${i.hora?' · '+i.hora.slice(0,5):''}${i.local?' · 📍'+esc(i.local):''}${i.valor!=null?' · R$ '+Number(i.valor).toLocaleString('pt-BR',{minimumFractionDigits:2}):''}</div>
 ${i.descricao?`<div class="m">${esc(i.descricao)}</div>`:''}${i.proxima_acao?`<div class="m">➡️ ${esc(i.proxima_acao)}</div>`:''}
 ${i.contato_nome||i.contato_tel?`<div class="m">👤 ${esc(i.contato_nome)} ${i.contato_tel?`<a href="${wa(i.contato_tel)}" target="_blank" rel="noopener">WhatsApp ${esc(i.contato_tel)}</a>`:''}</div>`:''}
 <div class="row">${aberto(i)?`<button class="ok" onclick="concluir('${i.id}')">✓ Concluir</button><button onclick="reprog('${i.id}',1)">Amanhã</button><button onclick="reprog('${i.id}',2)">+2 dias</button><button onclick="reprogEsc('${i.id}')">📅 Data</button>`:''}<button onclick="editar('${i.id}')">Editar</button></div></div>`}
function scard(s){const p=s.payload||{};return `<div class="card P${p.prioridade||3}"><div><span class="tag tP${p.prioridade||3}">P${p.prioridade||3}</span><span class="tag">${CATS[p.categoria]||'Dia a dia'}</span><span class="tag">${esc(s.origem)}</span></div><div class="t">${esc(p.titulo)}</div><div class="m">${p.data?fmtD(p.data):''} ${p.hora||''} ${esc(p.descricao||'')}</div>
 <div class="row"><button class="ok" onclick="aprovar('${s.id}')">Aprovar</button><button onclick="aprovar('${s.id}')">Editar</button><button class="bad" onclick="recusar('${s.id}')">Recusar</button></div></div>`}
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
sb.auth.onAuthStateChange(e=>{if(e==='SIGNED_OUT')showLogin()});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');boot();
