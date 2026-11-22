import fs from 'node:fs';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
await MeshoptDecoder.ready;
const raw=fs.readFileSync(new URL('../../assets/modelo3d/anatomia-datos.js',import.meta.url),'utf8');
const encoded=raw.match(/ATLAS_ANATOMY_BASE64="([^"]+)"/)[1];
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});const doc=await io.readBinary(Buffer.from(encoded,'base64'));
let muscles=0,axial=0,digits=0;
for(const node of doc.getRoot().listNodes()){
 const mesh=node.getMesh(),skin=node.getSkin(),meta=node.getExtras();if(!mesh||!skin)continue;
 const name=(meta.anatomical_name||'').toLowerCase(),jointNames=skin.listJoints().map(n=>n.getName());let allowed=null;
 if(meta.system==='muscular'&&/rectus abdominis|serratus anterior|serratus posterior|intercostal|abdominal oblique/.test(name)){allowed=n=>['spine','pelvis','clavicle_L','clavicle_R'].includes(n);axial++;}
 else if(/pectoralis major|latissimus/.test(name)){allowed=n=>['spine','pelvis','clavicle_L','clavicle_R','upperarm_L','upperarm_R'].includes(n);axial++;}
 else if(meta.system==='muscular'&&/trapezius|rhomboid major|rhomboid minor|levator scapulae|pectoralis minor/.test(name)){allowed=n=>['spine','pelvis','neck','clavicle_L','clavicle_R'].includes(n);axial++;}
 else if(meta.system==='muscular'&&meta.region==='upper'){allowed=n=>/^(clavicle|upperarm|forearm|hand|finger)_/.test(n);muscles++;}
 else if(meta.system==='muscular'&&meta.region==='lower'){allowed=n=>n==='pelvis'||/^(thigh|shin|foot)_/.test(n);muscles++;}
 if(/phalanx.*of hand/.test(name)){allowed=n=>n.startsWith('finger_');digits++;}
 if(!allowed)continue;
 for(const primitive of mesh.listPrimitives()){
  const indices=primitive.getAttribute('JOINTS_0'),weights=primitive.getAttribute('WEIGHTS_0'),ids=[],ws=[];if(!indices||!weights)continue;
  for(let i=0;i<indices.getCount();i++){indices.getElement(i,ids);weights.getElement(i,ws);for(let j=0;j<ws.length;j++)if(ws[j]>.001)assert(allowed(jointNames[ids[j]]),`${name}: influencia ajena a su región: ${jointNames[ids[j]]}`);}
 }
}
assert(axial>=15);assert(muscles>=100);assert.equal(digits,28);console.log(`OK: ${axial} músculos axiales, ${muscles} músculos de extremidades sin influencias cruzadas y ${digits} falanges con articulación propia.`);
