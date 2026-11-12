/* Unbucketlist: data and pages. The brand's words: your BUCKET LIST (places you've saved), UNBUCKET (go and do it),
   and what every place gives you: GO, TASTE, EXPLORE, TAKE AWAY. Add real photos/videos by filling `image` / `video` (URL or /media/file). */
const CATS = [
  {id:'all',icon:'✦',name:'All'},{id:'beach',icon:'🏝',name:'Beaches'},{id:'mountain',icon:'🏔',name:'Mountains'},
  {id:'culture',icon:'⛩',name:'Culture'},{id:'wild',icon:'🦁',name:'Wild things'},{id:'food',icon:'🍜',name:'Tastes'},{id:'adventure',icon:'🪂',name:'Adventure'}];

const TRIPS = [
 {id:'bali',cat:['beach','culture'],name:'Bali',place:'Indonesia',tag:'Slow & sacred',days:7,price:123000,sky:['#ffb36b','#ff6f61','#5b2a6e'],land:['#2c5d4a','#1d3f33','#0f2a22'],image:'',video:'',
  hook:'Rice terraces at sunrise, temples at dusk, and a surf break in between.',
  story:'Wake in Ubud to roosters and mist. By noon you are paddling out at Canggu. By dusk, a Kecak fire dance.',
  plan:[['Arrive Ubud','Villa check-in, rice-terrace walk, warung dinner.'],['Sacred morning','Tirta Empul water temple, then a cooking class.'],['Waterfalls','Tegenungan & Tibumana with a local guide.'],['Coast','Transfer to Uluwatu, cliffside sunset temple.'],['Surf day','Lesson at Padang Padang, beach club evening.'],['Nusa Penida','Day trip to Kelingking Beach by boat.'],['Slow goodbye','Spa morning, market shopping, departure.']]},
 {id:'lofoten',cat:['mountain','adventure'],name:'Lofoten',place:'Norway',tag:'Northern lights',days:6,price:202500,sky:['#0b1d3a','#26527a','#8fd0e0'],land:['#1b2b3a','#101c28','#070e16'],image:'',video:'',
  hook:'Jagged peaks rising straight out of a silver sea, under a green sky.',
  story:'Rorbu cabins, cod-drying racks, and a midnight sky that moves. Chase the aurora, then sleep until it rains.',
  plan:[['Fly to Leknes','Pick up car, check into a fisherman’s rorbu.'],['Reine & Hamnøy','Photo stops and a kayak at golden hour.'],['Ryten hike','Hike to Kvalvika viewpoint.'],['Sea eagle safari','RIB boat through the Trollfjord.'],['Aurora night','Guided northern-lights chase.'],['Depart','Fish soup, one more fjord, flight home.']]},
 {id:'kyoto',cat:['culture','food'],name:'Kyoto',place:'Japan',tag:'Quiet temples',days:8,price:246500,sky:['#fbd3e9','#f48fb1','#6a4c93'],land:['#5b3a29','#3a2418','#22140d'],image:'',video:'',
  hook:'Torii gates, tea ceremonies and the best breakfast of your life.',
  story:'Start before the crowds at Fushimi Inari. End in a Gion alley where the lanterns are already lit.',
  plan:[['Land in Osaka','Train to Kyoto, ryokan check-in.'],['Fushimi Inari','Dawn hike through 10,000 gates.'],['Arashiyama','Bamboo grove, monkey park, river lunch.'],['Tea & zen','Private tea ceremony & Ryoan-ji.'],['Nara day','Deer park and Todai-ji.'],['Nishiki Market','Food walk with a local chef.'],['Philosopher’s Path','Slow walk, Ginkaku-ji.'],['Depart','Matcha for the road.']]},
 {id:'patagonia',cat:['mountain','adventure','wild'],name:'Patagonia',place:'Chile',tag:'Edge of the world',days:9,price:285000,sky:['#f9d29d','#d98e73','#3d3b6b'],land:['#4a4a52','#2d2d35','#18181e'],image:'',video:'',
  hook:'Granite towers, turquoise lakes and wind that rearranges your thoughts.',
  story:'Torres del Paine at first light turns the peaks the colour of embers. You will not want to blink.',
  plan:[['Punta Arenas','Arrive, gear check.'],['Puerto Natales','Transfer, welcome asado.'],['Base Torres','Full-day hike to the towers.'],['Grey Glacier','Boat to the glacier face.'],['Guanaco trail','Wildlife drive, condors overhead.'],['Lago Pehoé','Lake kayak & hot tub.'],['Milodon cave','Easy morning, free afternoon.'],['Fjord day','Cruise the Last Hope Sound.'],['Depart','Fly home.']]},
 {id:'santorini',cat:['beach','food'],name:'Santorini',place:'Greece',tag:'Golden hour',days:5,price:168500,sky:['#ffe29f','#ffa99f','#5aa9e6'],land:['#f4f1ea','#d8d2c4','#a8a08c'],image:'',video:'',
  hook:'White domes, blue water, and sunsets that earn their applause.',
  story:'Cave hotels, volcanic wine, and a catamaran at golden hour. Oia is a given; the quiet side is the secret.',
  plan:[['Arrive Fira','Cliffside walk and dinner.'],['Oia','Sunrise photos, sunset dinner.'],['Wine trail','Three volcanic vineyards.'],['Catamaran','Caldera sail, hot springs swim.'],['Depart','Slow breakfast, ferry or flight.']]},
 {id:'serengeti',cat:['wild','adventure'],name:'Serengeti',place:'Tanzania',tag:'The great migration',days:7,price:357000,sky:['#ffcf70','#f2884b','#7a2e1d'],land:['#6b4a1f','#3f2b12','#241806'],image:'',video:'',
  hook:'Two million wildebeest. One golden horizon. Zero screens.',
  story:'Dawn game drives, a balloon over the plains, and a sundowner while lions stretch in the long grass.',
  plan:[['Arusha','Briefing and bush-plane transfer.'],['Central Serengeti','First game drive, camp dinner.'],['Migration route','Full day following the herds.'],['Balloon sunrise','Champagne breakfast on the plains.'],['Ngorongoro','Crater floor safari.'],['Maasai village','Cultural visit.'],['Depart','Fly home.']]}
];


