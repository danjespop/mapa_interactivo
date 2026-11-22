import * as THREE from 'three';
const pointSegment=(p,a,b)=>{const ab=b.clone().sub(a),t=THREE.MathUtils.clamp(p.clone().sub(a).dot(ab)/ab.lengthSq(),0,1);return p.distanceTo(a.clone().addScaledVector(ab,t));};
// Collision proxies use the actual reference skin and joints of each body.
export class BodyContacts{
 constructor(skin,bones,rest,body){
  this.loads={};this.loaded=false;this.bones=bones;this.rest=rest;this.body=body;this.offset={L:0,R:0};this.thighRadius={};this.soles={bare:{},shoes:{}};
  const p=skin.geometry.attributes.tissuePosition,ids=skin.geometry.attributes.skinIndex,weights=skin.geometry.attributes.skinWeight,names=skin.skeleton.bones.map(b=>b.name.replace(/^female_/,''));
  for(const [side,sign]of [['L',1],['R',-1]]){
   const a=bones['thigh_'+side].getWorldPosition(new THREE.Vector3()),b=bones['shin_'+side].getWorldPosition(new THREE.Vector3()),radii=[],grid=new Map(),inverse=bones['foot_'+side].matrixWorld.clone().invert();
   for(let i=0;i<p.count;i+=2){let index=0,max=-1;for(let j=0;j<4;j++)if(weights.getComponent(i,j)>max){max=weights.getComponent(i,j);index=ids.getComponent(i,j);}const name=names[index],v=new THREE.Vector3().fromBufferAttribute(p,i);
    if(name==='thigh_'+side&&v.y<a.y-.08&&v.y>b.y+.07)radii.push(pointSegment(v,a,b));
    if(name==='foot_'+side&&v.y<.075){const key=Math.round(v.x/.02)+':'+Math.round(v.z/.02);if(!grid.has(key)||v.y<grid.get(key).y)grid.set(key,v);}
   }
   radii.sort((a,b)=>a-b);this.thighRadius[side]=THREE.MathUtils.clamp(radii[Math.floor(radii.length*.85)]||.075,.060,.095);this.soles.bare[side]=[...grid.values()].map(p=>p.applyMatrix4(inverse));
  }
 }
 load(side,mesh){this.loads[side]=mesh;}
 loadPoints(side){const points=[];if(this.loaded)this.loads[side]?.traverse(o=>{if(o.userData.contactRadius)points.push({p:o.getWorldPosition(new THREE.Vector3()),r:o.userData.contactRadius});});return points;}
 shoes(mesh){mesh.traverse(o=>{if(!o.userData.contactSole)return;const side=o.userData.footSide,bone=this.bones['foot_'+side],inverse=bone.matrixWorld.clone().invert(),p=o.geometry.attributes.position;this.soles.shoes[side]=Array.from({length:49},(_,i)=>new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(inverse));});}
 apply(bone,angles){bone.quaternion.copy(this.rest[bone.name]||this.rest[bone.name.replace(/^female_/,'')]);angles.forEach((angle,i)=>bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(bone.userData.motionAxes[i],angle)));bone.updateWorldMatrix(true,true);}
 handPoints(side){
  const b=this.bones,position=name=>b[name]?.getWorldPosition(new THREE.Vector3()),wrist=position('hand_'+side),middle=position('finger_2_0_'+side)||wrist,points=[{p:wrist,r:.018},{p:wrist.clone().lerp(middle,.55),r:.019}];
  for(let digit=0;digit<5;digit++){const base=position(`finger_${digit}_0_${side}`);if(base)points.push({p:base,r:.011});const last=b[`finger_${digit}_2_${side}`]||b[`finger_${digit}_1_${side}`];if(last){const end=last.getWorldPosition(new THREE.Vector3()),prev=last.parent.getWorldPosition(new THREE.Vector3());end.addScaledVector(end.clone().sub(prev).normalize(),.016);points.push({p:end,r:.009});}}
  return points;
 }
 clearance(side,padding=0){let clearance=Infinity;for(const point of [...this.handPoints(side),...this.loadPoints(side)])for(const leg of ['L','R']){const a=this.bones['thigh_'+leg].getWorldPosition(new THREE.Vector3()),b=this.bones['shin_'+leg].getWorldPosition(new THREE.Vector3());clearance=Math.min(clearance,pointSegment(point.p,a,b)-this.thighRadius[leg]-point.r-padding);}return clearance;}
 solve(angles,dt,immediate=false,clothed=false,loaded=false){this.loaded=loaded;let minimum=Infinity;
  for(const [side,sign]of [['L',1],['R',-1]]){const bone=this.bones['upperarm_'+side],base=(angles['upperarm_'+side]||[0,0,0]).slice();let correction=0;
   for(let i=0;i<50;i++){this.apply(bone,[base[0],base[1],base[2]+sign*correction]);const gap=this.clearance(side,clothed?.008:0);if(gap>=.004)break;correction+=.018;}
   this.offset[side]=immediate?correction:Math.max(correction,this.offset[side]*Math.exp(-dt*12));this.apply(bone,[base[0],base[1],base[2]+sign*this.offset[side]]);minimum=Math.min(minimum,this.clearance(side,clothed?.008:0));
  }
  return minimum;
 }
 lowestSole(clothed){const soles=clothed?this.soles.shoes:this.soles.bare;let minimum=Infinity;for(const side of ['L','R']){const matrix=this.bones['foot_'+side].matrixWorld;for(const p of soles[side]||this.soles.bare[side])minimum=Math.min(minimum,p.clone().applyMatrix4(matrix).y);}return minimum;}
}
