import * as THREE from 'three';
const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
const reference=mesh=>mesh.skeleton.bones[0].matrixWorld.clone().multiply(mesh.skeleton.boneInverses[0]);
export function addChest(skin,spine,prefix=''){
 const p=skin.geometry.getAttribute('tissuePosition'),centers=[],joints=[];spine.updateWorldMatrix(true,false);
 for(const [side,sign]of [['L',1],['R',-1]]){
  const points=[];for(let i=0;i<p.count;i++)if(p.getX(i)*sign>.025&&p.getX(i)*sign<.13&&p.getY(i)>1.17&&p.getY(i)<1.38&&p.getZ(i)>.035)points.push(new THREE.Vector3().fromBufferAttribute(p,i));
  points.sort((a,b)=>b.z-a.z);const chosen=points.slice(0,Math.max(1,Math.floor(points.length*.16))),center=chosen.reduce((a,v)=>a.add(v),new THREE.Vector3()).multiplyScalar(1/chosen.length);
  centers.push(center);const bone=new THREE.Bone();bone.name=prefix+'chest_'+side;bone.position.copy(spine.worldToLocal(center.clone().add(new THREE.Vector3(0,0,-.035))));spine.add(bone);bone.updateWorldMatrix(true,false);bone.userData.referencePosition=bone.position.clone();bone.userData.softTissue=true;joints.push(bone);
 }
 const old=skin.skeleton,Q=reference(skin),skeleton=new THREE.Skeleton([...old.bones,...joints],[...old.boneInverses,...joints.map(b=>b.matrixWorld.clone().invert().multiply(Q))]);
 const ids=skin.geometry.getAttribute('skinIndex'),ws=skin.geometry.getAttribute('skinWeight'),newIds=new Uint16Array(p.count*4),newWeights=new Float32Array(p.count*4);
 for(let i=0;i<p.count;i++){
  const index=p.getX(i)>0?0:1,c=centers[index],d=((p.getX(i)-c.x)/.075)**2+((p.getY(i)-c.y)/.080)**2+((p.getZ(i)-c.z)/.09)**2,f=(1-smooth(.12,1,d))*(prefix?.68:.32)*(p.getZ(i)>.015?1:0),values=[];
  for(let j=0;j<4;j++)values.push([ids.getComponent(i,j),ws.getComponent(i,j)*(1-f)]);values.push([old.bones.length+index,f]);values.sort((a,b)=>b[1]-a[1]);const total=values.slice(0,4).reduce((sum,a)=>sum+a[1],0);
  for(let j=0;j<4;j++){newIds[i*4+j]=values[j][0];newWeights[i*4+j]=values[j][1]/total;}
 }
 skin.geometry.setAttribute('skinIndex',new THREE.BufferAttribute(newIds,4));skin.geometry.setAttribute('skinWeight',new THREE.BufferAttribute(newWeights,4));skin.skeleton=skeleton;return {joints,skeleton};
}
export function addEyes(objects,head,female=false){
 const parts=objects.filter(o=>!!o.userData.female===female&&o.userData.skinFeature),result={};
 for(const [side,suffix]of [['L','l'],['R','r']]){
  const list=parts.filter(o=>(o.userData.anatomical_name||'').endsWith('.'+suffix)),sclera=list.find(o=>/^Sclera/.test(o.userData.anatomical_name||''));if(!sclera)continue;
  if(sclera.isSkinnedMesh)sclera.computeBoundingBox();const box=new THREE.Box3().setFromObject(sclera),center=box.getCenter(new THREE.Vector3()),radii=box.getSize(new THREE.Vector3()).multiplyScalar(.5),bone=new THREE.Bone();bone.name=(female?'female_':'')+'eye_'+side;bone.position.copy(head.worldToLocal(center.clone()));head.add(bone);bone.updateWorldMatrix(true,false);
  const skeletons=[];
  const iris=list.find(o=>/^Iris/.test(o.userData.anatomical_name||''));if(iris){if(iris.isSkinnedMesh)iris.computeBoundingBox();const irisBox=new THREE.Box3().setFromObject(iris),irisCenter=irisBox.getCenter(new THREE.Vector3()),size=irisBox.getSize(new THREE.Vector3()),radius=Math.min(size.x,size.y)*.22,g=new THREE.CircleGeometry(radius,32);g.translate(irisCenter.x,irisCenter.y,Math.max(irisBox.max.z,box.max.z)+.0007);g.applyMatrix4(bone.matrixWorld.clone().invert());const pupil=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x080605,side:THREE.DoubleSide}));pupil.userData={...iris.userData,anatomical_name:'Pupil of eye.'+suffix};bone.add(pupil);objects.push(pupil);}
  for(const mesh of list){if(mesh.isSkinnedMesh){const Q=reference(mesh),skeleton=new THREE.Skeleton([bone],[bone.matrixWorld.clone().invert().multiply(Q)]),count=mesh.geometry.attributes.position.count,ids=new Uint16Array(count*4),weights=new Float32Array(count*4);for(let i=0;i<count;i++)weights[i*4]=1;mesh.geometry.setAttribute('skinIndex',new THREE.BufferAttribute(ids,4));mesh.geometry.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));mesh.skeleton=skeleton;skeletons.push(skeleton);}else bone.attach(mesh);}
  result[side]={bone,center,radii,skeletons};
 }
 return result;
}
export function blinkMorph(skin,eyes){
 const p=skin.geometry.getAttribute('tissuePosition'),delta=new Float32Array(p.count*3),Q=reference(skin),inverse=Q.clone().invert(),v=new THREE.Vector3(),origin=new THREE.Vector3().applyMatrix4(inverse);
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);let dy=0,dz=0;
  for(const eye of Object.values(eyes)){
   const dx=x-eye.center.x,yy=y-eye.center.y,rx=eye.radii.x*1.20,ry=Math.max(.0055,eye.radii.y*.60),rz=eye.radii.z;if(Math.abs(dx)>rx*1.15||Math.abs(yy)>ry*1.65||z<eye.center.z)continue;
   const horizontal=1-smooth(rx*.65,rx*1.12,Math.abs(dx));
   const upper=smooth(-ry*.1,ry*.22,yy)*(1-smooth(ry*.75,ry*1.6,yy)),lower=smooth(-ry*1.5,-ry*.65,yy)*(1-smooth(-ry*.2,ry*.1,yy));
   dy+=horizontal*(-ry*1.20*upper+ry*.40*lower);
   const next=yy+dy,sphere=eye.center.z+rz*Math.sqrt(Math.max(0,1-(dx/rx)**2-(next/ry)**2))+.0008;dz=Math.max(dz,Math.max(0,sphere-z)*Math.max(upper,lower)*horizontal);
  }
  if(dy||dz){v.set(0,dy,dz).applyMatrix4(inverse).sub(origin);delta.set([v.x,v.y,v.z],i*3);}
 }
 const attr=new THREE.BufferAttribute(delta,3);attr.name='parpadeo';skin.geometry.morphAttributes.position=[attr];skin.geometry.morphTargetsRelative=true;skin.updateMorphTargets();return value=>skin.morphTargetInfluences[0]=value;
}
function tapered(points,radii,steps=48,sides=12){
 const curve=new THREE.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(steps,false),positions=[],uv=[],indices=[];
 for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPointAt(t),at=t*(radii.length-1),lo=Math.floor(at),radius=THREE.MathUtils.lerp(radii[lo],radii[Math.min(lo+1,radii.length-1)],at-lo);
  for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,r=radius*(1+.035*Math.sin(a*7+t*9)),v=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r);positions.push(v.x,v.y,v.z);uv.push(j/sides,t);if(i<steps&&j<sides){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function hairMaterial(color,cap=false){
 const m=new THREE.MeshStandardMaterial({color,roughness:.77,metalness:0,side:THREE.DoubleSide});
 m.onBeforeCompile=shader=>{shader.vertexShader='attribute vec3 tissuePosition;varying vec3 vHair;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHair=tissuePosition;');shader.fragmentShader='varying vec3 vHair;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat fibre=sin(vHair.x*2400.0+sin(vHair.y*25.0)*8.0+vHair.z*900.0);diffuseColor.rgb*=.988+.012*fibre;');};m.customProgramCacheKey=()=> 'atlas-long-hair-v1';return m;
}
export function longHair(skin,head){
 const p=skin.geometry.getAttribute('tissuePosition'),old=skin.geometry.index,positions=[],index=[],lookup=new Map();
 const allowed=i=>{const x=p.getX(i),y=p.getY(i),z=p.getZ(i),frontLine=1.656-.011*Math.exp(-((x/.022)**2))-.055*smooth(.045,.085,Math.abs(x)),line=THREE.MathUtils.lerp(1.552,frontLine,smooth(-.03,.075,z));return y>line&&Math.abs(x)<.095&&!(Math.abs(x)>.063&&y<1.635);};
 for(let i=0;i<old.count;i+=3){const face=[old.getX(i),old.getX(i+1),old.getX(i+2)];if(!face.every(allowed))continue;for(const id of face){if(!lookup.has(id)){lookup.set(id,positions.length/3);positions.push(p.getX(id),p.getY(id),p.getZ(id));}index.push(lookup.get(id));}}
 const cap=new THREE.BufferGeometry();cap.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));cap.setIndex(index);cap.computeVertexNormals();const cp=cap.getAttribute('position'),normal=cap.getAttribute('normal'),neighbors=Array.from({length:cp.count},()=>new Set()),edges=new Map();
 for(let i=0;i<index.length;i+=3)for(const [a,b]of [[index[i],index[i+1]],[index[i+1],index[i+2]],[index[i+2],index[i]]]){neighbors[a].add(b);neighbors[b].add(a);const key=Math.min(a,b)+':'+Math.max(a,b);edges.set(key,(edges.get(key)||0)+1);}
 const distance=new Float32Array(cp.count).fill(Infinity),queue=[];for(const [key,count]of edges)if(count===1)for(const i of key.split(':').map(Number))if(distance[i]!==0){distance[i]=0;queue.push(i);}
 for(let at=0;at<queue.length;at++){const i=queue[at],a=new THREE.Vector3().fromBufferAttribute(cp,i);for(const j of neighbors[i]){const d=distance[i]+a.distanceTo(new THREE.Vector3().fromBufferAttribute(cp,j));if(d<distance[j]&&d<.04){distance[j]=d;queue.push(j);}}}
 for(let i=0;i<cp.count;i++){const thickness=.003+.015*smooth(.002,.025,distance[i]);cp.setXYZ(i,cp.getX(i)+normal.getX(i)*thickness,cp.getY(i)+normal.getY(i)*thickness,cp.getZ(i)+normal.getZ(i)*thickness);}
 // Fair the hairline along its boundary rather than leaving triangle steps.
 const border=new Map();for(const [key,count]of edges)if(count===1){const [a,b]=key.split(':').map(Number);if(!border.has(a))border.set(a,[]);if(!border.has(b))border.set(b,[]);border.get(a).push(b);border.get(b).push(a);}
 for(let pass=0;pass<5;pass++){const old=cp.array.slice();for(const [i,adjacent]of border)for(let axis=0;axis<3;axis++)cp.array[i*3+axis]=old[i*3+axis]*.5+adjacent.reduce((sum,j)=>sum+old[j*3+axis],0)/adjacent.length*.5;}
 cap.computeVertexNormals();
 const meshes=[],inverse=head.matrixWorld.clone().invert(),material=hairMaterial('#67432b');
 const attach=(geometry,parent=head,inv=inverse,mat=material)=>{geometry.setAttribute('tissuePosition',geometry.getAttribute('position').clone());geometry.applyMatrix4(inv);const mesh=new THREE.Mesh(geometry,mat);mesh.frustumCulled=false;mesh.userData={system:'piel',female:true,skinAccessory:true,femaleHair:true,anatomical_name:'Cabello largo recogido en cola'};parent.add(mesh);meshes.push(mesh);return mesh;};