TRIPS.push(
 {id:'rajasthan',cat:['culture','food'],name:'Rajasthan',place:'India',tag:'Palaces & spice',days:7,price:140000,sky:['#ffd6a5','#ff9a76','#7b2d5e'],land:['#8a4b2a','#5a2f1a','#33190d'],image:'',video:'',
  hook:'Hill forts, havelis and a thali you will talk about for years.',story:'Sleep in a palace in Udaipur, haggle in Jaipur, and watch the Thar desert turn to rose at dusk.',
  plan:[['Jaipur','Amber Fort and old-city bazaars.'],['Cooking class','Learn the thali from a local family.'],['Jodhpur','The blue city and Mehrangarh at sunset.'],['Desert camp','Camel ride and a night under stars.'],['Udaipur','Lake palace boat ride.'],['Free day','Markets, tailors, chai.'],['Depart','Fly home from Udaipur.']]},
 {id:'maldives',cat:['beach'],name:'Maldives',place:'Indian Ocean',tag:'Overwater calm',days:5,price:234000,sky:['#c9f2ff','#6ed0e8','#0e5f8a'],land:['#f4e7c5','#c9b98a','#8f8260'],image:'',video:'',
  hook:'Water in colours you did not know water could be.',story:'Seaplane in, phone off. Snorkel with turtles before breakfast and watch the lagoon glow at night.',
  plan:[['Seaplane','Arrive at your atoll villa.'],['House reef','Guided snorkel with turtles and rays.'],['Sandbank picnic','Private sandbank lunch.'],['Dolphin cruise','Sunset boat and bioluminescence.'],['Depart','Slow morning, seaplane out.']]},
 {id:'iceland',cat:['adventure','mountain'],name:'Iceland',place:'Iceland',tag:'Fire & ice',days:6,price:221000,sky:['#cfe8ff','#8fb8e8','#2a3f6b'],land:['#2f3b3a','#1c2625','#0e1514'],image:'',video:'',
  hook:'Midnight sun, black beaches and waterfalls on every corner.',story:'Drive the Ring Road with the sun that never quite sets. Soak in a geothermal lagoon when your legs give up.',
  plan:[['Reykjavik','Golden Circle: Gullfoss and Geysir.'],['South coast','Skógafoss and Reynisfjara black sand.'],['Glacier day','Hike on Sólheimajökull.'],['Jökulsárlón','Ice lagoon and diamond beach.'],['Blue Lagoon','Soak before your flight.'],['Depart','Fly home.']]},
 {id:'peru',cat:['culture','adventure','mountain'],name:'Peru',place:'Peru',tag:'Machu Picchu & beyond',days:8,price:208000,sky:['#ffe8c2','#9fd3b4','#2f6b5a'],land:['#2d5a3d','#1d3d29','#0e2418'],image:'',video:'',
  hook:'Lost cities in the clouds, and the best ceviche on Earth.',story:'Walk in at sunrise when the mist lifts off the stones. Then eat your way back to Cusco.',
  plan:[['Cusco','Acclimatise and wander San Blas.'],['Sacred Valley','Pisac market and Ollantaytambo.'],['Train to Aguas Calientes','Evening in the cloud forest.'],['Machu Picchu','Sunrise entry with a guide.'],['Rainbow Mountain','Optional high-altitude hike.'],['Lima','Ceviche masterclass.'],['Depart','Fly home.'],['Spare day','Slack for weather.']]},
 {id:'morocco',cat:['culture','food'],name:'Morocco',place:'Morocco',tag:'Souks & Sahara',days:7,price:149000,sky:['#ffcf9e','#e8825a','#5e2b3a'],land:['#b5703a','#7d4a22','#4a2a12'],image:'',video:'',
  hook:'Blue alleys, spice-piled souks and a night in the dunes.',story:'Get lost in the Marrakech medina on purpose, then cross the Atlas to a camp in the Sahara.',
  plan:[['Marrakech','Medina and Jemaa el-Fnaa at dusk.'],['Atlas Mountains','Berber village lunch.'],['Aït Benhaddou','Kasbah and film-set walk.'],['Merzouga','Camel trek to desert camp.'],['Fes','Tanneries and the old medina.'],['Chefchaouen','The blue city.'],['Depart','Fly home from Tangier.']]},
 {id:'newzealand',cat:['adventure','mountain'],name:'New Zealand',place:'New Zealand',tag:'Middle-earth, for real',days:9,price:306000,sky:['#bfe3f5','#7fb7d9','#2c5d8a'],land:['#3d6b4a','#27472f','#142a1a'],image:'',video:'',
  hook:'Fjords, glaciers and long summer evenings.',story:'Summer down south: kayak Milford Sound, jump off something in Queenstown, sleep under the Milky Way.',
  plan:[['Queenstown','Lake walk and fergburger.'],['Milford Sound','Cruise the fjord.'],['Glenorchy','Scenic drive and hike.'],['Wanaka','Roy’s Peak sunrise.'],['Mt Cook','Hooker Valley walk.'],['Tekapo','Stargazing reserve.'],['Christchurch','Gardens and markets.'],['Free day','Your pick.'],['Depart','Fly home.']]},
 {id:'ladakh',cat:['mountain','adventure','culture'],name:'Ladakh',place:'India',tag:'The land of high passes',days:9,price:123000,sky:['#cfe4f7','#8fb6dc','#3b4f7a'],land:['#9b8164','#6f5a45','#3e3127'],image:'',video:'',
  hook:'Moonscape valleys, turquoise lakes at 4,000 m and skies full of stars.',story:'Start slow in Leh, cross Khardung La into the dunes of Nubra, follow the Shyok to Pangong Tso, then sleep under the clearest skies in India at Hanle.',
  plan:[['Leh','Arrive and acclimatise. Shanti Stupa at sunset.'],['Leh','Monasteries of Thiksey and Hemis.'],['Khardung La to Nubra','Over the pass to Diskit and the Hunder dunes.'],['Nubra Valley','Camel trails, Diskit monastery.'],['Turtuk','Apricot orchards in the last village before the border.'],['Shyok to Pangong','Along the river to the lake.'],['Pangong Tso','Sunrise on the water that changes colour.'],['Hanle','Stargazing near the observatory.'],['Tso Moriri','The quiet lake, then back to Leh.']]}
);
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
/* YOUR FIRST 12 MONTHS: one trip per month. m = month index (0=Jan). Edit freely; lat/lng put the dot on the map. */
const CAL={ladakh:[5,34.164,77.585],patagonia:[0,-51.0,-73.1],lofoten:[1,68.2,13.6],kyoto:[2,35.01,135.77],rajasthan:[3,26.9,75.8],santorini:[4,36.4,25.4],maldives:[5,3.2,73.2],
 iceland:[6,64.9,-19.0],serengeti:[7,-2.33,34.8],bali:[8,-8.4,115.2],peru:[9,-13.16,-72.55],morocco:[10,31.6,-8.0],newzealand:[11,-44.7,169.1]};
