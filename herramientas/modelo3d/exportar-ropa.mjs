import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {prepareSurface} from '../../src/superficies.js';
import {patternSportswear} from './patrones-ropa.js';
const output={};
for(const sex of ['masculino','femenino']){
 const raw=fs.readFileSync(new URL('../../assets/modelo3d/'+(sex==='masculino'?'anatomia-datos.js':'femenino-datos.js'),import.meta.url),'utf8'),encoded=raw.match(/BASE64="([^"]+)"/)[1],bytes=Uint8Array.from(Buffer.from(encoded,'base64'));
 const gltf=await new Promise((resolve,reject)=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes.buffer,'',resolve,reject));gltf.scene.updateMatrixWorld(true);let skin;gltf.scene.traverse(o=>{if(o.isMesh){o.userData={...o.parent?.userData,...o.userData};if(sex==='femenino'||/^Piel completa/.test(o.userData.anatomical_name||''))skin=o;}});prepareSurface(skin);skin.userData.female=sex==='femenino';
 const garment=patternSportswear(skin).mesh,g=garment.geometry,bones=garment.skeleton.bones.map(b=>b.name.replace(/^female_/,'')),ref=Object.fromEntries(bones.map((name,i)=>[name,garment.skeleton.bones[i].getWorldPosition(new THREE.Vector3()).toArray()]));
 output[sex]={positions:Array.from(g.attributes.position.array),indices:Array.from(g.index.array),joints:Array.from(g.attributes.skinIndex.array),weights:Array.from(g.attributes.skinWeight.array),parts:Array.from(g.attributes.garmentPart.array),bones,reference:ref};
}
fs.writeFileSync('/tmp/ropa-patrones.json',JSON.stringify(output));console.log('Patrones exportados para unión y confección en Blender.');