const scalp=cap.getAttribute('position');let anchorZ=Infinity;for(let i=0;i<scalp.count;i++)if(Math.abs(scalp.getX(i))<.020&&Math.abs(scalp.getY(i)-1.66)<.016)anchorZ=Math.min(anchorZ,scalp.getZ(i)-.006);if(!Number.isFinite(anchorZ))anchorZ=-.085;
 attach(cap);
 for(let strand=0;strand<30;strand++){
  const x=(strand/29-.5)*.134,factor=Math.sqrt(Math.max(.15,1-(x/.080)**2)),points=[];
  for(let i=0;i<=8;i++){const t=i/8,angle=.17+t*2.45;const guess=new THREE.Vector3(x*(1-t*.78),1.635+.091*factor*Math.sin(angle),.087*factor*Math.cos(angle));let best=Infinity,closest=0;for(let j=0;j<cp.count;j++){const d=(cp.getX(j)-guess.x)**2+(cp.getY(j)-guess.y)**2+(cp.getZ(j)-guess.z)**2;if(d<best){best=d;closest=j;}}points.push(new THREE.Vector3().fromBufferAttribute(cp,closest).addScaledVector(new THREE.Vector3().fromBufferAttribute(cap.attributes.normal,closest),.001));}
  points.push(new THREE.Vector3(x*.1,1.66,anchorZ));attach(tapered(points,[.00025,.0007,.0006,.0002],40,4),head,inverse,hairMaterial(strand%3?'#795032':'#93623e'));
 }

 const points=[new THREE.Vector3(0,1.66,anchorZ),new THREE.Vector3(0,1.60,anchorZ-.045),new THREE.Vector3(.004,1.47,anchorZ-.060),new THREE.Vector3(.008,1.33,anchorZ-.040),new THREE.Vector3(.012,1.25,anchorZ-.030)],radii=[.019,.028,.024,.014,.002];
 const pivot=new THREE.Group();pivot.position.copy(head.worldToLocal(points[0].clone()));head.add(pivot);pivot.updateWorldMatrix(true,false);const pivotInverse=pivot.matrixWorld.clone().invert();attach(tapered(points,radii),pivot,pivotInverse);
 for(let strand=0;strand<18;strand++){const angle=strand/18*Math.PI*2,offsetPoints=points.map((point,i)=>point.clone().add(new THREE.Vector3(Math.cos(angle)*radii[i]*.88,Math.sin(angle+ i*.15)*.003,Math.sin(angle)*radii[i]*.88)));attach(tapered(offsetPoints,[.001,.0014,.0012,.0008,.00025],36,4),pivot,pivotInverse,hairMaterial(strand%3?'#70472c':'#50331f'));}
 const tie=new THREE.TorusGeometry(.020,.0036,6,24);tie.rotateX(Math.PI/2-.25);tie.translate(0,1.654,anchorZ-.004);attach(tie,pivot,pivotInverse,new THREE.MeshStandardMaterial({color:'#244e57',roughness:.9}));
 return {meshes,pivot};
}