TRIPS.forEach(t=>{[t.m,t.lat,t.lng]=CAL[t.id]});
TRIPS.sort((a,b)=>a.m-b.m);
const CREDITS=window.CREDITS||{};
TRIPS.forEach(t=>{t.credits=CREDITS[t.id]||[];t.photos=t.credits.map(c=>'media/'+c.file);if(!t.image&&t.photos.length){t.image=t.photos[0];t.pos=t.credits[0].pos||''}});

const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>[...e.querySelectorAll(s)];
const money=n=>'₹'+n.toLocaleString('en-IN');   // prices are in Indian rupees, with Indian digit grouping (₹1,23,500)
const wish=new Set(JSON.parse((()=>{try{return localStorage.getItem('ubl-wish')||'[]'}catch(e){return'[]'}})()));
const saveWish=()=>{try{localStorage.setItem('ubl-wish',JSON.stringify([...wish]))}catch(e){}$('#wishCount').textContent=wish.size};
function toggleBucket(id){const t=TRIPS.find(x=>x.id===id),on=!wish.has(id);on?wish.add(id):wish.delete(id);saveWish();renderCards();
  toast(on?`${t.name} is on your bucket list`:`${t.name} is off your bucket list`);if(window.mapRefresh)mapRefresh();return on}
const bucketLabel=id=>wish.has(id)?'✓ On my bucket list':'+ My bucket list';
const toast=m=>{let t=$('.toast')||document.body.appendChild(Object.assign(document.createElement('div'),{className:'toast'}));t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2200)};

/* Ambient life for the illustrated scenes: drifting clouds + gliding birds (skipped when real media is set) */
function ambient(){
  const cloud=(y,w,d,dl,o)=>`<i class="cloud" style="--y:${y}%;--w:${w}%;--d:${d}s;--dl:${dl}s;--o:${o}"></i>`;
  const bird=(y,d,dl,sc)=>`<svg class="bird" viewBox="0 0 24 10" style="--y:${y}%;--d:${d}s;--dl:${dl}s;--sc:${sc}" aria-hidden="true"><path d="M1 8 Q6 0 12 6 Q18 0 23 8"/></svg>`;
  return `<div class="amb" aria-hidden="true">${cloud(12,46,70,-12,.55)}${cloud(26,34,95,-48,.4)}${cloud(6,28,120,-70,.3)}${bird(20,26,-4,1)}${bird(28,34,-17,.7)}${bird(16,42,-30,.55)}</div>`;
}

