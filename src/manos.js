import * as THREE from 'three';
const position=bone=>bone.getWorldPosition(new THREE.Vector3());
export function palmFrame(bones,side){
 const wrist=position(bones['hand_'+side]),middle=position(bones['finger_2_0_'+side]),forward=middle.clone().sub(wrist).normalize(),across=position(bones['finger_1_0_'+side]).sub(position(bones['finger_4_0_'+side])).normalize();
 return {wrist,middle,forward,across,palm:forward.clone().cross(across).multiplyScalar(side==='L'?1:-1).normalize()};
}
function worldRotate(bone,delta){const q=delta.clone().multiply(bone.getWorldQuaternion(new THREE.Quaternion())),parent=bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();bone.quaternion.copy(parent.multiply(q));bone.updateWorldMatrix(true,true);}
// MCP landmarks define the actual palm, independently of each source rig's rest axes.
export function poseHands(bones,body,state){
 const bodyQ=body.getWorldQuaternion(new THREE.Quaternion());
 for(const [side,sign]of [['L',1],['R',-1]]){
  const hand=bones['hand_'+side],forearm=bones['forearm_'+side],shaft=position(hand).sub(position(forearm)).normalize();
  let frame=palmFrame(bones,side);
  worldRotate(hand,new THREE.Quaternion().setFromUnitVectors(frame.forward,shaft));
  const desired=new THREE.Vector3(...(state.hands[side].palm||[-sign,0,0])).normalize();
  desired.applyQuaternion(bodyQ);desired.addScaledVector(shaft,-desired.dot(shaft)).normalize();
  frame=palmFrame(bones,side);const current=frame.palm.clone().addScaledVector(shaft,-frame.palm.dot(shaft)).normalize();
  const roll=Math.atan2(shaft.dot(current.clone().cross(desired)),THREE.MathUtils.clamp(current.dot(desired),-1,1));
  // Put pronation/supination in the forearm, keeping the wrist aligned with it.
  worldRotate(forearm,new THREE.Quaternion().setFromAxisAngle(shaft,roll));
  frame=palmFrame(bones,side);worldRotate(hand,new THREE.Quaternion().setFromAxisAngle(frame.across,sign*(state.hands[side].wristExtension||0)));
 }
}
export const powerGripCenter=frame=>frame.wrist.clone().lerp(frame.middle,1.08).addScaledVector(frame.palm,.034);
export function dumbbell(bones,side,female=false){
 const hand=bones['hand_'+side],frame=palmFrame(bones,side),center=powerGripCenter(frame),g=new THREE.Group();
 const z=frame.across.clone().cross(frame.forward).normalize(),y=z.clone().cross(frame.across).normalize(),rotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(frame.across,y,z));
 g.position.copy(hand.worldToLocal(center));g.quaternion.copy(hand.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rotation));
 const steel=new THREE.MeshStandardMaterial({color:0x48525b,metalness:.7,roughness:.28}),shaft=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.18,16),steel);shaft.rotation.z=Math.PI/2;g.add(shaft);
 for(const x of [-.075,.075]){const plate=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.035,32),steel);plate.rotation.z=Math.PI/2;plate.position.x=x;plate.userData.loadPlate=true;plate.userData.contactRadius=.059;g.add(plate);}
 g.visible=false;g.userData={female,side};hand.add(g);return g;
}
