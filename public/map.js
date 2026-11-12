/* Unbucketlist: the zoomable map on the landing page.
   Layers, bottom to top: sea and land relief (pre-built images, see tools/build_relief.py), lakes, clouds and light,
   then the brand's own layer: places, journeys (GO), wild things (EXPLORE), pop-ups with TASTE and TAKE AWAY. */
(function(){
const wrap=document.getElementById('mapWrap'),cv=document.getElementById('map');
if(!wrap||!cv)return;
const ctx=cv.getContext('2d');
const R=window.ROUTES||{},DEST=TRIPS.filter(t=>R[t.id]);
const card=document.getElementById('mapCard'),heroCopy=document.getElementById('heroCopy');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let W=0,H=0,DPR=1;
const V={x:60,y:-20,k:4};                 // centre (lng, -lat) and pixels per degree
let kMin=3,kMax=5000,interacted=false;

/* ---------- small helpers ---------- */
const cl=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const ramp=(v,a,b)=>cl((v-a)/(b-a));
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const sx=x=>(x-V.x)*V.k+W/2, sy=y=>(y-V.y)*V.k+H/2;
const wx=px=>(px-W/2)/V.k+V.x, wy=py=>(py-H/2)/V.k+V.y;

/* ---------- land data ---------- */
const land={a:null,b:null,detail:{}};      // a: coarse world, b: medium world, detail: per destination
function decode(rs){return rs.map(a=>{const o=new Float32Array(a.length);let x=0,y=0,x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  let off=0,px=null;for(let i=0;i<a.length;i+=2){x+=a[i];y+=a[i+1];let X=x/100+off;if(px!==null&&X-px>180){off-=360;X-=360}else if(px!==null&&X-px<-180){off+=360;X+=360}px=X;const Y=-y/100;o[i]=X;o[i+1]=Y;if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y}
  const shift=(x0+x1)/2>180?-360:(x0+x1)/2<-180?360:0;if(shift){for(let i=0;i<o.length;i+=2)o[i]+=shift;x0+=shift;x1+=shift}
  o.box=[x0,y0,x1,y1];return o})}
function toPath(rs){const p=new Path2D();for(const r of rs){p.moveTo(r[0],r[1]);for(let i=2;i<r.length;i+=2)p.lineTo(r[i],r[i+1]);p.closePath()}return p}
function pip(rs,x,y){let inside=false;for(const r of rs){const b=r.box;if(x<b[0]||x>b[2]||y<b[1]||y>b[3])continue;
  for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){const xi=r[i],yi=r[i+1],xj=r[j],yj=r[j+1];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside}}return inside}

/* ---------- fixed features ---------- */
const COASTAL=new Set(['maldives','santorini','lofoten','bali','newzealand','patagonia','iceland']); // places whose detailed coastline is drawn with its own shore
// big lakes the coastline data does not carry: [lng,lat,rx,ry,rot]
const LAKES=[[33,-1,1.4,1.2,0],[29.5,-6,.3,3.2,-15],[34.6,-12,.3,2.6,0],[108,53,.4,3,30],[-87.5,47.6,2.5,.7,0],[-87,44,.6,2,0],[-82.3,44.8,1.2,1.2,0],[-81.2,42.2,1.8,.4,20],[-77.8,43.6,1.3,.4,0],
 [-69.4,-15.8,.55,.3,-30],[31.5,60.8,1,.7,0],[75,46.3,2.5,.3,10],[36.1,4.0,.15,1.0,0],[-123,62,2.5,1,0],[-112,62.5,2,1,0]];
const CONTINENTS=[['NORTH AMERICA',-100,46],['SOUTH AMERICA',-60,-15],['EUROPE',18,52],['AFRICA',20,6],['ASIA',90,48],['AUSTRALIA',134,-25],['ANTARCTICA',30,-76]];
const SEAS=[['Mediterranean Sea',18,35],['Arabian Sea',64,15],['Bay of Bengal',89,14],['Caribbean Sea',-75,15],['Gulf of Mexico',-90,25],['South China Sea',114,13],['Coral Sea',155,-18],['Tasman Sea',160,-38],['Norwegian Sea',2,68]];
const OCEANS=[['Pacific Ocean',-150,8],['Pacific Ocean',165,22],['Atlantic Ocean',-38,28],['Atlantic Ocean',-18,-22],['Indian Ocean',78,-22],['Arctic Ocean',20,79],['Southern Ocean',40,-58]];
function routeBox(r){const xs=r.stops.map(s=>s[2]),ys=r.stops.map(s=>-s[1]);let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const span=Math.max(x1-x0,y1-y0,.08);return {x0,x1,y0,y1,cx:(x0+x1)/2,cy:(y0+y1)/2,span}}

/* ---------- clouds ---------- */
function cloudSprite(kind,sd){
  const N=256,c=document.createElement('canvas');c.width=c.height=N;const g=c.getContext('2d'),im=g.createImageData(N,N),d=im.data;
  seed=sd;const P=new Float32Array(64*64);for(let i=0;i<P.length;i++)P[i]=rnd();
  const vn=(x,y)=>{x=((x%64)+64)%64;y=((y%64)+64)%64;const X=Math.floor(x),Y=Math.floor(y),fx=x-X,fy=y-Y,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),X1=(X+1)%64,Y1=(Y+1)%64;
    return (P[Y*64+X]*(1-u)+P[Y*64+X1]*u)*(1-v)+(P[Y1*64+X]*(1-u)+P[Y1*64+X1]*u)*v};
  const wisp=kind==='wisp';
  const ss=(e0,e1,v)=>{const t=Math.max(0,Math.min(1,(v-e0)/(e1-e0)));return t*t*(3-2*t)};
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const nx=(i-N/2)/(N/2),ny=(j-N/2)/(N/2)*(wisp?2.2:1.35),r=Math.hypot(nx,ny);if(r>=1)continue;
    const fall=1-Math.pow(r,wisp?1.3:1.7);
    // broad shape first, finer billows on top; wisps are noise stretched into long streaks
    let f=0,a=.5,fr=wisp?3:2.2;for(let o=0;o<5;o++){f+=a*vn(i/N*fr*(wisp?.18:1)+o*7.3,j/N*fr+o*3.1);fr*=2.05;a*=.5}
    const v=wisp?ss(.32,.95,fall*.55+(f-.5)*2.6)*Math.pow(fall,.7):ss(.28,.72,fall*.95+(f-.5)*1.1);if(v<=0)continue;
    const top=wisp?1:1-.22*Math.max(0,ny/1.35+.15);           // sunlit tops, soft grey undersides
    const k=(j*N+i)*4;d[k]=255*top;d[k+1]=255*top;d[k+2]=Math.min(255,266*top);d[k+3]=v*(wisp?160:245)}
  g.putImageData(im,0,0);
  const s2=document.createElement('canvas');s2.width=s2.height=N;const h=s2.getContext('2d');h.drawImage(c,0,0);h.globalCompositeOperation='source-in';h.fillStyle='rgb(28,40,58)';h.fillRect(0,0,N,N);
  c.shadow=s2;return c}
const WISP=cloudSprite('wisp',12),SPR=[cloudSprite('cum',31),cloudSprite('cum',57),cloudSprite('cum',83),WISP,WISP];
seed=99;
const CLOUDS=[];
for(let i=0;i<42;i++)CLOUDS.push({x:-180+rnd()*360,y:-(-50+rnd()*115),s:7+rnd()*7,i:i%3,v:.02+rnd()*.03,g:true,p:1});
for(let i=0;i<18;i++)CLOUDS.push({x:-180+rnd()*360,y:-(-45+rnd()*105),s:12+rnd()*9,i:3+i%2,v:.04+rnd()*.04,g:true,p:1.18,wisp:true});
for(const d of DEST){const b=routeBox(R[d.id]);for(let i=0;i<9;i++){const a=i/9*Math.PI*2+rnd(),rr=b.span*(.6+rnd()*1.1);
  CLOUDS.push({x:b.cx+Math.cos(a)*rr,y:b.cy+Math.sin(a)*rr*.7,s:b.span*(1.1+rnd()*1.2),i:i%3,v:b.span*.004,d:d.id,p:1})}}