/* A layered SVG landscape + optional real photo/video (media wins when provided) */
function scape(t,id){
  const [a,b,c]=t.land;
  const media=t.video?`<video class="media" src="${t.video}" ${t.image?`poster="${t.image}"`:''} autoplay muted loop playsinline></video>`:t.image?`<img class="media" style="object-position:${t.pos||"50% 50%"}" src="${t.image}" alt="${t.name}" loading="lazy">`:'';
  return `<div style="position:absolute;inset:0;background:linear-gradient(180deg,${t.sky[0]},${t.sky[1]} 55%,${t.sky[2]})"></div>
  <svg class="scape" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
   <circle cx="285" cy="110" r="34" fill="#fff" opacity=".55"/>
   <path d="M0 190 L70 120 L120 175 L190 90 L260 180 L330 130 L400 195 V300 H0Z" fill="${c}" opacity=".55"/>
   <path d="M0 220 Q80 160 160 215 T320 205 T400 225 V300 H0Z" fill="${b}"/>
   <path d="M0 255 Q100 215 200 250 T400 245 V300 H0Z" fill="${a}"/></svg>${media}${ambient()}`;
}

/* ---------- STORY BANNER: a drifting collage of photos, facts and quotes per destination ---------- */
const fmtCoord=t=>`${Math.abs(t.lat).toFixed(1)}°${t.lat<0?'S':'N'} · ${Math.abs(t.lng).toFixed(1)}°${t.lng<0?'W':'E'}`;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function photoTile(t,i,shape){
  const n=t.photos.length, src=n?t.photos[i%n]:'', c=n?t.credits[i%n]:null;
  // "File:Machu_Picchu,_Perú,_2015-07-30,_DD_47.JPG" -> "Machu Picchu, Perú"
  const cap=c?c.caption||c.title.replace(/^File:/,'').replace(/\.\w+$/,'').replace(/_/g,' ').replace(/\(.*?\)/g,'').replace(/(\s*[,\-–]?\s*(\S*\d\S*|[A-Z]{2,3}))+\s*$/,'').trim():t.name;
  const inner=src?`<img src="${src}" alt="${esc(cap)}" loading="lazy">`:scape({...t,image:'',video:''});
  return `<figure class="tile ph ${shape}">${inner}${c?`<figcaption>${esc(cap)}</figcaption>`:''}</figure>`;
}
function storyTiles(t){
  const F=(window.FACTS||{})[t.id]||{q:t.tag,f:[]};
  const fact=(f,i)=>`<div class="tile fact"><small>${t.name} · fact ${String(i+1).padStart(2,'0')}</small><b>${f.k}</b><p>${f.t}</p></div>`;
  const seq=[photoTile(t,0,'tall'), F.f[0]?fact(F.f[0],0):'', `<div class="tile quote"><span>“</span>${F.q}<small>${t.place}</small></div>`,
    photoTile(t,1,'wide'), F.f[1]?fact(F.f[1],1):'', `<div class="tile kraft"><small>Month ${t.m+1} of 12</small><b>${MONTH_FULL[t.m]}</b><span>${fmtCoord(t)}</span><i>${t.name}</i></div>`,
    photoTile(t,2,'tall'), F.f[2]?fact(F.f[2],2):'', photoTile(t,0,'wide'), F.f[3]?fact(F.f[3],3):''];
  const Y=[18,-26,10,-8,30,-20,6,-30,22,-12];
  return seq.filter(Boolean).map((h,i)=>h.replace('class="tile',`style="--y:${Y[i%10]}px" class="tile`)).join('');
}
function storyBanner(t){
  const tiles=storyTiles(t);
  const cred=t.credits.length?'Photos: '+t.credits.map(c=>`<a href="${c.source}" target="_blank" rel="noopener">${esc(c.author)}</a> (${esc(c.license)})`).join(', ')+', via Wikimedia Commons.':'';
  return `<div class="tale-in">
   <header class="tale-head"><p class="eyebrow">The story of</p><h3>${t.name}</h3><span>${fmtCoord(t)}</span></header>
   <div class="tale-track-wrap"><div class="tale-track" style="--dur:${60+t.m*2}s">${tiles}${tiles.replace(/class="tile/g,'aria-hidden="true" class="tile')}</div></div>
   <div class="tale-foot"><p class="tale-lead">${t.story}</p><p class="tale-credit">${cred}</p></div></div>`;
}

