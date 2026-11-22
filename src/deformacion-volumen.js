import * as THREE from 'three';
// Bake the reference pose into a common world bind space before adding details.
export function unifyBindSpace(meshes,body){
 const cache=new Map();
 for(const mesh of meshes){if(!mesh.isSkinnedMesh)continue;const g=mesh.geometry,reference=g.attributes.tissuePosition;if(!reference)continue;
  const key=mesh.skeleton.bones.map(b=>b.uuid).join('|');if(!cache.has(key)){const skeleton=new THREE.Skeleton(mesh.skeleton.bones);skeleton.calculateInverses();cache.set(key,skeleton);}
  g.setAttribute('position',reference.clone());g.deleteAttribute('normal');g.computeVertexNormals();g.boundingBox=null;g.boundingSphere=null;
  body.add(mesh);mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.set(1,1,1);mesh.updateMatrixWorld(true);mesh.bind(cache.get(key),new THREE.Matrix4());
 }
}
const caches=new WeakMap();
function dualCache(skeleton){
 if(caches.has(skeleton))return caches.get(skeleton);
 const cache={real:new Float64Array(skeleton.bones.length*4),dual:new Float64Array(skeleton.bones.length*4),dirty:true};caches.set(skeleton,cache);
 const update=skeleton.update;skeleton.update=function(){update.call(this);cache.dirty=true;};return cache;
}
function updateDual(skeleton,cache){
 if(!cache.dirty)return;const matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
 for(let i=0;i<skeleton.bones.length;i++){matrix.multiplyMatrices(skeleton.bones[i].matrixWorld,skeleton.boneInverses[i]);q.setFromRotationMatrix(matrix).normalize();const e=matrix.elements,x=e[12],y=e[13],z=e[14],at=i*4;cache.real.set([q.x,q.y,q.z,q.w],at);cache.dual.set([.5*(x*q.w+y*q.z-z*q.y),.5*(-x*q.z+y*q.w+z*q.x),.5*(x*q.y-y*q.x+z*q.w),-.5*(x*q.x+y*q.y+z*q.z)],at);}
 cache.dirty=false;
}
function transformVertex(index,target){
 const cache=dualCache(this.skeleton);updateDual(this.skeleton,cache);const ids=this.geometry.attributes.skinIndex,weights=this.geometry.attributes.skinWeight,r=[0,0,0,0],d=[0,0,0,0];let reference=null;
 for(let j=0;j<4;j++){const w=weights.getComponent(index,j);if(!w)continue;const at=ids.getComponent(index,j)*4,q=cache.real.subarray(at,at+4);if(!reference)reference=q;const sign=q.reduce((s,v,k)=>s+v*reference[k],0)<0?-1:1;for(let k=0;k<4;k++){r[k]+=q[k]*w*sign;d[k]+=cache.dual[at+k]*w*sign;}}
 const length=Math.hypot(...r)||1;for(let k=0;k<4;k++){r[k]/=length;d[k]/=length;}const dot=r.reduce((s,v,k)=>s+v*d[k],0);for(let k=0;k<4;k++)d[k]-=r[k]*dot;
 target.applyMatrix4(this.bindMatrix).applyQuaternion(new THREE.Quaternion(...r));target.x+=2*(-d[3]*r[0]+d[0]*r[3]-d[1]*r[2]+d[2]*r[1]);target.y+=2*(-d[3]*r[1]+d[0]*r[2]+d[1]*r[3]-d[2]*r[0]);target.z+=2*(-d[3]*r[2]-d[0]*r[1]+d[1]*r[0]+d[2]*r[3]);return target.applyMatrix4(this.bindMatrixInverse);
}
const pars=`
#ifdef USE_SKINNING
vec4 volumeQ(mat4 m){
 float t=m[0][0]+m[1][1]+m[2][2];vec4 q;
 if(t>0.0){float s=sqrt(t+1.0)*2.0;q=vec4((m[1][2]-m[2][1])/s,(m[2][0]-m[0][2])/s,(m[0][1]-m[1][0])/s,.25*s);}
 else if(m[0][0]>m[1][1]&&m[0][0]>m[2][2]){float s=sqrt(1.0+m[0][0]-m[1][1]-m[2][2])*2.0;q=vec4(.25*s,(m[1][0]+m[0][1])/s,(m[2][0]+m[0][2])/s,(m[1][2]-m[2][1])/s);}
 else if(m[1][1]>m[2][2]){float s=sqrt(1.0+m[1][1]-m[0][0]-m[2][2])*2.0;q=vec4((m[1][0]+m[0][1])/s,.25*s,(m[2][1]+m[1][2])/s,(m[2][0]-m[0][2])/s);}
 else{float s=sqrt(1.0+m[2][2]-m[0][0]-m[1][1])*2.0;q=vec4((m[2][0]+m[0][2])/s,(m[2][1]+m[1][2])/s,.25*s,(m[0][1]-m[1][0])/s);}return normalize(q);
}
vec4 volumeD(mat4 m,vec4 q){vec3 t=m[3].xyz;return .5*vec4(t*q.w+cross(t,q.xyz),-dot(t,q.xyz));}
vec3 volumeRotate(vec4 q,vec3 v){return v+2.0*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
void volumeBlend(mat4 a,mat4 b,mat4 c,mat4 d,vec4 weights,out vec4 realQ,out vec4 dualQ){
 vec4 qa=volumeQ(a),qb=volumeQ(b),qc=volumeQ(c),qd=volumeQ(d),refQ=weights.x>0.0?qa:weights.y>0.0?qb:weights.z>0.0?qc:qd;
 weights*=vec4(dot(qa,refQ)<0.0?-1.0:1.0,dot(qb,refQ)<0.0?-1.0:1.0,dot(qc,refQ)<0.0?-1.0:1.0,dot(qd,refQ)<0.0?-1.0:1.0);
 realQ=qa*weights.x+qb*weights.y+qc*weights.z+qd*weights.w;dualQ=volumeD(a,qa)*weights.x+volumeD(b,qb)*weights.y+volumeD(c,qc)*weights.z+volumeD(d,qd)*weights.w;
 float scaleQ=max(length(realQ),.000001);realQ/=scaleQ;dualQ/=scaleQ;dualQ-=realQ*dot(realQ,dualQ);
}
#endif
`;
export function preserveVolume(meshes){
 for(const mesh of meshes){if(!mesh.isSkinnedMesh)continue;dualCache(mesh.skeleton);mesh.applyBoneTransform=transformVertex;
  for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){if(material.userData.volumeSkinning)continue;material.userData.volumeSkinning=true;const compile=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
   material.onBeforeCompile=function(shader,...args){compile.call(this,shader,...args);shader.vertexShader=shader.vertexShader.replace('#include <skinning_pars_vertex>','#include <skinning_pars_vertex>\n'+pars).replace('#include <skinbase_vertex>',`#include <skinbase_vertex>
#ifdef USE_SKINNING
vec4 volumeReal,volumeDual;volumeBlend(boneMatX,boneMatY,boneMatZ,boneMatW,skinWeight,volumeReal,volumeDual);
#endif`).replace('#include <skinnormal_vertex>',`#ifdef USE_SKINNING
objectNormal=mat3(bindMatrixInverse)*volumeRotate(volumeReal,mat3(bindMatrix)*objectNormal);
#ifdef USE_TANGENT
objectTangent=mat3(bindMatrixInverse)*volumeRotate(volumeReal,mat3(bindMatrix)*objectTangent);
#endif
#endif`).replace('#include <skinning_vertex>',`#ifdef USE_SKINNING
vec3 volumePoint=(bindMatrix*vec4(transformed,1.0)).xyz;
vec3 volumeTranslation=2.0*(volumeReal.w*volumeDual.xyz-volumeDual.w*volumeReal.xyz+cross(volumeReal.xyz,volumeDual.xyz));
transformed=(bindMatrixInverse*vec4(volumeRotate(volumeReal,volumePoint)+volumeTranslation,1.0)).xyz;
#endif`);};material.customProgramCacheKey=()=>key()+'-volume-dq-v1';material.needsUpdate=true;
  }
 }
}