function cloudAlpha(c){
  if(c.g)return (c.wisp?.42:.5)*(1-ramp(V.k,14,40));
  const f=fitK(c.d),q=V.k/f;return .9*ramp(q,.05,.16)*(1-ramp(q,.26,.5));
}

/* ---------- views ---------- */
const phone=()=>W<760;
// the part of the map a journey is framed in: clear of the header, the place bar and the zoom buttons
function stage(){return phone()?{x0:22,x1:W-74,y0:120,y1:H-104}:{x0:W*.2,x1:W*.8,y0:120,y1:H-110}}
const fitCache={};
function fitK(id){const key=id+W+'x'+H;if(fitCache[key])return fitCache[key];const b=routeBox(R[id]),s=stage(),pad=b.span*.35;
  return fitCache[key]=Math.min(kMax,(s.x1-s.x0)/(b.x1-b.x0+pad),(s.y1-s.y0)/(b.y1-b.y0+pad))}
function fitView(id){const b=routeBox(R[id]),s=stage(),k=fitK(id);return {x:b.cx-((s.x0+s.x1)/2-W/2)/k,y:b.cy-((s.y0+s.y1)/2-H/2)/k,k}}
function clampView(){V.k=cl(V.k,kMin,kMax);const hw=W/2/V.k,hh=H/2/V.k;
  V.x=360<2*hw?0:cl(V.x,-180+hw,180-hw);V.y=144<2*hh?-11:cl(V.y,-84+hh,60-hh)}

/* ---------- render ---------- */
const IMG={ocean:null,land1:null,land3:null,crop:{}};let RELIEF={};
/* Colour looks: each is a full set of relief images in data/looks/<id>/ plus light, haze and vignette colours */
/* Map colours. One look ships at a time; its relief images live in data/looks/<dir>/ (build with tools/build_relief.py <dir>).
   satellite: natural, muted land on one flat, calm ocean colour (the client's reference: a "satellite map, flat ocean" poster).
   vivid:     jade, saffron and ultramarine with a depth-shaded sea. To switch back: LOOK=LOOKS.vivid and restore data/looks/vivid from git. */
const LOOKS={relief:{dir:'relief',flat:false,calm:true,dataLakes:true,sun:'255,248,232',sunA:.1,vig:'30,80,78',vigA:.07,sea:['#c4eedb','#a6d5c9'],shade:'14,70,66',shadeK:1.2,shadeLen:1.4,shimmer:.07,
               coast:'rgba(236,255,247,.5)',label:'rgba(58,108,110,.72)',land:'rgba(78,62,40,.5)'},
             satellite:{dir:'satellite',flat:true,sun:'255,236,205',sunA:.3,vig:'4,12,26',sea:['#1c3a54','#1c3a54'],shade:'0,6,18',shimmer:.1},
             vivid:{dir:'vivid',flat:false,sun:'255,214,140',sunA:.55,vig:'10,30,90',sea:['#36dcd6','#0f78c4'],shade:'6,28,80',shimmer:.22}};
const LOOK=LOOKS.relief;
function img(src,cb){const i=new Image();i.decoding='async';i.onload=()=>{cb(i);statKey='';wake()};i.src=src;return i}
function loadCrop(id){IMG.crop[id]='loading';img(`data/looks/${LOOK.dir}/relief-${id}.webp`,i=>IMG.crop[id]=i)}
const omask=document.createElement('canvas'),mctx=omask.getContext('2d');    // where the sea is (for the shimmer)
const shim=document.createElement('canvas'),hctx=shim.getContext('2d');
const dof=document.createElement('canvas'),dctx=dof.getContext('2d');let dofOn=false; // miniature depth of field
let tNow=0;const stat=document.createElement('canvas'),sctx=stat.getContext('2d');let statKey='';
let landA=null,landB=null;const detailPath={};
function activeDetail(){ // the destination whose detailed coastline should be added for this view
  if(V.k<25)return null;for(const d of DEST){const dd=land.detail[d.id];if(!dd||!dd.length)continue;const b=routeBox(R[d.id]),m=2.2;
    if(V.x>b.x0-m&&V.x<b.x1+m&&V.y>b.y0-m&&V.y<b.y1+m)return d.id}return null}
