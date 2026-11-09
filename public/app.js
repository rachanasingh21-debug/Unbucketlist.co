/* Unbucketlist — data. Add real photos/videos by filling `image` / `video` (URL or /media/file). */
const CATS = [
  {id:'all',icon:'✦',name:'All'},{id:'beach',icon:'🏝',name:'Beaches'},{id:'mountain',icon:'🏔',name:'Mountains'},
  {id:'culture',icon:'⛩',name:'Culture'},{id:'wild',icon:'🦁',name:'Wildlife'},{id:'food',icon:'🍜',name:'Food'},{id:'adventure',icon:'🪂',name:'Adventure'}];

const TRIPS = [
 {id:'bali',cat:['beach','culture'],name:'Bali',place:'Indonesia',tag:'Slow & sacred',days:7,price:1450,sky:['#ffb36b','#ff6f61','#5b2a6e'],land:['#2c5d4a','#1d3f33','#0f2a22'],image:'',video:'',
  hook:'Rice terraces at sunrise, temples at dusk, and a surf break in between.',
  story:'Wake in Ubud to roosters and mist. By noon you are paddling out at Canggu. By dusk, a Kecak fire dance.',
  plan:[['Arrive Ubud','Villa check-in, rice-terrace walk, warung dinner.'],['Sacred morning','Tirta Empul water temple, then a cooking class.'],['Waterfalls','Tegenungan & Tibumana with a local guide.'],['Coast','Transfer to Uluwatu, cliffside sunset temple.'],['Surf day','Lesson at Padang Padang, beach club evening.'],['Nusa Penida','Day trip to Kelingking Beach by boat.'],['Slow goodbye','Spa morning, market shopping, departure.']]},
 {id:'lofoten',cat:['mountain','adventure'],name:'Lofoten',place:'Norway',tag:'Northern lights',days:6,price:2380,sky:['#0b1d3a','#26527a','#8fd0e0'],land:['#1b2b3a','#101c28','#070e16'],image:'',video:'',
  hook:'Jagged peaks rising straight out of a silver sea, under a green sky.',
  story:'Rorbu cabins, cod-drying racks, and a midnight sky that moves. Chase the aurora, then sleep until it rains.',
  plan:[['Fly to Leknes','Pick up car, check into a fisherman’s rorbu.'],['Reine & Hamnøy','Photo stops and a kayak at golden hour.'],['Ryten hike','Hike to Kvalvika viewpoint.'],['Sea eagle safari','RIB boat through the Trollfjord.'],['Aurora night','Guided northern-lights chase.'],['Depart','Fish soup, one more fjord, flight home.']]},
 {id:'kyoto',cat:['culture','food'],name:'Kyoto',place:'Japan',tag:'Quiet temples',days:8,price:2900,sky:['#fbd3e9','#f48fb1','#6a4c93'],land:['#5b3a29','#3a2418','#22140d'],image:'',video:'',
  hook:'Torii gates, tea ceremonies and the best breakfast of your life.',
  story:'Start before the crowds at Fushimi Inari. End in a Gion alley where the lanterns are already lit.',
  plan:[['Land in Osaka','Train to Kyoto, ryokan check-in.'],['Fushimi Inari','Dawn hike through 10,000 gates.'],['Arashiyama','Bamboo grove, monkey park, river lunch.'],['Tea & zen','Private tea ceremony & Ryoan-ji.'],['Nara day','Deer park and Todai-ji.'],['Nishiki Market','Food walk with a local chef.'],['Philosopher’s Path','Slow walk, Ginkaku-ji.'],['Depart','Matcha for the road.']]},
 {id:'patagonia',cat:['mountain','adventure','wild'],name:'Patagonia',place:'Chile',tag:'Edge of the world',days:9,price:3350,sky:['#f9d29d','#d98e73','#3d3b6b'],land:['#4a4a52','#2d2d35','#18181e'],image:'',video:'',
  hook:'Granite towers, turquoise lakes and wind that rearranges your thoughts.',
  story:'Torres del Paine at first light turns the peaks the colour of embers. You will not want to blink.',
  plan:[['Punta Arenas','Arrive, gear check.'],['Puerto Natales','Transfer, welcome asado.'],['Base Torres','Full-day hike to the towers.'],['Grey Glacier','Boat to the glacier face.'],['Guanaco trail','Wildlife drive, condors overhead.'],['Lago Pehoé','Lake kayak & hot tub.'],['Milodon cave','Easy morning, free afternoon.'],['Fjord day','Cruise the Last Hope Sound.'],['Depart','Fly home.']]},
 {id:'santorini',cat:['beach','food'],name:'Santorini',place:'Greece',tag:'Golden hour',days:5,price:1980,sky:['#ffe29f','#ffa99f','#5aa9e6'],land:['#f4f1ea','#d8d2c4','#a8a08c'],image:'',video:'',
  hook:'White domes, blue water, and sunsets that earn their applause.',
  story:'Cave hotels, volcanic wine, and a catamaran at golden hour. Oia is a given; the quiet side is the secret.',
  plan:[['Arrive Fira','Cliffside walk and dinner.'],['Oia','Sunrise photos, sunset dinner.'],['Wine trail','Three volcanic vineyards.'],['Catamaran','Caldera sail, hot springs swim.'],['Depart','Slow breakfast, ferry or flight.']]},
 {id:'serengeti',cat:['wild','adventure'],name:'Serengeti',place:'Tanzania',tag:'The great migration',days:7,price:4200,sky:['#ffcf70','#f2884b','#7a2e1d'],land:['#6b4a1f','#3f2b12','#241806'],image:'',video:'',
  hook:'Two million wildebeest. One golden horizon. Zero screens.',
  story:'Dawn game drives, a balloon over the plains, and a sundowner while lions stretch in the long grass.',
  plan:[['Arusha','Briefing and bush-plane transfer.'],['Central Serengeti','First game drive, camp dinner.'],['Migration route','Full day following the herds.'],['Balloon sunrise','Champagne breakfast on the plains.'],['Ngorongoro','Crater floor safari.'],['Maasai village','Cultural visit.'],['Depart','Fly home.']]}
];

