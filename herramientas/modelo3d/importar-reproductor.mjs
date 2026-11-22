/* node herramientas/modelo3d/probar-superficies.cjs herramientas/modelo3d/importar-reproductor.mjs
 * Inputs: v1.3/models/VH_F_*.glb from hubmapconsortium/ccf-releases,
 * commit b036a91aaf7234f462b1249d4a5f4fb0e982f412 (CC BY 4.0).
 * HRA_PELVIS_DIR defaults to /tmp/hra-pelvis. No source scripts are executed.
 */
import fs from 'node:fs';import * as THREE from 'three';import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
const directory=process.env.HRA_PELVIS_DIR||'/tmp/hra-pelvis',parts=[],round=n=>Math.round(n*1e7)/1e7;
const dictionary={abdominal_ostium_of_uterine_tube:['Abdominal ostium of uterine tube','Orificio abdominal de la trompa uterina'],body_of_uterus:['Body of uterus','Cuerpo del útero'],fundus_of_uterus:['Fundus of uterus','Fondo del útero'],cornua:['Uterine horns','Cuernos uterinos'],lower_uterine_segment:['Lower uterine segment','Segmento uterino inferior'],posterior_wall_of_uterus:['Posterior wall of uterus','Pared posterior del útero'],anterior_wall_of_uterus:['Anterior wall of uterus','Pared anterior del útero'],cervix:['Cervix of uterus','Cuello uterino'],internal_cervical_os:['Internal cervical os','Orificio cervical interno'],external_cervical_os:['External cervical os','Orificio cervical externo'],left_ovary:['Ovary.l','Ovario'],right_ovary:['Ovary.r','Ovario'],ampulla_of_uterine_tube:['Ampulla of uterine tube','Ampolla de la trompa uterina'],isthmus_of_fallopian_tube:['Isthmus of uterine tube','Istmo de la trompa uterina'],fibria_of_uterine_tube:['Fimbriae of uterine tube','Fimbrias de la trompa uterina'],uterine_tube_infundibulum:['Infundibulum of uterine tube','Infundíbulo de la trompa uterina']};
Object.assign(dictionary,{fundus_of_urinary_bladder_dome:['Dome of urinary bladder','Cúpula de la vejiga urinaria'],urinary_bladder_neck_smooth_muscle:['Neck of urinary bladder','Cuello de la vejiga urinaria'],fundus_of_urinary_bladder_base:['Base of urinary bladder','Base de la vejiga urinaria'],trigone_of_urinary_bladder:['Trigone of urinary bladder','Trígono de la vejiga urinaria'],ureteral_orifice:['Ureteral orifice','Orificio ureteral']});
let pelvisBounds;
for(const organ of ['Pelvis','Uterus','Ovary_L','Ovary_R','Fallopian_Tube_L','Fallopian_Tube_R','Urinary_Bladder']){
 const buffer=fs.readFileSync(directory+'/VH_F_'+organ+'.glb'),gltf=await new Promise((r,j)=>new GLTFLoader().parse(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength),'',r,j));gltf.scene.updateMatrixWorld(true);
 if(organ==='Pelvis'){const box=new THREE.Box3().setFromObject(gltf.scene);pelvisBounds={min:box.min.toArray(),max:box.max.toArray()};continue;}
 gltf.scene.traverse(mesh=>{if(!mesh.isMesh)return;const raw=mesh.name.replace(/^VH_F_/,''),side=/_(L|R)$/.exec(raw)?.[1],base=raw.replace(/_(L|R)$/,''),names=dictionary[base]||dictionary[raw];if(!names)throw new Error('Unmapped HRA structure: '+raw);
 const geometry=mesh.geometry,position=geometry.attributes.position,v=new THREE.Vector3(),positions=[];for(let i=0;i<position.count;i++){v.fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);positions.push(...v.toArray().map(round));}
 const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
 parts.push({name:names[0]+(side?'.'+side.toLowerCase():''),es:names[1],sourceName:mesh.name,system:organ==='Urinary_Bladder'?'urinario':'reproductor',organ,positions,indices:geometry.index?Array.from(geometry.index.array):Array.from({length:position.count},(_,i)=>i),color:material.color.getHexString()});
 });
}
const data={source:'Human Reference Atlas / HuBMAP CCF 3D Reference Object Library',creators:['Kristen Browne','Heidi Schlehlein'],license:'CC BY 4.0',repository:'https://github.com/hubmapconsortium/ccf-releases',commit:'b036a91aaf7234f462b1249d4a5f4fb0e982f412',release:'v1.3',pelvisBounds,parts};
fs.writeFileSync(new URL('../../assets/modelo3d/reproductor-femenino-datos.js',import.meta.url),'/* Human Reference Atlas / HuBMAP, Kristen Browne & Heidi Schlehlein. CC BY 4.0. See ATRIBUCIONES.md. */\nwindow.ATLAS_FEMALE_REPRODUCTIVE='+JSON.stringify(data)+';\n');
console.log('HRA:',parts.length,'surfaces,',parts.reduce((n,p)=>n+p.positions.length/3,0),'vertices');
