import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {prepareSurface} from '../../src/superficies.js';
const out={};
for(const sex of ['masculino','femenino']){
 const text=fs.readFileSync(new URL('../../assets/modelo3d/'+(sex==='masculino'?'anatomia-datos.js':'femenino-datos.js'),import.meta.url),'utf8'),bytes=Uint8Array.from(Buffer.from(text.match(/BASE64="([^"]+)"/)[1],'base64'));
 const gltf=await new Promise((resolve,reject)=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes.buffer,'',resolve,reject));gltf.scene.updateMatrixWorld(true);let skin;
 gltf.scene.traverse(o=>{if(o.isSkinnedMesh){o.userData={...o.parent?.userData,...o.userData};if(sex==='femenino'||/^Piel completa/.test(o.userData.anatomical_name||''))skin=o;}});prepareSurface(skin);
 const p=skin.geometry.attributes.tissuePosition,index=skin.geometry.index,used=new Set(),faces=[];
 for(let i=0;i<index.count;i+=3){const tri=[index.getX(i),index.getX(i+1),index.getX(i+2)];if(tri.every(v=>p.getY(v)>.52&&p.getY(v)<1.51&&Math.abs(p.getX(v))<.28)){faces.push(tri);tri.forEach(v=>used.add(v));}}
 const ids=[...used],remap=new Map(ids.map((id,i)=>[id,i]));out[sex]={positions:ids.map(i=>new THREE.Vector3().fromBufferAttribute(p,i).toArray()),faces:faces.map(f=>f.map(i=>remap.get(i)))};
}
fs.writeFileSync('/tmp/cuerpos-colision-ropa.json',JSON.stringify(out));
