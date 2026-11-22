export const clothingCoverage={value:0};
/* Texturas de superficie procedurales: acabado visual, no histología ni fibras validadas. */
export function tissueTexture(material,system){
 const type=system==='muscular'?1:system==='piel'?2:system==='oseo'?3:['digestivo','urinario','respiratorio','endocrino','linfatico','circulatorio'].includes(system)?4:0;
 if(!type||material.userData.tissueTexture)return;
 material.userData.tissueTexture=true;material.roughness=type===2?.62:type===1?.55:type===4?.46:.76;
 material.onBeforeCompile=shader=>{
  shader.uniforms.uBodyClothed=clothingCoverage;
  shader.vertexShader='attribute vec3 tissuePosition;attribute float clothingMask;varying float vClothingMask;varying vec3 vTissuePosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTissuePosition=tissuePosition;vClothingMask=clothingMask;');
  shader.fragmentShader=`uniform float uBodyClothed;varying float vClothingMask;varying vec3 vTissuePosition;
float hashT(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noiseT(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hashT(i),hashT(i+vec3(1,0,0)),f.x),mix(hashT(i+vec3(0,1,0)),hashT(i+vec3(1,1,0)),f.x),f.y),mix(mix(hashT(i+vec3(0,0,1)),hashT(i+vec3(1,0,1)),f.x),mix(hashT(i+vec3(0,1,1)),hashT(i+vec3(1,1,1)),f.x),f.y),f.z);}
`+shader.fragmentShader;
  const color=type===1?'float grain=noiseT(vTissuePosition*650.0);float fibre=sin(vTissuePosition.x*1700.0+sin(vTissuePosition.y*80.0)*3.0);diffuseColor.rgb*=0.94+grain*0.09+fibre*0.025;':type===2?'float grain=noiseT(vTissuePosition*1400.0);float mottling=noiseT(vTissuePosition*85.0);diffuseColor.rgb*=0.965+grain*0.05;diffuseColor.rgb+=vec3(0.012,-0.003,-0.004)*(mottling-0.5);':type===4?'float grain=noiseT(vTissuePosition*400.0);diffuseColor.rgb*=0.99+grain*0.02;':'float grain=noiseT(vTissuePosition*900.0);diffuseColor.rgb*=0.96+grain*0.07;';
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+(type===2?'if(uBodyClothed>0.5&&vClothingMask>0.45)discard;\n':'')+color);
  const bump=type===1?'float bump=sin(vTissuePosition.x*1700.0+sin(vTissuePosition.y*80.0)*3.0)*0.000025;':type===2?'float bump=noiseT(vTissuePosition*1400.0)*0.00002;':type===4?'float bump=noiseT(vTissuePosition*600.0)*0.000006;':'float bump=noiseT(vTissuePosition*900.0)*0.000015;';
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
${bump}
vec3 posDx=dFdx(vViewPosition),posDy=dFdy(vViewPosition);vec3 r1=cross(posDy,normal),r2=cross(normal,posDx);float det=dot(posDx,r1);vec3 grad=sign(det)*(dFdx(bump)*r1+dFdy(bump)*r2);normal=normalize(abs(det)*normal-grad);`);
 };
 material.customProgramCacheKey=()=>`anatomical-tissue-${type}-v3`;material.needsUpdate=true;
}
