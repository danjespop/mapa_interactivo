// Recorta un ciclo de marcha CMU 07_01 y adapta direcciones articulares al rig del atlas.
import fs from 'node:fs';
import * as THREE from 'three';
import {BVHLoader} from 'three/examples/jsm/loaders/BVHLoader.js';
const source=process.argv[2]||'/tmp/cmu-07_01.bvh';
const parsed=new BVHLoader().parse(fs.readFileSync(source,'utf8')),root=parsed.skeleton.bones[0];
const mixer=new THREE.AnimationMixer(root);mixer.clipAction(parsed.clip).play();
const bone=Object.fromEntries(parsed.skeleton.bones.map(b=>[b.name,b]));
const p=name=>bone[name].getWorldPosition(new THREE.Vector3());
const vec=(a,b)=>p(b).sub(p(a)).normalize(),deg=THREE.MathUtils.radToDeg;
const frames=[];
for(let frame=1;frame<317;frame++){
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
// Un ciclo estable tras el contacto del talón izquierdo. Se elimina el desplazamiento
// global y se conserva la forma temporal; amplitudes adaptadas al rig educativo.
const start=64,end=196,count=64,keys=['thigh_L','shin_L','foot_L','upperarm_L','forearm_L','thigh_R','shin_R','foot_R','upperarm_R','forearm_R','pelvisYaw','pelvisRoll'];
const samples=Array.from({length:count},(_,i)=>{
 const t=i/count,x=start+(end-start)*t,a=Math.floor(x),f=x-a;
 return keys.map(k=>{const value=THREE.MathUtils.lerp(frames[a][k],frames[a+1][k],f)-(frames[end][k]-frames[start][k])*t;
 if(k.startsWith('thigh'))return value*.78;
 if(k.startsWith('shin'))return Math.max(3,value-9);
 if(k.startsWith('foot'))return value;
 if(k.startsWith('upperarm'))return value*.68;
 if(k.startsWith('forearm'))return Math.max(-38,Math.min(-7,value));
 return value*(k==='pelvisRoll'?.40:.60);
 });
});
// Suavizado circular: filtra el ruido de captura y cierra la velocidad del bucle.
for(let pass=0;pass<3;pass++){const copy=samples.map(row=>row.slice());for(let i=0;i<count;i++)for(let j=0;j<keys.length;j++)samples[i][j]=(copy[(i-1+count)%count][j]+copy[i][j]*2+copy[(i+1)%count][j])/4;}
const data={source:'CMU Graphics Lab Motion Capture Database, 07_01 walk; BVH Bruce Hahne (2010)',repository:'https://github.com/una-dinosauria/cmu-mocap',commit:'09a07f54f3bbb58797325f009282d0b2048a2871',frames:[start+1,end+1],source_fps:120,duration:(end-start)/120,keys,samples:samples.map(row=>row.map(v=>Math.round(v*1000)/1000)),scope:'Direcciones de segmentos de una captura real, amplitudes adaptadas y ciclo filtrado; manos y dedos animados por separado, no capturados.'};
fs.writeFileSync(new URL('../../src/data/marcha-cmu.json',import.meta.url),JSON.stringify(data)+'\n');
console.log('Ciclo de marcha:',data.duration,'s,',count,'muestras.');
