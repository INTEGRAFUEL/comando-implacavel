const SB_URL='https://nwcixkllbxmetfcozkwb.supabase.co',SB_KEY='sb_publishable_kZ8Rmo4zBi0undvEfe5GGQ_mAbFdk4B',OWNER='dd3e1b45-230a-48aa-8d7d-01df7cfe9d0a';
const sb=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'comando-integra-auth'}});
const CATS={dia:'Dia a dia',fuel:'Chamados FUEL',air:'Chamados AIR',b2b:'B2B',pessoas:'Pessoas importantes',potenciais:'Clientes potenciais',rotas:'Rotas importantes'};
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hoje=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const dias=(a,b)=>Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/864e5);
const fmtD=d=>d.split('-').reverse().slice(0,2).join('/');
let started=false,pos=0,paused=false,lastHtml='',rt=null;
function tick(){const n=new Date();$('#clk').firstChild.textContent=n.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
 $('#dt').textContent=n.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
setInterval(tick,1000);tick();
$('#fs').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>{});
async function boot(){const{data:{session}}=await sb.auth.getSession();
 if(!session||session.user.id!==OWNER){if(session)await sb.auth.signOut({scope:'local'});$('#login').hidden=false;return}
 $('#login').hidden=true;if(started)return;started=true;await load();setInterval(load,90000);
 rt=sb.channel('painel').on('postgres_changes',{event:'*',schema:'public',table:'cmd_items'},()=>load()).subscribe();requestAnimationFrame(step)}
$('#lf').onsubmit=async e=>{e.preventDefault();const code=($('#lc').value||'').replace(/\D/g,'');if(!code)return $('#lmsg').textContent='Informe o código.';$('#lmsg').textContent='Entrando…';
 try{const r=await fetch(SB_URL+'/functions/v1/cmd-code-login',{method:'POST',headers:{'Content-Type':'application/json','apikey':SB_KEY},body:JSON.stringify({code})});
  const j=await r.json().catch(()=>({}));$('#lc').value='';
  if(!r.ok||!j.token_hash)return $('#lmsg').textContent=j.error||'Código inválido.';
  const{error}=await sb.auth.verifyOtp({token_hash:j.token_hash,type:'email'});if(error)return $('#lmsg').textContent='Falha ao entrar.';
  $('#lmsg').textContent='';boot()}catch(_){$('#lmsg').textContent='Sem conexão.'}};
sb.auth.onAuthStateChange(e=>{if(e==='SIGNED_OUT'){$('#login').hidden=false}});
function item(i,h){const P='P'+i.prioridade;let tg='';
 if(i.data&&i.data<h){const n=dias(i.data,h);tg=`<span class="tag late">ATRASADO ${n} DIA${n>1?'S':''}</span>`}else if(i.data===h)tg='<span class="tag hj">HOJE</span>';else if(i.data)tg=`<span class="tag">${fmtD(i.data)}</span>`;else tg='<span class="tag">SEM DATA</span>';
 return `<div class="it ${P}"><div class="hr">${i.hora?i.hora.slice(0,5):'--:--'}</div><div class="bd"><span class="tag t${P}">${P}</span>${tg}<span class="tag">${esc(CATS[i.categoria]||i.categoria)}</span>${i.status==='EM ANDAMENTO'?'<span class="tag">EM ANDAMENTO</span>':''}
 <div class="t">${esc(i.titulo)}</div>${i.proxima_acao?`<div class="m">➡️ ${esc(i.proxima_acao)}</div>`:''}${i.local?`<div class="m">📍 ${esc(i.local)}</div>`:''}</div></div>`}
async function load(){const{data,error}=await sb.from('cmd_items').select('*').in('status',['ABERTO','EM ANDAMENTO']);
 if(error){$('#st').textContent='Erro ao atualizar: '+error.message;if(/JWT|auth/i.test(error.message))boot();return}
 const h=hoje(),o=(a,b)=>(a.data||'9999').localeCompare(b.data||'9999')||a.prioridade-b.prioridade||(a.hora||'99').localeCompare(b.hora||'99');
 const at=data.filter(i=>i.data&&i.data<h).sort(o),hj=data.filter(i=>i.data===h).sort((a,b)=>(a.hora||'99').localeCompare(b.hora||'99')||a.prioridade-b.prioridade),pr=data.filter(i=>!i.data||i.data>h).sort(o);
 const sec=(t,l)=>l.length?`<div class="sec">${t} (${l.length})</div>`+l.map(i=>item(i,h)).join(''):'';
 $('#cnt').textContent=`${data.length} abertos · ${at.length} atrasados · ${hj.length} hoje`;
 $('#st').textContent='Atualizado '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
 const html=data.length?`<div class="blk">${sec('⚠️ Atrasados',at)}${sec('📅 Hoje',hj)}${sec('🔜 Próximos',pr)}<div style="height:80px"></div></div>`:'<div class="empty">Nada pendente. Comando limpo. 💪</div>';
 if(html===lastHtml)return;lastHtml=html;const tr=$('#track');tr.innerHTML=html;
 const blk=tr.querySelector('.blk');if(blk&&blk.offsetHeight>$('#vp').clientHeight)tr.innerHTML=html+html;else pos=0;
 const bh=tr.querySelector('.blk')?.offsetHeight||1;pos=pos%bh}
$('#vp').onmouseenter=()=>paused=true;$('#vp').onmouseleave=()=>paused=false;
let lt=0;function step(t){const dt=lt?Math.min(t-lt,100):0;lt=t;const tr=$('#track'),blk=tr.querySelector('.blk');
 if(blk&&tr.children.length>1&&!paused){pos+=dt*0.04;const bh=blk.offsetHeight;if(pos>=bh)pos-=bh}
 if(!(tr.children.length>1))pos=0;tr.style.transform=`translateY(${-pos}px)`;requestAnimationFrame(step)}
boot();