function drawStatic(){
  const c=sctx;stat.width=W*DPR;stat.height=H*DPR;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const T=[V.k*DPR,0,0,V.k*DPR,(W/2-V.x*V.k)*DPR,(H/2-V.y*V.k)*DPR];
  const vx0=wx(0),vx1=wx(W),vy0=wy(0),vy1=wy(H);
  // sea: depth-shaded (turquoise shelves, deep blue ocean)
  c.setTransform(DPR,0,0,DPR,0,0);
  const og=c.createLinearGradient(0,0,0,H);og.addColorStop(0,LOOK.sea[0]);og.addColorStop(1,LOOK.sea[1]);c.fillStyle=og;c.fillRect(0,0,W,H);
  c.setTransform(...T);
  if(IMG.ocean&&!LOOK.flat)c.drawImage(IMG.ocean,-180,-90,360,180);
  const did=activeDetail();
  const base=V.k<10||!landB?landA:landB;if(!base)return;const extra=did?detailPath[did]:null,coastal=extra&&COASTAL.has(did);
  const path=base;c.lineJoin='round';
  for(const p of coastal?[path,extra]:[path]){c.strokeStyle=LOOK.coast||(LOOK.flat?'rgba(150,196,214,.22)':'rgba(225,246,240,.35)');c.lineWidth=6/V.k;c.stroke(p)}
  // the land sits a little proud of the sea, like a relief model: a soft shadow falls to the south-east
  const sl=LOOK.shadeLen||1,sk=LOOK.shadeK||(LOOK.flat?1.6:1);
  for(const [ox,oy,al] of [[2,3,.16],[4,7,.12],[7,12,.07],[11,18,.04]]){c.setTransform(T[0],0,0,T[3],T[4]+ox*sl*DPR,T[5]+oy*sl*DPR);c.fillStyle=`rgba(${LOOK.shade},${al*sk})`;c.fill(path);if(coastal)c.fill(extra)}
  c.setTransform(...T);
  // land: natural relief (real elevation, designed colours), kept to the coastline
  const clipPath=extra?(()=>{const p=new Path2D(path);p.addPath(extra);return p})():path;
  c.save();c.clip(clipPath);
  const land=IMG.land3||IMG.land1;
  if(land)c.drawImage(land,-180,-90,360,180);else{c.fillStyle='#c4ca97';c.fillRect(-180,-90,360,180)}
  c.restore();
  // sharper close-ups melt in as you zoom into a place
  if(V.k>9)for(const id in RELIEF){const bx=RELIEF[id];if(bx[2]<vx0||bx[0]>vx1||-bx[1]<vy0||-bx[3]>vy1)continue;
    const img=IMG.crop[id];if(!img){loadCrop(id);continue}if(img==='loading')continue;
    c.globalAlpha=ramp(V.k,9,20);c.drawImage(img,bx[0],-bx[3],bx[2]-bx[0],bx[3]-bx[1]);c.globalAlpha=1}
  // lakes and rivers
  c.setTransform(...T);
  const lakes=[...LAKES.map(l=>l),...DEST.flatMap(d=>(R[d.id].lakes||[]).map(([la,lo,rx,ry,rot])=>[lo,la,rx,ry,rot||0,R[d.id].lakeColor]))];
  for(const [lo,la,rx,ry,rot,lc] of lakes){if(LOOK.dataLakes&&!lc)continue; // real lakes come from the colour data; only signature lakes (Pangong, Tso Moriri) are drawnif(lo+rx<vx0||lo-rx>vx1||-la+ry<vy0||-la-ry>vy1)continue;if(rx*V.k<1.5)continue;
    c.save();c.translate(lo,-la);c.rotate((rot||0)*Math.PI/180);c.scale(rx,ry);
    const lg=c.createRadialGradient(0,0,0,0,0,1);const col=lc||'#4f98ad';lg.addColorStop(0,col);lg.addColorStop(.82,col);lg.addColorStop(1,'rgba(120,170,170,0)'); // soft natural shoreline
    c.globalAlpha=.88;c.fillStyle=lg;c.beginPath();c.arc(0,0,1,0,7);c.fill();c.globalAlpha=1;c.restore()}
  if(V.k>25)for(const d of DEST)for(const rv of R[d.id].rivers||[]){c.strokeStyle='rgba(92,150,170,.55)';c.lineWidth=Math.min(4,Math.max(1.2,V.k/150))/V.k;c.lineCap='round';c.beginPath();rv.forEach(([la,lo],i)=>i?c.lineTo(lo,-la):c.moveTo(lo,-la));c.stroke()}
  // coastline
  c.strokeStyle='rgba(70,105,110,.45)';c.lineWidth=.8/V.k;c.stroke(path);if(coastal)c.stroke(extra);
  // sea mask for the shimmer (land cut out)
  omask.width=W;omask.height=H;mctx.setTransform(V.k,0,0,V.k,W/2-V.x*V.k,H/2-V.y*V.k);mctx.fillStyle='#000';mctx.fill(clipPath);
  // depth of field: when you are inside a place, the top and bottom of the view soften like a tilt-shift photo
  let near=0;for(const d of DEST)near=Math.max(near,ramp(V.k/fitK(d.id),.45,.8)*onScreen(d.id));
  dofOn=!LOOK.calm&&near>.05&&!ptrs.size&&!anim&&!reduce;
  if(dofOn){dof.width=W*DPR;dof.height=H*DPR;dctx.setTransform(1,0,0,1,0,0);dctx.filter=`blur(${(W<760?2.2:3)*DPR}px)`;dctx.drawImage(stat,0,0);dctx.filter='none';
    dctx.globalCompositeOperation='destination-in';const gm=dctx.createLinearGradient(0,0,0,H*DPR);
    gm.addColorStop(0,`rgba(0,0,0,${near})`);gm.addColorStop(.26,'rgba(0,0,0,0)');gm.addColorStop(.74,'rgba(0,0,0,0)');gm.addColorStop(1,`rgba(0,0,0,${near})`);
    dctx.fillStyle=gm;dctx.fillRect(0,0,W*DPR,H*DPR);dctx.globalCompositeOperation='source-over'}
  // ocean names
  c.setTransform(DPR,0,0,DPR,0,0);
  const spaced=(t,g)=>t.split('').join(g);
  const put=(list,a,font,col,gap)=>{if(a<=.02)return;c.globalAlpha=a;c.font=font;c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';
    for(const [n,lo,la] of list){const x=sx(lo),y=sy(-la);if(x>-160&&x<W+160&&y>-20&&y<H+20)c.fillText(spaced(n,gap),x,y)}c.globalAlpha=1};
  put(OCEANS,1-ramp(V.k,12,20),'italic 300 15px Fraunces, Georgia, serif',LOOK.label||'rgba(38,82,96,.5)','\u2009');
  put(CONTINENTS,1-ramp(V.k,9,15),`500 ${phone()?11:13}px Fraunces, Georgia, serif`,LOOK.land||'rgba(60,50,35,.45)','\u2002');
  put(SEAS,ramp(V.k,7,10)*(1-ramp(V.k,26,40)),'italic 300 13px Fraunces, Georgia, serif',LOOK.label||'rgba(38,82,96,.5)','\u200a');
}
function drawAtolls(c){for(const [la,lo,rx,ry] of R.maldives.atolls){c.save();c.translate(lo,-la);c.strokeStyle='rgba(170,232,222,.9)';c.lineWidth=Math.max(rx,ry)*.22;c.beginPath();c.ellipse(0,0,rx,ry,0,0,7);c.stroke();
  c.fillStyle='rgba(176,226,222,.55)';c.fill();c.restore()}}

