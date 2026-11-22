import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {motionAt,durations} from '../../src/movimientos.js';
import {addChest} from '../../src/realismo-corporal.js';
import {motionAxes,prepareSurface,sportswear} from '../../src/superficies.js';
const clothing=fs.readFileSync(new URL('../../assets/modelo3d/ropa-datos.js',import.meta.url),'utf8');globalThis.ATLAS_SPORTSWEAR=JSON.parse(clothing.split('=')[1].replace(/;\s*$/,''));
for(const sex of ['masculino','femenino']){
 const file=sex==='masculino'?'anatomia-datos.js':'femenino-datos.js';
 const text=fs.readFileSync(new URL('../../assets/modelo3d/'+file,import.meta.url),'utf8'),encoded=text.match(/BASE64="([^"]+)"/)[1],bytes=Uint8Array.from(Buffer.from(encoded,'base64'));
 const gltf=await new Promise((resolve,reject)=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes.buffer,'',resolve,reject));
 const body=new THREE.Group();body.add(gltf.scene);body.updateMatrixWorld(true);const bones={},rest={},meshes=[];
 gltf.scene.traverse(o=>{if(o.isBone){const name=o.name.replace(/^female_/,'');bones[name]=o;rest[name]=o.quaternion.clone();o.userData.motionAxes=motionAxes(o,body);}if(o.isMesh){o.userData={...o.parent?.userData,...o.userData};meshes.push(o);}});
 if(sex==='masculino'){
  const bad=[];let count=0;
  for(const mesh of meshes){if(!mesh.isSkinnedMesh)continue;const ids=mesh.geometry.getAttribute('skinIndex'),weights=mesh.geometry.getAttribute('skinWeight'),v=new THREE.Vector3();
   for(let i=0;i<ids.count;i+=3){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);if(v.y>.86||Math.abs(v.x)>.19||Math.abs(v.z)>.20)continue;count++;
    for(let j=0;j<4;j++)if(weights.getComponent(i,j)>.00001&&/^(upperarm|forearm|hand|finger|clavicle)_/.test(mesh.skeleton.bones[ids.getComponent(i,j)].name)){bad.push({name:mesh.userData.anatomical_name,bone:mesh.skeleton.bones[ids.getComponent(i,j)].name,weight:weights.getComponent(i,j),point:v.toArray()});break;}
   }
  }
  console.log('Auditoría piernas/pelvis',count,'vértices, anomalías',bad.length,JSON.stringify(bad.slice(0,12)));assert.equal(bad.length,0,'Mallas inferiores vinculadas a miembros superiores');
 }
 const skin=meshes.find(o=>sex==='femenino'||/^Piel completa/.test(o.userData.anatomical_name||''));assert(skin?.isSkinnedMesh);
 skin.userData.female=sex==='femenino';prepareSurface(skin);const chest=addChest(skin,bones.spine,sex==='femenino'?'female_':'');chest.joints.forEach(b=>{const name=b.name.replace(/^female_/,'');bones[name]=b;rest[name]=b.quaternion.clone();b.userData.motionAxes=motionAxes(b,body);});const garment=sportswear(skin);body.add(garment.mesh);
 const clothGeometry=garment.mesh.geometry,partAttr=clothGeometry.getAttribute('garmentPart'),indexAttr=clothGeometry.index;
 for(const part of [0,1]){const adjacency=new Map();for(let i=0;i<indexAttr.count;i+=3){const tri=[indexAttr.getX(i),indexAttr.getX(i+1),indexAttr.getX(i+2)];if(partAttr.getX(tri[0])!==part)continue;for(const v of tri){if(!adjacency.has(v))adjacency.set(v,new Set());tri.forEach(other=>adjacency.get(v).add(other));}}const visited=new Set();let components=0;for(const v of adjacency.keys()){if(visited.has(v))continue;components++;const queue=[v];visited.add(v);while(queue.length){const current=queue.pop();for(const other of adjacency.get(current))if(!visited.has(other)){visited.add(other);queue.push(other);}}}assert.equal(components,1,'Cada prenda debe ser una superficie continua');}
 assert(garment.mesh.children.filter(o=>o.userData.shoe).length>=2,'Zapatillas incluidas');
 assert(garment.mesh.geometry.index.count>10000,'La prenda debe cubrir tronco y piernas');
 if(sex==='masculino')assert(bones.thumb_base_L&&bones.thumb_base_R,'Oposición carpometacarpiana');
 assert(bones.finger_0_0_L.userData.flexion_axis,'Eje anatómico de flexión');
 const get=(mesh,i)=>mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);
 const indices=skin.geometry.index,edges=[],step=Math.max(3,Math.floor(indices.count/7000/3)*3);
 for(let n=0;n<indices.count;n+=step){const a=indices.getX(n),b=indices.getX(n+1),length=get(skin,a).distanceTo(get(skin,b));if(length>.0005)edges.push([a,b,length]);}
 if(sex==='masculino'){
  let fasciaCount=0;
  for(const fascia of meshes.filter(o=>o.userData.system==='fascias'&&/abdominal|thoracolumbar/i.test(o.userData.anatomical_name||''))){
   const ids=fascia.geometry.getAttribute('skinIndex'),weights=fascia.geometry.getAttribute('skinWeight');
   for(let i=0;i<ids.count;i++)for(let j=0;j<4;j++)if(weights.getComponent(i,j)>.01)assert(!/hand|finger|forearm/.test(fascia.skeleton.bones[ids.getComponent(i,j)].name),'Fascia axial arrastrada por una mano');
   fasciaCount++;
  }
  assert(fasciaCount>=2);
 }
 const attr=skin.geometry.getAttribute('tissuePosition'),si=skin.geometry.getAttribute('skinIndex'),sw=skin.geometry.getAttribute('skinWeight');let checked=0;
 for(let i=0;i<attr.count;i+=7){const x=Math.abs(attr.getX(i)),y=attr.getY(i);if(Math.abs(attr.getZ(i))<.14&&(x<.09&&y>1.0&&y<1.2||x>.04&&x<.11&&y>.46&&y<.78)){for(let j=0;j<4;j++)if(sw.getComponent(i,j)>.01)assert(!/hand|finger|forearm/.test(skin.skeleton.bones[si.getComponent(i,j)].name),'Piel axial o muslo siguiendo la mano');checked++;}}
 assert(checked>500);let worstP99=0,worstMax=0;const garmentAttribute=garment.mesh.geometry.getAttribute('tissuePosition'),part=garment.mesh.geometry.getAttribute('garmentPart');assert(garmentAttribute.count>1000);assert(skin.geometry.getAttribute('clothingMask'));
 const trouserRest=Array.from({length:garmentAttribute.count},(_,i)=>part.getX(i)===0?get(garment.mesh,i):null);
 for(const mode of ['peso','caminar','saltar'])for(const phase of [.05,.28,.52,.79]){
  const state=motionAt(mode,durations[mode]*phase);
  for(const[name,bone]of Object.entries(bones)){bone.quaternion.copy(rest[name]);const angles=state.joints[name]||[0,0,0];angles.forEach((angle,j)=>bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(bone.userData.motionAxes[j],angle)));}
  body.updateMatrixWorld(true);skin.skeleton.update();garment.mesh.skeleton.update();
  const stretch=edges.map(([a,b,length])=>get(skin,a).distanceTo(get(skin,b))/length).sort((a,b)=>a-b);
  worstP99=Math.max(worstP99,stretch[Math.floor(stretch.length*.99)]);worstMax=Math.max(worstMax,stretch.at(-1));
  for(let i=0;i<garmentAttribute.count;i+=3)assert(get(garment.mesh,i).toArray().every(Number.isFinite),'Prenda deformada finita');
 }
 console.log(sex,{checked,edges:edges.length,stretchP99:worstP99,maxStretch:worstMax,garmentVertices:garmentAttribute.count});
 assert(worstP99<2.3,'Estiramiento extendido de superficie');assert(worstMax<5,'Picos locales de estiramiento');
 for(const[name,bone]of Object.entries(bones))bone.quaternion.copy(rest[name]);
 const armMotion=motionAt('peso',1.25);for(const[name,angles]of Object.entries(armMotion.joints)){if(!/^(upperarm|forearm|hand|finger|thumb_base|clavicle)_/.test(name)||!bones[name])continue;angles.forEach((angle,j)=>bones[name].quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(bones[name].userData.motionAxes[j],angle)));}body.updateMatrixWorld(true);garment.mesh.skeleton.update();for(let i=0;i<trouserRest.length;i++)if(trouserRest[i])assert(get(garment.mesh,i).distanceTo(trouserRest[i])<.00001,'Pantalón arrastrado al mover los brazos');
}
console.log('OK: piel sin influencias de manos en muslos/tronco, ejes digitales, estiramiento de superficie y prenda ligada en ambos cuerpos.');
