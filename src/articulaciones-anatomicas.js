import * as THREE from 'three';
const normalName=name=>name.replace(/^female_/,'');
export function prepareAnatomicalJoints(meshes,bones){
 const helpers={};
 for(const side of ['L','R']){
  const forearm=bones['forearm_'+side],hand=bones['hand_'+side],bone=new THREE.Bone();bone.name=forearm.name.replace('forearm_','pronation_');forearm.add(bone);bone.updateWorldMatrix(true,false);bone.attach(hand);bone.userData.referenceQuaternion=bone.quaternion.clone();helpers[side]=bone;bones['pronation_'+side]=bone;
 }
 for(const mesh of meshes){if(!mesh.isSkinnedMesh)continue;if(mesh.userData.system!=='piel'&&mesh.userData.region!=='upper')continue;const g=mesh.geometry,ids=g.attributes.skinIndex,ws=g.attributes.skinWeight,p=g.attributes.tissuePosition,original=mesh.skeleton,names=original.bones.map(b=>normalName(b.name)),name=mesh.userData.anatomical_name||mesh.name;
  if(!p)continue;const relevant=names.some(n=>/^forearm_/.test(n));if(!relevant)continue;let influenced=false;for(let i=0;i<ids.count&&!influenced;i++)for(let j=0;j<4;j++)if(ws.getComponent(i,j)>.0001&&/^forearm_/.test(names[ids.getComponent(i,j)])){influenced=true;break;}if(!influenced)continue;
  const binding=original.bones[0].matrixWorld.clone().multiply(original.boneInverses[0]),extra=['L','R'].map(side=>helpers[side]),skeleton=new THREE.Skeleton([...original.bones,...extra],[...original.boneInverses,...extra.map(b=>b.matrixWorld.clone().invert().multiply(binding))]);
  const newIds=new Uint16Array(ids.count*4),newWeights=new Float32Array(ids.count*4);
  for(let i=0;i<ids.count;i++){
   const values=new Map(),v=new THREE.Vector3().fromBufferAttribute(p,i);
   for(let j=0;j<4;j++){const id=ids.getComponent(i,j),weight=ws.getComponent(i,j),n=names[id];if(!weight)continue;let fraction=0,side=n.endsWith('_L')?'L':'R';
    if(n.startsWith('forearm_')&&!/ulna|brachialis|anconeus|triceps/i.test(name)){
     if(/^(Radius|Articular cartilage of radius)\b/i.test(name))fraction=1;
     else{const a=bones['forearm_'+side].getWorldPosition(new THREE.Vector3()),b=bones['hand_'+side].getWorldPosition(new THREE.Vector3()),axis=b.sub(a),t=v.clone().sub(a).dot(axis)/axis.lengthSq();fraction=THREE.MathUtils.smoothstep(t,.12,.88);}
    }
    values.set(id,(values.get(id)||0)+weight*(1-fraction));const target=original.bones.length+(side==='L'?0:1);values.set(target,(values.get(target)||0)+weight*fraction);
   }
   const sorted=[...values].sort((a,b)=>b[1]-a[1]).slice(0,4),total=sorted.reduce((sum,v)=>sum+v[1],0);for(let j=0;j<4;j++){newIds[i*4+j]=sorted[j]?.[0]||0;newWeights[i*4+j]=(sorted[j]?.[1]||0)/total;}
  }
  g.setAttribute('skinIndex',new THREE.BufferAttribute(newIds,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(newWeights,4));mesh.skeleton=skeleton;
 }
 return helpers;
}
// Pelvic origins stay on the pelvis; only the distal fibres follow the femur.
export function prepareHips(meshes,bones){
 for(const mesh of meshes){if(!mesh.isSkinnedMesh)continue;const name=mesh.userData.anatomical_name||mesh.name,skin=mesh.userData.system==='piel'&&!mesh.userData.skinAccessory,surfaceLike=skin||['circulatorio','nervioso','linfatico','fascias'].includes(mesh.userData.system),proximal=/gluteus|iliacus|psoas|sartorius|gracilis|adductor|pectineus|rectus femoris|semitendinosus|semimembranosus|biceps femoris.*long head|tensor fascia/i.test(name);if(!surfaceLike&&!proximal)continue;
  const g=mesh.geometry,p=g.attributes.tissuePosition,ids=g.attributes.skinIndex,ws=g.attributes.skinWeight,names=mesh.skeleton.bones.map(b=>normalName(b.name)),pelvis=names.indexOf('pelvis');if(pelvis<0)continue;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),side=x>0?'L':'R',hip=bones['thigh_'+side].getWorldPosition(new THREE.Vector3()).y;if(y<hip-.14||y>hip+.23||Math.abs(x)>.23)continue;
   let upper=0;for(let j=0;j<4;j++)if(/hand|finger|forearm|upperarm/.test(names[ids.getComponent(i,j)]))upper+=ws.getComponent(i,j);if(upper>.05)continue;
   const thigh=names.indexOf('thigh_'+side);if(thigh<0)continue;
   const low=hip-(z<0?.13:.10),high=hip+.045,amount=THREE.MathUtils.smoothstep(y,low,high)*(surfaceLike?1-THREE.MathUtils.smoothstep(y,hip+.09,hip+.23):1);
   if(!amount)continue;
   const old=new Map();for(let j=0;j<4;j++){const id=ids.getComponent(i,j),w=ws.getComponent(i,j);old.set(id,(old.get(id)||0)+w*(1-amount));}old.set(pelvis,(old.get(pelvis)||0)+amount);
   const sorted=[...old].sort((a,b)=>b[1]-a[1]).slice(0,4),total=sorted.reduce((s,p)=>s+p[1],0);for(let j=0;j<4;j++){ids.setComponent(i,j,sorted[j]?.[0]||0);ws.setComponent(i,j,(sorted[j]?.[1]||0)/total);}
  }
  ids.needsUpdate=true;ws.needsUpdate=true;
 }
}