function render(){
  const key=[V.x.toFixed(5),V.y.toFixed(5),V.k.toFixed(4),W,H,landB?1:0,Object.keys(land.detail).length,ptrs.size?1:0,anim?1:0].join('|');
  if(key!==statKey){drawStatic();statKey=key}
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(stat,0,0);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(dofOn)ctx.drawImage(dof,0,0,W,H);
  // sun shimmer drifting across the water (masked to the sea)
  if(!reduce){hctx.setTransform(1,0,0,1,0,0);shim.width=Math.ceil(W/2);shim.height=Math.ceil(H/2);
    const gx=shim.width*(.5+.35*Math.cos(tNow*.00007)),gy=shim.height*(.35+.2*Math.sin(tNow*.00005));
    const gl=hctx.createRadialGradient(gx,gy,0,gx,gy,shim.width*.55);gl.addColorStop(0,'rgba(255,248,228,.55)');gl.addColorStop(1,'rgba(255,248,228,0)');
    hctx.fillStyle=gl;hctx.fillRect(0,0,shim.width,shim.height);hctx.globalCompositeOperation='destination-out';hctx.drawImage(omask,0,0,shim.width,shim.height);hctx.globalCompositeOperation='source-over';
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=LOOK.shimmer;ctx.drawImage(shim,0,0,W,H);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
  drawLife();
  // clouds: soft shadows on the land first, then the clouds; high wisps drift with more parallax
  const vis=[];
  for(const c of CLOUDS){const a=cloudAlpha(c);if(a<.02)continue;const s=c.s*V.k*(c.p>1?1.08:1);if(s<36||s>W*3)continue;
    const x=W/2+(c.x+(reduce?0:tNow*c.v*.001)-V.x)*V.k*c.p,y=H/2+(c.y-V.y)*V.k*c.p;if(x<-s||x>W+s||y<-s||y>H+s)continue;vis.push([c,a,s,x,y])}
  for(const [c,a,s,x,y] of vis){const o=s*(c.wisp?.16:.1);ctx.globalAlpha=a*(c.wisp?.12:.2);ctx.drawImage(SPR[c.i].shadow,x-s/2+o*.6,y-s/2+o,s,s)}
  for(const [c,a,s,x,y] of vis){ctx.globalAlpha=a;ctx.drawImage(SPR[c.i],x-s/2,y-s/2,s,s)}
  ctx.globalAlpha=1;
  // atmosphere: warm light from the top-left, a soft haze and vignette at the edges
  const L=LOOK;
  ctx.globalCompositeOperation='soft-light';
  const sun=ctx.createRadialGradient(W*.12,-H*.15,0,W*.12,-H*.15,Math.max(W,H)*1.1);sun.addColorStop(0,`rgba(${L.sun},${L.sunA})`);sun.addColorStop(1,`rgba(${L.sun},0)`);ctx.fillStyle=sun;ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='source-over';
  const vg0=ctx.createRadialGradient(W/2,H*.55,Math.min(W,H)*.45,W/2,H*.55,Math.max(W,H)*.85);vg0.addColorStop(0,`rgba(${L.vig},0)`);vg0.addColorStop(1,`rgba(${L.vig},${L.vigA??(L.flat?.14:.22)})`);ctx.fillStyle=vg0;ctx.fillRect(0,0,W,H);
  // dusk, so the journey can glow
  let dusk=0;for(const d of DEST)dusk=Math.max(dusk,starAlpha(d.id)*onScreen(d.id));
  if(dusk>0&&!LOOK.flat&&!LOOK.calm){ctx.fillStyle=`rgba(18,28,58,${.16*dusk})`;ctx.fillRect(0,0,W,H);
    const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(10,16,40,0)');vg.addColorStop(1,`rgba(10,16,40,${.4*dusk})`);ctx.fillStyle=vg;ctx.fillRect(0,0,W,H)}
  // journeys, wild things and place markers; labels are placed so they never collide with each other or the page's own controls
  stopHits=[];hits=[];wildHits=[];placed=[];reserveUI();
  const wl=layoutWild();
  for(const d of DEST)drawJourney(d);
  drawWild(wl);
  for(const d of DEST)drawMarker(d);
  positionPop();
}

/* ---------- little signs of life: a plane hopping between our places, birds over the place you're in ---------- */
function drawLife(){
  if(reduce)return;
  const far=1-ramp(V.k,14,30);
  if(far>.02&&DEST.length>1){ // one small plane at a time, flying the year's trips in order
    const leg=14000,n=Math.floor(tNow/leg)%DEST.length,t=(tNow%leg)/leg,a=DEST[n],b=DEST[(n+1)%DEST.length];
    let dx=b.lng-a.lng;if(dx>180)dx-=360;if(dx<-180)dx+=360;
    const x0=a.lng,y0=-a.lat,x1=a.lng+dx,y1=-b.lat,lift=Math.min(18,Math.hypot(dx,y1-y0)*.22),mx=(x0+x1)/2,my=(y0+y1)/2-lift;
    const pt=u=>[(1-u)*(1-u)*x0+2*(1-u)*u*mx+u*u*x1,(1-u)*(1-u)*y0+2*(1-u)*u*my+u*u*y1];
    const e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,fade=Math.min(1,t*8,(1-t)*8)*far;
    for(const off of [0,-360,360]){ // the map can show a place twice across the date line; draw whichever copy is on screen
      const [px,py]=pt(e),X=sx(px+off),Y=sy(py);if(X<-60||X>W+60||Y<-60||Y>H+60)continue;
      ctx.save();ctx.lineCap='round';ctx.setLineDash([2,6]);ctx.lineWidth=1.6;ctx.strokeStyle=`rgba(255,255,255,${.75*fade})`;ctx.beginPath();
      for(let u=Math.max(0,e-.35);u<=e;u+=.02){const [qx,qy]=pt(u);u===Math.max(0,e-.35)?ctx.moveTo(sx(qx+off),sy(qy)):ctx.lineTo(sx(qx+off),sy(qy))}ctx.stroke();ctx.setLineDash([]);
      const [nx,ny]=pt(Math.min(1,e+.01)),ang=Math.atan2(sy(ny)-Y,sx(nx+off)-X);
      ctx.translate(X,Y);ctx.rotate(ang);ctx.globalAlpha=fade;ctx.shadowColor='rgba(10,30,70,.45)';ctx.shadowBlur=6;ctx.shadowOffsetY=3;ctx.fillStyle='#fff';
      ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(-2,-1.8);ctx.lineTo(-5,-7);ctx.lineTo(-7,-7);ctx.lineTo(-5,-1.6);ctx.lineTo(-8,-1.2);ctx.lineTo(-9.5,-3.4);ctx.lineTo(-10.5,-3.4);ctx.lineTo(-9.6,0);
      ctx.lineTo(-10.5,3.4);ctx.lineTo(-9.5,3.4);ctx.lineTo(-8,1.2);ctx.lineTo(-5,1.6);ctx.lineTo(-7,7);ctx.lineTo(-5,7);ctx.lineTo(-2,1.8);ctx.closePath();ctx.fill();ctx.restore()}
  }
  if(focus){const q=V.k/fitK(focus),a=ramp(q,.5,.8)*(1-ramp(q,3,5))*.55;if(a>.02){ // a small flock drifting across
    ctx.strokeStyle=`rgba(20,30,50,${a})`;ctx.lineWidth=1.3;ctx.lineCap='round';
    for(let i=0;i<5;i++){const x=((tNow*.018+i*23+(i%2)*9)%(W+160))-80,y=H*.26+Math.sin(tNow*.0006+i)*10+i*7-(i%2)*12,f=3+Math.sin(tNow*.012+i*2)*1.6;
      ctx.beginPath();ctx.moveTo(x-5,y-f);ctx.quadraticCurveTo(x-2,y-f*.2,x,y);ctx.quadraticCurveTo(x+2,y-f*.2,x+5,y-f);ctx.stroke()}}}
}

/* ---------- labels ---------- */
let placed=[];
const btns=document.querySelector('.map-btns'),crumb=document.getElementById('crumb'),popEl=document.getElementById('mapPop'),arrive=document.getElementById('arrive');
function reserveUI(){ // screen areas labels must stay out of: the site header and the map's own controls
  placed.push([0,0,W,74]);
  const wr=wrap.getBoundingClientRect();
  for(const el of [btns,card,crumb,heroCopy]){if(!el||el.hidden)continue;if(el===card&&!card.classList.contains('on'))continue;if(el===heroCopy&&heroCopy.classList.contains('away'))continue;
    const r=el.getBoundingClientRect();if(!r.width)continue;placed.push([r.left-wr.left-6,r.top-wr.top-6,r.width+12,r.height+12])}
}
const KIND_RGB={arrive:'60,207,134',depart:'60,207,134',stop:'255,106,69',side:'246,184,75'};
function fit(text,max){if(ctx.measureText(text).width<=max)return text;while(text.length>3&&ctx.measureText(text+'…').width>max)text=text.slice(0,-1);return text.trim()+'…'}
// place a label (name, optional second line) next to a dot without colliding with anything already placed; tries right, left, below, above
function placeLabel(name,sub,x,y,gap=13){
  const maxW=phone()?150:230;
  ctx.font='600 13px Inter, system-ui, sans-serif';const n=fit(name,maxW),w1=ctx.measureText(n).width;
  ctx.font='500 11px Inter, system-ui, sans-serif';const s=sub?fit(sub,maxW):'',w2=s?ctx.measureText(s).width:0;
  const w=Math.max(w1,w2),h=s?30:16;
  for(const [dx,dy,al] of [[gap,0,'left'],[-gap,0,'right'],[0,gap+11,'center'],[0,-gap-11,'center']]){
    const lx=al==='left'?x+dx:al==='right'?x+dx-w:x-w/2,ly=y+dy-h/2;
    if(lx<4||lx+w>W-4||ly<4||ly+h>H-4)continue;
    if(placed.some(r=>lx<r[0]+r[2]&&lx+w>r[0]&&ly<r[1]+r[3]&&ly+h>r[1]))continue;
    placed.push([lx-4,ly-3,w+8,h+6]);return {x:x+dx,y:y+dy,al,n,s}}
  return sub?placeLabel(name,'',x,y,gap):null}
function drawLabel(pl,a){ctx.textAlign=pl.al;ctx.textBaseline='middle';ctx.lineJoin='round';ctx.strokeStyle=`rgba(14,20,34,${.6*a})`;
  ctx.font='600 13px Inter, system-ui, sans-serif';ctx.lineWidth=3.5;ctx.strokeText(pl.n,pl.x,pl.s?pl.y-7:pl.y);ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.fillText(pl.n,pl.x,pl.s?pl.y-7:pl.y);
  if(pl.s){ctx.font='500 11px Inter, system-ui, sans-serif';ctx.lineWidth=3;ctx.strokeText(pl.s,pl.x,pl.y+8);ctx.fillStyle=`rgba(255,244,232,${.94*a})`;ctx.fillText(pl.s,pl.x,pl.y+8)}}

/* ---------- the journey: stops joined in travel order ---------- */
const prog={},holdUntil={};let hits=[],stopHits=[],wildHits=[];
function starAlpha(id){return ramp(V.k/fitK(id),.32,.62)}
function onScreen(id){const b=routeBox(R[id]);return (sx(b.cx)>-W*.2&&sx(b.cx)<W*1.2&&sy(b.cy)>-H*.2&&sy(b.cy)<H*1.2)?1:0}
function drawJourney(d){
  const r=R[d.id],a=starAlpha(d.id);if(a<=0||!onScreen(d.id)||(focus&&focus!==d.id)){prog[d.id]=0;return}
  const pts=r.stops.map(s=>[sx(s[2]),sy(-s[1])]);if(r.loop)pts.push(pts[0]);
  const n=pts.length-1,held=tNow<(holdUntil[d.id]||0);if(held){prog[d.id]=0;return}
  prog[d.id]=reduce?n:Math.min(n,(prog[d.id]||0)+(a>.5&&!held?.07:0));const P=prog[d.id];
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<=n;i++){const f=cl(P-(i-1));if(f<=0)break;const [x0,y0]=pts[i-1],[x1,y1]=pts[i];
    const mx=(x0+x1)/2-(y1-y0)*.12,my=(y0+y1)/2+(x1-x0)*.12; // a slight curve reads as a journey, not a ruler line
    if(f>=1)ctx.quadraticCurveTo(mx,my,x1,y1);else{const qx=x0+(mx-x0)*f,qy=y0+(my-y0)*f,rx=mx+(x1-mx)*f,ry=my+(y1-my)*f;ctx.quadraticCurveTo(qx,qy,qx+(rx-qx)*f,qy+(ry-qy)*f)}}
  ctx.strokeStyle=`rgba(20,24,40,${.35*a})`;ctx.lineWidth=5;ctx.stroke();                                         // soft casing so the line reads on any terrain
  ctx.strokeStyle=`rgba(255,255,255,${.95*a})`;ctx.lineWidth=2.4;ctx.setLineDash([7,6]);ctx.lineDashOffset=reduce?0:-tNow*.012;ctx.stroke();
  ctx.restore();
  const shown=i=>i<=Math.ceil(P)||i===0;
  r.stops.forEach((s,i)=>{if(shown(i)){const [x,y]=pts[i];placed.push([x-10,y-10,20,20])}});
  r.stops.forEach((s,i)=>{if(!shown(i))return;const [x,y]=pts[i],k=s[5]||'stop',rgb=KIND_RGB[k],sel=pop&&pop.kind==='stop'&&pop.id===d.id&&pop.i===i;
    const tw=reduce?1:.75+.25*Math.sin(tNow*.003+i*1.7),big=k==='arrive'||k==='depart'||sel;
    const halo=sel?26:big?20:15,g=ctx.createRadialGradient(x,y,0,x,y,halo);g.addColorStop(0,`rgba(${rgb},${.6*a*tw})`);g.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,halo,0,7);ctx.fill();
    ctx.fillStyle=`rgba(${rgb},${a})`;ctx.beginPath();ctx.arc(x,y,sel?8:big?6.5:5,0,7);ctx.fill();
    ctx.strokeStyle=`rgba(255,255,255,${.97*a})`;ctx.lineWidth=2;ctx.stroke();
    if(sel){ctx.strokeStyle=`rgba(255,255,255,${.9*a})`;ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(x,y,13,0,7);ctx.stroke()}
    if(!sel){const pl=placeLabel(s[0],phone()?s[3]:`${s[3]} · ${s[4]||''}`,x,y);if(pl)drawLabel(pl,a)}
    stopHits.push({x,y,id:d.id,i})});
}

