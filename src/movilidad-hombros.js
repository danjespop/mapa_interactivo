import * as THREE from 'three';
const fields=new WeakMap();
function shoulderField(skin){
 if(fields.has(skin))return fields.get(skin);const p=skin.geometry.attributes.tissuePosition,ids=skin.geometry.attributes.skinIndex,weights=skin.geometry.attributes.skinWeight,names=skin.skeleton.bones.map(b=>b.name.replace(/^female_/,'')),byName=Object.fromEntries(skin.skeleton.bones.map(b=>[b.name.replace(/^female_/,''),b])),field={};
 for(const side of ['L','R']){const shoulder=byName['upperarm_'+side].getWorldPosition(new THREE.Vector3()),elbow=byName['forearm_'+side].getWorldPosition(new THREE.Vector3()),axis=elbow.sub(shoulder),length=axis.length();axis.normalize();const centerZ=byName.spine.getWorldPosition(new THREE.Vector3()).z,rows=Array.from({length:14},()=>({rx:.08,front:.05,back:.05})),radii=[];
  for(let i=0;i<p.count;i+=2){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v=new THREE.Vector3(x,y,z),relative=v.clone().sub(shoulder),t=relative.dot(axis)/length;let limb=0;for(let j=0;j<4;j++)if(/^(upperarm|forearm)_/.test(names[ids.getComponent(i,j)]))limb+=weights.getComponent(i,j);
   if(x*(side==='L'?1:-1)>0&&t>.25&&t<.65&&limb>.75)radii.push(relative.clone().addScaledVector(axis,-relative.dot(axis)).length());
   const row=Math.floor((y-(shoulder.y-.32))/.03);if(row<0||row>=rows.length||Math.abs(x)>Math.abs(shoulder.x)-.01||limb>.15)continue;rows[row].rx=Math.max(rows[row].rx,Math.abs(x));rows[row].front=Math.max(rows[row].front,z-centerZ);rows[row].back=Math.max(rows[row].back,centerZ-z);
  }
  radii.sort((a,b)=>a-b);const radius=THREE.MathUtils.clamp(radii[Math.floor(radii.length*.65)]||.04,.025,.055);for(let pass=0;pass<3;pass++){const old=rows.map(r=>({...r}));for(let i=0;i<rows.length;i++)for(const key of ['rx','front','back'])rows[i][key]=(old[Math.max(0,i-1)][key]+old[i][key]*2+old[Math.min(rows.length-1,i+1)][key])/4;}
  field[side]={shoulder,axis,length,radius,centerZ,rows};
 }fields.set(skin,field);return field;
}
// A smooth spatial field shared by skin and nearby vessels, relative to the
// actual shoulder and torso contours, rather than a fixed world X threshold.
export function prepareShoulders(mesh,reference=mesh){
 // MakeHuman already supplies a continuous shoulder/axillary skin blend.
 // Replacing it with the atlas torso/arm distance field creates a hanging
 // web when the female humerus rises. Keep that model's authored weights.
 if(mesh===reference&&mesh.userData.female)return;
 const g=mesh.geometry;if(g.userData.shoulderBlend)return;const p=g.attributes.tissuePosition,ids=g.attributes.skinIndex,weights=g.attributes.skinWeight;if(!mesh.skeleton||!p||!ids)return;const names=mesh.skeleton.bones.map(b=>b.name.replace(/^female_/,'')),boneIndex=Object.fromEntries(names.map((n,i)=>[n,i]));if(boneIndex.upperarm_L===undefined)return;const field=shoulderField(reference);g.userData.shoulderBlend=true;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),side=x>0?'L':'R',{shoulder,axis,length,radius,centerZ,rows}=field[side];if(Math.abs(x)<.075)continue;const relative=new THREE.Vector3(x,y,z).sub(shoulder),t=relative.dot(axis)/length,radial=relative.clone().addScaledVector(axis,-relative.dot(axis)).length();if(t<-.16||t>.80||radial>.15)continue;
  const fade=THREE.MathUtils.smoothstep(t,-.16,-.03)*(1-THREE.MathUtils.smoothstep(t,.60,.80))*(1-THREE.MathUtils.smoothstep(radial,.11,.15)),at=THREE.MathUtils.clamp((y-(shoulder.y-.32))/.03,0,rows.length-1),lo=Math.floor(at),hi=Math.min(lo+1,rows.length-1),rx=THREE.MathUtils.lerp(rows[lo].rx,rows[hi].rx,at-lo),rz=THREE.MathUtils.lerp(rows[lo][z>centerZ?'front':'back'],rows[hi][z>centerZ?'front':'back'],at-lo),torso=(Math.hypot(x/rx,(z-centerZ)/rz)-1)*Math.min(rx,rz),arm=radial-radius,confidence=THREE.MathUtils.smoothstep(torso-arm,-.035,.035),clavicle=confidence*(1-THREE.MathUtils.smoothstep(t,0,.30))*.55;
  const result=new Map();for(let j=0;j<4;j++){const id=ids.getComponent(i,j),w=weights.getComponent(i,j);result.set(id,(result.get(id)||0)+w*(1-fade));}for(const [name,w]of [['spine',1-confidence],['clavicle_'+side,clavicle],['upperarm_'+side,confidence-clavicle]]){const id=boneIndex[name];result.set(id,(result.get(id)||0)+w*fade);}const sorted=[...result].sort((a,b)=>b[1]-a[1]).slice(0,4),total=sorted.reduce((s,v)=>s+v[1],0);for(let j=0;j<4;j++){ids.setComponent(i,j,sorted[j]?.[0]||0);weights.setComponent(i,j,(sorted[j]?.[1]||0)/total);}
 }ids.needsUpdate=true;weights.needsUpdate=true;
}
