import fs from 'node:fs';
import assert from 'node:assert/strict';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
await MeshoptDecoder.ready;
const raw=fs.readFileSync(new URL('../../assets/modelo3d/anatomia-datos.js',import.meta.url),'utf8');
const encoded=raw.match(/ATLAS_ANATOMY_BASE64="([^"]+)"/)[1];
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});const doc=await io.readBinary(Buffer.from(encoded,'base64'));
const inventory=[];
const transform=(m,v)=>[0,1,2].map(k=>m[k]*v[0]+m[k+4]*v[1]+m[k+8]*v[2]+m[k+12]);
for(const n of doc.getRoot().listNodes()){
 if(!n.getMesh())continue;const skin=n.getSkin(),bind=skin?.getInverseBindMatrices(),joints=skin?.listJoints(),matrices=joints?.map(j=>j.getWorldMatrix());const meta=n.getExtras(),materials=[],bounds=[[Infinity,Infinity,Infinity],[-Infinity,-Infinity,-Infinity]];let vertices=0;
 for(const p of n.getMesh().listPrimitives()){
  const mat=p.getMaterial();materials.push({name:mat.getName(),color:mat.getBaseColorFactor(),roughness:mat.getRoughnessFactor()});const positions=p.getAttribute('POSITION'),v=[],world=n.getWorldMatrix();vertices+=positions.getCount();
  for(let i=0;i<positions.getCount();i++){positions.getElement(i,v);assert(v.every(Number.isFinite));let point=transform(world,v);if(skin){point=[0,0,0];const ids=[],ws=[];p.getAttribute('JOINTS_0').getElement(i,ids);p.getAttribute('WEIGHTS_0').getElement(i,ws);for(let j=0;j<4;j++){if(ws[j]===0)continue;const inverse=[];bind.getElement(ids[j],inverse);const q=transform(matrices[ids[j]],transform(inverse,v));for(let k=0;k<3;k++)point[k]+=q[k]*ws[j];}}for(let k=0;k<3;k++){bounds[0][k]=Math.min(bounds[0][k],point[k]);bounds[1][k]=Math.max(bounds[1][k],point[k]);}}
 }
 inventory.push({...meta,materials,bounds,vertices});
}
fs.writeFileSync('/tmp/exported-anatomy-audit.json',JSON.stringify(inventory));

const manifest=JSON.parse(fs.readFileSync(new URL('../../assets/modelo3d/manifest.json',import.meta.url)));
assert.equal(inventory.length,manifest.structures);assert.equal(inventory.filter(o=>o.source_type==='CURVE').length,manifest.curve_surfaces);assert.deepEqual(manifest.conversion_omissions,[]);
for(const name of ['Oesophagus','Duodenum','Jejunum','Ileum','Ascending colon','Transverse colon','Descending colon','Sigmoid colon','Rectum','Liver','Gallbladder','Pancreas'])assert(inventory.some(o=>o.anatomical_name===name&&o.systems.includes('digestivo')&&o.vertices>12),name);
for(const name of ['Jejunum','Ileum','Rectum'])assert(inventory.find(o=>o.anatomical_name===name).source_id?.startsWith('FMA'));
for(const name of ['Jejunum','Ileum','Rectum']){const o=inventory.find(o=>o.anatomical_name===name),[min,max]=o.bounds;assert(min[0]>-.15&&max[0]<.15&&min[1]>.76&&max[1]<1.13&&min[2]>-.16&&max[2]<.16,`Registro fuera del abdomen/pelvis: ${name}`);}
const nerve=inventory.find(o=>o.anatomical_name==='Anterior commissure');assert(nerve.materials.every(m=>m.color[0]>.79&&m.color[1]>.74),'Sustancia blanca');
assert.equal(Object.keys(manifest.layers).length,13);

for(const kind of ['artery','vein','pulmonary_artery','pulmonary_vein'])assert(inventory.filter(o=>o.vascular_kind===kind).length>10,kind);
const pancreas=inventory.find(o=>o.anatomical_name==='Pancreas');assert(pancreas.systems.includes('endocrino'));
for(const o of inventory){if(o.source_type==='CURVE')assert(o.vertices>2,o.anatomical_name);if(o.vascular_kind==='pulmonary_artery')assert(o.materials.some(m=>m.color[2]>m.color[0]));if(o.vascular_kind==='pulmonary_vein')assert(o.materials.some(m=>m.color[0]>m.color[2]));}
console.log('OK: inventario exportado, 13 capas, curvas con superficie, tubo digestivo añadido, afiliaciones compartidas y colores pulmonares.');