const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const money=n=>'$'+n.toLocaleString();
const wish=new Set(JSON.parse((()=>{try{return localStorage.getItem('ubl-wish')||'[]'}catch(e){return'[]'}})()));
const saveWish=()=>{try{localStorage.setItem('ubl-wish',JSON.stringify([...wish]))}catch(e){}$('#wishCount').textContent=wish.size};
const toast=m=>{let t=$('.toast')||document.body.appendChild(Object.assign(document.createElement('div'),{className:'toast'}));t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2200)};

/* A layered SVG landscape + optional real photo/video (media wins when provided) */
function scape(t,id){
  const [a,b,c]=t.land;
  const media=t.video?`<video class="media" src="${t.video}" ${t.image?`poster="${t.image}"`:''} autoplay muted loop playsinline></video>`:t.image?`<img class="media" src="${t.image}" alt="${t.name}" loading="lazy">`:'';
  return `<div style="position:absolute;inset:0;background:linear-gradient(180deg,${t.sky[0]},${t.sky[1]} 55%,${t.sky[2]})"></div>
  <svg class="scape" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
   <circle cx="285" cy="110" r="34" fill="#fff" opacity=".55"/>
   <path d="M0 190 L70 120 L120 175 L190 90 L260 180 L330 130 L400 195 V300 H0Z" fill="${c}" opacity=".55"/>
   <path d="M0 220 Q80 160 160 215 T320 205 T400 225 V300 H0Z" fill="${b}"/>
   <path d="M0 255 Q100 215 200 250 T400 245 V300 H0Z" fill="${a}"/></svg>${media}`;
}

