"""Exporta una superficie femenina MakeHuman CC0 con rig educativo y postura relajada.
Blender --background --factory-startup --python herramientas/exportar_femenino.py
Los archivos de referencia se describen en ATRIBUCIONES.md; originales fuera del repositorio.
"""
import bpy,math,json
from mathutils import Vector,Matrix
from pathlib import Path
r=Path(__file__).resolve().parent.parent;out=r/'assets/modelo3d'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
vertices=[];body_faces=[];joints={};group=''
for line in open('/tmp/makehuman-base.obj'):
 a=line.split()
 if not a:continue
 if a[0]=='v':vertices.append(Vector(tuple(float(v) for v in a[1:4])))
 elif a[0]=='g':group=a[1]
 elif a[0]=='f':
  face=[int(v.split('/')[0])-1 for v in a[1:]]
  if group=='body':body_faces.append(face)
  elif group.startswith('joint-'):joints.setdefault(group,set()).update(face)
base=[v.copy() for v in vertices]
for file,weight in [('/tmp/female-young.target',1/3),('/tmp/female-african.target',1/3),('/tmp/female-asian.target',1/3),('/tmp/female-weight.target',1)]:
 for line in open(file):
  a=line.split()
  if len(a)==4 and not line.startswith('#'):vertices[int(a[0])]+=Vector(tuple(float(x)*weight for x in a[1:]))
used={i for f in body_faces for i in f};lo=min(vertices[i].y for i in used);hi=max(vertices[i].y for i in used);scale=1.72/(hi-lo)
def joint(name):return sum((vertices[i] for i in joints[name]),Vector())/len(joints[name])
rawj={name:joint(name) for name in joints}
def metric(v):return Vector((v.x*scale,-v.z*scale,(v.y-lo)*scale))
verts=[metric(v) for v in vertices];js={name:metric(v) for name,v in rawj.items()}
# Relax the reference A-pose, using the original joint landmarks.
for side,sign in [('l',1),('r',-1)]:
 shoulder=js[f'joint-{side}-shoulder'];elbow=js[f'joint-{side}-elbow'];hand=js[f'joint-{side}-hand'];hip=js[f'joint-{side}-upper-leg'];knee=js[f'joint-{side}-knee'];ankle=js[f'joint-{side}-ankle'];
 armangle=-sign*math.atan2(abs(elbow.x-shoulder.x),shoulder.z-elbow.z);legangle=-sign*math.atan2(abs(ankle.x-hip.x),hip.z-ankle.z)
 # Rotate about Blender Y (x/z plane); sign convention is opposite to an x/y-plane rotation.
 armrot=Matrix.Rotation(-armangle,3,'Y');legrot=Matrix.Rotation(-legangle,3,'Y')
 for i in used:
  v=verts[i]
  arm_dist=min((v-shoulder).length,(v-elbow).length,(v-hand).length)
  leg_dist=min((v-hip).length,(v-knee).length,(v-ankle).length)
  if arm_dist<leg_dist and v.x*sign>shoulder.x*sign*.85 and v.z<shoulder.z+.04 and v.z>hip.z-.3:
   t=max(0,min(1,(v.x*sign-shoulder.x*sign*.85)/.045));verts[i]=v.lerp(shoulder+armrot@(v-shoulder),t)
  elif v.x*sign>0 and v.z<hip.z+.015:
   t=max(0,min(1,(hip.z+.015-v.z)/.1));verts[i]=v.lerp(hip+legrot@(v-hip),t)
 for name,v in list(js.items()):
  if name.startswith('joint-'+side+'-'):
   if any(t in name for t in ['elbow','hand','finger']):js[name]=shoulder+armrot@(v-shoulder)
   elif any(t in name for t in ['knee','ankle','foot','toe']):js[name]=hip+legrot@(v-hip)