// Some imported references use the glTF exporter's neutral joint for vertices
// without weights. Attach these to the anatomical axial chain before retargeting.
export function prepareAxialReferences(meshes,bones){
 const names=Object.keys(bones).filter(n=>n!=='neutral_bone'),target=names.map(n=>bones[n]),index=new Map(names.map((n,i)=>[n,i]));
 for(const mesh of meshes){if(!mesh.isSkinnedMesh)continue;const old=mesh.skeleton,oldNames=old.bones.map(b=>normalName(b.name));if(!oldNames.includes('neutral_bone'))continue;const g=mesh.geometry,p=g.attributes.tissuePosition,ids=g.attributes.skinIndex,weights=g.attributes.skinWeight;if(!p)continue;
  let affected=false;for(let i=0;i<ids.count&&!affected;i++)for(let j=0;j<4;j++)if(weights.getComponent(i,j)>.001&&oldNames[ids.getComponent(i,j)]==='neutral_bone'){affected=true;break;}if(!affected)continue;
  const joints=new Uint16Array(ids.count*4),ws=new Float32Array(ids.count*4),binding=old.bones[0].matrixWorld.clone().multiply(old.boneInverses[0]),skeleton=new THREE.Skeleton(target,target.map(b=>b.matrixWorld.clone().invert().multiply(binding)));
  for(let i=0;i<ids.count;i++){const values=new Map(),y=p.getY(i);for(let j=0;j<4;j++){const w=weights.getComponent(i,j),name=oldNames[ids.getComponent(i,j)];if(!w)continue;if(name!=='neutral_bone'){const id=index.get(name);values.set(id,(values.get(id)||0)+w);continue;}
    const distribution=y>1.46?{head:1}:y>1.35?{neck:1-THREE.MathUtils.smoothstep(y,1.40,1.48),head:THREE.MathUtils.smoothstep(y,1.40,1.48)}:{pelvis:1-THREE.MathUtils.smoothstep(y,.92,1.06),spine:THREE.MathUtils.smoothstep(y,.92,1.06)};
    for(const [key,weight]of Object.entries(distribution)){const id=index.get(key);values.set(id,(values.get(id)||0)+w*weight);}
   }
   const sorted=[...values].sort((a,b)=>b[1]-a[1]).slice(0,4),total=sorted.reduce((sum,v)=>sum+v[1],0);for(let j=0;j<4;j++){joints[i*4+j]=sorted[j]?.[0]||0;ws[i*4+j]=(sorted[j]?.[1]||0)/total;}
  }
  g.setAttribute('skinIndex',new THREE.BufferAttribute(joints,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(ws,4));mesh.skeleton=skeleton;
 }
}
// Collections in the reference sometimes mark limb vessels as axial. Rebind
// these points by anatomical limb proximity, before shoulder/hip transitions.
export function prepareVesselLimbs(meshes,bones){
 const names=Object.keys(bones),target=names.map(n=>bones[n]),index=new Map(names.map((n,i)=>[n,i])),skeleton=new THREE.Skeleton(target);skeleton.calculateInverses();
 const segment=(name,end)=>{const a=bones[name]?.getWorldPosition(new THREE.Vector3()),b=bones[end]?.getWorldPosition(new THREE.Vector3());if(!a||!b)return null;return {name,a,b,dx:b.x-a.x,dy:b.y-a.y,dz:b.z-a.z,length:a.distanceToSquared(b)};},distance=(v,s)=>{const t=THREE.MathUtils.clamp(((v.x-s.a.x)*s.dx+(v.y-s.a.y)*s.dy+(v.z-s.a.z)*s.dz)/s.length,0,1);return (v.x-s.a.x-s.dx*t)**2+(v.y-s.a.y-s.dy*t)**2+(v.z-s.a.z-s.dz*t)**2;},chains={};
 for(const side of ['L','R']){const upper=[segment('upperarm_'+side,'forearm_'+side),segment('forearm_'+side,'hand_'+side),segment('hand_'+side,'finger_2_0_'+side)].filter(Boolean),lower=[segment('pelvis','thigh_'+side),segment('thigh_'+side,'shin_'+side),segment('shin_'+side,'foot_'+side)].filter(Boolean),fingers=[];for(let digit=0;digit<5;digit++)for(let joint=0;joint<2;joint++){const s=segment(`finger_${digit}_${joint}_${side}`,`finger_${digit}_${joint+1}_${side}`);if(s)fingers.push(s);}const append=(list,name,size)=>{const bone=bones[name],a=bone.getWorldPosition(new THREE.Vector3()),b=a.clone().add(new THREE.Vector3(0,size,0).applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion())));list.push({name,a,b,dx:b.x-a.x,dy:b.y-a.y,dz:b.z-a.z,length:a.distanceToSquared(b)});};append(lower,'foot_'+side,.18);for(let digit=0;digit<5;digit++)if(bones[`finger_${digit}_2_${side}`])append(fingers,`finger_${digit}_2_${side}`,.015);chains[side]={upper,lower,fingers,shoulder:upper[0].a,hand:bones['hand_'+side].getWorldPosition(new THREE.Vector3()),hip:bones['thigh_'+side].getWorldPosition(new THREE.Vector3())};}
 for(const mesh of meshes){if(!mesh.isSkinnedMesh||!['circulatorio','nervioso','linfatico','fascias'].includes(mesh.userData.system))continue;if(mesh.userData.system==='fascias'&&!['upper','lower'].includes(mesh.userData.region))continue;const protectCore=/intercost|bronch|pulmon|coronar|cardiac|phrenic|gastric|mesenteric|splenic|hepatic|renal|lumbar|sacral|testicul|penis|vesical|prostat|aorta|vena cava/i.test(mesh.userData.anatomical_name||'');const g=mesh.geometry,p=g.attributes.tissuePosition,ids=g.attributes.skinIndex,ws=g.attributes.skinWeight,oldNames=mesh.skeleton.bones.map(b=>normalName(b.name));if(!p)continue;const newIds=new Uint16Array(ids.count*4),newWeights=new Float32Array(ids.count*4),v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const side=v.x>0?'L':'R',chain=chains[side],armDistance=Math.sqrt(Math.min(...chain.upper.map(s=>distance(v,s)))),legDistance=Math.sqrt(Math.min(...chain.lower.slice(1).map(s=>distance(v,s)))),arm=(protectCore&&mesh.userData.region!=='upper'?0:1)*(1-THREE.MathUtils.smoothstep(armDistance,.05,.085))*THREE.MathUtils.smoothstep(Math.abs(v.x),Math.abs(chain.shoulder.x)-.065,Math.abs(chain.shoulder.x)-.025),leg=(protectCore&&mesh.userData.region!=='lower'?0:1)*(1-THREE.MathUtils.smoothstep(legDistance,.045,.085))*THREE.MathUtils.smoothstep(Math.abs(v.x),.02,.05)*(1-THREE.MathUtils.smoothstep(v.y,chain.hip.y+.02,chain.hip.y+.10));let amount=Math.max(arm,leg),candidates=arm>=leg?chain.upper:chain.lower;
   if(arm>=leg&&v.y<chain.hand.y+.015&&chain.fingers.length){const closest=chain.fingers.map(s=>[distance(v,s),s]).sort((a,b)=>a[0]-b[0])[0];if(closest[0]<distance(v,chain.upper.at(-1)))candidates=[chain.upper.at(-1),...chain.fingers.filter(s=>s.name.split('_')[1]===closest[1].name.split('_')[1])];}
   const values=new Map();for(let j=0;j<4;j++){const id=index.get(oldNames[ids.getComponent(i,j)]),w=ws.getComponent(i,j)*(1-amount);if(w)values.set(id,(values.get(id)||0)+w);}
   if(amount>0){const nearest=candidates.map(s=>[distance(v,s),s.name]).sort((a,b)=>a[0]-b[0]).slice(0,2),sum=nearest.reduce((s,p)=>s+1/Math.max(.000081,p[0])**2,0);for(const [d,name]of nearest){const id=index.get(name);values.set(id,(values.get(id)||0)+amount/(Math.max(.000081,d)**2*sum));}}
   const sorted=[...values].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=sorted.reduce((s,v)=>s+v[1],0);for(let j=0;j<4;j++){newIds[i*4+j]=sorted[j]?.[0]||0;newWeights[i*4+j]=(sorted[j]?.[1]||0)/sum;}
  }
  g.setAttribute('skinIndex',new THREE.BufferAttribute(newIds,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(newWeights,4));mesh.bind(skeleton,new THREE.Matrix4());
 }
}