/* ---------- 2. PICK ---------- */
let cat='all';
function renderChips(){
  $('#chips').innerHTML=CATS.map(c=>`<button class="chip ${c.id===cat?'on':''}" data-c="${c.id}" role="tab"><span>${c.icon}</span>${c.name}</button>`).join('');
}
function renderCards(){
  const list=TRIPS.filter(t=>cat==='all'||t.cat.includes(cat));
  $('#cards').innerHTML=list.map((t,i)=>`<article class="card" data-id="${t.id}" style="animation-delay:${i*70}ms">
   <div class="art">${scape(t)}<span class="tag">${t.tag}</span><button class="heart ${wish.has(t.id)?'on':''}" data-h="${t.id}" aria-label="Save">${wish.has(t.id)?'♥':'♡'}</button></div>
   <h3>${t.name}, ${t.place}</h3><p>${t.days} days · ${t.cat.join(' · ')}</p><p class="price"><b>${money(t.price)}</b> per person</p></article>`).join('');
}
$('#chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;cat=b.dataset.c;renderChips();renderCards()});
$('#cards').addEventListener('click',e=>{
  const h=e.target.closest('[data-h]');
  if(h){e.stopPropagation();const id=h.dataset.h;wish.has(id)?wish.delete(id):(wish.add(id),toast('Saved to your wishlist ♥'));saveWish();renderCards();return}
  const c=e.target.closest('.card');if(c)openTrip(c.dataset.id);
});

/* ---------- 3. REELS ---------- */
$('#reels').innerHTML=TRIPS.map((t,i)=>{const n=TRIPS[(i+1)%TRIPS.length];return `<section class="reel" data-i="${i}">
 <div class="reel-bg">${scape(t)}</div>
 <div class="reel-copy"><div class="reel-meta"><span>${String(i+1).padStart(2,'0')} / ${String(TRIPS.length).padStart(2,'0')}</span><span>${t.place}</span><span>${t.days} days</span><span>from ${money(t.price)}</span></div>
  <h3>${t.name}</h3><p>${t.hook}</p><button class="btn" data-open="${t.id}">See the itinerary</button><button class="btn ghost" data-h2="${t.id}">♡ Save</button></div>
 <div class="reel-next">Next · ${n.name}<b>↓</b></div></section>`}).join('');
document.body.insertAdjacentHTML('beforeend',`<nav class="dots" id="dots">${TRIPS.map((t,i)=>`<button data-d="${i}" aria-label="${t.name}"></button>`).join('')}</nav>`);
const reels=$('#reels');
$('#reels').addEventListener('click',e=>{
  const o=e.target.closest('[data-open]');if(o)openTrip(o.dataset.open);
  const h=e.target.closest('[data-h2]');if(h){const id=h.dataset.h2;wish.has(id)?(wish.delete(id),h.textContent='♡ Save'):(wish.add(id),h.textContent='♥ Saved',toast('Saved to your wishlist ♥'));saveWish();renderCards()}
});
$('#dots').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(b)$$('.reel')[b.dataset.d].scrollIntoView({behavior:'smooth'})});
const io=new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting){en.target.classList.add('in');$$('#dots button').forEach((d,i)=>d.classList.toggle('on',i==en.target.dataset.i))}
}),{root:reels,threshold:.6});
$$('.reel').forEach(r=>io.observe(r));
// parallax inside the reels scroller
reels.addEventListener('scroll',()=>{const h=reels.clientHeight;$$('.reel').forEach((r,i)=>{const d=(reels.scrollTop-i*h)/h;$('.reel-bg',r).style.transform=`translateY(${d*-8}%) scale(${1+Math.abs(d)*.08})`})},{passive:true});
new IntersectionObserver(([e])=>$('#dots').classList.toggle('show',e.isIntersecting),{threshold:.5}).observe(reels);

/* ---------- 4. STORY ---------- */
const CH=[
 ['Chapter one','It starts with a list.',TRIPS[2]],
 ['Chapter two','Forty places. Zero plans. A note on your phone you never open.',TRIPS[3]],
 ['Chapter three','So we zoom out — and pick one. Just one feeling at a time.',TRIPS[0]],
 ['Chapter four','Photos. Video. A day-by-day plan. Everything you need to say yes.',TRIPS[5]],
 ['Chapter five','And suddenly, the bucket list has a first line crossed off.',TRIPS[4]]];
$('#storySteps').innerHTML=CH.map((_,i)=>`<div data-s="${i}"></div>`).join('');
let cur=-1;const sb=$('#storyBg'),st=$('#storyText');
function chapter(i){if(i===cur)return;cur=i;const [k,txt,t]=CH[i];st.classList.add('swap');
  setTimeout(()=>{st.innerHTML=`<small>${k}</small>${txt}`;st.classList.remove('swap')},350);
  sb.classList.remove('k');sb.style.background=`linear-gradient(180deg,${t.sky.join(',')})`;requestAnimationFrame(()=>requestAnimationFrame(()=>sb.classList.add('k')))}
{const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)chapter(+e.target.dataset.s)}),{threshold:.55});$$('#storySteps div').forEach(d=>o.observe(d))}
chapter(0);

