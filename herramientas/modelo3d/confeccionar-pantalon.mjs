// One continuous pair-of-pants surface: shared pelvis ring and shared crotch seam.
import fs from 'node:fs';
const file=new URL('../../assets/modelo3d/ropa-datos.js',import.meta.url),data=JSON.parse(fs.readFileSync(file,'utf8').split('=')[1].replace(/;\s*$/,'')),bodies=JSON.parse(fs.readFileSync('/tmp/cuerpos-colision-ropa.json','utf8'));
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);},mix=(a,b,t)=>a+(b-a)*t;
for(const sex of ['masculino','femenino']){
 const old=data[sex],out={positions:[],indices:[],joints:[],weights:[],parts:[],bones:old.bones,components:{camiseta:1,pantalon:1},style:'tank-shorts-sewn'},map=new Map();
 for(let i=0;i<old.parts.length;i++)if(old.parts[i]===1){map.set(i,out.parts.length);out.positions.push(...old.positions.slice(i*3,i*3+3));out.joints.push(...old.joints.slice(i*4,i*4+4));out.weights.push(...old.weights.slice(i*4,i*4+4));out.parts.push(1);}for(let i=0;i<old.indices.length;i+=3)if(old.parts[old.indices[i]]===1)out.indices.push(...old.indices.slice(i,i+3).map(v=>map.get(v)));
 const points=bodies[sex].positions,profile=[];
 for(let row=0;row<=16;row++){const y=mix(.975,.805,row/16),section=points.filter(p=>Math.abs(p[1]-y)<.012&&Math.abs(p[0])<.19),xs=section.map(p=>Math.abs(p[0])),zs=section.map(p=>p[2]);profile.push({y,rx:Math.min(.185,Math.max(...xs)+.009),front:Math.max(...zs)+.012,back:Math.min(...zs)-.010});}
 for(let pass=0;pass<3;pass++){const old=profile.map(p=>({...p}));for(let i=0;i<profile.length;i++)for(const k of ['rx','front','back'])profile[i][k]=(old[Math.max(0,i-1)][k]+old[i][k]*2+old[Math.min(old.length-1,i+1)][k])/4;}
 // Keep the waistband underneath the actual draped tank hem.
 for(const p of profile)if(p.y>.935){const shirt=old.positions.reduce((a,_,i)=>i%3===0&&old.parts[i/3]===1&&Math.abs(old.positions[i+1]-p.y)<.012?[...a,old.positions.slice(i,i+3)]:a,[]);if(shirt.length){p.rx=Math.min(p.rx,Math.max(...shirt.map(v=>Math.abs(v[0])))-.008);p.front=Math.min(p.front,Math.max(...shirt.map(v=>v[2]))-.010);p.back=Math.max(p.back,Math.min(...shirt.map(v=>v[2]))+.010);}}
 const add=(x,y,z)=>{const id=out.parts.length;out.positions.push(x,y,z);out.parts.push(0);const flex=smooth((.91-y)/.12),side=x>=0?'L':'R',center=1-smooth(Math.abs(x)/.035),weights={pelvis:1-flex,['thigh_'+side]:flex*(1-center*.5),['thigh_'+(side==='L'?'R':'L')]:flex*center*.5};const w=Object.entries(weights).filter(p=>p[1]>0);for(let j=0;j<4;j++){out.joints.push(j<w.length?out.bones.indexOf(w[j][0]):0);out.weights.push(j<w.length?w[j][1]:0);}return id;};
 const face=(a,b,c,d)=>out.indices.push(a,b,c,b,d,c),N=64,rings=[];
 for(const section of profile){const ring=[];for(let i=0;i<N;i++){const a=i/N*Math.PI*2,c=Math.cos(a),r=(section.front-section.back)/2,zc=(section.front+section.back)/2,fold=.0007*Math.sin(a*9+section.y*65)*smooth((.96-section.y)/.08);ring.push(add((section.rx+fold)*Math.sin(a),section.y,zc+(r+fold)*c));}if(rings.length){const prev=rings.at(-1);for(let i=0;i<N;i++)face(prev[i],prev[(i+1)%N],ring[i],ring[(i+1)%N]);}rings.push(ring);}
 const base=rings.at(-1),s=profile.at(-1),crotch=[base[0]];
 for(let i=1;i<16;i++){const t=i/16;crotch.push(add(0,.805-.025*Math.sin(Math.PI*t),mix(s.front,s.back,t)));}crotch.push(base[32]);
 for(const [side,sign]of [['L',1],['R',-1]]){
  let previous=sign>0?[...base.slice(0,33),...crotch.slice(1,-1).reverse()]:[base[0],...base.slice(33).reverse(),base[32],...crotch.slice(1,-1).reverse()];const count=previous.length,top=previous.map(i=>out.positions.slice(i*3,i*3+3));
  // The outer half uses 32 segments; the shared inner seam uses 16.
  for(let row=1;row<=24;row++){const t=row/24,shape=smooth(t/.45),ring=[],yLevel=mix(.805,.590,t),section=points.filter(p=>Math.abs(p[1]-yLevel)<.014&&p[0]*sign>.02&&p[0]*sign<.19),outer=Math.max(...section.map(p=>Math.abs(p[0])))+.015,rx=(outer-.008)/2,cx=sign*(outer+.008)/2,front=Math.max(...section.map(p=>p[2]))+.018,back=Math.min(...section.map(p=>p[2]))-.015,rz=(front-back)/2,zc=(front+back)/2;for(let i=0;i<count;i++){const theta=i<=32?i/32*Math.PI:Math.PI+(i-32)/16*Math.PI,fold=.0013*Math.sin(theta*7+t*11)*Math.sin(Math.PI*t),x=mix(top[i][0],cx+sign*(rx+fold)*Math.sin(theta),shape),y=mix(top[i][1],.590,t),z=mix(top[i][2],zc+(rz+fold)*Math.cos(theta),shape);ring.push(add(x,y,z));}for(let i=0;i<count;i++){const j=(i+1)%count;if(sign>0)face(previous[i],previous[j],ring[i],ring[j]);else face(previous[j],previous[i],ring[j],ring[i]);}previous=ring;}
 }
 out.positions=out.positions.map(v=>Math.round(v*1e5)/1e5);data[sex]=out;console.log('PANTALÓN COSIDO',sex,out.parts.length);
}
fs.writeFileSync(file,'/* Camisetas drapeadas y pantalones de superficie cosida continua. Ver ATRIBUCIONES.md. */\nglobalThis.ATLAS_SPORTSWEAR='+JSON.stringify(data)+';\n');