/* ---------- wild things: small dots that bloom into badges as you zoom in ---------- */
const WILD=window.WILDLIFE||{};
function layoutWild(){const out=[];
  for(const d of DEST){const list=WILD[d.id];if(!list||(focus&&focus!==d.id))continue;const q=V.k/fitK(d.id),a=ramp(q,.55,.8)*onScreen(d.id);if(a<=.02)continue;
    if(tNow<(holdUntil[d.id]||0)+700)continue;
    const big=ramp(q,1.2,1.6),r=5+9*big,obst=R[d.id].stops.map(s=>[sx(s[2]),sy(-s[1]),11]);
    list.forEach((w,i)=>{const x0=sx(w[3]),y0=sy(-w[2]);if(x0<-40||x0>W+40||y0<40||y0>H+40)return;
      let x=x0,y=y0;                                               // nudge away from stops and from each other, so nothing sits on the route's dots
      for(let it=0;it<4;it++)for(const [ox,oy,or] of obst){let dx=x-ox,dy=y-oy,dd=Math.hypot(dx,dy),min=or+r+4;if(dd<min){if(dd<.5){dx=.7;dy=-.7;dd=1}x=ox+dx/dd*min;y=oy+dy/dd*min}}
      obst.push([x,y,r]);placed.push([x-r-3,y-r-3,2*r+6,2*r+6]);out.push({x,y,x0,y0,r,a,big,w,id:d.id,i})})}
  return out}