/* ---------- 2. PICK ---------- */
let cat='all';
function renderChips(){
  $('#chips').innerHTML=CATS.map(c=>`<button class="chip ${c.id===cat?'on':''}" data-c="${c.id}" role="tab"><span>${c.icon}</span>${c.name}</button>`).join('');
}
function renderCards(){
  const list=TRIPS.filter(t=>cat==='all'||t.cat.includes(cat));
  $('#cards').innerHTML=list.map((t,i)=>`<article class="card" data-id="${t.id}" style="animation-delay:${i*70}ms">
   <div class="art">${scape(t)}<span class="tag">${t.tag}</span><button class="heart ${wish.has(t.id)?'on':''}" type="button" data-h="${t.id}" aria-pressed="${wish.has(t.id)}" aria-label="${wish.has(t.id)?'On my bucket list':'Add to my bucket list'}">${wish.has(t.id)?'✓':'+'}</button></div>
   <h3>${t.name}, ${t.place}</h3><p>${t.days} days · best in ${MON[t.m]}</p><p class="price">Unbucket it from <b>${money(t.price)}</b></p></article>`).join('');
}
$('#chips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;cat=b.dataset.c;renderChips();renderCards()});
$('#cards').addEventListener('click',e=>{
  const h=e.target.closest('[data-h]');
  if(h){e.stopPropagation();toggleBucket(h.dataset.h);return}
  const c=e.target.closest('.card');if(c)openTrip(c.dataset.id);
});

/* ---------- 3. REELS ---------- */
$('#reels').innerHTML=TRIPS.map((t,i)=>{const n=TRIPS[(i+1)%TRIPS.length];return `<section class="reel" data-i="${i}">
 <div class="reel-bg">${scape(t)}</div>
 <div class="reel-copy"><div class="reel-meta"><span>${String(i+1).padStart(2,'0')} / ${String(TRIPS.length).padStart(2,'0')}</span><span>${MONTH_FULL[t.m]}</span><span>${t.place}</span><span>${t.days} days</span><span>from ${money(t.price)}</span></div>
  <h3>${t.name}</h3><p>${t.hook}</p><button class="btn" type="button" data-open="${t.id}">See the full story</button><button class="btn ghost" type="button" data-h2="${t.id}">${bucketLabel(t.id)}</button></div>
 <div class="reel-next">The story of ${t.name}<b>↓</b></div></section>
 <section class="reel tale" data-i="${i}">${storyBanner(t)}<div class="reel-next">Next · ${n.name}<b>↓</b></div></section>`}).join('');
document.body.insertAdjacentHTML('beforeend',`<nav class="dots" id="dots">${TRIPS.map((t,i)=>`<button data-d="${i}" aria-label="${t.name}"></button>`).join('')}</nav>`);
const reels=$('#reels');
$('#reels').addEventListener('click',e=>{
  const o=e.target.closest('[data-open]');if(o)openTrip(o.dataset.open);
  const h=e.target.closest('[data-h2]');if(h){toggleBucket(h.dataset.h2);h.textContent=bucketLabel(h.dataset.h2)}
});
$('#dots').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(b)$(`.reel[data-i="${b.dataset.d}"]`).scrollIntoView({behavior:'smooth'})});
const io=new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting){en.target.classList.add('in');$$('#dots button').forEach((d,i)=>d.classList.toggle('on',i==en.target.dataset.i))}
}),{root:reels,threshold:.6});
$$('.reel').forEach(r=>io.observe(r));
// parallax inside the reels scroller
reels.addEventListener('scroll',()=>{const h=reels.clientHeight;$$('.reel').forEach((r,i)=>{const bg=$('.reel-bg',r);if(!bg)return;const d=(reels.scrollTop-i*h)/h;bg.style.transform=`translateY(${d*-8}%) scale(${1+Math.abs(d)*.08})`})},{passive:true});
new IntersectionObserver(([e])=>$('#dots').classList.toggle('show',e.isIntersecting),{threshold:.5}).observe(reels);

/* ---------- 4. STORY ---------- */
const CH=[
 ['Chapter one','It starts with a list.',TRIPS[2]],
 ['Chapter two','Forty places. Zero plans. A note on your phone you never open.',TRIPS[3]],
 ['Chapter three','So we zoom out, and pick one. Just one place at a time.',TRIPS[0]],
 ['Chapter four','Where to go. What to taste. What to bring home. Everything you need to say yes.',TRIPS[5]],
 ['Chapter five','And suddenly your bucket list is one line shorter. That’s unbucketing.',TRIPS[4]]];
$('#storySteps').innerHTML=CH.map((_,i)=>`<div data-s="${i}"></div>`).join('');
let cur=-1;const sb=$('#storyBg'),st=$('#storyText');
function chapter(i){if(i===cur)return;cur=i;const [k,txt,t]=CH[i];st.classList.add('swap');
  setTimeout(()=>{st.innerHTML=`<small>${k}</small>${txt}`;st.classList.remove('swap')},350);
  sb.classList.remove('k');sb.style.background=`linear-gradient(180deg,${t.sky.join(',')})`;requestAnimationFrame(()=>requestAnimationFrame(()=>sb.classList.add('k')))}
{const o=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)chapter(+e.target.dataset.s)}),{threshold:.55});$$('#storySteps div').forEach(d=>o.observe(d))}
chapter(0);

/* ---------- the map hero lives in map.js ---------- */
const nav=$('#nav'),mapHero=$('#top');
addEventListener('scroll',()=>nav.classList.toggle('solid',mapHero.getBoundingClientRect().bottom<innerHeight*.5),{passive:true});
$('#heroCount').textContent=TRIPS.length;
$('#seeAll').addEventListener('click',()=>$('#pick').scrollIntoView({behavior:'smooth'}));