/* ---------- ZOOM OUT → IN (scroll-driven) ---------- */
const zoom=$('.zoom'),globe=$('#globe'),zc=$('.zoom-copy'),zr=$('#zReveal'),nav=$('#nav');
const pinsG=$('#pins');
[[110,150],[250,115],[190,290],[310,250],[95,215]].forEach(([x,y],i)=>pinsG.insertAdjacentHTML('beforeend',`<circle class="pin-pulse" cx="${x}" cy="${y}" r="5" style="animation-delay:${i*.4}s"/><circle class="pin" cx="${x}" cy="${y}" r="5"/>`));
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
function onScroll(){
  const r=zoom.getBoundingClientRect(),p=clamp(-r.top/(r.height-innerHeight));
  const eased=p*p;
  globe.style.transform=`scale(${.7+eased*14})`;
  globe.style.opacity=clamp(1-(p-.55)/.2);
  zc.style.opacity=clamp(1-p/.28);zc.style.transform=`translateY(${-p*120}px)`;
  zr.style.opacity=clamp((p-.62)/.2);
  nav.classList.toggle('solid',scrollY>innerHeight*3.5);
  $('#zEyebrow').textContent=p<.15?'The whole world':'Zooming in…';
}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();

/* ---------- DRAWER (itinerary) ---------- */
const drawer=$('#drawer'),sheet=$('#sheet');
function openTrip(id){
  const t=TRIPS.find(x=>x.id===id);
  const tile=(n)=>`<div class="${n===2?'play':''}">${scape({...t,sky:[...t.sky].reverse().slice(n%2,3).concat(t.sky).slice(0,3)})}</div>`;
  sheet.innerHTML=`<button class="close" data-close aria-label="Close">✕</button>
   <div class="drawer-hero">${scape(t)}<div class="t"><p class="eyebrow">${t.place} · ${t.days} days</p><h2>${t.name}</h2></div></div>
   <div class="gallery">${[0,1,2,3,4].map(tile).join('')}</div>
   <div class="d-body"><div><h3>${t.tag}</h3><p class="lede">${t.story}</p>
    <div class="tl">${t.plan.map((d,i)=>`<div class="day"><small>Day ${i+1}</small><h4>${d[0]}</h4><p>${d[1]}</p></div>`).join('')}</div></div>
    <aside class="book"><div class="p">${money(t.price)} <span>/ person</span></div>
     <ul><li>🗓 ${t.days} days, flexible dates</li><li>📸 Photo & video guide</li><li>🧭 Local host included</li><li>↩ Free cancellation 30 days</li></ul>
     <button class="btn" data-plan="${t.id}">Unbucket this trip</button><button class="btn" data-save="${t.id}">${wish.has(t.id)?'♥ Saved':'♡ Save for later'}</button></aside></div>`;
  drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';sheet.scrollTop=0;
  const o=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{root:sheet,threshold:.2});$$('.day',sheet).forEach(d=>o.observe(d));
  history.replaceState(null,'','#'+id);
}
function closeTrip(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');document.body.style.overflow='';history.replaceState(null,'',location.pathname)}
drawer.addEventListener('click',e=>{
  if(e.target.closest('[data-close]'))return closeTrip();
  const p=e.target.closest('[data-plan]');if(p){toast('Nice. We’ll be in touch to plan it ✈');return}
  const s=e.target.closest('[data-save]');if(s){const id=s.dataset.save;wish.has(id)?(wish.delete(id),s.textContent='♡ Save for later'):(wish.add(id),s.textContent='♥ Saved');saveWish();renderCards()}
});
addEventListener('keydown',e=>e.key==='Escape'&&closeTrip());

/* ---------- misc ---------- */
$('#pillBtn').addEventListener('click',()=>$('#pick').scrollIntoView({behavior:'smooth'}));
$('#wishBtn').addEventListener('click',()=>{const n=[...wish].map(id=>TRIPS.find(t=>t.id===id).name);toast(n.length?'Wishlist: '+n.join(', '):'Nothing saved yet — tap a ♡')});
$('#notify').addEventListener('submit',e=>{e.preventDefault();toast('Thanks! We’ll be in touch ✈');e.target.reset()});
$('#yr').textContent=new Date().getFullYear();
renderChips();renderCards();saveWish();
if(TRIPS.some(t=>'#'+t.id===location.hash))openTrip(location.hash.slice(1));
