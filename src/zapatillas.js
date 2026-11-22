import * as THREE from 'three';
export function sportsShoes(skin,skeleton){
 const reference=skin.geometry.getAttribute('tissuePosition'),names=skeleton.bones.map(b=>b.name.replace(/^female_/,'')),meshes=[];
 const upper=new THREE.MeshStandardMaterial({color:'#ece9e1',roughness:.94}),rubber=new THREE.MeshStandardMaterial({color:'#d2d3d0',roughness:.96}),trim=new THREE.MeshStandardMaterial({color:'#435a60',roughness:.90}),lace=new THREE.MeshStandardMaterial({color:'#f2efe7',roughness:1});
 for(const [side,sign]of [['L',1],['R',-1]]){
  const footIndex=names.indexOf('foot_'+side),ankle=skeleton.bones[footIndex].getWorldPosition(new THREE.Vector3()),box=new THREE.Box3();
  for(let i=0;i<reference.count;i++){if(reference.getY(i)<.125&&reference.getX(i)*sign>0&&Math.abs(reference.getX(i)-ankle.x)<.09)box.expandByPoint(new THREE.Vector3().fromBufferAttribute(reference,i));}
  const cx=(box.min.x+box.max.x)/2,cz=(box.min.z+box.max.z)/2,rz=(box.max.z-box.min.z)/2+.010,rx=Math.min(.060,(box.max.x-box.min.x)/2+.008),bottom=Math.max(-.002,box.min.y-.002),top=bottom+.020;
  const positions=[],indices=[],groups=[];let count=0;
  const circle=(y,xRadius,zRadius,zCenter)=>{const start=count;for(let i=0;i<=48;i++){const theta=i/48*Math.PI*2,s=Math.sin(theta),c=Math.cos(theta),heel=.82+.18*THREE.MathUtils.smoothstep(c,-.8,.3);positions.push(cx+xRadius*s*heel,y,zCenter+zRadius*c);count++;}return start;};
  const link=(a,b,material)=>{const start=indices.length;for(let i=0;i<48;i++)indices.push(a+i,a+i+1,b+i,b+i,a+i+1,b+i+1);groups.push([start,indices.length-start,material]);};
  let previous=circle(bottom,rx*.97,rz*.97,cz);for(const [y,scale]of [[bottom+.004,1],[top-.004,1],[top,.98]]){const current=circle(y,rx*scale,rz*scale,cz);link(previous,current,1);previous=current;}
  const fronts=[];
  for(let i=1;i<=9;i++){const t=i/9,y=THREE.MathUtils.lerp(top,Math.max(.085,ankle.y+.015),t),zCenter=THREE.MathUtils.lerp(cz,ankle.z,t),xRadius=THREE.MathUtils.lerp(rx*.98,.034,t),zRadius=THREE.MathUtils.lerp(rz*.98,.042,t),current=circle(y,xRadius,zRadius,zCenter);link(previous,current,i===9?2:0);fronts.push({z:zCenter+zRadius,y});previous=current;}
  const soleCenter=count++;positions.push(cx,bottom,cz);const soleStart=indices.length;for(let i=0;i<48;i++)indices.push(soleCenter,i+1,i);groups.push([soleStart,indices.length-soleStart,1]);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();groups.forEach(g=>geometry.addGroup(...g));
  const bind=(g,material)=>{const n=g.attributes.position.count,ids=new Uint16Array(n*4),weights=new Float32Array(n*4);for(let i=0;i<n;i++){ids[i*4]=footIndex;weights[i*4]=1;}g.setAttribute('skinIndex',new THREE.BufferAttribute(ids,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));const mesh=new THREE.SkinnedMesh(g,material);mesh.bind(skeleton,new THREE.Matrix4());mesh.frustumCulled=false;mesh.userData={sportswear:true,shoe:true,female:!!skin.userData.female,anatomical_name:'Zapatilla deportiva '+(side==='L'?'izquierda':'derecha')};meshes.push(mesh);return mesh;};
  const shoe=bind(geometry,[upper,rubber,trim]);shoe.userData.contactSole=true;shoe.userData.footSide=side;
  const height=z=>{for(let i=0;i<fronts.length-1;i++)if(z<=fronts[i].z&&z>=fronts[i+1].z)return THREE.MathUtils.lerp(fronts[i].y,fronts[i+1].y,(fronts[i].z-z)/(fronts[i].z-fronts[i+1].z));return top+.03;};
  for(let row=0;row<5;row++){const z=ankle.z+.050+row*.011,y=height(z)+.002;for(const direction of [-1,1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(cx-.022,y,z),new THREE.Vector3(cx,y+.002,z+direction*.003),new THREE.Vector3(cx+.022,y,z+direction*.008)]);bind(new THREE.TubeGeometry(curve,8,.00115,5,false),lace);}}
 }
 return meshes;
}
