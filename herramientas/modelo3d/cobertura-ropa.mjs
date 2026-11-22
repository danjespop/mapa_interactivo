// Bake occlusion against the finished garments, retaining real neck/arm/leg openings.
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {prepareSurface} from '../../src/superficies.js';
const file=new URL('../../assets/modelo3d/ropa-datos.js',import.meta.url),data=JSON.parse(fs.readFileSync(file,'utf8').split('=')[1].replace(/;\s*$/,''));
function tree(triangles){const box=new THREE.Box3();for(const t of triangles)box.expandByPoint(t.a).expandByPoint(t.b).expandByPoint(t.c);if(triangles.length<12)return {box,triangles};const size=box.getSize(new THREE.Vector3()),axis=size.x>size.y&&size.x>size.z?'x':size.y>size.z?'y':'z';triangles.sort((a,b)=>a.center[axis]-b.center[axis]);const middle=triangles.length>>1;return {box,left:tree(triangles.slice(0,middle)),right:tree(triangles.slice(middle))};}
const hit=new THREE.Vector3();function intersects(node,ray,max){if(!node.box.containsPoint(ray.origin)&&(!ray.intersectBox(node.box,hit)||hit.distanceTo(ray.origin)>max+.005))return false;if(node.triangles)return node.triangles.some(t=>ray.intersectTriangle(t.a,t.b,t.c,false,hit)&&hit.distanceTo(ray.origin)<max);return intersects(node.left,ray,max)||intersects(node.right,ray,max);}
for(const sex of ['masculino','femenino']){
 const raw=fs.readFileSync(new URL('../../assets/modelo3d/'+(sex==='masculino'?'anatomia-datos.js':'femenino-datos.js'),import.meta.url),'utf8'),bytes=Uint8Array.from(Buffer.from(raw.match(/BASE64="([^"]+)"/)[1],'base64'));
 const gltf=await new Promise((resolve,reject)=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes.buffer,'',resolve,reject));gltf.scene.updateMatrixWorld(true);let skin;
 gltf.scene.traverse(o=>{if(o.isSkinnedMesh){o.userData={...o.parent?.userData,...o.userData};if(sex==='femenino'||/^Piel completa/.test(o.userData.anatomical_name||''))skin=o;}});prepareSurface(skin);
 const garment=data[sex],triangles=[];for(let i=0;i<garment.indices.length;i+=3){const [a,b,c]=garment.indices.slice(i,i+3).map(id=>new THREE.Vector3().fromArray(garment.positions,id*3));triangles.push({a,b,c,center:a.clone().add(b).add(c).multiplyScalar(1/3)});}const bvh=tree(triangles);
 const ids=skin.geometry.attributes.skinIndex,weights=skin.geometry.attributes.skinWeight,names=skin.skeleton.bones.map(b=>b.name.replace(/^female_/,''));
 const positions=skin.geometry.attributes.tissuePosition,g=new THREE.BufferGeometry();g.setAttribute('position',positions.clone());g.setIndex(skin.geometry.index.clone());g.computeVertexNormals();const normal=g.attributes.normal,ray=new THREE.Ray(),v=new THREE.Vector3(),n=new THREE.Vector3(),mask=[];
 for(let i=0;i<positions.count;i++){v.fromBufferAttribute(positions,i);n.fromBufferAttribute(normal,i).normalize();ray.set(v.clone().addScaledVector(n,-.009),n);const covered=v.y>.56&&v.y<1.49&&intersects(bvh,ray,.12);let dominant=0;for(let j=1;j<4;j++)if(weights.getComponent(i,j)>weights.getComponent(i,dominant))dominant=j;const lower=/^(pelvis|thigh_|shin_|foot_)/.test(names[ids.getComponent(i,dominant)]);const core=/^(pelvis|spine|chest_|clavicle_)/.test(names[ids.getComponent(i,dominant)]);mask.push(Number((covered&&(core||lower))||v.y<.09||(lower&&v.y>.594&&v.y<.98)||(Math.abs(v.x)<.10&&v.y>.65&&v.y<.98&&Math.abs(v.z)<.20))); }
 garment.coverage=mask;console.log('COBERTURA',sex,mask.length,mask.reduce((a,b)=>a+b,0));
}
fs.writeFileSync(file,'/* Prendas continuas con caída y cobertura geométrica. Ver ATRIBUCIONES.md. */\nglobalThis.ATLAS_SPORTSWEAR='+JSON.stringify(data)+';\n');
