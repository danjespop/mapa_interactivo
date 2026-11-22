import * as THREE from 'three';
import {sportsShoes} from './zapatillas.js';
// Bind-space coordinates keep pores, fibres and fabric attached to the moving mesh.
export function prepareSurface(mesh){
 if(mesh.geometry.hasAttribute('tissuePosition'))return;
 mesh.skeleton?.update();mesh.updateWorldMatrix(true,false);
 const array=new Float32Array(mesh.geometry.attributes.position.count*3),v=new THREE.Vector3();
 for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);array.set([v.x,v.y,v.z],i*3);}
 mesh.geometry.setAttribute('tissuePosition',new THREE.BufferAttribute(array,3));
}
export function motionAxes(bone,body){
 const inverse=body.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(bone.getWorldQuaternion(new THREE.Quaternion())).invert();
 const axes=[new THREE.Vector3(1,0,0),new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)];
 if(bone.userData.flexion_axis)axes[0].fromArray(bone.userData.flexion_axis).normalize();
 return axes.map(a=>a.applyQuaternion(inverse));
}
function setCoverage(skin,data){
 if(data.coverage?.length===skin.geometry.attributes.position.count){skin.geometry.setAttribute('clothingMask',new THREE.Float32BufferAttribute(data.coverage,1));return;}
 prepareSurface(skin);const p=skin.geometry.attributes.tissuePosition,ids=skin.geometry.attributes.skinIndex,weights=skin.geometry.attributes.skinWeight,names=skin.skeleton.bones.map(b=>b.name.replace(/^female_/,'')),mask=new Float32Array(p.count);
 for(let i=0;i<p.count;i++){
  let best=-1,index=0;for(let j=0;j<4;j++)if(weights.getComponent(i,j)>best){best=weights.getComponent(i,j);index=ids.getComponent(i,j);}const name=names[index],x=p.getX(i),y=p.getY(i),z=p.getZ(i),core=/^(pelvis|spine|chest_)/.test(name),lower=/^(pelvis|thigh_|shin_|foot_)/.test(name),top=1.27+(z>0?.080:.145)*Math.max(0,1-(Math.abs(x)/.145)**2);mask[i]=Number((core&&y>.950&&y<top-.009)||(lower&&y>.595&&y<1.0)||(lower&&y<.090));
 }
 skin.geometry.setAttribute('clothingMask',new THREE.BufferAttribute(mask,1));
}
function finishSportswear(skin,geometry,parts){
 const colors=new Float32Array(parts.length*3),shirt=new THREE.Color('#365f7b'),pants=new THREE.Color('#343d48');const paint=()=>{for(let i=0;i<parts.length;i++){const c=parts[i]?shirt:pants;colors.set([c.r,c.g,c.b],i*3);}if(geometry.hasAttribute('color'))geometry.getAttribute('color').needsUpdate=true;else geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));};paint();
 const centers=Array.from({length:8},()=>new THREE.Vector3(100,100,100)),radii=Array.from({length:8},()=>new THREE.Vector3(1,1,1)),material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.91,side:THREE.DoubleSide});
 material.onBeforeCompile=shader=>{shader.uniforms.workCenters={value:centers};shader.uniforms.workRadii={value:radii};shader.vertexShader='attribute vec3 tissuePosition;varying vec3 vFabricPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFabricPosition=tissuePosition;');shader.fragmentShader='varying vec3 vFabricPosition;uniform vec3 workCenters[8];uniform vec3 workRadii[8];\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float knit=sin(vFabricPosition.x*1900.0)*sin(vFabricPosition.y*2300.0);diffuseColor.rgb*=.98+.02*knit;
float hem=1.0-smoothstep(.002,.007,abs(vFabricPosition.y-.95));diffuseColor.rgb*=1.0-.12*hem;
float target=0.0;for(int i=0;i<8;i++){vec3 q=(vFabricPosition-workCenters[i])/workRadii[i];target=max(target,1.0-smoothstep(.72,1.0,length(q)));}diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,.43,.045),target*.85);`);};material.customProgramCacheKey=()=> 'atlas-sportswear-tailored-v2';
 const mesh=new THREE.SkinnedMesh(geometry,material),skeleton=new THREE.Skeleton(skin.skeleton.bones);skeleton.calculateInverses();mesh.bind(skeleton,new THREE.Matrix4());mesh.frustumCulled=false;sportsShoes(skin,skeleton).forEach(shoe=>mesh.add(shoe));mesh.userData={sportswear:true,crotchPanel:true,female:!!skin.userData.female,anatomical_name:'Ropa deportiva · mapa muscular orientativo'};
 return {mesh,centers,radii,design(top,bottom){shirt.set(top);pants.set(bottom);paint();},targets(boxes){for(let i=0;i<8;i++){const box=boxes[i];if(!box){centers[i].set(100,100,100);continue;}box.getCenter(centers[i]);box.getSize(radii[i]).multiplyScalar(.5).add(new THREE.Vector3(.022,.022,.065));}}};
}

export function sportswear(skin){
 const data=globalThis.ATLAS_SPORTSWEAR?.[skin.userData.female?'femenino':'masculino'];if(!data)throw new Error('Falta el modelo de ropa deportiva.');
 // Reuse the anatomical coverage mask, but render the continuous garments made in Blender.
 setCoverage(skin,data);
 const names=skin.skeleton.bones.map(b=>b.name.replace(/^female_/,'')),mapped=data.bones.map(name=>names.indexOf(name)),indices=Uint16Array.from(data.joints.map(id=>mapped[id]));
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));g.setAttribute('tissuePosition',new THREE.Float32BufferAttribute(data.positions,3));g.setAttribute('skinIndex',new THREE.BufferAttribute(indices,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(data.weights,4));g.setAttribute('garmentPart',new THREE.Float32BufferAttribute(data.parts,1));g.setIndex(data.indices);g.computeVertexNormals();return finishSportswear(skin,g,data.parts.map(v=>!!v));
}
