// Recorta un ciclo de carrera CMU 09_01 y adapta direcciones articulares al rig del atlas.
import fs from 'node:fs';
import * as THREE from 'three';
import {BVHLoader} from 'three/examples/jsm/loaders/BVHLoader.js';
const source=process.argv[2]||'/tmp/cmu-09_01.bvh';
const parsed=new BVHLoader().parse(fs.readFileSync(source,'utf8')),root=parsed.skeleton.bones[0];
const mixer=new THREE.AnimationMixer(root);mixer.clipAction(parsed.clip).play();
const bone=Object.fromEntries(parsed.skeleton.bones.map(b=>[b.name,b]));
const p=name=>bone[name].getWorldPosition(new THREE.Vector3());
const vec=(a,b)=>p(b).sub(p(a)).normalize(),deg=THREE.MathUtils.radToDeg;
const frames=[];
for(let frame=1;frame<Number(fs.readFileSync(source,'utf8').match(/Frames:\s*(\d+)/)[1]);frame++){
 mixer.setTime(frame*.0083333);root.updateMatrixWorld(true);
 const lateral=vec('RightUpLeg','LeftUpLeg');lateral.y=0;lateral.normalize();const forward=lateral.clone().cross(new THREE.Vector3(0,1,0));
 const angle=v=>-deg(Math.atan2(v.dot(forward),-v.y));const s={};
 for(const [side,prefix]of [['L','Left'],['R','Right']]){
  const thigh=vec(prefix+'UpLeg',prefix+'Leg'),shin=vec(prefix+'Leg',prefix+'Foot'),foot=vec(prefix+'Foot',prefix+'ToeBase'),upper=vec(prefix+'Arm',prefix+'ForeArm'),fore=vec(prefix+'ForeArm',prefix+'Hand');
  s['thigh_'+side]=angle(thigh);s['shin_'+side]=deg(Math.acos(THREE.MathUtils.clamp(thigh.dot(shin),-1,1)));
  const absoluteFoot=-deg(Math.atan2(foot.y,foot.dot(forward)));s['foot_'+side]=absoluteFoot-s['thigh_'+side]-s['shin_'+side];
  s['upperarm_'+side]=angle(upper);s['forearm_'+side]=-deg(Math.acos(THREE.MathUtils.clamp(upper.dot(fore),-1,1)));
 }
 s.pelvisYaw=deg(Math.atan2(-lateral.z,lateral.x));s.pelvisRoll=deg(Math.atan2(p('LeftUpLeg').y-p('RightUpLeg').y,p('LeftUpLeg').distanceTo(p('RightUpLeg'))));
 frames.push(s);
}

const start=0,end=88,count=64,keys=Object.keys(frames[0]),means=Object.fromEntries(['L','R'].map(side=>[side,frames.slice(start,end).reduce((sum,f)=>sum+f['upperarm_'+side],0)/(end-start)]));
const samples=Array.from({length:count},(_,i)=>{const t=i/count,x=start+(end-start)*t,a=Math.floor(x),f=x-a;return keys.map(k=>{let v=THREE.MathUtils.lerp(frames[a][k],frames[a+1][k],f)-(frames[end][k]-frames[start][k])*t;
 if(k.startsWith('thigh'))return v*.80;if(k.startsWith('shin'))return THREE.MathUtils.clamp(v-5,8,110);if(k.startsWith('foot'))return THREE.MathUtils.clamp(v-12.6,-20,30);if(k.startsWith('upperarm'))return (v-means[k.endsWith('L')?'L':'R'])*.85+2;if(k.startsWith('forearm'))return THREE.MathUtils.clamp(v,-115,-72);return v*.5;});});
for(let pass=0;pass<3;pass++){const old=samples.map(r=>r.slice());for(let i=0;i<count;i++)for(let j=0;j<keys.length;j++)samples[i][j]=(old[(i-1+count)%count][j]+old[i][j]*2+old[(i+1)%count][j])/4;}
const data={source:'CMU Graphics Lab Motion Capture Database, 09_01 run; BVH Bruce Hahne (2010)',commit:'09a07f54f3bbb58797325f009282d0b2048a2871',frames:[1,89],source_fps:120,duration:(end-start)/120,keys,samples:samples.map(r=>r.map(v=>Math.round(v*1000)/1000)),scope:'Ciclo adaptado; tobillo relativo a la pierna, no compensación absoluta durante el vuelo.'};fs.writeFileSync(new URL('../../src/data/carrera-cmu.json',import.meta.url),JSON.stringify(data)+'\n');console.log('Carrera adaptada',data.duration);