# Keep only the body surface, excluding MakeHuman's fitting helpers.
ids=sorted(used);remap={v:i for i,v in enumerate(ids)};mesh=bpy.data.meshes.new('MakeHuman female surface');mesh.from_pydata([verts[i] for i in ids],[],[[remap[i] for i in face] for face in body_faces]);mesh.update();obj=bpy.data.objects.new('Cuerpo femenino · MakeHuman',mesh);bpy.context.collection.objects.link(obj);obj['system']='piel';obj['anatomical_name']='Superficie femenina MakeHuman CC0';obj['source']='MakeHuman Community';
mat=bpy.data.materials.new('piel_Superficie femenina');mat.use_nodes=True;bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(.72,.46,.31,1);bsdf.inputs['Roughness'].default_value=.62;mesh.materials.append(mat)
bpy.context.view_layer.objects.active=obj;obj.select_set(True);sub=obj.modifiers.new('Continuous smooth surface','SUBSURF');sub.levels=2;sub.render_levels=2;bpy.ops.object.modifier_apply(modifier=sub.name)
for f in obj.data.polygons:f.use_smooth=True
pelvis=js['joint-pelvis'];spine=Vector((0,pelvis.y,pelvis.z+.12));neck=js['joint-neck'];head=js['joint-head'];top=js['joint-head-2'];spec=[('pelvis',pelvis,spine,None),('spine',spine,neck,'pelvis'),('neck',neck,head,'spine'),('head',head,top,'neck')]
for side in ['l','r']:
 S=side.upper();a=js[f'joint-{side}-shoulder'];b=js[f'joint-{side}-elbow'];c=js[f'joint-{side}-hand'];d=js[f'joint-{side}-hand-3'];hip=js[f'joint-{side}-upper-leg'];knee=js[f'joint-{side}-knee'];ankle=js[f'joint-{side}-ankle'];toe=js[f'joint-{side}-foot-2'];spec.extend([(f'upperarm_{S}',a,b,'spine'),(f'forearm_{S}',b,c,f'upperarm_{S}'),(f'hand_{S}',c,d,f'forearm_{S}'),(f'thigh_{S}',hip,knee,'pelvis'),(f'shin_{S}',knee,ankle,f'thigh_{S}'),(f'foot_{S}',ankle,toe,f'shin_{S}')])
arm=bpy.data.armatures.new('Female educational rig');rig=bpy.data.objects.new('FemaleRig',arm);bpy.context.collection.objects.link(rig);obj.select_set(False);rig.select_set(True);bpy.context.view_layer.objects.active=rig;bpy.ops.object.mode_set(mode='EDIT')
for name,a,b,parent in spec:
 bone=arm.edit_bones.new('female_'+name);bone.head=a;bone.tail=b
 if parent:bone.parent=arm.edit_bones['female_'+parent]
bpy.ops.object.mode_set(mode='OBJECT')
def dist(v,a,b):
 ab=b-a;t=max(0,min(1,(v-a).dot(ab)/max(1e-10,ab.length_squared)));return (v-a-ab*t).length
segments=[(name,Vector(a),Vector(b)) for name,a,b,_ in spec];groups={name:obj.vertex_groups.new(name='female_'+name) for name,_,_ in segments}
for v in obj.data.vertices:
 ds=sorted(((dist(v.co,a,b),name) for name,a,b in segments),key=lambda x:x[0])[:2];ws=[1/max(.008,d)**5 for d,_ in ds];total=sum(ws)
 for (_,name),w in zip(ds,ws):groups[name].add([v.index],w/total,'REPLACE')
mod=obj.modifiers.new('Female skin animation','ARMATURE');mod.object=rig;obj.parent=rig
# Hair and eyes are attached from the atlas at runtime, retaining their original attribution.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(out/'femenino.glb'),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_skins=True,export_texcoords=False)
(out/'femenino-manifest.json').write_text(json.dumps(dict(source='MakeHuman Community, CC0',commit=Path('/tmp/makehuman-commit.txt').read_text().strip(),vertices=len(obj.data.vertices),faces=len(obj.data.polygons),height_m=1.72,eye_centers={side:[js['joint-'+side+'-eye'].x,js['joint-'+side+'-eye'].z,-js['joint-'+side+'-eye'].y] for side in ['l','r']},scope='Superficie femenina de referencia. Sistemas internos compartidos del atlas Z-Anatomy, no específicos de sexo.'),indent=2)+'\n');print('FEMALE EXPORTED',len(obj.data.vertices),flush=True)