export function femaleBrows(skin,head,eyes){
 const p=skin.geometry.attributes.tissuePosition,meshes=[],inverse=head.matrixWorld.clone().invert();
 for(const [side,sign]of [['L',1],['R',-1]]){const eye=eyes[side];if(!eye)continue;const positions=[],indices=[],samples=[];
  for(let i=0;i<p.count;i++)if(p.getX(i)*sign>.005&&p.getX(i)*sign<.070&&p.getY(i)>eye.center.y+.008&&p.getY(i)<eye.center.y+.040&&p.getZ(i)>eye.center.z-.012)samples.push(new THREE.Vector3().fromBufferAttribute(p,i));
  for(let row=0;row<=32;row++){const t=row/32,x=eye.center.x+sign*(-.020+.047*t),y=eye.center.y+.018+.005*Math.sin(Math.PI*t)-.003*t;let nearest=samples[0],best=Infinity;for(const v of samples){const d=(v.x-x)**2+(v.y-y)**2;if(d<best){best=d;nearest=v;}}
   const half=.00025+.0012*Math.sin(Math.PI*(.18+t*.82)),z=(nearest?.z||eye.center.z+.004)+.001;
   for(let col=0;col<8;col++){const a=col/8*Math.PI*2;positions.push(x,y+Math.cos(a)*half,z+Math.sin(a)*.00055);if(row<32){const start=row*8+col,next=row*8+(col+1)%8;indices.push(start,next,start+8,next,next+8,start+8);}}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();g.applyMatrix4(inverse);const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#68472f',roughness:.96}));mesh.userData={system:'piel',female:true,skinAccessory:true,anatomical_name:'Ceja '+(side==='L'?'izquierda':'derecha')};head.add(mesh);meshes.push(mesh);
 }
 return meshes;
}
