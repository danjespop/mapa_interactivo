// Patrones de confección; no se incluyen en el visor.
import * as THREE from 'three';
import {prepareSurface} from '../../src/superficies.js';
export function patternSportswear(skin){
 prepareSurface(skin);const source=skin.geometry.getAttribute('tissuePosition'),boneNames=skin.skeleton.bones.map(b=>b.name.replace(/^female_/,'')),ids=skin.geometry.getAttribute('skinIndex'),weights=skin.geometry.getAttribute('skinWeight');
 const cuff=Object.fromEntries(['L','R'].map(side=>[side,mixPosition('upperarm_'+side).y*.28+mixPosition('forearm_'+side).y*.72-.003]));function mixPosition(name){return skin.skeleton.bones[boneNames.indexOf(name)].getWorldPosition(new THREE.Vector3());}
 const easeTank=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);const membership=[],mask=new Float32Array(source.count),samples=[];
 for(let i=0;i<source.count;i++){
  let strongest=-1,bone=0;for(let j=0;j<4;j++){if(weights.getComponent(i,j)>strongest){strongest=weights.getComponent(i,j);bone=ids.getComponent(i,j);}}
  const name=boneNames[bone],x=source.getX(i),y=source.getY(i),z=source.getZ(i),core=/^(pelvis|spine|chest_)/.test(name),upper=/^(upperarm|clavicle)_/.test(name),lower=/^(pelvis|thigh_|shin_|foot_)/.test(name);
  const top=1.27+(z>0?.125:.145)*Math.max(0,1-(Math.abs(x)/.145)**2);mask[i]=Number((core&&y>.950&&y<top-.009)||(lower&&y>.595&&y<1.0)||(lower&&y<.090));membership.push(name);samples.push({x,y,z,name});
 }
 skin.geometry.setAttribute('clothingMask',new THREE.BufferAttribute(mask,1));
 const p=[],idx=[],joints=[],ws=[],parts=[],clothParts=[];
 const point=name=>skin.skeleton.bones[boneNames.indexOf(name)].getWorldPosition(new THREE.Vector3());
 const mix=(a,b,t)=>THREE.MathUtils.lerp(a,b,t),ease=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
 function vertex(v,distribution,top){p.push(v.x,v.y,v.z);parts.push(top);clothParts.push(top?1:0);const pairs=Object.entries(distribution).filter(([name,w])=>w>1e-7&&boneNames.includes(name)).sort((a,b)=>b[1]-a[1]).slice(0,4),total=pairs.reduce((sum,[,w])=>sum+w,0);for(let i=0;i<4;i++){joints.push(i<pairs.length?boneNames.indexOf(pairs[i][0]):0);ws.push(i<pairs.length?pairs[i][1]/total:0);}}
 function rings(rows,top,caps=false){const start=p.length/3,n=40;for(const ring of rows)for(let col=0;col<=n;col++){const theta=col/n*Math.PI*2,c=Math.cos(theta),s=Math.sin(theta),v=ring.center.clone().addScaledVector(ring.xAxis||new THREE.Vector3(1,0,0),ring.rx*c).addScaledVector(ring.zAxis||new THREE.Vector3(0,0,1),ring.rz*s);if(ring.modify)ring.modify(v,theta);vertex(v,typeof ring.weights==='function'?ring.weights(v):ring.weights,top);}for(let row=0;row<rows.length-1;row++)for(let col=0;col<n;col++){const a=start+row*(n+1)+col,b=a+n+1;idx.push(a,b,a+1,b,b+1,a+1);}if(caps){const center=p.length/3;vertex(rows[0].center,rows[0].weights,top);for(let c=0;c<n;c++)idx.push(center,start+c+1,start+c);}}
 const profile=[];for(let y=.94;y<=1.435;y+=.019){const points=samples.filter(v=>/^(pelvis|spine|chest_)/.test(v.name)&&Math.abs(v.y-y)<.014&&Math.abs(v.x)<.19);let width=.14,front=.10,back=-.09;if(points.length){width=Math.max(...points.map(v=>Math.abs(v.x)));front=Math.max(...points.map(v=>v.z));back=Math.min(...points.map(v=>v.z));}profile.push({y,width,front,back});}
 const chest=Math.max(...profile.filter(v=>v.y>1.18&&v.y<1.35).map(v=>v.front)),waist=profile[2].front;
 const torso=profile.map(({y,width,front,back})=>{if(y>1.0&&y<1.27)front=Math.max(front,mix(waist,chest,ease(1.0,1.27,y)));front+=.015;if(y<1.04)front=Math.max(front,.122);back-=.013;const radius=Math.max(width+.013,y>1.37||y<1.04?.165:0);return {center:new THREE.Vector3(0,y,(front+back)/2),rx:radius,rz:(front-back)/2,weights:v=>{const spine=ease(.94,1.12,y),shoulder=ease(1.29,1.41,y)*ease(.10,.18,Math.abs(v.x))*.50,side=v.x>0?'L':'R';return {pelvis:(1-spine)*(1-shoulder),spine:spine*(1-shoulder),['clavicle_'+side]:shoulder*.55,['upperarm_'+side]:shoulder*.45};}};});
 torso.push({center:new THREE.Vector3(0,1.444,.005),rx:.125,rz:.078,weights:{spine:1}},{center:new THREE.Vector3(0,1.451,.005),rx:.085,rz:.063,weights:{spine:1}},{center:new THREE.Vector3(0,1.458,.005),rx:.060,rz:.055,weights:{spine:1}});rings(torso,true);
 for(const [side,sign]of [['L',1],['R',-1]]){
  const a=point('upperarm_'+side),b=point('forearm_'+side),direction=b.clone().sub(a).normalize(),xAxis=new THREE.Vector3(0,0,1).cross(direction).normalize(),zAxis=direction.clone().cross(xAxis).normalize(),sleeve=[];
  sleeve.push({center:a.clone().addScaledVector(direction,-.12),rx:.003,rz:.003,xAxis,zAxis,weights:{['clavicle_'+side]:.55,['upperarm_'+side]:.45}},{center:a.clone().addScaledVector(direction,-.065),rx:.052,rz:.050,xAxis,zAxis,weights:{['clavicle_'+side]:.4,['upperarm_'+side]:.6}});
  for(let i=0;i<=12;i++){const t=i/12,center=a.clone().lerp(b,t*.72),radius=mix(.060,.047,t);sleeve.push({center,rx:radius,rz:radius*.94,xAxis,zAxis,weights:{['clavicle_'+side]:(1-t)*.3,['upperarm_'+side]:.7+.3*t}});}rings(sleeve,true);
 }
 const hips=[];for(let i=0;i<=12;i++){const t=i/12,y=mix(.785,.985,t);hips.push({center:new THREE.Vector3(0,y,-.006),rx:mix(.135,.155,Math.sin(t*Math.PI/2)),rz:mix(.095,.107,t),modify:(v,theta)=>v.y+=.068*(1-t)**2*Math.cos(theta)**2,weights:{pelvis:1}});}rings(hips,false,true);
 for(const [side,sign]of [['L',1],['R',-1]]){
  const hip=point('thigh_'+side),knee=point('shin_'+side),ankle=point('foot_'+side),rows=[];
  for(let i=0;i<=35;i++){const t=i/35,y=mix(hip.y+.025,.115,t),legT=y>=knee.y?THREE.MathUtils.clamp((hip.y-y)/(hip.y-knee.y),0,1):THREE.MathUtils.clamp((knee.y-y)/(knee.y-ankle.y),0,1),center=(y>=knee.y?hip:knee).clone().lerp(y>=knee.y?knee:ankle,legT);center.y=y;
   const nearby=samples.filter(v=>v.name.endsWith('_'+side)&&/^(thigh|shin|foot)_/.test(v.name)&&Math.abs(v.y-y)<.015);let rx=.065,front=center.z+.065,back=center.z-.065;if(nearby.length){rx=Math.max(...nearby.map(v=>Math.abs(v.x-center.x)));front=Math.max(...nearby.map(v=>v.z));back=Math.min(...nearby.map(v=>v.z));}rx=THREE.MathUtils.clamp(rx+.010,.036,.080);front+=.011;back-=.011;center.z=(front+back)/2;const pelvis=ease(hip.y-.08,hip.y+.01,y),shin=1-ease(knee.y-.05,knee.y+.055,y);rows.push({center,rx,rz:THREE.MathUtils.clamp((front-back)/2,.038,.086),weights:{pelvis,['thigh_'+side]:(1-pelvis)*(1-shin),['shin_'+side]:(1-pelvis)*shin}});
  }rings(rows,false);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('tissuePosition',new THREE.Float32BufferAttribute(p,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joints,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(ws,4));geometry.setAttribute('garmentPart',new THREE.Float32BufferAttribute(clothParts,1));geometry.setIndex(idx);geometry.computeVertexNormals();
 const skeleton=new THREE.Skeleton(skin.skeleton.bones);skeleton.calculateInverses();const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshBasicMaterial());mesh.bind(skeleton,new THREE.Matrix4());return {mesh};
}
