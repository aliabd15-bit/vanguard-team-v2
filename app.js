import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Firebase web config supplied by the project owner.
const firebaseConfig = {
 apiKey: "AIzaSyC7AbFvAcq6ClQHJxavMfF-dAMCpqEvL-0",
 authDomain: "vanguard-team.firebaseapp.com",
 projectId: "vanguard-team",
 storageBucket: "vanguard-team.firebasestorage.app",
 messagingSenderId: "489371396068",
 appId: "1:489371396068:web:9e4825c76d04d8432b89f1"
};
const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
const $=id=>document.getElementById(id);
let members=[], tasks=[], growth=[];
const growthSteps=["تعیین هدف شخصی و درآمدی","ساخت فهرست اسامی اولیه","دعوت حرفه‌ای و محترمانه","ارائه معرفی کسب‌وکار","پیگیری اصولی مخاطبان","شروع فعالیت عضو جدید","آموزش محصول و خدمات","آموزش تولید محتوا","آموزش فروش شخصی","برگزاری جلسه هفتگی","پیگیری عملکرد اعضا","شناسایی افراد مستعد رهبری","واگذاری مسئولیت‌های کوچک","ساخت سرشاخه مستقل","تکثیر سیستم آموزشی","ارزیابی و برنامه‌ریزی ماهانه"];
const fa=n=>new Intl.NumberFormat('fa-IR').format(n||0);
function toast(s){let t=document.createElement('div');t.className='toast';t.textContent=s;document.body.append(t);setTimeout(()=>t.remove(),2600)}
function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',b.dataset.go===id));window.scrollTo(0,0)}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.go)));
$('loginBtn').onclick=async()=>{ $('loginMsg').textContent='در حال ورود…';try{await signInWithEmailAndPassword(auth,$('email').value.trim(),$('password').value)}catch(e){$('loginMsg').textContent=errorFa(e)}};
function errorFa(e){return ({'auth/invalid-credential':'ایمیل یا رمز عبور درست نیست.','auth/too-many-requests':'تعداد تلاش‌ها زیاد بوده؛ کمی بعد دوباره امتحان کنید.','auth/network-request-failed':'اتصال اینترنت را بررسی کنید.'})[e.code]||'ورود انجام نشد: '+e.message}
onAuthStateChanged(auth,async user=>{if(!user){$('login').classList.remove('hidden');$('app').classList.add('hidden');$('nav').classList.add('hidden');return}
try{
 const userRef=doc(db,'users',user.uid);
 const u=await getDoc(userRef);
 const data=u.exists()?u.data():{};
 const roleValue=data.role;
 const activeValue=data.active;
 if(!u.exists()||roleValue!=='admin'||activeValue!==true){
  const diagnostic=[
   'گزارش بررسی دسترسی:',
   'UID ورود: '+user.uid,
   'Project ID: '+firebaseConfig.projectId,
   'سند users پیدا شد: '+u.exists(),
   'role: '+(roleValue===undefined?'(وجود ندارد)':JSON.stringify(roleValue))+' | نوع: '+typeof roleValue,
   'active: '+(activeValue===undefined?'(وجود ندارد)':JSON.stringify(activeValue))+' | نوع: '+typeof activeValue
  ].join('\n');
  $('loginMsg').textContent=diagnostic;
  await signOut(auth);
  return
 }
 $('login').classList.add('hidden');$('app').classList.remove('hidden');$('nav').classList.remove('hidden');$('connection').textContent='متصل به Firebase';await loadAll()
}catch(e){$('loginMsg').textContent='خطا در بررسی مجوز: '+e.message;await signOut(auth)}});
$('logout').onclick=()=>signOut(auth);$('refresh').onclick=loadAll;
async function loadAll(){try{let [m,t,g]=await Promise.all([getDocs(collection(db,'members')),getDocs(collection(db,'tasks')),getDocs(collection(db,'growth'))]);members=m.docs.map(d=>({id:d.id,...d.data()}));tasks=t.docs.map(d=>({id:d.id,...d.data()}));growth=g.docs.map(d=>({id:d.id,...d.data()}));render();$('connection').textContent='متصل و همگام‌سازی‌شده'}catch(e){toast('خطا در دریافت داده‌ها: '+e.message);$('connection').textContent='خطا در اتصال'}}
function render(){let active=members.filter(x=>x.status==='active').length, sales=members.filter(x=>x.firstSale===true).length, leaders=members.filter(x=>x.role==='branchLeader').length;
$('total').textContent=fa(members.length);$('active').textContent=fa(active);$('sales').textContent=fa(sales);$('leaders').textContent=fa(leaders);
$('recent').innerHTML=members.slice().sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).slice(0,4).map(memberHtml).join('')||'<div class="empty">هنوز عضوی ثبت نشده است.</div>';
renderMembers();renderTree();renderTasks();renderGrowth();$('reportText').innerHTML=[['کل اعضا',members.length],['اعضای فعال',active],['دارای اولین فروش',sales],['سرشاخه‌ها',leaders],['وظایف باز',tasks.filter(t=>!t.done).length]].map(([a,b])=>`<div class="item"><b>${a}</b><strong>${fa(b)}</strong></div>`).join('')}
function memberHtml(m){return `<div class="item"><div><b>${esc(m.name||'بدون نام')}</b><small>${esc(m.phone||'بدون تلفن')} · ${esc(m.branch||'بدون شاخه')}</small></div><span class="pill">${m.status==='active'?'فعال':'غیرفعال'}</span></div>`}
function renderMembers(){let s=($('memberSearch').value||'').toLowerCase();$('memberList').innerHTML=members.filter(m=>[m.name,m.phone,m.branch].join(' ').toLowerCase().includes(s)).map(m=>`<div class="item"><div><b>${esc(m.name)}</b><small>${esc(m.phone||'')} · بالاسری: ${esc(m.upline||'—')} · ${m.role==='branchLeader'?'سرشاخه':'عضو'}</small></div><div class="actions"><button class="secondary" data-edit="${m.id}">ویرایش</button><button class="secondary danger" data-del="${m.id}">حذف</button></div></div>`).join('')||'<div class="empty">عضوی پیدا نشد.</div>';
document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>memberForm(members.find(m=>m.id===b.dataset.edit)));document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>removeMember(b.dataset.del))}
$('memberSearch').oninput=renderMembers;
function renderTree(){let roots=members.filter(m=>!m.upline);$('treeList').innerHTML=roots.map(r=>`<div class="panel"><b>♛ ${esc(r.name)}</b><div class="tree" style="margin-top:10px">${members.filter(m=>m.upline===r.name).map(m=>`<span class="person">↳ ${esc(m.name)}</span>`).join('')||'<small class="muted">زیرمجموعه مستقیمی ثبت نشده</small>'}</div></div>`).join('')||'<div class="empty">برای نمایش درخت، ابتدا اعضا و بالاسری آن‌ها را ثبت کنید.</div>'}
function renderTasks(){$('taskList').innerHTML=tasks.map(t=>`<div class="item"><div><b>${esc(t.title)}</b><small>${esc(t.due||'بدون موعد')} · ${esc(t.owner||'بدون مسئول')}</small></div><div class="actions"><button class="secondary" data-done="${t.id}">${t.done?'انجام شد':'تکمیل'}</button><button class="secondary danger" data-tdel="${t.id}">×</button></div></div>`).join('')||'<div class="empty">وظیفه‌ای ثبت نشده است.</div>';document.querySelectorAll('[data-done]').forEach(b=>b.onclick=async()=>{let t=tasks.find(x=>x.id===b.dataset.done);await updateDoc(doc(db,'tasks',t.id),{done:!t.done});loadAll()});document.querySelectorAll('[data-tdel]').forEach(b=>b.onclick=async()=>{if(confirm('این وظیفه حذف شود؟')){await deleteDoc(doc(db,'tasks',b.dataset.tdel));loadAll()}})}
function renderGrowth(){$('growthList').innerHTML=growthSteps.map((s,i)=>{let done=growth.some(x=>x.step===i&&x.done);return `<label class="item"><span>${fa(i+1)}. ${s}</span><input type="checkbox" data-step="${i}" ${done?'checked':''}></label>`}).join('');$('growthCount').textContent=fa(growth.filter(x=>x.done).length)+' از ۱۶';document.querySelectorAll('[data-step]').forEach(c=>c.onchange=async()=>{let i=Number(c.dataset.step),old=growth.find(x=>x.step===i);if(old)await updateDoc(doc(db,'growth',old.id),{done:c.checked});else await addDoc(collection(db,'growth'),{step:i,done:c.checked});loadAll()})}
function modal(title,html){$('modalTitle').textContent=title;$('modalBody').innerHTML=html;$('modal').classList.remove('hidden')}
$('closeModal').onclick=()=>$('modal').classList.add('hidden');$('modal').onclick=e=>{if(e.target===$('modal'))$('modal').classList.add('hidden')};
$('addMember').onclick=()=>memberForm();function memberForm(m={}){modal(m.id?'ویرایش عضو':'افزودن عضو',`<form id="memberForm"><div class="formgrid"><div class="field"><label>نام و نام خانوادگی *</label><input name="name" required value="${attr(m.name||'')}"></div><div class="field"><label>شماره تماس</label><input name="phone" value="${attr(m.phone||'')}"></div><div class="field"><label>شاخه</label><input name="branch" value="${attr(m.branch||'')}"></div><div class="field"><label>نام بالاسری</label><input name="upline" value="${attr(m.upline||'')}"></div><div class="field"><label>نقش</label><select name="role"><option value="member" ${m.role!=='branchLeader'?'selected':''}>عضو</option><option value="branchLeader" ${m.role==='branchLeader'?'selected':''}>سرشاخه (ثبت مدیریتی)</option></select></div><div class="field"><label>وضعیت</label><select name="status"><option value="active" ${m.status!=='inactive'?'selected':''}>فعال</option><option value="inactive" ${m.status==='inactive'?'selected':''}>غیرفعال</option></select></div><div class="field"><label>اولین فروش</label><select name="firstSale"><option value="false">خیر</option><option value="true" ${m.firstSale?'selected':''}>بله</option></select></div><div class="field"><label>تاریخ شروع</label><input name="startDate" type="date" value="${attr(m.startDate||'')}"></div></div><div class="field"><label>یادداشت</label><textarea name="notes">${esc(m.notes||'')}</textarea></div><button class="primary" style="width:100%">ذخیره عضو</button></form>`);
$('memberForm').onsubmit=async e=>{e.preventDefault();let d=Object.fromEntries(new FormData(e.target));d.firstSale=d.firstSale==='true';d.updatedAt=serverTimestamp();try{if(m.id)await updateDoc(doc(db,'members',m.id),d);else{d.createdAt=serverTimestamp();await addDoc(collection(db,'members'),d)}$('modal').classList.add('hidden');toast('اطلاعات ذخیره شد');await loadAll()}catch(err){toast('ذخیره نشد: '+err.message)}}}
async function removeMember(id){if(!confirm('عضو حذف شود؟ این کار قابل بازگشت نیست.'))return;await deleteDoc(doc(db,'members',id));loadAll()}
$('addTask').onclick=()=>{modal('وظیفه جدید',`<form id="taskForm"><div class="field"><label>عنوان وظیفه</label><input name="title" required></div><div class="field"><label>مسئول</label><input name="owner"></div><div class="field"><label>موعد انجام</label><input name="due" type="date"></div><button class="primary" style="width:100%">ثبت وظیفه</button></form>`);$('taskForm').onsubmit=async e=>{e.preventDefault();let d=Object.fromEntries(new FormData(e.target));d.done=false;d.createdAt=serverTimestamp();await addDoc(collection(db,'tasks'),d);$('modal').classList.add('hidden');loadAll()}}
$('exportBtn').onclick=()=>{let blob=new Blob([JSON.stringify({members,tasks,growth,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='vanguard-backup.json';a.click();URL.revokeObjectURL(a.href)};
$('importFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let data=JSON.parse(await f.text());if(!confirm('اطلاعات فایل به داده‌های فعلی اضافه می‌شود. ادامه؟'))return;for(let m of data.members||[]){delete m.id;delete m.createdAt;await addDoc(collection(db,'members'),m)}for(let t of data.tasks||[]){delete t.id;delete t.createdAt;await addDoc(collection(db,'tasks'),t)}toast('بازیابی انجام شد');loadAll()}catch(err){toast('فایل پشتیبان معتبر نیست: '+err.message)}e.target.value=''};
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function attr(v=''){return esc(v).replace(/`/g,'&#96;')}
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
