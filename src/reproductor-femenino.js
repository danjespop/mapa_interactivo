import * as THREE from 'three';
export const reproductiveSource='Human Reference Atlas / HuBMAP CCF 3D Reference Object Library, Kristen Browne y Heidi Schlehlein, referencias femeninas de útero, ovarios, trompas y vejiga en la distribución v1.3; CC BY 4.0. https://github.com/hubmapconsortium/ccf-releases/tree/b036a91aaf7234f462b1249d4a5f4fb0e982f412/v1.3. Registro educativo en la pelvis MakeHuman; no es un registro clínico.';
const reconstructionSource='Reconstrucción didáctica propia del canal vaginal: superficie de pared aplanada, fórnices y pliegues simplificados, conectada al cuello uterino del Human Reference Atlas. No procede de una segmentación anatómica del HRA ni reproduce la anatomía de una persona. Referencia descriptiva: OpenStax Anatomy and Physiology 2e, 27.2, Anatomy and Physiology of the Female Reproductive System.';
function vaginalWall(cervix,outlet){
 const positions=[],indices=[],rings=40,sides=48,axis=outlet.clone().sub(cervix).normalize(),across=new THREE.Vector3(1,0,0),depth=across.clone().cross(axis).normalize();
 // Two continuous walls with shallow transverse folds and an upper fornix.
 // The canal is flattened, with open ends; it is not an inflated cylinder.
 for(let wall=0;wall<2;wall++)for(let r=0;r<=rings;r++){
  const t=r/rings,center=cervix.clone().lerp(outlet,t);center.addScaledVector(depth,-.003*Math.sin(Math.PI*t));
  const flare=(1-THREE.MathUtils.smoothstep(t,0,.22)),rx=THREE.MathUtils.lerp(.013,.010,t)+.004*flare,rz=THREE.MathUtils.lerp(.007,.004,t)+.004*flare,thickness=wall===0?0:.0016;
  for(let s=0;s<sides;s++){const a=s/sides*Math.PI*2,fold=wall===1?.00035*Math.sin(t*Math.PI*24)*Math.sin(Math.PI*t):0,x=(rx-thickness+fold)*Math.cos(a),z=(rz-thickness+fold*.4)*Math.sin(a);positions.push(...center.clone().addScaledVector(across,x).addScaledVector(depth,z).toArray());}
 }
 const layer=(rings+1)*sides;
 for(let wall=0;wall<2;wall++)for(let r=0;r<rings;r++)for(let s=0;s<sides;s++){const a=wall*layer+r*sides+s,b=wall*layer+r*sides+(s+1)%sides,c=a+sides,d=b+sides;indices.push(...(wall?[a,c,b,b,c,d]:[a,b,c,b,d,c]));}
 for(const r of [0,rings])for(let s=0;s<sides;s++){const a=r*sides+s,b=r*sides+(s+1)%sides;indices.push(a,a+layer,b,b,a+layer,b+layer);}
 return {positions,indices};
}
export function femaleReproductive(meshes,bones,data){
 if(!data?.parts?.length)throw new Error('Falta la referencia reproductora femenina HRA.');
 const target=new THREE.Box3(),point=new THREE.Vector3();
 for(const mesh of meshes.filter(o=>o.userData.female&&/^(Hip bone\.[lr]|Sacrum)$/.test(o.userData.anatomical_name||''))){const p=mesh.geometry.attributes.tissuePosition;for(let i=0;i<p.count;i++)target.expandByPoint(point.fromBufferAttribute(p,i));}
 if(target.isEmpty())throw new Error('No se puede registrar el sistema reproductor sin referencias pélvicas.');
 const source=new THREE.Box3(new THREE.Vector3(...data.pelvisBounds.min),new THREE.Vector3(...data.pelvisBounds.max)),scale=target.getSize(new THREE.Vector3()).divide(source.getSize(new THREE.Vector3())),translation=target.min.clone().sub(source.min.clone().multiply(scale));
 const pelvis=bones.pelvis,reference=pelvis.userData.referenceWorld||pelvis.matrixWorld,skeleton=new THREE.Skeleton([pelvis],[reference.clone().invert()]),result=[];
 function surface(part,positions,sourceText=reproductiveSource){
  const geometry=new THREE.BufferGeometry(),count=positions.length/3,weights=new Float32Array(count*4);for(let i=0;i<count;i++)weights[i*4]=1;
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('tissuePosition',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(new Uint16Array(count*4),4));geometry.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));geometry.setIndex(part.indices);geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:/^Ovary\./.test(part.name)?'#d7bcb3':part.color?(part.color.startsWith('#')?part.color:'#'+part.color):'#bd7f87',roughness:.62,side:THREE.DoubleSide}),mesh=new THREE.SkinnedMesh(geometry,material);mesh.name=part.name;
  const ovary=/^Ovary\./.test(part.name),system=part.system||'reproductor';mesh.userData={female:true,system,systems:ovary?['reproductor','endocrino']:[system],region:'axial',anatomical_name:part.name,display_name_es:part.es,source:sourceText,sourceName:part.sourceName,searchAliases:/uterine tube/i.test(part.name)?'trompa de Falopio fallopian tube':/^Ovary\./.test(part.name)?'ovaries ovarios':'',sourceLicense:part.reconstruction?'CC BY 4.0 (reconstrucción propia)':'CC BY 4.0',femalePelvicReference:true,femaleReproductive:system==='reproductor',reconstruction:!!part.reconstruction};mesh.frustumCulled=false;mesh.bind(skeleton,new THREE.Matrix4());result.push(mesh);return mesh;
 }
 for(const part of data.parts){const positions=[];for(let i=0;i<part.positions.length;i+=3)positions.push(...point.fromArray(part.positions,i).multiply(scale).add(translation).toArray());surface(part,positions);}
 const opening=result.find(o=>o.name==='External cervical os'),positions=opening.geometry.attributes.position,center=new THREE.Vector3();for(let i=0;i<positions.count;i++)center.add(point.fromBufferAttribute(positions,i));center.multiplyScalar(1/positions.count);
 // End just inside the perineal surface, below the pelvic outlet. The upper
 // wall surrounds the cervix; its posterior fornix is deeper than the outlet.
 const outlet=new THREE.Vector3(center.x,target.min.y-.030,center.z+.022),wall=vaginalWall(center.clone().add(new THREE.Vector3(0,.006,0)),outlet);
 surface({name:'Vagina',es:'Vagina · canal vaginal',indices:wall.indices,color:'#ba818b',reconstruction:true},wall.positions,reconstructionSource);
 // Female bladder and reproductive organs use the same HRA registration.
 // The male urethra/bladder are excluded from the shared female reference.
 const neck=result.find(o=>o.name==='Neck of urinary bladder');
 if(neck){
  const p=neck.geometry.attributes.position,a=new THREE.Vector3();for(let i=0;i<p.count;i++)a.add(point.fromBufferAttribute(p,i));a.multiplyScalar(1/p.count);
  const end=outlet.clone().add(new THREE.Vector3(0,.008,.018)),path=new THREE.CatmullRomCurve3([a,a.clone().lerp(end,.5).add(new THREE.Vector3(0,0,.002)),end]),g=new THREE.TubeGeometry(path,28,.0021,14,false);
  surface({name:'Female urethra',es:'Uretra femenina',system:'urinario',indices:Array.from(g.index.array),color:'#d1a2a0',reconstruction:true},Array.from(g.attributes.position.array),'Reconstrucción didáctica propia de la uretra femenina, entre el cuello vesical HRA y un meato anterior a la abertura vaginal. No es una segmentación del HRA. Referencia descriptiva: OpenStax Anatomy and Physiology 2e, 25.3, Gross Anatomy of Urine Transport.');g.dispose();
 }
 for(const side of ['l','r']){
  const ureter=meshes.find(o=>o.userData.female&&o.userData.anatomical_name==='Ureter.'+side),orifice=result.find(o=>o.name==='Ureteral orifice.'+side);if(!ureter||!orifice)continue;
  const p=ureter.geometry.attributes.tissuePosition,q=orifice.geometry.attributes.position,end=new THREE.Vector3(),entry=new THREE.Vector3();let bottom=Infinity,n=0;for(let i=0;i<p.count;i++)bottom=Math.min(bottom,p.getY(i));for(let i=0;i<p.count;i++)if(p.getY(i)<bottom+.003){end.add(point.fromBufferAttribute(p,i));n++;}end.multiplyScalar(1/n);for(let i=0;i<q.count;i++)entry.add(point.fromBufferAttribute(q,i));entry.multiplyScalar(1/q.count);const delta=entry.sub(end),ids=ureter.geometry.attributes.skinIndex,weights=ureter.geometry.attributes.skinWeight,pelvisIndex=ureter.skeleton.bones.indexOf(pelvis);
  for(let i=0;i<p.count;i++){const fade=1-THREE.MathUtils.smoothstep(p.getY(i),bottom+.003,bottom+.065);point.fromBufferAttribute(p,i).addScaledVector(delta,fade);if(pelvisIndex>=0&&fade>0){const values=new Map([[pelvisIndex,fade]]);for(let j=0;j<4;j++){const id=ids.getComponent(i,j);values.set(id,(values.get(id)||0)+weights.getComponent(i,j)*(1-fade));}const top=[...values].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=top.reduce((n,v)=>n+v[1],0);for(let j=0;j<4;j++){ids.setComponent(i,j,top[j]?.[0]||0);weights.setComponent(i,j,(top[j]?.[1]||0)/sum);}}p.setXYZ(i,...point.toArray());ureter.geometry.attributes.position.setXYZ(i,...point.toArray());}p.needsUpdate=true;ids.needsUpdate=true;weights.needsUpdate=true;ureter.geometry.attributes.position.needsUpdate=true;ureter.geometry.computeVertexNormals();
 }
 return {meshes:result,registration:{scale:scale.toArray(),translation:translation.toArray(),sourcePelvis:{min:source.min.toArray(),max:source.max.toArray()}}};
}
