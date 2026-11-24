let ART=false,AT=null,AD=null,AX={tab:'novas'};
const NT=a=>['Solicitação recebida','Aguardando resposta','Aguardando consulta','Aguardando confirmação'].includes(a.status);
async function artistBoot(token){ART=true;AT=token;document.body.classList.add('artsite');
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
try{const m={name:'TattoHub',short_name:'TattoHub',start_url:location.href,scope:'/',display:'standalone',background_color:'#000000',theme_color:'#000000',icons:[{src:location.origin+'/icon-192.png',sizes:'192x192',type:'image/png'},{src:location.origin+'/icon-512.png',sizes:'512x512',type:'image/png'}]},l=document.querySelector('link[rel=manifest]');if(l)l.href=URL.createObjectURL(new Blob([JSON.stringify(m)],{type:'application/manifest+json'}))}catch(e){}
$('#aw').innerHTML='<p class="sub" style="text-align:center;padding:48px">Carregando…</p>';
await artLoad(true);setInterval(()=>{if(!document.hidden)artLoad(false)},15000);pushState().then(s=>{PUSH=s;render()})}
async function artLoad(first){const{data,error}=await sb.rpc('artist_portal_get',{p_token:AT});
if(error||!data){if(first)$('#aw').innerHTML=`<div class="empty" style="padding:80px 12px"><img src="${LG}" alt="TattoHub" style="height:56px"><p>Link inválido ou desativado. Peça um novo link ao estúdio.</p></div>`;return}
const prev=AD;AD=data;
const A=data.appointments.map(x=>{const t=fromTs(x.start_at);return{id:x.id,cid:x.id,style:x.style||'',desc:x.description||'',part:x.body_part||'',date:t.date,time:t.time,dur:x.duration_min,status:STC[x.status],price:x.price==null?null:+x.price,cname:x.client_name,cphone:x.client_phone||''}});
S={studio:{name:data.studio.name,slug:data.studio.slug},clients:A.map(a=>({id:a.id,name:a.cname,phone:a.cphone})),appts:A,artists:[],pays:[]};
if(prev){const nv=data.appointments.filter(x=>x.status=='solicitacao_recebida'&&!prev.appointments.some(o=>o.id==x.id));if(nv.length){toast('Novo agendamento: '+nv[0].client_name);beep()}}
render()}
const artPushCard=()=>(PUSH=='inativo'||(PUSH=='nao'&&isIOS()&&!standalone()))?`<div class="card row" style="margin-bottom:14px"><div><b>Receba avisos de novos agendamentos</b><div class="sub">Ative uma vez neste aparelho.</div></div><button class="btn" onclick="artPush()">Ativar avisos</button></div>`:'';
async function artPush(){if(isIOS()&&!standalone())return enablePush();if(!pushOK())return toast('Este navegador não suporta avisos.');
try{const reg=await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;const perm=await Notification.requestPermission();
if(perm!='granted'){PUSH=perm=='denied'?'negado':'inativo';toast('Permissão negada. Libere os avisos nas configurações do navegador.');return render()}
let sub=await reg.pushManager.getSubscription();if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(window.TH.vapid)});
const j=sub.toJSON(),{error}=await sb.rpc('artist_portal_subscribe',{p_token:AT,p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_ua:navigator.userAgent});if(error)throw error;PUSH='ativo';render();toast('Avisos ativados neste aparelho')}catch(e){console.error(e);toast('Não foi possível ativar os avisos.')}}
function artRender(){if(!AD)return;const A=S.appts,tabs=[['novas','Novas',NT],['conf','Confirmados',a=>a.status=='Confirmado'],['conc','Concluídos',a=>a.status=='Concluído']],cnt=tabs.map(t=>A.filter(t[2]).length),tab=AX.tab,T=tabs.find(t=>t[0]==tab)||tabs[0],dir=tab=='conc'?-1:1,key=x=>x.date?x.date+x.time:(dir>0?'9999':'');
const L=A.filter(T[2]).sort((x,y)=>dir*key(x).localeCompare(key(y)));
$('#aw').innerHTML=`<div class="ptop" style="justify-content:space-between;align-items:center"><img src="${LG}" alt="TattoHub"><button class="btn g sm" onclick="artProfile()">Meu perfil</button></div>
<h1 class="hi">Olá, ${esc(AD.artist.name.split(' ')[0])}!</h1><div class="sub" style="margin-bottom:14px">${esc(AD.studio.name)} · seus agendamentos</div>${artPushCard()}
<div class="tabs">${tabs.map((t,i)=>`<button class="tb${tab==t[0]?' on':''}" onclick="AX.tab='${t[0]}';render()">${t[1]}${cnt[i]?`<i>${cnt[i]}</i>`:''}</button>`).join('')}</div>
<div class="card">${L.length?L.map(x=>`<div class="ap2" onclick="artOpen('${x.id}')"><div class="when"><b>${x.date?fd(x.date).slice(0,5):'—'}</b><small>${x.time||'sem horário'}</small></div><div><b>${esc(x.cname)}</b><div class="sub">${esc(x.style)||'Sem estilo'}${x.price!=null?' · '+brl(x.price):''}</div></div><span class="bd" style="color:${col(x.status)}">${x.status}</span></div>`).join(''):emp({novas:'Nenhuma solicitação nova',conf:'Nenhum agendamento confirmado',conc:'Nenhum atendimento concluído'}[tab])}</div>`}
function artOpen(id){const a=ap(id);if(!a)return;const u=waLink(a);
modal(esc(a.cname),`<div style="margin-bottom:10px"><span class="bd" style="color:${col(a.status)}">${a.status}</span> <span class="sub">${esc(a.cphone)}</span></div>
<div class="row"><span class="sub">Quando</span><span>${a.date?fd(a.date)+' às '+a.time:'Sem horário definido'}</span></div>
<div class="row"><span class="sub">O quê</span><span>${esc(a.style)||'—'}${a.part?' · '+esc(a.part):''}</span></div>
${a.desc?`<p class="sub" style="margin:8px 0">${esc(a.desc)}</p>`:''}${a.price!=null?`<div class="row"><span class="sub">Valor</span><b>${brl(a.price)}</b></div>`:''}
<label style="margin-top:12px">Status<select onchange="artSet('${id}',this.value)">${(STSEL.includes(a.status)?STSEL:[a.status,...STSEL]).map(s=>`<option${s==a.status?' selected':''}>${s}</option>`).join('')}</select></label>
<div class="sub" style="margin:-4px 0 12px">Ao mudar o status, você pode avisar o cliente pelo WhatsApp.</div>
${u?`<a class="btn" style="width:100%" href="${u}" target="_blank" rel="noopener">Falar no WhatsApp</a>`:'<button class="btn" disabled style="width:100%">Cliente sem telefone</button>'}`,null)}
async function artSet(id,s){const{error}=await sb.rpc('artist_portal_set_status',{p_token:AT,p_appt:id,p_status:STK[s]});if(error){toast('Não foi possível mudar o status. Pode haver conflito de horário.');return artLoad(false)}const a=ap(id);if(a)a.status=s;render();cm();waSend(id)}
function artProfile(){const a=AD.artist,u=location.origin+'/t/'+AD.studio.slug+'/'+a.slug;
modal('Meu perfil',`<p class="sub" style="margin-top:0">Seu link de agendamento para os clientes:</p><input readonly value="${u}" onclick="this.select()" style="width:100%;margin-bottom:12px"><label>Sobre você<textarea name="bio" rows="3" maxlength="600">${esc(a.bio||'')}</textarea></label>${fld('Instagram','insta',a.instagram||'')}${fld('WhatsApp','zap',a.whatsapp||'')}`,async f=>{const{error}=await sb.rpc('artist_portal_update_profile',{p_token:AT,p_bio:f.bio,p_instagram:f.insta,p_whatsapp:f.zap});if(error)return err('Não foi possível salvar agora.');cm();await artLoad(false);toast('Perfil salvo')})}

const waBtn=st=>{const n=waNum(st.zap);return n?`<a class="btn sm" href="https://wa.me/${n}?text=${encodeURIComponent('Olá! Vi o seu perfil no TattoHub e gostaria de saber mais sobre agendar uma tatuagem.')}" target="_blank" rel="noopener">Falar no WhatsApp</a>`:''};
