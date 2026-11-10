/* Unbucketlist: an illustrated, zoomable flat map.
   Coastlines come from Natural Earth (public domain); everything else (colours, relief, forests, dunes,
   clouds, lakes, journeys) is drawn here by hand-tuned rules, not satellite data. */
(function(){
const wrap=document.getElementById('mapWrap'),cv=document.getElementById('map');
if(!wrap||!cv)return;
const ctx=cv.getContext('2d');
const R=window.ROUTES||{},DEST=TRIPS.filter(t=>R[t.id]);
const wildTip=document.getElementById('wildTip'),card=document.getElementById('mapCard'),tip=document.getElementById('starTip'),heroCopy=document.getElementById('heroCopy');
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

/* ---------- the "designed" earth: regions, ranges, lakes ---------- */
// [lng, lat, rx, ry, colour, alpha]
const BIOME=[
 // deserts and dry lands
 ...[[5,23,22,8],[20,22,14,8],[-8,22,9,7],[28,25,7,6],[46,22,9,7],[57,31,6,4],[71,27,3.5,3],[83,39,7,2.5],[105,43,10,4],[21,-23,6,5],[15,-23,2,6],[128,-25,12,7],[140,-27,6,5],[-69.5,-23,1.5,5],[-113,33,6,4],[45,7,5,4]].map(b=>[...b,'#ead19a',.95]),
 ...[[-68,-45,4,6],[65,46,12,4],[50,40,6,3]].map(b=>[...b,'#dcd29f',.8]),
 // savanna and dry grass
 ...[[5,13,22,3],[35,-3,6,8],[26,-15,10,5],[132,-15,10,3],[-50,-13,8,6],[78,20,6,6],[-68,6,5,2.5],[-100,38,9,6]].map(b=>[...b,'#d2cc8c',.75]),
 // jungle
 ...[[-62,-5,14,8],[22,0,9,5],[-5,7,8,2.5],[102,12,7,8],[112,0,9,5],[125,6,5,6],[140,-5,8,4],[-86,13,6,4],[84,22,6,4],[110,25,8,4],[-45,-20,5,6],[76,11,2,4],[115,-8.4,1.5,.5]].map(b=>[...b,'#6f9d5d',.9]),
 // temperate and boreal forest
 ...[[-100,56,30,7],[100,60,40,6],[22,63,8,4],[-82,38,10,7],[125,45,8,6],[-123,48,4,6],[172,-42,3,4],[138,36,3,3]].map(b=>[...b,'#86a774',.85]),
 ...[[15,50,15,5],[5,46,6,3]].map(b=>[...b,'#a8bd86',.7]),
 // tundra, ice, high plateaus
 ...[[-100,68,40,5],[90,71,60,4]].map(b=>[...b,'#cfd4c2',.85]),
 ...[[-41,73,14,10],[0,-80,200,12],[-80,78,22,4],[-17.5,64.5,2.5,.6]].map(b=>[...b,'#f4f6f3',1]),
 ...[[86,33,10,3.5],[-68,-18,3,4],[39,9,4,4],[78,34,4,2.5]].map(b=>[...b,'#c9b38c',.85])
];
// mountain ranges as ridge lines [lng,lat]
const RANGES=[
 [[73,35.5],[75,34.5],[77,33.5],[79,31.5],[81,30],[84,28.5],[87,27.8],[89,28],[92,28],[95,28.5]],[[74,36.5],[76,35.8],[78,35.2],[79.5,34.6]],[[76.5,34.6],[78,34],[79.5,33]],[[69,35],[71,36],[73,36.3]],
 [[70,41.5],[75,42],[80,42.5],[85,43.5],[90,43.5]],[[78,36],[84,35.5],[90,36],[96,35.5]],[[86,50],[90,49],[95,47]],[[45,36],[48,34],[51,31],[55,28]],[[40,43.5],[45,42.5],[48,41.5]],
 [[6,44.5],[7,46],[9,46.5],[12,47],[15,47]],[[-1.5,43],[1,42.6],[3,42.4]],[[18,49],[22,49],[25,47.5],[25,45.5],[22,44.8]],[[6,59],[8,61],[12,63.5],[15,66],[18,68.5],[21,69.5]],
 [[-9,30.5],[-6,32],[-3,33.5],[1,34.5],[5,35.5],[9,35.5]],[[37,8],[38,10],[39,12.5]],[[36,-1],[37,-3],[35,-6],[34,-9]],[[27,-31],[29.5,-29],[31,-27]],[[59,50],[59.5,55],[59,60],[60,65],[65,68]],
 [[-150,61],[-140,61],[-130,58],[-124,54],[-117,50],[-113,46],[-110,43],[-107,39],[-106,35],[-105,32]],[[-123,48],[-121.5,44],[-120,39],[-118.5,36]],[[-106,28],[-103,23],[-99,19],[-97,17]],
 [[-84,34],[-81,37],[-78,40],[-75,42],[-71,44.5],[-68,46.5]],
 [[-73,10],[-76,4],[-78,-1],[-78,-6],[-75,-11],[-72,-14],[-69,-17],[-68,-22],[-69,-27],[-70,-32],[-70.5,-36],[-71.5,-41],[-72.5,-46],[-73.3,-50],[-72,-53]],
 [[145,-15],[147,-20],[150,-26],[151,-31],[149,-36],[146,-37.5]],[[167.5,-45.5],[169,-44],[170.5,-43.5],[172.5,-42]],[[137,36.5],[138.5,35.5],[140,38],[141,40]],
 [[135,-4],[140,-4.5],[145,-6],[147,-7]],[[-21,64.5],[-18,64.8],[-15,64.5]],[[-153,62],[-147,63],[-141,61]],[[-160,68],[-150,68.2],[-143,68.5]],[[49,36.5],[52,36],[55,37]],
 [[30,37.5],[35,37.5],[40,38.5]],[[19,42.5],[21,42],[24,42]],[[73.5,18],[74.5,14],[76,10],[77,8.5]],[[98,28],[100,26],[102,24]],[[158,53],[160,56],[162,58]],[[127,62],[130,66],[134,68]],
 [[13,68],[14.5,68.2],[15.5,68.4]]
];
const COASTAL=new Set(['maldives','santorini','lofoten','bali','newzealand','patagonia','iceland']); // places whose detailed coastline is drawn with its own shore
const SNOWY=new Set([0,1,2,9,12,22,25,26]);           // ranges with snowy peaks
// big lakes the coastline data doesn't carry: [lng,lat,rx,ry,rot]
const LAKES=[[33,-1,1.4,1.2,0],[29.5,-6,.3,3.2,-15],[34.6,-12,.3,2.6,0],[108,53,.4,3,30],[-87.5,47.6,2.5,.7,0],[-87,44,.6,2,0],[-82.3,44.8,1.2,1.2,0],[-81.2,42.2,1.8,.4,20],[-77.8,43.6,1.3,.4,0],
 [-69.4,-15.8,.55,.3,-30],[31.5,60.8,1,.7,0],[75,46.3,2.5,.3,10],[36.1,4.0,.15,1.0,0],[-123,62,2.5,1,0],[-112,62.5,2,1,0]];
const OCEANS=[['Pacific Ocean',-150,8],['Pacific Ocean',165,22],['Atlantic Ocean',-38,28],['Atlantic Ocean',-18,-22],['Indian Ocean',78,-22],['Arctic Ocean',20,79],['Southern Ocean',40,-58]];

/* ---------- glyphs (little drawn mountains, trees, dunes) ---------- */
let G1=[],G2=[];const GD={};               // world-level glyphs, finer ranges, destination glyphs
function genWorldGlyphs(rs){
  seed=11;G1=[];G2=[];
  RANGES.forEach((line,ri)=>{
    for(const [sp,size,arr,jit] of [[1.1,1.4,G1,.55],[.32,.42,G2,.35]]){
      for(let i=0;i<line.length-1;i++){const [x0,y0]=line[i],[x1,y1]=line[i+1],d=Math.hypot(x1-x0,y1-y0),n=Math.max(1,Math.round(d/sp));
        for(let j=0;j<n;j++){const t=(j+rnd())/n;let x=x0+(x1-x0)*t,y=-(y0+(y1-y0)*t);const nx=-(y1-y0)/d,ny=-(x1-x0)/d;const o=(rnd()-.5)*2*jit*(sp>1?1.6:2.4);
          x+=nx*o;y+=ny*o;if(!pip(rs,x,y))continue;arr.push({x,y,s:size*(.75+rnd()*.5),t:'m',snow:SNOWY.has(ri)&&rnd()<.75})}}}});
  // forests and dunes in their regions
  for(const b of BIOME){const [lx,la,rx,ry,col]=b;const kind=col==='#6f9d5d'?'j':col==='#86a774'?'f':col==='#ead19a'?'d':col==='#d2cc8c'?'a':null;if(!kind||rx>60)continue;
    const sp=kind==='d'?1.6:1.3;
    for(let gx=lx-rx;gx<=lx+rx;gx+=sp)for(let gy=la-ry;gy<=la+ry;gy+=sp){const x=gx+(rnd()-.5)*sp,yy=gy+(rnd()-.5)*sp;const e=((x-lx)/rx)**2+((yy-la)/ry)**2;if(e>.75||rnd()<.35)continue;
      if(!pip(rs,x,-yy))continue;G1.push({x,y:-yy,s:(kind==='d'?1.1:.9)*(.8+rnd()*.4),t:kind})}}
  G1.sort((a,b)=>a.y-b.y);G2.sort((a,b)=>a.y-b.y);
}
function routeBox(r){const xs=r.stops.map(s=>s[2]),ys=r.stops.map(s=>-s[1]);let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const span=Math.max(x1-x0,y1-y0,.08);return {x0,x1,y0,y1,cx:(x0+x1)/2,cy:(y0+y1)/2,span}}
function inLake(r,x,y){return (r.lakes||[]).some(([la,lo,rx,ry])=>((x-lo)/rx)**2+((y+la)/ry)**2<1.3)}
function genDestGlyphs(id){
  const r=R[id],b=routeBox(r),rs=land.detail[id]&&land.detail[id].length?land.detail[id]:land.b||land.a;
  const L=r.look||{},span=b.span,pad=span*.9,sp=span/20,size=span/24;seed=id.length*97+3;const out=[];
  const near=(kind,x,y)=>(r.patches||[]).some(p=>p[0]===kind&&Math.hypot(x-p[2],y+p[1])<p[3]);
  for(let gx=b.x0-pad;gx<=b.x1+pad;gx+=sp)for(let gy=b.y0-pad;gy<=b.y1+pad;gy+=sp){
    const x=gx+(rnd()-.5)*sp*.9,y=gy+(rnd()-.5)*sp*.9;
    if(!pip(rs,x,y)||inLake(r,x,y))continue;
    // keep the route itself readable: thin out glyphs right on top of stops
    if(r.stops.some(s=>Math.hypot(x-s[2],y+s[1])<sp*.9))continue;
    const n=(Math.sin(x*9.1/span)+Math.sin(y*7.3/span+1.7)+Math.sin((x+y)*5.2/span))/3*.5+.5; // smooth 0..1 field
    let t=null;const v=rnd();
    if(near('dune',x,y)&&v<.8)t='d';
    else if(near('snow',x,y)&&v<.85)t='m+';
    else if(near('volcano',x,y))t='v';
    else if(near('crater',x,y))t='c';
    else if(n>.6&&v<(L.mtn||0)*.75)t=(L.snow&&rnd()<L.snow*(n-.3))?'m+':'m';
    else if(v<(L.rice||0)*.6)t='r';
    else if(v<(L.tree||0))t=L.acacia?'a':'j';
    else if(v<(L.acacia||0)*.5)t='a';
    else if(v<(L.dune||0))t='d';
    else if(v<(L.rock||0)*.12)t='m';
    if(!t)continue;
    out.push({x,y,s:size*(t==='m'||t==='m+'?(.8+n*.7):.75)*(.8+rnd()*.4),t:t==='m+'?'m':t,snow:t==='m+'})}
  out.sort((a,c)=>a.y-c.y);GD[id]=out;
}
const PAL={m:['#c6ab84','#8f7458','#a88d6b'],j:['#557f47','#6f9a5c'],f:['#4f7a4f','#6c9468'],d:['#e3c487','#c9a167'],a:['#7d8f4f','#9a8a5c'],r:['#7fae5e'],v:['#9a8169','#6b5646'],c:['#8c7a62']};
function glyph(t,x,y,s,snow,a){
  ctx.globalAlpha=a;
  if(t==='m'||t==='v'){const c=PAL[t];const w=s*.62,h=s*(t==='v'?.7:.9);
    ctx.fillStyle='rgba(60,45,30,.16)';ctx.beginPath();ctx.ellipse(x+s*.05,y+1,w*1.05,s*.1,0,0,7);ctx.fill();
    ctx.fillStyle=c[0];ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(x-s*.04,y-h);ctx.lineTo(x+s*.1,y);ctx.closePath();ctx.fill();
    ctx.fillStyle=c[1];ctx.beginPath();ctx.moveTo(x-s*.04,y-h);ctx.lineTo(x+w,y);ctx.lineTo(x+s*.1,y);ctx.closePath();ctx.fill();
    if(t==='v'){ctx.fillStyle='#5b4a3c';ctx.beginPath();ctx.ellipse(x-s*.04,y-h,s*.12,s*.04,0,0,7);ctx.fill()}
    if(snow&&s>7){ctx.fillStyle='#fbfaf6';ctx.beginPath();ctx.moveTo(x-s*.04,y-h);ctx.lineTo(x-w*.38,y-h*.62);ctx.lineTo(x-s*.12,y-h*.68);ctx.lineTo(x+s*.02,y-h*.6);ctx.lineTo(x+w*.36,y-h*.62);ctx.closePath();ctx.fill()}
  }else if(t==='j'||t==='f'){const c=PAL[t];
    if(t==='f'&&s>8){ctx.fillStyle=c[0];ctx.beginPath();ctx.moveTo(x,y-s*.75);ctx.lineTo(x+s*.26,y);ctx.lineTo(x-s*.26,y);ctx.closePath();ctx.fill()}
    else{ctx.fillStyle=c[0];ctx.beginPath();ctx.arc(x,y-s*.3,s*.32,0,7);ctx.arc(x+s*.25,y-s*.18,s*.24,0,7);ctx.arc(x-s*.24,y-s*.15,s*.22,0,7);ctx.fill();
      ctx.fillStyle=c[1];ctx.beginPath();ctx.arc(x-s*.06,y-s*.38,s*.14,0,7);ctx.fill()}
  }else if(t==='d'){ctx.strokeStyle=PAL.d[1];ctx.lineWidth=Math.max(1,s*.07);ctx.beginPath();ctx.ellipse(x,y,s*.5,s*.22,0,Math.PI*1.08,Math.PI*1.92);ctx.stroke();
    ctx.fillStyle='rgba(255,240,205,.5)';ctx.beginPath();ctx.ellipse(x,y+s*.03,s*.42,s*.12,0,Math.PI,0);ctx.fill();
  }else if(t==='a'){ctx.strokeStyle='#7a6248';ctx.lineWidth=Math.max(1,s*.06);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-s*.4);ctx.stroke();
    ctx.fillStyle=PAL.a[0];ctx.beginPath();ctx.ellipse(x,y-s*.45,s*.4,s*.12,0,0,7);ctx.fill();
  }else if(t==='r'){ctx.strokeStyle=PAL.r[0];ctx.lineWidth=Math.max(1,s*.08);for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x,y+i*s*.18,s*.4,Math.PI*1.15,Math.PI*1.85);ctx.stroke()}
  }else if(t==='c'){ctx.strokeStyle=PAL.c[0];ctx.lineWidth=Math.max(1.5,s*.12);ctx.beginPath();ctx.ellipse(x,y,s*.6,s*.4,0,0,7);ctx.stroke()}
  ctx.globalAlpha=1;
}
function drawGlyphs(list,lo,hi,mul=1){
  const pad=60;
  for(const g of list){const s=g.s*V.k;if(s<lo*.6||s>hi*1.6)continue;const x=sx(g.x),y=sy(g.y);if(x<-pad||x>W+pad||y<-pad||y>H+pad)continue;
    const a=Math.min(ramp(s,lo*.6,lo),1-ramp(s,hi,hi*1.6))*mul;if(a<=.02)continue;glyph(g.t,x,y,s,g.snow,a)}
}

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
const fitCache={};
function fitK(id){const key=id+W+'x'+H;if(fitCache[key])return fitCache[key];const b=routeBox(R[id]);
  const usableH=H*(W<760?.3:.7),usableW=W*(W<760?.62:.56);return fitCache[key]=Math.min(kMax,usableW/(b.x1-b.x0+b.span*.45),usableH/(b.y1-b.y0+b.span*.45))}