/* ---------- DESTINATION PAGE (full screen, own link: #ladakh) ---------- */
const drawer=$('#drawer'),sheet=$('#sheet');
let pushed=false;
function monthOptions(t){
  const now=new Date(),opts=[];let picked=false;
  for(let k=0;k<12;k++){const d=new Date(now.getFullYear(),now.getMonth()+1+k,1),sel=!picked&&d.getMonth()===t.m;if(sel)picked=true;
    opts.push(`<option value="${d.getFullYear()}-${d.getMonth()+1}" ${sel?'selected':''}>${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}</option>`)}
  return opts.join('');
}
function renderDest(t){
  const offers=(window.OFFERS||{})[t.id]||[{name:t.tag,days:t.days,price:t.price,blurb:t.hook}];
  const route=(window.ROUTES||{})[t.id];
  const tile=(n)=>`<div class="${n===2&&!t.photos.length?'play':''}">${scape({...t,image:t.photos[n]||'',video:'',sky:[...t.sky].reverse().slice(n%2,3).concat(t.sky).slice(0,3)})}</div>`;
  const nTiles=t.photos.length>=3?3:5;
  const idx=TRIPS.indexOf(t),next=TRIPS[(idx+1)%TRIPS.length];
  sheet.dataset.id=t.id;
  sheet.innerHTML=`<button class="close" data-close aria-label="Back to the map">← Map</button>
   <header class="d-hero">${scape(t)}
    <div class="d-hero-copy"><p class="eyebrow">Best in ${MONTH_FULL[t.m]} · ${t.place} · ${fmtCoord(t)}</p><h2>${t.name}</h2><p class="d-hook">${t.hook}</p>
     <div class="d-chips"><span>${t.days} days</span><span>from ${money(t.price)} / person</span><span>${offers.length} way${offers.length>1?'s':''} to unbucket it</span></div>
     <button class="btn" type="button" data-go-book>Unbucket this for me</button></div>
    <span class="d-scroll" aria-hidden="true">↓</span></header>
   <section class="offers"><p class="eyebrow">Ways to unbucket ${t.name}</p><div class="offer-list">${offers.map((o,i)=>`
     <article class="offer"><div class="offer-ph">${scape({...t,image:t.photos[i%Math.max(1,t.photos.length)]||'',video:''})}</div>
      <div class="offer-body"><h3>${o.name}</h3><p>${o.blurb}</p><div class="offer-meta"><span>${o.days} days</span><b>${money(o.price)}<small> / person</small></b></div>
      <button class="btn" type="button" data-pick="${i}">Choose this</button></div></article>`).join('')}</div>
</section>
   ${route?routeCard(t,route):''}
   ${fourSections(t)}
   <div class="gallery ${nTiles===3?'g3':''}">${[...Array(nTiles).keys()].map(tile).join('')}</div>
   <section class="tale in-drawer">${storyBanner(t)}</section>
   <div class="d-body"><div><p class="eyebrow day-eye">Day by day</p><h3>${t.tag}</h3><p class="lede">${t.story}</p>
    <div class="tl">${t.plan.map((d,i)=>`<div class="day"><small>Day ${i+1}</small><h4>${d[0]}</h4><p>${d[1]}</p></div>`).join('')}</div></div>
    <form class="book" id="bookForm" novalidate>
     <div class="p" id="bkPrice">${money(offers[0].price)} <span>/ person</span></div>
     <label for="bkOffer">How you’ll unbucket it</label><select id="bkOffer">${offers.map((o,i)=>`<option value="${i}">${o.name} · ${o.days} days</option>`).join('')}</select>
     <label for="bkMonth">When</label><select id="bkMonth">${monthOptions(t)}</select>
     <label for="bkPax">Travellers</label><select id="bkPax">${[1,2,3,4,5,6,7,8].map(n=>`<option ${n===2?'selected':''}>${n}</option>`).join('')}</select>
     <label for="bkName">Your name</label><input id="bkName" autocomplete="name" required>
     <label for="bkEmail">Email</label><input id="bkEmail" type="email" autocomplete="email" required>
     <div class="total"><span>Estimated total</span><b id="bkTotal">${money(offers[0].price*2)}</b></div>
     <p class="err" id="bkErr" hidden></p>
     <button class="btn" type="submit">Unbucket this for me</button>
     <button class="btn ghost2" type="button" data-save="${t.id}">${bucketLabel(t.id)}</button>
     <p class="fine">Preview: requests are not collected yet, so nothing is sent.</p>
    </form></div>
   <nav class="d-next"><button type="button" data-close>← Back to the map</button><button type="button" data-goto="${next.id}">Next: ${next.name} →</button></nav>
   <div class="d-bar"><div><b>${money(t.price)}</b><small> / person</small><span>Best in ${MONTH_FULL[t.m]} · ${t.days} days</span></div><button class="btn" type="button" data-go-book>Unbucket this</button></div>`;
  sheet.scrollTop=0;
  const o=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{root:sheet,threshold:.2});$$('.day',sheet).forEach(d=>o.observe(d));
  const f=$('#bookForm',sheet),cur=()=>offers[+$('#bkOffer',f).value];
  const upd=()=>{$('#bkPrice',f).innerHTML=`${money(cur().price)} <span>/ person</span>`;$('#bkTotal',f).textContent=money(cur().price*+$('#bkPax',f).value)};
  f.addEventListener('input',upd);
  f.addEventListener('submit',e=>{
    e.preventDefault();
    const name=$('#bkName',f).value.trim(),email=$('#bkEmail',f).value.trim(),err=$('#bkErr',f);
    if(!name||!/^\S+@\S+\.\S+$/.test(email)){err.hidden=false;err.textContent=!name?'Add your name so we know who is travelling.':'Add an email address we can reply to, like you@example.com.';return}
    const when=$('#bkMonth',f).selectedOptions[0].textContent,pax=+$('#bkPax',f).value,of=cur();
    f.innerHTML=`<div class="p">Almost unbucketed, ${esc(name.split(' ')[0])}</div><p class="ok">${esc(of.name)} · ${when} · ${pax} traveller${pax>1?'s':''} · about ${money(of.price*pax)}</p>
     <p class="fine">This is a preview, so your request was not sent anywhere yet. Booking will open here soon.</p>`;
  });
}
/* TASTE, EXPLORE, TAKE AWAY: what this place gives you besides the route */
function fourSections(t){
  const B=(window.BUCKET||{})[t.id]||{},wild=(window.WILDLIFE||{})[t.id]||[];
  const card=(e,name,where,line)=>`<article class="four-card">${e?`<div class="e" aria-hidden="true">${e}</div>`:''}<h4>${esc(name)}</h4><p class="w">${esc(where)}</p><p>${esc(line)}</p></article>`;
  const group=(key,title,cards)=>cards.length?`<div class="four-g"><p class="eyebrow">${key}</p><h3>${title}</h3><div class="four-list">${cards.join('')}</div></div>`:'';
  const html=group('Taste',`What to eat in ${esc(t.name)}`,(B.taste||[]).map(x=>card('',x[0],x[1],x[2])))
    +group('Explore','Wild things to spot',wild.map(w=>card(w[0],w[1],`${w[4]} · best ${w[6]}`,w[5])))
    +group('Take away','What you bring home',(B.take||[]).map(x=>card('',x[0],x[1],x[2])));
  return html?`<section class="four">${html}</section>`:'';
}
/* Route card: the journey as a small schematic (A → B → C ...) with day labels, a legend and the stop list */
function routeCard(t,r){
  const KC={arrive:'#3ccf86',depart:'#3ccf86',stop:'#ff6a45',side:'#f6b84b'};
  // schematic, like a metro map: keeps each stop's direction (north up, east right) but spreads them evenly so labels never pile up
  const narrow=innerWidth<760,n=r.stops.length;
  const rank=vals=>{const o=vals.map((v,i)=>[v,i]).sort((p,q)=>p[0]-q[0]||p[1]-q[1]),out=[];o.forEach(([,i],k)=>out[i]=n>1?k/(n-1):.5);return out};
  const norm=vals=>{const lo=Math.min(...vals),hi=Math.max(...vals);return vals.map(v=>hi-lo<1e-9?.5:(v-lo)/(hi-lo))};
  const xr=rank(r.stops.map(s=>s[2])),yr=rank(r.stops.map(s=>-s[1])),gx=norm(r.stops.map(s=>s[2])),gy=norm(r.stops.map(s=>-s[1]));
  const VW=narrow?360:720,VH=narrow?Math.max(300,n*64+40):360;
  const P=r.stops.map((s,i)=>{const nx=.4*gx[i]+.6*xr[i],ny=.4*gy[i]+.6*yr[i];
    return narrow?[30+nx*120,36+ny*(VH-72)]:[200+nx*(VW-400),46+ny*(VH-92)]});
  const seq=r.loop?[...P,P[0]]:P;
  let d=`M${seq[0][0].toFixed(1)},${seq[0][1].toFixed(1)}`;
  for(let i=1;i<seq.length;i++){const [a0,b0]=seq[i-1],[a1,b1]=seq[i];d+=` Q${((a0+a1)/2-(b1-b0)*.12).toFixed(1)},${((b0+b1)/2+(a1-a0)*.12).toFixed(1)} ${a1.toFixed(1)},${b1.toFixed(1)}`}
  const labels=r.stops.map((s,i)=>{const [x,y]=P[i],right=narrow||x<VW/2+20,k=s[5]||'stop',big=k==='arrive'||k==='depart';
    return `<g><circle cx="${x}" cy="${y}" r="${big?13:10}" fill="${KC[k]}" opacity=".18"/><circle cx="${x}" cy="${y}" r="${big?7:5.5}" fill="${KC[k]}" stroke="#14110f" stroke-width="2"/>
     <text x="${x+(right?14:-14)}" y="${y-3}" text-anchor="${right?'start':'end'}" class="rc-n">${esc(s[0])}</text>
     <text x="${x+(right?14:-14)}" y="${y+11}" text-anchor="${right?'start':'end'}" class="rc-s">${esc(s[3])}${s[4]?' · '+esc(s[4]):''}</text></g>`}).join('');
  const list=r.stops.map((s,i)=>`<li><i style="background:${KC[s[5]||'stop']}"></i><span><b>${esc(s[0])}</b>, ${esc(s[3])}${s[4]?' · '+esc(s[4]):''}</span></li>`).join('')
    +(r.loop?`<li><i style="background:${KC.depart}"></i><span><b>${esc(r.stops[0][0])}</b>, back to the start and fly out</span></li>`:'');
  return `<section class="routecard" aria-label="The ${esc(t.name)} route">
   <p class="eyebrow">Go</p><h3>${r.stops.map(s=>esc(s[0])).join(' → ')}${r.loop?' → '+esc(r.stops[0][0]):''}</h3>
   <div class="rc-box"><svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="Map of the route">
     <line x1="${VW/2}" y1="16" x2="${VW/2}" y2="${VH-16}" class="rc-grid"/><line x1="16" y1="${VH/2}" x2="${VW-16}" y2="${VH/2}" class="rc-grid"/>
     <path d="${d}" class="rc-path"/>${labels}</svg>
    <p class="rc-legend"><span><i style="background:#ff6a45;border-radius:2px;height:3px"></i>Route</span><span><i style="background:${KC.arrive}"></i>Arrive &amp; depart</span><span><i style="background:${KC.stop}"></i>Stops</span><span><i style="background:${KC.side}"></i>Side trips</span></p>
    <ol class="rc-list">${list}</ol></div></section>`;
}
function goBook(){const f=$('#bookForm',sheet);if(!f)return;f.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>$('#bkName',sheet)?.focus({preventScroll:true}),650)}
function openTrip(id,{push=true,book=false}={}){
  const t=TRIPS.find(x=>x.id===id);if(!t)return;
  renderDest(t);
  drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  if(push&&location.hash!=='#'+id){history.pushState({dest:id},'','#'+id);pushed=true}
  $('.close',sheet).focus({preventScroll:true});
  if(book)setTimeout(goBook,450);
}
function closeTrip({fromHistory=false}={}){
  if(!drawer.classList.contains('open'))return;
  drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');document.body.style.overflow='';
  if(!fromHistory){if(pushed){pushed=false;history.back()}else history.replaceState(null,'',location.pathname)}
}
function routeFromHash(){
  const id=location.hash.slice(1),t=TRIPS.find(x=>x.id===id);
  if(t){if(!drawer.classList.contains('open')||sheet.dataset.id!==id)openTrip(id,{push:false})}
  else closeTrip({fromHistory:true});
}
addEventListener('popstate',()=>{pushed=false;routeFromHash()});
drawer.addEventListener('click',e=>{
  if(e.target.closest('[data-close]'))return closeTrip();
  if(e.target.closest('[data-go-book]'))return goBook();
  const p=e.target.closest('[data-pick]');if(p){const sel=$('#bkOffer',sheet);if(sel){sel.value=p.dataset.pick;sel.dispatchEvent(new Event('input',{bubbles:true}))}return goBook()}
  const g=e.target.closest('[data-goto]');if(g){renderDest(TRIPS.find(x=>x.id===g.dataset.goto));history.replaceState({dest:g.dataset.goto},'','#'+g.dataset.goto);return}
  const s=e.target.closest('[data-save]');if(s){toggleBucket(s.dataset.save);s.textContent=bucketLabel(s.dataset.save)}
});
addEventListener('keydown',e=>e.key==='Escape'&&closeTrip());

