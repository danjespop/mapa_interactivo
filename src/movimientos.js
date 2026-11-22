import carrera from './data/carrera-cmu.json' with {type:'json'};
import marcha from './data/marcha-cmu.json' with {type:'json'};
// Cinemática educativa por fases. Ángulos orientativos, no valores clínicos ni electromiografía.
const rad=d=>d*Math.PI/180;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const mix=(a,b,t)=>a+(b-a)*smooth(t);
export const durations={quieto:4,caminar:marcha.duration,correr:carrera.duration,saltar:2.8,peso:3.8,sentarse:4.8,lesion:1.6,buena:4,mala:4};
const activity=(id,name,match,role,side=null)=>({id,name,match,role,side});
const quad=side=>activity('quadriceps','Cuádriceps','rectus femoris|vastus','Extensión y control de la rodilla',side);
const calves=side=>activity('calves','Gemelos y sóleo','gastrocnemius|soleus','Impulso y control del tobillo',side);
const abdom=()=>activity('abdominals','Abdominales','rectus abdominis|abdominal oblique','Estabilizan el tronco');
const biceps=role=>activity('biceps','Bíceps braquial','biceps brachii',role);
export function capturedWalk(u,data=marcha){
 const n=data.samples.length,x=((u%1)+1)%1*n,i=Math.floor(x),t=x-i;
 return Object.fromEntries(data.keys.map((key,j)=>{const a=data.samples[(i-1+n)%n][j],b=data.samples[i][j],c=data.samples[(i+1)%n][j],d=data.samples[(i+2)%n][j];return [key,.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)];}));
}
export function motionAt(mode,seconds){
 const duration=durations[mode]||4,u=((seconds%duration)+duration)%duration/duration;
 const s={mode,u,duration,joints:{},hands:{L:{curl:.12,spread:.02},R:{curl:.12,spread:.02}},contacts:[],groundOffsets:{L:0,R:0},height:0,phase:'Posición anatómica',activities:[]};
 const set=(name,x=0,y=0,z=0)=>s.joints[name]=[rad(x),rad(y),rad(z)];
 function arm(side,swing,elbow,wrist=0,spread=0){set('upperarm_'+side,swing,0,spread);set('forearm_'+side,-elbow);set('hand_'+side,wrist);}
 if(mode==='lesion'){
  const run=mode==='correr',stance=run?.4:.62;
  for(const [side,offset,sign]of [['L',0,1],['R',.5,-1]]){
   const v=(u+offset)%1;let hip,knee,rock;
   if(v<stance){const t=v/stance;s.contacts.push(side);hip=mix(run?-36:-23,run?24:18,t);knee=t<.25?mix(6,run?25:13,t/.25):t<.7?mix(run?25:13,5,(t-.25)/.45):mix(5,run?36:23,(t-.7)/.3);rock=t<.2?mix(-10,0,t/.2):t>.75?mix(0,run?25:18,(t-.75)/.25):0;}
   else{const t=(v-stance)/(1-stance);hip=mix(run?24:18,run?-36:-23,t);knee=t<.45?mix(run?36:23,run?100:62,t/.45):mix(run?100:62,6,(t-.45)/.55);rock=-4;}
   if(mode==='lesion'&&side==='L'){hip*=.55;knee*=.6;}
   if(v<stance)s.groundOffsets[side]=Math.max(0,Math.sin(rad(rock)))*.16;set('thigh_'+side,hip);set('shin_'+side,knee);set('foot_'+side,-hip-knee+rock);
   arm(side,-hip*(run?1.1:.7),run?88+12*Math.sin(v*2*Math.PI):18+6*Math.sin(v*2*Math.PI),2*Math.sin(v*2*Math.PI));
   s.hands[side]={curl:run?.3:.14,spread:run?0:.025};if(run)s.joints['forearm_'+side][1]=rad(-sign*65);
  }
  set('pelvis',0,3*Math.sin(2*Math.PI*u),1.2*Math.sin(2*Math.PI*u));set('spine',run?6:1,-4*Math.sin(2*Math.PI*u));set('neck',run?-3:0);
  const support=s.contacts[0]||'L';s.phase=s.contacts.length?'Apoyo e impulso · '+(support==='L'?'pierna izquierda':'pierna derecha'):'Fase de vuelo';
  s.activities=[quad(support),calves(support),activity('tibialis','Tibial anterior','tibialis anterior','Eleva el pie durante el avance',support==='L'?'R':'L'),abdom()];
  if(run&&!s.contacts.length)s.height=.035*Math.sin(u*4*Math.PI)**2;
 }
 if(mode==='caminar'){
  const captured=capturedWalk(u);s.contacts=[];
  for(const [side,offset,sign]of [['L',0,1],['R',.5,-1]]){
   const v=(u+offset)%1;if(v<.61)s.contacts.push(side);
   const hip=captured['thigh_'+side],knee=captured['shin_'+side];
   set('thigh_'+side,hip);set('shin_'+side,knee);
   // Talón–planta–antepié: mantén la suela nivelada en apoyo y eleva el pie al avanzar.
   const rock=v<.12?mix(-9,0,v/.12):v<.43?0:v<.61?mix(0,21,(v-.43)/.18):mix(-5,-9,(v-.61)/.39);
   const swing=clamp(captured['foot_'+side]-12.6,-15,22),landing=capturedWalk(offset)['thigh_'+side]+capturedWalk(offset)['shin_'+side],takeoff=capturedWalk((.61-offset+1)%1);let ankle=v<.61?clamp(-hip-knee+rock,-20,25):swing;if(v>=.61&&v<.71)ankle=mix(clamp(-takeoff['thigh_'+side]-takeoff['shin_'+side]+21,-20,25),swing,(v-.61)/.10);if(v>.9)ankle=mix(swing,clamp(-landing-9,-20,25),(v-.9)/.1);set('foot_'+side,ankle);s.groundOffsets[side]=v<.61?Math.max(0,Math.sin(rad(rock)))*.14:0;
   arm(side,captured['upperarm_'+side],-captured['forearm_'+side],6,sign*6);
   s.joints['forearm_'+side][1]=rad(-sign*70);s.joints['hand_'+side][2]=rad(sign*2);
   s.hands[side]={curl:.26+.035*Math.sin((v+.15)*Math.PI*2),spread:.025};
  }
  set('pelvis',0,captured.pelvisYaw,captured.pelvisRoll);set('spine',1,-captured.pelvisYaw*.55,-captured.pelvisRoll*.45);
  const support=s.contacts[0];s.phase='Marcha capturada · '+(u<.12||u>.5&&u<.61?'doble apoyo':u<.5?'apoyo izquierdo':'apoyo derecho');
  s.activities=[quad(support),calves(support),activity('tibialis','Tibial anterior','tibialis anterior','Eleva el pie durante el avance',support==='L'?'R':'L'),abdom()];
 }
 if(mode==='correr'){
  const captured=capturedWalk(u,carrera);s.contacts=[];
  for(const [side,offset,sign]of [['L',0,1],['R',.5,-1]]){
   const v=(u+offset)%1;if(v<.35)s.contacts.push(side);set('thigh_'+side,captured['thigh_'+side]);set('shin_'+side,captured['shin_'+side]);set('foot_'+side,captured['foot_'+side]);arm(side,captured['upperarm_'+side],-captured['forearm_'+side],5,sign*7);s.joints['forearm_'+side][1]=rad(-sign*60);s.hands[side]={curl:.42,spread:.015};
  }
  set('pelvis',0,captured.pelvisYaw,captured.pelvisRoll);set('spine',7,-captured.pelvisYaw*.6);set('neck',-3);const support=s.contacts[0]||'L',half=u%.5;
  s.height=half>.35?.065*Math.sin(Math.PI*(half-.35)/.15)**2:0;s.phase=s.contacts.length?'Carrera capturada · apoyo e impulso':'Carrera capturada · vuelo';s.activities=[quad(support),calves(support),abdom()];
 }
 if(mode==='saltar'){
  let crouch=0,elevation=0;
  if(u<.24){crouch=smooth(u/.24);elevation=-20*crouch;s.phase='Preparación · flexión de caderas y rodillas';s.contacts=['L','R'];}
  else if(u<.4){crouch=1-smooth((u-.24)/.16);elevation=mix(-20,125,(u-.24)/.16);s.phase='Impulso · extensión de las piernas';s.contacts=['L','R'];}
  else if(u<.72){const t=(u-.4)/.32;crouch=.14*Math.sin(Math.PI*t);elevation=125-25*Math.sin(Math.PI*t);s.height=.29*4*t*(1-t);s.phase='Vuelo · coordinación de brazos y piernas';}
  else if(u<.86){crouch=Math.sin((u-.72)/.14*Math.PI/2)*.75;elevation=mix(125,15,(u-.72)/.14);s.phase='Recepción · amortiguar sin bloquear las rodillas';s.contacts=['L','R'];}
  else{crouch=.75*(1-smooth((u-.86)/.14));elevation=15*(1-smooth((u-.86)/.14));s.phase='Recuperación del equilibrio';s.contacts=['L','R'];}
  for(const [side,sign]of [['L',1],['R',-1]]){set('thigh_'+side,-48*crouch);set('shin_'+side,78*crouch);set('foot_'+side,clamp(-30*crouch,-25,25)+(u>.4&&u<.72?12*Math.sin(Math.PI*(u-.4)/.32):0));const scapular=Math.max(0,elevation-35)*.30,girdle=Math.max(0,elevation-55)*.18;set('clavicle_'+side,-scapular,0,sign*girdle);arm(side,-(elevation-scapular),10+20*crouch,0,sign*8);s.joints['upperarm_'+side][1]=rad(-sign*Math.max(0,elevation-55)*.10);s.hands[side]={curl:.19+.06*Math.sin(Math.PI*u)**2,spread:.035};}
  set('spine',15*crouch);set('neck',-7*crouch);s.activities=[quad(),calves(),activity('deltoids','Deltoides','deltoid','Acompaña la elevación de los brazos'),abdom()];
 }
 if(mode==='peso'){
  const bend=u<.38?mix(12,108,u/.38):u<.5?108:u<.9?mix(108,12,(u-.5)/.4):12;
  for(const [side,sign] of [['L',1],['R',-1]]){arm(side,-4,bend,6,sign*6);s.joints['forearm_'+side][1]=rad(-sign*mix(65,0,(bend-12)/96));s.joints['hand_'+side][2]=rad(-sign*3);s.hands[side]={curl:.98,spread:0};}
  s.contacts=['L','R'];set('spine',1);s.phase=u<.38?'Elevación · flexión del codo':u<.5?'Sostener la carga':u<.9?'Bajada controlada · extensión del codo':'Preparar otra repetición';
  s.activities=[biceps(u<.5?'Flexiona el codo y sostiene la carga':'Se alarga mientras controla la bajada'),activity('brachialis','Braquial','brachialis','Participa en la flexión del codo'),activity('handflexors','Flexores de los dedos','flexor digitorum superficialis|flexor digitorum profundus|flexor pollicis','Mantienen el agarre'),abdom()];
 }
 if(mode==='sentarse'){
  const t=u<.3?smooth(u/.3):u<.64?1:1-smooth((u-.64)/.36);s.phase=u<.3?'Descenso controlado':u<.64?'Sentado · apoyo y equilibrio':'Incorporación';
  for(const side of ['L','R']){set('thigh_'+side,-82*t);set('shin_'+side,86*t);set('foot_'+side,-4*t);arm(side,-35*t,18+35*t,-10*t);s.hands[side]={curl:.23,spread:.025};}
  set('spine',12*t*(1-t));set('neck',-5*t*(1-t));s.contacts=['L','R'];s.activities=[quad(),activity('gluteus','Glúteo mayor','gluteus maximus','Controla la cadera al sentarse y levantarse'),abdom()];
 }
 if(mode==='mala'){set('spine',22);set('neck',-12);for(const side of ['L','R'])arm(side,-12,10);for(const[side,sign]of [['L',1],['R',-1]])s.joints['forearm_'+side][1]=rad(-sign*70);s.contacts=['L','R'];s.phase='Postura encorvada mantenida';s.activities=[activity('back','Musculatura de la espalda','erector|longissimus|multifid','Ayuda a sostener el tronco'),abdom()];}
 if(mode==='buena'||mode==='quieto'){for(const [side,sign]of [['L',1],['R',-1]]){arm(side,-2,7,4,sign*2);s.joints['forearm_'+side][1]=rad(-sign*70);s.hands[side]={curl:.25,spread:.02};}s.contacts=['L','R'];s.phase='Alineación y estabilización';s.activities=[abdom(),activity('back','Musculatura de la espalda','erector|longissimus|multifid','Participa en el equilibrio del tronco')];}
 // Per-hand targets are reusable by later exercise definitions and props.
 for(const [side,sign]of [['L',1],['R',-1]]){
  const hand=s.hands[side],palm=[-sign,0,0];
  if(mode==='peso'){const bend=Math.abs(s.joints['forearm_'+side][0]),t=smooth((bend-.35)/1.0);palm[0]*=1-t;palm[1]=Math.sin(bend)*t;palm[2]=Math.cos(bend)*t;}
  if(mode==='sentarse'){const t=smooth((Math.abs(s.joints['thigh_'+side][0])-.15)/.95);palm[0]*=1-t;palm[1]=-t;}
  hand.palm=palm;hand.wristExtension=rad(mode==='peso'?6:mode==='correr'?3:mode==='saltar'?4:2);hand.grip=mode==='peso'?'power':'relaxed';
 }
 // Grip follows the phase. Thumb opposition accompanies flexion rather than bending all digits identically.
 for(const side of ['L','R'])for(let digit=0;digit<5;digit++)for(let joint=0;joint<3;joint++){
  const hand=s.hands[side],thumb=digit===0,sign=side==='L'?1:-1,curl=hand.curl*(thumb?.8:[0,.85,.95,1,1.02][digit]);
  set(`finger_${digit}_${joint}_${side}`,-curl*(thumb?32:joint===0?55:joint===1?78:50),thumb?curl*(side==='L'?-18:18):0,joint===0?sign*(digit-2)*hand.spread*30:0);
 }
 for(const [side,sign]of [['L',1],['R',-1]])set('thumb_base_'+side,-10*s.hands[side].curl,-sign*28*s.hands[side].curl,sign*18*s.hands[side].curl);
 return s;
}
