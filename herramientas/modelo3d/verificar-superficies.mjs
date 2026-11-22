import fs from 'node:fs';
import {prepareAnatomicalJoints,prepareHips,prepareAxialReferences} from '../../src/articulaciones-anatomicas.js';
import {fitInternalReference} from '../../src/referencia-interna.js';
let maleMeshes,maleBones;
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {motionAt,durations} from '../../src/movimientos.js';
import {BodyContacts} from '../../src/contactos-cuerpo.js';
import {prepareShoulders} from '../../src/movilidad-hombros.js';
import {poseHands,palmFrame,dumbbell} from '../../src/manos.js';
import {longHair,addChest} from '../../src/realismo-corporal.js';
import {motionAxes,prepareSurface,sportswear} from '../../src/superficies.js';
const clothing=fs.readFileSync(new URL('../../assets/modelo3d/ropa-datos.js',import.meta.url),'utf8');globalThis.ATLAS_SPORTSWEAR=JSON.parse(clothing.split('=')[1].replace(/;\s*$/,''));
for(const sex of ['masculino','femenino']){
 const file=sex==='masculino'?'anatomia-datos.js':'femenino-datos.js';
 const text=fs.readFileSync(new URL('../../assets/modelo3d/'+file,import.meta.url),'utf8'),encoded=text.match(/BASE64="([^"]+)"/)[1],bytes=Uint8Array.from(Buffer.from(encoded,'base64'));
 const gltf=await new Promise((resolve,reject)=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes.buffer,'',resolve,reject));
 const body=new THREE.Group();body.add(gltf.scene);body.updateMatrixWorld(true);const bones={},rest={},meshes=[];
 gltf.scene.traverse(o=>{if(o.isBone){const name=o.name.replace(/^female_/,'');bones[name]=o;rest[name]=o.quaternion.clone();o.userData.motionAxes=motionAxes(o,body);o.userData.referenceWorld=o.matrixWorld.clone();}if(o.isMesh){o.userData={...o.parent?.userData,...o.userData};meshes.push(o);}});
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
 skin.userData.female=sex==='femenino';prepareSurface(skin);meshes.filter(o=>o.isSkinnedMesh).forEach(prepareSurface);prepareShoulders(skin);prepareAxialReferences(meshes,bones);prepareHips(meshes,bones);const helpers=prepareAnatomicalJoints(meshes,bones);for(const b of Object.values(helpers)){const n=b.name.replace(/^female_/,'');rest[n]=b.quaternion.clone();b.userData.referenceWorld=b.matrixWorld.clone();b.userData.motionAxes=motionAxes(b,body);}
 if(sex==='masculino'){maleMeshes=meshes;maleBones=bones;}else{const internals=fitInternalReference(maleMeshes,maleBones,bones,skin);for(const mesh of internals){body.add(mesh);meshes.push(mesh);}assert(internals.length>2000,'Referencia interna adaptada al esqueleto femenino');for(const mesh of internals){assert(mesh.skeleton.bones.every(b=>b.name.startsWith('female_')),'Cada capa femenina utiliza sus propias articulaciones');for(let i=0;i<mesh.geometry.attributes.position.count;i+=23){const v=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld),w=mesh.geometry.attributes.skinWeight;assert(v.y>-.1&&v.y<1.85&&Math.abs(v.x)<.45&&Math.abs(v.z)<.45,'Referencia femenina en escala corporal real');if(/frontal bone|parietal bone|occipital bone|temporal bone/i.test(mesh.userData.anatomical_name||''))assert(v.y<1.735,'Cráneo contenido en la altura de la cabeza femenina');let sum=0;for(let j=0;j<4;j++)sum+=w.getComponent(i,j);assert(Math.abs(sum-1)<.002,'Pesos normalizados tras adaptar la referencia');}}}
 const chest=addChest(skin,bones.spine,sex==='femenino'?'female_':'');chest.joints.forEach(b=>{const name=b.name.replace(/^female_/,'');bones[name]=b;rest[name]=b.quaternion.clone();b.userData.motionAxes=motionAxes(b,body);});const garment=sportswear(skin);body.add(garment.mesh);
 const contact=new BodyContacts(skin,bones,rest,body);contact.shoes(garment.mesh);for(const side of ['L','R'])contact.load(side,dumbbell(bones,side,sex==='femenino'));
 if(sex==='femenino'){const hair=longHair(skin,bones.head);body.updateMatrixWorld(true);for(const mesh of hair.meshes){const bounds=new THREE.Box3().setFromObject(mesh);assert(bounds.min.y>1.20&&bounds.max.y<1.85,'Todo mechón permanece en cabeza/cola, sin líneas hasta pies');}}
 if(sex==='masculino')for(const mesh of meshes.filter(o=>/^(Ulna|Radius)\.[lr]$/.test(o.userData.anatomical_name||''))){const name=mesh.userData.anatomical_name,expected=(name.startsWith('Ulna')?'forearm_':'pronation_')+(name.endsWith('.l')?'L':'R'),ids=mesh.geometry.attributes.skinIndex,ws=mesh.geometry.attributes.skinWeight;for(let i=0;i<ids.count;i+=5)for(let j=0;j<4;j++)if(ws.getComponent(i,j)>.001)assert.equal(mesh.skeleton.bones[ids.getComponent(i,j)].name,expected,'Radio y cúbito con articulaciones propias');}
 const clothGeometry=garment.mesh.geometry,partAttr=clothGeometry.getAttribute('garmentPart'),indexAttr=clothGeometry.index;
 for(const part of [0,1]){const adjacency=new Map();for(let i=0;i<indexAttr.count;i+=3){const tri=[indexAttr.getX(i),indexAttr.getX(i+1),indexAttr.getX(i+2)];if(partAttr.getX(tri[0])!==part)continue;for(const v of tri){if(!adjacency.has(v))adjacency.set(v,new Set());tri.forEach(other=>adjacency.get(v).add(other));}}const visited=new Set();let components=0;for(const v of adjacency.keys()){if(visited.has(v))continue;components++;const queue=[v];visited.add(v);while(queue.length){const current=queue.pop();for(const other of adjacency.get(current))if(!visited.has(other)){visited.add(other);queue.push(other);}}}assert.equal(components,1,'Cada prenda debe ser una superficie continua');}
 const clothPosition=clothGeometry.attributes.position;for(let i=0;i<clothPosition.count;i++){assert(Math.abs(clothPosition.getX(i))<.24&&clothPosition.getY(i)>.54&&clothPosition.getY(i)<1.49&&Math.abs(clothPosition.getZ(i))<.27,'Tela fuera de la zona de confección');}
 for(let i=0;i<indexAttr.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(clothPosition,indexAttr.getX(i)),b=new THREE.Vector3().fromBufferAttribute(clothPosition,indexAttr.getX(i+1));assert(a.distanceTo(b)<.28,'Arista de tela inestable');}
 assert.equal(globalThis.ATLAS_SPORTSWEAR[sex].coverage.length,skin.geometry.attributes.position.count,'Cobertura horneada para la piel distribuida');
 const coverage=globalThis.ATLAS_SPORTSWEAR[sex].coverage,skinIds=skin.geometry.attributes.skinIndex,skinWeights=skin.geometry.attributes.skinWeight;
 for(let i=0;i<coverage.length;i+=5){let j=0;for(let k=1;k<4;k++)if(skinWeights.getComponent(i,k)>skinWeights.getComponent(i,j))j=k;const name=skin.skeleton.bones[skinIds.getComponent(i,j)].name;if(/forearm_|hand_|finger_/.test(name))assert.equal(coverage[i],0,'Camiseta sin mangas no oculta antebrazos ni manos');}

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
 const breastRest=sex==='femenino'?Array.from({length:attr.count},(_,i)=>Math.abs(attr.getX(i))>.04&&Math.abs(attr.getX(i))<.11&&attr.getY(i)>1.20&&attr.getY(i)<1.34&&attr.getZ(i)>.14?[i,get(skin,i)]:null).filter(Boolean):[];
 const trouserRest=Array.from({length:garmentAttribute.count},(_,i)=>part.getX(i)===0?get(garment.mesh,i):null);
 for(const mode of ['peso','caminar','saltar'])for(const phase of [.05,.28,.52,.79]){
  const state=motionAt(mode,durations[mode]*phase);
  for(const[name,bone]of Object.entries(bones)){bone.quaternion.copy(rest[name]);const angles=state.joints[name]||[0,0,0];angles.forEach((angle,j)=>bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(bone.userData.motionAxes[j],angle)));}
  body.updateMatrixWorld(true);skin.skeleton.update();garment.mesh.skeleton.update();
  const stretch=edges.map(([a,b,length])=>get(skin,a).distanceTo(get(skin,b))/length).sort((a,b)=>a-b);
  worstP99=Math.max(worstP99,stretch[Math.floor(stretch.length*.99)]);worstMax=Math.max(worstMax,stretch.at(-1));
  for(let i=0;i<garmentAttribute.count;i+=3)assert(get(garment.mesh,i).toArray().every(Number.isFinite),'Prenda deformada finita');
 }
 // Dense axillary samples catch local pinching missed by the global edge sample.
 const underarmEdges=[];for(let i=0;i<indices.count;i+=3){const a=indices.getX(i),b=indices.getX(i+1),p=new THREE.Vector3().fromBufferAttribute(attr,a),q=new THREE.Vector3().fromBufferAttribute(attr,b),length=p.distanceTo(q);if(Math.abs(p.x)>.10&&Math.abs(p.x)<.23&&p.y>1.27&&p.y<1.45&&length>.001)underarmEdges.push([a,b,length]);}
 const reach=motionAt('saltar',durations.saltar*.55);for(const[name,bone]of Object.entries(bones)){bone.quaternion.copy(rest[name]);(reach.joints[name]||[0,0,0]).forEach((angle,j)=>bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(bone.userData.motionAxes[j],angle)));}body.updateMatrixWorld(true);skin.skeleton.update();
 const axillaryMax=Math.max(...underarmEdges.map(([a,b,length])=>get(skin,a).distanceTo(get(skin,b))/length));assert(axillaryMax<(sex==='masculino'?4.8:2.5),'Sin picos previos de estiramiento axilar');console.log('Axilas',sex,underarmEdges.length,'aristas, máximo',axillaryMax);
 for(const mode of ['caminar','correr','saltar','peso','sentarse'])for(let frame=0;frame<80;frame++){
  const state=motionAt(mode,durations[mode]*frame/80);body.position.y=0;
  for(const[name,bone]of Object.entries(bones)){bone.quaternion.copy(rest[name]);(state.joints[name]||[0,0,0]).forEach((angle,j)=>bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(bone.userData.motionAxes[j],angle)));}
  body.updateMatrixWorld(true);const hinge=bones.forearm_L.quaternion.clone();poseHands(bones,body,state);assert(hinge.equals(bones.forearm_L.quaternion),'Pronar la mano no gira el cúbito ni altera la bisagra del codo');const gap=contact.solve(state.joints,1/60,true,true,mode==='peso');
  for(const side of ['L','R']){const frame=palmFrame(bones,side),shaft=bones['hand_'+side].getWorldPosition(new THREE.Vector3()).sub(bones['forearm_'+side].getWorldPosition(new THREE.Vector3())).normalize();assert(frame.forward.dot(shaft)>.985,'Muñeca alineada con el antebrazo en todos los gestos');if(mode==='peso'){const load=contact.loads[side],center=load.getWorldPosition(new THREE.Vector3()),grip=frame.wrist.clone().lerp(frame.middle,1.08).addScaledVector(frame.palm,.034),axis=new THREE.Vector3(1,0,0).applyQuaternion(load.getWorldQuaternion(new THREE.Quaternion()));assert(center.distanceTo(grip)<.002,'Barra dentro del agarre de la palma');assert(Math.abs(axis.dot(frame.across))>.99,'Barra transversal a los dedos');for(let digit=1;digit<5;digit++){const b=bones['finger_'+digit+'_2_'+side],tip=b.getWorldPosition(new THREE.Vector3()),previous=b.parent.getWorldPosition(new THREE.Vector3());tip.addScaledVector(tip.clone().sub(previous).normalize(),.012);load.worldToLocal(tip);const radius=Math.hypot(tip.y,tip.z);assert(radius>.015&&radius<.040,'Dedos envuelven el mango sin atravesar su eje');}assert(contact.offset[side]<.45,'Separación de carga sin abducción excesiva');}if(mode==='correr')assert(frame.palm.x*(side==='L'?-1:1)>.65,'Palmas de carrera hacia dentro');}

  assert(gap>=.0035,`${sex} ${mode} fase ${frame}: mano dentro del muslo (${gap})`);
  const sole=contact.lowestSole(true);assert(Number.isFinite(sole));body.position.y=-.003-sole+state.height;body.updateMatrixWorld(true);
  assert(Math.abs(contact.lowestSole(true)+.003-state.height)<1e-5,'Suela real apoyada sobre el suelo');
 }
 console.log(sex,{checked,edges:edges.length,stretchP99:worstP99,maxStretch:worstMax,garmentVertices:garmentAttribute.count});
 assert(worstP99<2.3,'Estiramiento extendido de superficie');assert(worstMax<5,'Picos locales de estiramiento');
 for(const[name,bone]of Object.entries(bones))bone.quaternion.copy(rest[name]);
 body.position.y=0;body.updateMatrixWorld(true);
 const armMotion=motionAt('peso',1.25);for(const[name,angles]of Object.entries(armMotion.joints)){if(!/^(upperarm|forearm|hand|finger|thumb_base|clavicle)_/.test(name)||!bones[name])continue;angles.forEach((angle,j)=>bones[name].quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(bones[name].userData.motionAxes[j],angle)));}body.updateMatrixWorld(true);garment.mesh.skeleton.update();skin.skeleton.update();for(const [i,p]of breastRest)assert(get(skin,i).distanceTo(p)<.005,'La región mamaria sigue el tórax al mover brazos');for(let i=0;i<trouserRest.length;i++)if(trouserRest[i])assert(get(garment.mesh,i).distanceTo(trouserRest[i])<.00001,'Pantalón arrastrado al mover los brazos');
}
console.log('OK: piel sin influencias de manos en muslos/tronco, ejes digitales, estiramiento de superficie y prenda ligada en ambos cuerpos.');