function fitView(id){const b=routeBox(R[id]),k=fitK(id);
  // leave room for the card: below on phones, on the left on desktop
  return {x:b.cx-(W<760?W*.06/k:W*.16/k),y:b.cy+(W<760?H*.21/k:0),k}}
function clampView(){V.k=cl(V.k,kMin,kMax);const hw=W/2/V.k,hh=H/2/V.k;
  V.x=360<2*hw?0:cl(V.x,-180+hw,180-hw);V.y=144<2*hh?-11:cl(V.y,-84+hh,60-hh)}

/* ---------- render ---------- */
const IMG={ocean:null,land1:null,land3:null,crop:{}};let RELIEF={};
/* Colour looks: each is a full set of relief images in data/looks/<id>/ plus light, haze and vignette colours */
const LOOKS={
 natural:{name:'Natural',note:'Calm, true-to-life colours',sw:['#6f9a5c','#dcc796','#5f9fbd'],sun:'255,214,160',haze:'214,232,242',vig:'16,34,52',sea:['#7fb9cc','#5f9fbd']},
 golden:{name:'Golden hour',note:'Emerald, honey and turquoise, in warm light',sw:['#3f9a5b','#f3cf86','#33b6c9'],sun:'255,184,110',haze:'255,226,200',vig:'70,30,70',sea:['#5ac7cf','#2584b4']},
 pastel:{name:'Dreamy pastel',note:'Mint, peach, rose and soft aqua',sw:['#94d0a2','#f6d6ae','#9bdbe8'],sun:'255,206,226',haze:'248,234,248',vig:'110,96,160',sea:['#b4ebec','#86c1e6']},
 vivid:{name:'Vivid explorer',note:'Jade, saffron and ultramarine, full of energy',sw:['#119a64','#f4c25f','#10b5d3'],sun:'255,214,140',haze:'205,238,255',vig:'10,30,90',sea:['#36dcd6','#0f78c4']}};
