import * as THREE from 'three';
// Small visual adjustment of the adult male reference, blended at its attachment.
// Apply the same deformation to the skin and underlying local structures.
export function reduceMaleProportion(meshes){
 const cell=.035,grid=new Map(),key=(x,y,z)=>x+':'+y+':'+z;
 const region=p=>Math.abs(p.x)<.05&&p.y>.69&&p.y<.86&&p.z>.025&&p.z<.15;
 for(const mesh of meshes){if(mesh.userData.female||!/^(Glans penis|Corpus cavernosum of penis|Corpus spongiosum of penis)$/.test(mesh.userData.anatomical_name||''))continue;const p=mesh.geometry.attributes.tissuePosition;if(!p)continue;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);if(!region(v))continue;const k=key(Math.floor(v.x/cell),Math.floor(v.y/cell),Math.floor(v.z/cell));if(!grid.has(k))grid.set(k,[]);grid.get(k).push(v);}}
 if(!grid.size)return;
 for(const mesh of meshes){if(mesh.userData.female||!mesh.isSkinnedMesh||mesh.geometry.userData.proportionAdjusted)continue;const g=mesh.geometry,p=g.attributes.tissuePosition;if(!p)continue;const edits=[],v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);if(!region(v))continue;const x=Math.floor(v.x/cell),y=Math.floor(v.y/cell),z=Math.floor(v.z/cell);let distance=Infinity;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++)for(const point of grid.get(key(x+dx,y+dy,z+dz))||[])distance=Math.min(distance,v.distanceToSquared(point));
   const blend=(1-THREE.MathUtils.smoothstep(Math.sqrt(distance),.006,.035))*(1-THREE.MathUtils.smoothstep(Math.abs(v.x),.025,.05))*THREE.MathUtils.smoothstep(v.y,.71,.735)*(1-THREE.MathUtils.smoothstep(v.y,.83,.86))*THREE.MathUtils.smoothstep(v.z,.025,.07)*(1-THREE.MathUtils.smoothstep(v.z,.12,.15));const bag=THREE.MathUtils.smoothstep(v.y,.69,.708)*(1-THREE.MathUtils.smoothstep(v.y,.77,.802))*(1-THREE.MathUtils.smoothstep(Math.abs(v.x),.036,.055))*THREE.MathUtils.smoothstep(v.z,.017,.035)*(1-THREE.MathUtils.smoothstep(v.z,.074,.088));if(blend<=0&&bag<=0)continue;
   const point=new THREE.Vector3(v.x*(1-.08*blend),.83+(v.y-.83)*(1-.12*blend),.055+(v.z-.055)*(1-.12*blend));point.x*=1-.12*bag;point.y=.795+(point.y-.795)*(1-.20*bag);point.z=.044+(point.z-.044)*(1-.12*bag);edits.push([i,point]);
  }
  if(!edits.length)continue;
  const old=g.attributes.position,positions=new Float32Array(old.count*3),inverse=mesh.matrixWorld.clone().invert();for(let i=0;i<old.count;i++)positions.set([old.getX(i),old.getY(i),old.getZ(i)],i*3);
  for(const [i,point]of edits){p.setXYZ(i,point.x,point.y,point.z);point.applyMatrix4(inverse);positions.set(point.toArray(),i*3);}
  g.setAttribute('position',new THREE.BufferAttribute(positions,3));p.needsUpdate=true;g.deleteAttribute('normal');g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.userData.proportionAdjusted=true;
 }
}
