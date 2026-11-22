import assert from 'node:assert/strict';
import {motionAt,durations} from '../src/movimientos.js';
for(const mode of Object.keys(durations))for(let i=0;i<1000;i++){
 const state=motionAt(mode,durations[mode]*i/1000);assert(Number.isFinite(state.height));for(const hand of Object.values(state.hands)){assert(hand.palm.every(Number.isFinite)&&Math.hypot(...hand.palm)>.05,'Objetivo de palma válido');assert(Math.abs(hand.wristExtension)<.18,'Muñeca en rango moderado');}assert(state.phase.length);for(const [name,angles]of Object.entries(state.joints)){assert(angles.every(Number.isFinite));assert(angles.every(a=>Math.abs(a)<Math.PI),name);}
 if(['caminar','correr'].includes(mode))for(const side of ['L','R'])assert(Math.abs(state.joints['foot_'+side][0])<.55,'Tobillo local dentro de amplitud adaptada, sin giro excesivo en vuelo');
 if(mode==='caminar')assert(state.contacts.length>=1,'La marcha mantiene al menos un pie de apoyo');
}
assert(motionAt('peso',1).hands.L.curl>motionAt('saltar',1).hands.L.curl,'La mano debe cerrar el agarre con carga y abrirse al saltar');
assert(motionAt('peso',1).activities.find(a=>a.id==='biceps').role.includes('Flexiona'));
assert(motionAt('peso',2.8).activities.find(a=>a.id==='biceps').role.includes('bajada'),'La bajada incluye control excéntrico, no un bíceps simplemente inactivo');
assert(motionAt('saltar',1.5).height>0&&motionAt('saltar',1.5).contacts.length===0);
assert(motionAt('saltar',2.2).contacts.length===2);
assert(Object.keys(motionAt('peso',1).joints).filter(n=>n.startsWith('finger_')).length===30);
console.log('OK: contactos de marcha, coordinación contralateral, articulaciones finitas, agarre, control de bajada y fases de salto.');

// Captura real: evalúa la coordinación del ciclo, permitiendo el desfase natural entre extremidades.
for(const mode of ['caminar','correr'])for(const side of ['L','R']){
 const data=Array.from({length:200},(_,i)=>motionAt(mode,durations[mode]*i/200));
 const hip=data.map(s=>s.joints['thigh_'+side][0]),arm=data.map(s=>s.joints['upperarm_'+side][0]);
 const mean=a=>a.reduce((s,x)=>s+x,0)/a.length,mh=mean(hip),ma=mean(arm);
 const covariance=hip.reduce((s,x,i)=>s+(x-mh)*(arm[i]-ma),0),corr=covariance/Math.sqrt(hip.reduce((s,x)=>s+(x-mh)**2,0)*arm.reduce((s,x)=>s+(x-ma)**2,0));
 assert(corr<-.75,'Balanceo contralateral del ciclo capturado: '+corr);
}
for(const mode of ['caminar','correr','peso']){
 const a=motionAt(mode,durations[mode]-.00001),b=motionAt(mode,.00001);
 for(const key of Object.keys(a.joints))assert(a.joints[key].every((v,i)=>Math.abs(v-b.joints[key][i])<.002),'Cierre suave: '+mode+' '+key);
}

assert(motionAt('quieto',0).joints.forearm_L[1]<-1&&motionAt('quieto',0).joints.forearm_R[1]>1,'Palmas hacia los muslos en postura de descanso');
