import assert from 'node:assert/strict';
import {motionAt,durations} from '../src/movimientos.js';
for(const mode of Object.keys(durations))for(let i=0;i<1000;i++){
 const state=motionAt(mode,durations[mode]*i/1000);assert(Number.isFinite(state.height));assert(state.phase.length);for(const [name,angles]of Object.entries(state.joints)){assert(angles.every(Number.isFinite));assert(angles.every(a=>Math.abs(a)<Math.PI),name);}
 if(mode==='caminar')assert(state.contacts.length>=1,'La marcha mantiene al menos un pie de apoyo');
 if(mode==='caminar'||mode==='correr')for(const side of ['L','R'])assert((state.joints['thigh_'+side]?.[0]||0)*(state.joints['upperarm_'+side]?.[0]||0)<=0,'El brazo se balancea en sentido opuesto a la pierna del mismo lado');
}
assert(motionAt('peso',1).hands.L.curl>motionAt('saltar',1).hands.L.curl,'La mano debe cerrar el agarre con carga y abrirse al saltar');
assert(motionAt('peso',1).activities.find(a=>a.id==='biceps').role.includes('Flexiona'));
assert(motionAt('peso',2.8).activities.find(a=>a.id==='biceps').role.includes('bajada'),'La bajada incluye control excéntrico, no un bíceps simplemente inactivo');
assert(motionAt('saltar',1.5).height>0&&motionAt('saltar',1.5).contacts.length===0);
assert(motionAt('saltar',2.2).contacts.length===2);
assert(Object.keys(motionAt('peso',1).joints).filter(n=>n.startsWith('finger_')).length===30);
console.log('OK: contactos de marcha, coordinación contralateral, articulaciones finitas, agarre, control de bajada y fases de salto.');
