import * as THREE from 'three';
// Diffuse the axillary skin weights along its own connected surface, with a soft
// border. Forearm/hand and breast surfaces stay outside this correction.
export function prepareShoulders(skin){
 const g=skin.geometry;if(g.userData.shoulderBlend)return;g.userData.shoulderBlend=true;
 const p=g.attributes.tissuePosition,ids=g.attributes.skinIndex,weights=g.attributes.skinWeight,indices=g.index,selected=new Map(),base=new Map();
 const read=i=>{if(!base.has(i)){const result=new Map();for(let j=0;j<4;j++){const w=weights.getComponent(i,j);if(w)result.set(ids.getComponent(i,j),w);}base.set(i,result);}return base.get(i);};
 for(let i=0;i<p.count;i++){const x=Math.abs(p.getX(i)),y=p.getY(i),z=p.getZ(i);if(x>.09&&x<.25&&y>1.17&&y<1.48&&z>-.15&&z<.14){const fade=THREE.MathUtils.smoothstep(x,.09,.12)*(1-THREE.MathUtils.smoothstep(x,.22,.25))*THREE.MathUtils.smoothstep(y,1.17,1.24)*(1-THREE.MathUtils.smoothstep(y,1.43,1.48))*(1-THREE.MathUtils.smoothstep(z,.105,.14));selected.set(i,{fade,neighbors:new Set()});read(i);}}
 for(let i=0;i<indices.count;i+=3){const tri=[indices.getX(i),indices.getX(i+1),indices.getX(i+2)];for(const a of tri)if(selected.has(a))for(const b of tri)if(a!==b){selected.get(a).neighbors.add(b);read(b);}}
 const boneIndex=Object.fromEntries(skin.skeleton.bones.map((b,i)=>[b.name.replace(/^female_/,''),i]));
 for(const [i,{fade}]of selected){const x=Math.abs(p.getX(i)),side=p.getX(i)>0?'L':'R',arm=THREE.MathUtils.smoothstep(x,.10,.235),clavicle=(1-arm)*THREE.MathUtils.smoothstep(p.getY(i),1.30,1.44)*.6,amount=fade*.95,result=new Map();for(const [b,w]of base.get(i))result.set(b,w*(1-amount));for(const [name,w]of [['upperarm_'+side,arm],['clavicle_'+side,clavicle],['spine',1-arm-clavicle]]){const b=boneIndex[name];result.set(b,(result.get(b)||0)+w*amount);}base.set(i,result);}
 let current=new Map(base);
 for(let pass=0;pass<32;pass++){const next=new Map(current);for(const [i,{fade,neighbors}]of selected){if(!neighbors.size)continue;const result=new Map(),amount=.75*fade;for(const [b,w]of current.get(i))result.set(b,w*(1-amount));for(const j of neighbors)for(const [b,w]of current.get(j))result.set(b,(result.get(b)||0)+w*amount/neighbors.size);next.set(i,result);}current=next;}
 for(const i of selected.keys()){const values=[...current.get(i)].sort((a,b)=>b[1]-a[1]).slice(0,4),total=values.reduce((sum,v)=>sum+v[1],0);for(let j=0;j<4;j++){ids.setComponent(i,j,values[j]?.[0]||0);weights.setComponent(i,j,(values[j]?.[1]||0)/total);}}
 ids.needsUpdate=true;weights.needsUpdate=true;
}