function drawWild(list){
  for(const {x,y,x0,y0,r,a,big,w,id,i} of list){
    const sel=pop&&pop.kind==='wild'&&pop.id===id&&pop.i===i;
    ctx.globalAlpha=a;
    if(Math.hypot(x-x0,y-y0)>4){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x,y);ctx.stroke()}
    ctx.shadowColor='rgba(0,0,0,.3)';ctx.shadowBlur=5;ctx.shadowOffsetY=2;ctx.fillStyle='#fffaf2';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle=sel?'#ff6a45':'#1f9a72';ctx.lineWidth=sel?3:2;ctx.stroke();
    if(big>.35){ctx.globalAlpha=a*ramp(big,.35,.8);ctx.font=`${Math.round(7+9*big)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#000';ctx.fillText(w[0],x,y+1)}
    else{ctx.fillStyle='#1f9a72';ctx.beginPath();ctx.arc(x,y,1.8,0,7);ctx.fill()}
    ctx.globalAlpha=1;wildHits.push({x,y,r:Math.max(16,r+6),id,i})}
}

/* ---------- place markers (world view) ---------- */
function drawMarker(d){
  const a=focus&&focus!==d.id?1:1-starAlpha(d.id);if(a<=.02)return;const x=sx(d.lng),y=sy(-d.lat);if(x<-60||x>W+60||y<-30||y>H+30)return;
  const mine=typeof wish!=='undefined'&&wish.has(d.id),ph=reduce?0:(tNow*.0012+d.m*.37)%1;
  ctx.globalAlpha=a;ctx.strokeStyle=`rgba(255,255,255,${.75*(1-ph)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,7+ph*14,0,7);ctx.stroke();
  ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;ctx.fillStyle=mine?'#ffc94d':'#ff5a3c';ctx.beginPath();ctx.arc(x,y,6.5,0,7);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.strokeStyle='#fff';ctx.lineWidth=2.4;ctx.stroke();
  if(mine){ctx.strokeStyle='#5a3d00';ctx.lineWidth=1.8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-2.8,y+.2);ctx.lineTo(x-.8,y+2.3);ctx.lineTo(x+3,y-2.2);ctx.stroke()} // on your bucket list
  placed.push([x-9,y-9,18,18]);const pl=placeLabel(d.name,'',x,y,12);if(pl)drawLabel(pl,1);
  ctx.globalAlpha=1;hits.push({x,y,id:d.id});
}

/* ---------- pop-ups: one design, pinned to its spot on the map, follows as you move ---------- */
let pop=null;
const esc2=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function popHTML(p){
  const t=TRIPS.find(x=>x.id===p.id),B=(window.BUCKET||{})[p.id]||{};
  if(p.kind==='stop'){const r=R[p.id],s=r.stops[p.i],n=r.stops.length,k=s[5]||'stop';
    const taste=(B.taste||[]).filter(x=>x[1]===s[0]),take=(B.take||[]).filter(x=>x[1]===s[0]);
    const prev=r.stops[(p.i+n-1)%n],next=r.stops[(p.i+1)%n],last=p.i===n-1,first=p.i===0;
    return `<button class="mp-x" type="button" data-pop-close aria-label="Close">✕</button>
     <p class="mp-k"><i style="background:rgb(${KIND_RGB[k]})"></i>${esc2(s[3])} · stop ${p.i+1} of ${n}</p><h4>${esc2(s[0])}</h4>
     <dl class="mp-rows"><div><dt>Go</dt><dd>${esc2(s[4]||'')}</dd></div>
      ${taste.map(x=>`<div><dt>Taste</dt><dd><b>${esc2(x[0])}.</b> ${esc2(x[2])}</dd></div>`).join('')}
      ${take.map(x=>`<div><dt>Take away</dt><dd><b>${esc2(x[0])}.</b> ${esc2(x[2])}</dd></div>`).join('')}</dl>
     <div class="mp-nav"><button type="button" data-pop-step="-1" ${first&&!r.loop?'disabled':''}>← ${esc2(first&&!r.loop?'Start':prev[0])}</button>
      ${last&&!r.loop?`<button type="button" class="go" data-pop-unbucket="${p.id}">Unbucket ${esc2(t.name)}</button>`:`<button type="button" class="go" data-pop-step="1">${esc2(next[0])} →</button>`}</div>`}
  const w=WILD[p.id][p.i];
  return `<button class="mp-x" type="button" data-pop-close aria-label="Close">✕</button>
   <p class="mp-k"><i style="background:#1f9a72"></i>Explore · best ${esc2(w[6])}</p><h4><span aria-hidden="true">${w[0]}</span> ${esc2(w[1])}</h4>
   <dl class="mp-rows"><div><dt>Where</dt><dd>${esc2(w[4])}</dd></div><div><dt>Why</dt><dd>${esc2(w[5])}</dd></div></dl>`;
}
function popAnchor(p){if(p.kind==='stop'){const s=R[p.id].stops[p.i];return [s[2],s[1]]}const w=WILD[p.id][p.i];return [w[3],w[2]]}
const popLimits=()=>({top:80,bottom:H-(phone()?92:84)});      // the band a pop-up may use: below the header, above the place bar
function openPop(p,{walk=false}={}){
  const home=pop?pop.home:{x:V.x,y:V.y,k:V.k};                 // where the map was before pop-ups started moving it
  pop=p;pop.home=home;[pop.lng,pop.lat]=popAnchor(p);setSheet(false);hideArrive(true);
  popEl.innerHTML=popHTML(p);popEl.hidden=false;popEl.style.visibility='';
  const L=popLimits(),cap=L.bottom-L.top-24,rows=popEl.querySelector('.mp-rows');let h=popEl.offsetHeight;
  if(h>cap){rows.style.maxHeight=Math.max(64,rows.offsetHeight-(h-cap))+'px';h=popEl.offsetHeight}   // a long one scrolls inside itself
  popEl.classList.remove('in');void popEl.offsetWidth;popEl.classList.add('in');
  // walking the journey: zoom just enough to tell this stop from its neighbours, otherwise keep the whole journey in view
  let k=V.k;
  if(walk&&p.kind==='stop'){const st=R[p.id].stops,me=st[p.i];let dmin=1e9;st.forEach((o,j)=>{if(j!==p.i)dmin=Math.min(dmin,Math.hypot(o[2]-me[2],o[1]-me[1]))});
    const f=fitK(p.id);k=Math.max(f,Math.min(64/Math.max(dmin,1e-6),f*6))}
  const same=Math.abs(k/V.k-1)<.08;if(same)k=V.k;
  const ax=sx(pop.lng),ay=sy(-pop.lat),on=ax>20&&ax<W-20&&ay>L.top&&ay<L.bottom;
  let tx=ax,ty=ay,side;
  if(same&&on){                                               // usually the map does not need to move at all
    const above=ay-20-h>=L.top,below=ay+20+h<=L.bottom;
    if(above)side='above';else if(below)side='below';
    else{const dA=L.top-(ay-20-h),dB=(ay+20+h)-L.bottom;if(dA<=dB){side='above';ty=ay+dA}else{side='below';ty=ay-dB}}
    tx=cl(ax,28,W-28);
  }else{side='above';const g=stage();tx=(g.x0+g.x1)/2;ty=Math.min(L.bottom-8,Math.max(L.top+h+20,H*.6))}
  pop.side=side;
  if(k!==V.k||Math.hypot(tx-ax,ty-ay)>2)flyTo({x:pop.lng-(tx-W/2)/k,y:-pop.lat-(ty-H/2)/k,k},{ms:same?380:750,keep:true});
  wake();
}
// restore: put the map back where it was before the pop-up moved it (when you close it yourself)
function closePop(restore){if(!pop)return;const home=pop.home;pop=null;popEl.hidden=true;
  if(restore&&home&&(Math.abs(home.k/V.k-1)>.02||Math.hypot((home.x-V.x)*V.k,(home.y-V.y)*V.k)>3))flyTo(home,{ms:450,keep:true});
  wake()}
function positionPop(){
  if(!pop)return;const ax=sx(pop.lng),ay=sy(-pop.lat);
  if(ax<-30||ax>W+30||ay<30||ay>H+30){if(anim){popEl.style.visibility='hidden';return}return closePop()}   // flying to it: wait; you dragged it away: close
  popEl.style.visibility='';
  const w=popEl.offsetWidth,h=popEl.offsetHeight,L=popLimits();
  if(!anim){const above=ay-20-h>=L.top,below=ay+20+h<=L.bottom;if(pop.side==='above'&&!above&&below)pop.side='below';else if(pop.side==='below'&&!below&&above)pop.side='above'}
  const left=cl(ax-w/2,8,W-w-8),top=pop.side==='below'?ay+20:ay-h-20;
  popEl.classList.toggle('below',pop.side==='below');
  popEl.style.transform=`translate(${left.toFixed(1)}px,${top.toFixed(1)}px)`;popEl.style.setProperty('--ax',cl(ax-left,18,w-18).toFixed(1)+'px');
}
popEl.addEventListener('click',e=>{
  if(e.target.closest('[data-pop-close]'))return closePop(true);
  const st=e.target.closest('[data-pop-step]');if(st&&pop){const n=R[pop.id].stops.length;return openPop({kind:'stop',id:pop.id,i:(pop.i+ +st.dataset.popStep+n)%n},{walk:true})}
  const u=e.target.closest('[data-pop-unbucket]');if(u){const id=u.dataset.popUnbucket;closePop();openTrip(id,{book:true})}
});

/* ---------- focus: get into one place, and out again ---------- */
let focus=null;
function updateFocus(){
  // the place you are in: zoomed in enough, and looking at its journey (its centre is near, or the view centre is inside its area)
  let best=null,bd=1e9;
  for(const d of DEST){const q=V.k/fitK(d.id);if(q<.3)continue;const b=routeBox(R[d.id]),m=b.span*.7;
    const dist=Math.hypot((V.x-b.cx)*V.k,(V.y-b.cy)*V.k),inside=V.x>b.x0-m&&V.x<b.x1+m&&V.y>b.y0-m&&V.y<b.y1+m;
    if((inside||dist<Math.max(W,H)*.6)&&dist<bd){bd=dist;best=d.id}}
  if(pop&&focus===pop.id&&V.k/fitK(pop.id)>=.3)best=pop.id;      // an open pop-up keeps you in its place
  if(best!==focus){focus=best;if(pop&&pop.id!==best)closePop();if(!best)hideArrive(true);showCard(best)}
  heroCopy.classList.toggle('away',!!focus||interacted&&V.k>kStart*1.5);
}
function localTime(tz){try{return new Intl.DateTimeFormat('en-GB',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:tz}).format(new Date()).replace(/\s?(am|pm)/i,(m,p)=>' '+p.toLowerCase())}catch(e){return ''}}
function showCard(id){
  wrap.classList.toggle('carded',!!id);crumb.hidden=!id;
  if(!id){card.classList.remove('on','open');wrap.classList.remove('sheet-open');return}
  const t=TRIPS.find(x=>x.id===id),r=R[id],offers=(window.OFFERS||{})[id]||[],B=(window.BUCKET||{})[id]||{},wild=WILD[id]||[],mine=wish.has(id),time=B.tz?localTime(B.tz):'';
  crumb.innerHTML=`<button type="button" data-world>World</button><span aria-hidden="true">›</span><b>${t.name}</b>`;
  card.innerHTML=`<div class="pc-bar"><button class="pc-open" type="button" data-sheet aria-expanded="false" aria-label="More about ${t.name}">
     <b>${t.name}</b><span>${t.days} days · from ${money(t.price)}</span><i aria-hidden="true"></i></button>
    <button class="btn" type="button" data-unbucket="${id}">Unbucket</button></div>
   <div class="pc-more"><div class="pc-in">
    <p class="pc-eye">Best in ${MONTH_FULL[t.m]} · ${t.place}${time?` · ${time} there now`:''}</p>
    <p class="pc-tag">${t.hook}</p>
    <dl class="pc-rows">
     <div><dt>Go</dt><dd>${r.stops.length} stops in ${t.days} days, ${r.loop?`a loop from ${r.stops[0][0]}`:`from ${r.stops[0][0]} to ${r.stops[r.stops.length-1][0]}`}</dd></div>
     ${(B.taste||[]).length?`<div><dt>Taste</dt><dd>${B.taste.map(x=>x[0]).join(' · ')}</dd></div>`:''}
     ${wild.length?`<div><dt>Explore</dt><dd>${wild.slice(0,3).map(w=>w[1].replace(/ \(.*\)/,'')).join(' · ')}${wild.length>3?` · +${wild.length-3} more`:''}</dd></div>`:''}
     ${(B.take||[]).length?`<div><dt>Take away</dt><dd>${B.take.map(x=>x[0]).join(' · ')}</dd></div>`:''}</dl>
    <p class="pc-hint">Tap any stop on the map to walk the journey, day by day.</p>
    <div class="pc-row"><button class="btn ghost3" type="button" data-explore="${id}">See the full story</button>
     <button class="btn ghost3" type="button" data-bucket="${id}" aria-pressed="${mine}">${mine?'✓ On my bucket list':'+ My bucket list'}</button></div>
    <p class="pc-ways">${offers.length} way${offers.length===1?'':'s'} to unbucket ${t.name}</p>
   </div></div>`;
  card.classList.add('on');setSheet(false);
}
function setSheet(open){if(!card.classList.contains('on'))return;card.classList.toggle('open',open);wrap.classList.toggle('sheet-open',open);
  const b=card.querySelector('[data-sheet]'),m=card.querySelector('.pc-more');if(b)b.setAttribute('aria-expanded',open);if(m)m.inert=!open;if(open){closePop();hideArrive(true)}}