/* ---------- misc ---------- */
/* ---------- place finder: "What's on your bucket list?" and "My bucket list" ---------- */
const finder=$('#finder'),finderInput=$('#finderInput'),finderList=$('#finderList');let finderMine=false;
function renderFinder(){
  const q=finderInput.value.trim().toLowerCase();
  let list=TRIPS.filter(t=>!q||[t.name,t.place,t.tag,MONTH_FULL[t.m],...t.cat,...((window.ROUTES||{})[t.id]?.stops||[]).map(s=>s[0])].join(' ').toLowerCase().includes(q));
  if(finderMine&&!q)list=list.filter(t=>wish.has(t.id));
  finderList.innerHTML=list.length?list.map(t=>`<li><button type="button" data-fly="${t.id}">${t.photos[0]?`<img src="${t.photos[0]}" alt="" loading="lazy">`:'<i></i>'}
    <span><b>${t.name}</b><small>${t.place} · best in ${MONTH_FULL[t.m]} · ${t.days} days</small></span>${wish.has(t.id)?'<em>On your list</em>':''}</button></li>`).join('')
   :`<li class="none">${finderMine&&!q?'Your bucket list is empty. Tap + on any place to drop it in.':'We’re not unbucketing that one yet. Try another place, month or mood.'}</li>`;
}
function openFinder(mine){finderMine=mine;finderInput.value='';$('label',finder).textContent=mine?'My bucket list':'Where do you wanna go?';renderFinder();finder.hidden=false;if(!mine)finderInput.focus({preventScroll:true})}
function closeFinder(){finder.hidden=true}
$('#pillBtn').addEventListener('click',()=>finder.hidden||finderMine?openFinder(false):closeFinder());
$('#wishBtn').addEventListener('click',()=>finder.hidden||!finderMine?openFinder(true):closeFinder());
finderInput.addEventListener('input',renderFinder);
finder.addEventListener('click',e=>{
  if(e.target===finder)return closeFinder();
  const b=e.target.closest('[data-fly]');if(!b)return;closeFinder();closeTrip();
  scrollTo({top:0,behavior:'smooth'});if(window.mapFlyTo)setTimeout(()=>mapFlyTo(b.dataset.fly),scrollY>40?450:0);else openTrip(b.dataset.fly);
});
addEventListener('keydown',e=>{if(e.key==='Escape')closeFinder()});
$('#notify').addEventListener('submit',e=>{e.preventDefault();toast('Thanks! We’ll help you unbucket one ✈');e.target.reset()});
$('#yr').textContent=new Date().getFullYear();
renderChips();renderCards();saveWish();
routeFromHash();