let look=(()=>{const q=new URLSearchParams(location.search).get('look');if(LOOKS[q])return q;try{const v=localStorage.getItem('ubl-look');if(LOOKS[v])return v}catch(e){}return 'golden'})();
function setLook(id){if(!LOOKS[id]||id===look)return;look=id;try{localStorage.setItem('ubl-look',id)}catch(e){}
  // load the new set, then swap in one go so there is no flash
  let n=0;const next={crop:{}},done=()=>{if(++n<3)return;IMG.ocean=next.ocean;IMG.land1=next.land1;IMG.land3=next.land3;IMG.crop={};statKey='';wake()};
  img(`data/looks/${id}/world-ocean.jpg`,i=>{next.ocean=i;done()});img(`data/looks/${id}/world-land-1k.jpg`,i=>{next.land1=i;done()});img(`data/looks/${id}/world-land-3k.jpg`,i=>{next.land3=i;done()});
  renderLookMenu()}
function img(src,cb){const i=new Image();i.decoding='async';i.onload=()=>{cb(i);statKey='';wake()};i.src=src;return i}
function loadCrop(id){IMG.crop[id]='loading';const lk=look;img(`data/looks/${lk}/relief-${id}.webp`,i=>{if(lk===look)IMG.crop[id]=i;else delete IMG.crop[id]})}
const omask=document.createElement('canvas'),mctx=omask.getContext('2d');    // where the sea is (for the shimmer)
const shim=document.createElement('canvas'),hctx=shim.getContext('2d');
const dof=document.createElement('canvas'),dctx=dof.getContext('2d');let dofOn=false; // miniature depth of field
let tNow=0;const stat=document.createElement('canvas'),sctx=stat.getContext('2d');let statKey='';
let landA=null,landB=null;const detailPath={};
const prog={};let hits=[],starHits=[];
function activeDetail(){ // the destination whose detailed coastline should be added for this view
  if(V.k<25)return null;for(const d of DEST){const dd=land.detail[d.id];if(!dd||!dd.length)continue;const b=routeBox(R[d.id]),m=2.2;
    if(V.x>b.x0-m&&V.x<b.x1+m&&V.y>b.y0-m&&V.y<b.y1+m)return d.id}return null}