card.addEventListener('click',e=>{
  const u=e.target.closest('[data-unbucket]');if(u)return openTrip(u.dataset.unbucket,{book:true});
  const x=e.target.closest('[data-explore]');if(x)return openTrip(x.dataset.explore);
  const bk=e.target.closest('[data-bucket]');if(bk){const on=toggleBucket(bk.dataset.bucket);bk.setAttribute('aria-pressed',on);bk.textContent=on?'✓ On my bucket list':'+ My bucket list';return wake()}
  if(e.target.closest('[data-sheet]'))return setSheet(!card.classList.contains('open'));
});
crumb.addEventListener('click',e=>{if(e.target.closest('[data-world]'))flyTo(worldView())});
// arriving somewhere: a short title moment, then the journey draws itself
let arriveT=0;
function showArrive(id){
  const t=TRIPS.find(x=>x.id===id);if(!t||reduce)return;
  arrive.innerHTML=`<p>${MONTH_FULL[t.m]} · ${t.place}</p><h2>${t.name}</h2><span>${t.tag}</span>`;
  arrive.hidden=false;arrive.classList.remove('in');void arrive.offsetWidth;arrive.classList.add('in');
  holdUntil[id]=performance.now()+2000;prog[id]=0;clearTimeout(arriveT);arriveT=setTimeout(hideArrive,1900);
}
function hideArrive(early){clearTimeout(arriveT);arrive.classList.remove('in');if(early)for(const k in holdUntil)holdUntil[k]=0}

/* ---------- smooth flights (van Wijk & Nuij zoom-pan) ---------- */
let anim=null;
function flyTo(to,{ms=0,place=null,keep=false}={}){
  if(!keep)closePop();
  const p0=[V.x,V.y,W/V.k],p1=[to.x,to.y,W/to.k],rho=1.35,r2=rho*rho;
  const dx=p1[0]-p0[0],dy=p1[1]-p0[1],d2=dx*dx+dy*dy,d1=Math.sqrt(d2);let S,f;
  if(d2<1e-12){S=Math.log(p1[2]/p0[2])/rho;f=t=>[p0[0],p0[1],p0[2]*Math.exp(rho*t*S)]}
  else{const b0=(p1[2]*p1[2]-p0[2]*p0[2]+r2*r2*d2)/(2*p0[2]*r2*d1),b1=(p1[2]*p1[2]-p0[2]*p0[2]-r2*r2*d2)/(2*p1[2]*r2*d1);
    const r0=Math.log(Math.sqrt(b0*b0+1)-b0),r1=Math.log(Math.sqrt(b1*b1+1)-b1);S=(r1-r0)/rho;
    const cosh=x=>(Math.exp(x)+Math.exp(-x))/2,sinh=x=>(Math.exp(x)-Math.exp(-x))/2,tanh=x=>sinh(x)/cosh(x);
    f=t=>{const s=t*S,c0=cosh(r0),u=p0[2]/(r2*d1)*(c0*tanh(rho*s+r0)-sinh(r0));return [p0[0]+u*dx,p0[1]+u*dy,p0[2]*c0/cosh(rho*s+r0)]}}
  const dur=reduce?1:(ms||cl(Math.abs(S)*700,900,3200));const t0=performance.now();
  anim={step(now){const t=cl((now-t0)/dur),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;const [x,y,w]=f(e);V.x=x;V.y=y;V.k=W/w;if(t>=1){anim=null;if(place)showArrive(place)}}};
  wake();
}
function worldView(){return {x:phone()?82:42,y:phone()?-33:-24,k:kStart}}
function flyToPlace(id){if(!R[id])return;setSheet(false);hideArrive(true);flyTo(fitView(id),{place:id})}
window.mapFlyTo=flyToPlace;
window.mapProject=(lng,lat)=>({x:sx(lng),y:sy(-lat)});          // screen position of any lng/lat
window.mapScreenPos=id=>{const d=TRIPS.find(t=>t.id===id);return d?{x:sx(d.lng),y:sy(-d.lat)}:null};
window.mapState=()=>({moving:!!anim,drawn:focus?prog[focus]||0:0,focus,pop:pop&&{kind:pop.kind,i:pop.i},k:V.k,q:focus?V.k/fitK(focus):0,sheet:card.classList.contains('open'),wild:wildHits.map(h=>({x:h.x,y:h.y,i:h.i})),stops:stopHits.map(h=>({x:h.x,y:h.y,i:h.i}))});
window.mapRefresh=()=>wake();

/* ---------- gestures: drag to move, pinch / buttons / double-tap / ctrl+scroll to zoom ---------- */
const ptrs=new Map();let drag=null,vel={x:0,y:0},lastMove=0,tapStart=null;
function zoomAt(f,px,py){const x=wx(px),y=wy(py);V.k=cl(V.k*f,kMin,kMax);V.x=x-(px-W/2)/V.k;V.y=y-(py-H/2)/V.k;clampView()}
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});anim=null;interacted=true;
  if(ptrs.size===1){drag={moved:false};vel={x:0,y:0};tapStart={x:e.clientX,y:e.clientY,t:performance.now()}}else tapStart=null;wake()});
cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;const prev=ptrs.get(e.pointerId);const cur={x:e.clientX,y:e.clientY};
  if(ptrs.size===2||(tapStart&&Math.hypot(cur.x-tapStart.x,cur.y-tapStart.y)>8)){if(drag)drag.moved=true;if(pop)pop.home=null;setSheet(false);hideArrive(true)} // you're exploring: step out of the way
  if(ptrs.size===1&&drag){const dx=cur.x-prev.x,dy=cur.y-prev.y;V.x-=dx/V.k;V.y-=dy/V.k;clampView();const now=performance.now(),dt=Math.max(8,now-lastMove);vel={x:dx/dt,y:dy/dt};lastMove=now}
  else if(ptrs.size===2){const [a,b]=[...ptrs.values()];const other=a===prev?b:a;const d0=Math.hypot(prev.x-other.x,prev.y-other.y),d1=Math.hypot(cur.x-other.x,cur.y-other.y);
    const r=cv.getBoundingClientRect(),mx=(cur.x+other.x)/2-r.left,my=(cur.y+other.y)/2-r.top;if(d0>0)zoomAt(d1/d0,mx,my);V.x-=(cur.x-prev.x)/2/V.k;V.y-=(cur.y-prev.y)/2/V.k;clampView()}
  ptrs.set(e.pointerId,cur);wake()});
function endPtr(e){if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(tapStart&&ptrs.size===0){const moved=Math.hypot(e.clientX-tapStart.x,e.clientY-tapStart.y),dt=performance.now()-tapStart.t;
    if(moved<8&&dt<400){const r=cv.getBoundingClientRect();handleTap(e.clientX-r.left,e.clientY-r.top);tapStart=null;drag=null;return}}
  if(ptrs.size===0&&drag&&drag.moved&&!reduce&&performance.now()-lastMove<80){const v={...vel};inertia(v)}
  drag=ptrs.size===1?{moved:true}:null;tapStart=null;wake()}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
function inertia(v){let last=performance.now();anim={step(now){const dt=now-last;last=now;V.x-=v.x*dt/V.k;V.y-=v.y*dt/V.k;clampView();v.x*=Math.pow(.92,dt/16);v.y*=Math.pow(.92,dt/16);if(Math.hypot(v.x,v.y)<.02)anim=null}};wake()}
let lastTap=0;
function nearest(list,x,y,rad){let best=null,bd=1e9;for(const h of list){const d=Math.hypot(h.x-x,h.y-y);if(d<(h.r||rad)&&d<bd){bd=d;best=h}}return best}
function handleTap(x,y){
  const now=performance.now();
  // what did you tap? a stop on the journey first, then a wild thing, then a place
  const cand=[];
  for(const h of stopHits)if(starAlpha(h.id)>.5)cand.push({d:Math.hypot(h.x-x,h.y-y),r:20,kind:'stop',h});
  for(const h of wildHits)cand.push({d:Math.hypot(h.x-x,h.y-y),r:h.r,kind:'wild',h});
  const hit=cand.filter(c=>c.d<c.r).sort((p,q)=>p.d-q.d)[0];
  if(hit){lastTap=0;return openPop({kind:hit.kind,id:hit.h.id,i:hit.h.i})}
  const h=nearest(hits,x,y,26);if(h){lastTap=0;return flyToPlace(h.id)}
  if(pop){lastTap=0;return closePop(true)}
  if(card.classList.contains('open')){lastTap=0;return setSheet(false)}
  if(now-lastTap<320){lastTap=0;zoomSmooth(2.2,x,y)}else lastTap=now;
}
function zoomSmooth(f,px=W/2,py=H/2){const x=wx(px),y=wy(py),k=cl(V.k*f,kMin,kMax);flyTo({x:x-(px-W/2)/k,y:y-(py-H/2)/k,k},{ms:600,keep:true})}
// + and − zoom towards what you're looking at: the open pop-up, else the place you're in, else the middle of the map
function zoomBtn(f){interacted=true;setSheet(false);hideArrive(true);if(pop)pop.home=null;
  if(f<1&&focus&&V.k*f/fitK(focus)<.5)return flyTo(worldView());        // zooming out of a place takes you back to the world
  let px=W/2,py=H/2;
  if(pop){px=sx(pop.lng);py=sy(-pop.lat)}
  else if(focus){const b=routeBox(R[focus]),x=sx(b.cx),y=sy(b.cy);if(x>0&&x<W&&y>0&&y<H){px=x;py=y}}
  zoomSmooth(f,px,py)}
cv.addEventListener('wheel',e=>{
  if(e.ctrlKey||e.metaKey){e.preventDefault();interacted=true;anim=null;setSheet(false);if(pop)pop.home=null;const r=cv.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0025)),e.clientX-r.left,e.clientY-r.top);wake()}
  else showHint();
},{passive:false});
['gesturestart','gesturechange'].forEach(ev=>wrap.addEventListener(ev,e=>e.preventDefault()));
let hintT;function showHint(){const h=document.getElementById('zoomHint');if(!h)return;h.hidden=false;clearTimeout(hintT);hintT=setTimeout(()=>h.hidden=true,1600)}
document.getElementById('mzIn').onclick=()=>zoomBtn(1.9);
document.getElementById('mzOut').onclick=()=>zoomBtn(1/1.9);
cv.addEventListener('keydown',e=>{const m={ArrowLeft:[-60,0],ArrowRight:[60,0],ArrowUp:[0,-60],ArrowDown:[0,60]}[e.key];
  if(m){e.preventDefault();V.x+=m[0]/V.k;V.y+=m[1]/V.k;clampView();wake()}else if(e.key==='+'||e.key==='=')zoomBtn(1.9);else if(e.key==='-')zoomBtn(1/1.9);else if(e.key==='Escape'){closePop(true);setSheet(false)}});

/* ---------- loop ---------- */
let visible=true,raf=0;
function frame(now){raf=0;tNow=now;if(anim)anim.step(now);clampView();render();updateFocus();if(visible&&!document.hidden)raf=requestAnimationFrame(frame)}
function wake(){if(!raf)raf=requestAnimationFrame(frame)}
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)wake()}).observe(wrap);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});

/* ---------- size + start ---------- */
let kStart=4;
function resize(){
  const r=wrap.getBoundingClientRect();W=Math.round(r.width);H=Math.round(r.height);DPR=Math.min(devicePixelRatio||1,2);
  cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+'px';cv.style.height=H+'px';
  kMin=Math.max(W/360,H/144);kStart=Math.max(kMin*1.05,phone()?W/95:W/170);statKey='';for(const k in fitCache)delete fitCache[k];clampView();wake();
}
addEventListener('resize',resize);
async function load(){
  resize();
  const a=await fetch('data/land-110.json').then(r=>r.json());land.a=decode(a);landA=toPath(land.a);
  // opening move: a little further out, then glide in
  const w=worldView();Object.assign(V,{x:w.x-20,y:w.y,k:w.k*.62});clampView();flyTo(w,{ms:reduce?1:2200});
  if(!LOOK.flat)img(`data/looks/${LOOK.dir}/world-ocean.jpg`,i=>IMG.ocean=i);
  img(`data/looks/${LOOK.dir}/world-land-1k.jpg`,i=>{IMG.land1=i;img(`data/looks/${LOOK.dir}/world-land-3k.jpg`,j=>IMG.land3=j)});
  fetch('data/relief.json').then(r=>r.json()).then(j=>{RELIEF=j;statKey='';wake()});
  fetch('data/land-50.json').then(r=>r.json()).then(b=>{land.b=decode(b);landB=toPath(land.b);statKey='';wake()});
  fetch('data/land-detail.json').then(r=>r.json()).then(d=>{for(const id in d){land.detail[id]=decode(d[id]);detailPath[id]=toPath(land.detail[id])}statKey='';wake()});
}
load().catch(err=>{console.warn('Map failed to load',err);wrap.classList.add('failed')});
})();
