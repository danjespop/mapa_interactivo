import * as THREE from 'three';
const next={pronation_L:'hand_L',pronation_R:'hand_R',pelvis:'spine',spine:'neck',neck:'head',head:null};
for(const side of ['L','R'])for(const [a,b]of [['clavicle','upperarm'],['upperarm','forearm'],['forearm','hand'],['thigh','shin'],['shin','foot'],['hand','finger_2_0']])next[a+'_'+side]=b+'_'+side;
// Cross-sections of the actual external body guide transverse fitting. This
// follows the target waist/limb shape rather than enlarging an entire pelvis.
function skinCage(skin,bones){
 const profiles=new Map(),p=skin.geometry.attributes.tissuePosition,ids=skin.geometry.attributes.skinIndex,ws=skin.geometry.attributes.skinWeight,names=skin.skeleton.bones.map(b=>b.name.replace(/^female_/,'')),entries=new Map();
 for(const [name,bone]of Object.entries(bones)){const ref=bone.userData.referenceWorld;if(!ref)continue;const child=next[name],length=child&&bones[child]?.userData.referenceWorld?new THREE.Vector3().setFromMatrixPosition(ref).distanceTo(new THREE.Vector3().setFromMatrixPosition(bones[child].userData.referenceWorld)):.15;entries.set(name,{inverse:ref.clone().invert(),length,maxY:0});}
 for(let i=0;i<p.count;i++){const point=new THREE.Vector3().fromBufferAttribute(p,i),done=new Set();for(let j=0;j<4;j++){if(ws.getComponent(i,j)<.15)continue;let name=names[ids.getComponent(i,j)];name=name.replace(/^pronation_/,'forearm_').replace(/^chest_[LR]$/,'spine');if(done.has(name))continue;done.add(name);const entry=entries.get(name);if(!entry)continue;const local=point.clone().applyMatrix4(entry.inverse),t=local.y/entry.length;entry.maxY=Math.max(entry.maxY,local.y);if(t<-.5||t>1.5)continue;const row=Math.min(15,Math.max(0,Math.floor((t+.5)*8))),angle=(Math.atan2(local.z,local.x)+Math.PI*2)%(Math.PI*2),col=Math.floor(angle/Math.PI*8),key=row*16+col;if(!profiles.has(name))profiles.set(name,new Float32Array(256));const profile=profiles.get(name);profile[key]=Math.max(profile[key],Math.hypot(local.x,local.z));}}
 for(const [name,profile]of profiles){const filled=new Float32Array(256);for(let row=0;row<16;row++)for(let col=0;col<16;col++){let best=0;for(let dy=-1;dy<=1;dy++)for(let da=-1;da<=1;da++)best=Math.max(best,profile[Math.max(0,Math.min(15,row+dy))*16+(col+da+16)%16]);filled[row*16+col]=best;}profiles.set(name,filled);}
 return {entries,profiles};
}
function radius(cage,name,p){
 const entry=cage.entries.get(name),profile=cage.profiles.get(name);if(!entry||!profile)return 0;const local=p.clone().applyMatrix4(entry.inverse),y=THREE.MathUtils.clamp((local.y/entry.length+.5)*8-.5,0,15),angle=((Math.atan2(local.z,local.x)+Math.PI*2)%(Math.PI*2))/Math.PI*8-.5,row=Math.floor(y),col=Math.floor(angle),t=angle-col;
 const sample=(r,c)=>profile[Math.min(15,r)*16+(c+16)%16];return THREE.MathUtils.lerp(THREE.MathUtils.lerp(sample(row,col),sample(row,col+1),t),THREE.MathUtils.lerp(sample(row+1,col),sample(row+1,col+1),t),y-row);
}
function headBox(skin){const box=new THREE.Box3(),p=skin.geometry.attributes.tissuePosition,v=new THREE.Vector3();for(let i=0;i<p.count;i++)if(p.getY(i)>1.455&&Math.abs(p.getX(i))<.115)box.expandByPoint(v.fromBufferAttribute(p,i));return box;}
// Retarget the shared reference at bind time. It remains a shared anatomical
// reference, rather than sex-specific organs, as stated in the viewer.
export function fitInternalReference(meshes,sourceBones,targetBones,targetSkin){
 const sourceSkin=meshes.find(o=>o.isSkinnedMesh&&/^Piel completa/.test(o.userData.anatomical_name||'')),fromCage=sourceSkin&&targetSkin?skinCage(sourceSkin,sourceBones):null,toCage=fromCage?skinCage(targetSkin,targetBones):null;
 for(const side of ['L','R']){next['thumb_base_'+side]='finger_0_0_'+side;for(let digit=0;digit<5;digit++)for(let joint=0;joint<2;joint++)next[`finger_${digit}_${joint}_${side}`]=`finger_${digit}_${joint+1}_${side}`;}
 const names=Object.keys(targetBones).filter(n=>!n.startsWith('female_')),targets=names.map(n=>targetBones[n]),index=new Map(names.map((n,i)=>[n,i])),maps=new Map();
 for(const name of names){const source=sourceBones[name],target=targetBones[name];if(!source?.userData.referenceWorld||!target?.userData.referenceWorld)continue;
  const from=source.userData.referenceWorld,to=target.userData.referenceWorld,child=next[name],a=new THREE.Vector3().setFromMatrixPosition(from),b=new THREE.Vector3().setFromMatrixPosition(to);let ratio=1;
  if(child&&sourceBones[child]&&targetBones[child])ratio=new THREE.Vector3().setFromMatrixPosition(targetBones[child].userData.referenceWorld).distanceTo(b)/new THREE.Vector3().setFromMatrixPosition(sourceBones[child].userData.referenceWorld).distanceTo(a);
  if(/^finger_\d_2_/.test(name)){const parent=name.replace('_2_','_1_');if(sourceBones[parent]&&targetBones[parent])ratio=new THREE.Vector3().setFromMatrixPosition(targetBones[parent].userData.referenceWorld).distanceTo(b)/new THREE.Vector3().setFromMatrixPosition(sourceBones[parent].userData.referenceWorld).distanceTo(a);}
  if(name.startsWith('foot_')&&fromCage?.entries.get(name)?.maxY>.01&&toCage?.entries.get(name)?.maxY>.01)ratio=toCage.entries.get(name).maxY/fromCage.entries.get(name).maxY;
  // Bone Y is longitudinal. Keep the shared internal reference slightly inside
  // the external surface; pelvis width follows the target hip landmarks.
  const width=name==='pelvis'?targetBones.thigh_L.position.distanceTo(targetBones.thigh_R.position)/sourceBones.thigh_L.position.distanceTo(sourceBones.thigh_R.position):.90;
  target.userData.internalFitWidth=width;maps.set(name,to.clone().multiply(new THREE.Matrix4().makeScale(width,THREE.MathUtils.clamp(ratio,.7,1.3),width)).multiply(from.clone().invert()));
 }
 let headMap=null;
 if(sourceSkin&&targetSkin){const sourceBox=headBox(sourceSkin),targetBox=headBox(targetSkin),from=sourceBox.getCenter(new THREE.Vector3()),to=targetBox.getCenter(new THREE.Vector3()),size=targetBox.getSize(new THREE.Vector3()).divide(sourceBox.getSize(new THREE.Vector3()));headMap=new THREE.Matrix4().makeTranslation(to.x,to.y,to.z).multiply(new THREE.Matrix4().makeScale(size.x*.97,size.y*.98,size.z*.95)).multiply(new THREE.Matrix4().makeTranslation(-from.x,-from.y,-from.z));maps.set('head',headMap);}
 const skeleton=new THREE.Skeleton(targets);skeleton.calculateInverses();const result=[];
 for(const original of meshes){if(!original.isSkinnedMesh||original.userData.female||original.userData.system==='piel'||original.userData.skinFeature||original.userData.skinAccessory||original.userData.system==='reproductor')continue;
  const source=original.geometry.attributes.tissuePosition,ids=original.geometry.attributes.skinIndex,ws=original.geometry.attributes.skinWeight;if(!source||!ids)continue;
  const positions=new Float32Array(source.count*3),joints=new Uint16Array(source.count*4),weights=new Float32Array(source.count*4),boneNames=original.skeleton.bones.map(b=>b.name.replace(/^female_/,'')),p=new THREE.Vector3(),v=new THREE.Vector3(),sum=new THREE.Vector3();
  for(let i=0;i<source.count;i++){p.fromBufferAttribute(source,i);sum.set(0,0,0);for(let j=0;j<4;j++){const originalName=boneNames[ids.getComponent(i,j)],name=index.has(originalName)?originalName:originalName.replace(/^thumb_base_/,'hand_'),map=maps.get(name),w=ws.getComponent(i,j);if(w&&!index.has(name))throw new Error('Articulación interna sin correspondencia: '+originalName);weights[i*4+j]=w;joints[i*4+j]=index.get(name)??index.get('spine');if(w){v.copy(p);if(map){v.applyMatrix4(map);if(name==='neck'&&headMap)v.lerp(p.clone().applyMatrix4(headMap),THREE.MathUtils.smoothstep(p.y,1.39,1.49));if(fromCage&&!/finger_|hand_|eye_|head|neck/.test(name)){const cageName=name.replace(/^pronation_/,'forearm_'),sourceRadius=radius(fromCage,cageName,p),targetRadius=radius(toCage,cageName,v);if(sourceRadius>.008&&targetRadius>.008){const factor=THREE.MathUtils.clamp(targetRadius*.94/sourceRadius,.6,name==='pelvis'?1.25:1.05),targetBone=targetBones[name],local=v.clone().applyMatrix4(toCage.entries.get(name).inverse);local.x*=factor/targetBone.userData.internalFitWidth;local.z*=factor/targetBone.userData.internalFitWidth;v.copy(local).applyMatrix4(targetBone.userData.referenceWorld);}}}sum.addScaledVector(v,w);}}positions.set(sum.toArray(),i*3);}
  const g=original.geometry.clone();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('tissuePosition',new THREE.BufferAttribute(positions.slice(),3));g.setAttribute('skinIndex',new THREE.BufferAttribute(joints,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));g.deleteAttribute('normal');g.computeVertexNormals();
  const sourceMaterials=Array.isArray(original.material)?original.material:[original.material],materials=sourceMaterials.map(m=>{const copy=m.clone();copy.onBeforeCompile=m.onBeforeCompile;copy.customProgramCacheKey=m.customProgramCacheKey;return copy;});
  const mesh=new THREE.SkinnedMesh(g,Array.isArray(original.material)?materials:materials[0]);mesh.name=original.name+' female reference';mesh.userData={...original.userData,female:true,internalReference:true};mesh.frustumCulled=false;mesh.bind(skeleton,new THREE.Matrix4());result.push(mesh);
 }
 return result;
}