function drawStatic(){
  const c=sctx;stat.width=W*DPR;stat.height=H*DPR;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const T=[V.k*DPR,0,0,V.k*DPR,(W/2-V.x*V.k)*DPR,(H/2-V.y*V.k)*DPR];
  const vx0=wx(0),vx1=wx(W),vy0=wy(0),vy1=wy(H);
  // sea: depth-shaded (turquoise shelves, deep blue ocean)
  c.setTransform(DPR,0,0,DPR,0,0);
  const og=c.createLinearGradient(0,0,0,H);og.addColorStop(0,LOOKS[look].sea[0]);og.addColorStop(1,LOOKS[look].sea[1]);c.fillStyle=og;c.fillRect(0,0,W,H);
  c.setTransform(...T);
  if(IMG.ocean)c.drawImage(IMG.ocean,-180,-90,360,180);
  const did=activeDetail();
  const base=V.k<10||!landB?landA:landB;if(!base)return;const extra=did?detailPath[did]:null,coastal=extra&&COASTAL.has(did);
  const path=base;c.lineJoin='round';
  for(const p of coastal?[path,extra]:[path]){c.strokeStyle='rgba(225,246,240,.35)';c.lineWidth=6/V.k;c.stroke(p)}
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
  for(const [lo,la,rx,ry,rot,lc] of lakes){if(lo+rx<vx0||lo-rx>vx1||-la+ry<vy0||-la-ry>vy1)continue;if(rx*V.k<1.5)continue;
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
  dofOn=near>.05&&!ptrs.size&&!anim&&!reduce;
  if(dofOn){dof.width=W*DPR;dof.height=H*DPR;dctx.setTransform(1,0,0,1,0,0);dctx.filter=`blur(${(W<760?2.2:3)*DPR}px)`;dctx.drawImage(stat,0,0);dctx.filter='none';
    dctx.globalCompositeOperation='destination-in';const gm=dctx.createLinearGradient(0,0,0,H*DPR);
    gm.addColorStop(0,`rgba(0,0,0,${near})`);gm.addColorStop(.26,'rgba(0,0,0,0)');gm.addColorStop(.74,'rgba(0,0,0,0)');gm.addColorStop(1,`rgba(0,0,0,${near})`);
    dctx.fillStyle=gm;dctx.fillRect(0,0,W*DPR,H*DPR);dctx.globalCompositeOperation='source-over'}
  // ocean names
  c.setTransform(DPR,0,0,DPR,0,0);
  if(V.k<16){c.font='italic 300 15px Fraunces, Georgia, serif';c.fillStyle='rgba(38,82,96,.5)';c.textAlign='center';
    for(const [n,lo,la] of OCEANS){const x=sx(lo),y=sy(-la);if(x>-100&&x<W+100&&y>-20&&y<H+20)c.fillText(n.split('').join(' '),x,y)}}
}
let rockG,snowG,duneG;
function grad(c,col,a){const g=c.createRadialGradient(0,0,0,0,0,1);const rgb=col.match(/\w\w/g).map(h=>parseInt(h,16)).join(',');
  g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(.55,`rgba(${rgb},${a*.85})`);g.addColorStop(1,`rgba(${rgb},0)`);return g}
function drawAtolls(c){for(const [la,lo,rx,ry] of R.maldives.atolls){c.save();c.translate(lo,-la);c.strokeStyle='rgba(170,232,222,.9)';c.lineWidth=Math.max(rx,ry)*.22;c.beginPath();c.ellipse(0,0,rx,ry,0,0,7);c.stroke();
  c.fillStyle='rgba(176,226,222,.55)';c.fill();c.restore()}}
let wavePat=null;const waveTile=(()=>{const c=document.createElement('canvas');c.width=c.height=96;const g=c.getContext('2d');g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1.2;g.lineCap='round';
  for(const [x,y] of [[14,20],[60,42],[30,74],[78,82]]){g.beginPath();g.arc(x,y,7,Math.PI*1.15,Math.PI*1.85);g.arc(x+12,y,7,Math.PI*1.15,Math.PI*1.85);g.stroke()}return c})();

function render(){
  const key=[V.x.toFixed(5),V.y.toFixed(5),V.k.toFixed(4),W,H,landB?1:0,Object.keys(land.detail).length,ptrs.size?1:0,anim?1:0].join('|');
  if(key!==statKey){drawStatic();statKey=key}
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(stat,0,0);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  // relief

  for(const d of DEST){const b=routeBox(R[d.id]),m=b.span*1.4;if(V.x<b.x0-m-W/V.k||V.x>b.x1+m+W/V.k||V.y<b.y0-m-H/V.k||V.y>b.y1+m+H/V.k)continue;
  }
  if(dofOn)ctx.drawImage(dof,0,0,W,H);
  // sun shimmer drifting across the water (masked to the sea)
  if(!reduce){hctx.setTransform(1,0,0,1,0,0);shim.width=Math.ceil(W/2);shim.height=Math.ceil(H/2);
    const gx=shim.width*(.5+.35*Math.cos(tNow*.00007)),gy=shim.height*(.35+.2*Math.sin(tNow*.00005));
    const gl=hctx.createRadialGradient(gx,gy,0,gx,gy,shim.width*.55);gl.addColorStop(0,'rgba(255,248,228,.55)');gl.addColorStop(1,'rgba(255,248,228,0)');
    hctx.fillStyle=gl;hctx.fillRect(0,0,shim.width,shim.height);hctx.globalCompositeOperation='destination-out';hctx.drawImage(omask,0,0,shim.width,shim.height);hctx.globalCompositeOperation='source-over';
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=.22;ctx.drawImage(shim,0,0,W,H);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
  // clouds: soft shadows on the land first, then the clouds; high wisps drift with more parallax
  const vis=[];
  for(const c of CLOUDS){const a=cloudAlpha(c);if(a<.02)continue;const s=c.s*V.k*(c.p>1?1.08:1);if(s<36||s>W*3)continue;
    const x=W/2+(c.x+(reduce?0:tNow*c.v*.001)-V.x)*V.k*c.p,y=H/2+(c.y-V.y)*V.k*c.p;if(x<-s||x>W+s||y<-s||y>H+s)continue;vis.push([c,a,s,x,y])}
  for(const [c,a,s,x,y] of vis){const o=s*(c.wisp?.16:.1);ctx.globalAlpha=a*(c.wisp?.12:.2);ctx.drawImage(SPR[c.i].shadow,x-s/2+o*.6,y-s/2+o,s,s)}
  for(const [c,a,s,x,y] of vis){ctx.globalAlpha=a;ctx.drawImage(SPR[c.i],x-s/2,y-s/2,s,s)}
  ctx.globalAlpha=1;
  // atmosphere: warm light from the top-left, a soft haze and vignette at the edges
  ctx.globalCompositeOperation='soft-light';
  const sun=ctx.createRadialGradient(W*.12,-H*.15,0,W*.12,-H*.15,Math.max(W,H)*1.1);const L=LOOKS[look];sun.addColorStop(0,`rgba(${L.sun},.55)`);sun.addColorStop(1,`rgba(${L.sun},0)`);ctx.fillStyle=sun;ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='source-over';
  const hz=ctx.createLinearGradient(0,0,0,H);hz.addColorStop(0,`rgba(${L.haze},.3)`);hz.addColorStop(.22,`rgba(${L.haze},0)`);hz.addColorStop(.85,`rgba(${L.haze},0)`);hz.addColorStop(1,`rgba(${L.haze},.2)`);
  ctx.fillStyle=hz;ctx.fillRect(0,0,W,H);
  const vg0=ctx.createRadialGradient(W/2,H*.55,Math.min(W,H)*.45,W/2,H*.55,Math.max(W,H)*.85);vg0.addColorStop(0,`rgba(${L.vig},0)`);vg0.addColorStop(1,`rgba(${L.vig},.22)`);ctx.fillStyle=vg0;ctx.fillRect(0,0,W,H);
  // dusk, so the journey's stars can shine
  let dusk=0;for(const d of DEST)dusk=Math.max(dusk,starAlpha(d.id)*onScreen(d.id));
  if(dusk>0){ctx.fillStyle=`rgba(18,28,58,${.14*dusk})`;ctx.fillRect(0,0,W,H);
    const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(10,16,40,0)');vg.addColorStop(1,`rgba(10,16,40,${.38*dusk})`);ctx.fillStyle=vg;ctx.fillRect(0,0,W,H)}
  // journeys (constellations) and place markers
  starHits=[];hits=[];placed=[];wildHits=[];reserveUI();
  const flags=wildFlags();for(const f of flags)placed.push([f.x-4,f.y-48,44,50]);
  for(const d of DEST)drawJourney(d);
  drawFlags(flags);
  for(const d of DEST)drawMarker(d);
}
let placed=[];
/* Wildlife: little flags at real spots near each journey; tap one to meet the animal */
const WILD=window.WILDLIFE||{};let wildHits=[];
function wildFlags(){const out=[];for(const d of DEST){const list=WILD[d.id];if(!list)continue;const a=ramp(V.k/fitK(d.id),.25,.45)*onScreen(d.id);if(a<=.02)continue;
  list.forEach((w,i)=>{const x=sx(w[3]),y=sy(-w[2]);if(x<-40||x>W+40||y<-10||y>H+60)return;out.push({x,y,a,w,id:d.id,i})})}return out}
function drawFlags(flags){
  for(const f of flags){const {x,y,a,w}=f,sway=reduce?0:Math.sin(tNow*.003+f.i*1.3)*2;
    ctx.globalAlpha=a;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x,y,5,2,0,0,7);ctx.fill();               // ground shadow
    ctx.strokeStyle='#3a2f2a';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-40);ctx.stroke(); // pole
    ctx.fillStyle='#fffaf2';ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;
    ctx.beginPath();ctx.moveTo(x,y-40);ctx.lineTo(x+34,y-37+sway);ctx.lineTo(x+30,y-28+sway*.6);ctx.lineTo(x+34,y-19+sway);ctx.lineTo(x,y-22);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.fillStyle='#ff6a45';ctx.fillRect(x,y-40,3,18);                                                        // a bit of brand colour at the hoist
    ctx.font='15px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(w[0],x+16,y-30+sway*.5);
    ctx.globalAlpha=1;wildHits.push({x:x+16,y:y-30,f})}
}
const btns=document.querySelector('.map-btns');
function reserveUI(){ // screen areas labels must not use: the site header, the zoom buttons, the place card
  placed.push([0,0,W,W<760?74:72]);
  const wr=wrap.getBoundingClientRect();
  for(const el of [btns,card]){if(!el||(el===card&&!card.classList.contains('on')))continue;const r=el.getBoundingClientRect();placed.push([r.left-wr.left-6,r.top-wr.top-6,r.width+12,r.height+12])}
}
const KIND={arrive:'#3ccf86',depart:'#3ccf86',stop:'#ff6a45',side:'#f6b84b'};
const KIND_RGB={arrive:'60,207,134',depart:'60,207,134',stop:'255,106,69',side:'246,184,75'};
function fit(text,max){if(ctx.measureText(text).width<=max)return text;while(text.length>3&&ctx.measureText(text+'…').width>max)text=text.slice(0,-1);return text.trim()+'…'}
// place a two-line label (name + day line) next to a dot without colliding with others; tries right, left, below, above
function placeLabel(name,sub,x,y){
  const maxW=W<760?160:230;
  ctx.font='600 13px Inter, system-ui, sans-serif';const n=fit(name,maxW),w1=ctx.measureText(n).width;
  ctx.font='400 11px Inter, system-ui, sans-serif';const s=sub?fit(sub,maxW):'',w2=s?ctx.measureText(s).width:0;
  const w=Math.max(w1,w2),h=s?30:16;
  for(const [dx,dy,al] of [[13,0,'left'],[-13,0,'right'],[0,24,'center'],[0,-24,'center']]){
    const lx=al==='left'?x+dx:al==='right'?x+dx-w:x-w/2,ly=y+dy-h/2;
    if(lx<4||lx+w>W-4||ly<4||ly+h>H-4)continue;
    if(placed.some(r=>lx<r[0]+r[2]&&lx+w>r[0]&&ly<r[1]+r[3]&&ly+h>r[1]))continue;
    placed.push([lx-4,ly-3,w+8,h+6]);return {x:x+dx,y:y+dy,al,n,s}}
  return sub?placeLabel(name,'',x,y):null}
function starAlpha(id){return ramp(V.k/fitK(id),.32,.62)}
function onScreen(id){const b=routeBox(R[id]);return (sx(b.cx)>-W*.2&&sx(b.cx)<W*1.2&&sy(b.cy)>-H*.2&&sy(b.cy)<H*1.2)?1:0}
function kindOf(r,i){const k=r.stops[i][5]||'stop';return k}
function drawJourney(d){
  const r=R[d.id],a=starAlpha(d.id);if(a<=0||!onScreen(d.id)){prog[d.id]=0;return}
  const pts=r.stops.map(s=>[sx(s[2]),sy(-s[1])]);if(r.loop)pts.push(pts[0]);
  const n=pts.length-1;prog[d.id]=reduce?n:Math.min(n,(prog[d.id]||0)+(a>.5?.04:0));const P=prog[d.id];
  // the route: a dashed line in travel order, drawn stop by stop, gently moving
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<=n;i++){const f=cl(P-(i-1));if(f<=0)break;const [x0,y0]=pts[i-1],[x1,y1]=pts[i];
    // a slight curve between stops reads as a journey rather than a ruler line
    const mx=(x0+x1)/2-(y1-y0)*.12,my=(y0+y1)/2+(x1-x0)*.12;
    if(f>=1)ctx.quadraticCurveTo(mx,my,x1,y1);else{const qx=x0+(mx-x0)*f,qy=y0+(my-y0)*f,rx=mx+(x1-mx)*f,ry=my+(y1-my)*f;ctx.quadraticCurveTo(qx,qy,qx+(rx-qx)*f,qy+(ry-qy)*f)}}
  ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=4;
  ctx.strokeStyle=`rgba(255,106,69,${.95*a})`;ctx.lineWidth=2.2;ctx.setLineDash([7,6]);ctx.lineDashOffset=reduce?0:-tNow*.012;ctx.stroke();
  ctx.restore();
  // stops: reserve every visible dot first, so labels are placed around them
  r.stops.forEach((s,i)=>{if(i>Math.ceil(P)&&i!==0)return;const [x,y]=pts[i];placed.push([x-9,y-9,18,18])});
  r.stops.forEach((s,i)=>{if(i>Math.ceil(P)&&i!==0)return;const [x,y]=pts[i],k=kindOf(r,i),rgb=KIND_RGB[k];
    const tw=reduce?1:.75+.25*Math.sin(tNow*.003+i*1.7),big=k==='arrive'||k==='depart';
    const halo=big?20:15,g=ctx.createRadialGradient(x,y,0,x,y,halo);g.addColorStop(0,`rgba(${rgb},${.55*a*tw})`);g.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,halo,0,7);ctx.fill();
    ctx.fillStyle=`rgba(${rgb},${a})`;ctx.beginPath();ctx.arc(x,y,big?6.5:5,0,7);ctx.fill();
    ctx.strokeStyle=`rgba(255,255,255,${.95*a})`;ctx.lineWidth=2;ctx.stroke();
    if(big){ctx.strokeStyle=`rgba(${rgb},${.6*a})`;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,y,11,0,7);ctx.stroke()}
    const sub=`${s[3]} · ${s[4]||''}`,pl=placeLabel(s[0],sub,x,y);
    if(pl){ctx.textAlign=pl.al;ctx.textBaseline='middle';ctx.shadowColor='rgba(0,0,0,.65)';ctx.shadowBlur=6;
      ctx.lineJoin='round';ctx.strokeStyle=`rgba(20,22,30,${.55*a})`;
      ctx.font='600 13px Inter, system-ui, sans-serif';ctx.lineWidth=3.5;ctx.strokeText(pl.n,pl.x,pl.s?pl.y-7:pl.y);ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.fillText(pl.n,pl.x,pl.s?pl.y-7:pl.y);
      if(pl.s){ctx.font='500 11px Inter, system-ui, sans-serif';ctx.lineWidth=3;ctx.strokeText(pl.s,pl.x,pl.y+8);ctx.fillStyle=`rgba(255,244,232,${.92*a})`;ctx.fillText(pl.s,pl.x,pl.y+8)}ctx.shadowBlur=0}
    starHits.push({x,y,id:d.id,i})});
}
function drawMarker(d){
  const a=1-starAlpha(d.id);if(a<=.02)return;const x=sx(d.lng),y=sy(-d.lat);if(x<-60||x>W+60||y<-30||y>H+30)return;
  const ph=reduce?0:(tNow*.0012+d.m*.37)%1;
  ctx.globalAlpha=a;ctx.strokeStyle=`rgba(255,90,60,${.6*(1-ph)})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,6+ph*14,0,7);ctx.stroke();
  ctx.fillStyle='#ff5a3c';ctx.beginPath();ctx.arc(x,y,5.5,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
  ctx.font='600 13px Inter, system-ui, sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.lineWidth=3.5;ctx.strokeStyle='rgba(30,40,40,.55)';ctx.strokeText(d.name,x+11,y);ctx.fillStyle='#fff';ctx.fillText(d.name,x+11,y);
  ctx.globalAlpha=1;hits.push({x,y,id:d.id});
}

/* ---------- focus: get into one place, and out again ---------- */
let focus=null;
function updateFocus(){
  let best=null,bd=1e9;
  for(const d of DEST){const q=V.k/fitK(d.id);if(q<.3)continue;const b=routeBox(R[d.id]);const dx=(V.x-b.cx)*V.k,dy=(V.y-b.cy)*V.k,dist=Math.hypot(dx,dy);
    if(dist<Math.max(W,H)*.6&&dist<bd){bd=dist;best=d.id}}
  if(best!==focus){focus=best;movedInFocus=false;showCard(best)}
  if(anim&&anim.place)openK=V.k; // while flying to a place, the card stays open
  if(focus&&!cardMini&&!(anim&&anim.place)&&(V.k/openK>1.12||movedInFocus))setMini(true);
  if(heroCopy)heroCopy.classList.toggle('away',!!focus||interacted&&V.k>kStart*1.8);
}
function showWild(f,x,y){const w=f.w;tip.hidden=true;
  wildTip.innerHTML=`<button type="button" class="wt-x" aria-label="Close">✕</button><div class="wt-e" aria-hidden="true">${w[0]}</div><p class="wt-k">Wild things near ${TRIPS.find(t=>t.id===f.id).name}</p><h4>${w[1]}</h4><p class="wt-w">${w[4]} · best ${w[6]}</p><p>${w[5]}</p>`;
  wildTip.hidden=false;const r=wildTip.getBoundingClientRect();
  wildTip.style.left=Math.max(12,Math.min(W-r.width-12,x-r.width/2))+'px';wildTip.style.top=Math.max(80,Math.min(H-r.height-12,y-r.height-18))+'px'}
wildTip.addEventListener('click',e=>{if(e.target.closest('.wt-x'))wildTip.hidden=true});
function showCard(id){
  tip.hidden=true;wrap.classList.toggle('carded',!!id);
  if(!id){card.classList.remove('on');setMini(false,true);return}
  const t=TRIPS.find(x=>x.id===id),r=R[id],offers=(window.OFFERS||{})[id]||[];
  const route=r.stops.map(s=>s[0]).join(' · ')+(r.loop?' · back to '+r.stops[0][0]:'');
  card.innerHTML=`<div class="mc-full"><div class="mc-inner"><button class="mc-min" type="button" data-minimise aria-label="Minimise">⌄</button>
   <p class="mc-eye">Best in ${MONTH_FULL[t.m]} · ${t.place}</p><h3>${t.name}</h3>
   <p class="mc-route">${route}</p><p class="mc-meta">${t.days} days · from ${money(t.price)} · ${offers.length} way${offers.length===1?'':'s'} to go</p>
   ${(WILD[id]||[]).length?`<p class="mc-wild">${WILD[id].slice(0,5).map(w=>w[0]).join(' ')} <span>${WILD[id].length} wild things to spot. Look for the flags.</span></p>`:''}
   <p class="legend"><i class="k-arrive"></i>Arrive &amp; depart<i class="k-stop"></i>Stops<i class="k-side"></i>Side trips</p>
   <div class="mc-row"><button class="btn" type="button" data-unbucket="${id}">Unbucket this for me</button><button class="btn ghost3" type="button" data-explore="${id}">Explore ${t.name}</button></div>
   <button class="mc-back" type="button" data-world>← Back to the world</button></div></div>
   <div class="mc-bar"><button class="mc-expand" type="button" data-expand aria-label="Show details for ${t.name}"><b>${t.name}</b><span>${t.days} days · from ${money(t.price)}</span><i aria-hidden="true">⌃</i></button>
    <button class="btn" type="button" data-unbucket="${id}">Unbucket</button></div>`;
  setMini(false,true);card.classList.add('on');
}
card.addEventListener('click',e=>{
  const u=e.target.closest('[data-unbucket]');if(u)return openTrip(u.dataset.unbucket,{book:true});
  const x=e.target.closest('[data-explore]');if(x)return openTrip(x.dataset.explore);
  if(e.target.closest('[data-world]'))return flyTo(worldView());
  if(e.target.closest('[data-expand]'))return setMini(false);
  if(e.target.closest('[data-minimise]'))return setMini(true);
});
// the card minimises once you zoom in or move around a place, and stays slim until you tap it
let cardMini=false,movedInFocus=false,openK=1;
function setMini(m,force){if(m===cardMini&&!force)return;cardMini=m;card.classList.toggle('mini',m);wrap.classList.toggle('mini',m);if(!m){movedInFocus=false;openK=V.k}
  const f=card.querySelector('.mc-full'),b=card.querySelector('.mc-bar');if(f)f.inert=m;if(b)b.inert=!m} // only the visible half can be clicked or tabbed to

/* ---------- smooth flights (van Wijk & Nuij zoom-pan) ---------- */
let anim=null;
function flyTo(to,ms,place){
  const p0=[V.x,V.y,W/V.k],p1=[to.x,to.y,W/to.k],rho=1.35,r2=rho*rho;
  const dx=p1[0]-p0[0],dy=p1[1]-p0[1],d2=dx*dx+dy*dy,d1=Math.sqrt(d2);let S,f;
  if(d2<1e-12){S=Math.log(p1[2]/p0[2])/rho;f=t=>[p0[0],p0[1],p0[2]*Math.exp(rho*t*S)]}
  else{const b0=(p1[2]*p1[2]-p0[2]*p0[2]+r2*r2*d2)/(2*p0[2]*r2*d1),b1=(p1[2]*p1[2]-p0[2]*p0[2]-r2*r2*d2)/(2*p1[2]*r2*d1);
    const r0=Math.log(Math.sqrt(b0*b0+1)-b0),r1=Math.log(Math.sqrt(b1*b1+1)-b1);S=(r1-r0)/rho;
    const cosh=x=>(Math.exp(x)+Math.exp(-x))/2,sinh=x=>(Math.exp(x)-Math.exp(-x))/2,tanh=x=>sinh(x)/cosh(x);
    f=t=>{const s=t*S,c0=cosh(r0),u=p0[2]/(r2*d1)*(c0*tanh(rho*s+r0)-sinh(r0));return [p0[0]+u*dx,p0[1]+u*dy,p0[2]*c0/cosh(rho*s+r0)]}}
  const dur=reduce?1:(ms||cl(Math.abs(S)*700,900,3200));const t0=performance.now();
  anim={place,step(now){const t=cl((now-t0)/dur),e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;const [x,y,w]=f(e);V.x=x;V.y=y;V.k=W/w;if(t>=1)anim=null}};
  wake();
}
function worldView(){return {x:W<760?80:42,y:W<760?-36:-20,k:kStart}}
window.mapFlyTo=id=>{if(R[id])flyTo(fitView(id),0,true)};
window.mapScreenPos=id=>{const d=TRIPS.find(t=>t.id===id);return d?{x:sx(d.lng),y:sy(-d.lat)}:null}; // where a place's dot is on screen

/* ---------- gestures: drag to move, pinch / buttons / double-tap / ctrl+scroll to zoom ---------- */
const ptrs=new Map();let drag=null,vel={x:0,y:0},lastMove=0,tapStart=null;
function zoomAt(f,px,py){const x=wx(px),y=wy(py);V.k=cl(V.k*f,kMin,kMax);V.x=x-(px-W/2)/V.k;V.y=y-(py-H/2)/V.k;clampView()}
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});anim=null;interacted=true;
  if(ptrs.size===1){drag={x:e.clientX,y:e.clientY};vel={x:0,y:0};tapStart={x:e.clientX,y:e.clientY,t:performance.now()}}else tapStart=null;wake()});
cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;const prev=ptrs.get(e.pointerId);const cur={x:e.clientX,y:e.clientY};
  if(focus&&Math.hypot(cur.x-(tapStart?tapStart.x:cur.x),cur.y-(tapStart?tapStart.y:cur.y))>10)movedInFocus=true;
  if(ptrs.size===2&&focus)movedInFocus=true;
  if(ptrs.size===1&&drag){const dx=cur.x-prev.x,dy=cur.y-prev.y;V.x-=dx/V.k;V.y-=dy/V.k;clampView();const now=performance.now(),dt=Math.max(8,now-lastMove);vel={x:dx/dt,y:dy/dt};lastMove=now}
  else if(ptrs.size===2){const [a,b]=[...ptrs.values()];const other=a===prev?b:a;const d0=Math.hypot(prev.x-other.x,prev.y-other.y),d1=Math.hypot(cur.x-other.x,cur.y-other.y);
    const r=cv.getBoundingClientRect(),mx=(cur.x+other.x)/2-r.left,my=(cur.y+other.y)/2-r.top;if(d0>0)zoomAt(d1/d0,mx,my);V.x-=(cur.x-prev.x)/2/V.k;V.y-=(cur.y-prev.y)/2/V.k;clampView()}
  ptrs.set(e.pointerId,cur);wake()});
function endPtr(e){if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);
  if(tapStart&&ptrs.size===0){const moved=Math.hypot(e.clientX-tapStart.x,e.clientY-tapStart.y),dt=performance.now()-tapStart.t;
    if(moved<8&&dt<400){const r=cv.getBoundingClientRect();handleTap(e.clientX-r.left,e.clientY-r.top);tapStart=null;drag=null;return}}
  if(ptrs.size===0&&drag&&!reduce&&performance.now()-lastMove<80){const v={...vel};inertia(v)}
  drag=ptrs.size===1?{}:null;tapStart=null}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
function inertia(v){let last=performance.now();anim={step(now){const dt=now-last;last=now;V.x-=v.x*dt/V.k;V.y-=v.y*dt/V.k;clampView();v.x*=Math.pow(.92,dt/16);v.y*=Math.pow(.92,dt/16);if(Math.hypot(v.x,v.y)<.02)anim=null}};wake()}
let lastTap=0;
function handleTap(x,y){
  const now=performance.now();
  for(const h of hits)if(Math.hypot(h.x-x,h.y-y)<24){lastTap=0;return flyTo(fitView(h.id),0,true)}
  for(const h of wildHits)if(Math.abs(h.x-x)<22&&Math.abs(h.y-y)<22){lastTap=0;return showWild(h.f,x,y)}
  wildTip.hidden=true;
  for(const s of starHits)if(Math.hypot(s.x-x,s.y-y)<20){const st=R[s.id].stops[s.i];tip.textContent=`${st[0]} · ${st[3]}${st[4]?' · '+st[4]:''}`;tip.style.left=x+'px';tip.style.top=y+'px';tip.hidden=false;lastTap=0;return}
  tip.hidden=true;
  if(now-lastTap<320){lastTap=0;zoomSmooth(2.2,x,y)}else lastTap=now;
}
function zoomSmooth(f,px=W/2,py=H/2){const x=wx(px),y=wy(py),k=cl(V.k*f,kMin,kMax);flyTo({x:x-(px-W/2)/k,y:y-(py-H/2)/k,k},600)}
cv.addEventListener('wheel',e=>{
  if(e.ctrlKey||e.metaKey){e.preventDefault();interacted=true;anim=null;const r=cv.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0025)),e.clientX-r.left,e.clientY-r.top);wake()}
  else showHint();
},{passive:false});
['gesturestart','gesturechange'].forEach(ev=>wrap.addEventListener(ev,e=>e.preventDefault()));
let hintT;function showHint(){const h=document.getElementById('zoomHint');if(!h)return;h.hidden=false;clearTimeout(hintT);hintT=setTimeout(()=>h.hidden=true,1600)}
document.getElementById('mzIn').onclick=()=>{interacted=true;zoomSmooth(2)};
document.getElementById('mzOut').onclick=()=>{interacted=true;zoomSmooth(.5)};
const lookBtn=document.getElementById('mzLook'),lookMenu=document.getElementById('lookMenu');
function renderLookMenu(){lookMenu.innerHTML=`<p class="lm-t">Map colours</p>`+Object.entries(LOOKS).map(([id,L])=>`<button type="button" class="lm-o${id===look?' on':''}" data-look="${id}" aria-pressed="${id===look}">
  <i style="background:conic-gradient(${L.sw[0]} 0 33%,${L.sw[1]} 0 66%,${L.sw[2]} 0)"></i><span><b>${L.name}</b><small>${L.note}</small></span></button>`).join('')}
lookBtn.onclick=e=>{e.stopPropagation();renderLookMenu();lookMenu.hidden=!lookMenu.hidden};
lookMenu.addEventListener('click',e=>{const b=e.target.closest('[data-look]');if(b){setLook(b.dataset.look);lookMenu.hidden=true}});
document.addEventListener('click',e=>{if(!lookMenu.hidden&&!e.target.closest('#lookMenu,#mzLook'))lookMenu.hidden=true});
document.getElementById('mzWorld').onclick=()=>{interacted=true;flyTo(worldView())};
cv.addEventListener('keydown',e=>{const m={ArrowLeft:[-60,0],ArrowRight:[60,0],ArrowUp:[0,-60],ArrowDown:[0,60]}[e.key];
  if(m){e.preventDefault();V.x+=m[0]/V.k;V.y+=m[1]/V.k;clampView();wake()}else if(e.key==='+'||e.key==='=')zoomSmooth(2);else if(e.key==='-')zoomSmooth(.5)});

/* ---------- loop ---------- */
let running=false,visible=true,raf=0;
function frame(now){raf=0;tNow=now;if(anim)anim.step(now);clampView();render();updateFocus();if(visible&&!document.hidden)raf=requestAnimationFrame(frame);else running=false}
function wake(){if(!raf){running=true;raf=requestAnimationFrame(frame)}}
new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)wake()}).observe(wrap);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});

/* ---------- size + start ---------- */
let kStart=4;
function resize(){
  const r=wrap.getBoundingClientRect();W=Math.round(r.width);H=Math.round(r.height);DPR=Math.min(devicePixelRatio||1,2);
  cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+'px';cv.style.height=H+'px';
  kMin=Math.max(W/360,H/144);kStart=Math.max(kMin*1.05,W<760?W/95:W/170);statKey='';for(const k in fitCache)delete fitCache[k];clampView();wake();
}
addEventListener('resize',resize);
async function load(){
  resize();
  const a=await fetch('data/land-110.json').then(r=>r.json());land.a=decode(a);landA=toPath(land.a);
  // opening move: a little further out, then glide in
  const w=worldView();Object.assign(V,{x:w.x-20,y:w.y,k:w.k*.62});clampView();flyTo(w,reduce?1:2200);
  img(`data/looks/${look}/world-ocean.jpg`,i=>IMG.ocean=i);
  img(`data/looks/${look}/world-land-1k.jpg`,i=>{IMG.land1=i;img(`data/looks/${look}/world-land-3k.jpg`,j=>IMG.land3=j)});
  fetch('data/relief.json').then(r=>r.json()).then(j=>{RELIEF=j;statKey='';wake()});
  fetch('data/land-50.json').then(r=>r.json()).then(b=>{land.b=decode(b);landB=toPath(land.b);statKey='';wake()});
  fetch('data/land-detail.json').then(r=>r.json()).then(d=>{for(const id in d){land.detail[id]=decode(d[id]);detailPath[id]=toPath(land.detail[id]);delete GD[id]}statKey='';wake()});
}
load().catch(err=>{console.warn('Map failed to load',err);wrap.classList.add('failed')});
})();
